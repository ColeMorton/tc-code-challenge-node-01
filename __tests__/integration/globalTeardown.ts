import path from 'path'
import fs from 'fs'

export default async function globalTeardown() {
  console.log('🧹 Cleaning up integration test environment...')

  const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')

  // Remove test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
    console.log('🗑️  Removed test database')
  }

  // Remove any temporary files created during testing
  const tempFiles = [
    path.join(process.cwd(), 'prisma', 'test.db-journal'),
    path.join(process.cwd(), 'prisma', 'test.db-wal'),
    path.join(process.cwd(), 'prisma', 'test.db-shm')
  ]

  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
      console.log(`🗑️  Removed ${path.basename(file)}`)
    }
  })

  console.log('✅ Integration test cleanup complete!')
}