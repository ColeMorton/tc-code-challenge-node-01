import { NextResponse } from 'next/server'
import { assignBillAction } from '@/app/bills/actions'
import { ERROR_DEFINITIONS, getHttpStatus } from '@/app/lib/error'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, billId } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: ERROR_DEFINITIONS.USER_ID_REQUIRED.message },
        { status: ERROR_DEFINITIONS.USER_ID_REQUIRED.httpStatus }
      )
    }

    if (!billId) {
      return NextResponse.json(
        { error: ERROR_DEFINITIONS.BILL_ID_REQUIRED.message },
        { status: ERROR_DEFINITIONS.BILL_ID_REQUIRED.httpStatus }
      )
    }

    // Delegate to server action - eliminates duplication
    const result = await assignBillAction({ userId, billId })

    if (!result.success) {
      // Use centralized HTTP status mapping
      const status = result.errorCode ? getHttpStatus(result.errorCode) : 500

      return NextResponse.json(
        { error: result.error },
        { status }
      )
    }

    return NextResponse.json({
      message: 'Bill assigned successfully',
      bill: result.bill
    })

  } catch (error) {
    console.error('Failed to assign bill:', error)
    return NextResponse.json(
      { error: ERROR_DEFINITIONS.FAILED_TO_ASSIGN_BILL.message },
      { status: ERROR_DEFINITIONS.FAILED_TO_ASSIGN_BILL.httpStatus }
    )
  }
}
