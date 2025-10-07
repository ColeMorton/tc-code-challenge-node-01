/**
 * Centralized TypeScript definitions for the Trilogy Care Bill Management System
 * All type definitions, interfaces, enums, and type aliases should be defined here
 */

import type { ErrorCode } from '@/app/lib/error-constants'

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

/**
 * User entity representing a person in the system
 */
export interface User {
  id: string
  name: string
  email: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Bill stage representing the workflow state of a bill
 */
export interface BillStage {
  id: string
  label: string
  colour: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Bill entity representing a financial document
 */
export interface Bill {
  id: string
  billReference: string
  billDate: Date
  submittedAt: Date | null
  approvedAt: Date | null
  onHoldAt: Date | null
  billStageId: string
  assignedToId: string | null
  createdAt?: Date
  updatedAt?: Date
  assignedTo?: User | null
  billStage: BillStage
}

// ============================================================================
// FORM AND VALIDATION TYPES
// ============================================================================

/**
 * Form data for creating a new bill
 */
export interface BillFormData {
  billReference: string
  billDate: string
  assignedToId?: string
}

/**
 * Server-side bill creation input
 */
export interface CreateBillData {
  billReference: string
  billDate: string
  assignedToId?: string
}

/**
 * Bill assignment input data
 */
export interface AssignBillData {
  billId: string
  userId: string
}

/**
 * Form field error representation
 */
export interface FormFieldError {
  message: string
  type?: string
}

/**
 * Form validation state
 */
export interface FormValidationState {
  billReference: FormFieldError | null
  billDate: FormFieldError | null
  assignedToId: FormFieldError | null
  isValid: boolean
}

/**
 * Async validation state for real-time validation
 */
export interface AsyncValidationState {
  billReference: {
    isValid: boolean
    isChecking: boolean
    message: string
  }
}

/**
 * Validation result with structured error handling
 */
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
}

/**
 * Simple validation result for API operations
 */
export interface SimpleValidationResult {
  isValid: boolean
  message?: string
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for the BillsDashboard component
 */
export interface BillsDashboardProps {
  bills: Bill[]
  users: User[]
}

/**
 * User with bill count for form display
 */
export interface UserWithCount extends User {
  _count: {
    bills: number
  }
}

/**
 * Props for the BillForm component
 */
export interface BillFormProps {
  users: UserWithCount[]
}

/**
 * Grouped bills by stage for dashboard display
 */
export interface GroupedBills {
  [stageLabel: string]: Bill[]
}

// ============================================================================
// API AND ACTION TYPES
// ============================================================================

/**
 * Input for creating a bill
 */
export interface CreateBillInput {
  billReference: string
  billDate: string
  assignedToId?: string
}

/**
 * Input for assigning a bill
 */
export interface AssignBillInput {
  billId: string
  userId: string
}

/**
 * Result of bill assignment operation
 */
export interface AssignBillResult {
  success: boolean
  error?: string
  errorCode?: ErrorCode
  bill?: {
    id: string
    billReference: string
    billDate: Date
    assignedToId: string | null
    billStageId: string
    assignedTo?: {
      id: string
      name: string
      email: string
    }
    billStage?: {
      id: string
      label: string
      colour: string
    }
  }
}


// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Bill assignment error codes
 * Re-exported from error-constants.ts for consistency
 */
export { BillAssignmentError } from '@/app/lib/error-constants'

/**
 * Detailed error information
 */
export interface DetailedError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

// ============================================================================
// CACHING TYPES
// ============================================================================

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

/**
 * Performance metric for monitoring
 */
export interface PerformanceMetric {
  operation: string
  duration: number
  success: boolean
  timestamp: number
  metadata?: Record<string, unknown>
  error?: string
}

/**
 * Cache performance metrics
 */
export interface CacheMetric {
  hits: number
  misses: number
  evictions: number
  memoryUsage: number
}

// ============================================================================
// TESTING TYPES
// ============================================================================

/**
 * Test scenario configuration for consistent test setup
 */
export interface TestScenario<T> {
  name: string
  setup: () => Promise<T>
  teardown: () => Promise<void>
  data: T
}

/**
 * Test bill data with expected outcomes
 */
export interface TestBillData extends CreateBillInput {
  expectedStage: string
  expectedUser?: string
  shouldSucceed: boolean
}

/**
 * Test error configuration for error testing
 */
export interface TestError {
  code: ErrorCode
  message: string
  expected: boolean
  context?: Record<string, unknown>
}

/**
 * Test user data with bill capacity information
 */
export interface TestUserData extends User {
  currentBillCount: number
  maxCapacity: number
  canAcceptMore: boolean
}

/**
 * Test database state for integration tests
 */
export interface TestDatabaseState {
  users: TestUserData[]
  bills: TestBillData[]
  billStages: BillStage[]
  expectedCounts: {
    totalBills: number
    billsByStage: Record<string, number>
    billsByUser: Record<string, number>
  }
}

/**
 * Mock user for testing
 */
export interface MockUser {
  id: string
  name: string
  email: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Mock user for API testing (with serialized dates)
 */
export interface MockApiUser {
  id: string
  name: string
  email: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Mock bill stage for testing
 */
export interface MockBillStage {
  id: string
  label: string
  colour: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Mock bill for testing
 */
export interface MockBill {
  id: string
  billReference: string
  billDate: Date | string
  submittedAt?: Date | null
  approvedAt?: Date | null
  onHoldAt?: Date | null
  billStageId: string
  assignedToId?: string | null
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Mock bill with relations for testing
 */
export interface MockBillWithRelations extends MockBill {
  assignedTo?: MockUser | null
  billStage?: MockBillStage
}

/**
 * Type aliases for Prisma mock types
 */
export type MockPrismaUser = MockUser
export type MockPrismaBill = MockBill
export type MockPrismaBillStage = MockBillStage
export type MockPrismaBillWithRelations = MockBillWithRelations

/**
 * Mock Prisma client interface for testing
 */
export interface MockPrismaClient {
  user: {
    findUnique: jest.MockedFunction<(args: Record<string, unknown>) => Promise<MockUser | null>>
    findMany: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<MockUser[]>>
  }
  bill: {
    findMany: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<MockBillWithRelations[]>>
    findUnique: jest.MockedFunction<(args: Record<string, unknown>) => Promise<MockBillWithRelations | null>>
    create: jest.MockedFunction<(args: Record<string, unknown>) => Promise<MockBillWithRelations>>
    update: jest.MockedFunction<(args: Record<string, unknown>) => Promise<MockBillWithRelations>>
    updateMany: jest.MockedFunction<(args: Record<string, unknown>) => Promise<{ count: number }>>
    count: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<number>>
  }
  billStage: {
    findFirst: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<MockBillStage | null>>
    findMany: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<MockBillStage[]>>
  }
  $transaction: jest.MockedFunction<(callback: (tx: MockPrismaClient) => Promise<unknown>) => Promise<unknown>>
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make specific fields optional in a type
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific fields required in a type
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Extract the data type from a Result type
 */
export type ExtractData<T> = T extends { success: true; data: infer D } ? D : never

/**
 * Extract the error type from a Result type
 */
export type ExtractError<T> = T extends { success: false; error: infer E } ? E : never

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Bill card props for UI components
 */
export interface BillCardProps {
  bill: Bill
  onAssign?: (billId: string, userId: string) => void
  isAssigning?: boolean
  canAssign?: boolean
}

/**
 * Create bill request for API
 */
export interface CreateBillRequest {
  billReference: string
  billDate: string
  assignedToId?: string
}

/**
 * Form validation interface
 */
export interface FormValidation {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}
