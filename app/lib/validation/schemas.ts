import { z } from 'zod'
import { sanitizeBillReference } from '@/app/lib/security'
import { BILL_REFERENCE_CONSTRAINTS } from './constants'
import { ERROR_DEFINITIONS } from '@/app/lib/error'

// Server-only validation with Zod for strict business rules

export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
}

// Clean server-side schema with sanitization via centralized functions (fail-fast approach)
export const CreateBillSchema = z.object({
  billReference: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val
      // Use centralized sanitization function
      return sanitizeBillReference(val)
    },
    z.string()
      .min(1, ERROR_DEFINITIONS.BILL_REFERENCE_REQUIRED.message)
      .min(BILL_REFERENCE_CONSTRAINTS.MIN_LENGTH, ERROR_DEFINITIONS.BILL_REFERENCE_TOO_SHORT.message)
      .max(BILL_REFERENCE_CONSTRAINTS.MAX_LENGTH, ERROR_DEFINITIONS.BILL_REFERENCE_TOO_LONG.message)
      .regex(BILL_REFERENCE_CONSTRAINTS.PATTERN, ERROR_DEFINITIONS.BILL_REFERENCE_INVALID_PATTERN.message)
  ),
  billDate: z.string()
    .min(1, ERROR_DEFINITIONS.BILL_DATE_REQUIRED.message)
    .refine((date) => {
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, ERROR_DEFINITIONS.INVALID_DATE_FORMAT.message)
    .transform(val => {
      // Normalize date format during transform
      const trimmed = val.trim()
      const date = new Date(trimmed)
      
      // Return ISO date string (YYYY-MM-DD)
      return date.toISOString().split('T')[0]
    }),
  assignedToId: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val) // Convert empty string to undefined
})

// Clean assignment schema with sanitization via Zod transforms
export const AssignBillSchema = z.object({
  billId: z.string()
    .min(1, ERROR_DEFINITIONS.BILL_ID_REQUIRED.message)
    .transform(val => val.trim()), // Sanitize during transform
  userId: z.string()
    .min(1, ERROR_DEFINITIONS.USER_ID_REQUIRED.message)
    .transform(val => val.trim()) // Sanitize during transform
})

// Type exports for TypeScript
export type CreateBillData = z.infer<typeof CreateBillSchema>
export type AssignBillData = z.infer<typeof AssignBillSchema>

// Helper function to validate and return structured results
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  }

  return {
    success: false,
    errors: result.error.flatten().fieldErrors as Record<string, string[]>
  }
}

// Server-side validation functions with built-in sanitization via Zod schemas
export function validateCreateBillInput(input: unknown): ValidationResult<CreateBillData> {
  return validateWithZod(CreateBillSchema, input)
}

export function validateAssignBillInput(input: unknown): ValidationResult<AssignBillData> {
  return validateWithZod(AssignBillSchema, input)
}
