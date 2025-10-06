export interface MockUser {
  id: string
  name: string
  email: string
  createdAt?: Date
  updatedAt?: Date
}

export interface MockBillStage {
  id: string
  label: string
  colour: string
  createdAt?: Date
  updatedAt?: Date
}

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

export interface MockBillWithRelations extends MockBill {
  assignedTo?: MockUser | null
  billStage?: MockBillStage
}

export type MockPrismaUser = MockUser
export type MockPrismaBill = MockBill
export type MockPrismaBillStage = MockBillStage
export type MockPrismaBillWithRelations = MockBillWithRelations

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