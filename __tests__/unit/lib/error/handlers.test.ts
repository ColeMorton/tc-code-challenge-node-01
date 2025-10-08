import { AppError, createError, isAppError, handleError } from '@/app/lib/error/handlers'
import { BillAssignmentError, ErrorCode } from '@/app/lib/error/constants'

describe('Error Handlers', () => {
  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(
        BillAssignmentError.BILL_NOT_FOUND,
        404,
        'Bill not found',
        { cause: 'test' }
      )

      expect(error.message).toBe('Bill not found')
      expect(error.code).toBe(BillAssignmentError.BILL_NOT_FOUND)
      expect(error.httpStatus).toBe(404)
      expect(error.name).toBe('AppError')
      expect(error.cause).toBe('test')
    })

    it('should have toResponse method that returns correct structure', () => {
      const error = new AppError(
        BillAssignmentError.VALIDATION_ERROR,
        400,
        'Validation failed'
      )

      const response = error.toResponse()

      expect(response).toEqual({
        error: 'Validation failed',
        errorCode: BillAssignmentError.VALIDATION_ERROR,
        httpStatus: 400
      })
    })

    it('should inherit from Error', () => {
      const error = new AppError(
        BillAssignmentError.BILL_NOT_FOUND,
        404,
        'Bill not found'
      )

      expect(error instanceof Error).toBe(true)
      expect(error.constructor.name).toBe('AppError')
    })

    it('should set prototype correctly', () => {
      const error = new AppError(
        BillAssignmentError.BILL_NOT_FOUND,
        404,
        'Bill not found'
      )

      expect(Object.getPrototypeOf(error)).toBe(AppError.prototype)
    })
  })

  describe('createError', () => {
    it('should create AppError with default message for VALIDATION_ERROR', () => {
      const error = createError(BillAssignmentError.VALIDATION_ERROR)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.VALIDATION_ERROR)
      expect(error.httpStatus).toBe(400)
      expect(error.message).toBeDefined()
    })

    it('should create AppError with custom message for VALIDATION_ERROR', () => {
      const customMessage = 'Custom validation error'
      const error = createError(BillAssignmentError.VALIDATION_ERROR, customMessage)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.VALIDATION_ERROR)
      expect(error.httpStatus).toBe(400)
      expect(error.message).toBe(customMessage)
    })

    it('should create AppError with default message for BILL_NOT_FOUND', () => {
      const error = createError(BillAssignmentError.BILL_NOT_FOUND)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.BILL_NOT_FOUND)
      expect(error.httpStatus).toBe(404)
      expect(error.message).toBeDefined()
    })

    it('should create AppError with custom message for BILL_NOT_FOUND', () => {
      const customMessage = 'Custom bill not found message'
      const error = createError(BillAssignmentError.BILL_NOT_FOUND, customMessage)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.BILL_NOT_FOUND)
      expect(error.httpStatus).toBe(404)
      expect(error.message).toBe(customMessage)
    })

    it('should create AppError for USER_NOT_FOUND', () => {
      const error = createError(BillAssignmentError.USER_NOT_FOUND)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.USER_NOT_FOUND)
      expect(error.httpStatus).toBe(404)
    })

    it('should create AppError for BILL_ALREADY_ASSIGNED', () => {
      const error = createError(BillAssignmentError.BILL_ALREADY_ASSIGNED)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.BILL_ALREADY_ASSIGNED)
      expect(error.httpStatus).toBe(409)
    })

    it('should create AppError for USER_BILL_LIMIT_EXCEEDED', () => {
      const error = createError(BillAssignmentError.USER_BILL_LIMIT_EXCEEDED)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.USER_BILL_LIMIT_EXCEEDED)
      expect(error.httpStatus).toBe(409)
    })

    it('should create AppError for INVALID_BILL_STAGE', () => {
      const error = createError(BillAssignmentError.INVALID_BILL_STAGE)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(BillAssignmentError.INVALID_BILL_STAGE)
      expect(error.httpStatus).toBe(400)
    })

    it('should handle unknown error codes gracefully', () => {
      const unknownCode = 'UNKNOWN_ERROR' as ErrorCode
      const error = createError(unknownCode)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(unknownCode)
    })
  })

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const appError = createError(BillAssignmentError.BILL_NOT_FOUND)
      expect(isAppError(appError)).toBe(true)
    })

    it('should return false for standard Error instances', () => {
      const standardError = new Error('Standard error')
      expect(isAppError(standardError)).toBe(false)
    })

    it('should return false for string errors', () => {
      expect(isAppError('String error')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isAppError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isAppError(undefined)).toBe(false)
    })

    it('should return false for objects', () => {
      expect(isAppError({ message: 'Object error' })).toBe(false)
    })

    it('should return false for numbers', () => {
      expect(isAppError(123)).toBe(false)
    })
  })

  describe('handleError', () => {
    it('should handle AppError instances', () => {
      const appError = createError(BillAssignmentError.BILL_NOT_FOUND, 'Custom message')
      const result = handleError(appError)

      expect(result).toEqual({
        success: false,
        error: 'Custom message',
        errorCode: BillAssignmentError.BILL_NOT_FOUND
      })
    })

    it('should handle standard Error instances', () => {
      const standardError = new Error('Standard error message')
      const result = handleError(standardError)

      expect(result).toEqual({
        success: false,
        error: 'Standard error message',
        errorCode: BillAssignmentError.VALIDATION_ERROR
      })
    })

    it('should handle standard Error without message', () => {
      const standardError = new Error()
      const result = handleError(standardError)

      expect(result).toEqual({
        success: false,
        error: '',
        errorCode: BillAssignmentError.VALIDATION_ERROR
      })
    })

    it('should handle non-Error objects', () => {
      const nonError = 'String error'
      const result = handleError(nonError)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
        errorCode: undefined
      })
    })

    it('should handle null', () => {
      const result = handleError(null)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
        errorCode: undefined
      })
    })

    it('should handle undefined', () => {
      const result = handleError(undefined)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
        errorCode: undefined
      })
    })

    it('should handle objects with message property', () => {
      const objectError = { message: 'Object error message' }
      const result = handleError(objectError)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
        errorCode: undefined
      })
    })

    it('should handle numbers', () => {
      const numberError = 123
      const result = handleError(numberError)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
        errorCode: undefined
      })
    })

    it('should handle arrays', () => {
      const arrayError = ['error1', 'error2']
      const result = handleError(arrayError)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
        errorCode: undefined
      })
    })
  })
})
