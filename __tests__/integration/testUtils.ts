import { PrismaClient } from '@prisma/client'

// Create a separate Prisma client for integration tests
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
})

/**
 * Reset database to clean state for test isolation
 * This function clears all data and reseeds the database
 */
export async function resetDatabase() {
  // Only clear bills to reset test state
  // Users and stages persist across tests for performance
  await testPrisma.bill.deleteMany()

  // Ensure required data exists (idempotent)
  await seedRequiredData()
}

/**
 * Seed the database with required test data (idempotent)
 */
export async function seedRequiredData() {
  // Create bill stages only if they don't exist
  const billStageData = [
    { label: 'Draft', colour: '#9CA3AF' },
    { label: 'Submitted', colour: '#3B82F6' },
    { label: 'Approved', colour: '#10B981' },
    { label: 'Paying', colour: '#F59E0B' },
    { label: 'On Hold', colour: '#EF4444' },
    { label: 'Rejected', colour: '#DC2626' },
    { label: 'Paid', colour: '#059669' }
  ]

  const stages = []
  for (const stageData of billStageData) {
    const existing = await testPrisma.billStage.findUnique({
      where: { label: stageData.label }
    })
    if (!existing) {
      const created = await testPrisma.billStage.create({ data: stageData })
      stages.push(created)
    } else {
      stages.push(existing)
    }
  }

  // Create test users only if they don't exist
  const userData = [
    { name: 'Test User 1', email: 'test1@example.com' },
    { name: 'Test User 2', email: 'test2@example.com' },
    { name: 'Test User 3', email: 'test3@example.com' },
    { name: 'Test User 4', email: 'test4@example.com' },
    { name: 'Test User 5', email: 'test5@example.com' }
  ]

  const users = []
  for (const user of userData) {
    const existing = await testPrisma.user.findUnique({
      where: { email: user.email }
    })
    if (!existing) {
      const created = await testPrisma.user.create({ data: user })
      users.push(created)
    } else {
      users.push(existing)
    }
  }

  return {
    stages,
    users
  }
}

/**
 * Create a test bill with specified properties
 */
export async function createTestBill(
  billReference: string,
  billStageLabel: string = 'Draft',
  assignedToId?: string
) {
  const stage = await testPrisma.billStage.findFirst({
    where: { label: billStageLabel }
  })

  if (!stage) {
    throw new Error(`Bill stage '${billStageLabel}' not found`)
  }

  interface BillCreateData {
    billReference: string
    billDate: Date
    billStageId: string
    assignedToId?: string
    submittedAt?: Date
    approvedAt?: Date
    onHoldAt?: Date
  }

  const billData: BillCreateData = {
    billReference,
    billDate: new Date(),
    billStageId: stage.id
  }

  if (assignedToId) {
    billData.assignedToId = assignedToId
  }

  // Set stage-specific timestamps
  if (['Submitted', 'Approved', 'Paying', 'On Hold', 'Rejected', 'Paid'].includes(billStageLabel)) {
    billData.submittedAt = new Date()
  }

  if (['Approved', 'Paying', 'Paid'].includes(billStageLabel)) {
    billData.approvedAt = new Date()
  }

  if (billStageLabel === 'On Hold') {
    billData.onHoldAt = new Date()
  }

  return await testPrisma.bill.create({
    data: billData,
    include: {
      assignedTo: true,
      billStage: true
    }
  })
}

/**
 * Get test data for specific scenarios
 */
export async function getTestData() {
  const stages = await testPrisma.billStage.findMany()
  const users = await testPrisma.user.findMany()

  return {
    draftStage: stages.find(s => s.label === 'Draft')!,
    submittedStage: stages.find(s => s.label === 'Submitted')!,
    approvedStage: stages.find(s => s.label === 'Approved')!,
    users
  }
}

/**
 * Cleanup function to close the test database connection
 */
export async function cleanupTestDatabase() {
  await testPrisma.$disconnect()
}