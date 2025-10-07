/**
 * Standardized mock helpers for consistent test typing
 */

import type { MockPrismaClient } from '@/app/lib/types'

/**
 * Create a properly typed mock Prisma client
 */
export function createMockPrismaClient(): MockPrismaClient {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    bill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    billStage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}

/**
 * Mock Prisma client with common test data
 */
export function createMockPrismaWithData() {
  const mockPrisma = createMockPrismaClient()
  
  // Set up common mock implementations
  mockPrisma.billStage.findFirst.mockResolvedValue({
    id: 'draft-stage',
    label: 'Draft',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  mockPrisma.billStage.findMany.mockResolvedValue([
    {
      id: 'draft-stage',
      label: 'Draft',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'submitted-stage',
      label: 'Submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  
  return mockPrisma
}

/**
 * Type-safe mock function creator
 */
export function createTypedMock<T extends (...args: unknown[]) => unknown>(): jest.MockedFunction<T> {
  return jest.fn() as unknown as jest.MockedFunction<T>
}
