import fs from 'fs'
import path from 'path'

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...')

  try {
    // Get the test database path from environment variable
    const testDbPath = process.env.E2E_TEST_DB_PATH || path.join(process.cwd(), 'prisma', 'test-e2e.db')

    // Remove the test database file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
      console.log('🗑️  Removed E2E test database')
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