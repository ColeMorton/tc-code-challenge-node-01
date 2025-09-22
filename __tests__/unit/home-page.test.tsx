import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home', () => {
  it('renders the main title', () => {
    render(<Home />)

    expect(screen.getByTestId('home-title')).toHaveTextContent('Trilogy Care')
  })

  it('displays the instruction message', () => {
    render(<Home />)

    expect(screen.getByText('Please view the README.md file for the task instructions')).toBeInTheDocument()
  })

  it('has correct styling classes applied', () => {
    const { container } = render(<Home />)

    // Check main container has full height and gradient
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('min-h-screen', 'relative', 'overflow-hidden')

    // Check gradient background
    const gradientBg = container.querySelector('.bg-gradient-to-br')
    expect(gradientBg).toBeInTheDocument()
    expect(gradientBg).toHaveClass('from-purple-900', 'via-blue-900', 'to-indigo-900')
  })

  it('renders the title with gradient text styling', () => {
    render(<Home />)

    const title = screen.getByTestId('home-title')
    expect(title).toHaveClass(
      'text-6xl',
      'md:text-8xl',
      'font-bold',
      'bg-gradient-to-r',
      'from-pink-400',
      'via-purple-400',
      'to-cyan-400',
      'bg-clip-text',
      'text-transparent',
      'animate-pulse'
    )
  })

  it('renders the subtitle with proper styling', () => {
    render(<Home />)

    const subtitle = screen.getByText('Please view the README.md file for the task instructions')
    expect(subtitle).toHaveClass(
      'text-xl',
      'md:text-2xl',
      'text-white/90',
      'font-medium',
      'backdrop-blur-sm',
      'bg-white/10',
      'rounded-full',
      'px-8',
      'py-4',
      'border',
      'border-white/20',
      'shadow-2xl'
    )
  })

  it('has proper responsive layout structure', () => {
    const { container } = render(<Home />)

    // Check main content container
    const mainContent = container.querySelector('main')
    expect(mainContent).toBeInTheDocument()
    expect(mainContent).toHaveClass('text-center', 'space-y-8', 'px-8')

    // Check flex container
    const flexContainer = container.querySelector('.flex.items-center.justify-center')
    expect(flexContainer).toBeInTheDocument()
    expect(flexContainer).toHaveClass('min-h-screen')
  })

  it('includes blur effect element for title', () => {
    const { container } = render(<Home />)

    const blurElement = container.querySelector('.blur-sm.opacity-50')
    expect(blurElement).toBeInTheDocument()
    expect(blurElement).toHaveTextContent('Trilogy Care')
    expect(blurElement).toHaveClass('absolute', 'inset-0', 'bg-gradient-to-r', 'from-pink-400', 'via-purple-400', 'to-cyan-400')
  })
})