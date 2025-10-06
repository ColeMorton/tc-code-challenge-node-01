import { z } from 'zod'

// Base schema for bill reference validation
export const BillReferenceSchema = z.string()
  .min(1, "Bill reference is required")
  .max(100, "Bill reference must be less than 100 characters")
  .trim()

// Schema for bill date validation
export const BillDateSchema = z.string()
  .min(1, "Bill date is required")
  .refine((date) => {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }, "Invalid date format")

// Schema for user ID validation (optional)
export const UserIdSchema = z.string()
  .optional()
  .refine((id) => {
    if (!id) return true // Optional field
    return id.length > 0
  }, "Invalid user ID")

// Complete form schema for client-side validation
export const BillFormSchema = z.object({
  billReference: BillReferenceSchema,
  billDate: BillDateSchema,
  assignedToId: UserIdSchema
})

// Server-side schema with additional validations
export const CreateBillSchema = z.object({
  billReference: BillReferenceSchema
    .regex(/^[A-Za-z0-9-]+$/, "Bill reference can only contain letters, numbers, and hyphens")
    .min(5, "Bill reference must be at least 5 characters"),
  billDate: BillDateSchema,
  assignedToId: UserIdSchema
})

// Schema for bill assignment
export const AssignBillSchema = z.object({
  billId: z.string()
    .min(1, "Bill ID is required"),
  userId: z.string()
    .min(1, "User ID is required")
})

// Type exports for TypeScript
export type BillFormData = z.infer<typeof BillFormSchema>
export type CreateBillData = z.infer<typeof CreateBillSchema>
export type AssignBillData = z.infer<typeof AssignBillSchema>

// Validation result types
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
}

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

// Helper function for server-side validation with custom error handling
export function validateCreateBillInput(input: unknown): ValidationResult<CreateBillData> {
  return validateWithZod(CreateBillSchema, input)
}

export function validateAssignBillInput(input: unknown): ValidationResult<AssignBillData> {
  return validateWithZod(AssignBillSchema, input)
}
