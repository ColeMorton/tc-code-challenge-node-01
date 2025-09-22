import { GET } from '@/app/api/users/route'
import { resetDatabase, testPrisma, getTestData, cleanupTestDatabase } from '../testUtils'

// Types for API response data
interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

// Mock the main prisma instance to use our test database
jest.mock('@/lib/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { testPrisma } = require('../testUtils')
  return {
    prisma: testPrisma
  }
})

afterAll(async () => {
  await cleanupTestDatabase()
})

describe('Users API Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('GET /api/users - User Retrieval Integration', () => {
    it('should retrieve all users ordered by creation date (desc)', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)

      // Test if data is array before checking length
      if (Array.isArray(data)) {
        expect(data.length > 0).toBe(true) // Should have seeded users
      } else {
        throw new Error(`Expected data to be an array, got ${typeof data}: ${JSON.stringify(data)}`)
      }

      // Verify user structure
      (data as User[]).forEach((user: User) => {
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('name')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')
        expect(typeof user.id).toBe('string')
        expect(typeof user.name).toBe('string')
        expect(typeof user.email).toBe('string')
        expect(user.email).toContain('@') // Basic email validation
      })

      // Verify ordering (newest first)
      if (data.length > 1) {
        const users = data as User[]
        for (let i = 0; i < users.length - 1; i++) {
          const currentDate = new Date(users[i].createdAt)
          const nextDate = new Date(users[i + 1].createdAt)
          expect(currentDate.getTime() >= nextDate.getTime()).toBe(true)
        }
      }
    })

    it('should handle empty database gracefully', async () => {
      // Clear all users
      await testPrisma.user.deleteMany()

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })

    it('should return all seeded users with correct data types', async () => {
      const { users: testUsers } = await getTestData()

      const response = await GET()
      const data = await response.json() as User[]

      expect(response.status).toBe(200)
      expect(data.length).toBe(testUsers.length)

      // Verify all test users are present
      testUsers.forEach(testUser => {
        const foundUser = data.find(u => u.id === testUser.id)
        expect(foundUser).toBeDefined()
        expect(foundUser!.name).toBe(testUser.name)
        expect(foundUser!.email).toBe(testUser.email)
      })
    })

    it('should maintain data consistency with database', async () => {
      // Get data from API
      const response = await GET()
      const apiData = await response.json() as User[]

      // Get data directly from database
      const dbUsers = await testPrisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      })

      expect(response.status).toBe(200)
      expect(apiData.length).toBe(dbUsers.length)

      // Verify each user matches
      apiData.forEach((apiUser, index) => {
        const dbUser = dbUsers[index]
        expect(apiUser.id).toBe(dbUser.id)
        expect(apiUser.name).toBe(dbUser.name)
        expect(apiUser.email).toBe(dbUser.email)
        expect(new Date(apiUser.createdAt).getTime()).toBe(dbUser.createdAt.getTime())
        expect(new Date(apiUser.updatedAt).getTime()).toBe(dbUser.updatedAt.getTime())
      })
    })

    it('should handle database errors gracefully', async () => {
      // Mock prisma to throw an error
      const originalFindMany = testPrisma.user.findMany
      testPrisma.user.findMany = jest.fn().mockRejectedValue(new Error('Database connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Database connection failed')

      // Restore original method
      testPrisma.user.findMany = originalFindMany
    })

    it('should return users in correct JSON format', async () => {
      const response = await GET()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      // Verify response can be parsed as JSON
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})