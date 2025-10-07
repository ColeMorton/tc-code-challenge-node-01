/**
 * Performance monitoring and metrics collection for bill assignment operations
 */

import {
  PerformanceMetric,
  CacheMetric
} from '@/app/lib/definitions'

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000 // Keep last 1000 metrics
  private cacheMetrics: CacheMetric = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsage: 0
  }

  /**
   * Record a performance metric
   */
  record(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      const level = metric.success ? 'info' : 'error'
      console[level](`[PERF] ${metric.operation}: ${metric.duration}ms`, metric.metadata)
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheMetrics.hits++
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMetrics.misses++
  }

  /**
   * Record cache eviction
   */
  recordCacheEviction(): void {
    this.cacheMetrics.evictions++
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operation: string, timeWindowMs: number = 300000): {
    count: number
    successCount: number
    errorCount: number
    avgDuration: number
    minDuration: number
    maxDuration: number
    p95Duration: number
    successRate: number
  } {
    const cutoff = Date.now() - timeWindowMs
    const operationMetrics = this.metrics.filter(
      m => m.operation === operation && m.timestamp > cutoff
    )

    if (operationMetrics.length === 0) {
      return {
        count: 0,
        successCount: 0,
        errorCount: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        successRate: 0
      }
    }

    const durations = operationMetrics.map(m => m.duration).sort((a, b) => a - b)
    const successCount = operationMetrics.filter(m => m.success).length
    const errorCount = operationMetrics.length - successCount

    return {
      count: operationMetrics.length,
      successCount,
      errorCount,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      successRate: successCount / operationMetrics.length
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheMetric & {
    hitRate: number
    totalRequests: number
  } {
    const totalRequests = this.cacheMetrics.hits + this.cacheMetrics.misses
    return {
      ...this.cacheMetrics,
      hitRate: totalRequests > 0 ? this.cacheMetrics.hits / totalRequests : 0,
      totalRequests
    }
  }

  /**
   * Get overall performance summary
   */
  getSummary(timeWindowMs: number = 300000): {
    totalOperations: number
    operations: Record<string, {
      count: number
      successCount: number
      errorCount: number
      avgDuration: number
      minDuration: number
      maxDuration: number
      p95Duration: number
      successRate: number
    }>
    cacheStats: CacheMetric & {
      hitRate: number
      totalRequests: number
    }
    systemHealth: 'healthy' | 'degraded' | 'unhealthy'
  } {
    const cutoff = Date.now() - timeWindowMs
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)
    
    const operations: Record<string, {
      count: number
      successCount: number
      errorCount: number
      avgDuration: number
      minDuration: number
      maxDuration: number
      p95Duration: number
      successRate: number
    }> = {}
    const operationTypes = [...new Set(recentMetrics.map(m => m.operation))]
    
    for (const operation of operationTypes) {
      operations[operation] = this.getOperationStats(operation, timeWindowMs)
    }

    const cacheStats = this.getCacheStats()
    
    // Determine system health based on success rates and performance
    const operationCount = Object.keys(operations).length
    
    let systemHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    // If no operations, system is healthy (no data to judge)
    if (operationCount > 0) {
      const avgSuccessRate = Object.values(operations).reduce((acc, op) => 
        acc + op.successRate, 0) / operationCount
      
      const avgDuration = Object.values(operations).reduce((acc, op) => 
        acc + op.avgDuration, 0) / operationCount

      if (avgSuccessRate < 0.95 || avgDuration > 1000) {
        systemHealth = 'degraded'
      }
      if (avgSuccessRate < 0.90 || avgDuration > 2000) {
        systemHealth = 'unhealthy'
      }
    }

    return {
      totalOperations: recentMetrics.length,
      operations,
      cacheStats,
      systemHealth
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Decorator function to automatically monitor function performance
 */
export function monitorPerformance<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    let success = true
    let error: string | undefined

    try {
      const result = await fn(...args)
      return result
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      const duration = Date.now() - startTime
      performanceMonitor.record({
        operation,
        duration,
        success,
        error,
        metadata: {
          args: args.length,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
}

/**
 * Monitor bill assignment performance specifically
 */
export function monitorBillAssignment<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return monitorPerformance('assignBill', fn)
}

/**
 * Monitor bill creation performance specifically
 */
export function monitorBillCreation<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return monitorPerformance('createBill', fn)
}

/**
 * Get current system health status
 */
export function getSystemHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy'
  metrics: {
    totalOperations: number
    operations: Record<string, {
      count: number
      successCount: number
      errorCount: number
      avgDuration: number
      minDuration: number
      maxDuration: number
      p95Duration: number
      successRate: number
    }>
    cacheStats: CacheMetric & {
      hitRate: number
      totalRequests: number
    }
    systemHealth: 'healthy' | 'degraded' | 'unhealthy'
  }
  recommendations: string[]
} {
  const summary = performanceMonitor.getSummary()
  const recommendations: string[] = []

  // Analyze performance and provide recommendations
  if (summary.systemHealth === 'degraded') {
    recommendations.push('Consider increasing cache TTL or optimizing database queries')
  }
  
  if (summary.systemHealth === 'unhealthy') {
    recommendations.push('Immediate attention required - check database performance and error rates')
  }

  const cacheStats = summary.cacheStats
  if (cacheStats.hitRate < 0.7) {
    recommendations.push('Cache hit rate is low - consider adjusting cache strategy')
  }

  // Check for specific operation issues
  for (const [operation, stats] of Object.entries(summary.operations)) {
    if (stats.avgDuration > 1000) {
      recommendations.push(`${operation} is slow (${stats.avgDuration}ms avg) - consider optimization`)
    }
    if (stats.successRate < 0.95) {
      recommendations.push(`${operation} has high error rate (${(1 - stats.successRate) * 100}%) - investigate errors`)
    }
  }

  return {
    status: summary.systemHealth,
    metrics: summary,
    recommendations
  }
}

/**
 * Log performance summary periodically
 */
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const health = getSystemHealth()
    if (health.status !== 'healthy' || health.recommendations.length > 0) {
      console.log('🚨 System Health Alert:', health)
    }
  }, 5 * 60 * 1000) // Every 5 minutes
}
