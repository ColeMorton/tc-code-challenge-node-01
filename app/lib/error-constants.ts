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
  },

  // Validation Errors
  USER_ID_REQUIRED: {
    code: 'USER_ID_REQUIRED',
    message: 'userId is required',
    httpStatus: 400
  },

  BILL_ID_REQUIRED: {
    code: 'BILL_ID_REQUIRED',
    message: 'billId is required',
    httpStatus: 400
  },

  BILL_REFERENCE_REQUIRED: {
    code: 'BILL_REFERENCE_REQUIRED',
    message: 'Bill reference is required',
    httpStatus: 400
  },

  BILL_REFERENCE_TOO_SHORT: {
    code: 'BILL_REFERENCE_TOO_SHORT',
    message: 'Bill reference must be at least 3 characters',
    httpStatus: 400
  },

  BILL_REFERENCE_TOO_LONG: {
    code: 'BILL_REFERENCE_TOO_LONG',
    message: 'Bill reference must be less than 100 characters',
    httpStatus: 400
  },

  BILL_DATE_REQUIRED: {
    code: 'BILL_DATE_REQUIRED',
    message: 'Bill date is required',
    httpStatus: 400
  },

  INVALID_DATE_FORMAT: {
    code: 'INVALID_DATE_FORMAT',
    message: 'Invalid date format',
    httpStatus: 400
  },

  // System Errors
  DRAFT_STAGE_NOT_FOUND: {
    code: 'DRAFT_STAGE_NOT_FOUND',
    message: 'Draft stage not found',
    httpStatus: 500
  },

  BILL_REFERENCE_EXISTS: {
    code: 'BILL_REFERENCE_EXISTS',
    message: 'Bill reference already exists',
    httpStatus: 409
  },

  // API Operation Errors
  FAILED_TO_FETCH_USERS: {
    code: 'FAILED_TO_FETCH_USERS',
    message: 'Failed to fetch users',
    httpStatus: 500
  },

  FAILED_TO_FETCH_BILLS: {
    code: 'FAILED_TO_FETCH_BILLS',
    message: 'Failed to fetch bills',
    httpStatus: 500
  },

  FAILED_TO_ASSIGN_BILL: {
    code: 'FAILED_TO_ASSIGN_BILL',
    message: 'Failed to assign bill',
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
