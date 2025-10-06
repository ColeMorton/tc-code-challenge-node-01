/**
 * Centralized error constants and messages for consistent error handling
 * This ensures error messages are consistent across the application
 * and makes localization easier in the future
 */

// ============================================================================
// SIMPLIFIED ERROR DEFINITIONS
// ============================================================================

export interface ErrorDefinition {
  code: string
  message: string
  httpStatus: number
}

export const ERROR_DEFINITIONS: Record<string, ErrorDefinition> = {
  // Validation Errors
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    message: 'Validation failed',
    httpStatus: 400
  },

  // Business Logic Errors
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    httpStatus: 404
  },

  BILL_NOT_FOUND: {
    code: 'BILL_NOT_FOUND',
    message: 'Bill not found',
    httpStatus: 404
  },

  BILL_ALREADY_ASSIGNED: {
    code: 'BILL_ALREADY_ASSIGNED',
    message: 'Bill is already assigned',
    httpStatus: 409
  },

  USER_BILL_LIMIT_EXCEEDED: {
    code: 'USER_BILL_LIMIT_EXCEEDED',
    message: 'User already has the maximum of 3 bills assigned',
    httpStatus: 409
  },

  INVALID_BILL_STAGE: {
    code: 'INVALID_BILL_STAGE',
    message: 'Bill must be in Draft or Submitted stage to be assigned',
    httpStatus: 400
  },

  // System Errors
  CONCURRENT_UPDATE: {
    code: 'CONCURRENT_UPDATE',
    message: 'Failed to assign bill due to concurrent updates. Please try again.',
    httpStatus: 503
  },

  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed',
    httpStatus: 500
  },

  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    httpStatus: 500
  }
}

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

export const ERROR_MESSAGES = Object.fromEntries(
  Object.entries(ERROR_DEFINITIONS).map(([key, def]) => [key, def.message])
) as Record<string, string>


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get error definition by code
 */
export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return ERROR_DEFINITIONS[code]
}


/**
 * Get HTTP status code for an error
 */
export function getHttpStatus(errorCode: string): number {
  const definition = getErrorDefinition(errorCode)
  return definition?.httpStatus ?? 500
}
