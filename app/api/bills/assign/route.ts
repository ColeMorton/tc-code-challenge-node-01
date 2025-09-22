import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Bill, BillStage } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, billId } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Count current bills assigned to this user
    const currentBillCount = await prisma.bill.count({
      where: { assignedToId: userId }
    })

    if (currentBillCount >= 3) {
      return NextResponse.json(
        { error: 'User already has the maximum of 3 bills assigned' },
        { status: 409 }
      )
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
      return NextResponse.json(
        { error: 'No assignable stages found' },
        { status: 500 }
      )
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
        return NextResponse.json(
          { error: 'Bill not found' },
          { status: 404 }
        )
      }

      if (!['Draft', 'Submitted'].includes(bill.billStage.label)) {
        return NextResponse.json(
          { error: 'Bill must be in Draft or Submitted stage to be assigned' },
          { status: 400 }
        )
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
        return NextResponse.json(
          { error: 'No unassigned bills in Draft or Submitted stage found' },
          { status: 404 }
        )
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
    console.error('Failed to assign bill:', error)
    return NextResponse.json(
      { error: 'Failed to assign bill' },
      { status: 500 }
    )
  }
}