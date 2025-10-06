import { NextResponse } from 'next/server'
import { getSystemHealth } from '@/lib/monitoring'
import { cache } from '@/lib/cache'

export async function GET() {
  try {
    const health = getSystemHealth()
    const cacheStats = cache.getStats()
    
    return NextResponse.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      performance: health.metrics,
      cache: {
        ...cacheStats,
        hitRate: cacheStats.validEntries > 0 ? 'available' : 'no data'
      },
      recommendations: health.recommendations,
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
