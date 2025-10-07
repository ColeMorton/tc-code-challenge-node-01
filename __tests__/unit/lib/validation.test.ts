import {
  CreateBillSchema,
  AssignBillSchema,
  validateWithZod,
  validateCreateBillInput,
  validateAssignBillInput
} from '@/app/lib/validation'

describe('Server-Side Validation (Zod)', () => {
  describe('CreateBillSchema', () => {
    it('should validate complete valid bill data', () => {
      const validData = {
        billReference: 'BILL-2024-001',
        billDate: '2024-01-15',
        assignedToId: 'user-123'
      }

      const result = CreateBillSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate bill data without optional assignedToId', () => {
      const validData = {
        billReference: 'BILL-2024-001',
        billDate: '2024-01-15'
      }

      const result = CreateBillSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    describe('billReference validation', () => {
      it('should require bill reference', () => {
        const invalidData = {
          billReference: '',
          billDate: '2024-01-15'
        }

        const result = CreateBillSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required')
        }
      })

      it('should enforce minimum length of 5 characters', () => {
        const invalidData = {
          billReference: 'ABCD', // Only 4 chars
          billDate: '2024-01-15'
        }

        const result = CreateBillSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Bill reference must be at least 5 characters')
        }
      })

      it('should accept bill reference with exactly 5 characters', () => {
        const validData = {
          billReference: 'ABCDE',
          billDate: '2024-01-15'
        }

        const result = CreateBillSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should enforce maximum length of 100 characters', () => {
        const invalidData = {
          billReference: 'A'.repeat(101),
          billDate: '2024-01-15'
        }

        const result = CreateBillSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Bill reference must be less than 100 characters')
        }
      })

      it('should enforce alphanumeric and hyphen regex pattern', () => {
        const invalidData = {
          billReference: 'BILL@2024!', // Contains @ and !
          billDate: '2024-01-15'
        }

        const result = CreateBillSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Bill reference can only contain letters, numbers, and hyphens only')
        }
      })

      it('should accept valid alphanumeric with hyphens', () => {
        const validReferences = [
          'BILL-2024-001',
          'ABC-123',
          'INVOICE-2024-01-001',
          '12345',
          'ABCDE'
        ]

        validReferences.forEach(ref => {
          const result = CreateBillSchema.safeParse({
            billReference: ref,
            billDate: '2024-01-15'
          })
          expect(result.success).toBe(true)
        })
      })

      it('should trim whitespace during transform', () => {
        const validData = {
          billReference: '  BILL-2024-001  ',
          billDate: '2024-01-15'
        }

        const result = CreateBillSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.billReference).toBe('BILL-2024-001')
        }
      })
    })

    describe('billDate validation', () => {
      it('should require bill date', () => {
        const invalidData = {
          billReference: 'BILL-2024-001',
          billDate: ''
        }

        const result = CreateBillSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required')
        }
      })

      it('should validate date format', () => {
        const invalidData = {
          billReference: 'BILL-2024-001',
          billDate: 'not-a-date'
        }

        const result = CreateBillSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid date format')
        }
      })

      it('should accept valid ISO date strings', () => {
        const validDates = [
          '2024-01-01',
          '2024-12-31',
          '2023-06-15'
        ]

        validDates.forEach(date => {
          const result = CreateBillSchema.safeParse({
            billReference: 'BILL-2024-001',
            billDate: date
          })
          expect(result.success).toBe(true)
        })
      })
    })

    describe('assignedToId validation', () => {
      it('should accept undefined assignedToId', () => {
        const validData = {
          billReference: 'BILL-2024-001',
          billDate: '2024-01-15'
        }

        const result = CreateBillSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept valid assignedToId', () => {
        const validData = {
          billReference: 'BILL-2024-001',
          billDate: '2024-01-15',
          assignedToId: 'user-123'
        }

        const result = CreateBillSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('AssignBillSchema', () => {
    it('should validate complete assign bill data', () => {
      const validData = {
        billId: 'bill-123',
        userId: 'user-456'
      }

      const result = AssignBillSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require billId', () => {
      const invalidData = {
        billId: '',
        userId: 'user-456'
      }

      const result = AssignBillSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('billId is required')
      }
    })

    it('should require userId', () => {
      const invalidData = {
        billId: 'bill-123',
        userId: ''
      }

      const result = AssignBillSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('userId is required')
      }
    })
  })

  describe('validateWithZod helper', () => {
    it('should return success with data for valid input', () => {
      const validData = {
        billReference: 'BILL-2024-001',
        billDate: '2024-01-15'
      }

      const result = validateWithZod(CreateBillSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        billReference: 'BILL-2024-001',
        billDate: '2024-01-15'
      })
      expect(result.errors).toBeUndefined()
    })

    it('should return errors for invalid input', () => {
      const invalidData = {
        billReference: 'AB', // Too short
        billDate: ''
      }

      const result = validateWithZod(CreateBillSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors?.billReference).toBeDefined()
      expect(result.errors?.billDate).toBeDefined()
    })

    it('should flatten field errors correctly', () => {
      const invalidData = {
        billReference: '',
        billDate: 'invalid'
      }

      const result = validateWithZod(CreateBillSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toMatchObject({
        billReference: expect.arrayContaining([expect.any(String)]),
        billDate: expect.arrayContaining([expect.any(String)])
      })
    })
  })

  describe('validateCreateBillInput', () => {
    it('should validate valid bill input', () => {
      const validInput = {
        billReference: 'BILL-2024-001',
        billDate: '2024-01-15'
      }

      const result = validateCreateBillInput(validInput)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should return structured errors for invalid input', () => {
      const invalidInput = {
        billReference: 'AB',
        billDate: ''
      }

      const result = validateCreateBillInput(invalidInput)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('validateAssignBillInput', () => {
    it('should validate valid assignment input', () => {
      const validInput = {
        billId: 'bill-123',
        userId: 'user-456'
      }

      const result = validateAssignBillInput(validInput)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should return structured errors for invalid input', () => {
      const invalidInput = {
        billId: '',
        userId: ''
      }

      const result = validateAssignBillInput(invalidInput)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('Server-Side Validation Characteristics', () => {
    it('should be stricter than client-side validation', () => {
      // Server requires 5+ chars (client accepts 3+)
      const shortReference = CreateBillSchema.safeParse({
        billReference: 'ABCD',
        billDate: '2024-01-15'
      })
      expect(shortReference.success).toBe(false)

      // Server enforces regex (client accepts any)
      const specialChars = CreateBillSchema.safeParse({
        billReference: 'BILL@2024!',
        billDate: '2024-01-15'
      })
      expect(specialChars.success).toBe(false)
    })

    it('should provide detailed error messages', () => {
      const invalidData = {
        billReference: 'BILL@!',
        billDate: 'invalid'
      }

      const result = validateCreateBillInput(invalidData)

      expect(result.success).toBe(false)
      expect(result.errors?.billReference).toContain('Bill reference can only contain letters, numbers, and hyphens only')
      expect(result.errors?.billDate).toContain('Invalid date format')
    })

    it('should handle type coercion and transformation', () => {
      const dataWithWhitespace = {
        billReference: '  BILL-2024-001  ',
        billDate: '2024-01-15'
      }

      const result = validateCreateBillInput(dataWithWhitespace)

      expect(result.success).toBe(true)
      expect(result.data?.billReference).toBe('BILL-2024-001')
    })
  })
})
