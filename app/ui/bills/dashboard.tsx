'use client'

import { useState, useEffect } from 'react'
import { assignBillAction } from '@/app/bills/actions'
import {
  Bill,
  BillsDashboardProps,
  GroupedBills
} from '@/app/lib/definitions'

export default function BillsDashboard({ bills, users }: BillsDashboardProps) {
  const [error, setError] = useState<string | null>(null)
  const [assigningBillId, setAssigningBillId] = useState<string | null>(null)

  // Scroll to top when any error occurs
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [error])

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const assignBill = async (billId: string, userId: string) => {
    setAssigningBillId(billId)
    setError(null)

    try {
      const result = await assignBillAction({ billId, userId })

      if (!result.success) {
        setError(result.error || 'Failed to assign bill')
        setTimeout(() => setError(null), 5000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign bill')
      setTimeout(() => setError(null), 5000)
    } finally {
      setAssigningBillId(null)
    }
  }

  const groupedBills = groupBillsByStage(bills)
  const stageOrder = ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold', 'Rejected', 'Paid']

  return (
    <div>
      {error && (
        <div 
          data-testid="error-message" 
          className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" 
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <div 
        data-testid="bills-grid" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6"
        role="region"
        aria-label="Bills organized by stage"
      >
        {stageOrder.map((stageLabel) => {
          const stageBills = groupedBills[stageLabel] || []
          const stageColor = stageBills[0]?.billStage.colour || '#9CA3AF'

          return (
            <div 
              key={stageLabel} 
              data-testid={`stage-column-${stageLabel.toLowerCase().replace(' ', '-')}`} 
              className="bg-white rounded-lg shadow-sm border border-gray-200"
              role="group"
              aria-labelledby={`stage-${stageLabel.toLowerCase().replace(' ', '-')}-header`}
            >
              <div
                className="px-4 py-3 rounded-t-lg border-b border-gray-200"
                style={{ backgroundColor: stageColor }}
              >
                <h2 
                  id={`stage-${stageLabel.toLowerCase().replace(' ', '-')}-header`}
                  className="font-semibold text-white text-center"
                >
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
                      role="article"
                      aria-labelledby={`bill-${bill.id}-title`}
                    >
                      <div 
                        id={`bill-${bill.id}-title`}
                        className="font-medium text-gray-900 mb-2"
                      >
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
                            <label htmlFor={`assignment-${bill.id}`} className="sr-only">
                              Assign {bill.billReference} to user
                            </label>
                            <select
                              id={`assignment-${bill.id}`}
                              data-testid={`assignment-select-${bill.billReference}`}
                              className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignBill(bill.id, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                              disabled={isAssigning}
                              defaultValue=""
                              aria-label={`Assign ${bill.billReference} to user`}
                              aria-describedby={isAssigning ? `assigning-${bill.id}` : undefined}
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
                            {isAssigning && (
                              <div id={`assigning-${bill.id}`} className="sr-only" aria-live="polite">
                                Assigning bill {bill.billReference}, please wait...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {stageBills.length === 0 && (
                  <div className="text-center text-gray-500 py-8" aria-live="polite">
                    No bills in this stage
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
