import { NextResponse } from 'next/server'
import { assignBillAction } from '@/app/bills/actions'
import { BillAssignmentError } from '@/app/lib/definitions'

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

    // Delegate to server action - eliminates duplication
    const result = await assignBillAction({ userId, billId })

    if (!result.success) {
      // Map server action error codes to HTTP status codes
      let status = 400
      if (result.errorCode === BillAssignmentError.USER_NOT_FOUND || 
          result.errorCode === BillAssignmentError.BILL_NOT_FOUND ||
          result.errorCode === BillAssignmentError.BILL_ALREADY_ASSIGNED) {
        status = 404
      } else if (result.errorCode === BillAssignmentError.USER_BILL_LIMIT_EXCEEDED) {
        status = 409
      } else if (result.errorCode === BillAssignmentError.INVALID_BILL_STAGE) {
        status = 400
      } else if (result.errorCode === BillAssignmentError.CONCURRENT_UPDATE) {
        status = 503
      }

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
      { error: 'Failed to assign bill' },
      { status: 500 }
    )
  }
}
