/**
 * Shared validation constants to prevent frontend-backend validation mismatches
 * 
 * These constants ensure that both client and server validation use the same
 * rules for critical business logic, preventing user confusion and validation
 * inconsistencies.
 */

// Bill Reference Validation Constants
export const BILL_REFERENCE_CONSTRAINTS = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 100,
  PATTERN: /^[A-Za-z0-9-]+$/,
  PATTERN_DESCRIPTION: 'letters, numbers, and hyphens only'
} as const

// Bill Date Validation Constants
export const BILL_DATE_CONSTRAINTS = {
  REQUIRED: true,
  FORMAT: 'ISO date string (YYYY-MM-DD)'
} as const

// User Assignment Constants
export const USER_ASSIGNMENT_CONSTRAINTS = {
  MAX_BILLS_PER_USER: 3,
  ALLOWED_STAGES: ['Draft', 'Submitted'] as const
} as const

// Validation Error Messages (shared between frontend and backend)
export const VALIDATION_MESSAGES = {
  BILL_REFERENCE_REQUIRED: 'Bill reference is required',
  BILL_REFERENCE_TOO_SHORT: `Bill reference must be at least ${BILL_REFERENCE_CONSTRAINTS.MIN_LENGTH} characters`,
  BILL_REFERENCE_TOO_LONG: `Bill reference must be less than ${BILL_REFERENCE_CONSTRAINTS.MAX_LENGTH} characters`,
  BILL_REFERENCE_INVALID_PATTERN: `Bill reference can only contain ${BILL_REFERENCE_CONSTRAINTS.PATTERN_DESCRIPTION}`,
  BILL_DATE_REQUIRED: 'Bill date is required',
  BILL_DATE_INVALID_FORMAT: 'Invalid date format',
  USER_BILL_LIMIT_EXCEEDED: `User already has the maximum of ${USER_ASSIGNMENT_CONSTRAINTS.MAX_BILLS_PER_USER} bills assigned`
} as const

// Type exports for TypeScript
export type BillReferenceConstraints = typeof BILL_REFERENCE_CONSTRAINTS
export type BillDateConstraints = typeof BILL_DATE_CONSTRAINTS
export type UserAssignmentConstraints = typeof USER_ASSIGNMENT_CONSTRAINTS
export type ValidationMessages = typeof VALIDATION_MESSAGES
