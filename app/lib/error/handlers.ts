/**
 * Simple and Elegant Error Handling
 * 
 * Uses a single base class with a factory function to create all error types.
 * Eliminates the need for multiple error classes while maintaining type safety.
 */

import { ERROR_DEFINITIONS, BillAssignmentError, ErrorCode } from './constants'

/**
 * Single error class that handles all error types
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly httpStatus: number
  
  constructor(
    code: ErrorCode,
    httpStatus: number,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = this.constructor.name
    this.code = code
    this.httpStatus = httpStatus
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * Create error response for any context
   */
  toResponse() {
    return {
      error: this.message,
      errorCode: this.code,
      httpStatus: this.httpStatus
    }
  }
}

/**
 * Simple factory function to create errors
 */
export function createError(
  errorCode: ErrorCode,
  customMessage?: string
): AppError {
  // Use error code directly as definition key (they match in most cases)
  const definitionKey = errorCode === BillAssignmentError.VALIDATION_ERROR ? 'VALIDATION_FAILED' : errorCode
  const definition = ERROR_DEFINITIONS[definitionKey]
  return new AppError(
    errorCode,
    definition.httpStatus,
    customMessage || definition.message
  )
}


// ============================================================================
// SIMPLE UTILITIES
// ============================================================================

/**
 * Type guard
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Handle any error and return appropriate response
 */
export function handleError(error: unknown): {
  success: false
  error: string
  errorCode: ErrorCode | undefined
} {
  if (isAppError(error)) {
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    }
  }
  
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      errorCode: BillAssignmentError.VALIDATION_ERROR
    }
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
    errorCode: undefined
  }
}
