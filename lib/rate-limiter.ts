interface RateLimitData {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitData>()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  let data = rateLimitStore.get(key)

  // Reset if window has passed
  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  // Check if limit exceeded
  if (data.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: data.resetTime
    }
  }

  // Increment count
  data.count++
  rateLimitStore.set(key, data)

  return {
    success: true,
    limit,
    remaining: limit - data.count,
    resetTime: data.resetTime
  }
}

export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute