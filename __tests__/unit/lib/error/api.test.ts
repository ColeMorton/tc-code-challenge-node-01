import { handleApiError, withErrorHandling, type ApiErrorResponse } from '@/app/lib/error/api'
import { createError } from '@/app/lib/error/handlers'
import { BillAssignmentError } from '@/app/lib/types'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn()
  }
}))

const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>

// Mock console.error to suppress expected error logs during testing
const originalConsoleError = console.error

describe('API Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to suppress expected error logs during testing
    console.error = jest.fn()
    mockNextResponse.json.mockImplementation((data, init) => {
      return {
        json: () => Promise.resolve(data),
        status: init?.status || 200
      } as unknown as Response
    })
  })

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError
  })

  describe('handleApiError', () => {
    it('should handle AppError instances correctly', () => {
      const appError = createError(BillAssignmentError.BILL_NOT_FOUND, 'Custom message')
      handleApiError(appError)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Custom message',
          code: BillAssignmentError.BILL_NOT_FOUND,
          status: 404
        },
        { status: 404 }
      )
    })

    it('should handle standard Error instances', () => {
      const standardError = new Error('Database connection failed')
      handleApiError(standardError)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Database connection failed',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle unknown error types', () => {
      const unknownError = 'String error'
      handleApiError(unknownError)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle null errors', () => {
      handleApiError(null)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle undefined errors', () => {
      handleApiError(undefined)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle errors with no message', () => {
      const errorWithoutMessage = new Error()
      handleApiError(errorWithoutMessage)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: '',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle AppError with different status codes', () => {
      const validationError = createError(BillAssignmentError.VALIDATION_ERROR)
      handleApiError(validationError)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: expect.any(String),
          code: BillAssignmentError.VALIDATION_ERROR,
          status: 400
        },
        { status: 400 }
      )
    })
  })

  describe('withErrorHandling', () => {
    it('should return successful result when handler succeeds', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ success: true, data: 'test' })
      const wrappedHandler = withErrorHandling(mockHandler)
      
      await wrappedHandler()

      expect(mockHandler).toHaveBeenCalled()
      expect(mockNextResponse.json).toHaveBeenCalledWith({ success: true, data: 'test' })
    })

    it('should handle AppError from handler', async () => {
      const appError = createError(BillAssignmentError.BILL_NOT_FOUND, 'Bill not found')
      const mockHandler = jest.fn().mockRejectedValue(appError)
      const wrappedHandler = withErrorHandling(mockHandler)
      
      await wrappedHandler()

      expect(mockHandler).toHaveBeenCalled()
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Bill not found',
          code: BillAssignmentError.BILL_NOT_FOUND,
          status: 404
        },
        { status: 404 }
      )
    })

    it('should handle standard Error from handler', async () => {
      const standardError = new Error('Database error')
      const mockHandler = jest.fn().mockRejectedValue(standardError)
      const wrappedHandler = withErrorHandling(mockHandler)
      
      await wrappedHandler()

      expect(mockHandler).toHaveBeenCalled()
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Database error',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle unknown error types from handler', async () => {
      const mockHandler = jest.fn().mockRejectedValue('String error')
      const wrappedHandler = withErrorHandling(mockHandler)
      
      await wrappedHandler()

      expect(mockHandler).toHaveBeenCalled()
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle async handler errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Async error'))
      const wrappedHandler = withErrorHandling(mockHandler)
      
      await wrappedHandler()

      expect(mockHandler).toHaveBeenCalled()
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Async error',
          code: 'UNKNOWN_ERROR',
          status: 500
        },
        { status: 500 }
      )
    })

    it('should handle handler that returns undefined', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined)
      const wrappedHandler = withErrorHandling(mockHandler)
      
      await wrappedHandler()

      expect(mockHandler).toHaveBeenCalled()
      expect(mockNextResponse.json).toHaveBeenCalledWith(undefined)
    })
  })

  describe('ApiErrorResponse type', () => {
    it('should have correct type structure', () => {
      const response: ApiErrorResponse = {
        error: 'Test error',
        code: BillAssignmentError.BILL_NOT_FOUND,
        status: 404
      }

      expect(response.error).toBe('Test error')
      expect(response.code).toBe(BillAssignmentError.BILL_NOT_FOUND)
      expect(response.status).toBe(404)
    })

    it('should allow optional code field', () => {
      const response: ApiErrorResponse = {
        error: 'Test error',
        status: 500
      }

      expect(response.error).toBe('Test error')
      expect(response.status).toBe(500)
      expect(response.code).toBeUndefined()
    })
  })
})
