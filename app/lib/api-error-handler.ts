/**
 * Simple API Error Handler
 */

import { NextResponse } from 'next/server'
import { AppError } from './errors'
import type { ErrorCode } from './error-constants'

export interface ApiErrorResponse {
  error: string
  code?: ErrorCode
  status: number
}

/**
 * Handle API errors with minimal code
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        status: error.httpStatus
      },
      { status: error.httpStatus }
    )
  }
  
  // Handle other errors
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR' as ErrorCode,
      status: 500
    },
    { status: 500 }
  )
}

/**
 * Wrapper for API route error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>
) {
  return async (): Promise<NextResponse<T> | NextResponse<ApiErrorResponse>> => {
    try {
      const result = await handler()
      return NextResponse.json(result)
    } catch (error) {
      console.error('API Error:', error)
      return handleApiError(error)
    }
  }
}