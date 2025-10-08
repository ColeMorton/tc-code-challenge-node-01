# Utilities Reference

[← Back to Documentation](../README.md) | [Component Architecture](../architecture/components.md) | [Hooks Reference](hooks.md)

This document provides comprehensive documentation for the utility functions in the Bill Management System. These utilities follow the Single Responsibility Principle and provide reusable, testable functions for common operations.

## Overview

The system implements utility functions in the `app/lib/utils/` directory, organized by domain:

1. **`date.ts`** - Date formatting and manipulation utilities
2. **`bills.ts`** - Bill-related data processing utilities

## Utility Architecture Principles

### Design Patterns Applied
- **Single Responsibility Principle (SRP)**: Each function has one clear purpose
- **Pure Functions**: No side effects, predictable outputs for given inputs
- **Type Safety**: Full TypeScript support with proper type definitions
- **Reusability**: Functions can be used across different components and contexts

### Performance Considerations
- **Efficient Algorithms**: Optimized for common use cases
- **Minimal Dependencies**: Self-contained functions with no external dependencies
- **Memoization Ready**: Functions are designed to work well with React's memoization patterns

---

## Date Utilities

**File**: `app/lib/utils/date.ts`  
**Purpose**: Centralized date formatting and manipulation functions

### Functions

#### `formatDate(date: Date): string`

Formats a Date object into a human-readable string format.

**Parameters:**
- `date: Date` - The date object to format

**Returns:**
- `string` - Formatted date string in "MMM DD, YYYY" format (e.g., "Jan 15, 2024")

**Usage Example:**
```typescript
import { formatDate } from '@/app/lib/utils/date'

const billDate = new Date('2024-01-15')
const formattedDate = formatDate(billDate)
console.log(formattedDate) // "Jan 15, 2024"
```

**Implementation:**
```typescript
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
```

**Key Features:**
- **Consistent Formatting**: Uses US locale with abbreviated month names
- **Date Safety**: Creates new Date object to prevent mutation
- **Internationalization Ready**: Uses `toLocaleDateString` for locale support

**Use Cases:**
- Bill date display in dashboard
- User-friendly date formatting in forms
- Consistent date presentation across the application

---

## Bill Utilities

**File**: `app/lib/utils/bills.ts`  
**Purpose**: Bill-related data processing and transformation functions

### Functions

#### `groupBillsByStage(bills: Bill[]): GroupedBills`

Groups an array of bills by their current stage, creating a structured object for dashboard display.

**Parameters:**
- `bills: Bill[]` - Array of bill objects to group

**Returns:**
- `GroupedBills` - Object with stage labels as keys and bill arrays as values

**Type Definition:**
```typescript
interface GroupedBills {
  [stageLabel: string]: Bill[]
}
```

**Usage Example:**
```typescript
import { groupBillsByStage } from '@/app/lib/utils/bills'

const bills = [
  { id: '1', billReference: 'BILL-001', billStage: { label: 'Draft' } },
  { id: '2', billReference: 'BILL-002', billStage: { label: 'Submitted' } },
  { id: '3', billReference: 'BILL-003', billStage: { label: 'Draft' } }
]

const groupedBills = groupBillsByStage(bills)
console.log(groupedBills)
// Output:
// {
//   "Draft": [
//     { id: '1', billReference: 'BILL-001', billStage: { label: 'Draft' } },
//     { id: '3', billReference: 'BILL-003', billStage: { label: 'Draft' } }
//   ],
//   "Submitted": [
//     { id: '2', billReference: 'BILL-002', billStage: { label: 'Submitted' } }
//   ]
// }
```

**Implementation:**
```typescript
export const groupBillsByStage = (bills: Bill[]): GroupedBills => {
  return bills.reduce((acc, bill) => {
    const stage = bill.billStage.label
    if (!acc[stage]) {
      acc[stage] = []
    }
    acc[stage].push(bill)
    return acc
  }, {} as GroupedBills)
}
```

**Key Features:**
- **Efficient Grouping**: Uses `Array.reduce()` for optimal performance
- **Dynamic Keys**: Creates groups based on actual stage labels in the data
- **Type Safety**: Returns properly typed `GroupedBills` interface
- **Immutable**: Does not mutate the input array

**Use Cases:**
- Dashboard kanban board organization
- Stage-based bill filtering
- Workflow visualization
- Performance optimization with React memoization

**Performance Considerations:**
```typescript
// Optimized usage with React memoization
const groupedBills = useMemo(() => groupBillsByStage(bills), [bills])
```

---

## Integration Patterns

### React Component Integration

#### Date Formatting in Components
```typescript
import { formatDate } from '@/app/lib/utils/date'
import { useMemo } from 'react'

export default function BillCard({ bill }: { bill: Bill }) {
  // Memoize date formatting for performance
  const formattedDate = useMemo(() => formatDate(bill.billDate), [bill.billDate])
  
  return (
    <div>
      <h3>{bill.billReference}</h3>
      <p>Date: {formattedDate}</p>
    </div>
  )
}
```

#### Bill Grouping in Dashboard
```typescript
import { groupBillsByStage } from '@/app/lib/utils/bills'
import { useMemo } from 'react'

export default function BillsDashboard({ bills }: { bills: Bill[] }) {
  // Memoize grouping to prevent unnecessary recalculations
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

### Server Component Integration
```typescript
import { formatDate } from '@/app/lib/utils/date'

export default async function BillDetails({ billId }: { billId: string }) {
  const bill = await getBillById(billId)
  
  return (
    <div>
      <h1>{bill.billReference}</h1>
      <p>Created: {formatDate(bill.createdAt)}</p>
      <p>Bill Date: {formatDate(bill.billDate)}</p>
    </div>
  )
}
```

---

## Testing Strategies

### Unit Testing Utilities
```typescript
import { formatDate, groupBillsByStage } from '@/app/lib/utils'

describe('Date Utilities', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    const result = formatDate(date)
    expect(result).toBe('Jan 15, 2024')
  })
  
  it('should handle different date formats', () => {
    const date = new Date('2024-12-25')
    const result = formatDate(date)
    expect(result).toBe('Dec 25, 2024')
  })
})

describe('Bill Utilities', () => {
  const mockBills = [
    { id: '1', billReference: 'BILL-001', billStage: { label: 'Draft' } },
    { id: '2', billReference: 'BILL-002', billStage: { label: 'Submitted' } },
    { id: '3', billReference: 'BILL-003', billStage: { label: 'Draft' } }
  ]
  
  it('should group bills by stage', () => {
    const result = groupBillsByStage(mockBills)
    
    expect(result.Draft).toHaveLength(2)
    expect(result.Submitted).toHaveLength(1)
    expect(result.Draft[0].billReference).toBe('BILL-001')
    expect(result.Draft[1].billReference).toBe('BILL-003')
  })
  
  it('should handle empty bill array', () => {
    const result = groupBillsByStage([])
    expect(result).toEqual({})
  })
  
  it('should not mutate input array', () => {
    const originalBills = [...mockBills]
    groupBillsByStage(mockBills)
    expect(mockBills).toEqual(originalBills)
  })
})
```

### Integration Testing
```typescript
import { render, screen } from '@testing-library/react'
import BillsDashboard from '@/app/ui/bills/dashboard'

describe('BillsDashboard with utilities', () => {
  it('should display grouped bills correctly', () => {
    const mockBills = [
      { id: '1', billReference: 'BILL-001', billStage: { label: 'Draft' } },
      { id: '2', billReference: 'BILL-002', billStage: { label: 'Submitted' } }
    ]
    
    render(<BillsDashboard bills={mockBills} users={[]} />)
    
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('BILL-001')).toBeInTheDocument()
    expect(screen.getByText('BILL-002')).toBeInTheDocument()
  })
})
```

---

## Performance Optimization

### Memoization Patterns
```typescript
import { useMemo } from 'react'
import { formatDate, groupBillsByStage } from '@/app/lib/utils'

// Memoize expensive calculations
const Component = ({ bills, billDate }) => {
  const groupedBills = useMemo(() => groupBillsByStage(bills), [bills])
  const formattedDate = useMemo(() => formatDate(billDate), [billDate])
  
  return (
    // Component JSX
  )
}
```

### Batch Processing
```typescript
// For large datasets, consider batch processing
const processBillsInBatches = (bills: Bill[], batchSize: number = 100) => {
  const batches = []
  for (let i = 0; i < bills.length; i += batchSize) {
    batches.push(bills.slice(i, i + batchSize))
  }
  
  return batches.map(batch => groupBillsByStage(batch))
}
```

---

## Extending Utilities

### Adding New Date Utilities
```typescript
// app/lib/utils/date.ts
export const formatDate = (date: Date): string => {
  // Existing implementation
}

// Add new utility functions
export const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getRelativeDate = (date: Date): string => {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDate(date)
}
```

### Adding New Bill Utilities
```typescript
// app/lib/utils/bills.ts
export const groupBillsByStage = (bills: Bill[]): GroupedBills => {
  // Existing implementation
}

// Add new utility functions
export const filterBillsByUser = (bills: Bill[], userId: string): Bill[] => {
  return bills.filter(bill => bill.assignedToId === userId)
}

export const getBillCountByStage = (bills: Bill[]): Record<string, number> => {
  const grouped = groupBillsByStage(bills)
  return Object.fromEntries(
    Object.entries(grouped).map(([stage, stageBills]) => [stage, stageBills.length])
  )
}

export const sortBillsByDate = (bills: Bill[]): Bill[] => {
  return [...bills].sort((a, b) => 
    new Date(b.billDate).getTime() - new Date(a.billDate).getTime()
  )
}
```

---

## Best Practices

### Function Design
1. **Pure Functions**: Avoid side effects and external dependencies
2. **Type Safety**: Use TypeScript interfaces for all parameters and return values
3. **Error Handling**: Handle edge cases gracefully
4. **Performance**: Optimize for common use cases
5. **Documentation**: Provide clear JSDoc comments

### Usage Guidelines
1. **Memoization**: Use with React's `useMemo` for expensive operations
2. **Testing**: Write comprehensive unit tests for all utilities
3. **Reusability**: Design functions to work across different contexts
4. **Consistency**: Follow established naming and formatting conventions

### Example: Well-Designed Utility
```typescript
/**
 * Formats a date object into a human-readable string
 * @param date - The date object to format
 * @returns Formatted date string in "MMM DD, YYYY" format
 * @throws {Error} If date parameter is invalid
 */
export const formatDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDate')
  }
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
```

---

## Related Documentation

- [Component Architecture](../architecture/components.md) - How utilities integrate with components
- [Hooks Reference](hooks.md) - Custom hooks that use these utilities
- [Data Models Reference](data-models.md) - TypeScript interfaces for utility parameters
- [Testing Guide](../guides/testing-guide.md) - Comprehensive testing strategies

This utility architecture provides a solid foundation for maintainable, performant data processing with clear separation of concerns and excellent developer experience.
