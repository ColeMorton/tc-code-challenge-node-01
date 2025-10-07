import { GET } from '@/app/api/users/route'
import { resetDatabase, testPrisma } from '@/__tests__/integration/testUtils'
import type { User } from '@/app/lib/definitions'

describe('Users API Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('GET /api/users', () => {
    it('should return all users from the database', async () => {
      // Get the seeded users from the database
      const users = await testPrisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      })

      expect(users.length).toBeGreaterThan(0)

      // Test the API endpoint
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(users.length)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('email')
      expect(data[0]).toHaveProperty('createdAt')
    })

    it('should return users ordered by creation date descending', async () => {
      // Create additional test users with specific creation dates
      const user1 = await testPrisma.user.create({
        data: {
          name: 'First User',
          email: 'first@example.com',
          createdAt: new Date('2024-01-01T10:00:00Z')
        }
      })

      const user2 = await testPrisma.user.create({
        data: {
          name: 'Second User',
          email: 'second@example.com',
          createdAt: new Date('2024-01-01T11:00:00Z')
        }
      })

      // Test the API endpoint
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Find our test users in the response
      const firstUser = data.find((u: User) => u.id === user1.id)
      const secondUser = data.find((u: User) => u.id === user2.id)

      expect(firstUser).toBeDefined()
      expect(secondUser).toBeDefined()

      // Second user should come before first user (descending order)
      const secondUserIndex = data.findIndex((u: User) => u.id === user2.id)
      const firstUserIndex = data.findIndex((u: User) => u.id === user1.id)
      
      expect(secondUserIndex).toBeLessThan(firstUserIndex)
    })

    it('should handle database connection issues gracefully', async () => {
      // This test verifies error handling in the API route
      // We'll mock the prisma call to simulate a database error
      const originalFindMany = testPrisma.user.findMany
      testPrisma.user.findMany = jest.fn().mockRejectedValue(new Error('Database connection failed'))

      try {
        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toContain('Database connection failed')
      } finally {
        // Restore original method
        testPrisma.user.findMany = originalFindMany
      }
    })

    it('should return consistent data structure', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        const user = data[0]
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('name')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')

        // Verify data types
        expect(typeof user.id).toBe('string')
        expect(typeof user.name).toBe('string')
        expect(typeof user.email).toBe('string')
        expect(user.createdAt).toBeDefined()
        expect(user.updatedAt).toBeDefined()
      }
    })

    it('should handle empty database gracefully', async () => {
      // Clear all users from the database
      await testPrisma.user.deleteMany()

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should maintain referential integrity with other entities', async () => {
      // Get users and verify they can be referenced by bills
      const users = await testPrisma.user.findMany()
      expect(users.length).toBeGreaterThan(0)

      const testUser = users[0]

      // Get the first available bill stage
      const billStage = await testPrisma.billStage.findFirst()
      expect(billStage).toBeDefined()

      // Create a bill assigned to this user
      const bill = await testPrisma.bill.create({
        data: {
          billReference: 'TEST-REF-001',
          billDate: new Date(),
          billStageId: billStage!.id,
          assignedToId: testUser.id
        }
      })

      // Verify the relationship works
      const billWithUser = await testPrisma.bill.findUnique({
        where: { id: bill.id },
        include: { assignedTo: true }
      })

      expect(billWithUser?.assignedTo?.id).toBe(testUser.id)

      // Test the API still works correctly
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.find((u: User) => u.id === testUser.id)).toBeDefined()
    })

    it('should handle concurrent requests correctly', async () => {
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => GET())
      
      const responses = await Promise.all(promises)
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // All responses should have the same data (excluding timestamps)
      const firstData = await responses[0].json()
      for (let i = 1; i < responses.length; i++) {
        const data = await responses[i].json()
        
        // Compare data excluding timestamp fields that may vary between requests
        const normalizeData = (users: User[]) => users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
          // Exclude updatedAt as it may change between concurrent requests
        }))
        
        expect(normalizeData(data)).toEqual(normalizeData(firstData))
      }
    })
  })
})
