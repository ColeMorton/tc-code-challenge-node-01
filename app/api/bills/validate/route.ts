import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const billReference = searchParams.get('billReference')

    if (!billReference) {
      return NextResponse.json(
        { error: 'billReference parameter is required' },
        { status: 400 }
      )
    }

    // Check if bill reference exists
    const existingBill = await prisma.bill.findUnique({
      where: { billReference }
    })

    return NextResponse.json({
      exists: !!existingBill,
      isValid: !existingBill
    })
  } catch (error) {
    console.error('Failed to validate bill reference:', error)
    return NextResponse.json(
      { error: 'Failed to validate bill reference' },
      { status: 500 }
    )
  }
}