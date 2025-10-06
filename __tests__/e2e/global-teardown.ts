import fs from 'fs'
import path from 'path'

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...')

  try {
    // Get the test database path from environment variable
    const testDbPath = process.env.E2E_TEST_DB_PATH || path.join(process.cwd(), 'prisma', 'test-e2e.db')

    // Clean up test bills instead of removing the entire database
    // This allows the database to be reused across multiple test runs
    if (fs.existsSync(testDbPath)) {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: `file:${testDbPath}`
          }
        }
      })

      try {
        await prisma.bill.deleteMany({
          where: {
            billReference: { startsWith: 'TEST-BILL-' }
          }
        })
        console.log('🗑️  Cleaned up test bills from E2E database')
      } finally {
        await prisma.$disconnect()
      }
    }

    // Restore original DATABASE_URL
    const originalEnv = process.env.E2E_ORIGINAL_DATABASE_URL
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv
    }

    console.log('✅ E2E test cleanup complete!')
  } catch (error) {
    console.error('❌ Error during E2E test cleanup:', error)
    // Don't fail the tests because of cleanup issues
  }
}

export default globalTeardown