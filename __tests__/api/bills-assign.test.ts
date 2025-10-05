import { NextRequest } from 'next/server'
import { POST } from '@/app/api/bills/assign/route'
import { prisma } from '@/lib/prisma'
import type { MockPrismaClient } from '../types/mocks'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    bill: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    billStage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}))

const mockPrisma = prisma as unknown as MockPrismaClient

// Mock console.error to suppress expected error logs during testing
const originalConsoleError = console.error

describe('/api/bills/assign', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to suppress expected error logs during testing
    console.error = jest.fn()

    // Mock $transaction to execute the callback with the same mocked prisma client
    mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrisma)
    })
  })

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError
  })

  describe('POST /api/bills/assign', () => {
    it('should assign a specific bill to a user successfully', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockAssignableStages = [
        { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' }
      ]
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' },
        submittedAt: new Date('2024-01-01') // Already has submittedAt
      }
      const mockUpdatedBill = {
        ...mockBill,
        assignedToId: 'user1',
        assignedTo: mockUser,
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' }
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(2) // User has 2 bills currently
      mockPrisma.billStage.findMany.mockResolvedValue(mockAssignableStages)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue(mockUpdatedBill)

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Bill assigned successfully')
      expect(data.bill.assignedTo.id).toBe('user1')
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: {
          assignedToId: 'user1'
        },
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
        }
      })
    })

    it('should prevent assignment when user already has 3 bills', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(3) // User already has 3 bills
      mockPrisma.billStage.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('User already has the maximum of 3 bills assigned')
    })

    it('should reject assignment of non-assignable stage bills', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockAssignableStages = [
        { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' }
      ]
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'approved-stage',
        billStage: { id: 'approved-stage', label: 'Approved', colour: '#10B981' } // Not assignable stage
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.billStage.findMany.mockResolvedValue(mockAssignableStages)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bill must be in Draft or Submitted stage to be assigned')
    })

    it('should assign a specific Draft stage bill to a user successfully', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockAssignableStages = [
        { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' }
      ]
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        submittedAt: null
      }
      const mockUpdatedBill = {
        ...mockBill,
        assignedToId: 'user1',
        assignedTo: mockUser,
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#9CA3AF' }
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1) // User has 1 bill currently
      mockPrisma.billStage.findMany.mockResolvedValue(mockAssignableStages)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue(mockUpdatedBill)

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Bill assigned successfully')
      expect(data.bill.assignedTo.id).toBe('user1')
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: {
          assignedToId: 'user1'
          // No submittedAt for Draft stage bills
        },
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
        }
      })
    })

    it('should reject assignment of bills in non-assignable stages', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockAssignableStages = [
        { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' }
      ]
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'approved-stage',
        billStage: { id: 'approved-stage', label: 'Approved', colour: '#10B981' } // Not assignable
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.billStage.findMany.mockResolvedValue(mockAssignableStages)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bill must be in Draft or Submitted stage to be assigned')
    })


    it('should handle missing user', async () => {
      const requestBody = {
        userId: 'non-existent-user',
        billId: 'bill1'
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should validate required userId field', async () => {
      const requestBody = { billId: 'bill1' }

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('userId is required')
    })

    it('should validate required billId field', async () => {
      const requestBody = { userId: 'user1' }

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('billId is required')
    })


    it('should handle database errors during assignment', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.bill.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to assign bill')
    })

    it('should handle submitted bills without submittedAt and set timestamp', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockAssignableStages = [
        { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' }
      ]
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' },
        submittedAt: null // No submittedAt timestamp yet
      }
      const mockUpdatedBill = {
        ...mockBill,
        assignedToId: 'user1',
        assignedTo: mockUser,
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' }
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.billStage.findMany.mockResolvedValue(mockAssignableStages)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue(mockUpdatedBill)

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Bill assigned successfully')
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: {
          assignedToId: 'user1',
          submittedAt: expect.any(Date)
        },
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
        }
      })
    })

  })
})