import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, validateQueryParams } from '@/lib/api-utils'
import { ValidateBillReferenceQuerySchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { billReference } = validateQueryParams(
      searchParams,
      ValidateBillReferenceQuerySchema
    )

    // Check if bill reference exists
    const existingBill = await prisma.bill.findUnique({
      where: { billReference }
    })

    return NextResponse.json({
      exists: !!existingBill,
      isValid: !existingBill
    })
  } catch (error) {
    return handleApiError(error)
  }
}