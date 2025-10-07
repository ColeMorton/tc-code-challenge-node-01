import {
  FieldValidators,
  validateForm,
  initialValidationState,
  BillFormData
} from '@/app/lib/form-validation'

describe('Client-Side Form Validation', () => {
  describe('FieldValidators.billReference', () => {
    it('should require bill reference', () => {
      const result = FieldValidators.billReference('')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Bill reference is required')
      expect(result?.type).toBe('required')
    })

    it('should trim whitespace before validation', () => {
      const result = FieldValidators.billReference('   ')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Bill reference is required')
    })

    it('should enforce minimum length of 5 characters', () => {
      const result = FieldValidators.billReference('AB')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Bill reference must be at least 5 characters')
      expect(result?.type).toBe('minLength')
    })

    it('should accept valid bill reference with exactly 5 characters', () => {
      const result = FieldValidators.billReference('ABCDE')
      expect(result).toBeNull()
    })

    it('should enforce maximum length of 100 characters', () => {
      const longReference = 'A'.repeat(101)
      const result = FieldValidators.billReference(longReference)
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Bill reference must be less than 100 characters')
      expect(result?.type).toBe('maxLength')
    })

    it('should accept valid bill reference with exactly 100 characters', () => {
      const maxReference = 'A'.repeat(100)
      const result = FieldValidators.billReference(maxReference)
      expect(result).toBeNull()
    })

    it('should accept bill reference with mixed alphanumeric and hyphens', () => {
      const result = FieldValidators.billReference('BILL-2024-001')
      expect(result).toBeNull()
    })

    it('should reject bill reference with special characters (client-side)', () => {
      // Client-side now enforces pattern validation for consistency
      const result = FieldValidators.billReference('BILL@123!')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Bill reference can only contain letters, numbers, and hyphens only')
    })
  })

  describe('FieldValidators.billDate', () => {
    it('should require bill date', () => {
      const result = FieldValidators.billDate('')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Bill date is required')
      expect(result?.type).toBe('required')
    })

    it('should validate date format', () => {
      const result = FieldValidators.billDate('invalid-date')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Invalid date format')
      expect(result?.type).toBe('invalidDate')
    })

    it('should accept valid ISO date format', () => {
      const result = FieldValidators.billDate('2024-01-15')
      expect(result).toBeNull()
    })

    it('should accept various valid date formats', () => {
      const validDates = [
        '2024-01-01',
        '2024-12-31',
        '2023-06-15'
      ]

      validDates.forEach(date => {
        const result = FieldValidators.billDate(date)
        expect(result).toBeNull()
      })
    })

    it('should reject obviously invalid date strings', () => {
      const result = FieldValidators.billDate('not-a-date')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Invalid date format')
    })
  })

  describe('FieldValidators.assignedToId', () => {
    it('should always return null (optional field)', () => {
      const result = FieldValidators.assignedToId()
      expect(result).toBeNull()
    })
  })

  describe('validateForm', () => {
    it('should validate complete valid form data', () => {
      const formData: BillFormData = {
        billReference: 'BILL-2024-001',
        billDate: '2024-01-15',
        assignedToId: 'user-123'
      }

      const result = validateForm(formData)
      expect(result.isValid).toBe(true)
      expect(result.billReference).toBeNull()
      expect(result.billDate).toBeNull()
      expect(result.assignedToId).toBeNull()
    })

    it('should validate form without optional assignedToId', () => {
      const formData: Partial<BillFormData> = {
        billReference: 'BILL-2024-001',
        billDate: '2024-01-15'
      }

      const result = validateForm(formData)
      expect(result.isValid).toBe(true)
    })

    it('should return errors for missing required fields', () => {
      const formData: Partial<BillFormData> = {}

      const result = validateForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.billReference).not.toBeNull()
      expect(result.billReference?.message).toBe('Bill reference is required')
      expect(result.billDate).not.toBeNull()
      expect(result.billDate?.message).toBe('Bill date is required')
    })

    it('should return error for invalid bill reference', () => {
      const formData: Partial<BillFormData> = {
        billReference: 'AB', // Too short
        billDate: '2024-01-15'
      }

      const result = validateForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.billReference).not.toBeNull()
      expect(result.billReference?.message).toBe('Bill reference must be at least 5 characters')
    })

    it('should return error for invalid bill date', () => {
      const formData: Partial<BillFormData> = {
        billReference: 'BILL-2024-001',
        billDate: 'invalid'
      }

      const result = validateForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.billDate).not.toBeNull()
      expect(result.billDate?.message).toBe('Invalid date format')
    })

    it('should return multiple errors when multiple fields are invalid', () => {
      const formData: Partial<BillFormData> = {
        billReference: 'AB',
        billDate: 'invalid'
      }

      const result = validateForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.billReference).not.toBeNull()
      expect(result.billDate).not.toBeNull()
    })
  })

  describe('initialValidationState', () => {
    it('should have all fields null and isValid false', () => {
      expect(initialValidationState.billReference).toBeNull()
      expect(initialValidationState.billDate).toBeNull()
      expect(initialValidationState.assignedToId).toBeNull()
      expect(initialValidationState.isValid).toBe(false)
    })
  })

  describe('Client-Side Validation Characteristics', () => {
    it('should be consistent with server-side validation', () => {
      // Client and server now have consistent validation rules
      const validReference = FieldValidators.billReference('ABCDE')
      expect(validReference).toBeNull()

      // Client and server both enforce regex pattern
      const specialChars = FieldValidators.billReference('BILL@2024!')
      expect(specialChars).not.toBeNull()
      expect(specialChars?.message).toBe('Bill reference can only contain letters, numbers, and hyphens only')
    })

    it('should provide immediate feedback without async operations', () => {
      const result = FieldValidators.billReference('BILL-2024-001')
      expect(result).toBeNull()
      // No promises, no async - immediate synchronous validation
    })

    it('should use native JavaScript without dependencies', () => {
      // This test verifies the validators work with standard JavaScript
      const testString = 'TEST5' // 5 characters to meet minimum requirement
      const testDate = '2024-01-15'

      expect(typeof FieldValidators.billReference).toBe('function')
      expect(typeof FieldValidators.billDate).toBe('function')

      const refResult = FieldValidators.billReference(testString)
      const dateResult = FieldValidators.billDate(testDate)

      // Results are plain objects, not Zod types
      expect(refResult).toBeNull()
      expect(dateResult).toBeNull()
    })
  })
})
