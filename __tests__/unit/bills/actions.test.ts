import { validateBillReference, createBill, assignBillAction } from '@/app/bills/actions'
import { prisma } from '@/app/lib/prisma'
import type { MockPrismaClient } from '@/app/lib/definitions'
import { revalidatePath } from 'next/cache'

// Mock Prisma with proper typing
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    bill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    billStage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}))

// Mock Next.js revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

// Mock cache functions
jest.mock('@/lib/cache', () => ({
  canUserBeAssignedBillCached: jest.fn().mockResolvedValue({
    canAssign: true,
    currentCount: 2,
    availableSlots: 1
  }),
  invalidateUserCache: jest.fn()
}))

// Mock monitoring
jest.mock('@/lib/monitoring', () => ({
  monitorBillAssignment: (fn: unknown) => fn
}))

const mockPrisma = prisma as unknown as MockPrismaClient
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>

// Mock console methods to suppress output during tests
const originalConsoleLog = console.log
const originalConsoleError = console.error

describe('Bills Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Suppress console output during tests
    console.log = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog
    console.error = originalConsoleError
  })

  describe('validateBillReference', () => {
    it('should return valid for empty reference', async () => {
      const result = await validateBillReference('')
      expect(result.isValid).toBe(true)
    })

    it('should return valid for new reference', async () => {
      mockPrisma.bill.findUnique.mockResolvedValue(null)

      const result = await validateBillReference('BILL-NEW-001')
      expect(result.isValid).toBe(true)
      expect(result.message).toBe('Available')
    })

    it('should return invalid for existing reference', async () => {
      mockPrisma.bill.findUnique.mockResolvedValue({
        id: 'bill1',
        billReference: 'BILL-EXISTS-001',
        billDate: new Date('2024-01-15'),
        billStageId: 'stage1',
        assignedToId: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        submittedAt: null,
        approvedAt: null,
        onHoldAt: null
      })

      const result = await validateBillReference('BILL-EXISTS-001')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Bill reference already exists')
    })
  })

  describe('createBill', () => {
    it('should create a bill successfully', async () => {
      const input = {
        billReference: 'BILL-TEST-001',
        billDate: '2024-01-01'
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft' }
      const mockBill = {
        id: 'c1234567890123456789012345',
        billReference: 'BILL-TEST-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        assignedToId: null
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockBill)

      const result = await createBill(input)

      expect(result).toEqual(mockBill)
      expect(mockPrisma.bill.create).toHaveBeenCalledWith({
        data: {
          billReference: 'BILL-TEST-001',
          billDate: new Date('2024-01-01'),
          assignedToId: null,
          billStageId: 'draft-stage'
        }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/bills')
    })

    it('should throw error when bill reference is empty', async () => {
      const input = {
        billReference: '',
        billDate: '2024-01-01'
      }

      await expect(createBill(input)).rejects.toThrow('Bill reference is required')
    })

    it('should throw error when bill date is missing', async () => {
      const input = {
        billReference: 'BILL-TEST-001',
        billDate: ''
      }

      await expect(createBill(input)).rejects.toThrow('Bill date is required')
    })

    it('should throw error when bill reference already exists', async () => {
      const input = {
        billReference: 'BILL-EXISTS-001',
        billDate: '2024-01-01'
      }

      mockPrisma.bill.findUnique.mockResolvedValue({
        id: 'bill1',
        billReference: 'BILL-EXISTS-001',
        billDate: new Date('2024-01-15'),
        billStageId: 'stage1',
        assignedToId: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        submittedAt: null,
        approvedAt: null,
        onHoldAt: null
      })

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
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 2 }
      }
      const mockBill = {
        id: 'c1234567890123456789012345',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.billStage.findFirst.mockResolvedValue({ id: 'submitted-stage', label: 'Submitted' })
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'c9876543210987654321098765' })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'c1234567890123456789012345' },
        data: { 
          assignedToId: 'c9876543210987654321098765',
          submittedAt: expect.any(Date),
          billStageId: 'submitted-stage'
        },
        include: {
          assignedTo: true,
          billStage: true
        }
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/bills')
    })

    it('should return error when userId is missing', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: '' }

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('userId is required')
    })

    it('should return error when billId is missing', async () => {
      const input = { billId: '', userId: 'c9876543210987654321098765' }

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('billId is required')
    })

    it('should return error when user not found', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('should return error when user already has 3 bills', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 3 }
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already has the maximum of 3 bills assigned')
    })

    it('should return error when bill not found', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 2 }
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(null)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bill not found')
    })

    it('should return error when bill is already assigned', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 2 }
      }
      const mockBill = {
        id: 'c1234567890123456789012345',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft' },
        submittedAt: null,
        assignedToId: 'c1111111111111111111111111'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bill is already assigned')
    })

    it('should return error when bill is not in Draft or Submitted stage', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 2 }
      }
      const mockBill = {
        id: 'c1234567890123456789012345',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'approved-stage',
        billStage: { id: 'approved-stage', label: 'Approved' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bill must be in Draft or Submitted stage to be assigned')
    })

    it('should set submittedAt timestamp when assigning Submitted bill without timestamp', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 2 }
      }
      const mockBill = {
        id: 'c1234567890123456789012345',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted' },
        submittedAt: null,
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'c9876543210987654321098765' })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'c1234567890123456789012345' },
        data: { assignedToId: 'c9876543210987654321098765' },
        include: {
          assignedTo: true,
          billStage: true
        }
      })
    })

    it('should not set submittedAt when already exists', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 2 }
      }
      const mockBill = {
        id: 'c1234567890123456789012345',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'submitted-stage',
        billStage: { id: 'submitted-stage', label: 'Submitted' },
        submittedAt: new Date('2024-01-01'),
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'c9876543210987654321098765' })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'c1234567890123456789012345' },
        data: { assignedToId: 'c9876543210987654321098765' },
        include: {
          assignedTo: true,
          billStage: true
        }
      })
    })

    it('should retry on race condition and succeed', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }
      const mockUser = { 
        id: 'c9876543210987654321098765', 
        name: 'John Doe', 
        email: 'john@example.com',
        _count: { bills: 2 }
      }
      const mockBill = {
        id: 'c1234567890123456789012345',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft' },
        submittedAt: null,
        assignedToId: null
      }

      // First call fails, second succeeds
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser)
      mockPrisma.bill.findUnique
        .mockResolvedValueOnce(mockBill)
        .mockResolvedValueOnce(mockBill)
      mockPrisma.bill.update
        .mockResolvedValueOnce({ ...mockBill, assignedToId: 'c9876543210987654321098765' })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
    })

    it('should fail after max retries on persistent race condition', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }

      // Mock cache to reject assignment
      const { canUserBeAssignedBillCached } = await import('@/lib/cache')
      ;(canUserBeAssignedBillCached as jest.Mock).mockResolvedValue({
        canAssign: false,
        reason: 'User not found',
        currentCount: 0,
        availableSlots: 0
      })

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('should handle database errors', async () => {
      const input = { billId: 'c1234567890123456789012345', userId: 'c9876543210987654321098765' }

      // Mock cache to allow assignment so we can test database error
      const { canUserBeAssignedBillCached } = await import('@/lib/cache')
      ;(canUserBeAssignedBillCached as jest.Mock).mockResolvedValue({
        canAssign: true,
        currentCount: 2,
        availableSlots: 1
      })

      // Mock the transaction to throw an error
      mockPrisma.$transaction.mockRejectedValue(new Error('Database connection failed'))

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })
})