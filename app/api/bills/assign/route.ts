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

    // Use transaction to prevent race conditions when checking and updating bill assignments
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

      // Get assignable stages (Draft and Submitted)
      const assignableStages = await tx.billStage.findMany({
        where: {
          label: {
            in: ['Draft', 'Submitted']
          }
        }
      })

      if (assignableStages.length === 0) {
        throw new Error('No assignable stages found')
      }

      const assignableStageIds = assignableStages.map(stage => stage.id)

      let bill: (Bill & { billStage: BillStage }) | null = null
      if (billId) {
        // Assign specific bill if provided
        bill = await tx.bill.findUnique({
          where: { id: billId },
          include: {
            billStage: true
          }
        })

        if (!bill) {
          throw new Error('Bill not found')
        }

        if (!['Draft', 'Submitted'].includes(bill.billStage.label)) {
          throw new Error('Bill must be in Draft or Submitted stage to be assigned')
        }
      } else {
        // Find and lock an unassigned bill using updateMany with conditional WHERE
        // This prevents race conditions by atomically checking and updating in one operation
        const candidateBills = await tx.bill.findMany({
          where: {
            billStageId: { in: assignableStageIds },
            assignedToId: null
          },
          include: {
            billStage: true
          },
          take: 5, // Get multiple candidates in case of concurrent updates
          orderBy: [
            { submittedAt: 'asc' },
            { createdAt: 'asc' }
          ]
        })

        if (candidateBills.length === 0) {
          throw new Error('No unassigned bills in Draft or Submitted stage found')
        }

        // Try to claim the first candidate by updating only if still unassigned
        let claimedBill = null
        for (const candidate of candidateBills) {
          const updateData: { assignedToId: string; submittedAt?: Date } = {
            assignedToId: userId
          }

          if (candidate.billStage.label === 'Submitted' && !candidate.submittedAt) {
            updateData.submittedAt = new Date()
          }

          // Atomic update: only succeeds if bill is still unassigned
          const result = await tx.bill.updateMany({
            where: {
              id: candidate.id,
              assignedToId: null // Critical: only update if still null
            },
            data: updateData
          })

          if (result.count > 0) {
            // Successfully claimed this bill
            claimedBill = await tx.bill.findUnique({
              where: { id: candidate.id },
              include: {
                billStage: true,
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            })
            break
          }
        }

        if (!claimedBill) {
          throw new Error('No unassigned bills in Draft or Submitted stage found')
        }

        return claimedBill
      }

      // Update the bill assignment with stage-specific logic
      const updateData: { assignedToId: string; submittedAt?: Date } = {
        assignedToId: userId
      }

      // Set submittedAt if the bill is in Submitted stage and doesn't have it yet
      if (bill && bill.billStage && bill.billStage.label === 'Submitted' && !bill.submittedAt) {
        updateData.submittedAt = new Date()
      }

      return await tx.bill.update({
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
    })

    return NextResponse.json({
      message: 'Bill assigned successfully',
      bill: updatedBill
    })
  } catch (error) {
    console.error('Failed to assign bill:', error)

    // Handle specific error cases
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
      if (error.message === 'Bill not found' || error.message === 'No unassigned bills in Draft or Submitted stage found') {
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
      if (error.message === 'No assignable stages found') {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to assign bill' },
      { status: 500 }
    )
  }
}
