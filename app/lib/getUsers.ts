import { prisma } from '@/app/lib/prisma'

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}
