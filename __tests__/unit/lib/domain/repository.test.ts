import {
  getBills,
  getUsers,
  fetchTotalNumberSubmittedBills,
  fetchTotalNumberApprovedBills,
  fetchTotalNumberOnHoldBills,
  fetchUserBillsSummary
} from '@/app/lib/domain/bills/repository'
import { prisma } from '@/app/lib/infrastructure'
import type { MockPrismaClient } from '@/app/lib/types'

// Mock Prisma client
jest.mock('@/app/lib/infrastructure', () => ({
  prisma: {
    bill: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  }
}))

const mockPrisma = prisma as unknown as MockPrismaClient

describe('Repository Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getBills', () => {
    it('should fetch bills with correct includes and ordering', async () => {
      const mockBills = [
        {
          id: '1',
          billReference: 'BILL-001',
          billDate: '2024-01-01T00:00:00.000Z',
          billStageId: 'stage1',
          assignedToId: 'user1',
          assignedTo: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
          billStage: { id: 'stage1', label: 'Draft' }
        }
      ]

      mockPrisma.bill.findMany.mockResolvedValue(mockBills)

      const result = await getBills()

      expect(result).toEqual(mockBills)
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
              label: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.bill.findMany.mockRejectedValue(dbError)

      await expect(getBills()).rejects.toThrow('Database connection failed')
    })
  })

  describe('getUsers', () => {
    it('should fetch users with correct ordering', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date('2024-01-01T00:00:00.000Z')
        }
      ]

      mockPrisma.user.findMany.mockResolvedValue(mockUsers)

      const result = await getUsers()

      expect(result).toEqual(mockUsers)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.user.findMany.mockRejectedValue(dbError)

      await expect(getUsers()).rejects.toThrow('Database connection failed')
    })
  })

  describe('fetchTotalNumberSubmittedBills', () => {
    it('should count submitted bills correctly', async () => {
      mockPrisma.bill.count.mockResolvedValue(5)

      const result = await fetchTotalNumberSubmittedBills()

      expect(result).toBe(5)
      expect(mockPrisma.bill.count).toHaveBeenCalledWith({
        where: {
          billStage: {
            label: 'Submitted'
          }
        }
      })
    })

    it('should return 0 when no submitted bills exist', async () => {
      mockPrisma.bill.count.mockResolvedValue(0)

      const result = await fetchTotalNumberSubmittedBills()

      expect(result).toBe(0)
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.bill.count.mockRejectedValue(dbError)

      await expect(fetchTotalNumberSubmittedBills()).rejects.toThrow('Database connection failed')
    })
  })

  describe('fetchTotalNumberApprovedBills', () => {
    it('should count approved bills correctly', async () => {
      mockPrisma.bill.count.mockResolvedValue(3)

      const result = await fetchTotalNumberApprovedBills()

      expect(result).toBe(3)
      expect(mockPrisma.bill.count).toHaveBeenCalledWith({
        where: {
          billStage: {
            label: 'Approved'
          }
        }
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.bill.count.mockRejectedValue(dbError)

      await expect(fetchTotalNumberApprovedBills()).rejects.toThrow('Database connection failed')
    })
  })

  describe('fetchTotalNumberOnHoldBills', () => {
    it('should count on hold bills correctly', async () => {
      mockPrisma.bill.count.mockResolvedValue(2)

      const result = await fetchTotalNumberOnHoldBills()

      expect(result).toBe(2)
      expect(mockPrisma.bill.count).toHaveBeenCalledWith({
        where: {
          billStage: {
            label: 'On Hold'
          }
        }
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.bill.count.mockRejectedValue(dbError)

      await expect(fetchTotalNumberOnHoldBills()).rejects.toThrow('Database connection failed')
    })
  })

  describe('fetchUserBillsSummary', () => {
    it('should return user bills summary with correct data transformation', async () => {
      const mockUsers = [
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          bills: [
            {
              id: 'bill1',
              billStage: { label: 'Submitted' }
            },
            {
              id: 'bill2',
              billStage: { label: 'Approved' }
            },
            {
              id: 'bill3',
              billStage: { label: 'On Hold' }
            },
            {
              id: 'bill4',
              billStage: { label: 'Draft' }
            }
          ]
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          bills: []
        }
      ]

      mockPrisma.user.findMany.mockResolvedValue(mockUsers)

      const result = await fetchUserBillsSummary()

      expect(result).toEqual([
        {
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          totalBills: 4,
          totalSubmitted: 1,
          totalApproved: 1,
          totalOnHold: 1
        },
        {
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          totalBills: 0,
          totalSubmitted: 0,
          totalApproved: 0,
          totalOnHold: 0
        }
      ])

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        include: {
          bills: {
            include: {
              billStage: true
            }
          }
        }
      })
    })

    it('should handle empty users list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      const result = await fetchUserBillsSummary()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.user.findMany.mockRejectedValue(dbError)

      await expect(fetchUserBillsSummary()).rejects.toThrow('Database connection failed')
    })

    it('should handle users with no bills', async () => {
      const mockUsers = [
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          bills: []
        }
      ]

      mockPrisma.user.findMany.mockResolvedValue(mockUsers)

      const result = await fetchUserBillsSummary()

      expect(result).toEqual([
        {
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          totalBills: 0,
          totalSubmitted: 0,
          totalApproved: 0,
          totalOnHold: 0
        }
      ])
    })
  })
})
