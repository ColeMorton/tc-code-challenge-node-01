import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, validateRequestBody, ConflictError, NotFoundError } from '@/lib/api-utils'
import { CreateBillRequestSchema } from '@/lib/validations'

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
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { billReference, billDate, assignedToId } = await validateRequestBody(
      request,
      CreateBillRequestSchema
    )

    // Check if bill reference already exists
    const existingBill = await prisma.bill.findUnique({
      where: { billReference }
    })

    if (existingBill) {
      throw new ConflictError('Bill reference already exists')
    }

    // Get the Draft stage ID
    const draftStage = await prisma.billStage.findFirst({
      where: { label: 'Draft' }
    })

    if (!draftStage) {
      throw new NotFoundError('Draft stage not found')
    }

    // Create the bill
    const bill = await prisma.bill.create({
      data: {
        billReference,
        billDate,
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
    return handleApiError(error)
  }
}