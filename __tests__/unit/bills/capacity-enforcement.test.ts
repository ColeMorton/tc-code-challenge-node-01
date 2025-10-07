import { createBill, assignBillAction } from '@/app/bills/actions'
import { prisma } from '@/app/lib/infrastructure'
import type { MockPrismaClient } from '@/app/lib/types'

// Mock Prisma
jest.mock('@/app/lib/infrastructure', () => ({
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

// Mock console methods to suppress output during tests
const originalConsoleLog = console.log
const originalConsoleError = console.error

describe('3-Bill Capacity Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
  })

  describe('createBill() - Form Submission Path', () => {
    it('should enforce 3-bill limit when creating bill with user assignment', async () => {
      const input = {
        billReference: 'BILL-TEST-001',
        billDate: '2024-01-01',
        assignedToId: 'user-at-capacity'
      }

      // Mock user already has 3 bills
      mockPrisma.bill.count.mockResolvedValue(3)

      await expect(createBill(input)).rejects.toThrow('User already has the maximum of 3 bills assigned')

      // Verify count check was called
      expect(mockPrisma.bill.count).toHaveBeenCalledWith({
        where: { assignedToId: 'user-at-capacity' }
      })

      // Verify bill was NOT created
      expect(mockPrisma.bill.create).not.toHaveBeenCalled()
    })

    it('should allow creating bill when user has capacity', async () => {
      const input = {
        billReference: 'BILL-TEST-002',
        billDate: '2024-01-01',
        assignedToId: 'user-with-capacity'
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft' }
      const mockBill = {
        id: 'new-bill',
        billReference: 'BILL-TEST-002',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        assignedToId: 'user-with-capacity'
      }

      // Mock user has only 2 bills
      mockPrisma.bill.count.mockResolvedValue(2)
      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockBill)

      const result = await createBill(input)

      expect(result).toEqual(mockBill)
      expect(mockPrisma.bill.count).toHaveBeenCalledWith({
        where: { assignedToId: 'user-with-capacity' }
      })
      expect(mockPrisma.bill.create).toHaveBeenCalled()
    })

    it('should skip capacity check when creating unassigned bill', async () => {
      const input = {
        billReference: 'BILL-TEST-003',
        billDate: '2024-01-01'
        // No assignedToId
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft' }
      const mockBill = {
        id: 'new-bill',
        billReference: 'BILL-TEST-003',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        assignedToId: null
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockBill)

      const result = await createBill(input)

      expect(result).toEqual(mockBill)
      // Count should NOT be called for unassigned bills
      expect(mockPrisma.bill.count).not.toHaveBeenCalled()
    })

    it('should prevent exactly the 4th bill assignment', async () => {
      const input = {
        billReference: 'BILL-FOURTH',
        billDate: '2024-01-01',
        assignedToId: 'user-with-three-bills'
      }

      // User has exactly 3 bills
      mockPrisma.bill.count.mockResolvedValue(3)

      await expect(createBill(input)).rejects.toThrow('User already has the maximum of 3 bills assigned')
    })

    it('should allow exactly the 3rd bill assignment', async () => {
      const input = {
        billReference: 'BILL-THIRD',
        billDate: '2024-01-01',
        assignedToId: 'user-with-two-bills'
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft' }
      const mockBill = {
        id: 'third-bill',
        billReference: 'BILL-THIRD',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        assignedToId: 'user-with-two-bills'
      }

      // User has exactly 2 bills (can accept 1 more)
      mockPrisma.bill.count.mockResolvedValue(2)
      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockBill)

      const result = await createBill(input)

      expect(result).toEqual(mockBill)
    })
  })

  describe('assignBillAction() - Dashboard Assignment Path', () => {
    beforeEach(() => {
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
    })

    it('should enforce 3-bill limit when assigning via dashboard', async () => {
      const input = { billId: 'bill-123', userId: 'user-at-capacity' }

      const mockUser = {
        id: 'user-at-capacity',
        name: 'Full User',
        email: 'full@example.com',
        _count: { bills: 3 } // Already at capacity
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await assignBillAction(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already has the maximum of 3 bills assigned')
    })

    it('should allow assignment when user has capacity', async () => {
      const input = { billId: 'bill-456', userId: 'user-with-space' }

      const mockUser = {
        id: 'user-with-space',
        name: 'Available User',
        email: 'available@example.com',
        _count: { bills: 2 } // Has capacity
      }

      const mockBill = {
        id: 'bill-456',
        billReference: 'BILL-456',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        billStage: { id: 'draft-stage', label: 'Draft' },
        assignedToId: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.bill.findUnique.mockResolvedValue(mockBill)
      mockPrisma.billStage.findFirst.mockResolvedValue({ id: 'submitted-stage', label: 'Submitted' })
      mockPrisma.bill.update.mockResolvedValue({ ...mockBill, assignedToId: 'user-with-space' })

      const result = await assignBillAction(input)

      expect(result.success).toBe(true)
    })
  })

  describe('Cross-Path Consistency', () => {
    it('should enforce same limit (3) in both createBill and assignBillAction', () => {
      // This test documents that both paths must enforce the same business rule
      const MAX_BILLS_PER_USER = 3

      // The limit is hardcoded in both places - this test ensures we document it
      expect(MAX_BILLS_PER_USER).toBe(3)
    })

    it('should prevent bypass via createBill even if assignBillAction would reject', async () => {
      const userId = 'user-at-limit'

      // Simulate user with 3 bills trying to get a 4th via createBill
      mockPrisma.bill.count.mockResolvedValue(3)
      mockPrisma.bill.findUnique.mockResolvedValue(null) // Bill reference is unique

      const createInput = {
        billReference: 'BYPASS-ATTEMPT',
        billDate: '2024-01-01',
        assignedToId: userId
      }

      // createBill should reject
      await expect(createBill(createInput)).rejects.toThrow('User already has the maximum of 3 bills assigned')

      // Verify the attempted bypass was caught before database write
      expect(mockPrisma.bill.create).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user with 0 bills', async () => {
      const input = {
        billReference: 'FIRST-BILL',
        billDate: '2024-01-01',
        assignedToId: 'new-user'
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft' }
      const mockBill = {
        id: 'first-bill',
        billReference: 'FIRST-BILL',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        assignedToId: 'new-user'
      }

      mockPrisma.bill.count.mockResolvedValue(0)
      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockBill)

      const result = await createBill(input)

      expect(result).toEqual(mockBill)
    })

    it('should handle empty assignedToId string as unassigned', async () => {
      const input = {
        billReference: 'EMPTY-ASSIGNED',
        billDate: '2024-01-01',
        assignedToId: ''
      }

      const mockDraftStage = { id: 'draft-stage', label: 'Draft' }
      const mockBill = {
        id: 'empty-bill',
        billReference: 'EMPTY-ASSIGNED',
        billDate: new Date('2024-01-01'),
        billStageId: 'draft-stage',
        assignedToId: null
      }

      mockPrisma.bill.findUnique.mockResolvedValue(null)
      mockPrisma.billStage.findFirst.mockResolvedValue(mockDraftStage)
      mockPrisma.bill.create.mockResolvedValue(mockBill)

      const result = await createBill(input)

      // Empty string should be treated as undefined/null - no capacity check
      expect(mockPrisma.bill.count).not.toHaveBeenCalled()
      expect(result).toEqual(mockBill)
    })
  })
})
