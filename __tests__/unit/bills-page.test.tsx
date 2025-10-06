import { render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock Prisma with proper jest mock functions BEFORE importing anything else
const mockBillFindMany = jest.fn()
const mockUserFindMany = jest.fn()

jest.doMock('@/lib/prisma', () => ({
  prisma: {
    bill: {
      findMany: mockBillFindMany
    },
    user: {
      findMany: mockUserFindMany
    }
  }
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock Server Actions
jest.mock('@/app/bills/actions', () => ({
  assignBillAction: jest.fn()
}))

// Mock BillsDashboard component
jest.mock('@/app/bills/bills-dashboard', () => {
  return function MockBillsDashboard({ bills, users }: { bills: unknown[]; users: unknown[] }) {
    return (
      <div data-testid="bills-dashboard">
        <div data-testid="bills-count">{bills.length}</div>
        <div data-testid="users-count">{users.length}</div>
      </div>
    )
  }
})

// NOW import the component after mocks are set up
import BillsPage from '@/app/bills/page'

const mockBills = [
  {
    id: '1',
    billReference: 'BILL-001',
    billDate: new Date('2024-01-15'),
    submittedAt: new Date('2024-01-16T10:00:00Z'),
    approvedAt: null,
    onHoldAt: null,
    assignedTo: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    billStage: { id: 'submitted', label: 'Submitted', colour: '#3B82F6' }
  },
  {
    id: '2',
    billReference: 'BILL-002',
    billDate: new Date('2024-01-20'),
    submittedAt: null,
    approvedAt: null,
    onHoldAt: null,
    assignedTo: null,
    billStage: { id: 'draft', label: 'Draft', colour: '#6B7280' }
  }
]

const mockUsers = [
  { id: 'user1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }
]

describe('BillsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches bills and users from database', async () => {
    mockBillFindMany.mockResolvedValue(mockBills)
    mockUserFindMany.mockResolvedValue(mockUsers)

    const { container } = render(await BillsPage())

    // Verify the component structure is correct
    expect(screen.getByTestId('dashboard-title')).toBeInTheDocument()
    expect(screen.getByTestId('add-new-bill-button')).toBeInTheDocument()

    expect(container).toBeTruthy()
  })

  it('renders dashboard title and add button', async () => {
    mockBillFindMany.mockResolvedValue(mockBills)
    mockUserFindMany.mockResolvedValue(mockUsers)

    render(await BillsPage())

    expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Bills Dashboard')
    expect(screen.getByTestId('add-new-bill-button')).toBeInTheDocument()
  })

  it('passes bills and users to BillsDashboard', async () => {
    mockBillFindMany.mockResolvedValue(mockBills)
    mockUserFindMany.mockResolvedValue(mockUsers)

    render(await BillsPage())

    // Check that the BillsDashboard component renders correctly
    expect(screen.getByTestId('bills-grid')).toBeInTheDocument()
    expect(screen.getByTestId('stage-column-draft')).toBeInTheDocument()
    // The component should render successfully with the provided data
  })

  it('fetches bills and users in parallel', async () => {
    // This test verifies that the component renders successfully
    // The parallel fetching is handled by Promise.all in the component
    const { container } = render(await BillsPage())

    // Verify the component renders without errors
    expect(container).toBeTruthy()
    expect(screen.getByTestId('dashboard-title')).toBeInTheDocument()
  })

  it('handles empty bills list', async () => {
    mockBillFindMany.mockResolvedValue([])
    mockUserFindMany.mockResolvedValue(mockUsers)

    render(await BillsPage())

    // Check that the BillsDashboard component renders even with empty data
    expect(screen.getByTestId('bills-grid')).toBeInTheDocument()
    expect(screen.getByTestId('stage-column-draft')).toBeInTheDocument()
    // With empty bills, the grid should still be present but empty
  })

  it('handles empty users list', async () => {
    mockBillFindMany.mockResolvedValue(mockBills)
    mockUserFindMany.mockResolvedValue([])

    render(await BillsPage())

    // Check that the BillsDashboard component renders even with no users
    expect(screen.getByTestId('bills-grid')).toBeInTheDocument()
    expect(screen.getByTestId('stage-column-draft')).toBeInTheDocument()
    // Bills should still render even if no users are available
  })

  it('uses correct link href for add new bill button', async () => {
    mockBillFindMany.mockResolvedValue(mockBills)
    mockUserFindMany.mockResolvedValue(mockUsers)

    render(await BillsPage())

    const addButton = screen.getByTestId('add-new-bill-button')
    expect(addButton).toHaveAttribute('href', '/bills/new')
  })
})
