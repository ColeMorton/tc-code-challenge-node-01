import { z } from 'zod'

// Base schemas
export const BillReferenceSchema = z
  .string()
  .min(1, 'Bill reference is required')
  .max(100, 'Bill reference must be less than 100 characters')
  .regex(/^[A-Z0-9-_\s%]+$/i, 'Bill reference must contain only letters, numbers, hyphens, underscores, and spaces')

export const BillDateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
  .transform((date) => new Date(date))

export const UserIdSchema = z
  .string()
  .min(1, 'User ID is required')

// API Request schemas
export const CreateBillRequestSchema = z.object({
  billReference: BillReferenceSchema,
  billDate: BillDateSchema,
  assignedToId: UserIdSchema.optional()
})

export const AssignBillRequestSchema = z.object({
  userId: UserIdSchema,
  billId: UserIdSchema.optional()
})

export const ValidateBillReferenceQuerySchema = z.object({
  billReference: BillReferenceSchema
})

// API Response schemas
export const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
})

export const BillStageResponseSchema = z.object({
  id: z.string(),
  label: z.string(),
  colour: z.string()
})

export const BillResponseSchema = z.object({
  id: z.string(),
  billReference: z.string(),
  billDate: z.string(),
  submittedAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  onHoldAt: z.string().nullable(),
  assignedTo: UserResponseSchema.nullable(),
  billStage: BillStageResponseSchema
})

export const CreateBillResponseSchema = BillResponseSchema

export const AssignBillResponseSchema = z.object({
  message: z.string(),
  bill: BillResponseSchema
})

export const ValidateBillReferenceResponseSchema = z.object({
  exists: z.boolean(),
  isValid: z.boolean()
})

export const ErrorResponseSchema = z.object({
  error: z.string()
})

// Type exports
export type CreateBillRequest = z.infer<typeof CreateBillRequestSchema>
export type AssignBillRequest = z.infer<typeof AssignBillRequestSchema>
export type ValidateBillReferenceQuery = z.infer<typeof ValidateBillReferenceQuerySchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type BillStageResponse = z.infer<typeof BillStageResponseSchema>
export type BillResponse = z.infer<typeof BillResponseSchema>
export type CreateBillResponse = z.infer<typeof CreateBillResponseSchema>
export type AssignBillResponse = z.infer<typeof AssignBillResponseSchema>
export type ValidateBillReferenceResponse = z.infer<typeof ValidateBillReferenceResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>