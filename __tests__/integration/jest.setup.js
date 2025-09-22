// Integration test Jest setup - environment configuration for integration tests

// Set test environment variables for integration tests
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'

// Increase timeout for integration tests (database operations can be slower)
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000)
}