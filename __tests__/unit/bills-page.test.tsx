import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import BillsPage from '@/app/bills/page'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

const mockBills = [
  {
    id: '1',
    billReference: 'BILL-001',
    billDate: '2024-01-15',
    submittedAt: '2024-01-16T10:00:00Z',
    assignedTo: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    billStage: { id: 'submitted', label: 'Submitted', colour: '#3B82F6' }
  },
  {
    id: '2',
    billReference: 'BILL-002',
    billDate: '2024-01-20',
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
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('displays loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<BillsPage />)

    expect(screen.getByText('Loading bills...')).toBeInTheDocument()
  })

  it('displays bills dashboard with bills grouped by stage', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Bills Dashboard')
    })

    expect(screen.getByTestId('add-new-bill-button')).toBeInTheDocument()
    expect(screen.getByTestId('bills-grid')).toBeInTheDocument()

    // Check stage columns
    expect(screen.getByTestId('stage-column-submitted')).toBeInTheDocument()
    expect(screen.getByTestId('stage-column-draft')).toBeInTheDocument()

    // Check bill cards
    expect(screen.getByTestId('bill-card-BILL-001')).toBeInTheDocument()
    expect(screen.getByTestId('bill-card-BILL-002')).toBeInTheDocument()
  })

  it('displays error message when bills fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch bills'))

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch bills')).toBeInTheDocument()
    })
  })

  it('displays error banner when bills loaded but users fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockRejectedValueOnce(new Error('Failed to fetch users'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-title')).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch users:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('shows unassigned status for bills without assignedTo', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('bill-card-BILL-002')).toBeInTheDocument()
    })

    const unassignedBill = screen.getByTestId('bill-card-BILL-002')
    expect(unassignedBill).toHaveTextContent('Unassigned')
  })

  it('displays assignment dropdown for unassigned bills in Draft/Submitted stages', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('assignment-select-BILL-002')).toBeInTheDocument()
    })

    const select = screen.getByTestId('assignment-select-BILL-002')
    expect(select).toHaveTextContent('Assign to user...')
    expect(select).toHaveTextContent('John Doe')
    expect(select).toHaveTextContent('Jane Smith')
  })

  it('assigns bill to user when selection is made', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('assignment-select-BILL-002')).toBeInTheDocument()
    })

    const select = screen.getByTestId('assignment-select-BILL-002')
    fireEvent.change(select, { target: { value: 'user1' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/bills/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: '2', userId: 'user1' })
      })
    })
  })

  it('displays error message when assignment fails', async () => {
    jest.useFakeTimers()

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User has too many bills assigned' })
      } as unknown as Response)

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('assignment-select-BILL-002')).toBeInTheDocument()
    })

    const select = screen.getByTestId('assignment-select-BILL-002')
    fireEvent.change(select, { target: { value: 'user1' } })

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('User has too many bills assigned')
    })

    // Fast-forward 5 seconds to clear error
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('formats dates correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('bill-card-BILL-001')).toBeInTheDocument()
    })

    const billCard = screen.getByTestId('bill-card-BILL-001')
    expect(billCard).toHaveTextContent('Jan 15, 2024') // Bill date
    expect(billCard).toHaveTextContent('Jan 16, 2024') // Submitted date
  })

  it('shows empty state for stages with no bills', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('bills-grid')).toBeInTheDocument()
    })

    expect(screen.getAllByText('No bills in this stage')).toHaveLength(7) // All 7 stages
  })

  it('disables assignment dropdown while assigning', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      } as unknown as Response)
      .mockImplementation(() => new Promise(() => {})) // Never resolves assignment

    render(<BillsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('assignment-select-BILL-002')).toBeInTheDocument()
    })

    const select = screen.getByTestId('assignment-select-BILL-002')
    fireEvent.change(select, { target: { value: 'user1' } })

    await waitFor(() => {
      expect(select).toBeDisabled()
      expect(select).toHaveTextContent('Assigning...')
    })
  })
})