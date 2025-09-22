import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/bills/route'
import { prisma } from '@/lib/prisma'
import type { MockPrismaClient } from '../types/mocks'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    bill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    billStage: {
      findFirst: jest.fn(),
    }
  }
}))

const mockPrisma = prisma as unknown as MockPrismaClient

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
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/bills', () => {
    it('should create a new bill successfully', async () => {
      const requestBody = {
        billReference: 'BILL-TEST-001',
        billDate: '2024-01-01',
        assignedToId: 'user1'
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft', colour: '#6B7280' }
      const mockCreatedBill = {
        id: 'new-bill-id',
        ...requestBody,
        billDate: new Date(requestBody.billDate),
        billStageId: mockDraftStage.id,
        assignedTo: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#9CA3AF' }
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockCreatedBill)

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.billReference).toBe(requestBody.billReference)
      expect(mockPrisma.bill.findUnique).toHaveBeenCalledWith({
        where: { billReference: requestBody.billReference }
      })
      expect(mockPrisma.billStage.findFirst).toHaveBeenCalledWith({
        where: { label: 'Draft' }
      })
    })

    it('should reject duplicate bill references', async () => {
      const requestBody = {
        billReference: 'BILL-DUPLICATE',
        billDate: '2024-01-01',
        assignedToId: 'user1'
      }

      const existingBill = { id: 'existing-id', billReference: 'BILL-DUPLICATE', billDate: new Date('2024-01-01'), billStageId: 'draft-stage' }
      mockPrisma.bill.findUnique.mockResolvedValue(existingBill)

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Bill reference already exists')
    })

    it('should validate required fields', async () => {
      const requestBody = {
        billReference: '',
        billDate: '',
        assignedToId: ''
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bill reference is required')
    })

    it('should create bill without assignment when assignedToId is not provided', async () => {
      const requestBody = {
        billReference: 'BILL-UNASSIGNED-001',
        billDate: '2024-01-01'
        // No assignedToId
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft', colour: '#6B7280' }
      const mockCreatedBill = {
        id: 'new-bill-id',
        ...requestBody,
        billDate: new Date(requestBody.billDate),
        billStageId: mockDraftStage.id,
        assignedToId: null,
        assignedTo: null,
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#9CA3AF' }
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockCreatedBill)

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.billReference).toBe(requestBody.billReference)
      expect(data.assignedTo).toBeNull()
      expect(mockPrisma.bill.create).toHaveBeenCalledWith({
        data: {
          billReference: requestBody.billReference,
          billDate: new Date(requestBody.billDate),
          billStageId: mockDraftStage.id,
          assignedToId: null
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

    it('should handle missing draft stage', async () => {
      const requestBody = {
        billReference: 'BILL-TEST-002',
        billDate: '2024-01-01',
        assignedToId: 'user1'
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Draft stage not found')
    })

    it('should handle invalid date formats gracefully', async () => {
      const requestBody = {
        billReference: 'BILL-INVALID-DATE',
        billDate: 'invalid-date'
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid date format')
    })

    it('should handle very long bill references', async () => {
      const longBillReference = 'BILL-' + 'A'.repeat(300) // Very long reference
      const requestBody = {
        billReference: longBillReference,
        billDate: '2024-01-01'
      }

      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bill reference must be less than 100 characters')
    })

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/bills', {
        method: 'POST',
        body: '{ invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})