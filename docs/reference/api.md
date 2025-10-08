# API Reference

[← Back to Documentation](../README.md) | [Data Models](data-models.md) | [Server Actions](server-actions.md)

This document provides comprehensive documentation for all REST API endpoints in the Bill Management System. For data mutations and form operations, see [Server Actions Reference](server-actions.md).

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for any endpoints.

## Data Models

See [Data Models Reference](data-models.md) for complete TypeScript interface definitions.

### Quick Reference

- **User**: `{ id, name, email, createdAt, updatedAt }`
- **BillStage**: `{ id, label, createdAt, updatedAt }`
- **Bill**: `{ id, billReference, billDate, submittedAt?, approvedAt?, onHoldAt?, billStageId, assignedToId?, createdAt, updatedAt, assignedTo?, billStage }`

## Endpoints

### Users

#### Get All Users
```http
GET /api/users
```

**Description:** Retrieves all users in the system, ordered by creation date (newest first).

**Response:**
```typescript
User[]
```

**Example Response:**
```json
[
  {
    "id": "clx1234567890",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Error Responses:**
- `500 Internal Server Error`: Database connection failure

---

### Bills

#### Get All Bills
```http
GET /api/bills
```

**Description:** Retrieves all bills with their assigned users and bill stages, ordered by creation date (newest first).

**Response:**
```typescript
Bill[]
```

**Example Response:**
```json
[
  {
    "id": "clx0987654321",
    "billReference": "BILL-2024-001",
    "billDate": "2024-01-10T00:00:00.000Z",
    "submittedAt": "2024-01-12T14:30:00.000Z",
    "approvedAt": null,
    "onHoldAt": null,
    "billStageId": "clx1111111111",
    "assignedToId": "clx1234567890",
    "createdAt": "2024-01-10T09:15:00.000Z",
    "updatedAt": "2024-01-12T14:30:00.000Z",
    "assignedTo": {
      "id": "clx1234567890",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "billStage": {
      "id": "clx1111111111",
      "label": "Submitted"
    }
  }
]
```

**Error Responses:**
- `500 Internal Server Error`: Database connection failure

#### Assign Bill to User
```http
POST /api/bills/assign
```

**Description:** Assigns a bill to a user. Requires both `userId` and `billId` parameters.

**Business Rules:**
- Users cannot be assigned more than 3 bills at any time
- Only bills in "Draft" or "Submitted" stages can be assigned
- Automatically sets `submittedAt` timestamp for Submitted stage bills

**Request Body:**
```typescript
{
  userId: string      // Required, ID of user to assign bill to
  billId: string      // Required, specific bill ID to assign
}
```

**Example Request:**
```json
{
  "userId": "clx1234567890",
  "billId": "clx0987654321"
}
```

**Success Response:**
```typescript
{
  message: string
  bill: Bill
}
```

**Example Response:**
```json
{
  "message": "Bill assigned successfully",
  "bill": {
    "id": "clx0987654321",
    "billReference": "BILL-2024-001",
    "billDate": "2024-01-10T00:00:00.000Z",
    "submittedAt": "2024-01-15T10:30:00.000Z",
    "assignedToId": "clx1234567890",
    "assignedTo": {
      "id": "clx1234567890",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "billStage": {
      "id": "clx1111111111",
      "label": "Submitted"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing userId or billId, or bill not in assignable stage
- `404 Not Found`: User not found or bill not found
- `409 Conflict`: User already has maximum of 3 bills assigned
- `500 Internal Server Error`: Database error

---

### Health Check

#### Get System Health
```http
GET /api/health
```

**Description:** Returns system health status and performance metrics.

**Response:**
```typescript
{
  status: string
  timestamp: string
  uptime: number
  memory: object
  performance: object
  cache: object
  recommendations: string[]
  version: string
}
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "performance": {
    "averageResponseTime": 150,
    "totalRequests": 1000
  },
  "cache": {
    "hitRate": "available",
    "size": 50
  },
  "recommendations": [],
  "version": "1.0.0"
}
```

**Error Responses:**
- `500 Internal Server Error`: System health check failed

## Bill Stages

The system includes 7 predefined bill stages:

| Stage | Description |
|-------|-------------|
| Draft | Newly created bills |
| Submitted | Bills submitted for review |
| Approved | Bills approved for payment |
| Paying | Bills currently being paid |
| On Hold | Bills temporarily on hold |
| Rejected | Bills rejected for payment |
| Paid | Bills that have been paid |

**Note**: Stage colors are defined in UI components only, not in the database schema.

## Error Handling

All endpoints return errors in the following format:

```typescript
{
  error: string  // Human-readable error message
}
```

Common HTTP status codes:
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., user bill limit exceeded)
- `500 Internal Server Error`: Server or database error

## Data Validation

### Bill Reference Format
- Must be unique across all bills
- No specific format requirements (alphanumeric and special characters allowed)
- Case-sensitive

### Date Handling
- All dates are stored and returned in ISO 8601 format
- Times are stored in UTC
- Client applications should handle timezone conversion

### User Assignment Limits
- Maximum 3 bills per user at any given time
- Limit applies to all bill stages
- No limit on total bills a user can process over time

## Rate Limiting

Currently, no rate limiting is implemented.

## Usage Guidelines

### When to Use REST API vs Server Actions

**Use REST API for:**
- External integrations
- Third-party applications
- Mobile apps
- Microservices communication
- Standard HTTP-based workflows

**Use Server Actions for:**
- Form submissions
- Real-time validation
- Optimistic updates
- Type-safe client-server communication
- Next.js App Router integration

See [Data Operations Guide](../guides/data-operations.md) for detailed guidance on choosing the right approach.

### Integration Examples

#### JavaScript/TypeScript
```typescript
// Fetch bills
const fetchBills = async () => {
  const response = await fetch('/api/bills')
  if (!response.ok) throw new Error('Failed to fetch bills')
  return response.json()
}

// Assign bill
const assignBill = async (userId: string, billId: string) => {
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

#### cURL Examples
```bash
# Get all bills
curl -X GET http://localhost:3000/api/bills

# Get all users
curl -X GET http://localhost:3000/api/users

# Assign bill
curl -X POST http://localhost:3000/api/bills/assign \
  -H "Content-Type: application/json" \
  -d '{"userId": "clx1234567890", "billId": "clx0987654321"}'

# Health check
curl -X GET http://localhost:3000/api/health
```

## Related Documentation

- [Data Models Reference](data-models.md) - Complete type definitions
- [Server Actions Reference](server-actions.md) - Server-side operations
- [Error Codes Reference](error-codes.md) - Error handling patterns
- [Data Operations Guide](../guides/data-operations.md) - When to use REST vs Server Actions
- [Database Architecture](../architecture/database.md) - Schema and constraints
