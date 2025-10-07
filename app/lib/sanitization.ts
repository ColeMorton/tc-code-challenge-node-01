/**
 * Enhanced input sanitization utilities with better security
 */

/**
 * Sanitizes bill reference input with comprehensive security measures
 */
export function sanitizeBillReference(value: string): string {
  if (typeof value !== 'string') return ''
  
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags and content
    .replace(/<[a-zA-Z][^>]*>/g, '') // Remove HTML tags (but preserve < and > in other contexts)
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '') // Remove control characters including Unicode
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim() // Trim after all processing
    // Note: Character validation and length validation are handled by Zod schema
}

/**
 * Enhanced general string sanitization with configurable options
 */
export function sanitizeString(value: string, options: {
  maxLength?: number
  allowHtml?: boolean
  allowSpecialChars?: boolean
} = {}): string {
  if (typeof value !== 'string') return ''
  
  let sanitized = value
  
  // Always remove script tags for security, even when HTML is allowed
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
  
  if (!options.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '') // Remove remaining HTML tags
  }
  
  if (!options.allowSpecialChars) {
    // If HTML is allowed, preserve HTML tags even when special chars are not allowed
    if (options.allowHtml) {
      sanitized = sanitized.replace(/[^\w\s\-\.<>\/]/g, '')
    } else {
      sanitized = sanitized.replace(/[^\w\s\-\.]/g, '')
    }
  }
  
  sanitized = sanitized
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '') // Remove control characters including Unicode
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim() // Trim after all processing
  
  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength)
  }
  
  return sanitized
}

/**
 * Database-specific sanitization to prevent injection attacks
 */
export function sanitizeForDatabase(value: string): string {
  if (typeof value !== 'string') return ''
  
  return value
    .replace(/['"\\]/g, '') // Remove quotes and backslashes
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}
