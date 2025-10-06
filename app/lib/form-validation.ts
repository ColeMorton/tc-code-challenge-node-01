import { z } from 'zod'
import { BillFormSchema, BillFormData } from './validation'

// Enhanced form validation utilities specifically for the BillForm component
export interface FormFieldError {
  message: string
  type?: string
}

export interface FormValidationState {
  billReference: FormFieldError | null
  billDate: FormFieldError | null
  assignedToId: FormFieldError | null
  isValid: boolean
}

// Initial validation state
export const initialValidationState: FormValidationState = {
  billReference: null,
  billDate: null,
  assignedToId: null,
  isValid: false
}

// Validate a single field
export function validateField(
  fieldName: keyof BillFormData,
  value: string
): FormFieldError | null {
  try {
    const fieldSchema = BillFormSchema.shape[fieldName]
    fieldSchema.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: error.issues[0]?.message || 'Invalid value',
        type: error.issues[0]?.code
      }
    }
    return { message: 'Validation error' }
  }
}

// Validate the entire form
export function validateForm(formData: Partial<BillFormData>): FormValidationState {
  const result = BillFormSchema.safeParse(formData)
  
  if (result.success) {
    return {
      billReference: null,
      billDate: null,
      assignedToId: null,
      isValid: true
    }
  }
  
  const fieldErrors = result.error.flatten().fieldErrors
  const state: FormValidationState = {
    billReference: null,
    billDate: null,
    assignedToId: null,
    isValid: false
  }
  
  // Map Zod errors to our form state
  if (fieldErrors.billReference) {
    state.billReference = {
      message: fieldErrors.billReference[0] || 'Invalid bill reference',
      type: 'validation'
    }
  }
  
  if (fieldErrors.billDate) {
    state.billDate = {
      message: fieldErrors.billDate[0] || 'Invalid bill date',
      type: 'validation'
    }
  }
  
  if (fieldErrors.assignedToId) {
    state.assignedToId = {
      message: fieldErrors.assignedToId[0] || 'Invalid user selection',
      type: 'validation'
    }
  }
  
  return state
}

// Validate specific field types with custom rules
export const FieldValidators = {
  billReference: (value: string): FormFieldError | null => {
    if (!value.trim()) {
      return { message: 'Bill reference is required' }
    }
    
    if (value.length < 3) {
      return { message: 'Bill reference must be at least 3 characters' }
    }
    
    if (value.length > 100) {
      return { message: 'Bill reference must be less than 100 characters' }
    }
    
    return null
  },
  
  billDate: (value: string): FormFieldError | null => {
    if (!value) {
      return { message: 'Bill date is required' }
    }
    
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return { message: 'Invalid date format' }
    }
    
    return null
  },
  
  assignedToId: (): FormFieldError | null => {
    // Optional field, so no validation needed
    return null
  }
}

// Helper to get field error message
export function getFieldError(state: FormValidationState, fieldName: keyof FormValidationState): string | null {
  if (fieldName === 'isValid') return null
  return state[fieldName]?.message || null
}

// Helper to check if field has error
export function hasFieldError(state: FormValidationState, fieldName: keyof FormValidationState): boolean {
  if (fieldName === 'isValid') return false
  return state[fieldName] !== null
}
