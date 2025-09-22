// eslint-disable-next-line @typescript-eslint/no-require-imports
const { jest } = require('@jest/globals')

// Mock Next.js navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockPrefetch = jest.fn()
const mockBack = jest.fn()
const mockForward = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams())
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react').createElement('a', { href, ...props }, children)
  }
})

// Mock Next.js fonts
jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans'
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono'
  })
}))

// Reset mocks before each test
beforeEach(() => {
  mockPush.mockClear()
  mockReplace.mockClear()
  mockPrefetch.mockClear()
  mockBack.mockClear()
  mockForward.mockClear()
  mockRefresh.mockClear()
})

module.exports = {
  mockPush,
  mockReplace,
  mockPrefetch,
  mockBack,
  mockForward,
  mockRefresh
}