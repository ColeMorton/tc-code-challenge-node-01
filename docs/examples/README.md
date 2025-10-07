# Code Examples

This document provides practical examples for common development patterns, API usage, frontend components, database operations, and testing strategies used in the Trilogy Care Bill Management System.

## API Usage Examples

### Fetching Bills with JavaScript/TypeScript

```typescript
// Fetch all bills with related data
const fetchBills = async () => {
  try {
    const response = await fetch('/api/bills')
    if (!response.ok) {
      throw new Error('Failed to fetch bills')
    }
    const bills = await response.json()
    return bills
  } catch (error) {
    console.error('Error fetching bills:', error)
    throw error
  }
}

// Usage in React component
useEffect(() => {
  const loadBills = async () => {
    try {
      const bills = await fetchBills()
      setBills(bills)
    } catch (error) {
      setError('Failed to load bills')
    }
  }
  loadBills()
}, [])
```

### Creating a New Bill

```typescript
interface CreateBillRequest {
  billReference: string
  billDate: string
  assignedToId?: string
}

const createBill = async (billData: CreateBillRequest) => {
  try {
    const response = await fetch('/api/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create bill')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating bill:', error)
    throw error
  }
}

// Usage example
const handleSubmit = async (formData: FormData) => {
  try {
    const newBill = await createBill({
      billReference: 'BILL-2024-001',
      billDate: '2024-01-15T00:00:00.000Z',
      assignedToId: 'user-id-123'
    })
    console.log('Bill created:', newBill)
  } catch (error) {
    console.error('Creation failed:', error)
  }
}
```

### Assigning Bills to Users

```typescript
// Assign specific bill to user
const assignSpecificBill = async (billId: string, userId: string) => {
  const response = await fetch('/api/bills/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ billId, userId })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  return await response.json()
}

// Auto-assign next available bill
const autoAssignBill = async (userId: string) => {
  const response = await fetch('/api/bills/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })

  return await response.json()
}
```

### Server Actions for Bill Management

```typescript
// Using server actions for bill creation
import { createBill, validateBillReference } from '@/app/bills/actions'

const handleCreateBill = async (formData: FormData) => {
  try {
    const billData = {
      billReference: formData.get('billReference') as string,
      billDate: formData.get('billDate') as string,
      assignedToId: formData.get('assignedToId') as string || undefined
    }

    const newBill = await createBill(billData)
    console.log('Bill created:', newBill)
  } catch (error) {
    console.error('Creation failed:', error)
  }
}

// Real-time validation using server action
const [validation, setValidation] = useState({ isValid: true, message: '' })

const checkBillReference = async (reference: string) => {
  if (!reference) return

  try {
    const result = await validateBillReference(reference)
    setValidation({
      isValid: result.isValid,
      message: result.message || 'Reference available'
    })
  } catch (error) {
    setValidation({
      isValid: false,
      message: 'Validation failed'
    })
  }
}
```

## Frontend Component Examples

### Bill Dashboard Component Pattern

```typescript
interface Bill {
  id: string
  billReference: string
  billDate: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  billStage: {
    id: string
    label: string
    colour: string
  }
}

const BillCard: React.FC<{ bill: Bill }> = ({ bill }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="font-medium text-gray-900 mb-2">
        {bill.billReference}
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div>
          <span className="font-medium">Assigned to:</span>{' '}
          {bill.assignedTo ? bill.assignedTo.name : (
            <span className="text-orange-600 font-medium">Unassigned</span>
          )}
        </div>
        <div>
          <span className="font-medium">Date:</span> {formatDate(bill.billDate)}
        </div>
      </div>
    </div>
  )
}
```

### Form Validation Pattern

```typescript
interface FormValidation {
  billReference: {
    isValid: boolean
    isChecking: boolean
    message: string
  }
}

const useFormValidation = () => {
  const [validation, setValidation] = useState<FormValidation>({
    billReference: { isValid: true, isChecking: false, message: '' }
  })

  const validateBillReference = async (reference: string) => {
    if (!reference.trim()) {
      setValidation(prev => ({
        ...prev,
        billReference: { isValid: false, isChecking: false, message: 'Reference is required' }
      }))
      return
    }

    setValidation(prev => ({
      ...prev,
      billReference: { ...prev.billReference, isChecking: true }
    }))

    try {
      const result = await fetch(`/api/bills/validate?billReference=${encodeURIComponent(reference)}`)
      const data = await result.json()

      setValidation(prev => ({
        ...prev,
        billReference: {
          isValid: data.isValid,
          isChecking: false,
          message: data.isValid ? '' : 'Reference already exists'
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

  return { validation, validateBillReference }
}
```

### Loading and Error States

```typescript
const BillsList: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/bills')

        if (!response.ok) {
          throw new Error('Failed to fetch bills')
        }

        const data = await response.json()
        setBills(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading bills...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bills.map(bill => (
        <BillCard key={bill.id} bill={bill} />
      ))}
    </div>
  )
}
```

## Database Query Examples

### Prisma Query Patterns

```typescript
import { prisma } from '@/lib/prisma'

// Find bills with filtering and relationships
const findBillsWithFilters = async () => {
  return await prisma.bill.findMany({
    where: {
      billStage: {
        label: {
          in: ['Draft', 'Submitted']
        }
      },
      assignedToId: null  // Unassigned bills
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      billStage: true
    },
    orderBy: [
      { submittedAt: 'asc' },
      { createdAt: 'asc' }
    ]
  })
}

// Count bills by user with limit checking
const checkUserBillLimit = async (userId: string) => {
  const billCount = await prisma.bill.count({
    where: { assignedToId: userId }
  })

  return {
    currentCount: billCount,
    hasReachedLimit: billCount >= 3,
    remainingSlots: Math.max(0, 3 - billCount)
  }
}

// Complex update with conditional logic
const assignBillWithTimestamp = async (billId: string, userId: string) => {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { billStage: true }
  })

  if (!bill) throw new Error('Bill not found')

  const updateData: any = { assignedToId: userId }

  // Set timestamp for submitted bills
  if (bill.billStage.label === 'Submitted' && !bill.submittedAt) {
    updateData.submittedAt = new Date()
  }

  return await prisma.bill.update({
    where: { id: billId },
    data: updateData,
    include: {
      assignedTo: true,
      billStage: true
    }
  })
}
```

### Transaction Examples

```typescript
// Atomic bill creation with stage validation
const createBillWithValidation = async (billData: {
  billReference: string
  billDate: Date
  assignedToId?: string
}) => {
  return await prisma.$transaction(async (tx) => {
    // Check if reference exists
    const existing = await tx.bill.findUnique({
      where: { billReference: billData.billReference }
    })

    if (existing) {
      throw new Error('Bill reference already exists')
    }

    // Get draft stage
    const draftStage = await tx.billStage.findFirst({
      where: { label: 'Draft' }
    })

    if (!draftStage) {
      throw new Error('Draft stage not found')
    }

    // Create bill
    return await tx.bill.create({
      data: {
        ...billData,
        billStageId: draftStage.id
      },
      include: {
        assignedTo: true,
        billStage: true
      }
    })
  })
}
```

## Testing Examples

### Unit Test with Mocked Prisma

```typescript
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/bills/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    bill: {
      findMany: jest.fn(),
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Bills API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return bills with proper includes', async () => {
    const mockBills = [
      {
        id: '1',
        billReference: 'BILL-0001',
        assignedTo: { name: 'John Doe', email: 'john@example.com' },
        billStage: { label: 'Draft', colour: '#9CA3AF' }
      }
    ]

    mockPrisma.bill.findMany.mockResolvedValue(mockBills)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockBills)
    expect(mockPrisma.bill.findMany).toHaveBeenCalledWith({
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        billStage: {
          select: { id: true, label: true, colour: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  })
})
```

### Integration Test Example

```typescript
import { testPrisma, resetDatabase, createTestBill } from '../testUtils'
import request from 'supertest'
import { createServer } from 'http'
import { NextRequest } from 'next/server'

describe('Bills Integration', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should create and retrieve bills', async () => {
    // Create a bill directly in database
    const bill = await createTestBill({
      billReference: 'TEST-BILL-001',
      billDate: new Date('2024-01-01')
    })

    // Verify via API
    const response = await request(app)
      .get('/api/bills')
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0].billReference).toBe('TEST-BILL-001')
  })
})
```

### Component Testing with React Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BillsPage from '@/app/bills/page'

// Mock fetch
global.fetch = jest.fn()

describe('BillsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display bills after loading', async () => {
    const mockBills = [
      {
        id: '1',
        billReference: 'BILL-0001',
        billDate: '2024-01-01',
        assignedTo: { name: 'John Doe' },
        billStage: { label: 'Draft', colour: '#9CA3AF' }
      }
    ]

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []  // users
      })

    render(<BillsPage />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading bills...')).not.toBeInTheDocument()
    })

    // Check bill is displayed
    expect(screen.getByText('BILL-0001')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should handle bill assignment', async () => {
    const user = userEvent.setup()

    // Mock initial data
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockBill]  // bills
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser]  // users
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Bill assigned successfully' })  // assignment
      })

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByText('BILL-0001')).toBeInTheDocument()
    })

    // Find and click assignment dropdown
    const select = screen.getByTestId('assignment-select-BILL-0001')
    await user.selectOptions(select, 'user-1')

    // Verify assignment API call
    expect(fetch).toHaveBeenCalledWith('/api/bills/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billId: '1', userId: 'user-1' })
    })
  })
})
```

## Error Handling Examples

### API Error Handling Pattern

```typescript
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

const apiRequest = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed [${url}]:`, error)
    throw new Error(handleApiError(error))
  }
}
```

### React Error Boundary

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

These examples demonstrate the patterns and practices used throughout the Trilogy Care Bill Management System, providing practical templates for common development tasks.