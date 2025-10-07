'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBill, validateBillReference } from '@/app/bills/actions'
import {
  FormValidationState,
  initialValidationState,
  validateForm,
  getFieldError,
  hasFieldError,
  FieldValidators,
  BillFormData
} from '@/app/lib/form-validation'
import {
  AsyncValidationState,
  BillFormProps
} from '@/app/lib/definitions'

export default function BillForm({ users }: BillFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleValidateBillReference = async (billReference: string) => {
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
  }

  const handleBillReferenceChange = (value: string) => {
    const newFormData = { ...formData, billReference: value }
    setFormData(newFormData)

    // Validate field immediately with Zod
    const fieldError = FieldValidators.billReference(value)
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
    if (value.trim() && !fieldError) {
      // Set new timeout for async validation
      validationTimeoutRef.current = setTimeout(() => {
        handleValidateBillReference(value)
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
  }

  const handleBillDateChange = (value: string) => {
    const newFormData = { ...formData, billDate: value }
    setFormData(newFormData)

    // Validate field immediately with Zod
    const fieldError = FieldValidators.billDate(value)
    setValidation(prev => ({
      ...prev,
      billDate: fieldError,
      isValid: prev.billReference === null && fieldError === null && prev.assignedToId === null
    }))
  }

  const handleAssignedToChange = (value: string) => {
    const newFormData = { ...formData, assignedToId: value }
    setFormData(newFormData)

    // Validate field immediately with Zod (optional field)
    const fieldError = FieldValidators.assignedToId()
    setValidation(prev => ({
      ...prev,
      assignedToId: fieldError,
      isValid: prev.billReference === null && prev.billDate === null && fieldError === null
    }))
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate the entire form
    const formValidation = validateForm(formData)
    setValidation(formValidation)

    // Check if there are any validation errors
    if (!formValidation.isValid) {
      const firstError = Object.values(formValidation).find(error => error && typeof error === 'object' && 'message' in error)
      setError(firstError ? firstError.message : 'Please fix the form errors')
      return
    }

    // Check async validation for bill reference
    if (!asyncValidation.billReference.isValid) {
      setError('Please fix the bill reference error')
      return
    }

    // Check if async validation is still in progress
    if (asyncValidation.billReference.isChecking) {
      setError('Please wait for bill reference validation to complete')
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
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    })
  }

  if (success) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center" role="status" aria-live="polite">
        <div className="text-green-600 text-6xl mb-4" aria-hidden="true">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Created Successfully!</h2>
        <p className="text-gray-600">Redirecting to bills dashboard...</p>
      </div>
    )
  }

  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && (
          <div 
            data-testid="form-error" 
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" 
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="billReference" className="block text-sm font-medium text-gray-700">
            Bill Reference *
          </label>
          <input
            type="text"
            id="billReference"
            data-testid="bill-reference-input"
            value={formData.billReference}
            onChange={(e) => handleBillReferenceChange(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasFieldError(validation, 'billReference') || !asyncValidation.billReference.isValid
                ? 'border-red-300' 
                : 'border-gray-300'
            }`}
            placeholder="e.g., BILL-2024-001"
            required
            aria-describedby={getFieldError(validation, 'billReference') ? 'billReference-error' : asyncValidation.billReference.message ? 'billReference-async' : undefined}
            aria-invalid={hasFieldError(validation, 'billReference') || !asyncValidation.billReference.isValid}
          />
          {/* Show Zod validation error */}
          {getFieldError(validation, 'billReference') && (
            <p id="billReference-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError(validation, 'billReference')}
            </p>
          )}
          {/* Show async validation message */}
          {asyncValidation.billReference.message && !getFieldError(validation, 'billReference') && (
            <p 
              id="billReference-async" 
              className={`mt-1 text-sm ${
                asyncValidation.billReference.isChecking
                  ? 'text-gray-500'
                  : asyncValidation.billReference.isValid
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
              aria-live={asyncValidation.billReference.isChecking ? 'polite' : 'assertive'}
            >
              {asyncValidation.billReference.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="billDate" className="block text-sm font-medium text-gray-700">
            Bill Date *
          </label>
          <input
            type="date"
            id="billDate"
            data-testid="bill-date-input"
            value={formData.billDate}
            onChange={(e) => handleBillDateChange(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 text-gray-700 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasFieldError(validation, 'billDate') ? 'border-red-300' : 'border-gray-300'
            }`}
            required
            aria-describedby={getFieldError(validation, 'billDate') ? 'billDate-error' : undefined}
            aria-invalid={hasFieldError(validation, 'billDate')}
          />
          {getFieldError(validation, 'billDate') && (
            <p id="billDate-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError(validation, 'billDate')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">
            Assign to User (optional)
          </label>
          <select
            id="assignedToId"
            data-testid="assigned-to-select"
            value={formData.assignedToId}
            onChange={(e) => handleAssignedToChange(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasFieldError(validation, 'assignedToId') ? 'border-red-300' : 'border-gray-300'
            }`}
            aria-describedby={getFieldError(validation, 'assignedToId') ? 'assignedToId-error' : undefined}
            aria-invalid={hasFieldError(validation, 'assignedToId')}
          >
            <option value="">Leave unassigned</option>
            {users.map((user) => {
              const billCount = user._count.bills
              const atCapacity = billCount >= 3
              return (
                <option
                  key={user.id}
                  value={user.id}
                  disabled={atCapacity}
                >
                  {user.name} ({user.email}) {atCapacity ? '- At capacity (3/3)' : `(${billCount}/3)`}
                </option>
              )
            })}
          </select>
          {getFieldError(validation, 'assignedToId') && (
            <p id="assignedToId-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError(validation, 'assignedToId')}
            </p>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            data-testid="submit-button"
            disabled={isPending || asyncValidation.billReference.isChecking}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-describedby={isPending ? 'submit-status' : asyncValidation.billReference.isChecking ? 'validation-status' : undefined}
            aria-disabled={isPending || asyncValidation.billReference.isChecking}
          >
            {isPending ? 'Creating...' : 'Create Bill'}
          </button>

          <Link
            href="/bills"
            data-testid="cancel-button"
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </Link>
        </div>

        {/* Status announcements for screen readers */}
        {isPending && (
          <div id="submit-status" className="sr-only" aria-live="polite">
            Creating bill, please wait...
          </div>
        )}
        {asyncValidation.billReference.isChecking && (
          <div id="validation-status" className="sr-only" aria-live="polite">
            Validating bill reference...
          </div>
        )}
      </form>
    </div>
  )
}
