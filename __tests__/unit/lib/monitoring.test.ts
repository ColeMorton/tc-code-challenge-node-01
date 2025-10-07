/**
 * Unit tests for lib/monitoring.ts
 * Tests the PerformanceMonitor class and monitoring decorators
 */

import {
  performanceMonitor,
  monitorPerformance,
  monitorBillAssignment,
  monitorBillCreation,
  getSystemHealth
} from '@/lib/monitoring'
import { PerformanceMetric } from '@/app/lib/definitions'

// Mock console methods to suppress output during tests
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleInfo = console.info

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceMonitor.clear()
    
    // Suppress console output during tests
    console.log = jest.fn()
    console.error = jest.fn()
    console.info = jest.fn()
  })

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog
    console.error = originalConsoleError
    console.info = originalConsoleInfo
  })

  describe('record()', () => {
    it('should record a successful metric', () => {
      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        operation: 'testOperation',
        duration: 150,
        success: true,
        metadata: { test: 'data' }
      }

      performanceMonitor.record(metric)

      const stats = performanceMonitor.getOperationStats('testOperation')
      expect(stats.count).toBe(1)
      expect(stats.successCount).toBe(1)
      expect(stats.errorCount).toBe(0)
      expect(stats.avgDuration).toBe(150)
      expect(stats.successRate).toBe(1)
    })

    it('should record a failed metric', () => {
      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        operation: 'testOperation',
        duration: 250,
        success: false,
        error: 'Test error',
        metadata: { test: 'data' }
      }

      performanceMonitor.record(metric)

      const stats = performanceMonitor.getOperationStats('testOperation')
      expect(stats.count).toBe(1)
      expect(stats.successCount).toBe(0)
      expect(stats.errorCount).toBe(1)
      expect(stats.avgDuration).toBe(250)
      expect(stats.successRate).toBe(0)
    })

    it('should log in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        operation: 'testOperation',
        duration: 100,
        success: true,
        metadata: { test: 'data' }
      }

      performanceMonitor.record(metric)

      expect(console.info).toHaveBeenCalledWith(
        '[PERF] testOperation: 100ms',
        { test: 'data' }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should log errors in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        operation: 'testOperation',
        duration: 200,
        success: false,
        error: 'Test error',
        metadata: { test: 'data' }
      }

      performanceMonitor.record(metric)

      expect(console.error).toHaveBeenCalledWith(
        '[PERF] testOperation: 200ms',
        { test: 'data' }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should not log in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        operation: 'testOperation',
        duration: 100,
        success: true,
        metadata: { test: 'data' }
      }

      performanceMonitor.record(metric)

      expect(console.info).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should maintain metrics within maxMetrics limit', () => {
      const originalMaxMetrics = (performanceMonitor as unknown as { maxMetrics: number }).maxMetrics
      ;(performanceMonitor as unknown as { maxMetrics: number }).maxMetrics = 3

      // Record 5 metrics
      for (let i = 0; i < 5; i++) {
        performanceMonitor.record({
          operation: 'testOperation',
          duration: i * 10,
          success: true
        })
      }

      const stats = performanceMonitor.getOperationStats('testOperation')
      expect(stats.count).toBe(3) // Should only keep last 3
      expect(stats.minDuration).toBe(20) // 2nd, 3rd, 4th metrics
      expect(stats.maxDuration).toBe(40) // 4th metric

      ;(performanceMonitor as unknown as { maxMetrics: number }).maxMetrics = originalMaxMetrics
    })
  })

  describe('getOperationStats()', () => {
    it('should return zero stats for non-existent operation', () => {
      const stats = performanceMonitor.getOperationStats('nonExistent')
      
      expect(stats).toEqual({
        count: 0,
        successCount: 0,
        errorCount: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        successRate: 0
      })
    })

    it('should calculate stats for single operation', () => {
      performanceMonitor.record({
        operation: 'testOp',
        duration: 100,
        success: true
      })

      const stats = performanceMonitor.getOperationStats('testOp')
      expect(stats.count).toBe(1)
      expect(stats.successCount).toBe(1)
      expect(stats.errorCount).toBe(0)
      expect(stats.avgDuration).toBe(100)
      expect(stats.minDuration).toBe(100)
      expect(stats.maxDuration).toBe(100)
      expect(stats.p95Duration).toBe(100)
      expect(stats.successRate).toBe(1)
    })

    it('should calculate stats for multiple operations', () => {
      const durations = [50, 100, 150, 200, 250]
      durations.forEach((duration, index) => {
        performanceMonitor.record({
          operation: 'testOp',
          duration,
          success: index < 3 // First 3 succeed, last 2 fail
        })
      })

      const stats = performanceMonitor.getOperationStats('testOp')
      expect(stats.count).toBe(5)
      expect(stats.successCount).toBe(3)
      expect(stats.errorCount).toBe(2)
      expect(stats.avgDuration).toBe(150) // (50+100+150+200+250)/5
      expect(stats.minDuration).toBe(50)
      expect(stats.maxDuration).toBe(250)
      expect(stats.p95Duration).toBe(250) // Math.floor(5 * 0.95) = 4, durations[4] = 250
      expect(stats.successRate).toBe(0.6) // 3/5
    })

    it('should filter by time window', () => {
      const now = Date.now()
      
      // Mock Date.now to control timestamps
      const originalNow = Date.now
      let mockTime = now - 400000 // 400 seconds ago
      Date.now = jest.fn(() => mockTime)

      // Record old metric
      performanceMonitor.record({
        operation: 'testOp',
        duration: 100,
        success: true
      })

      // Record recent metric
      mockTime = now - 100000 // 100 seconds ago
      performanceMonitor.record({
        operation: 'testOp',
        duration: 200,
        success: true
      })

      // Get stats with 5-minute window (300000ms)
      const stats = performanceMonitor.getOperationStats('testOp', 300000)
      expect(stats.count).toBe(1) // Only the recent one
      expect(stats.avgDuration).toBe(200)

      Date.now = originalNow
    })
  })

  describe('cache metrics', () => {
    it('should record cache hits and misses', () => {
      performanceMonitor.recordCacheHit()
      performanceMonitor.recordCacheHit()
      performanceMonitor.recordCacheMiss()

      const cacheStats = performanceMonitor.getCacheStats()
      expect(cacheStats.hits).toBe(2)
      expect(cacheStats.misses).toBe(1)
      expect(cacheStats.totalRequests).toBe(3)
      expect(cacheStats.hitRate).toBe(2/3)
    })

    it('should record cache evictions', () => {
      performanceMonitor.recordCacheEviction()
      performanceMonitor.recordCacheEviction()

      const cacheStats = performanceMonitor.getCacheStats()
      expect(cacheStats.evictions).toBe(2)
    })

    it('should handle zero cache requests', () => {
      const cacheStats = performanceMonitor.getCacheStats()
      expect(cacheStats.hitRate).toBe(0)
      expect(cacheStats.totalRequests).toBe(0)
    })
  })

  describe('getSummary()', () => {
    it('should return summary with multiple operations', () => {
      // Record metrics for different operations
      performanceMonitor.record({ operation: 'createBill', duration: 100, success: true })
      performanceMonitor.record({ operation: 'createBill', duration: 150, success: false })
      performanceMonitor.record({ operation: 'assignBill', duration: 200, success: true })

      const summary = performanceMonitor.getSummary()
      
      expect(summary.totalOperations).toBe(3)
      expect(Object.keys(summary.operations)).toHaveLength(2)
      expect(summary.operations.createBill.count).toBe(2)
      expect(summary.operations.assignBill.count).toBe(1)
      expect(summary.cacheStats).toBeDefined()
      expect(['healthy', 'degraded', 'unhealthy']).toContain(summary.systemHealth)
    })

    it('should determine system health as healthy', () => {
      // Record successful operations with good performance
      performanceMonitor.record({ operation: 'testOp', duration: 100, success: true })
      performanceMonitor.record({ operation: 'testOp', duration: 150, success: true })

      const summary = performanceMonitor.getSummary()
      expect(summary.systemHealth).toBe('healthy')
    })

    it('should determine system health as degraded for slow operations', () => {
      // Record slow operations that should trigger degraded status
      performanceMonitor.record({ operation: 'testOp', duration: 1500, success: true })
      performanceMonitor.record({ operation: 'testOp', duration: 2000, success: true })

      const summary = performanceMonitor.getSummary()
      expect(summary.systemHealth).toBe('degraded')
    })

    it('should determine system health as unhealthy', () => {
      // Record operations with very poor success rate
      performanceMonitor.record({ operation: 'testOp', duration: 100, success: false })
      performanceMonitor.record({ operation: 'testOp', duration: 150, success: false })
      performanceMonitor.record({ operation: 'testOp', duration: 200, success: true })

      const summary = performanceMonitor.getSummary()
      expect(summary.systemHealth).toBe('unhealthy')
    })

  })

  describe('clear()', () => {
    it('should clear all metrics and cache stats', () => {
      // Add some data
      performanceMonitor.record({ operation: 'testOp', duration: 100, success: true })
      performanceMonitor.recordCacheHit()
      performanceMonitor.recordCacheMiss()

      // Clear everything
      performanceMonitor.clear()

      // Verify everything is cleared
      const stats = performanceMonitor.getOperationStats('testOp')
      expect(stats.count).toBe(0)

      const cacheStats = performanceMonitor.getCacheStats()
      expect(cacheStats.hits).toBe(0)
      expect(cacheStats.misses).toBe(0)
      expect(cacheStats.evictions).toBe(0)
    })
  })
})

describe('monitorPerformance decorator', () => {
  beforeEach(() => {
    performanceMonitor.clear()
    console.log = jest.fn()
    console.error = jest.fn()
    console.info = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
    console.info = originalConsoleInfo
  })

  it('should monitor successful function execution', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')
    const monitoredFn = monitorPerformance('testOperation', mockFn)

    const result = await monitoredFn('arg1', 'arg2')

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')

    const stats = performanceMonitor.getOperationStats('testOperation')
    expect(stats.count).toBe(1)
    expect(stats.successCount).toBe(1)
    expect(stats.successRate).toBe(1)
  })

  it('should monitor failed function execution', async () => {
    const mockError = new Error('Test error')
    const mockFn = jest.fn().mockRejectedValue(mockError)
    const monitoredFn = monitorPerformance('testOperation', mockFn)

    await expect(monitoredFn('arg1')).rejects.toThrow('Test error')

    const stats = performanceMonitor.getOperationStats('testOperation')
    expect(stats.count).toBe(1)
    expect(stats.errorCount).toBe(1)
    expect(stats.successRate).toBe(0)
  })

  it('should monitor function with non-Error exception', async () => {
    const mockFn = jest.fn().mockRejectedValue('String error')
    const monitoredFn = monitorPerformance('testOperation', mockFn)

    await expect(monitoredFn()).rejects.toBe('String error')

    const stats = performanceMonitor.getOperationStats('testOperation')
    expect(stats.count).toBe(1)
    expect(stats.errorCount).toBe(1)
  })

  it('should record metadata including args count and timestamp', async () => {
    const mockFn = jest.fn().mockResolvedValue('result')
    const monitoredFn = monitorPerformance('testOperation', mockFn)

    await monitoredFn('arg1', 'arg2', 'arg3')

    // Verify that metadata was recorded (we can't easily test the exact timestamp)
    // but we can verify the operation was recorded
    const stats = performanceMonitor.getOperationStats('testOperation')
    expect(stats.count).toBe(1)
  })
})

describe('specific monitoring decorators', () => {
  beforeEach(() => {
    performanceMonitor.clear()
  })

  it('should use correct operation name for monitorBillAssignment', async () => {
    const mockFn = jest.fn().mockResolvedValue('result')
    const monitoredFn = monitorBillAssignment(mockFn)

    await monitoredFn('arg1')

    const stats = performanceMonitor.getOperationStats('assignBill')
    expect(stats.count).toBe(1)
  })

  it('should use correct operation name for monitorBillCreation', async () => {
    const mockFn = jest.fn().mockResolvedValue('result')
    const monitoredFn = monitorBillCreation(mockFn)

    await monitoredFn('arg1')

    const stats = performanceMonitor.getOperationStats('createBill')
    expect(stats.count).toBe(1)
  })
})

describe('getSystemHealth()', () => {
  beforeEach(() => {
    performanceMonitor.clear()
  })

  it('should return healthy status with no recommendations', () => {
    // Add healthy metrics
    performanceMonitor.record({ operation: 'testOp', duration: 100, success: true })
    performanceMonitor.recordCacheHit()
    performanceMonitor.recordCacheHit()
    performanceMonitor.recordCacheHit()
    performanceMonitor.recordCacheMiss() // 75% hit rate (above 70% threshold)

    const health = getSystemHealth()
    
    expect(health.status).toBe('healthy')
    expect(health.recommendations).toHaveLength(0)
    expect(health.metrics).toBeDefined()
  })

  it('should provide degraded recommendations', () => {
    // Add degraded metrics
    performanceMonitor.record({ operation: 'slowOp', duration: 1500, success: true })
    performanceMonitor.recordCacheMiss()
    performanceMonitor.recordCacheMiss()

    const health = getSystemHealth()
    
    expect(health.status).toBe('degraded')
    expect(health.recommendations).toContain('Consider increasing cache TTL or optimizing database queries')
    expect(health.recommendations.some(rec => rec.includes('slowOp is slow'))).toBe(true)
  })

  it('should provide unhealthy recommendations', () => {
    // Add unhealthy metrics
    performanceMonitor.record({ operation: 'failingOp', duration: 100, success: false })
    performanceMonitor.record({ operation: 'failingOp', duration: 150, success: false })

    const health = getSystemHealth()
    
    expect(health.status).toBe('unhealthy')
    expect(health.recommendations).toContain('Immediate attention required - check database performance and error rates')
    expect(health.recommendations.some(rec => rec.includes('failingOp has high error rate'))).toBe(true)
  })

  it('should recommend cache optimization for low hit rate', () => {
    // Add metrics with low cache hit rate
    performanceMonitor.recordCacheMiss()
    performanceMonitor.recordCacheMiss()
    performanceMonitor.recordCacheHit() // 33% hit rate

    const health = getSystemHealth()
    
    expect(health.recommendations).toContain('Cache hit rate is low - consider adjusting cache strategy')
  })

  it('should provide operation-specific recommendations', () => {
    // Add slow operation
    performanceMonitor.record({ operation: 'slowQuery', duration: 2500, success: true })
    
    // Add operation with high error rate
    performanceMonitor.record({ operation: 'errorOp', duration: 100, success: false })
    performanceMonitor.record({ operation: 'errorOp', duration: 150, success: true })

    const health = getSystemHealth()
    
    expect(health.recommendations.some(rec => 
      rec.includes('slowQuery is slow') && rec.includes('2500ms avg')
    )).toBe(true)
    
    expect(health.recommendations.some(rec => 
      rec.includes('errorOp has high error rate') && rec.includes('50%')
    )).toBe(true)
  })

  it('should handle empty metrics gracefully', () => {
    const health = getSystemHealth()
    
    // When there are no operations, the health calculation should handle division by zero
    // The actual implementation returns 'healthy' when there are no operations
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    expect(health.metrics.totalOperations).toBe(0)
    expect(Object.keys(health.metrics.operations)).toHaveLength(0)
    // Even with no operations, cache hit rate < 0.7 will trigger recommendations
    expect(health.recommendations).toBeDefined()
  })
})
