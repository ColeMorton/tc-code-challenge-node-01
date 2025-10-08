# Performance Guide

[← Back to Documentation](../README.md) | [Component Architecture](../architecture/components.md) | [Hooks Reference](../reference/hooks.md)

This guide provides comprehensive strategies for optimizing performance in the Bill Management System. It covers React optimization patterns, custom hooks for performance, and monitoring techniques.

## Overview

The Bill Management System implements several performance optimization strategies:

1. **React Memoization Patterns** - `useMemo` and `useCallback` for expensive operations
2. **Custom Hooks for Performance** - Centralized state management reduces re-renders
3. **Component Architecture** - Separation of concerns and efficient rendering
4. **Bundle Optimization** - Code splitting and lazy loading
5. **Database Performance** - Optimized queries and caching

---

## React Performance Optimization

### 1. Memoization Patterns

#### Expensive Calculations
```typescript
import { useMemo } from 'react'
import { groupBillsByStage } from '@/app/lib/utils/bills'

export default function BillsDashboard({ bills }: { bills: Bill[] }) {
  // Memoize expensive grouping operation
  const groupedBills = useMemo(() => groupBillsByStage(bills), [bills])
  
  return (
    <div className="kanban-board">
      {Object.entries(groupedBills).map(([stage, stageBills]) => (
        <div key={stage} className="stage-column">
          <h2>{stage}</h2>
          {stageBills.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      ))}
    </div>
  )
}
```

#### Event Handlers
```typescript
import { useCallback } from 'react'
import { useErrorHandler } from '@/app/hooks/useErrorHandler'

export default function BillsDashboard({ bills, users }: BillsDashboardProps) {
  const { error, showError, clearError } = useErrorHandler()
  
  // Memoize event handlers to prevent unnecessary re-renders
  const assignBill = useCallback(async (billId: string, userId: string) => {
    clearError()
    
    try {
      const result = await assignBillAction({ billId, userId })
      if (!result.success) {
        showError(result.error || 'Failed to assign bill')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to assign bill')
    }
  }, [showError, clearError])
  
  return (
    // Component JSX with memoized handlers
  )
}
```

#### Utility Functions
```typescript
import { useCallback } from 'react'

export default function BillCard({ bill }: { bill: Bill }) {
  // Memoize utility functions
  const formatDate = useCallback((date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])
  
  const formattedDate = useMemo(() => formatDate(bill.billDate), [bill.billDate, formatDate])
  
  return (
    <div>
      <h3>{bill.billReference}</h3>
      <p>Date: {formattedDate}</p>
    </div>
  )
}
```

### 2. Component Memoization

#### React.memo for Pure Components
```typescript
import { memo } from 'react'

interface BillCardProps {
  bill: Bill
  onAssign: (billId: string, userId: string) => void
}

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

BillCard.displayName = 'BillCard'
```

#### Custom Comparison Functions
```typescript
import { memo } from 'react'

export const BillCard = memo<BillCardProps>(
  ({ bill, onAssign }) => {
    return (
      // Component JSX
    )
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    return (
      prevProps.bill.id === nextProps.bill.id &&
      prevProps.bill.billReference === nextProps.bill.billReference &&
      prevProps.bill.billDate.getTime() === nextProps.bill.billDate.getTime()
    )
  }
)
```

---

## Custom Hooks for Performance

### 1. State Consolidation

#### Before: Multiple useState Calls
```typescript
// ❌ Multiple state updates can cause multiple re-renders
export default function BillForm() {
  const [formData, setFormData] = useState({ billReference: '', billDate: '', assignedToId: '' })
  const [validation, setValidation] = useState({ billReference: null, billDate: null, assignedToId: null })
  const [asyncValidation, setAsyncValidation] = useState({ billReference: { isValid: true, isChecking: false, message: '' } })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  // Multiple state updates in event handlers
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidation(prev => ({ ...prev, [field]: validateField(value) }))
    // Multiple re-renders triggered
  }
}
```

#### After: Custom Hook Consolidation
```typescript
// ✅ Custom hook consolidates related state
export const useBillForm = () => {
  // Related state grouped together
  const [formData, setFormData] = useState<BillFormData>({...})
  const [validation, setValidation] = useState<FormValidationState>({...})
  const [asyncValidation, setAsyncValidation] = useState<AsyncValidationState>({...})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  // Memoized handlers prevent unnecessary re-renders
  const handleFieldChange = useCallback((field: string, value: string) => {
    // Single state update logic
    setFormData(prev => ({ ...prev, [field]: value }))
    // Other updates batched together
  }, [dependencies])
  
  return { formData, validation, error, handleFieldChange, ... }
}
```

### 2. Debounced Operations

#### Async Validation with Debouncing
```typescript
export const useBillForm = () => {
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleBillReferenceChange = useCallback((value: string) => {
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    // Immediate client-side validation
    const fieldError = FieldValidators.billReference(value)
    setValidation(prev => ({ ...prev, billReference: fieldError }))
    
    // Debounced server-side validation
    if (value.trim() && !fieldError) {
      validationTimeoutRef.current = setTimeout(() => {
        handleValidateBillReference(value)
      }, 500) // 500ms debounce
    }
  }, [dependencies])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])
}
```

---

## Component Architecture for Performance

### 1. Server/Client Component Split

#### Server Components for Data Fetching
```typescript
// ✅ Server component - no client-side JavaScript
export default async function BillsPage() {
  const [bills, users] = await Promise.all([
    getBills(),
    getUsers()
  ])
  
  return (
    <div>
      <h1>Bills Dashboard</h1>
      <Suspense fallback={<BillsDashboardSkeleton />}>
        <BillsDashboardWrapper bills={bills} users={users} />
      </Suspense>
    </div>
  )
}
```

#### Client Components for Interactivity
```typescript
'use client'

// ✅ Client component - only for interactive features
export default function BillsDashboard({ bills, users }: BillsDashboardProps) {
  const { error, showError, clearError } = useErrorHandler()
  const [assigningBillId, setAssigningBillId] = useState<string | null>(null)
  
  // Only interactive logic runs on client
  const assignBill = useCallback(async (billId: string, userId: string) => {
    // Assignment logic
  }, [dependencies])
  
  return (
    // Interactive dashboard JSX
  )
}
```

### 2. Lazy Loading with Suspense

#### Code Splitting
```typescript
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Lazy load heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // Disable SSR for client-only components
})

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  )
}
```

#### Route-based Code Splitting
```typescript
// Next.js automatically code-splits by route
// app/bills/page.tsx - loaded when navigating to /bills
// app/bills/new/page.tsx - loaded when navigating to /bills/new

export default function BillsPage() {
  // This component is automatically code-split
  return <BillsDashboard />
}
```

---

## Bundle Optimization

### 1. Tree Shaking

#### Named Imports
```typescript
// ✅ Use named imports for better tree shaking
import { formatDate } from '@/app/lib/utils/date'
import { groupBillsByStage } from '@/app/lib/utils/bills'

// ❌ Avoid default imports that import entire modules
import utils from '@/app/lib/utils' // Imports everything
```

#### Conditional Imports
```typescript
// ✅ Conditional imports for optional features
const loadAdvancedFeatures = async () => {
  const { AdvancedChart } = await import('./AdvancedChart')
  return AdvancedChart
}
```

### 2. Dynamic Imports

#### Component-level Code Splitting
```typescript
import dynamic from 'next/dynamic'

// Split heavy components
const BillForm = dynamic(() => import('@/app/ui/bills/form'), {
  loading: () => <BillFormSkeleton />,
  ssr: false // For client-only components
})

export default function NewBillPage() {
  return (
    <div>
      <h1>Create New Bill</h1>
      <BillForm />
    </div>
  )
}
```

---

## Database Performance

### 1. Query Optimization

#### Efficient Data Fetching
```typescript
// ✅ Parallel data fetching
export async function getBillsPageData() {
  const [bills, users] = await Promise.all([
    getBills(),
    getUsers()
  ])
  
  return { bills, users }
}

// ✅ Selective field fetching
export async function getBillsForDashboard() {
  return await prisma.bill.findMany({
    select: {
      id: true,
      billReference: true,
      billDate: true,
      billStage: {
        select: {
          label: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}
```

#### Caching Strategies
```typescript
// ✅ User capacity caching
const userCapacityCache = new Map<string, number>()

export async function getUserBillCapacity(userId: string): Promise<number> {
  if (userCapacityCache.has(userId)) {
    return userCapacityCache.get(userId)!
  }
  
  const count = await prisma.bill.count({
    where: {
      assignedToId: userId,
      billStage: {
        label: {
          in: ['Draft', 'Submitted']
        }
      }
    }
  })
  
  userCapacityCache.set(userId, count)
  return count
}
```

---

## Performance Monitoring

### 1. React DevTools Profiler

#### Component Performance Analysis
```typescript
import { Profiler } from 'react'

function onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  console.log('Profiler:', {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  })
}

export default function BillsDashboard({ bills, users }: BillsDashboardProps) {
  return (
    <Profiler id="BillsDashboard" onRender={onRenderCallback}>
      <div className="kanban-board">
        {/* Dashboard content */}
      </div>
    </Profiler>
  )
}
```

### 2. Performance Metrics

#### Bundle Size Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for unused dependencies
npx depcheck
```

#### Runtime Performance
```typescript
// Performance timing for critical operations
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}

// Usage
measurePerformance('Bill Grouping', () => {
  const groupedBills = groupBillsByStage(bills)
})
```

---

## Performance Best Practices

### 1. State Management
- **Consolidate Related State**: Group related state together to reduce update frequency
- **Use Custom Hooks**: Extract complex state logic into reusable hooks
- **Memoize Expensive Operations**: Use `useMemo` for expensive calculations
- **Optimize Event Handlers**: Use `useCallback` for event handlers passed as props

### 2. Component Design
- **Server/Client Split**: Use server components for data fetching, client components for interactivity
- **Code Splitting**: Split large components and routes for better loading performance
- **Lazy Loading**: Load components and data only when needed
- **Memoization**: Use `React.memo` for pure components

### 3. Data Handling
- **Parallel Fetching**: Use `Promise.all` for concurrent data operations
- **Selective Queries**: Only fetch the fields you need
- **Caching**: Implement appropriate caching strategies
- **Debouncing**: Debounce expensive operations like validation

### 4. Bundle Optimization
- **Tree Shaking**: Use named imports and avoid default imports of large modules
- **Dynamic Imports**: Load heavy features on demand
- **Bundle Analysis**: Regularly analyze bundle size and optimize

---

## Performance Checklist

### Development Phase
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for event handlers passed as props
- [ ] Implement proper server/client component split
- [ ] Add React.memo for pure components
- [ ] Use custom hooks for complex state management
- [ ] Implement debouncing for expensive operations

### Build Phase
- [ ] Analyze bundle size with bundle analyzer
- [ ] Check for unused dependencies
- [ ] Optimize imports (named vs default)
- [ ] Implement code splitting for large components
- [ ] Set up proper caching strategies

### Monitoring Phase
- [ ] Use React DevTools Profiler
- [ ] Monitor Core Web Vitals
- [ ] Track bundle size over time
- [ ] Monitor database query performance
- [ ] Set up performance budgets

---

## Related Documentation

- [Component Architecture](../architecture/components.md) - Component design patterns for performance
- [Hooks Reference](../reference/hooks.md) - Custom hooks for state management
- [Utilities Reference](../reference/utilities.md) - Utility functions optimized for performance
- [Testing Guide](testing-guide.md) - Performance testing strategies

This performance guide provides a comprehensive approach to optimizing React applications with modern patterns and best practices.
