import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { billReference, billDate, assignedToId } = body

    // Validate required fields (assignedToId is now optional)
    if (!billReference || !billDate) {
      return NextResponse.json(
        { error: 'Missing required fields: billReference, billDate' },
        { status: 400 }
      )
    }

    // Check if bill reference already exists
    const existingBill = await prisma.bill.findUnique({
      where: { billReference }
    })

    if (existingBill) {
      return NextResponse.json(
        { error: 'Bill reference already exists' },
        { status: 409 }
      )
    }

    // Get the Draft stage ID
    const draftStage = await prisma.billStage.findFirst({
      where: { label: 'Draft' }
    })

    if (!draftStage) {
      return NextResponse.json(
        { error: 'Draft stage not found' },
        { status: 500 }
      )
    }

    // Create the bill
    const bill = await prisma.bill.create({
      data: {
        billReference,
        billDate: new Date(billDate),
        billStageId: draftStage.id,
        assignedToId: assignedToId || null
      },
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

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error('Failed to create bill:', error)
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    )
  }
}