import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...')

  // Use a separate test database for E2E tests
  const testDbPath = path.join(process.cwd(), 'prisma', 'test-e2e.db')
  const originalEnv = process.env.DATABASE_URL

  // Set E2E test database URL - this persists for the entire test run
  process.env.DATABASE_URL = `file:${testDbPath}`

  // Set Prisma consent for test environment
  process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION = 'yes'

  try {
    const dbExists = fs.existsSync(testDbPath)

    if (!dbExists) {
      // Only create database if it doesn't exist
      console.log('📋 Creating E2E test database...')

      // Generate Prisma client
      console.log('⚙️  Generating Prisma client...')
      await execAsync('npx prisma generate')

      // Push database schema
      await execAsync('npx prisma db push --force-reset')

      // Seed the database
      console.log('🌱 Seeding E2E test database...')
      await execAsync('npm run db:seed')
    } else {
      // Database exists - just clean up test data
      console.log('🧹 Cleaning up test bills from previous run...')
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
        console.log('✅ Test bills cleaned up')
      } finally {
        await prisma.$disconnect()
      }
    }

    console.log('✅ E2E test environment ready!')

    // Store the database path for teardown
    process.env.E2E_TEST_DB_PATH = testDbPath
    process.env.E2E_ORIGINAL_DATABASE_URL = originalEnv || ''

  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error)
    process.exit(1)
  }
}

export default globalSetup