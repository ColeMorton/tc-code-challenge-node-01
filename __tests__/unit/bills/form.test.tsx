import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock the actions module BEFORE importing
jest.mock('@/app/bills/actions')

// Override useRouter from jest.setup.js
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  })
}))

// NOW import component and actions
import BillForm from '@/app/ui/bills/form'
import { createBill, validateBillReference } from '@/app/bills/actions'

// Get the mocked functions
const mockCreateBill = createBill as jest.Mock
const mockValidateBillReference = validateBillReference as jest.Mock

const mockUsers = [
  { id: 'user1', name: 'John Doe', email: 'john@example.com', _count: { bills: 1 } },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', _count: { bills: 2 } }
]

describe('BillForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with all fields', () => {
    render(<BillForm users={mockUsers} />)

    expect(screen.getByTestId('bill-reference-input')).toBeInTheDocument()
    expect(screen.getByTestId('bill-date-input')).toBeInTheDocument()
    expect(screen.getByTestId('assigned-to-select')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
  })

  it('populates user dropdown with users', () => {
    render(<BillForm users={mockUsers} />)

    const select = screen.getByTestId('assigned-to-select')
    expect(select).toHaveTextContent('John Doe')
    expect(select).toHaveTextContent('Jane Smith')
  })

  it('validates bill reference on change', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: true,
      message: 'Available'
    })

    render(<BillForm users={mockUsers} />)

    const input = screen.getByTestId('bill-reference-input')
    fireEvent.change(input, { target: { value: 'BILL-TEST-001' } })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalledWith('BILL-TEST-001')
      expect(screen.getByText('Available')).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('shows error when bill reference already exists', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: false,
      message: 'Bill reference already exists'
    })

    render(<BillForm users={mockUsers} />)

    const input = screen.getByTestId('bill-reference-input')
    fireEvent.change(input, { target: { value: 'BILL-EXISTING' } })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(screen.getByText('Bill reference already exists')).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('submits form successfully', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: true,
      message: 'Available'
    })
    mockCreateBill.mockResolvedValue({
      id: 'new-bill',
      billReference: 'BILL-TEST-001',
      billDate: new Date('2024-01-01'),
      billStageId: 'draft-stage',
      assignedToId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as never)

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    const billDateInput = screen.getByTestId('bill-date-input')
    const submitButton = screen.getByTestId('submit-button')

    fireEvent.change(billRefInput, { target: { value: 'BILL-TEST-001' } })
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalled()
    })

    fireEvent.change(billDateInput, { target: { value: '2024-01-01' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateBill).toHaveBeenCalledWith({
        billReference: 'BILL-TEST-001',
        billDate: '2024-01-01',
        assignedToId: undefined
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Bill Created Successfully!')).toBeInTheDocument()
    })

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/bills')
    })

    jest.useRealTimers()
  })

  it('submits form with assigned user', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: true,
      message: 'Available'
    })
    mockCreateBill.mockResolvedValue({} as never)

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    const billDateInput = screen.getByTestId('bill-date-input')
    const assignToSelect = screen.getByTestId('assigned-to-select')
    const submitButton = screen.getByTestId('submit-button')

    fireEvent.change(billRefInput, { target: { value: 'BILL-TEST-002' } })
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalled()
    })

    fireEvent.change(billDateInput, { target: { value: '2024-01-01' } })
    fireEvent.change(assignToSelect, { target: { value: 'user1' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateBill).toHaveBeenCalledWith({
        billReference: 'BILL-TEST-002',
        billDate: '2024-01-01',
        assignedToId: 'user1'
      })
    })

    jest.useRealTimers()
  })

  it('shows error when submitting empty bill reference', async () => {
    render(<BillForm users={mockUsers} />)

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Bill reference is required')
    })
  })

  it('shows error when submitting empty bill date', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: true,
      message: 'Available'
    })

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    fireEvent.change(billRefInput, { target: { value: 'BILL-TEST-001' } })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalled()
    })

    // Wait for validation to complete and button to be enabled
    await waitFor(() => {
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).not.toBeDisabled()
    })

    const form = document.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Bill date is required')
    })

    jest.useRealTimers()
  })

  it('shows error when validation fails', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: false,
      message: 'Bill reference already exists'
    })

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    const billDateInput = screen.getByTestId('bill-date-input')
    const submitButton = screen.getByTestId('submit-button')

    fireEvent.change(billRefInput, { target: { value: 'BILL-EXISTING' } })
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalled()
    })

    fireEvent.change(billDateInput, { target: { value: '2024-01-01' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Please fix the bill reference error')
    })

    expect(mockCreateBill).not.toHaveBeenCalled()

    jest.useRealTimers()
  })

  it('disables submit button while validating', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockImplementation(() => new Promise(() => {}))

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    const submitButton = screen.getByTestId('submit-button')

    fireEvent.change(billRefInput, { target: { value: 'BILL-TEST-001' } })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Checking...')).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('disables submit button while creating bill', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: true,
      message: 'Available'
    })
    mockCreateBill.mockImplementation(() => new Promise(() => {}))

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    const billDateInput = screen.getByTestId('bill-date-input')
    const submitButton = screen.getByTestId('submit-button')

    fireEvent.change(billRefInput, { target: { value: 'BILL-TEST-001' } })
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalled()
    })

    fireEvent.change(billDateInput, { target: { value: '2024-01-01' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Creating...')
      expect(submitButton).toBeDisabled()
    })

    jest.useRealTimers()
  })

  it('handles server error during creation', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: true,
      message: 'Available'
    })
    mockCreateBill.mockRejectedValue(new Error('Database error'))

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    const billDateInput = screen.getByTestId('bill-date-input')
    const submitButton = screen.getByTestId('submit-button')

    fireEvent.change(billRefInput, { target: { value: 'BILL-TEST-001' } })
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalled()
    })

    fireEvent.change(billDateInput, { target: { value: '2024-01-01' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Database error')
    })

    jest.useRealTimers()
  })

  it('does not validate empty bill reference', async () => {
    jest.useFakeTimers()
    mockValidateBillReference.mockResolvedValue({
      isValid: true,
      message: 'Available'
    })

    render(<BillForm users={mockUsers} />)

    const billRefInput = screen.getByTestId('bill-reference-input')
    fireEvent.change(billRefInput, { target: { value: 'TEST' } })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockValidateBillReference).toHaveBeenCalledTimes(1)
    })

    // Now clear the input - this should not trigger validation
    fireEvent.change(billRefInput, { target: { value: '' } })

    // Wait a bit to ensure no additional validation is called
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Should still be called only once
    expect(mockValidateBillReference).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })
})
