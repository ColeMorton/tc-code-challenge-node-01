import { useState, useCallback } from 'react'

interface UseErrorHandlerOptions {
  autoHideMs?: number
}

interface UseErrorHandlerReturn {
  error: string | null
  showError: (message: string) => void
  clearError: () => void
}

/**
 * Custom hook for handling error states with optional auto-hide functionality
 * Follows DRY principle by centralizing error handling logic
 */
export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const { autoHideMs = 5000 } = options
  const [error, setError] = useState<string | null>(null)
  
  const showError = useCallback((message: string) => {
    setError(message)
    if (autoHideMs > 0) {
      setTimeout(() => setError(null), autoHideMs)
    }
  }, [autoHideMs])
  
  const clearError = useCallback(() => setError(null), [])
  
  return { error, showError, clearError }
}
