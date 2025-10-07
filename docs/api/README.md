# API Reference

This document provides comprehensive documentation for all API endpoints in the Trilogy Care Bill Management System.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for any endpoints.

## Data Models

### User
```typescript
interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}
```

### BillStage
```typescript
interface BillStage {
  id: string
  label: string
  colour: string
  createdAt: string
  updatedAt: string
}
```

### Bill
```typescript
interface Bill {
  id: string
  billReference: string
  billDate: string
  submittedAt?: string
  approvedAt?: string
  onHoldAt?: string
  billStageId: string
  assignedToId?: string
  createdAt: string
  updatedAt: string
  assignedTo?: User
  billStage: BillStage
}
```

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
      "label": "Submitted",
      "colour": "#3B82F6"
    }
  }
]
```

**Error Responses:**
- `500 Internal Server Error`: Database connection failure

#### Create a New Bill
```http
POST /api/bills
```

**Description:** Creates a new bill in the system. Bills are created in "Draft" stage by default.

**Request Body:**
```typescript
{
  billReference: string    // Required, must be unique
  billDate: string        // Required, ISO date string
  assignedToId?: string   // Optional, user ID to assign the bill to
}
```

**Example Request:**
```json
{
  "billReference": "BILL-2024-002",
  "billDate": "2024-01-15T00:00:00.000Z",
  "assignedToId": "clx1234567890"
}
```

**Success Response:**
```typescript
Bill // Created bill with includes
```

**Error Responses:**
- `400 Bad Request`: Missing required fields (billReference, billDate)
- `409 Conflict`: Bill reference already exists
- `500 Internal Server Error`: Draft stage not found or database error

#### Assign Bill to User
```http
POST /api/bills/assign
```

**Description:** Assigns a bill to a user. Can assign a specific bill or automatically find an unassigned bill in Draft/Submitted stage.

**Business Rules:**
- Users cannot be assigned more than 3 bills at a time
- Only bills in "Draft" or "Submitted" stages can be assigned
- If no `billId` provided, finds oldest unassigned bill in assignable stages
- Automatically sets `submittedAt` timestamp for Submitted stage bills

**Request Body:**
```typescript
{
  userId: string      // Required, ID of user to assign bill to
  billId?: string     // Optional, specific bill ID to assign
}
```

**Example Request (Specific Bill):**
```json
{
  "userId": "clx1234567890",
  "billId": "clx0987654321"
}
```

**Example Request (Auto-assign):**
```json
{
  "userId": "clx1234567890"
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
      "label": "Submitted",
      "colour": "#3B82F6"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing userId or bill not in assignable stage
- `404 Not Found`: User not found, bill not found, or no unassigned bills available
- `409 Conflict`: User already has maximum of 3 bills assigned
- `500 Internal Server Error`: No assignable stages found or database error

## Bill Stages

The system includes 7 predefined bill stages:

| Stage | Color | Description |
|-------|-------|-------------|
| Draft | #9CA3AF | Newly created bills |
| Submitted | #3B82F6 | Bills submitted for review |
| Approved | #10B981 | Bills approved for payment |
| Paying | #F59E0B | Bills currently being paid |
| On Hold | #EF4444 | Bills temporarily on hold |
| Rejected | #DC2626 | Bills rejected for payment |
| Paid | #059669 | Bills that have been paid |

## Error Handling

All endpoints return errors in the following format:

```typescript
{
  error: string  // Human-readable error message
}
```

Common HTTP status codes:
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate bill reference)
- `500 Internal Server Error`: Server or database error

## Rate Limiting

Currently, no rate limiting is implemented.

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