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

  // Set E2E test database URL
  process.env.DATABASE_URL = `file:${testDbPath}`

  try {
    // Remove existing test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
      console.log('🗑️  Removed existing E2E test database')
    }

    // Generate Prisma client
    console.log('⚙️  Generating Prisma client...')
    await execAsync('npx prisma generate')

    // Push database schema
    console.log('📋 Creating E2E test database schema...')
    await execAsync('npx prisma db push --force-reset')

    // Seed the database
    console.log('🌱 Seeding E2E test database...')
    await execAsync('npm run db:seed')

    console.log('✅ E2E test environment ready!')

    // Store the database path for teardown
    process.env.E2E_TEST_DB_PATH = testDbPath

  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error)
    process.exit(1)
  } finally {
    // Restore original DATABASE_URL
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv
    }
  }
}

export default globalSetup