'use client'

import Link from 'next/link'
import { getFieldError, hasFieldError } from '@/app/lib/validation'
import { BillFormProps } from '@/app/lib/types'
import { useBillForm } from '@/app/hooks/useBillForm'

export default function BillForm({ users }: BillFormProps) {
  const {
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
  } = useBillForm()

  // All form logic is now handled by the custom hook

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
