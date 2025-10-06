import { PrismaClient } from '@prisma/client'
import path from 'path'

let prisma: PrismaClient | null = null

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(process.cwd(), 'prisma', 'test-e2e.db')}`
        }
      }
    })
  }
  return prisma
}

/**
 * Clean up test bills created during tests
 */
export async function cleanupTestBills() {
  const client = getPrismaClient()
  await client.bill.deleteMany({
    where: {
      billReference: { startsWith: 'TEST-BILL-' }
    }
  })
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}
