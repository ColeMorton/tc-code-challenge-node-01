/**
 * Bill-related utility functions
 */

import type { Bill, GroupedBills } from '@/app/lib/types'

export const groupBillsByStage = (bills: Bill[]): GroupedBills => {
  return bills.reduce((acc, bill) => {
    const stage = bill.billStage.label
    if (!acc[stage]) {
      acc[stage] = []
    }
    acc[stage].push(bill)
    return acc
  }, {} as GroupedBills)
}
