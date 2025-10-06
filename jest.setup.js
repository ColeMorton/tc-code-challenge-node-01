// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@testing-library/jest-dom')
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jest-extended')

// Polyfill TextEncoder/TextDecoder for Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js cache module to prevent server-side imports in tests
// This is needed when client components import Server Actions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn(),
  unstable_noStore: jest.fn()
}))


// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({}))
}))