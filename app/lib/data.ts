import { unstable_noStore as noStore } from 'next/cache';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

import { prisma } from '@/lib/prisma'

export async function fetchTotalNumberSubmittedBills() {
  try {
    const count = await prisma.bill.count({
      where: {
        submittedAt: {
          not: null
        }
      }
    })
    
    return count
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of submitted bills.');
  }
}

export async function fetchTotalNumberApprovedBills() {
  try {
    const count = await prisma.bill.count({
      where: {
        billStage: {
          label: 'Approved'
        }
      }
    })
    
    return count
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of approved bills.');
  }
}

export async function fetchTotalNumberOnHoldBills() {
  try {
    const count = await prisma.bill.count({
      where: {
        billStage: {
          label: 'On Hold'
        }
      }
    })
    
    return count
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of approved bills.');
  }
}

export async function fetchUserBillsSummary() {
  try {
    const usersWithBills = await prisma.user.findMany({
      include: {
        bills: {
          include: {
            billStage: true
          }
        }
      }
    })

    const userSummary = usersWithBills.map(user => {
      const totalBills = user.bills.length
      const totalSubmitted = user.bills.filter(bill => bill.submittedAt !== null).length
      const totalApproved = user.bills.filter(bill => bill.billStage.label === 'Approved').length

      return {
        userId: user.id,
        userName: user.name,
        totalBills,
        totalSubmitted,
        totalApproved
      }
    }).filter(user => user.totalBills > 0) // Only show users with bills

    // Sort by Total Bills in descending order (highest to lowest)
    userSummary.sort((a, b) => b.totalBills - a.totalBills);

    return userSummary;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user bills summary.');
  }
}