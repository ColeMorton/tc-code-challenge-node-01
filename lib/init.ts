/**
 * Application initialization script
 * Sets up database constraints, cache, and monitoring
 */

import { applyDatabaseConstraints } from './database-constraints'
import { performanceMonitor } from './monitoring'

let isInitialized = false

export async function initializeApp(): Promise<boolean> {
  if (isInitialized) {
    console.log('App already initialized')
    return true
  }

  try {
    console.log('🚀 Initializing application...')

    // Apply database constraints
    const constraintsApplied = await applyDatabaseConstraints()
    if (!constraintsApplied) {
      console.warn('⚠️ Database constraints not applied - continuing without them')
    }

    // Initialize performance monitoring
    performanceMonitor.record({
      operation: 'app_initialization',
      duration: 0,
      success: true,
      metadata: {
        constraintsApplied,
        timestamp: new Date().toISOString()
      }
    })

    isInitialized = true
    console.log('✅ Application initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    performanceMonitor.record({
      operation: 'app_initialization',
      duration: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        timestamp: new Date().toISOString()
      }
    })
    return false
  }
}

export function getInitializationStatus(): boolean {
  return isInitialized
}
