import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ERROR_DEFINITIONS } from '@/app/lib/error-constants'

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Failed to fetch bills:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_DEFINITIONS.FAILED_TO_FETCH_BILLS.message },
      { status: ERROR_DEFINITIONS.FAILED_TO_FETCH_BILLS.httpStatus }
    )
  }
}