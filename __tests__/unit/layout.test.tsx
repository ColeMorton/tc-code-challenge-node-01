import { render } from '@testing-library/react'
import RootLayout from '@/app/layout'

// Mock Next.js font components
jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans'
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono'
  })
}))

// Mock console.error to suppress HTML nesting warnings during testing
const originalError = console.error
beforeAll(() => {
  console.error = (...args: Parameters<typeof console.error>) => {
    if (typeof args[0] === 'string' && args[0].includes('cannot be a child of')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

describe('RootLayout', () => {
  it('renders children within the layout structure', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="test-child">Test content</div>
      </RootLayout>
    )

    const testChild = getByTestId('test-child')
    expect(testChild).toBeInTheDocument()
    expect(testChild).toHaveTextContent('Test content')
  })

  it('renders multiple children correctly', () => {
    const { getByTestId } = render(
      <RootLayout>
        <header data-testid="header">Header</header>
        <main data-testid="main">Main content</main>
        <footer data-testid="footer">Footer</footer>
      </RootLayout>
    )

    expect(getByTestId('header')).toBeInTheDocument()
    expect(getByTestId('main')).toBeInTheDocument()
    expect(getByTestId('footer')).toBeInTheDocument()
  })

  it('properly passes through children content', () => {
    const testContent = 'Layout test content'
    const { getByText } = render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>
    )

    expect(getByText(testContent)).toBeInTheDocument()
  })
})