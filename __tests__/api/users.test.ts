import { GET } from '@/app/api/users/route'
import { prisma } from '@/app/lib/prisma'
import type { MockPrismaClient } from '../types/mocks'

// Mock Prisma
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    }
  }
}))

const mockPrisma = prisma as unknown as Pick<MockPrismaClient, 'user'>

// Mock console.error to suppress expected error logs during testing
const originalConsoleError = console.error

describe('/api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to suppress expected error logs during testing
    console.error = jest.fn()
  })

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError
  })

  describe('GET /api/users', () => {
    it('should return all users ordered by creation date descending', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: '2024-01-02T00:00:00.000Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      mockPrisma.user.findMany.mockResolvedValue(mockUsers)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUsers)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    it('should return empty array when no users exist', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.user.findMany.mockRejectedValue(dbError)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
      expect(console.error).toHaveBeenCalledWith('Failed to fetch users:', dbError)
    })

    it('should handle generic database errors', async () => {
      const genericError = new Error('Generic database error')
      mockPrisma.user.findMany.mockRejectedValue(genericError)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Generic database error')
      expect(console.error).toHaveBeenCalledWith('Failed to fetch users:', genericError)
    })

    it('should handle non-Error objects thrown from database', async () => {
      const nonErrorObject = { message: 'Non-Error object thrown' }
      mockPrisma.user.findMany.mockRejectedValue(nonErrorObject)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch users')
      expect(console.error).toHaveBeenCalledWith('Failed to fetch users:', nonErrorObject)
    })

    it('should handle null/undefined errors', async () => {
      mockPrisma.user.findMany.mockRejectedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch users')
      expect(console.error).toHaveBeenCalledWith('Failed to fetch users:', null)
    })

    it('should return users with all expected fields', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      mockPrisma.user.findMany.mockResolvedValue(mockUsers)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('email')
      expect(data[0]).toHaveProperty('createdAt')
    })

    it('should call prisma with correct parameters', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      await GET()

      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    it('should return NextResponse with correct headers', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      const response = await GET()

      expect(response).toBeInstanceOf(Response)
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})
