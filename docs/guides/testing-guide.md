# Testing Guide

[← Back to Documentation](../README.md) | [Data Operations](data-operations.md) | [Getting Started](../getting-started/README.md)

This guide provides comprehensive testing strategies, configurations, and best practices for the Bill Management System.

## Overview

The project implements a **multi-layer testing approach** designed to provide comprehensive coverage while maintaining fast feedback loops for developers.

## Testing Pyramid

```
        🔺 E2E Tests (Playwright)
       🔺🔺 Integration Tests (Real DB)
    🔺🔺🔺🔺 Unit Tests (Mocked)
```

### 1. Unit Tests (Base Layer)
- **Multiple test suites** with mocked dependencies
- **Fast execution** (< 10 seconds)
- **Isolated testing** of API logic and React components
- **Mock-based** Prisma client for consistent behavior
- **Frontend component testing** with React Testing Library

### 2. Integration Tests (Middle Layer)
- **Comprehensive test cases** with real database
- **Database persistence validation**
- **Business rule enforcement**
- **Isolated test database** for safety
- **Server action testing** with real database operations

### 3. E2E Tests (Top Layer)
- **Browser-based testing** with Playwright
- **Critical user journeys** validation
- **Cross-browser compatibility** testing
- **Visual regression** capabilities

## Test Configuration

### Jest Configuration (Unit + Integration)

```javascript
// jest.config.js - Multi-project setup
module.exports = {
  projects: [
    './jest.frontend.config.js',
    './jest.api.config.js'
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'clover', 'html']
}
```

### Playwright Configuration (E2E)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './__tests__/e2e',
  testIgnore: './__tests__/e2e/archived/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Additional browsers only for CI or explicit testing
    ...(process.env.CI || process.env.CROSS_BROWSER ? [
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } }
    ] : [])
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  globalSetup: require.resolve('./__tests__/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./__tests__/e2e/global-teardown.ts')
})
```

## Running Tests

### Development Workflow

```bash
# Watch mode for active development
npm run test:watch

# Specific test patterns
npm run test:watch -- bills     # Tests containing "bills"
npm run test:watch -- --testNamePattern="should create"

# Debug specific test
npm run test:watch -- --testNamePattern="should assign bill" --verbose
```

### CI/CD Workflow

```bash
# Complete test suite
npm run test:all

# Layer-specific testing
npm run test:unit           # Fast feedback
npm run test:integration    # Database validation
npm run test:e2e           # User journey validation

# Coverage reporting
npm run test:coverage
```

### E2E Testing Commands

```bash
# Install browsers (first time)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Debug mode with UI
npm run test:e2e:ui

# Cross-browser testing
npm run test:e2e:cross-browser

# Smoke tests only
npm run test:e2e:smoke
```

## Writing Effective Tests

### Unit Test Best Practices

```typescript
// Good: Isolated, focused, predictable
describe('Bill Creation API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create bill with unique reference', async () => {
    // Arrange
    const mockBill = { id: '1', billReference: 'BILL-001' }
    mockPrisma.bill.findUnique.mockResolvedValue(null)      // No existing
    mockPrisma.bill.create.mockResolvedValue(mockBill)

    // Act
    const response = await POST(mockRequest)

    // Assert
    expect(response.status).toBe(201)
    expect(mockPrisma.bill.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        billReference: 'BILL-001'
      })
    })
  })
})
```

### Integration Test Best Practices

```typescript
// Good: Real database, business logic validation
describe('Bill Assignment Integration', () => {
  beforeEach(async () => {
    await resetDatabase()  // Fresh state
  })

  it('should enforce 3-bill limit per user', async () => {
    // Arrange: Create user with 3 bills
    const user = await createTestUser()
    await createTestBills(3, { assignedToId: user.id })

    // Act: Try to assign 4th bill
    const response = await request(app)
      .post('/api/bills/assign')
      .send({ userId: user.id })

    // Assert: Should be rejected
    expect(response.status).toBe(409)
    expect(response.body.error).toContain('maximum of 3 bills')
  })
})
```

### E2E Test Best Practices

```typescript
// Good: User-focused, realistic scenarios
test('user can create and assign bill', async ({ page }) => {
  // Navigate to new bill form
  await page.goto('/bills/new')

  // Fill form with validation
  await page.fill('[data-testid="bill-reference"]', 'BILL-E2E-001')
  await page.fill('[data-testid="bill-date"]', '2024-01-15')

  // Submit and verify creation
  await page.click('[data-testid="submit-button"]')
  await expect(page).toHaveURL('/bills')

  // Verify bill appears in dashboard
  await expect(page.locator('[data-testid="bill-card-BILL-E2E-001"]')).toBeVisible()
})
```

## Test Data Management

### Test Database Setup

```typescript
// __tests__/integration/testUtils.ts
export async function resetDatabase() {
  await prisma.bill.deleteMany()
  await prisma.user.deleteMany()
  await prisma.billStage.deleteMany()
  
  // Re-seed required data
  await seedBillStages()
}

export async function createTestUser(data = {}) {
  return await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      ...data
    }
  })
}

export async function createTestBill(data = {}) {
  const stage = await prisma.billStage.findFirst({ where: { label: 'Draft' } })
  
  return await prisma.bill.create({
    data: {
      billReference: `TEST-${Date.now()}`,
      billDate: new Date(),
      billStageId: stage.id,
      ...data
    }
  })
}
```

### Mock Data Patterns

```typescript
// __tests__/types/mocks.ts
export const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
}

export const mockBill = {
  id: 'bill-1',
  billReference: 'BILL-001',
  billDate: new Date(),
  billStageId: 'stage-1',
  assignedToId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date()
}

export const mockBillStage = {
  id: 'stage-1',
  label: 'Draft',
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## Component Testing

### React Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BillsPage from '@/app/bills/page'

// Mock fetch
global.fetch = jest.fn()

describe('BillsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display bills after loading', async () => {
    const mockBills = [
      {
        id: '1',
        billReference: 'BILL-0001',
        billDate: '2024-01-01',
        assignedTo: { name: 'John Doe' },
        billStage: { label: 'Draft' }
      }
    ]

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBills
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []  // users
      })

    render(<BillsPage />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading bills...')).not.toBeInTheDocument()
    })

    // Check bill is displayed
    expect(screen.getByText('BILL-0001')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

### Server Action Testing

```typescript
import { createBill, assignBillAction } from '@/app/bills/actions'

describe('Server Actions', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should create bill successfully', async () => {
    const billData = {
      billReference: 'TEST-001',
      billDate: '2024-01-15',
      assignedToId: undefined
    }

    const result = await createBill(billData)

    expect(result).toBeDefined()
    expect(result.billReference).toBe('TEST-001')
    expect(result.billStage.label).toBe('Draft')
  })

  it('should enforce 3-bill limit', async () => {
    const user = await createTestUser()
    await createTestBills(3, { assignedToId: user.id })

    const result = await assignBillAction({
      userId: user.id,
      billId: 'additional-bill-id'
    })

    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('USER_BILL_LIMIT_EXCEEDED')
  })
})
```

## Database Constraint Testing

### Testing Business Rules

```typescript
describe('Database Constraints', () => {
  it('should enforce 3-bill limit at database level', async () => {
    const user = await createTestUser()
    
    // Create 3 bills for user
    await createTestBills(3, { assignedToId: user.id })
    
    // Attempt to create 4th bill directly in database
    await expect(
      prisma.bill.create({
        data: {
          billReference: 'TEST-004',
          billDate: new Date(),
          billStageId: (await prisma.billStage.findFirst()).id,
          assignedToId: user.id
        }
      })
    ).rejects.toThrow('User already has 3 bills assigned in active stages')
  })
})
```

## Performance Testing

### Load Testing

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent bill assignments', async () => {
    const users = await Promise.all(
      Array(10).fill(0).map(() => createTestUser())
    )
    
    const bills = await Promise.all(
      Array(30).fill(0).map(() => createTestBill())
    )

    // Attempt concurrent assignments
    const assignments = users.map((user, index) => 
      assignBillAction({
        userId: user.id,
        billId: bills[index].id
      })
    )

    const results = await Promise.allSettled(assignments)
    
    // Should succeed for first 3 users, fail for others
    const successful = results.filter(r => r.status === 'fulfilled').length
    expect(successful).toBe(3) // Each user can have 1 bill
  })
})
```

## Test Maintenance

### Test Organization

```
__tests__/
├── api/                    # Unit tests (mocked)
│   ├── bills.test.ts
│   ├── users.test.ts
│   └── validation-consistency.test.ts
├── integration/           # Integration tests (real DB)
│   ├── api/
│   ├── globalSetup.ts
│   └── testUtils.ts
├── unit/                  # Frontend component tests
│   ├── bills/
│   ├── lib/
│   └── pages/
├── e2e/                   # End-to-end tests
│   ├── critical-flows.e2e.spec.ts
│   ├── smoke.e2e.spec.ts
│   └── users.e2e.spec.ts
└── utils/                 # Test utilities
    └── mock-helpers.ts
```

### Test Data Cleanup

```typescript
// Global setup and teardown
beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await cleanupTestDatabase()
})

beforeEach(async () => {
  await resetTestData()
})
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: npm run db:setup
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Install Playwright browsers
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

## Debugging Tests

### Common Issues and Solutions

#### Tests Failing Randomly
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests serially
npm test -- --runInBand

# Check for async issues
# Ensure proper cleanup in beforeEach/afterEach
```

#### E2E Tests Timing Out
```bash
# Increase timeout
npx playwright test --timeout=60000

# Check if dev server is running
npm run dev

# Debug with headed browser
npm run test:e2e:headed
```

#### Database Connection Issues
```bash
# Reset test database
npx prisma migrate reset --force

# Check database URL
echo $DATABASE_URL

# Verify Prisma client
npx prisma generate
```

## Best Practices Summary

1. **Write Tests First**: TDD approach for new features
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Use Descriptive Names**: Test names should explain the scenario
4. **Keep Tests Independent**: Each test should be able to run in isolation
5. **Mock External Dependencies**: Use mocks for external services
6. **Test Edge Cases**: Include boundary conditions and error scenarios
7. **Maintain Test Data**: Keep test data realistic and minimal
8. **Monitor Test Performance**: Keep test suite fast and reliable

## Related Documentation

- [Data Operations Guide](data-operations.md) - Testing data operations
- [Database Architecture](../architecture/database.md) - Testing database constraints
- [Getting Started Guide](../getting-started/README.md) - Quick setup for testing
- [Server Actions Reference](../reference/server-actions.md) - Testing Server Actions
