import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

export default async function globalSetup() {
  // Set test environment variables
  // @ts-expect-error NODE_ENV is readonly in type definition but writable at runtime
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'file:./test.db'

  const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')

  // Remove existing test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
    console.log('🗑️  Removed existing test database')
  }

  try {
    // Generate Prisma client for test environment
    execSync('npx prisma generate', { stdio: 'pipe' })
    console.log('✅ Generated Prisma client')

    // Push database schema to test database
    execSync('npx prisma db push --force-reset', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    })
    console.log('✅ Created test database schema')

    // Apply corrected database constraints/triggers
    execSync('npx prisma db execute --file prisma/migrations/20241007000000_add_bill_limit_triggers/migration.sql --schema prisma/schema.prisma', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    })
    console.log('✅ Applied corrected database constraints')

    // Seed test database with required data
    const seedCommand = 'tsx prisma/seed.ts'
    execSync(seedCommand, {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    })
    console.log('✅ Seeded test database')

  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }

  console.log('🚀 Integration test environment ready!')
}
