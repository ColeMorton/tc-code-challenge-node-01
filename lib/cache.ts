/**
 * In-memory caching layer for bill assignment optimization
 * Provides caching for user bill counts and assignment capacity
 */

import { CacheEntry } from '@/app/lib/definitions'

// Re-export types that are specific to cache operations
export interface UserCapacity {
  userId: string
  userName: string
  userEmail: string
  currentAssignedCount: number
  availableSlots: number
  capacityStatus: string
}

export interface AssignmentCapacityCheck {
  canAssign: boolean
  reason?: string
  currentCount: number
  availableSlots: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL = 60000 // 1 minute default TTL

  /**
   * Set a cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
        this.cache.delete(key)
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: process.memoryUsage()
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache keys
export const CACHE_KEYS = {
  USER_BILL_COUNT: (userId: string) => `user_bill_count:${userId}`,
  USER_CAPACITY: (userId: string) => `user_capacity:${userId}`,
  ASSIGNABLE_BILLS: 'assignable_bills',
  ALL_USERS_CAPACITY: 'all_users_capacity'
} as const

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  USER_BILL_COUNT: 30000,    // 30 seconds
  USER_CAPACITY: 60000,      // 1 minute
  ASSIGNABLE_BILLS: 15000,   // 15 seconds
  ALL_USERS_CAPACITY: 120000 // 2 minutes
} as const

/**
 * Cached user bill count with automatic refresh
 */
export async function getCachedUserBillCount(userId: string): Promise<number> {
  const cacheKey = CACHE_KEYS.USER_BILL_COUNT(userId)
  const cached = cache.get<number>(cacheKey)
  
  if (cached !== null) {
    return cached
  }

  // Fetch from database
  const { prisma } = await import('./prisma')
  const count = await prisma.bill.count({
    where: { 
      assignedToId: userId,
      billStage: {
        label: {
          in: ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold']
        }
      }
    }
  })

  // Cache the result
  cache.set(cacheKey, count, CACHE_TTL.USER_BILL_COUNT)
  return count
}

/**
 * Cached user assignment capacity
 */
export async function getCachedUserCapacity(userId: string): Promise<{
  userId: string
  userName: string
  userEmail: string
  currentAssignedCount: number
  availableSlots: number
  capacityStatus: string
} | null> {
  const cacheKey = CACHE_KEYS.USER_CAPACITY(userId)
  const cached = cache.get(cacheKey)
  
  if (cached !== null && cached !== undefined) {
    return cached as {
      userId: string
      userName: string
      userEmail: string
      currentAssignedCount: number
      availableSlots: number
      capacityStatus: string
    }
  }

  // Fetch from database
  const { getUserAssignmentCapacity } = await import('./database-constraints')
  const capacity = await getUserAssignmentCapacity(userId)

  if (capacity) {
    cache.set(cacheKey, capacity, CACHE_TTL.USER_CAPACITY)
  }

  return capacity
}

/**
 * Cached assignable bills
 */
export async function getCachedAssignableBills() {
  const cacheKey = CACHE_KEYS.ASSIGNABLE_BILLS
  const cached = cache.get(cacheKey)
  
  if (cached !== null) {
    return cached
  }

  // Fetch from database
  const { getAssignableBills } = await import('./database-constraints')
  const bills = await getAssignableBills()

  // Cache the result
  cache.set(cacheKey, bills, CACHE_TTL.ASSIGNABLE_BILLS)
  return bills
}

/**
 * Invalidate cache entries for a user after assignment changes
 */
export function invalidateUserCache(userId: string): void {
  cache.delete(CACHE_KEYS.USER_BILL_COUNT(userId))
  cache.delete(CACHE_KEYS.USER_CAPACITY(userId))
  cache.delete(CACHE_KEYS.ALL_USERS_CAPACITY)
  cache.delete(CACHE_KEYS.ASSIGNABLE_BILLS)
}

/**
 * Invalidate all assignment-related cache entries
 */
export function invalidateAssignmentCache(): void {
  cache.delete(CACHE_KEYS.ALL_USERS_CAPACITY)
  cache.delete(CACHE_KEYS.ASSIGNABLE_BILLS)
  
  // Clear all user-specific caches
  for (const key of cache['cache'].keys()) {
    if (key.startsWith('user_bill_count:') || key.startsWith('user_capacity:')) {
      cache.delete(key)
    }
  }
}

/**
 * Optimized assignment check with caching
 */
export async function canUserBeAssignedBillCached(userId: string): Promise<{
  canAssign: boolean
  reason?: string
  currentCount: number
  availableSlots: number
}> {
  try {
    const capacity = await getCachedUserCapacity(userId)
    
    if (!capacity) {
      return {
        canAssign: false,
        reason: 'User not found',
        currentCount: 0,
        availableSlots: 0
      }
    }

    if (capacity.currentAssignedCount >= 3) {
      return {
        canAssign: false,
        reason: 'User has reached maximum bill limit of 3',
        currentCount: capacity.currentAssignedCount,
        availableSlots: capacity.availableSlots
      }
    }

    return {
      canAssign: true,
      currentCount: capacity.currentAssignedCount,
      availableSlots: capacity.availableSlots
    }
  } catch (error) {
    console.error('Failed to validate user assignment with cache:', error)
    return {
      canAssign: false,
      reason: 'Validation failed',
      currentCount: 0,
      availableSlots: 0
    }
  }
}

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  cache.cleanup()
}, 5 * 60 * 1000)

// Log cache statistics every 10 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = cache.getStats()
    if (stats.validEntries > 0) {
      console.log('Cache stats:', {
        validEntries: stats.validEntries,
        memoryUsage: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024) + 'MB'
      })
    }
  }, 10 * 60 * 1000)
}
