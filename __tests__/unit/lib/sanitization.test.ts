import { sanitizeBillReference, sanitizeString, sanitizeForDatabase } from '@/app/lib/sanitization'

describe('Enhanced Sanitization', () => {
  describe('sanitizeBillReference', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeBillReference('<script>alert("xss")</script>BILL-001')).toBe('BILL-001')
    })

    it('should remove control characters', () => {
      expect(sanitizeBillReference('BILL\x00-001')).toBe('BILL-001')
    })

    it('should preserve special characters for validation', () => {
      expect(sanitizeBillReference('BILL@2024!')).toBe('BILL@2024!')
    })

    it('should not truncate length (validation handles this)', () => {
      const longString = 'A'.repeat(150)
      expect(sanitizeBillReference(longString).length).toBe(150)
    })

    it('should handle empty string', () => {
      expect(sanitizeBillReference('')).toBe('')
    })

    it('should handle non-string input', () => {
      expect(sanitizeBillReference(null as unknown as string)).toBe('')
      expect(sanitizeBillReference(undefined as unknown as string)).toBe('')
      expect(sanitizeBillReference(123 as unknown as string)).toBe('')
    })

    it('should normalize whitespace', () => {
      expect(sanitizeBillReference('  BILL-001  ')).toBe('BILL-001')
      expect(sanitizeBillReference('BILL   001')).toBe('BILL 001')
    })

    it('should preserve valid characters', () => {
      expect(sanitizeBillReference('BILL-2024-001')).toBe('BILL-2024-001')
      expect(sanitizeBillReference('ABC123')).toBe('ABC123')
      expect(sanitizeBillReference('test-bill')).toBe('test-bill')
    })

    it('should preserve special characters for validation', () => {
      expect(sanitizeBillReference('BILL@#$%^&*()_+{}|:"<>?[]\\;\',./')).toBe('BILL@#$%^&*()_+{}|:"<>?[]\\;\',./')
    })
  })

  describe('sanitizeString', () => {
    it('should sanitize with default options', () => {
      const result = sanitizeString('Test<script>alert("xss")</script>')
      expect(result).toBe('Test')
    })

    it('should sanitize with custom maxLength', () => {
      const result = sanitizeString('This is a very long string', { maxLength: 10 })
      expect(result).toBe('This is a ')
    })

    it('should allow HTML when specified', () => {
      const result = sanitizeString('<div>Test</div>', { allowHtml: true })
      expect(result).toBe('<div>Test</div>')
    })

    it('should allow special characters when specified', () => {
      const result = sanitizeString('Test@#$%', { allowSpecialChars: true })
      expect(result).toBe('Test@#$%')
    })

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('')
    })

    it('should handle non-string input', () => {
      expect(sanitizeString(null as unknown as string)).toBe('')
      expect(sanitizeString(undefined as unknown as string)).toBe('')
    })

    it('should remove control characters', () => {
      const result = sanitizeString('Test\x00\x01\x02String')
      expect(result).toBe('TestString')
    })

    it('should normalize whitespace', () => {
      const result = sanitizeString('  Test    String  ')
      expect(result).toBe('Test String')
    })
  })

  describe('sanitizeForDatabase', () => {
    it('should remove quotes and backslashes', () => {
      expect(sanitizeForDatabase('Test"\'\\String')).toBe('TestString')
    })

    it('should remove angle brackets', () => {
      expect(sanitizeForDatabase('Test<>String')).toBe('TestString')
    })

    it('should trim whitespace', () => {
      expect(sanitizeForDatabase('  Test String  ')).toBe('Test String')
    })

    it('should handle empty string', () => {
      expect(sanitizeForDatabase('')).toBe('')
    })

    it('should preserve alphanumeric characters', () => {
      expect(sanitizeForDatabase('Test123String')).toBe('Test123String')
    })

    it('should handle mixed dangerous characters', () => {
      expect(sanitizeForDatabase('Test"\'\\<>String')).toBe('TestString')
    })
  })

  describe('Security Edge Cases', () => {
    it('should prevent XSS attempts', () => {
      const maliciousInput = '<script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')">'
      expect(sanitizeBillReference(maliciousInput)).toBe('')
    })

    it('should handle SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE bills; --"
      expect(sanitizeForDatabase(sqlInjection)).toBe('; DROP TABLE bills; --')
    })

    it('should handle Unicode control characters', () => {
      const unicodeControl = 'Test\u200B\u200C\u200D\uFEFFString'
      expect(sanitizeBillReference(unicodeControl)).toBe('TestString')
    })

    it('should handle very long strings', () => {
      const veryLongString = 'A'.repeat(10000)
      const result = sanitizeBillReference(veryLongString)
      expect(result.length).toBe(10000) // Sanitization doesn't truncate, validation does
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle null and undefined gracefully', () => {
      expect(sanitizeBillReference(null as unknown as string)).toBe('')
      expect(sanitizeBillReference(undefined as unknown as string)).toBe('')
      expect(sanitizeString(null as unknown as string)).toBe('')
      expect(sanitizeString(undefined as unknown as string)).toBe('')
      expect(sanitizeForDatabase(null as unknown as string)).toBe('')
      expect(sanitizeForDatabase(undefined as unknown as string)).toBe('')
    })

    it('should handle empty strings', () => {
      expect(sanitizeBillReference('')).toBe('')
      expect(sanitizeString('')).toBe('')
      expect(sanitizeForDatabase('')).toBe('')
    })

    it('should handle whitespace-only strings', () => {
      expect(sanitizeBillReference('   ')).toBe('')
      expect(sanitizeString('   ')).toBe('')
      expect(sanitizeForDatabase('   ')).toBe('')
    })
  })
})
