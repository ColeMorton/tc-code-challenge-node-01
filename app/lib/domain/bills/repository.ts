import { prisma } from '@/app/lib/infrastructure'
import { BILL_STAGE } from './stage-config'

export async function getBills() {
  return await prisma.bill.findMany({
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      billStage: {
        select: {
          id: true,
          label: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function fetchTotalNumberSubmittedBills() {
  return await prisma.bill.count({
    where: {
      billStage: {
        label: BILL_STAGE.SUBMITTED.label
      }
    }
  })
}

export async function fetchTotalNumberApprovedBills() {
  return await prisma.bill.count({
    where: {
      billStage: {
        label: BILL_STAGE.APPROVED.label
      }
    }
  })
}

export async function fetchTotalNumberOnHoldBills() {
  return await prisma.bill.count({
    where: {
      billStage: {
        label: BILL_STAGE.ON_HOLD.label
      }
    }
  })
}

export async function fetchUserBillsSummary() {
  const users = await prisma.user.findMany({
    include: {
      bills: {
        include: {
          billStage: true
        }
      }
    }
  })

  return users.map(user => ({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    totalBills: user.bills.length,
    totalSubmitted: user.bills.filter(bill => bill.billStage.label === BILL_STAGE.SUBMITTED.label).length,
    totalApproved: user.bills.filter(bill => bill.billStage.label === BILL_STAGE.APPROVED.label).length,
    totalOnHold: user.bills.filter(bill => bill.billStage.label === BILL_STAGE.ON_HOLD.label).length
  }))
}
