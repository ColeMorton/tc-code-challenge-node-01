'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

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
