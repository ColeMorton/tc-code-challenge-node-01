import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

const MAX_RETRIES = 3

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

    if (!billId) {
      return NextResponse.json(
        { error: 'billId is required' },
        { status: 400 }
      )
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const updatedBill = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Count current bills assigned to this user
      const currentBillCount = await tx.bill.count({
        where: { assignedToId: userId }
      })

      if (currentBillCount >= 3) {
        throw new Error('User already has the maximum of 3 bills assigned')
      }

      // Find the specific bill
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

      // Update the bill assignment
      const updateData: { assignedToId: string; submittedAt?: Date } = {
        assignedToId: userId
      }

      if (bill.billStage.label === 'Submitted' && !bill.submittedAt) {
        updateData.submittedAt = new Date()
      }

      const updated = await tx.bill.update({
        where: { id: bill.id },
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

      // OPTIMISTIC LOCK: Verify the constraint after update
      const finalBillCount = await tx.bill.count({
        where: { assignedToId: userId }
      })

      if (finalBillCount > 3) {
        throw new Error('RETRY_RACE_CONDITION')
      }

      return updated
        })

        return NextResponse.json({
          message: 'Bill assigned successfully',
          bill: updatedBill
        })

      } catch (error) {
        if (error instanceof Error && error.message === 'RETRY_RACE_CONDITION') {
          continue
        }

        throw error
      }
    }

    throw new Error('Failed to assign bill due to concurrent updates. Please try again.')

  } catch (error) {
    console.error('Failed to assign bill:', error)

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message === 'User already has the maximum of 3 bills assigned') {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
      if (error.message === 'Bill not found' || error.message === 'Bill is already assigned') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message === 'Bill must be in Draft or Submitted stage to be assigned') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('concurrent updates')) {
        return NextResponse.json(
          { error: error.message },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to assign bill' },
      { status: 500 }
    )
  }
}
