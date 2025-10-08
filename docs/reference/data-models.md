# Data Models Reference

[← Back to Documentation](../README.md) | [API Reference](api.md) | [Server Actions](server-actions.md)

This document provides comprehensive TypeScript interface definitions for the Bill Management System. All types are extracted from the source code and represent the actual data structures used throughout the application.

## Core Domain Types

### User
```typescript
interface User {
  id: string
  name: string
  email: string
  createdAt?: Date
  updatedAt?: Date
}
```

**Source**: `app/lib/types/definitions.ts`  
**Database**: `users` table  
**Key Features**:
- Unique email constraint
- Automatic timestamps
- One-to-many relationship with bills

### BillStage
```typescript
interface BillStage {
  id: string
  label: string
  createdAt?: Date
  updatedAt?: Date
}
```

**Source**: `app/lib/types/definitions.ts`  
**Database**: `bill_stages` table  
**Key Features**:
- Unique label constraint
- 7 predefined stages: Draft, Submitted, Approved, Paying, On Hold, Rejected, Paid
- Note: `colour` field exists only in UI components, not in database schema

### Bill
```typescript
interface Bill {
  id: string
  billReference: string
  billDate: Date
  submittedAt: Date | null
  approvedAt: Date | null
  onHoldAt: Date | null
  billStageId: string
  assignedToId: string | null
  createdAt?: Date
  updatedAt?: Date
  assignedTo?: User | null
  billStage: BillStage
}
```

**Source**: `app/lib/types/definitions.ts`  
**Database**: `bills` table  
**Key Features**:
- Unique bill reference constraint
- Optional timestamps for workflow stages
- Foreign key relationships to User and BillStage
- 3-bill assignment limit enforced at database and application level

## Form and Validation Types

### BillFormData
```typescript
interface BillFormData {
  billReference: string
  billDate: string
  assignedToId?: string
}
```

**Usage**: Client-side form state management  
**Validation**: Zod schema validation with server-side async validation

### CreateBillData
```typescript
interface CreateBillData {
  billReference: string
  billDate: string
  assignedToId?: string
}
```

**Usage**: Server-side bill creation  
**Validation**: Input sanitization and business rule enforcement

### AssignBillData
```typescript
interface AssignBillData {
  billId: string
  userId: string
}
```

**Usage**: Bill assignment operations  
**Business Rules**: User must have < 3 bills assigned

## Form Validation Types

### FormFieldError
```typescript
interface FormFieldError {
  message: string
  type?: string
}
```

### FormValidationState
```typescript
interface FormValidationState {
  billReference: FormFieldError | null
  billDate: FormFieldError | null
  assignedToId: FormFieldError | null
  isValid: boolean
}
```

### AsyncValidationState
```typescript
interface AsyncValidationState {
  billReference: {
    isValid: boolean
    isChecking: boolean
    message: string
  }
}
```

**Usage**: Real-time validation feedback  
**Implementation**: Debounced async validation with 500ms delay

## API Response Types

### SimpleValidationResult
```typescript
interface SimpleValidationResult {
  isValid: boolean
  message?: string
}
```

**Usage**: Server action validation responses

### AssignBillResult
```typescript
interface AssignBillResult {
  success: boolean
  bill?: Bill
  error?: string
  errorCode?: string
}
```

**Usage**: Bill assignment operation results

## Component Props Types

### BillsDashboardProps
```typescript
interface BillsDashboardProps {
  bills: Bill[]
  users: User[]
}
```

### BillFormProps
```typescript
interface BillFormProps {
  users: User[]
}
```

### GroupedBills
```typescript
interface GroupedBills {
  [stageLabel: string]: Bill[]
}
```

**Usage**: Kanban-style bill organization by stage

## Server Action Types

### CreateBillInput
```typescript
interface CreateBillInput {
  billReference: string
  billDate: string
  assignedToId?: string
}
```

### AssignBillInput
```typescript
interface AssignBillInput {
  userId: string
  billId?: string
}
```

**Note**: `billId` is optional for auto-assignment functionality

## Error Handling Types

### BillAssignmentError
```typescript
enum BillAssignmentError {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  BILL_NOT_FOUND = 'BILL_NOT_FOUND',
  USER_BILL_LIMIT_EXCEEDED = 'USER_BILL_LIMIT_EXCEEDED',
  BILL_NOT_ASSIGNABLE = 'BILL_NOT_ASSIGNABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

## Database Schema Mapping

| TypeScript Interface | Database Table | Key Constraints |
|---------------------|----------------|-----------------|
| `User` | `users` | `email` unique |
| `BillStage` | `bill_stages` | `label` unique |
| `Bill` | `bills` | `bill_reference` unique, `assigned_to_id` FK, `bill_stage_id` FK |

## Usage Guidelines

1. **Import Types**: Use `import type { User, Bill } from '@/app/lib/types'`
2. **Form Validation**: Combine Zod schemas with these interfaces
3. **API Responses**: Use response types for consistent error handling
4. **Component Props**: Use specific prop interfaces for type safety

## Related Documentation

- [Server Actions Reference](server-actions.md) - Server-side operations
- [API Reference](api.md) - REST endpoint specifications
- [Error Codes Reference](error-codes.md) - Error handling patterns
- [Database Architecture](../architecture/database.md) - Schema and constraints
