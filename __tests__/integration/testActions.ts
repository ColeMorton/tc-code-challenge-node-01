/**
 * Test-specific versions of bill actions that use the test database
 * This allows integration tests to use the same business logic with test data
 */

import { testPrisma } from './testUtils'

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

export interface AssignBillInput {
  billId: string
  userId: string
}

export interface AssignBillResult {
  success: boolean
  message?: string
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

export async function assignBillAction(input: AssignBillInput): Promise<AssignBillResult> {
  try {
    // Get the bill and user
    const bill = await testPrisma.bill.findUnique({
      where: { id: input.billId },
      include: { billStage: true }
    })

    if (!bill) {
      return {
        success: false,
        message: 'Bill not found'
      }
    }

    const user = await testPrisma.user.findUnique({
      where: { id: input.userId }
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    // Check if user already has 3 bills assigned
    const userBillCount = await testPrisma.bill.count({
      where: {
        assignedToId: input.userId,
        billStage: {
          label: {
            in: ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold']
          }
        }
      }
    })

    if (userBillCount >= 3) {
      return {
        success: false,
        message: 'User has reached the maximum limit of 3 assigned bills'
      }
    }

    // Check if bill can be assigned (only Draft and Submitted stages)
    if (!['Draft', 'Submitted'].includes(bill.billStage.label)) {
      return {
        success: false,
        message: `Bills in ${bill.billStage.label} stage cannot be assigned`
      }
    }

    // Assign the bill
    const updatedBill = await testPrisma.bill.update({
      where: { id: input.billId },
      data: { assignedToId: input.userId },
      include: {
        assignedTo: true,
        billStage: true
      }
    })

    return {
      success: true,
      message: 'Bill assigned successfully',
      bill: {
        id: updatedBill.id,
        billReference: updatedBill.billReference,
        billDate: updatedBill.billDate,
        assignedToId: updatedBill.assignedToId,
        billStageId: updatedBill.billStageId,
        assignedTo: updatedBill.assignedTo || undefined,
        billStage: updatedBill.billStage
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
