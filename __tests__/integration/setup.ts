// Set test environment variables for integration tests
// @ts-expect-error NODE_ENV is readonly in type definition but writable at runtime
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'

// Increase timeout for integration tests
jest.setTimeout(30000)

// Mock Prisma client for integration tests
// This allows server actions to use the test database
jest.mock('@/lib/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { testPrisma } = require('./testUtils')
  return {
    prisma: testPrisma
  }
})