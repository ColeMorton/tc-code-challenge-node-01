/**
 * Standardized API error handling
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from 'next/server'
import { getErrorDefinition, getHttpStatus } from './error-constants'

export interface ApiErrorResponse {
  error: string
  code?: string
  status: number
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  errorCode: string,
  customMessage?: string
): NextResponse<ApiErrorResponse> {
  const definition = getErrorDefinition(errorCode)
  const status = getHttpStatus(errorCode)
  const message = customMessage || definition?.message || 'An unexpected error occurred'
  
  return NextResponse.json(
    {
      error: message,
      code: errorCode,
      status
    },
    { status }
  )
}

/**
 * Handle common error patterns and return appropriate responses
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof Error) {
    const message = error.message
    
    // Map common error messages to error codes
    if (message.includes('User not found')) {
      return createErrorResponse('USER_NOT_FOUND')
    }
    if (message.includes('Bill not found')) {
      return createErrorResponse('BILL_NOT_FOUND')
    }
    if (message.includes('already assigned')) {
      return createErrorResponse('BILL_ALREADY_ASSIGNED')
    }
    if (message.includes('maximum of 3 bills')) {
      return createErrorResponse('USER_BILL_LIMIT_EXCEEDED')
    }
    if (message.includes('Draft or Submitted stage')) {
      return createErrorResponse('INVALID_BILL_STAGE')
    }
    if (message.includes('concurrent updates')) {
      return createErrorResponse('CONCURRENT_UPDATE')
    }
    if (message.includes('Database') || message.includes('Prisma')) {
      return createErrorResponse('DATABASE_ERROR')
    }
  }
  
  // Default to unknown error
  return createErrorResponse('UNKNOWN_ERROR')
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
