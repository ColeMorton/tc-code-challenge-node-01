import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { createBill, validateBillReference } from '@/app/bills/actions'
import {
  FormValidationState,
  initialValidationState,
  validateForm,
  FieldValidators,
  BillFormData
} from '@/app/lib/validation'
import {
  AsyncValidationState
} from '@/app/lib/types'
import { sanitizeBillReference } from '@/app/lib/security'
import { useErrorHandler } from './useErrorHandler'

interface UseBillFormReturn {
  formData: BillFormData
  validation: FormValidationState
  asyncValidation: AsyncValidationState
  error: string | null
  success: boolean
  isPending: boolean
  handleBillReferenceChange: (value: string) => void
  handleBillDateChange: (value: string) => void
  handleAssignedToChange: (value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

/**
 * Custom hook for managing bill form state and validation
 * Follows Single Responsibility Principle by separating form logic from UI
 */
export const useBillForm = (): UseBillFormReturn => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { error, showError, clearError } = useErrorHandler()
  
  const [formData, setFormData] = useState<BillFormData>({
    billReference: '',
    billDate: '',
    assignedToId: ''
  })
  
  const [validation, setValidation] = useState<FormValidationState>(initialValidationState)
  const [asyncValidation, setAsyncValidation] = useState<AsyncValidationState>({
    billReference: {
      isValid: true,
      isChecking: false,
      message: ''
    }
  })
  
  const [success, setSuccess] = useState(false)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleValidateBillReference = useCallback(async (billReference: string): Promise<void> => {
    if (!billReference.trim()) {
      setAsyncValidation({
        billReference: {
          isValid: true,
          isChecking: false,
          message: ''
        }
      })
      return
    }

    setAsyncValidation({
      billReference: {
        isValid: true,
        isChecking: true,
        message: 'Checking...'
      }
    })

    try {
      const result = await validateBillReference(billReference)

      setAsyncValidation({
        billReference: {
          isValid: result.isValid,
          isChecking: false,
          message: result.message || ''
        }
      })
    } catch {
      setAsyncValidation({
        billReference: {
          isValid: false,
          isChecking: false,
          message: 'Error checking bill reference'
        }
      })
    }
  }, [])

  const handleBillReferenceChange = useCallback((value: string): void => {
    const sanitized = sanitizeBillReference(value)
    const newFormData = { ...formData, billReference: sanitized }
    setFormData(newFormData)

    // Validate field immediately with Zod
    const fieldError = FieldValidators.billReference(sanitized)
    setValidation(prev => ({
      ...prev,
      billReference: fieldError,
      isValid: fieldError === null && prev.billDate === null && prev.assignedToId === null
    }))

    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    // Only validate asynchronously if the value is not empty and passes basic validation
    if (sanitized.trim() && !fieldError) {
      // Set new timeout for async validation
      validationTimeoutRef.current = setTimeout(() => {
        handleValidateBillReference(sanitized)
      }, 500)
    } else {
      // Reset async validation state for empty or invalid values
      setAsyncValidation({
        billReference: {
          isValid: true,
          isChecking: false,
          message: ''
        }
      })
    }
  }, [formData, handleValidateBillReference])

  const handleBillDateChange = useCallback((value: string): void => {
    const newFormData = { ...formData, billDate: value }
    setFormData(newFormData)

    // Validate field immediately with Zod
    const fieldError = FieldValidators.billDate(value)
    setValidation(prev => ({
      ...prev,
      billDate: fieldError,
      isValid: prev.billReference === null && fieldError === null && prev.assignedToId === null
    }))
  }, [formData])

  const handleAssignedToChange = useCallback((value: string): void => {
    const newFormData = { ...formData, assignedToId: value }
    setFormData(newFormData)

    // Validate field immediately with Zod (optional field)
    const fieldError = FieldValidators.assignedToId()
    setValidation(prev => ({
      ...prev,
      assignedToId: fieldError,
      isValid: prev.billReference === null && prev.billDate === null && fieldError === null
    }))
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    clearError()

    // Validate the entire form
    const formValidation = validateForm(formData)
    setValidation(formValidation)

    // Check if there are any validation errors
    if (!formValidation.isValid) {
      const firstError = Object.values(formValidation).find(error => error && typeof error === 'object' && 'message' in error)
      showError(firstError ? firstError.message : 'Please fix the form errors')
      return
    }

    // Check async validation for bill reference
    if (!asyncValidation.billReference.isValid) {
      showError('Please fix the bill reference error')
      return
    }

    // Check if async validation is still in progress
    if (asyncValidation.billReference.isChecking) {
      showError('Please wait for bill reference validation to complete')
      return
    }

    startTransition(async () => {
      try {
        await createBill({
          billReference: formData.billReference,
          billDate: formData.billDate,
          assignedToId: formData.assignedToId || undefined
        })

        setSuccess(true)
        setTimeout(() => {
          router.push('/bills')
        }, 2000)
      } catch (err) {
        showError(err instanceof Error ? err.message : 'An error occurred')
      }
    })
  }, [formData, asyncValidation, showError, clearError, router])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  return {
    formData,
    validation,
    asyncValidation,
    error,
    success,
    isPending,
    handleBillReferenceChange,
    handleBillDateChange,
    handleAssignedToChange,
    handleSubmit
  }
}
