import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Bill, BillStage } from '@prisma/client'
import { handleApiError, validateRequestBody, NotFoundError, ConflictError, ValidationError } from '@/lib/api-utils'
import { AssignBillRequestSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const { userId, billId } = await validateRequestBody(
      request,
      AssignBillRequestSchema
    )

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Count current bills assigned to this user
    const currentBillCount = await prisma.bill.count({
      where: { assignedToId: userId }
    })

    if (currentBillCount >= 3) {
      throw new ConflictError('User already has the maximum of 3 bills assigned')
    }

    // Get assignable stages (Draft and Submitted)
    const assignableStages = await prisma.billStage.findMany({
      where: {
        label: {
          in: ['Draft', 'Submitted']
        }
      }
    })

    if (assignableStages.length === 0) {
      throw new NotFoundError('No assignable stages found')
    }

    const assignableStageIds = assignableStages.map(stage => stage.id)

    let bill: (Bill & { billStage: BillStage }) | null = null
    if (billId) {
      // Assign specific bill if provided
      bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: {
          billStage: true
        }
      })

      if (!bill) {
        throw new NotFoundError('Bill not found')
      }

      if (!['Draft', 'Submitted'].includes(bill.billStage.label)) {
        throw new ValidationError('Bill must be in Draft or Submitted stage to be assigned')
      }
    } else {
      // Find an unassigned bill in Draft or Submitted stage
      const unassignedBills = await prisma.bill.findMany({
        where: {
          billStageId: { in: assignableStageIds },
          assignedToId: undefined
        },
        include: {
          billStage: true
        },
        take: 1,
        orderBy: [
          { submittedAt: 'asc' }, // Prioritize submitted bills first
          { createdAt: 'asc' }    // Then by creation date for drafts
        ]
      })

      if (unassignedBills.length === 0) {
        throw new NotFoundError('No unassigned bills in Draft or Submitted stage found')
      }

      bill = unassignedBills[0]
    }

    // Update the bill assignment with stage-specific logic
    const updateData: { assignedToId: string; submittedAt?: Date } = {
      assignedToId: userId
    }

    // Set submittedAt if the bill is in Submitted stage and doesn't have it yet
    if (bill && bill.billStage && bill.billStage.label === 'Submitted' && !bill.submittedAt) {
      updateData.submittedAt = new Date()
    }

    const updatedBill = await prisma.bill.update({
      where: { id: bill!.id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        billStage: {
          select: {
            id: true,
            label: true,
            colour: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Bill assigned successfully',
      bill: updatedBill
    })
  } catch (error) {
    return handleApiError(error)
  }
}