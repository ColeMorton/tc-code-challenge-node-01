'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { monitorBillAssignment } from '@/lib/monitoring'
import { validateCreateBillInput, validateAssignBillInput } from '@/app/lib/validation'
import {
  CreateBillInput,
  SimpleValidationResult,
  AssignBillInput,
  AssignBillResult,
  BillAssignmentError
} from '@/app/lib/definitions'
import { ERROR_DEFINITIONS } from '@/app/lib/error-constants'
import { createError, handleError } from '@/app/lib/errors'

async function validateUserCapacity(userId: string): Promise<void> {
  const userBillCount = await prisma.bill.count({
    where: { assignedToId: userId }
  })

  if (userBillCount >= 3) {
    throw createError(BillAssignmentError.USER_BILL_LIMIT_EXCEEDED)
  }
}

export async function validateBillReference(billReference: string): Promise<SimpleValidationResult> {
  if (!billReference.trim()) {
    return { isValid: true }
  }

  const existingBill = await prisma.bill.findUnique({
    where: { billReference }
  })

  if (existingBill) {
    return {
      isValid: false,
      message: ERROR_DEFINITIONS.BILL_REFERENCE_EXISTS.message
    }
  }

  return {
    isValid: true,
    message: 'Available'
  }
}

export async function createBill(input: CreateBillInput) {
  // Validate input with Zod (sanitization handled by schema preprocessors)
  const validation = validateCreateBillInput(input)
  if (!validation.success) {
    const errorMessages = Object.values(validation.errors || {}).flat()
    throw createError(BillAssignmentError.VALIDATION_ERROR, `${ERROR_DEFINITIONS.VALIDATION_FAILED.message}: ${errorMessages.join(', ')}`)
  }

  const validatedInput = validation.data!

  // Additional async validation for bill reference uniqueness
  const referenceValidation = await validateBillReference(validatedInput.billReference)
  if (!referenceValidation.isValid) {
    throw createError(BillAssignmentError.VALIDATION_ERROR, referenceValidation.message)
  }

  // CRITICAL: Validate user capacity if assigning to a user
  if (validatedInput.assignedToId) {
    await validateUserCapacity(validatedInput.assignedToId)
  }

  const draftStage = await prisma.billStage.findFirst({
    where: { label: 'Draft' }
  })

  if (!draftStage) {
    throw createError(BillAssignmentError.DRAFT_STAGE_NOT_FOUND)
  }

  const bill = await prisma.bill.create({
    data: {
      billReference: validatedInput.billReference,
      billDate: new Date(validatedInput.billDate),
      assignedToId: validatedInput.assignedToId || null,
      billStageId: draftStage.id
    }
  })

  revalidatePath('/bills')
  revalidatePath('/users')

  return bill
}

const MAX_RETRIES = 3

/**
 * Optimized bill assignment with single query and better error handling
 */
export const assignBillAction = monitorBillAssignment(async (input: AssignBillInput): Promise<AssignBillResult> => {
  const startTime = Date.now()

  // Validate input with Zod (sanitization handled by schema preprocessors)
  const validation = validateAssignBillInput(input)
  if (!validation.success) {
    const errorMessages = Object.values(validation.errors || {}).flat()
    return {
      success: false,
      error: `${ERROR_DEFINITIONS.VALIDATION_FAILED.message}: ${errorMessages.join(', ')}`
    }
  }

  const validatedInput = validation.data!

  const { userId, billId } = validatedInput

  // Check cache first for quick validation
  const { canUserBeAssignedBillCached, invalidateUserCache } = await import('@/lib/cache')
  const capacityCheck = await canUserBeAssignedBillCached(userId)
  
  if (!capacityCheck.canAssign) {
    return {
      success: false,
      error: capacityCheck.reason || ERROR_DEFINITIONS.USER_BILL_LIMIT_EXCEEDED.message
    }
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Single query to get user with current bill count - eliminates double COUNT
        const userWithCount = await tx.user.findUnique({
          where: { id: userId },
          include: {
            _count: {
              select: { bills: { where: { assignedToId: userId } } }
            }
          }
        })

        if (!userWithCount) {
          throw createError(BillAssignmentError.USER_NOT_FOUND)
        }

        // CRITICAL: Enforce 3-bill limit within transaction to prevent race conditions
        // Note: This check is within the transaction, unlike validateUserCapacity() which is used
        // in createBill(). Both enforce the same business rule but at different layers.
        if (userWithCount._count.bills >= 3) {
          throw createError(BillAssignmentError.USER_BILL_LIMIT_EXCEEDED)
        }

        // Get bill with stage information
        const bill = await tx.bill.findUnique({
          where: { id: billId },
          include: { billStage: true }
        })

        if (!bill) {
          throw createError(BillAssignmentError.BILL_NOT_FOUND)
        }

        if (bill.assignedToId !== null) {
          throw createError(BillAssignmentError.BILL_ALREADY_ASSIGNED)
        }

        if (!['Draft', 'Submitted'].includes(bill.billStage.label)) {
          throw createError(BillAssignmentError.INVALID_BILL_STAGE)
        }

        // Prepare update data
        const updateData: { assignedToId: string; submittedAt?: Date } = {
          assignedToId: userId
        }

        // Set submittedAt if transitioning from Draft to Submitted
        if (bill.billStage.label === 'Draft') {
          const submittedStage = await tx.billStage.findFirst({
            where: { label: 'Submitted' }
          })
          
          if (submittedStage) {
          updateData.submittedAt = new Date()
            await tx.bill.update({
              where: { id: bill.id },
              data: {
                assignedToId: userId,
                submittedAt: new Date(),
                billStageId: submittedStage.id
              },
              include: {
                assignedTo: true,
                billStage: true
              }
            })
          } else {
            await tx.bill.update({
              where: { id: bill.id },
              data: updateData,
              include: {
                assignedTo: true,
                billStage: true
              }
            })
          }
        } else {
          await tx.bill.update({
            where: { id: bill.id },
            data: updateData,
            include: {
              assignedTo: true,
              billStage: true
            }
          })
        }

        // Return the updated bill for response
        return await tx.bill.findUnique({
          where: { id: bill.id },
          include: {
            assignedTo: true,
            billStage: true
          }
        })
      })

      // Invalidate cache after successful assignment
      invalidateUserCache(userId)

      // Log performance metrics
      console.log({
        operation: 'assignBill',
        duration: Date.now() - startTime,
        success: true,
        userId,
        billId,
        attempt: attempt + 1,
        cacheHit: capacityCheck.currentCount > 0
      })

      revalidatePath('/bills')
      revalidatePath('/users')

      return { 
        success: true, 
        bill: result ? {
          id: result.id,
          billReference: result.billReference,
          billDate: result.billDate,
          assignedToId: result.assignedToId,
          billStageId: result.billStageId,
          assignedTo: result.assignedTo || undefined,
          billStage: result.billStage
        } : undefined
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_DEFINITIONS.UNKNOWN_ERROR.message
      
      // Log error with context
      console.error({
        operation: 'assignBill',
        duration: Date.now() - startTime,
        error: errorMessage,
        userId,
        billId,
        attempt: attempt + 1
      })

      // Handle error cases with simple error handling
      const errorResponse = handleError(error)
      
      // If this is the last attempt, return the structured error
      if (attempt === MAX_RETRIES - 1) {
        return errorResponse
      }
    }
  }

  return { success: false, error: ERROR_DEFINITIONS.CONCURRENT_UPDATE.message }
})
