'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { monitorBillAssignment } from '@/lib/monitoring'
import { validateCreateBillInput, validateAssignBillInput } from '@/app/lib/validation'

export interface CreateBillInput {
  billReference: string
  billDate: string
  assignedToId?: string
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}

export async function validateBillReference(billReference: string): Promise<ValidationResult> {
  if (!billReference.trim()) {
    return { isValid: true }
  }

  const existingBill = await prisma.bill.findUnique({
    where: { billReference }
  })

  if (existingBill) {
    return {
      isValid: false,
      message: 'Bill reference already exists'
    }
  }

  return {
    isValid: true,
    message: 'Available'
  }
}

export async function createBill(input: CreateBillInput) {
  // Validate input with Zod
  const validation = validateCreateBillInput(input)
  if (!validation.success) {
    const errorMessages = Object.values(validation.errors || {}).flat()
    throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
  }

  const validatedInput = validation.data!

  // Additional async validation for bill reference uniqueness
  const referenceValidation = await validateBillReference(validatedInput.billReference)
  if (!referenceValidation.isValid) {
    throw new Error(referenceValidation.message || 'Invalid bill reference')
  }

  const draftStage = await prisma.billStage.findFirst({
    where: { label: 'Draft' }
  })

  if (!draftStage) {
    throw new Error('Draft stage not found')
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

  return bill
}

export interface AssignBillInput {
  billId: string
  userId: string
}

export interface AssignBillResult {
  success: boolean
  error?: string
  bill?: {
    id: string
    billReference: string
    billDate: Date
    assignedToId: string | null
    billStageId: string
    assignedTo?: {
      id: string
      name: string
      email: string
    }
    billStage?: {
      id: string
      label: string
      colour: string
    }
  }
}

export enum BillAssignmentError {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  BILL_NOT_FOUND = 'BILL_NOT_FOUND',
  BILL_ALREADY_ASSIGNED = 'BILL_ALREADY_ASSIGNED',
  USER_BILL_LIMIT_EXCEEDED = 'USER_BILL_LIMIT_EXCEEDED',
  INVALID_BILL_STAGE = 'INVALID_BILL_STAGE',
  CONCURRENT_UPDATE = 'CONCURRENT_UPDATE',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface DetailedError {
  code: BillAssignmentError
  message: string
  details?: Record<string, unknown>
}

// Helper function - not a server action
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createDetailedError(
  code: BillAssignmentError, 
  message: string, 
  details?: Record<string, unknown>
): DetailedError {
  return { code, message, details }
}

const MAX_RETRIES = 3

/**
 * Optimized bill assignment with single query and better error handling
 */
export const assignBillAction = monitorBillAssignment(async (input: AssignBillInput): Promise<AssignBillResult> => {
  const startTime = Date.now()
  
  // Validate input with Zod
  const validation = validateAssignBillInput(input)
  if (!validation.success) {
    const errorMessages = Object.values(validation.errors || {}).flat()
    return { 
      success: false, 
      error: `Validation failed: ${errorMessages.join(', ')}` 
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
      error: capacityCheck.reason || 'User cannot be assigned more bills'
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
          throw new Error('User not found')
        }

        if (userWithCount._count.bills >= 3) {
          throw new Error('User already has the maximum of 3 bills assigned')
        }

        // Get bill with stage information
        const bill = await tx.bill.findUnique({
          where: { id: billId },
          include: { billStage: true }
        })

        if (!bill) {
          throw new Error('Bill not found')
        }

        if (bill.assignedToId !== null) {
          throw new Error('Bill is already assigned')
        }

        if (!['Draft', 'Submitted'].includes(bill.billStage.label)) {
          throw new Error('Bill must be in Draft or Submitted stage to be assigned')
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Log error with context
      console.error({
        operation: 'assignBill',
        duration: Date.now() - startTime,
        error: errorMessage,
        userId,
        billId,
        attempt: attempt + 1
      })

      // Handle specific error cases
      if (errorMessage.includes('User not found')) {
        return { success: false, error: 'User not found' }
      }
      if (errorMessage.includes('Bill not found')) {
        return { success: false, error: 'Bill not found' }
      }
      if (errorMessage.includes('already assigned')) {
        return { success: false, error: 'Bill is already assigned' }
      }
      if (errorMessage.includes('maximum of 3 bills')) {
        return { success: false, error: 'User already has the maximum of 3 bills assigned' }
      }
      if (errorMessage.includes('Draft or Submitted stage')) {
        return { success: false, error: 'Bill must be in Draft or Submitted stage to be assigned' }
      }

      // If this is the last attempt, return the error
      if (attempt === MAX_RETRIES - 1) {
        return { success: false, error: errorMessage }
      }
    }
  }

  return { success: false, error: 'Failed to assign bill due to concurrent updates. Please try again.' }
})
