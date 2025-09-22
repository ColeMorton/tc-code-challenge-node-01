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

    console.log('✅ E2E test cleanup complete!')
  } catch (error) {
    console.error('❌ Error during E2E test cleanup:', error)
    // Don't fail the tests because of cleanup issues
  }
}

export default globalTeardown