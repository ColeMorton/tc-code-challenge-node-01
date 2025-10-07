import { z } from 'zod'

// Server-only validation with Zod for strict business rules

export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
}

// Server-side schema with strict business rules
export const CreateBillSchema = z.object({
  billReference: z.string()
    .trim()
    .min(1, "Bill reference is required")
    .min(5, "Bill reference must be at least 5 characters")
    .max(100, "Bill reference must be less than 100 characters")
    .regex(/^[A-Za-z0-9-]+$/, "Bill reference can only contain letters, numbers, and hyphens"),
  billDate: z.string()
    .min(1, "Bill date is required")
    .refine((date) => {
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, "Invalid date format"),
  assignedToId: z.string().optional()
})

// Schema for bill assignment
export const AssignBillSchema = z.object({
  billId: z.string().min(1, "Bill ID is required"),
  userId: z.string().min(1, "User ID is required")
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

// Server-side validation functions
export function validateCreateBillInput(input: unknown): ValidationResult<CreateBillData> {
  return validateWithZod(CreateBillSchema, input)
}

export function validateAssignBillInput(input: unknown): ValidationResult<AssignBillData> {
  return validateWithZod(AssignBillSchema, input)
}
