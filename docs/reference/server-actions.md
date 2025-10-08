# Server Actions Reference

[← Back to Documentation](../README.md) | [Data Models](data-models.md) | [API Reference](api.md)

This document provides comprehensive documentation for all Server Actions in the Bill Management System. Server Actions are the primary method for data mutations and provide type-safe, server-side execution with automatic revalidation.

## Overview

Server Actions are Next.js functions that run on the server and can be called directly from client components. They provide:

- **Type Safety**: Full TypeScript support with input/output validation
- **Automatic Revalidation**: Cache invalidation and UI updates
- **Security**: Server-side execution prevents client-side tampering
- **Performance**: Optimistic updates and background processing

## Available Server Actions

### createBill

Creates a new bill in the system with comprehensive validation.

```typescript
async function createBill(input: CreateBillInput): Promise<Bill>
```

**Parameters**:
- `input.billReference: string` - Unique bill identifier (required)
- `input.billDate: string` - ISO date string (required)
- `input.assignedToId?: string` - User ID for assignment (optional)

**Returns**: `Promise<Bill>` - Created bill with relationships

**Validation**:
- Bill reference uniqueness check
- Date format validation
- User existence verification (if assigned)
- Business rule enforcement

**Example Usage**:
```typescript
import { createBill } from '@/app/bills/actions'

const handleSubmit = async (formData: FormData) => {
  try {
    const newBill = await createBill({
      billReference: formData.get('billReference') as string,
      billDate: formData.get('billDate') as string,
      assignedToId: formData.get('assignedToId') as string || undefined
    })
    console.log('Bill created:', newBill)
  } catch (error) {
    console.error('Creation failed:', error)
  }
}
```

**Error Handling**:
- `VALIDATION_ERROR`: Invalid input data
- `BILL_REFERENCE_EXISTS`: Duplicate bill reference
- `USER_NOT_FOUND`: Assigned user doesn't exist
- `DATABASE_ERROR`: Database operation failure

### assignBillAction

Assigns a bill to a user with business rule enforcement.

```typescript
async function assignBillAction(input: AssignBillInput): Promise<AssignBillResult>
```

**Parameters**:
- `input.userId: string` - Target user ID (required)
- `input.billId?: string` - Specific bill ID (optional, auto-assigns if not provided)

**Returns**: `Promise<AssignBillResult>` - Assignment result with success/error details

**Business Rules**:
- Users cannot exceed 3 active bill assignments
- Only Draft and Submitted stage bills can be assigned
- Auto-assignment finds oldest unassigned bill in assignable stages

**Example Usage**:
```typescript
import { assignBillAction } from '@/app/bills/actions'

// Assign specific bill
const result = await assignBillAction({
  userId: 'user-123',
  billId: 'bill-456'
})

// Auto-assign next available bill
const result = await assignBillAction({
  userId: 'user-123'
})

if (result.success) {
  console.log('Bill assigned:', result.bill)
} else {
  console.error('Assignment failed:', result.error)
}
```

**Error Handling**:
- `USER_NOT_FOUND`: Target user doesn't exist
- `BILL_NOT_FOUND`: Specified bill doesn't exist
- `USER_BILL_LIMIT_EXCEEDED`: User has 3 active bills
- `BILL_NOT_ASSIGNABLE`: Bill not in assignable stage
- `NO_ASSIGNABLE_BILLS`: No unassigned bills available

### validateBillReference

Performs real-time validation of bill reference uniqueness.

```typescript
async function validateBillReference(billReference: string): Promise<SimpleValidationResult>
```

**Parameters**:
- `billReference: string` - Bill reference to validate

**Returns**: `Promise<SimpleValidationResult>` - Validation result with message

**Usage Pattern**:
```typescript
import { validateBillReference } from '@/app/bills/actions'

const checkReference = async (reference: string) => {
  if (!reference.trim()) return
  
  const result = await validateBillReference(reference)
  
  if (!result.isValid) {
    setError(result.message)
  }
}
```

**Implementation Notes**:
- Used for real-time form validation
- Debounced to prevent excessive database queries
- Returns `isValid: true` for empty references

## Error Handling Patterns

### Standard Error Response Format

All Server Actions return consistent error information:

```typescript
interface AssignBillResult {
  success: boolean
  bill?: Bill
  error?: string
  errorCode?: string
}
```

### Error Code Enumeration

```typescript
enum BillAssignmentError {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  BILL_NOT_FOUND = 'BILL_NOT_FOUND', 
  USER_BILL_LIMIT_EXCEEDED = 'USER_BILL_LIMIT_EXCEEDED',
  BILL_NOT_ASSIGNABLE = 'BILL_NOT_ASSIGNABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

### HTTP Status Mapping

Server Actions use centralized error handling with HTTP status mapping:

```typescript
const status = result.errorCode ? getHttpStatus(result.errorCode) : 500
```

Common mappings:
- `USER_NOT_FOUND` → 404
- `BILL_NOT_FOUND` → 404
- `USER_BILL_LIMIT_EXCEEDED` → 409
- `VALIDATION_ERROR` → 400
- `DATABASE_ERROR` → 500

## Performance Considerations

### Database Optimization

Server Actions use optimized database queries:

```typescript
// Efficient user capacity check
const userBillCount = await prisma.bill.count({
  where: { 
    assignedToId: userId,
    billStage: {
      label: { in: ['Draft', 'Submitted', 'Approved', 'Paying', 'On Hold'] }
    }
  }
})
```

### Caching Strategy

- User capacity caching for performance
- Automatic cache invalidation on mutations
- Optimistic updates for better UX

### Transaction Management

Complex operations use database transactions:

```typescript
await prisma.$transaction(async (tx) => {
  // Atomic operations
  const bill = await tx.bill.update({...})
  // Additional operations
})
```

## Integration Patterns

### Form Integration

```typescript
'use client'

import { createBill } from '@/app/bills/actions'

export default function BillForm() {
  const handleSubmit = async (formData: FormData) => {
    const result = await createBill({
      billReference: formData.get('billReference') as string,
      billDate: formData.get('billDate') as string,
      assignedToId: formData.get('assignedToId') as string || undefined
    })
    
    if (result) {
      router.push('/bills')
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Real-time Validation

```typescript
const [validation, setValidation] = useState<AsyncValidationState>({
  billReference: { isValid: true, isChecking: false, message: '' }
})

const checkReference = async (reference: string) => {
  setValidation(prev => ({
    ...prev,
    billReference: { ...prev.billReference, isChecking: true }
  }))
  
  const result = await validateBillReference(reference)
  
  setValidation(prev => ({
    ...prev,
    billReference: {
      isValid: result.isValid,
      isChecking: false,
      message: result.message || ''
    }
  }))
}
```

## Security Considerations

### Input Validation

All inputs are validated using Zod schemas:

```typescript
const validation = validateCreateBillInput(input)
if (!validation.success) {
  throw createError(BillAssignmentError.VALIDATION_ERROR)
}
```

### Business Rule Enforcement

Server Actions enforce business rules at the application level:

- 3-bill assignment limit per user
- Stage-based assignment restrictions
- Reference uniqueness constraints

### Database Constraints

Additional enforcement through database triggers and constraints:

- SQLite triggers for atomic constraint checking
- Foreign key constraints for data integrity
- Unique constraints for reference validation

## Monitoring and Logging

### Performance Monitoring

Server Actions integrate with monitoring systems:

```typescript
import { monitorBillAssignment } from '@/lib/monitoring'

// Performance tracking
performanceMonitor.record({
  operation: 'bill_assignment',
  duration: Date.now() - startTime,
  success: result.success
})
```

### Error Logging

Comprehensive error logging for debugging:

```typescript
console.error('Failed to assign bill:', error)
```

## Related Documentation

- [Data Models Reference](data-models.md) - TypeScript interfaces
- [API Reference](api.md) - REST endpoint documentation  
- [Error Codes Reference](error-codes.md) - Error handling patterns
- [Database Architecture](../architecture/database.md) - Schema and constraints
- [Data Operations Guide](../guides/data-operations.md) - When to use Server Actions vs REST API
