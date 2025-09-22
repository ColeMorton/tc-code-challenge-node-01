import { NextRequest } from 'next/server'
import { GET } from '@/app/api/bills/validate/route'
import { prisma } from '@/lib/prisma'
import type { MockPrismaClient } from '../types/mocks'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    bill: {
      findUnique: jest.fn(),
    }
  }
}))

const mockPrisma = prisma as Pick<MockPrismaClient, 'bill'>

// Mock console.error to suppress expected error logs during testing
const originalConsoleError = console.error

describe('/api/bills/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to suppress expected error logs during testing
    console.error = jest.fn()
  })

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError
  })

  describe('GET /api/bills/validate', () => {
    it('should return isValid: true when bill reference does not exist', async () => {
      const billReference = 'BILL-NEW-001'

      mockPrisma.bill.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/bills/validate?billReference=${billReference}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        exists: false,
        isValid: true
      })
      expect(mockPrisma.bill.findUnique).toHaveBeenCalledWith({
        where: { billReference }
      })
    })

    it('should return isValid: false when bill reference already exists', async () => {
      const billReference = 'BILL-EXISTING-001'
      const existingBill = {
        id: 'existing-id',
        billReference,
        billDate: new Date(),
        billStageId: 'stage1',
        assignedToId: 'user1'
      }

      mockPrisma.bill.findUnique.mockResolvedValue(existingBill)

      const request = new NextRequest(`http://localhost:3000/api/bills/validate?billReference=${billReference}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        exists: true,
        isValid: false
      })
    })

    it('should return error when billReference parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/bills/validate')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('billReference parameter is required')
    })

    it('should handle database errors', async () => {
      const billReference = 'BILL-ERROR-001'

      mockPrisma.bill.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest(`http://localhost:3000/api/bills/validate?billReference=${billReference}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to validate bill reference')
    })

    it('should handle URL encoded bill references', async () => {
      const billReference = 'BILL-TEST 001' // Contains space
      const encodedBillReference = encodeURIComponent(billReference)

      mockPrisma.bill.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/bills/validate?billReference=${encodedBillReference}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(true)
      expect(mockPrisma.bill.findUnique).toHaveBeenCalledWith({
        where: { billReference }
      })
    })
  })
})