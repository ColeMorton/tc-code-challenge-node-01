/**
 * Test-specific versions of bill actions that use the test database
 * This allows integration tests to use the same business logic with test data
 */

import { testPrisma } from './testUtils'
import { 
  CreateBillInput, 
  ValidationResult, 
  AssignBillInput, 
  AssignBillResult 
} from '@/app/lib/definitions'

export async function validateBillReference(billReference: string): Promise<ValidationResult> {
  if (!billReference.trim()) {
    return { isValid: true }
  }

  const existingBill = await testPrisma.bill.findUnique({
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
  if (!input.billReference.trim()) {
    throw new Error('Bill reference is required')
  }

  if (!input.billDate) {
    throw new Error('Bill date is required')
  }

  const validation = await validateBillReference(input.billReference)
  if (!validation.isValid) {
    throw new Error(validation.message || 'Invalid bill reference')
  }

  const draftStage = await testPrisma.billStage.findFirst({
    where: { label: 'Draft' }
  })

  if (!draftStage) {
    throw new Error('Draft stage not found')
  }

  const bill = await testPrisma.bill.create({
    data: {
      billReference: input.billReference,
      billDate: new Date(input.billDate),
      assignedToId: input.assignedToId || null,
      billStageId: draftStage.id
    }
  })

  return bill
}


export async function assignBillAction(input: AssignBillInput): Promise<AssignBillResult> {
  try {
    const result = await testPrisma.$transaction(async (tx) => {
      // Single query to get user with current bill count - eliminates double COUNT
      const userWithCount = await tx.user.findUnique({
        where: { id: input.userId },
        include: {
          _count: {
            select: { bills: { where: { assignedToId: input.userId } } }
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
      where: { id: input.billId },
      include: { billStage: true }
    })

    if (!bill) {
        throw new Error('Bill not found')
      }

      if (bill.assignedToId !== null) {
        throw new Error('Bill is already assigned')
      }

      if (!['Draft', 'Submitted'].includes(bill.billStage.label)) {
        throw new Error(`Bills in ${bill.billStage.label} stage cannot be assigned`)
      }

      // Prepare update data
      const updateData: { assignedToId: string; submittedAt?: Date; billStageId?: string } = {
        assignedToId: input.userId
      }

      // Set submittedAt if transitioning from Draft to Submitted
      if (bill.billStage.label === 'Draft') {
        const submittedStage = await tx.billStage.findFirst({
          where: { label: 'Submitted' }
        })
        
        if (submittedStage) {
          updateData.submittedAt = new Date()
          updateData.billStageId = submittedStage.id
        }
      }

      // Update the bill
      const updatedBill = await tx.bill.update({
      where: { id: input.billId },
        data: updateData,
      include: {
        assignedTo: true,
        billStage: true
      }
      })

      return updatedBill
    })

    return {
      success: true,
      message: 'Bill assigned successfully',
      bill: {
        id: result.id,
        billReference: result.billReference,
        billDate: result.billDate,
        assignedToId: result.assignedToId,
        billStageId: result.billStageId,
        assignedTo: result.assignedTo || undefined,
        billStage: result.billStage
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Handle specific error cases with consistent messaging
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
      return { success: false, error: 'User has reached the maximum limit of 3 assigned bills' }
    }
    if (errorMessage.includes('cannot be assigned')) {
      return { success: false, error: errorMessage }
    }

    return { success: false, error: errorMessage }
  }
}
