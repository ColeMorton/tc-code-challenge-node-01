'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'

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

  const draftStage = await prisma.billStage.findFirst({
    where: { label: 'Draft' }
  })

  if (!draftStage) {
    throw new Error('Draft stage not found')
  }

  const bill = await prisma.bill.create({
    data: {
      billReference: input.billReference,
      billDate: new Date(input.billDate),
      assignedToId: input.assignedToId || null,
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
}

const MAX_RETRIES = 3

export async function assignBillAction(input: AssignBillInput): Promise<AssignBillResult> {
  const { userId, billId } = input

  if (!userId) {
    return { success: false, error: 'userId is required' }
  }

  if (!billId) {
    return { success: false, error: 'billId is required' }
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId }
        })

        if (!user) {
          throw new Error('User not found')
        }

        const currentBillCount = await tx.bill.count({
          where: { assignedToId: userId }
        })

        if (currentBillCount >= 3) {
          throw new Error('User already has the maximum of 3 bills assigned')
        }

        const bill = await tx.bill.findUnique({
          where: { id: billId },
          include: {
            billStage: true
          }
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

        const updateData: { assignedToId: string; submittedAt?: Date } = {
          assignedToId: userId
        }

        if (bill.billStage.label === 'Submitted' && !bill.submittedAt) {
          updateData.submittedAt = new Date()
        }

        await tx.bill.update({
          where: { id: bill.id },
          data: updateData
        })

        const finalBillCount = await tx.bill.count({
          where: { assignedToId: userId }
        })

        if (finalBillCount > 3) {
          throw new Error('RETRY_RACE_CONDITION')
        }
      })

      revalidatePath('/bills')
      return { success: true }

    } catch (error) {
      if (error instanceof Error && error.message === 'RETRY_RACE_CONDITION') {
        continue
      }

      if (error instanceof Error) {
        return { success: false, error: error.message }
      }

      return { success: false, error: 'Failed to assign bill' }
    }
  }

  return { success: false, error: 'Failed to assign bill due to concurrent updates. Please try again.' }
}
