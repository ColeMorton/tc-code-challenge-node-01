# Custom Hooks Reference

[← Back to Documentation](../README.md) | [Component Architecture](../architecture/components.md) | [Data Operations Guide](../guides/data-operations.md)

This document provides comprehensive documentation for the custom React hooks in the Bill Management System. These hooks follow modern React patterns and implement SOLID principles for maintainable, reusable state management.

## Overview

The system implements two custom hooks that centralize common patterns and follow the Single Responsibility Principle:

1. **`useBillForm`** - Form state and validation management
2. **`useErrorHandler`** - Centralized error state management

## Hook Architecture Principles

### Design Patterns Applied
- **Single Responsibility Principle (SRP)**: Each hook has one clear purpose
- **Don't Repeat Yourself (DRY)**: Eliminates duplicated logic across components
- **Separation of Concerns (SOC)**: Business logic separated from UI components
- **Open/Closed Principle**: Hooks are extensible without modification

### Performance Considerations
- **Memoization**: All callbacks are memoized with `useCallback`
- **Dependency Optimization**: Minimal dependency arrays to prevent unnecessary re-renders
- **State Consolidation**: Related state is grouped together to reduce update frequency

---

## useBillForm Hook

**File**: `app/hooks/useBillForm.ts`  
**Purpose**: Centralizes form state and validation logic for bill creation

### Interface

```typescript
interface UseBillFormReturn {
  formData: BillFormData
  validation: FormValidationState
  asyncValidation: AsyncValidationState
  error: string | null
  success: boolean
  isPending: boolean
  handleBillReferenceChange: (value: string) => void
  handleBillDateChange: (value: string) => void
  handleAssignedToChange: (value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}
```

### Usage Example

```typescript
import { useBillForm } from '@/app/hooks/useBillForm'

export default function BillForm({ users }: BillFormProps) {
  const {
    formData,
    validation,
    asyncValidation,
    error,
    success,
    isPending,
    handleBillReferenceChange,
    handleBillDateChange,
    handleAssignedToChange,
    handleSubmit
  } = useBillForm()

  // Component focuses purely on UI rendering
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields using the provided handlers */}
    </form>
  )
}
```

### Key Features

#### 1. Comprehensive State Management
```typescript
// Form data state
const [formData, setFormData] = useState<BillFormData>({
  billReference: '',
  billDate: '',
  assignedToId: ''
})

// Validation state (client-side)
const [validation, setValidation] = useState<FormValidationState>(
  initialValidationState
)

// Async validation state (server-side)
const [asyncValidation, setAsyncValidation] = useState<AsyncValidationState>({
  billReference: {
    isValid: true,
    isChecking: false,
    message: ''
  }
})
```

#### 2. Real-time Validation
```typescript
const handleBillReferenceChange = useCallback((value: string): void => {
  const sanitized = sanitizeBillReference(value)
  
  // Immediate client-side validation
  const fieldError = FieldValidators.billReference(sanitized)
  
  // Debounced server-side validation
  if (sanitized.trim() && !fieldError) {
    validationTimeoutRef.current = setTimeout(() => {
      handleValidateBillReference(sanitized)
    }, 500)
  }
}, [formData, handleValidateBillReference])
```

#### 3. Form Submission Handling
```typescript
const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
  e.preventDefault()
  clearError()

  // Comprehensive validation before submission
  const formValidation = validateForm(formData)
  
  if (!formValidation.isValid) {
    showError('Please fix the form errors')
    return
  }

  // Submit using Server Actions
  startTransition(async () => {
    try {
      await createBill({
        billReference: formData.billReference,
        billDate: formData.billDate,
        assignedToId: formData.assignedToId || undefined
      })
      
      setSuccess(true)
      setTimeout(() => router.push('/bills'), 2000)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'An error occurred')
    }
  })
}, [formData, asyncValidation, showError, clearError, router])
```

### Benefits

- **80% Complexity Reduction**: Form component reduced from ~200 lines to ~40 lines
- **Reusability**: Can be used in other form contexts
- **Testability**: Business logic separated from UI components
- **Performance**: Memoized callbacks prevent unnecessary re-renders
- **Type Safety**: Full TypeScript support with proper interfaces

### Dependencies

- `@/app/bills/actions` - Server Actions for form submission
- `@/app/lib/validation` - Validation schemas and functions
- `@/app/lib/types` - TypeScript interfaces
- `@/app/lib/security` - Input sanitization
- `@/app/hooks/useErrorHandler` - Error state management

---

## useErrorHandler Hook

**File**: `app/hooks/useErrorHandler.ts`  
**Purpose**: Centralizes error state management with consistent UX patterns

### Interface

```typescript
interface UseErrorHandlerOptions {
  autoHideMs?: number
}

interface UseErrorHandlerReturn {
  error: string | null
  showError: (message: string) => void
  clearError: () => void
}
```

### Usage Example

```typescript
import { useErrorHandler } from '@/app/hooks/useErrorHandler'

export default function MyComponent() {
  const { error, showError, clearError } = useErrorHandler({ autoHideMs: 5000 })

  const handleAction = async () => {
    try {
      await someAsyncAction()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {/* Component content */}
    </div>
  )
}
```

### Configuration Options

#### Auto-hide Timing
```typescript
// Default: 5 seconds
const { error, showError, clearError } = useErrorHandler()

// Custom timing: 10 seconds
const { error, showError, clearError } = useErrorHandler({ autoHideMs: 10000 })

// No auto-hide
const { error, showError, clearError } = useErrorHandler({ autoHideMs: 0 })
```

### Key Features

#### 1. Centralized Error State
```typescript
const [error, setError] = useState<string | null>(null)
```

#### 2. Configurable Auto-hide
```typescript
const showError = useCallback((message: string) => {
  setError(message)
  if (autoHideMs > 0) {
    setTimeout(() => setError(null), autoHideMs)
  }
}, [autoHideMs])
```

#### 3. Manual Error Clearing
```typescript
const clearError = useCallback(() => setError(null), [])
```

### Benefits

- **DRY Compliance**: Eliminates duplicated error handling logic across components
- **Consistent UX**: Uniform error display patterns throughout the application
- **Configurable**: Customizable auto-hide timing for different use cases
- **Performance**: Memoized functions prevent unnecessary re-renders
- **Accessibility**: Proper ARIA attributes for screen readers

### Common Patterns

#### Form Validation Errors
```typescript
const { error, showError, clearError } = useErrorHandler()

const handleSubmit = async (formData: FormData) => {
  clearError() // Clear any existing errors
  
  try {
    await submitForm(formData)
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Submission failed')
  }
}
```

#### API Error Handling
```typescript
const { error, showError } = useErrorHandler()

const handleApiCall = async () => {
  try {
    const result = await apiCall()
    if (!result.success) {
      showError(result.error || 'Operation failed')
    }
  } catch (err) {
    showError('Network error occurred')
  }
}
```

#### User Action Feedback
```typescript
const { error, showError, clearError } = useErrorHandler()

const handleUserAction = async (action: string) => {
  clearError()
  
  try {
    await performAction(action)
    // Success feedback handled elsewhere
  } catch (err) {
    showError(`Failed to ${action}: ${err.message}`)
  }
}
```

---

## Hook Composition Patterns

### Combining Hooks
```typescript
export default function ComplexComponent() {
  // Combine multiple hooks for comprehensive functionality
  const { error, showError, clearError } = useErrorHandler()
  const { formData, handleSubmit } = useBillForm()
  
  // Additional component logic
  const handleComplexAction = async () => {
    clearError()
    try {
      await handleSubmit(new Event('submit') as React.FormEvent)
    } catch (err) {
      showError('Complex action failed')
    }
  }
  
  return (
    // Component JSX
  )
}
```

### Custom Hook Composition
```typescript
// Create specialized hooks by composing base hooks
const useBillFormWithErrorHandling = () => {
  const { error, showError, clearError } = useErrorHandler()
  const formHook = useBillForm()
  
  return {
    ...formHook,
    error,
    showError,
    clearError
  }
}
```

---

## Testing Strategies

### Unit Testing Hooks
```typescript
import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '@/app/hooks/useErrorHandler'

describe('useErrorHandler', () => {
  it('should show and clear errors', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    act(() => {
      result.current.showError('Test error')
    })
    
    expect(result.current.error).toBe('Test error')
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBe(null)
  })
})
```

### Integration Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import BillForm from '@/app/ui/bills/form'

describe('BillForm with useBillForm hook', () => {
  it('should handle form submission', async () => {
    render(<BillForm users={mockUsers} />)
    
    // Test form interaction
    fireEvent.change(screen.getByTestId('bill-reference-input'), {
      target: { value: 'BILL-2024-001' }
    })
    
    fireEvent.click(screen.getByTestId('submit-button'))
    
    // Assert expected behavior
    expect(await screen.findByText('Bill Created Successfully!')).toBeInTheDocument()
  })
})
```

---

## Performance Considerations

### Memoization Strategy
```typescript
// All callbacks are memoized to prevent unnecessary re-renders
const handleFieldChange = useCallback((value: string) => {
  // Field change logic
}, [dependencies])

// Expensive calculations are memoized
const processedData = useMemo(() => {
  return expensiveCalculation(data)
}, [data])
```

### Dependency Optimization
```typescript
// Minimal dependency arrays to prevent unnecessary updates
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  // Submission logic
}, [formData, asyncValidation, showError, clearError, router])
// Only essential dependencies included
```

### State Consolidation
```typescript
// Related state is grouped to reduce update frequency
const [formData, setFormData] = useState<BillFormData>({
  billReference: '',
  billDate: '',
  assignedToId: ''
})
// Single state object instead of multiple useState calls
```

---

## Migration Guide

### From Inline Form Logic
```typescript
// Before: Complex inline form logic
export default function BillForm() {
  const [formData, setFormData] = useState({...})
  const [validation, setValidation] = useState({...})
  const [error, setError] = useState(null)
  // ... 100+ lines of form logic
  
  return <form>{/* Form JSX */}</form>
}

// After: Clean hook-based approach
export default function BillForm() {
  const {
    formData,
    validation,
    error,
    handleSubmit,
    // ... other handlers
  } = useBillForm()
  
  return <form onSubmit={handleSubmit}>{/* Form JSX */}</form>
}
```

### From Duplicated Error Handling
```typescript
// Before: Duplicated error handling
const [error, setError] = useState<string | null>(null)
setTimeout(() => setError(null), 5000) // Repeated in multiple components

// After: Centralized error handling
const { error, showError, clearError } = useErrorHandler()
showError('Error message') // Auto-hide configured centrally
```

---

## Related Documentation

- [Component Architecture](../architecture/components.md) - How hooks integrate with components
- [Data Operations Guide](../guides/data-operations.md) - Server Actions and API integration
- [Data Models Reference](data-models.md) - TypeScript interfaces used by hooks
- [Testing Guide](../guides/testing-guide.md) - Comprehensive testing strategies

This hook architecture provides a solid foundation for maintainable, performant React applications with clear separation of concerns and excellent developer experience.
