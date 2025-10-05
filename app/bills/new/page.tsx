'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBill, validateBillReference } from '@/app/bills/actions'

interface User {
  id: string
  name: string
  email: string
}

interface FormData {
  billReference: string
  billDate: string
  assignedToId: string
}

interface ValidationState {
  billReference: {
    isValid: boolean
    isChecking: boolean
    message: string
  }
}

export default function NewBillPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState<FormData>({
    billReference: '',
    billDate: '',
    assignedToId: ''
  })
  const [validation, setValidation] = useState<ValidationState>({
    billReference: {
      isValid: true,
      isChecking: false,
      message: ''
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch {
      console.error('Failed to fetch users')
    }
  }

  const handleValidateBillReference = async (billReference: string) => {
    if (!billReference.trim()) {
      setValidation(prev => ({
        ...prev,
        billReference: {
          isValid: true,
          isChecking: false,
          message: ''
        }
      }))
      return
    }

    setValidation(prev => ({
      ...prev,
      billReference: {
        isValid: true,
        isChecking: true,
        message: 'Checking...'
      }
    }))

    try {
      const result = await validateBillReference(billReference)

      setValidation(prev => ({
        ...prev,
        billReference: {
          isValid: result.isValid,
          isChecking: false,
          message: result.message || ''
        }
      }))
    } catch {
      setValidation(prev => ({
        ...prev,
        billReference: {
          isValid: false,
          isChecking: false,
          message: 'Error checking bill reference'
        }
      }))
    }
  }

  const handleBillReferenceChange = (value: string) => {
    setFormData(prev => ({ ...prev, billReference: value }))

    const timeoutId = setTimeout(() => {
      handleValidateBillReference(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.billReference.trim()) {
      setError('Bill reference is required')
      return
    }

    if (!formData.billDate) {
      setError('Bill date is required')
      return
    }

    if (!validation.billReference.isValid) {
      setError('Please fix the bill reference error')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Created Successfully!</h2>
          <p className="text-gray-600">Redirecting to bills dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 data-testid="new-bill-title" className="text-3xl font-bold text-gray-900">Create New Bill</h1>
          <p className="mt-2 text-gray-600">Add a new bill to the system</p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div data-testid="form-error" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
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
                  validation.billReference.isValid ? 'border-gray-300' : 'border-red-300'
                }`}
                placeholder="e.g., BILL-2024-001"
                required
              />
              {validation.billReference.message && (
                <p className={`mt-1 text-sm ${
                  validation.billReference.isChecking
                    ? 'text-gray-500'
                    : validation.billReference.isValid
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {validation.billReference.message}
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
                onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">
                Assign to User (optional)
              </label>
              <select
                id="assignedToId"
                data-testid="assigned-to-select"
                value={formData.assignedToId}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedToId: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Leave unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                data-testid="submit-button"
                disabled={isPending || !validation.billReference.isValid || validation.billReference.isChecking}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isPending ? 'Creating...' : 'Create Bill'}
              </button>

              <Link
                href="/bills"
                data-testid="cancel-button"
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md text-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}