# Advanced Guides

[← Back to Documentation](../README.md) | [Testing Guide](testing-guide.md) | [Data Operations Guide](data-operations.md)

This document provides advanced development guides, best practices, and troubleshooting information for the Bill Management System. For testing documentation, see [Testing Guide](testing-guide.md). For database architecture, see [Database Architecture](../architecture/database.md).

## Testing Strategy

**Note**: Comprehensive testing documentation has been moved to [Testing Guide](testing-guide.md). This section provides a high-level overview.

The project implements a **multi-layer testing approach** designed to provide comprehensive coverage while maintaining fast feedback loops for developers.

### Testing Pyramid

```
        🔺 E2E Tests (Playwright)
       🔺🔺 Integration Tests (Real DB)
    🔺🔺🔺🔺 Unit Tests (Mocked)
```

**1. Unit Tests (Base Layer)**
- **Multiple test suites** with mocked dependencies
- **Fast execution** (< 10 seconds)
- **Isolated testing** of API logic and React components
- **Mock-based** Prisma client for consistent behavior
- **Frontend component testing** with React Testing Library

**2. Integration Tests (Middle Layer)**
- **Comprehensive test cases** with real database
- **Database persistence validation**
- **Business rule enforcement**
- **Isolated test database** for safety
- **Server action testing** with real database operations

**3. E2E Tests (Top Layer)**
- **Browser-based testing** with Playwright
- **Critical user journeys** validation
- **Cross-browser compatibility** testing
- **Visual regression** capabilities

### Test Configuration

#### Jest Configuration (Unit + Integration)

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

#### Playwright Configuration (E2E)

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

### Running Tests

#### Development Workflow

```bash
# Watch mode for active development
npm run test:watch

# Specific test patterns
npm run test:watch -- bills     # Tests containing "bills"
npm run test:watch -- --testNamePattern="should create"

# Debug specific test
npm run test:watch -- --testNamePattern="should assign bill" --verbose
```

#### CI/CD Workflow

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

#### E2E Testing Commands

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

### Writing Effective Tests

#### Unit Test Best Practices

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

#### Integration Test Best Practices

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

#### E2E Test Best Practices

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

## Performance Optimization

### Database Performance

#### Query Optimization

```typescript
// ❌ Bad: N+1 query problem
const bills = await prisma.bill.findMany()
for (const bill of bills) {
  const user = await prisma.user.findUnique({ where: { id: bill.assignedToId } })
}

// ✅ Good: Single query with includes
const bills = await prisma.bill.findMany({
  include: {
    assignedTo: {
      select: { id: true, name: true, email: true }
    },
    billStage: true
  }
})
```

#### Indexing Strategy

```prisma
// schema.prisma - Optimize for common queries
model Bill {
  id            String   @id @default(cuid())
  billReference String   @unique                    // Index for uniqueness
  assignedToId  String?                            // Index for user queries
  billStageId   String                             // Index for stage filtering
  createdAt     DateTime @default(now())           // Index for ordering

  @@index([assignedToId])                          // User bills query
  @@index([billStageId])                           // Stage filtering
  @@index([createdAt])                             // Chronological ordering
  @@map("bills")
}
```

#### Connection Management

```typescript
// lib/prisma.ts - Singleton pattern prevents connection leaks
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Frontend Performance

#### Component Optimization

```typescript
// ✅ Memoize expensive calculations
const groupBillsByStage = useMemo(() => {
  return bills.reduce((acc, bill) => {
    const stage = bill.billStage.label
    if (!acc[stage]) acc[stage] = []
    acc[stage].push(bill)
    return acc
  }, {} as GroupedBills)
}, [bills])

// ✅ Optimize re-renders
const BillCard = React.memo<{ bill: Bill }>(({ bill }) => {
  return (
    <div className="bill-card">
      {/* Bill content */}
    </div>
  )
})
```

#### Loading States

```typescript
// ✅ Proper loading and error states
const BillsList = () => {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Skeleton loading for better UX
  if (loading) {
    return <BillsSkeleton />
  }

  // Error boundary for graceful degradation
  if (error) {
    return <ErrorFallback error={error} onRetry={refetch} />
  }

  return <BillsGrid bills={bills} />
}
```

### Build Optimization

#### Next.js Configuration

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

## Security Best Practices

### Input Validation

```typescript
// ✅ Server-side validation
export async function POST(request: Request) {
  const body = await request.json()

  // Validate required fields
  if (!body.billReference || typeof body.billReference !== 'string') {
    return NextResponse.json(
      { error: 'Invalid bill reference' },
      { status: 400 }
    )
  }

  // Sanitize input
  const billReference = body.billReference.trim()
  if (billReference.length === 0 || billReference.length > 100) {
    return NextResponse.json(
      { error: 'Bill reference must be 1-100 characters' },
      { status: 400 }
    )
  }

  // Continue with validated data...
}
```

### Database Security

```typescript
// ✅ Parameterized queries (Prisma ORM handles this)
const bill = await prisma.bill.findUnique({
  where: { billReference }  // Safe from SQL injection
})

// ✅ Business logic validation
const userBillCount = await prisma.bill.count({
  where: { assignedToId: userId }
})

if (userBillCount >= 3) {
  throw new Error('User has maximum bills assigned')
}
```

### Error Handling Security

```typescript
// ✅ Don't expose internal errors
try {
  // Database operation
} catch (error) {
  console.error('Internal error:', error)  // Log internally

  return NextResponse.json(
    { error: 'Operation failed' },         // Generic public message
    { status: 500 }
  )
}
```

## Code Quality Standards

### TypeScript Best Practices

```typescript
// ✅ Strict typing
interface CreateBillRequest {
  billReference: string
  billDate: string
  assignedToId?: string
}

// ✅ Type guards
function isBillRequest(body: unknown): body is CreateBillRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    'billReference' in body &&
    'billDate' in body
  )
}

// ✅ Generic utility types
type ApiResponse<T> = {
  data?: T
  error?: string
  success: boolean
}
```

### Error Handling Patterns

```typescript
// ✅ Result pattern for error handling
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

const createBill = async (data: CreateBillRequest): Promise<Result<Bill>> => {
  try {
    const bill = await prisma.bill.create({ data })
    return { success: true, data: bill }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}
```

### Component Design Patterns

```typescript
// ✅ Composition over inheritance
interface BillCardProps {
  bill: Bill
  actions?: React.ReactNode
  onClick?: (bill: Bill) => void
}

const BillCard: React.FC<BillCardProps> = ({ bill, actions, onClick }) => {
  return (
    <div className="bill-card" onClick={() => onClick?.(bill)}>
      <BillInfo bill={bill} />
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}

// Usage with composition
<BillCard
  bill={bill}
  actions={
    <BillActions
      onAssign={handleAssign}
      onEdit={handleEdit}
    />
  }
/>
```

## Troubleshooting Guide

### Common Development Issues

#### Database Problems

**Symptom**: `PrismaClientInitializationError`
```bash
# Solution: Regenerate client
npx prisma generate
npx prisma db push
```

**Symptom**: "Table doesn't exist"
```bash
# Solution: Reset database
npx prisma migrate reset
npm run db:seed
```

**Symptom**: "Connection pool timeout"
```bash
# Solution: Check for connection leaks
# Ensure prisma.$disconnect() in cleanup
# Use singleton pattern for client
```

#### Build Issues

**Symptom**: TypeScript errors in build
```bash
# Check types without building
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Symptom**: "Module not found" errors
```bash
# Check path aliases in tsconfig.json
# Verify imports use correct paths
# Check file extensions (.ts, .tsx)
```

#### Test Failures

**Symptom**: Tests fail randomly
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests serially
npm test -- --runInBand

# Check for async issues
# Ensure proper cleanup in beforeEach/afterEach
```

**Symptom**: E2E tests timing out
```bash
# Increase timeout
npx playwright test --timeout=60000

# Check if dev server is running
npm run dev

# Debug with headed browser
npm run test:e2e:headed
```

### Performance Issues

#### Slow Database Queries

```typescript
// Debug with query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})

// Analyze query performance
console.time('bills-query')
const bills = await prisma.bill.findMany({ include: { assignedTo: true } })
console.timeEnd('bills-query')
```

#### Memory Leaks

```bash
# Monitor memory usage
node --inspect npm run dev
# Open chrome://inspect in browser

# Check for unclosed connections
# Verify event listener cleanup
# Use React DevTools Profiler
```

### Debugging Techniques

#### API Debugging

```typescript
// Add request logging middleware
export async function middleware(request: NextRequest) {
  console.log(`${request.method} ${request.url}`)
  console.log('Headers:', Object.fromEntries(request.headers))

  if (request.method === 'POST') {
    const body = await request.clone().json()
    console.log('Body:', body)
  }
}
```

#### Frontend Debugging

```typescript
// React DevTools integration
const BillsPage = () => {
  const [bills, setBills] = useState<Bill[]>([])

  // Debug state changes
  useEffect(() => {
    console.log('Bills updated:', bills.length)
  }, [bills])

  // Performance profiling
  return (
    <React.Profiler
      id="BillsPage"
      onRender={(id, phase, actualDuration) => {
        console.log(`${id} ${phase}: ${actualDuration}ms`)
      }}
    >
      <BillsList bills={bills} />
    </React.Profiler>
  )
}
```

### Production Monitoring

#### Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed'
      },
      { status: 503 }
    )
  }
}
```

#### Error Tracking

```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send to monitoring service
    console.error('React Error:', error, errorInfo)

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // trackError(error, errorInfo)
    }
  }
}
```

This comprehensive guide covers the essential advanced topics for maintaining and extending the Trilogy Care Bill Management System effectively.