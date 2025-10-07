import { NextRequest } from 'next/server'
import { POST } from '@/app/api/bills/assign/route'
import { assignBillAction } from '@/app/bills/actions'
import { BillAssignmentError } from '@/app/lib/definitions'
import { ERROR_DEFINITIONS } from '@/app/lib/error-constants'

// Mock the server action
jest.mock('@/app/bills/actions', () => ({
  assignBillAction: jest.fn()
}))

const mockAssignBillAction = assignBillAction as jest.MockedFunction<typeof assignBillAction>

// Mock console.error to suppress expected error logs during testing
const originalConsoleError = console.error

describe('/api/bills/assign', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to suppress expected error logs during testing
    console.error = jest.fn()
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

      const mockBill = {
        id: 'bill1',
        billReference: 'BILL-001',
        billDate: new Date('2024-01-01'),
        assignedToId: 'user1',
        billStageId: 'submitted-stage',
        assignedTo: {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        billStage: {
          id: 'submitted-stage',
          label: 'Submitted',
          colour: '#3B82F6'
        }
      }

      // Mock successful server action response
      mockAssignBillAction.mockResolvedValue({
        success: true,
        bill: mockBill
      })

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Bill assigned successfully')
      expect(data.bill.assignedTo.id).toBe('user1')
      expect(mockAssignBillAction).toHaveBeenCalledWith({
        userId: 'user1',
        billId: 'bill1'
      })
    })

    it('should handle user not found error', async () => {
      const requestBody = {
        userId: 'nonexistent',
        billId: 'bill1'
      }

      // Mock server action error response
      mockAssignBillAction.mockResolvedValue({
        success: false,
        error: 'User not found',
        errorCode: BillAssignmentError.USER_NOT_FOUND
      })

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe(ERROR_DEFINITIONS.USER_NOT_FOUND.message)
    })

    it('should handle user bill limit exceeded error', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      // Mock server action error response
      mockAssignBillAction.mockResolvedValue({
        success: false,
        error: 'User already has the maximum of 3 bills assigned',
        errorCode: BillAssignmentError.USER_BILL_LIMIT_EXCEEDED
      })

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe(ERROR_DEFINITIONS.USER_BILL_LIMIT_EXCEEDED.message)
    })

    it('should handle bill not found error', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'nonexistent'
      }

      // Mock server action error response
      mockAssignBillAction.mockResolvedValue({
        success: false,
        error: 'Bill not found',
        errorCode: BillAssignmentError.BILL_NOT_FOUND
      })

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe(ERROR_DEFINITIONS.BILL_NOT_FOUND.message)
    })

    it('should handle bill already assigned error', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      // Mock server action error response
      mockAssignBillAction.mockResolvedValue({
        success: false,
        error: 'Bill is already assigned',
        errorCode: BillAssignmentError.BILL_ALREADY_ASSIGNED
      })

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe(ERROR_DEFINITIONS.BILL_ALREADY_ASSIGNED.message)
    })

    it('should handle invalid bill stage error', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      // Mock server action error response
      mockAssignBillAction.mockResolvedValue({
        success: false,
        error: 'Bill must be in Draft or Submitted stage to be assigned',
        errorCode: BillAssignmentError.INVALID_BILL_STAGE
      })

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(ERROR_DEFINITIONS.INVALID_BILL_STAGE.message)
    })

    it('should handle concurrent update error', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      // Mock server action error response
      mockAssignBillAction.mockResolvedValue({
        success: false,
        error: 'Failed to assign bill due to concurrent updates. Please try again.',
        errorCode: BillAssignmentError.CONCURRENT_UPDATE
      })

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe(ERROR_DEFINITIONS.CONCURRENT_UPDATE.message)
    })

    it('should handle missing userId', async () => {
      const requestBody = {
        billId: 'bill1'
      }

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(ERROR_DEFINITIONS.USER_ID_REQUIRED.message)
      expect(mockAssignBillAction).not.toHaveBeenCalled()
    })

    it('should handle missing billId', async () => {
      const requestBody = {
        userId: 'user1'
      }

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(ERROR_DEFINITIONS.BILL_ID_REQUIRED.message)
      expect(mockAssignBillAction).not.toHaveBeenCalled()
    })

    it('should handle server action throwing an error', async () => {
      const requestBody = {
        userId: 'user1',
        billId: 'bill1'
      }

      // Mock server action throwing an error
      mockAssignBillAction.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/bills/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(ERROR_DEFINITIONS.FAILED_TO_ASSIGN_BILL.message)
    })
  })
})
