# Data Operations Guide

[← Back to Documentation](../README.md) | [Server Actions Reference](../reference/server-actions.md) | [API Reference](../reference/api.md)

This guide provides comprehensive instructions for performing data operations in the Bill Management System. It covers both Server Actions (primary method) and REST API endpoints, with clear guidance on when to use each approach.

## Overview

The system provides two approaches for data operations:

1. **Server Actions** (Recommended) - Type-safe, server-side functions with automatic revalidation
2. **REST API** - Standard HTTP endpoints for external integrations

## Decision Matrix: When to Use Which Approach

| Scenario | Use Server Actions | Use REST API |
|----------|-------------------|--------------|
| Form submissions | ✅ | ❌ |
| Real-time validation | ✅ | ❌ |
| Next.js App Router integration | ✅ | ❌ |
| External API integrations | ❌ | ✅ |
| Mobile app development | ❌ | ✅ |
| Microservices communication | ❌ | ✅ |
| Third-party webhooks | ❌ | ✅ |
| Type-safe client operations | ✅ | ❌ |
| Optimistic updates | ✅ | ❌ |

## Server Actions (Primary Method)

Server Actions are the recommended approach for most data operations. They provide type safety, automatic cache invalidation, and seamless integration with React forms.

### Creating Bills

#### Basic Bill Creation

```typescript
import { createBill } from '@/app/bills/actions'

// In a form component
const handleSubmit = async (formData: FormData) => {
  try {
    const newBill = await createBill({
      billReference: formData.get('billReference') as string,
      billDate: formData.get('billDate') as string,
      assignedToId: formData.get('assignedToId') as string || undefined
    })
    
    // Success - redirect or update UI
    router.push('/bills')
  } catch (error) {
    // Handle error
    setError(error.message)
  }
}
```

#### With Real-time Validation

```typescript
import { createBill, validateBillReference } from '@/app/bills/actions'

const [validation, setValidation] = useState({
  billReference: { isValid: true, isChecking: false, message: '' }
})

// Real-time reference validation
const checkReference = async (reference: string) => {
  if (!reference.trim()) return
  
  setValidation(prev => ({
    ...prev,
    billReference: { ...prev.billReference, isChecking: true }
  }))
  
  try {
    const result = await validateBillReference(reference)
    setValidation(prev => ({
      ...prev,
      billReference: {
        isValid: result.isValid,
        isChecking: false,
        message: result.message || ''
      }
    }))
  } catch (error) {
    setValidation(prev => ({
      ...prev,
      billReference: {
        isValid: false,
        isChecking: false,
        message: 'Validation failed'
      }
    }))
  }
}

// Debounced validation
useEffect(() => {
  const timeoutId = setTimeout(() => {
    checkReference(billReference)
  }, 500)
  
  return () => clearTimeout(timeoutId)
}, [billReference])
```

### Assigning Bills

#### Specific Bill Assignment

```typescript
import { assignBillAction } from '@/app/bills/actions'

const assignSpecificBill = async (billId: string, userId: string) => {
  try {
    const result = await assignBillAction({
      userId,
      billId
    })
    
    if (result.success) {
      console.log('Bill assigned:', result.bill)
      // Update UI optimistically
    } else {
      console.error('Assignment failed:', result.error)
      // Handle specific error codes
      if (result.errorCode === 'USER_BILL_LIMIT_EXCEEDED') {
        setError('User has reached the 3-bill limit')
      }
    }
  } catch (error) {
    console.error('Assignment failed:', error)
  }
}
```

#### Auto-assignment

```typescript
const autoAssignBill = async (userId: string) => {
  try {
    const result = await assignBillAction({
      userId
      // No billId - will auto-assign oldest unassigned bill
    })
    
    if (result.success) {
      console.log('Auto-assigned bill:', result.bill)
    } else if (result.errorCode === 'NO_ASSIGNABLE_BILLS') {
      console.log('No unassigned bills available')
    }
  } catch (error) {
    console.error('Auto-assignment failed:', error)
  }
}
```

#### With User Capacity Display

```typescript
const [userCapacity, setUserCapacity] = useState<Record<string, number>>({})

// Check user capacity before assignment
const checkUserCapacity = async (userId: string) => {
  const capacity = await getUserAssignmentCapacity(userId)
  setUserCapacity(prev => ({
    ...prev,
    [userId]: capacity?.availableSlots || 0
  }))
}

// Display capacity in UI
const UserSelector = ({ users, onSelect }) => (
  <select onChange={(e) => onSelect(e.target.value)}>
    {users.map(user => (
      <option key={user.id} value={user.id}>
        {user.name} ({userCapacity[user.id] || 3} slots available)
      </option>
    ))}
  </select>
)
```

### Error Handling Patterns

#### Comprehensive Error Handling

```typescript
const handleBillOperation = async (operation: () => Promise<any>) => {
  try {
    setLoading(true)
    setError(null)
    
    const result = await operation()
    
    if (result && !result.success) {
      // Handle specific error codes
      switch (result.errorCode) {
        case 'USER_BILL_LIMIT_EXCEEDED':
          setError('User has reached the maximum of 3 bills')
          break
        case 'BILL_NOT_ASSIGNABLE':
          setError('Bill is not in an assignable stage')
          break
        case 'USER_NOT_FOUND':
          setError('User not found')
          break
        case 'BILL_NOT_FOUND':
          setError('Bill not found')
          break
        default:
          setError(result.error || 'Operation failed')
      }
    } else {
      // Success
      setSuccess('Operation completed successfully')
    }
  } catch (error) {
    console.error('Operation failed:', error)
    setError('An unexpected error occurred')
  } finally {
    setLoading(false)
  }
}
```

## REST API (External Integrations)

The REST API is designed for external integrations, mobile apps, and third-party systems.

### Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

### Base URL

```
http://localhost:3000/api
```

### Creating Bills via REST API

**Note**: There is no `POST /api/bills` endpoint. Bill creation is handled exclusively through Server Actions for type safety and form integration.

For external systems that need to create bills, consider:
1. Implementing a `POST /api/bills` endpoint if needed
2. Using Server Actions via HTTP requests (not recommended)
3. Creating a dedicated API endpoint for external integrations

### Fetching Data

#### Get All Bills

```bash
curl -X GET http://localhost:3000/api/bills
```

```typescript
const fetchBills = async () => {
  const response = await fetch('/api/bills')
  if (!response.ok) throw new Error('Failed to fetch bills')
  return response.json()
}

// Usage
const bills = await fetchBills()
```

#### Get All Users

```bash
curl -X GET http://localhost:3000/api/users
```

```typescript
const fetchUsers = async () => {
  const response = await fetch('/api/users')
  if (!response.ok) throw new Error('Failed to fetch users')
  return response.json()
}
```

### Assigning Bills via REST API

#### Specific Bill Assignment

```bash
curl -X POST http://localhost:3000/api/bills/assign \
  -H "Content-Type: application/json" \
  -d '{"userId": "clx1234567890", "billId": "clx0987654321"}'
```

```typescript
const assignBillViaAPI = async (userId: string, billId: string) => {
  const response = await fetch('/api/bills/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, billId })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
  
  return response.json()
}
```

#### Error Handling for REST API

```typescript
const handleApiError = (response: Response) => {
  switch (response.status) {
    case 400:
      return 'Invalid request data'
    case 404:
      return 'Resource not found'
    case 409:
      return 'Conflict - user has reached bill limit'
    case 500:
      return 'Server error'
    default:
      return 'Unknown error'
  }
}

const assignBill = async (userId: string, billId: string) => {
  try {
    const response = await fetch('/api/bills/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, billId })
    })
    
    if (!response.ok) {
      const errorMessage = handleApiError(response)
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}
```

### Health Check

```bash
curl -X GET http://localhost:3000/api/health
```

```typescript
const checkHealth = async () => {
  const response = await fetch('/api/health')
  const health = await response.json()
  
  if (health.status === 'healthy') {
    console.log('System is healthy')
  } else {
    console.error('System health issues:', health)
  }
  
  return health
}
```

## Migration Guide

### From REST API to Server Actions

If you're currently using REST API calls and want to migrate to Server Actions:

#### Before (REST API)
```typescript
const createBillViaAPI = async (billData) => {
  const response = await fetch('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(billData)
  })
  return response.json()
}
```

#### After (Server Actions)
```typescript
import { createBill } from '@/app/bills/actions'

const createBillViaAction = async (billData) => {
  return await createBill(billData)
}
```

### Benefits of Migration

1. **Type Safety**: Full TypeScript support with compile-time checking
2. **Automatic Revalidation**: Cache invalidation and UI updates
3. **Better Error Handling**: Structured error responses with error codes
4. **Performance**: Optimistic updates and background processing
5. **Security**: Server-side execution prevents client-side tampering

## Best Practices

### Server Actions

1. **Use for Forms**: Always use Server Actions for form submissions
2. **Real-time Validation**: Implement debounced validation for better UX
3. **Error Handling**: Handle specific error codes for better user feedback
4. **Loading States**: Show loading indicators during operations
5. **Optimistic Updates**: Update UI immediately, rollback on error

### REST API

1. **External Integration**: Use for third-party systems and mobile apps
2. **Error Handling**: Implement proper HTTP status code handling
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Authentication**: Add authentication when needed
5. **Documentation**: Keep API documentation up to date

### General

1. **Validation**: Always validate input data
2. **Error Messages**: Provide clear, actionable error messages
3. **Logging**: Log errors for debugging and monitoring
4. **Testing**: Write tests for all data operations
5. **Performance**: Monitor and optimize database queries

## Performance Considerations

### Caching Strategy

Server Actions automatically handle caching:
- User capacity caching for performance
- Automatic cache invalidation on mutations
- Optimistic updates for better UX

### Database Optimization

Both approaches use optimized database queries:
- Efficient user capacity checks
- Proper indexing for common queries
- Transaction-based operations for consistency

### Monitoring

Track performance metrics:
```typescript
const startTime = Date.now()
const result = await createBill(data)
const duration = Date.now() - startTime

// Log performance metrics
performanceMonitor.record({
  operation: 'createBill',
  duration,
  success: !!result
})
```

## Related Documentation

- [Server Actions Reference](../reference/server-actions.md) - Complete Server Actions documentation
- [API Reference](../reference/api.md) - REST endpoint specifications
- [Data Models Reference](../reference/data-models.md) - TypeScript interfaces
- [Error Codes Reference](../reference/error-codes.md) - Error handling patterns
- [Database Architecture](../architecture/database.md) - Schema and constraints
