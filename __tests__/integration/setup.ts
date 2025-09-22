// Set test environment variables for integration tests
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'

// Increase timeout for integration tests
jest.setTimeout(30000)