import { prisma } from '@/app/lib/prisma'

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
          label: true,
          colour: true
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
        label: 'Submitted'
      }
    }
  })
}

export async function fetchTotalNumberApprovedBills() {
  return await prisma.bill.count({
    where: {
      billStage: {
        label: 'Approved'
      }
    }
  })
}

export async function fetchTotalNumberOnHoldBills() {
  return await prisma.bill.count({
    where: {
      billStage: {
        label: 'On Hold'
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
    totalSubmitted: user.bills.filter(bill => bill.billStage.label === 'Submitted').length,
    totalApproved: user.bills.filter(bill => bill.billStage.label === 'Approved').length,
    totalOnHold: user.bills.filter(bill => bill.billStage.label === 'On Hold').length
  }))
}
