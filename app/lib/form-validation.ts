// Client-side form validation types and functions
import { ERROR_DEFINITIONS } from '@/app/lib/error-constants'

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

export interface BillFormData {
  billReference: string
  billDate: string
  assignedToId?: string
}

// Initial validation state
export const initialValidationState: FormValidationState = {
  billReference: null,
  billDate: null,
  assignedToId: null,
  isValid: false
}

// Native client-side field validators
export const FieldValidators = {
  billReference: (value: string): FormFieldError | null => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return { message: ERROR_DEFINITIONS.BILL_REFERENCE_REQUIRED.message, type: 'required' }
    }

    if (trimmedValue.length < 3) {
      return { message: ERROR_DEFINITIONS.BILL_REFERENCE_TOO_SHORT.message, type: 'minLength' }
    }

    if (trimmedValue.length > 100) {
      return { message: ERROR_DEFINITIONS.BILL_REFERENCE_TOO_LONG.message, type: 'maxLength' }
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
