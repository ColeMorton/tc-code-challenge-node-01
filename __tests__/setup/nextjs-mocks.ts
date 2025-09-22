import { jest } from '@jest/globals'
import { createElement } from 'react'

// Mock Next.js navigation
export const mockPush = jest.fn()
export const mockReplace = jest.fn()
export const mockPrefetch = jest.fn()
export const mockBack = jest.fn()
export const mockForward = jest.fn()
export const mockRefresh = jest.fn()

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
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
    return createElement('a', { href, ...props }, children)
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