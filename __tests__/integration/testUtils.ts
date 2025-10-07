import { PrismaClient } from '@prisma/client'

// Create a separate Prisma client for integration tests with optimized connection settings
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  },
  // Optimize for testing environment
  log: process.env.NODE_ENV === 'test' ? ['error'] : ['query', 'info', 'warn', 'error'],
})


/**
 * Reset database to clean state for test isolation
 * This function uses a lightweight approach to avoid database locks
 */
export async function resetDatabase() {
  try {
    // Clear only bills to avoid foreign key issues
    await testPrisma.bill.deleteMany()
    
    // Ensure required test data exists (idempotent)
    await seedRequiredData()
  } catch (error) {
    console.error('Database reset failed:', error)
    throw error
  }
}

/**
 * Seed the database with required test data (idempotent)
 * Uses simple upsert operations to avoid race conditions
 */
export async function seedRequiredData() {
  try {
    // Create bill stages using upsert to handle race conditions
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
      const stage = await testPrisma.billStage.upsert({
        where: { label: stageData.label },
        update: stageData,
        create: stageData
      })
      stages.push(stage)
    }

    // Create test users using upsert to handle race conditions
    const userData = [
      { name: 'Test User 1', email: 'test1@example.com' },
      { name: 'Test User 2', email: 'test2@example.com' },
      { name: 'Test User 3', email: 'test3@example.com' },
      { name: 'Test User 4', email: 'test4@example.com' },
      { name: 'Test User 5', email: 'test5@example.com' }
    ]

    const users = []
    for (const user of userData) {
      const createdUser = await testPrisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user
      })
      users.push(createdUser)
    }

    return { stages, users }
  } catch (error) {
    console.error('Seed data creation failed:', error)
    throw error
  }
}

/**
 * Create a test bill with specified properties
 */
export async function createTestBill(
  billReference: string,
  billStageLabel: string = 'Draft',
  assignedToId?: string,
  billDate?: Date
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
    billDate: billDate || new Date(),
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
  // Ensure required data is seeded first
  await seedRequiredData()
  
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