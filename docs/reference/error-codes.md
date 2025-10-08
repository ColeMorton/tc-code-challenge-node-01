# Error Codes Reference

[← Back to Documentation](../README.md) | [Data Models](data-models.md) | [Server Actions](server-actions.md)

This document provides comprehensive error handling reference for the Bill Management System, including error definitions, HTTP status mappings, and handling strategies.

## Error Definition System

### ERROR_DEFINITIONS

Centralized error definitions located in `app/lib/error/error-constants.ts`:

```typescript
export const ERROR_DEFINITIONS = {
  // User Errors
  USER_NOT_FOUND: {
    message: 'User not found',
    httpStatus: 404
  },
  FAILED_TO_FETCH_USERS: {
    message: 'Failed to fetch users',
    httpStatus: 500
  },
  
  // Bill Errors
  BILL_NOT_FOUND: {
    message: 'Bill not found',
    httpStatus: 404
  },
  BILL_REFERENCE_EXISTS: {
    message: 'Bill reference already exists',
    httpStatus: 409
  },
  FAILED_TO_FETCH_BILLS: {
    message: 'Failed to fetch bills',
    httpStatus: 500
  },
  
  // Assignment Errors
  USER_BILL_LIMIT_EXCEEDED: {
    message: 'User already has maximum of 3 bills assigned',
    httpStatus: 409
  },
  BILL_NOT_ASSIGNABLE: {
    message: 'Bill is not in an assignable stage',
    httpStatus: 400
  },
  FAILED_TO_ASSIGN_BILL: {
    message: 'Failed to assign bill',
    httpStatus: 500
  },
  
  // Validation Errors
  VALIDATION_FAILED: {
    message: 'Validation failed',
    httpStatus: 400
  },
  USER_ID_REQUIRED: {
    message: 'User ID is required',
    httpStatus: 400
  },
  BILL_ID_REQUIRED: {
    message: 'Bill ID is required',
    httpStatus: 400
  }
}
```

## Error Code Enumeration

### BillAssignmentError

Business logic error codes for bill assignment operations:

```typescript
enum BillAssignmentError {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  BILL_NOT_FOUND = 'BILL_NOT_FOUND',
  USER_BILL_LIMIT_EXCEEDED = 'USER_BILL_LIMIT_EXCEEDED',
  BILL_NOT_ASSIGNABLE = 'BILL_NOT_ASSIGNABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

**Usage**: Server Actions return these codes for programmatic error handling

## HTTP Status Code Mapping

### Standard Mappings

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | Requested user doesn't exist |
| `BILL_NOT_FOUND` | 404 | Requested bill doesn't exist |
| `USER_BILL_LIMIT_EXCEEDED` | 409 | User has reached 3-bill limit |
| `BILL_REFERENCE_EXISTS` | 409 | Duplicate bill reference |
| `VALIDATION_FAILED` | 400 | Input validation failed |
| `USER_ID_REQUIRED` | 400 | Missing required user ID |
| `BILL_ID_REQUIRED` | 400 | Missing required bill ID |
| `BILL_NOT_ASSIGNABLE` | 400 | Bill not in assignable stage |
| `FAILED_TO_FETCH_*` | 500 | Database or server error |
| `FAILED_TO_ASSIGN_BILL` | 500 | Assignment operation failed |

### HTTP Status Mapping Function

```typescript
export function getHttpStatus(errorCode: string): number {
  const definition = ERROR_DEFINITIONS[errorCode as keyof typeof ERROR_DEFINITIONS]
  return definition?.httpStatus || 500
}
```

## Error Response Formats

### Server Actions Response

Server Actions return structured error information:

```typescript
interface AssignBillResult {
  success: boolean
  bill?: Bill
  error?: string
  errorCode?: string
}

// Success response
{
  success: true,
  bill: { /* Bill object */ }
}

// Error response
{
  success: false,
  error: "User already has maximum of 3 bills assigned",
  errorCode: "USER_BILL_LIMIT_EXCEEDED"
}
```

### REST API Response

REST endpoints return JSON error responses:

```typescript
// Success response (200/201)
{
  "id": "clx1234567890",
  "billReference": "BILL-2024-001",
  // ... bill data
}

// Error response
{
  "error": "User already has maximum of 3 bills assigned"
}
```

## Error Handling Strategies

### Client-Side Error Handling

#### Form Validation Errors

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    const result = await createBill({
      billReference: formData.get('billReference') as string,
      billDate: formData.get('billDate') as string
    })
    
    if (result) {
      // Success handling
      router.push('/bills')
    }
  } catch (error) {
    // Error handling
    if (error.message.includes('already exists')) {
      setFieldError('billReference', 'Reference already exists')
    } else {
      setGeneralError('Failed to create bill')
    }
  }
}
```

#### Real-time Validation

```typescript
const validateBillReference = async (reference: string) => {
  if (!reference.trim()) return
  
  try {
    const result = await validateBillReference(reference)
    
    setValidation({
      isValid: result.isValid,
      message: result.message || ''
    })
  } catch (error) {
    setValidation({
      isValid: false,
      message: 'Validation failed'
    })
  }
}
```

### Server-Side Error Handling

#### API Route Error Handling

```typescript
export async function POST(request: Request) {
  try {
    const result = await assignBillAction({ userId, billId })
    
    if (!result.success) {
      const status = result.errorCode ? getHttpStatus(result.errorCode) : 500
      return NextResponse.json(
        { error: result.error },
        { status }
      )
    }
    
    return NextResponse.json({
      message: 'Bill assigned successfully',
      bill: result.bill
    })
  } catch (error) {
    console.error('Failed to assign bill:', error)
    return NextResponse.json(
      { error: ERROR_DEFINITIONS.FAILED_TO_ASSIGN_BILL.message },
      { status: ERROR_DEFINITIONS.FAILED_TO_ASSIGN_BILL.httpStatus }
    )
  }
}
```

#### Server Action Error Handling

```typescript
export async function assignBillAction(input: AssignBillInput): Promise<AssignBillResult> {
  try {
    // Validation
    const validation = validateAssignBillInput(input)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errorCode: 'VALIDATION_ERROR'
      }
    }
    
    // Business logic
    const user = await prisma.user.findUnique({
      where: { id: input.userId }
    })
    
    if (!user) {
      return {
        success: false,
        error: ERROR_DEFINITIONS.USER_NOT_FOUND.message,
        errorCode: 'USER_NOT_FOUND'
      }
    }
    
    // ... rest of logic
    
  } catch (error) {
    console.error('Assignment failed:', error)
    return {
      success: false,
      error: ERROR_DEFINITIONS.FAILED_TO_ASSIGN_BILL.message,
      errorCode: 'UNKNOWN_ERROR'
    }
  }
}
```

## Database Constraint Errors

### SQLite Trigger Errors

Database triggers return specific error messages:

```sql
-- User bill limit exceeded
RAISE(ABORT, 'User already has 3 bills assigned in active stages')

-- Target user limit exceeded  
RAISE(ABORT, 'Target user already has 3 bills assigned in active stages')
```

### Prisma Error Handling

```typescript
try {
  await prisma.bill.create({ data })
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw createError(BillAssignmentError.BILL_REFERENCE_EXISTS)
  } else if (error.code === 'P2003') {
    // Foreign key constraint violation
    throw createError(BillAssignmentError.USER_NOT_FOUND)
  } else {
    // Other database errors
    throw createError(BillAssignmentError.DATABASE_ERROR)
  }
}
```

## Error Logging and Monitoring

### Structured Logging

```typescript
console.error('Failed to assign bill:', {
  operation: 'assignBillAction',
  userId: input.userId,
  billId: input.billId,
  error: error.message,
  timestamp: new Date().toISOString()
})
```

### Performance Monitoring

```typescript
import { monitorBillAssignment } from '@/lib/monitoring'

const startTime = Date.now()

try {
  const result = await assignBillAction(input)
  
  performanceMonitor.record({
    operation: 'bill_assignment',
    duration: Date.now() - startTime,
    success: result.success,
    errorCode: result.errorCode
  })
} catch (error) {
  performanceMonitor.record({
    operation: 'bill_assignment',
    duration: Date.now() - startTime,
    success: false,
    error: error.message
  })
}
```

## Error Recovery Strategies

### Retry Logic

```typescript
const retryAssignment = async (input: AssignBillInput, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await assignBillAction(input)
      if (result.success) return result
      
      // Don't retry on business logic errors
      if (result.errorCode === 'USER_BILL_LIMIT_EXCEEDED') {
        return result
      }
    } catch (error) {
      if (attempt === maxRetries) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

### Graceful Degradation

```typescript
const handleBillAssignment = async (input: AssignBillInput) => {
  try {
    return await assignBillAction(input)
  } catch (error) {
    // Log error for monitoring
    console.error('Assignment failed:', error)
    
    // Return user-friendly error
    return {
      success: false,
      error: 'Unable to assign bill at this time. Please try again.',
      errorCode: 'SERVICE_UNAVAILABLE'
    }
  }
}
```

## Testing Error Scenarios

### Unit Test Examples

```typescript
describe('Error Handling', () => {
  it('should handle user not found', async () => {
    const result = await assignBillAction({
      userId: 'non-existent-user',
      billId: 'valid-bill-id'
    })
    
    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('USER_NOT_FOUND')
    expect(result.error).toContain('User not found')
  })
  
  it('should handle bill limit exceeded', async () => {
    // Setup user with 3 bills
    await createTestBills(3, { assignedToId: userId })
    
    const result = await assignBillAction({
      userId: userId,
      billId: 'additional-bill-id'
    })
    
    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('USER_BILL_LIMIT_EXCEEDED')
  })
})
```

## Related Documentation

- [Server Actions Reference](server-actions.md) - Server-side error handling
- [Data Models Reference](data-models.md) - Error response types
- [API Reference](api.md) - REST endpoint error responses
- [Database Architecture](../architecture/database.md) - Database constraint errors
