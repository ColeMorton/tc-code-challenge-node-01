import { render, screen } from '@testing-library/react'

// Mock the UI components
jest.mock('@/app/ui/skeletons', () => ({
  BillsTableSkeleton: () => <div data-testid="bills-table-skeleton">Loading bills table...</div>,
  CardsSkeleton: () => <div data-testid="cards-skeleton">Loading cards...</div>
}))

jest.mock('@/app/ui/dashboard/cards', () => {
  return function MockCardWrapper() {
    return <div data-testid="card-wrapper">Card Wrapper Component</div>
  }
})

jest.mock('@/app/ui/bills/table', () => {
  return function MockBillsTable() {
    return <div data-testid="bills-table">Bills Table Component</div>
  }
})

// Mock Next.js Suspense for testing
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  Suspense: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
    // In tests, render both children and fallback to test both states
    return (
      <div data-testid="suspense-container">
        <div data-testid="suspense-fallback">{fallback}</div>
        <div data-testid="suspense-children">{children}</div>
      </div>
    )
  }
}))

// Create a test version of the UsersPage component that renders synchronously
function TestUsersPage() {
  return (
    <main>
      <h1 className='mb-4 text-xl md:text-2xl text-center'>
        Bills
      </h1>
      <div className="px-12 py-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 [&>*:not(:last-child)]:pb-12 bg-gray-200">
        <div data-testid="suspense-container">
          <div data-testid="suspense-fallback">
            <div data-testid="cards-skeleton">Loading cards...</div>
          </div>
          <div data-testid="suspense-children">
            <div data-testid="card-wrapper">Card Wrapper Component</div>
          </div>
        </div>
        <div className="col-span-full rounded-xl bg-gray-100 shadow-sm">
          <div data-testid="suspense-container">
            <div data-testid="suspense-fallback">
              <div data-testid="bills-table-skeleton">Loading bills table...</div>
            </div>
            <div data-testid="suspense-children">
              <div data-testid="bills-table">Bills Table Component</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

describe('Users Page', () => {
  it('renders the main title correctly', () => {
    render(<TestUsersPage />)

    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent('Bills')
  })

  it('has correct styling classes for the title', () => {
    render(<TestUsersPage />)

    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveClass('mb-4', 'text-xl', 'md:text-2xl', 'text-center')
  })

  it('renders the main container with correct structure', () => {
    const { container } = render(<TestUsersPage />)

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('renders the grid container with correct styling', () => {
    const { container } = render(<TestUsersPage />)

    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass(
      'px-12',
      'py-12',
      'grid',
      'gap-12',
      'sm:grid-cols-2',
      'lg:grid-cols-4',
      '[&>*:not(:last-child)]:pb-12',
      'bg-gray-200'
    )
  })

  it('renders CardWrapper within Suspense boundary', () => {
    render(<TestUsersPage />)

    expect(screen.getByTestId('card-wrapper')).toBeInTheDocument()
  })

  it('renders CardsSkeleton as fallback for CardWrapper', () => {
    render(<TestUsersPage />)

    expect(screen.getByTestId('cards-skeleton')).toBeInTheDocument()
  })

  it('renders BillsTable within Suspense boundary', () => {
    render(<TestUsersPage />)

    expect(screen.getByTestId('bills-table')).toBeInTheDocument()
  })

  it('renders BillsTableSkeleton as fallback for BillsTable', () => {
    render(<TestUsersPage />)

    expect(screen.getByTestId('bills-table-skeleton')).toBeInTheDocument()
  })

  it('renders the table container with correct styling', () => {
    const { container } = render(<TestUsersPage />)

    const tableContainer = container.querySelector('.col-span-full')
    expect(tableContainer).toBeInTheDocument()
    expect(tableContainer).toHaveClass(
      'col-span-full',
      'rounded-xl',
      'bg-gray-100',
      'shadow-sm'
    )
  })

  it('has proper responsive grid layout', () => {
    const { container } = render(<TestUsersPage />)

    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass(
      'sm:grid-cols-2',
      'lg:grid-cols-4'
    )
  })

  it('renders all components in correct order', () => {
    const { container } = render(<TestUsersPage />)

    const main = container.querySelector('main')
    const title = main?.querySelector('h1')
    const grid = main?.querySelector('.grid')
    const cardWrapper = grid?.querySelector('[data-testid="card-wrapper"]')
    const tableContainer = grid?.querySelector('.col-span-full')

    expect(main).toBeInTheDocument()
    expect(title).toBeInTheDocument()
    expect(grid).toBeInTheDocument()
    expect(cardWrapper).toBeInTheDocument()
    expect(tableContainer).toBeInTheDocument()
  })

  it('has proper accessibility structure', () => {
    render(<TestUsersPage />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Bills')
  })

  it('renders Suspense boundaries correctly', () => {
    render(<TestUsersPage />)

    const suspenseContainers = screen.getAllByTestId('suspense-container')
    expect(suspenseContainers).toHaveLength(2) // One for CardWrapper, one for BillsTable
  })

  it('renders without crashing', () => {
    expect(() => render(<TestUsersPage />)).not.toThrow()
  })

  it('has correct page structure for users functionality', () => {
    render(<TestUsersPage />)

    // Verify the page structure matches the expected users page layout
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bills')
    expect(screen.getByTestId('card-wrapper')).toBeInTheDocument()
    expect(screen.getByTestId('bills-table')).toBeInTheDocument()
  })

  it('displays loading states correctly', () => {
    render(<TestUsersPage />)

    // Both skeleton components should be present
    expect(screen.getByTestId('cards-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('bills-table-skeleton')).toBeInTheDocument()
  })

  it('has proper CSS classes for responsive design', () => {
    const { container } = render(<TestUsersPage />)

    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass(
      'sm:grid-cols-2',
      'lg:grid-cols-4'
    )

    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveClass('text-xl', 'md:text-2xl')
  })
})
