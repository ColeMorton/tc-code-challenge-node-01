// Client-side form validation types and functions
import { ERROR_DEFINITIONS } from '@/app/lib/error'
import type { BillFormData, FormFieldError } from '@/app/lib/types'
import { sanitizeBillReference } from '@/app/lib/security'
import { BILL_REFERENCE_CONSTRAINTS } from './constants'

// FormFieldError is imported from definitions.ts

export interface FormValidationState {
  billReference: FormFieldError | null
  billDate: FormFieldError | null
  assignedToId: FormFieldError | null
  isValid: boolean
}

// Re-export BillFormData for backward compatibility
export type { BillFormData } from '@/app/lib/types'

// Initial validation state
export const initialValidationState: FormValidationState = {
  billReference: null,
  billDate: null,
  assignedToId: null,
  isValid: false
}

// Enhanced client-side field validators with centralized error messages
export const FieldValidators = {
  billReference: (value: string): FormFieldError | null => {
    const sanitized = sanitizeBillReference(value)

    if (!sanitized) {
      return { message: ERROR_DEFINITIONS.BILL_REFERENCE_REQUIRED.message, type: 'required' }
    }

    if (sanitized.length < BILL_REFERENCE_CONSTRAINTS.MIN_LENGTH) {
      return { message: ERROR_DEFINITIONS.BILL_REFERENCE_TOO_SHORT.message, type: 'minLength' }
    }

    if (sanitized.length > BILL_REFERENCE_CONSTRAINTS.MAX_LENGTH) {
      return { message: ERROR_DEFINITIONS.BILL_REFERENCE_TOO_LONG.message, type: 'maxLength' }
    }

    // Add pattern validation on client side for better UX
    if (!BILL_REFERENCE_CONSTRAINTS.PATTERN.test(sanitized)) {
      return { message: ERROR_DEFINITIONS.BILL_REFERENCE_INVALID_PATTERN.message, type: 'pattern' }
    }

    return null
  },

  billDate: (value: string): FormFieldError | null => {
    if (!value) {
      return { message: ERROR_DEFINITIONS.BILL_DATE_REQUIRED.message, type: 'required' }
    }

    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return { message: ERROR_DEFINITIONS.INVALID_DATE_FORMAT.message, type: 'invalidDate' }
    }

    return null
  },

  assignedToId: (): FormFieldError | null => {
    return null
  }
}

// Validate the entire form
export function validateForm(formData: Partial<BillFormData>): FormValidationState {
  const billReferenceError = FieldValidators.billReference(formData.billReference || '')
  const billDateError = FieldValidators.billDate(formData.billDate || '')
  const assignedToIdError = FieldValidators.assignedToId()

  return {
    billReference: billReferenceError,
    billDate: billDateError,
    assignedToId: assignedToIdError,
    isValid: !billReferenceError && !billDateError && !assignedToIdError
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
