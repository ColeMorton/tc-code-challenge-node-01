// Set test environment variables for integration tests
// @ts-expect-error NODE_ENV is readonly in type definition but writable at runtime
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'

// Increase timeout for integration tests
jest.setTimeout(30000)