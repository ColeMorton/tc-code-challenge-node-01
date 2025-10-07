/**
 * Centralized error constants and messages for consistent error handling
 * This ensures error messages are consistent across the application
 * and makes localization easier in the future
 */

// ============================================================================
// SIMPLIFIED ERROR DEFINITIONS
// ============================================================================

export interface ErrorDefinition {
  message: string
  httpStatus: number
}

export const ERROR_DEFINITIONS: Record<string, ErrorDefinition> = {
  // Validation Errors
  VALIDATION_FAILED: {
    message: 'Validation failed',
    httpStatus: 400
  },

  // Business Logic Errors
  USER_NOT_FOUND: {
    message: 'User not found',
    httpStatus: 404
  },

  BILL_NOT_FOUND: {
    message: 'Bill not found',
    httpStatus: 404
  },

  BILL_ALREADY_ASSIGNED: {
    message: 'Bill is already assigned',
    httpStatus: 409
  },

  USER_BILL_LIMIT_EXCEEDED: {
    message: 'User already has the maximum of 3 bills assigned',
    httpStatus: 409
  },

  INVALID_BILL_STAGE: {
    message: 'Bill must be in Draft or Submitted stage to be assigned',
    httpStatus: 400
  },

  // System Errors
  CONCURRENT_UPDATE: {
    message: 'Failed to assign bill due to concurrent updates. Please try again.',
    httpStatus: 503
  },

  DATABASE_ERROR: {
    message: 'Database operation failed',
    httpStatus: 500
  },

  UNKNOWN_ERROR: {
    message: 'An unexpected error occurred',
    httpStatus: 500
  },

  // Validation Errors
  USER_ID_REQUIRED: {
    message: 'userId is required',
    httpStatus: 400
  },

  BILL_ID_REQUIRED: {
    message: 'billId is required',
    httpStatus: 400
  },

  BILL_REFERENCE_REQUIRED: {
    message: 'Bill reference is required',
    httpStatus: 400
  },

  BILL_REFERENCE_TOO_SHORT: {
    message: 'Bill reference must be at least 5 characters',
    httpStatus: 400
  },

  BILL_REFERENCE_TOO_LONG: {
    message: 'Bill reference must be less than 100 characters',
    httpStatus: 400
  },

  BILL_DATE_REQUIRED: {
    message: 'Bill date is required',
    httpStatus: 400
  },

  INVALID_DATE_FORMAT: {
    message: 'Invalid date format',
    httpStatus: 400
  },

  // System Errors
  DRAFT_STAGE_NOT_FOUND: {
    message: 'Draft stage not found',
    httpStatus: 500
  },

  BILL_REFERENCE_EXISTS: {
    message: 'Bill reference already exists',
    httpStatus: 409
  },

  // API Operation Errors
  FAILED_TO_FETCH_USERS: {
    message: 'Failed to fetch users',
    httpStatus: 500
  },

  FAILED_TO_FETCH_BILLS: {
    message: 'Failed to fetch bills',
    httpStatus: 500
  },

  FAILED_TO_ASSIGN_BILL: {
    message: 'Failed to assign bill',
    httpStatus: 500
  },

  // Enhanced validation and sanitization errors
  BILL_REFERENCE_INVALID_PATTERN: {
    message: 'Bill reference can only contain letters, numbers, and hyphens only',
    httpStatus: 400
  },

  INPUT_SANITIZATION_FAILED: {
    message: 'Input contains invalid characters and has been sanitized',
    httpStatus: 400
  },

  BILL_REFERENCE_SANITIZED: {
    message: 'Bill reference contains invalid characters and has been cleaned',
    httpStatus: 200
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
export function getErrorDefinition(code: ErrorCode): ErrorDefinition | undefined {
  return ERROR_DEFINITIONS[code]
}

/**
 * Get HTTP status code for an error
 */
export function getHttpStatus(errorCode: ErrorCode): number {
  const definition = getErrorDefinition(errorCode)
  return definition?.httpStatus ?? 500
}

// ============================================================================
// TYPE-SAFE ERROR CODES
// ============================================================================

/**
 * Helper to create error constants without duplication
 */
const createErrorConstants = <T extends readonly string[]>(...keys: T) => 
  Object.fromEntries(keys.map(key => [key, key])) as Record<T[number], T[number]>

/**
 * Bill assignment error codes - eliminates key-value duplication
 */
export const BillAssignmentError = {
  ...createErrorConstants(
    'USER_NOT_FOUND',
    'BILL_NOT_FOUND', 
    'BILL_ALREADY_ASSIGNED',
    'USER_BILL_LIMIT_EXCEEDED',
    'INVALID_BILL_STAGE',
    'CONCURRENT_UPDATE',
    'DRAFT_STAGE_NOT_FOUND'
  ),
  VALIDATION_ERROR: 'VALIDATION_FAILED' // Only exception
} as const

export type BillAssignmentErrorCode = typeof BillAssignmentError[keyof typeof BillAssignmentError]

/**
 * Comprehensive error code type that includes all error definitions
 */
export type ErrorCode = keyof typeof ERROR_DEFINITIONS
