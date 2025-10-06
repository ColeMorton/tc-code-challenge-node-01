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
