# Modern React Patterns Guide

[← Back to Documentation](../README.md) | [Component Architecture](../architecture/components.md) | [Hooks Reference](../reference/hooks.md)

This guide covers modern React patterns and best practices implemented in the Bill Management System. It demonstrates how to build maintainable, performant React applications using current best practices.

## Overview

This guide covers the following modern React patterns:

1. **Custom Hooks Composition** - Building reusable state logic
2. **Separation of Concerns** - Clean architecture patterns
3. **TypeScript Integration** - Type-safe React development
4. **Performance Patterns** - Optimization strategies
5. **Component Composition** - Flexible and reusable components
6. **Error Handling Patterns** - Robust error management

---

## Custom Hooks Composition

### 1. Single Responsibility Hooks

#### Form State Management
```typescript
// ✅ Single responsibility: form state only
export const useBillForm = () => {
  const [formData, setFormData] = useState<BillFormData>({...})
  const [validation, setValidation] = useState<FormValidationState>({...})
  
  const updateField = useCallback((field: keyof BillFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Validation logic
  }, [])
  
  return { formData, validation, updateField }
}
```

#### Error State Management
```typescript
// ✅ Single responsibility: error handling only
export const useErrorHandler = (autoHideMs = 5000) => {
  const [error, setError] = useState<string | null>(null)
  
  const showError = useCallback((message: string) => {
    setError(message)
    if (autoHideMs > 0) {
      setTimeout(() => setError(null), autoHideMs)
    }
  }, [autoHideMs])
  
  return { error, showError, clearError: () => setError(null) }
}
```

### 2. Hook Composition Patterns

#### Combining Multiple Hooks
```typescript
// ✅ Compose multiple hooks for complex functionality
export const useBillFormWithErrorHandling = () => {
  const { error, showError, clearError } = useErrorHandler()
  const { formData, validation, updateField, submitForm } = useBillForm()
  
  const handleSubmit = useCallback(async () => {
    clearError()
    try {
      await submitForm()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Submission failed')
    }
  }, [submitForm, showError, clearError])
  
  return {
    formData,
    validation,
    error,
    updateField,
    handleSubmit
  }
}
```

#### Specialized Hook Creation
```typescript
// ✅ Create specialized hooks from base hooks
export const useAsyncOperation = <T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const { error, showError, clearError } = useErrorHandler()
  
  const execute = useCallback(async () => {
    setLoading(true)
    clearError()
    
    try {
      const result = await operation()
      setData(result)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }, [operation, showError, clearError, ...dependencies])
  
  return { data, loading, error, execute }
}
```

---

## Separation of Concerns

### 1. Business Logic Separation

#### Before: Mixed Concerns
```typescript
// ❌ Business logic mixed with UI
export default function BillForm() {
  const [formData, setFormData] = useState({...})
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation logic
    const validation = validateForm(formData)
    if (!validation.isValid) {
      setError('Invalid form')
      return
    }
    
    // API call logic
    try {
      const result = await createBill(formData)
      if (result.success) {
        router.push('/bills')
      }
    } catch (err) {
      setError('Failed to create bill')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form JSX */}
    </form>
  )
}
```

#### After: Separated Concerns
```typescript
// ✅ UI component focuses only on presentation
export default function BillForm() {
  const {
    formData,
    validation,
    error,
    handleSubmit,
    isPending
  } = useBillForm() // Business logic extracted to hook
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form JSX */}
    </form>
  )
}

// ✅ Business logic in custom hook
export const useBillForm = () => {
  // All form logic centralized here
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    // Validation and submission logic
  }, [])
  
  return { formData, validation, error, handleSubmit }
}
```

### 2. Data Layer Separation

#### Repository Pattern
```typescript
// ✅ Data access layer separated from components
export class BillRepository {
  static async createBill(data: CreateBillInput): Promise<Bill> {
    // Database operations
    return await prisma.bill.create({ data })
  }
  
  static async getBills(): Promise<Bill[]> {
    // Database operations
    return await prisma.bill.findMany({...})
  }
}

// ✅ Service layer for business logic
export class BillService {
  static async createBill(data: CreateBillInput): Promise<Bill> {
    // Business logic validation
    const validation = validateCreateBillInput(data)
    if (!validation.isValid) {
      throw new Error('Invalid bill data')
    }
    
    // Data access
    return await BillRepository.createBill(data)
  }
}
```

---

## TypeScript Integration

### 1. Strict Type Safety

#### Component Props
```typescript
// ✅ Strict interface definitions
interface BillsDashboardProps {
  bills: Bill[]
  users: User[]
  onBillAssign?: (billId: string, userId: string) => Promise<void>
}

export default function BillsDashboard({ 
  bills, 
  users, 
  onBillAssign 
}: BillsDashboardProps) {
  // Component implementation
}
```

#### Hook Return Types
```typescript
// ✅ Explicit hook return types
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

export const useBillForm = (): UseBillFormReturn => {
  // Hook implementation
}
```

#### Generic Hooks
```typescript
// ✅ Generic hooks for reusability
interface UseAsyncOperationReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: () => Promise<void>
}

export const useAsyncOperation = <T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
): UseAsyncOperationReturn<T> => {
  // Generic implementation
}
```

### 2. Type Guards and Assertions

#### Runtime Type Safety
```typescript
// ✅ Type guards for runtime safety
const isBill = (obj: any): obj is Bill => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.billReference === 'string' &&
    obj.billDate instanceof Date
  )
}

// Usage
const processBill = (data: unknown) => {
  if (isBill(data)) {
    // data is now typed as Bill
    console.log(data.billReference)
  }
}
```

---

## Performance Patterns

### 1. Memoization Strategies

#### Selective Memoization
```typescript
// ✅ Memoize only expensive operations
export default function BillsDashboard({ bills }: { bills: Bill[] }) {
  // ✅ Memoize expensive grouping
  const groupedBills = useMemo(() => groupBillsByStage(bills), [bills])
  
  // ✅ Memoize event handlers
  const assignBill = useCallback(async (billId: string, userId: string) => {
    // Assignment logic
  }, [dependencies])
  
  // ❌ Don't memoize simple operations
  const title = 'Bills Dashboard' // Simple string, no need to memoize
  
  return (
    // Component JSX
  )
}
```

#### Dependency Optimization
```typescript
// ✅ Minimal dependencies for better performance
const handleFieldChange = useCallback((field: string, value: string) => {
  // Handler logic
}, [formData]) // Only include essential dependencies

// ❌ Avoid including all dependencies
const handleFieldChange = useCallback((field: string, value: string) => {
  // Handler logic
}, [formData, validation, error, success, isPending]) // Too many dependencies
```

### 2. Component Optimization

#### React.memo Usage
```typescript
// ✅ Memo for pure components
export const BillCard = memo<BillCardProps>(({ bill, onAssign }) => {
  return (
    <div className="bill-card">
      <h3>{bill.billReference}</h3>
      <p>Date: {formatDate(bill.billDate)}</p>
      <button onClick={() => onAssign(bill.id, 'user-id')}>
        Assign
      </button>
    </div>
  )
})

// ✅ Custom comparison for complex props
export const BillCard = memo<BillCardProps>(
  ({ bill, onAssign }) => {
    return (
      // Component JSX
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.bill.id === nextProps.bill.id &&
      prevProps.bill.billReference === nextProps.bill.billReference
    )
  }
)
```

---

## Component Composition

### 1. Compound Component Pattern

#### Flexible Component API
```typescript
// ✅ Compound component for flexible composition
interface FormProps {
  children: React.ReactNode
  onSubmit: (data: FormData) => void
}

export const Form = ({ children, onSubmit }: FormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {children}
    </form>
  )
}

interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
}

export const Field = ({ label, error, children }: FieldProps) => {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}

export const Input = ({ value, onChange, ...props }) => {
  return (
    <input
      value={value}
      onChange={onChange}
      className="mt-1 block w-full px-3 py-2 border rounded-md"
      {...props}
    />
  )
}

// Usage
<Form onSubmit={handleSubmit}>
  <Field label="Bill Reference" error={validation.billReference}>
    <Input
      value={formData.billReference}
      onChange={(e) => handleBillReferenceChange(e.target.value)}
    />
  </Field>
</Form>
```

### 2. Render Props Pattern

#### Flexible Rendering Logic
```typescript
// ✅ Render props for flexible rendering
interface DataFetcherProps<T> {
  fetchData: () => Promise<T>
  children: (props: {
    data: T | null
    loading: boolean
    error: string | null
    refetch: () => void
  }) => React.ReactNode
}

export const DataFetcher = <T,>({ fetchData, children }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetchData()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [fetchData])
  
  useEffect(() => {
    refetch()
  }, [refetch])
  
  return <>{children({ data, loading, error, refetch })}</>
}

// Usage
<DataFetcher fetchData={getBills}>
  {({ data, loading, error, refetch }) => {
    if (loading) return <BillsSkeleton />
    if (error) return <div>Error: {error}</div>
    return <BillsList bills={data} onRefresh={refetch} />
  }}
</DataFetcher>
```

---

## Error Handling Patterns

### 1. Error Boundary Integration

#### Component Error Boundaries
```typescript
// ✅ Error boundary for component error handling
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ComponentErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return <Fallback error={this.state.error!} />
    }
    
    return this.props.children
  }
}

// Usage
<ComponentErrorBoundary fallback={CustomErrorFallback}>
  <BillsDashboard />
</ComponentErrorBoundary>
```

### 2. Hook-based Error Handling

#### Centralized Error Management
```typescript
// ✅ Centralized error handling with hooks
export const useErrorHandler = (autoHideMs = 5000) => {
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

// Usage in components
export default function BillsDashboard() {
  const { error, showError, clearError } = useErrorHandler()
  
  const handleAction = async () => {
    clearError()
    try {
      await performAction()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Action failed')
    }
  }
  
  return (
    <div>
      {error && <div className="error">{error}</div>}
      {/* Component content */}
    </div>
  )
}
```

---

## Testing Patterns

### 1. Hook Testing

#### Custom Hook Testing
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
  
  it('should auto-hide errors after timeout', async () => {
    const { result } = renderHook(() => useErrorHandler(100))
    
    act(() => {
      result.current.showError('Test error')
    })
    
    expect(result.current.error).toBe('Test error')
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })
    
    expect(result.current.error).toBe(null)
  })
})
```

### 2. Component Testing

#### Integration Testing with Hooks
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import BillForm from '@/app/ui/bills/form'

describe('BillForm with useBillForm hook', () => {
  it('should handle form submission', async () => {
    render(<BillForm users={mockUsers} />)
    
    fireEvent.change(screen.getByTestId('bill-reference-input'), {
      target: { value: 'BILL-2024-001' }
    })
    
    fireEvent.click(screen.getByTestId('submit-button'))
    
    expect(await screen.findByText('Bill Created Successfully!')).toBeInTheDocument()
  })
})
```

---

## Best Practices Summary

### 1. Hook Design
- **Single Responsibility**: Each hook should have one clear purpose
- **Composability**: Design hooks to work well together
- **Type Safety**: Provide explicit TypeScript interfaces
- **Performance**: Use memoization appropriately

### 2. Component Design
- **Separation of Concerns**: Keep UI and business logic separate
- **Composition over Inheritance**: Use composition patterns
- **Props Interface**: Define clear, typed props interfaces
- **Error Boundaries**: Implement proper error handling

### 3. State Management
- **Custom Hooks**: Extract complex state logic to hooks
- **State Consolidation**: Group related state together
- **Memoization**: Use `useMemo` and `useCallback` appropriately
- **Performance**: Optimize for minimal re-renders

### 4. TypeScript Integration
- **Strict Types**: Use strict TypeScript configuration
- **Interface Definitions**: Define clear interfaces for all data structures
- **Generic Types**: Use generics for reusable components and hooks
- **Type Guards**: Implement runtime type safety where needed

---

## Related Documentation

- [Component Architecture](../architecture/components.md) - Component structure and patterns
- [Hooks Reference](../reference/hooks.md) - Custom hooks documentation
- [Performance Guide](performance.md) - Performance optimization strategies
- [Testing Guide](testing-guide.md) - Testing strategies and patterns

This guide provides a comprehensive foundation for building modern React applications with clean architecture, excellent performance, and maintainable code.
