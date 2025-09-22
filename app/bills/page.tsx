'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
}

interface UnassignedUser {
  id: null
  name: 'Unassigned'
  email: ''
}

interface BillStage {
  id: string
  label: string
  colour: string
}

interface Bill {
  id: string
  billReference: string
  billDate: string
  submittedAt?: string
  approvedAt?: string
  onHoldAt?: string
  assignedTo: User | UnassignedUser | null
  billStage: BillStage
}

interface GroupedBills {
  [stageLabel: string]: Bill[]
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningBillId, setAssigningBillId] = useState<string | null>(null)

  useEffect(() => {
    fetchBills()
    fetchUsers()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills')
      if (!response.ok) {
        throw new Error('Failed to fetch bills')
      }
      const data = await response.json()
      setBills(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  const groupBillsByStage = (bills: Bill[]): GroupedBills => {
    return bills.reduce((acc, bill) => {
      const stage = bill.billStage.label
      if (!acc[stage]) {
        acc[stage] = []
      }
      acc[stage].push(bill)
      return acc
    }, {} as GroupedBills)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const assignBill = async (billId: string, userId: string) => {
    setAssigningBillId(billId)
    try {
      const response = await fetch('/api/bills/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billId, userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign bill')
      }

      // Refresh bills to show the updated assignment
      await fetchBills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign bill')
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    } finally {
      setAssigningBillId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading bills...</div>
      </div>
    )
  }

  if (error && bills.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    )
  }

  const groupedBills = groupBillsByStage(bills)
  const stageOrder = ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold', 'Rejected', 'Paid']

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 data-testid="dashboard-title" className="text-3xl font-bold text-gray-900">Bills Dashboard</h1>
          <Link
            href="/bills/new"
            data-testid="add-new-bill-button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Add New Bill
          </Link>
        </div>

        {error && (
          <div data-testid="error-message" className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div data-testid="bills-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6">
          {stageOrder.map((stageLabel) => {
            const stageBills = groupedBills[stageLabel] || []
            const stageColor = stageBills[0]?.billStage.colour || '#9CA3AF'

            return (
              <div key={stageLabel} data-testid={`stage-column-${stageLabel.toLowerCase().replace(' ', '-')}`} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div
                  className="px-4 py-3 rounded-t-lg border-b border-gray-200"
                  style={{ backgroundColor: stageColor }}
                >
                  <h2 className="font-semibold text-white text-center">
                    {stageLabel} ({stageBills.length})
                  </h2>
                </div>

                <div className="p-4 space-y-3 min-h-[400px]">
                  {stageBills.map((bill) => {
                    const isUnassigned = !bill.assignedTo
                    const isAssignable = ['Draft', 'Submitted'].includes(bill.billStage.label)
                    const canAssign = isUnassigned && isAssignable
                    const isAssigning = assigningBillId === bill.id

                    return (
                      <div
                        key={bill.id}
                        data-testid={`bill-card-${bill.billReference}`}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-gray-900 mb-2">
                          {bill.billReference}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Assigned to:</span> {
                              bill.assignedTo ? bill.assignedTo.name : (
                                <span className="text-orange-600 font-medium">Unassigned</span>
                              )
                            }
                          </div>
                          <div>
                            <span className="font-medium">Bill Date:</span> {formatDate(bill.billDate)}
                          </div>
                          {bill.submittedAt && (
                            <div>
                              <span className="font-medium">Submitted:</span> {formatDate(bill.submittedAt)}
                            </div>
                          )}
                          {bill.approvedAt && (
                            <div>
                              <span className="font-medium">Approved:</span> {formatDate(bill.approvedAt)}
                            </div>
                          )}
                          {bill.onHoldAt && (
                            <div>
                              <span className="font-medium">On Hold:</span> {formatDate(bill.onHoldAt)}
                            </div>
                          )}
                        </div>

                        {canAssign && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="space-y-2">
                              <select
                                data-testid={`assignment-select-${bill.billReference}`}
                                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    assignBill(bill.id, e.target.value)
                                    e.target.value = '' // Reset selection
                                  }
                                }}
                                disabled={isAssigning}
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  {isAssigning ? 'Assigning...' : 'Assign to user...'}
                                </option>
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {stageBills.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No bills in this stage
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}