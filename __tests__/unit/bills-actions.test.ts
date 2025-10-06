import { validateBillReference, createBill, assignBillAction } from '@/app/bills/actions'
import { prisma } from '@/app/lib/prisma'
import type { MockPrismaClient } from '../types/mocks'
import { revalidatePath } from 'next/cache'

// Mock Prisma
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    bill: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billStage: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}))

// Mock Next.js revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

const mockPrisma = prisma as unknown as MockPrismaClient
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>

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

  describe('assignBillAction', () => {
    beforeEach(() => {
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
    })

    it('should assign a bill to a user successfully', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(2)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'user1' })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: { assignedToId: 'user1' }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/bills')
    })

    it('should return error when userId is missing', async () => {
      const input = { billId: 'bill1', userId: '' }

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('userId is required')
    })

    it('should return error when billId is missing', async () => {
      const input = { billId: '', userId: 'user1' }

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('billId is required')
    })

    it('should return error when user not found', async () => {
      const input = { billId: 'bill1', userId: 'user1' }

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('should return error when user already has 3 bills', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(3)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already has the maximum of 3 bills assigned')
    })

    it('should return error when bill not found', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.bill.findUnique.mockResolvedValue(null)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bill not found')
    })

    it('should return error when bill is already assigned', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        submittedAt: null,
        assignedToId: 'user2'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bill is already assigned')
    })

    it('should return error when bill is not in Draft or Submitted stage', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'approved-stage',
        billStage: { id: 'approved-stage', label: 'Approved', colour: '#10B981' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bill must be in Draft or Submitted stage to be assigned')
    })

    it('should set submittedAt timestamp when assigning Submitted bill without timestamp', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'user1', submittedAt: new Date() })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: {
          assignedToId: 'user1',
          submittedAt: expect.any(Date)
        }
      })
    })

    it('should not set submittedAt when already exists', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const existingDate = new Date('2024-01-01')
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted', colour: '#3B82F6' },
        submittedAt: existingDate,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'user1' })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: { assignedToId: 'user1' }
      })
    })

    it('should retry on race condition and succeed', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'user1' })

      let callCount = 0
      mockPrisma.bill.count.mockImplementation(async () => {
        callCount++
        if (callCount === 2) return 4
        return 2
      })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
      expect(mockPrisma.bill.count.mock.calls.length).toBeGreaterThanOrEqual(4)
    })

    it('should fail after max retries on persistent race condition', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }
      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft', colour: '#6B7280' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'user1' })

      let callCount = 0
      mockPrisma.bill.count.mockImplementation(async () => {
        callCount++
        if (callCount % 2 === 0) return 4
        return 2
      })

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('concurrent updates')
    })

    it('should handle database errors', async () => {
      const input = { billId: 'bill1', userId: 'user1' }
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.count.mockResolvedValue(1)
      mockPrisma.bill.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })
})
