import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock the actions module
jest.mock('@/app/bills/actions')

// NOW import component and actions
import BillsDashboard from '@/app/ui/bills/dashboard'
import { assignBillAction } from '@/app/bills/actions'

// Get the mocked function
const mockAssignBillAction = assignBillAction as jest.Mock

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

describe('BillsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders bills grouped by stage', () => {
    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    expect(screen.getByTestId('stage-column-submitted')).toBeInTheDocument()
    expect(screen.getByTestId('stage-column-draft')).toBeInTheDocument()
    expect(screen.getByTestId('bill-card-BILL-001')).toBeInTheDocument()
    expect(screen.getByTestId('bill-card-BILL-002')).toBeInTheDocument()
  })

  it('displays assigned user name', () => {
    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const billCard = screen.getByTestId('bill-card-BILL-001')
    expect(billCard).toHaveTextContent('John Doe')
  })

  it('shows unassigned status for bills without assignedTo', () => {
    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const billCard = screen.getByTestId('bill-card-BILL-002')
    expect(billCard).toHaveTextContent('Unassigned')
  })

  it('displays assignment dropdown for unassigned bills in Draft/Submitted stages', () => {
    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    expect(screen.getByTestId('assignment-select-BILL-002')).toBeInTheDocument()
    expect(screen.queryByTestId('assignment-select-BILL-001')).not.toBeInTheDocument()
  })

  it('assigns bill to user when selection is made', async () => {
    mockAssignBillAction.mockResolvedValue({ success: true })

    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const select = screen.getByTestId('assignment-select-BILL-002')
    fireEvent.change(select, { target: { value: 'user1' } })

    await waitFor(() => {
      expect(mockAssignBillAction).toHaveBeenCalledWith({
        billId: '2',
        userId: 'user1'
      })
    })
  })

  it('displays error message when assignment fails', async () => {
    jest.useFakeTimers()

    mockAssignBillAction.mockResolvedValue({
      success: false,
      error: 'User already has the maximum of 3 bills assigned'
    })

    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const select = screen.getByTestId('assignment-select-BILL-002')
    fireEvent.change(select, { target: { value: 'user1' } })

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'User already has the maximum of 3 bills assigned'
      )
    })

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('disables assignment dropdown while assigning', async () => {
    mockAssignBillAction.mockImplementation(() => new Promise(() => {}))

    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const select = screen.getByTestId('assignment-select-BILL-002')
    fireEvent.change(select, { target: { value: 'user1' } })

    await waitFor(() => {
      expect(select).toBeDisabled()
      expect(select).toHaveTextContent('Assigning...')
    })
  })

  it('formats dates correctly', () => {
    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const billCard = screen.getByTestId('bill-card-BILL-001')
    expect(billCard).toHaveTextContent('Jan 15, 2024')
    expect(billCard).toHaveTextContent('Jan 16, 2024')
  })

  it('shows empty state for stages with no bills', () => {
    render(<BillsDashboard bills={[]} users={mockUsers} />)

    const emptyStates = screen.getAllByText('No bills in this stage')
    expect(emptyStates).toHaveLength(7)
  })

  it('displays all stage columns in correct order', () => {
    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const stageColumns = [
      'stage-column-draft',
      'stage-column-submitted',
      'stage-column-approved',
      'stage-column-paying',
      'stage-column-on-hold',
      'stage-column-rejected',
      'stage-column-paid'
    ]

    stageColumns.forEach(testId => {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    })
  })

  it('displays bill count in stage header', () => {
    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const draftColumn = screen.getByTestId('stage-column-draft')
    expect(draftColumn).toHaveTextContent('Draft (1)')

    const submittedColumn = screen.getByTestId('stage-column-submitted')
    expect(submittedColumn).toHaveTextContent('Submitted (1)')
  })

  it('does not show assignment dropdown for Approved stage bills', () => {
    const approvedBills = [
      {
        id: '3',
        billReference: 'BILL-003',
        billDate: new Date('2024-01-20'),
        submittedAt: null,
        approvedAt: new Date('2024-01-21'),
        onHoldAt: null,
        assignedTo: null,
        billStage: { id: 'approved', label: 'Approved', colour: '#10B981' }
      }
    ]

    render(<BillsDashboard bills={approvedBills} users={mockUsers} />)

    expect(screen.queryByTestId('assignment-select-BILL-003')).not.toBeInTheDocument()
  })

  it('resets select value after assignment', async () => {
    mockAssignBillAction.mockResolvedValue({ success: true })

    render(<BillsDashboard bills={mockBills} users={mockUsers} />)

    const select = screen.getByTestId('assignment-select-BILL-002') as HTMLSelectElement

    fireEvent.change(select, { target: { value: 'user1' } })

    await waitFor(() => {
      expect(select.value).toBe('')
    })
  })
})
