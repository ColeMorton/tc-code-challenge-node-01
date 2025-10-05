import { GET } from '@/app/api/bills/route'
import { prisma } from '@/lib/prisma'
import type { MockPrismaClient } from '../types/mocks'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    bill: {
      findMany: jest.fn(),
    }
  }
}))

const mockPrisma = prisma as unknown as Pick<MockPrismaClient, 'bill'>

// Mock console.error to suppress expected error logs during testing
const originalConsoleError = console.error

describe('/api/bills', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to suppress expected error logs during testing
    console.error = jest.fn()
  })

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError
  })

  describe('GET /api/bills', () => {
    it('should return all bills with related data', async () => {
      const mockBills = [
        {
          id: '1',
          billReference: 'BILL-0001',
          billDate: '2024-01-01T00:00:00.000Z',
          billStageId: 'stage1',
          assignedToId: 'user1',
          assignedTo: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
          billStage: { id: 'stage1', label: 'Draft', colour: '#9CA3AF' }
        }
      ]

      mockPrisma.bill.findMany.mockResolvedValue(mockBills)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockBills)
      expect(mockPrisma.bill.findMany).toHaveBeenCalledWith({
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          billStage: {
            select: {
              id: true,
              label: true,
              colour: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    it('should handle database errors', async () => {
      mockPrisma.bill.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch bills')
    })
  })
})