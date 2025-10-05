import { validateBillReference, createBill } from '@/app/bills/actions'
import { prisma } from '@/lib/prisma'
import type { MockPrismaClient } from '../types/mocks'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    bill: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    billStage: {
      findFirst: jest.fn(),
    }
  }
}))

// Mock Next.js revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

const mockPrisma = prisma as unknown as MockPrismaClient

describe('Bills Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateBillReference', () => {
    it('should return isValid: true for empty bill reference', async () => {
      const result = await validateBillReference('')

      expect(result).toEqual({ isValid: true })
      expect(mockPrisma.bill.findUnique).not.toHaveBeenCalled()
    })

    it('should return isValid: true when bill reference does not exist', async () => {
      mockPrisma.bill.findUnique.mockResolvedValue(null)

      const result = await validateBillReference('BILL-NEW-001')

      expect(result).toEqual({
        isValid: true,
        message: 'Available'
      })
      expect(mockPrisma.bill.findUnique).toHaveBeenCalledWith({
        where: { billReference: 'BILL-NEW-001' }
      })
    })

    it('should return isValid: false when bill reference already exists', async () => {
      const existingBill = {
        id: 'existing-id',
        billReference: 'BILL-EXISTING-001',
        billDate: new Date(),
        billStageId: 'stage1',
        assignedToId: 'user1'
      }

      mockPrisma.bill.findUnique.mockResolvedValue(existingBill)

      const result = await validateBillReference('BILL-EXISTING-001')

      expect(result).toEqual({
        isValid: false,
        message: 'Bill reference already exists'
      })
    })

    it('should trim whitespace from bill reference', async () => {
      mockPrisma.bill.findUnique.mockResolvedValue(null)

      const result = await validateBillReference('  ')

      expect(result).toEqual({ isValid: true })
      expect(mockPrisma.bill.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('createBill', () => {
    it('should create a new bill successfully', async () => {
      const input = {
        billReference: 'BILL-TEST-001',
        billDate: '2024-01-01',
        assignedToId: 'user1'
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft', colour: '#6B7280' }
      const mockCreatedBill = {
        id: 'new-bill-id',
        billReference: input.billReference,
        billDate: new Date(input.billDate),
        billStageId: mockDraftStage.id,
        assignedToId: input.assignedToId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockCreatedBill)

      const result = await createBill(input)

      expect(result).toEqual(mockCreatedBill)
      expect(mockPrisma.bill.findUnique).toHaveBeenCalledWith({
        where: { billReference: input.billReference }
      })
      expect(mockPrisma.billStage.findFirst).toHaveBeenCalledWith({
        where: { label: 'Draft' }
      })
      expect(mockPrisma.bill.create).toHaveBeenCalledWith({
        data: {
          billReference: input.billReference,
          billDate: new Date(input.billDate),
          assignedToId: input.assignedToId,
          billStageId: mockDraftStage.id
        }
      })
    })

    it('should create bill without assignment when assignedToId is not provided', async () => {
      const input = {
        billReference: 'BILL-UNASSIGNED-001',
        billDate: '2024-01-01'
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft', colour: '#6B7280' }
      const mockCreatedBill = {
        id: 'new-bill-id',
        billReference: input.billReference,
        billDate: new Date(input.billDate),
        billStageId: mockDraftStage.id,
        assignedToId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockCreatedBill)

      const result = await createBill(input)

      expect(result).toEqual(mockCreatedBill)
      expect(mockPrisma.bill.create).toHaveBeenCalledWith({
        data: {
          billReference: input.billReference,
          billDate: new Date(input.billDate),
          assignedToId: null,
          billStageId: mockDraftStage.id
        }
      })
    })

    it('should throw error when bill reference is empty', async () => {
      const input = {
        billReference: '',
        billDate: '2024-01-01'
      }

      await expect(createBill(input)).rejects.toThrow('Bill reference is required')
    })

    it('should throw error when bill date is empty', async () => {
      const input = {
        billReference: 'BILL-TEST-001',
        billDate: ''
      }

      await expect(createBill(input)).rejects.toThrow('Bill date is required')
    })

    it('should throw error when bill reference already exists', async () => {
      const input = {
        billReference: 'BILL-DUPLICATE',
        billDate: '2024-01-01'
      }

      const existingBill = {
        id: 'existing-id',
        billReference: 'BILL-DUPLICATE',
        billDate: new Date(),
        billStageId: 'stage1',
        assignedToId: null
      }

      mockPrisma.bill.findUnique.mockResolvedValue(existingBill)

      await expect(createBill(input)).rejects.toThrow('Bill reference already exists')
    })

    it('should throw error when Draft stage is not found', async () => {
      const input = {
        billReference: 'BILL-TEST-001',
        billDate: '2024-01-01'
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(null)

      await expect(createBill(input)).rejects.toThrow('Draft stage not found')
    })
  })
})
