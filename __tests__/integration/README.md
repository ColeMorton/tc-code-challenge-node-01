# Integration Tests for Bill Management System

This directory contains comprehensive integration tests that replace the obsolete API route tests with database operation tests. These tests ensure that all database operations, business rules, and data integrity constraints are properly validated.

## Test Structure

### API Tests (`api/`)
- **`bills-database-operations.integration.test.ts`** - Core database operations testing
- **`validation-consistency.integration.test.ts`** - Frontend-backend validation consistency
- **`performance-scalability.integration.test.ts`** - Performance and scalability testing

### Workflow Tests (`workflows/`)
- **`bill-lifecycle-workflow.integration.test.ts`** - Complete bill lifecycle workflows

### Constraint Tests (`constraints/`)
- **`database-constraints.integration.test.ts`** - Database constraints and integrity testing

## Test Coverage

### Database Operations
- ✅ Bill creation with various scenarios
- ✅ Bill reference validation and uniqueness
- ✅ Bill assignment operations
- ✅ User assignment limits (max 3 bills per user)
- ✅ Stage-based assignment restrictions
- ✅ Race condition handling
- ✅ Transaction rollback scenarios

### Business Rules
- ✅ Maximum 3 bills per user constraint
- ✅ Only Draft/Submitted bills can be assigned
- ✅ Bill reference uniqueness enforcement
- ✅ Stage transition rules
- ✅ Timestamp consistency across stages

### Data Integrity
- ✅ Foreign key constraints (User-Bill, BillStage-Bill)
- ✅ Unique constraints (email, bill reference, stage label)
- ✅ Cascade operations (update/delete)
- ✅ Referential integrity maintenance
- ✅ Database transaction atomicity

### Performance & Scalability
- ✅ Batch operations (100+ bills)
- ✅ Concurrent operations (50+ simultaneous)
- ✅ Index performance validation
- ✅ Memory usage with large datasets
- ✅ Pagination efficiency
- ✅ Complex query performance

### Validation Consistency
- ✅ Frontend-backend validation alignment
- ✅ Error message consistency
- ✅ Parameter validation rules
- ✅ Business rule enforcement across layers

## Key Test Scenarios

### Critical Business Logic
1. **User Assignment Limits**: Tests that users cannot be assigned more than 3 bills
2. **Stage Restrictions**: Validates that only Draft/Submitted bills can be assigned
3. **Reference Uniqueness**: Ensures bill references are unique across the system
4. **Race Conditions**: Handles concurrent assignment attempts gracefully

### Data Consistency
1. **Cascade Operations**: User deletion sets bill assignments to null
2. **Transaction Integrity**: Failed operations don't leave partial state
3. **Constraint Enforcement**: Database-level constraint validation
4. **Index Performance**: Query optimization verification

### Error Handling
1. **Validation Errors**: Consistent error messages across layers
2. **Database Errors**: Proper handling of constraint violations
3. **Concurrent Access**: Race condition detection and retry logic
4. **Edge Cases**: Special characters, long strings, timezone handling

## Running the Tests

### Individual Test Files
```bash
# Run specific test file
npm run test:integration -- bills-database-operations.integration.test.ts

# Run all API tests
npm run test:integration -- __tests__/integration/api/

# Run workflow tests
npm run test:integration -- __tests__/integration/workflows/

# Run constraint tests
npm run test:integration -- __tests__/integration/constraints/
```

### All Integration Tests
```bash
# Run all integration tests
npm run test:integration
```

## Test Data Management

### Test Database
- Uses separate SQLite test database (`test.db`)
- Automatically reset between test suites
- Pre-seeded with required test data (users, stages)

### Test Utilities
- `resetDatabase()` - Clears test data between tests
- `seedRequiredData()` - Creates test users and bill stages
- `createTestBill()` - Helper for creating test bills
- `getTestData()` - Retrieves test users and stages

### Test Isolation
- Each test runs in isolation
- Database state is reset between tests
- No shared state between test suites
- Parallel test execution support

## Performance Benchmarks

### Expected Performance Targets
- **Bill Creation**: 100 bills in < 5 seconds
- **Assignment Operations**: 50 concurrent assignments in < 10 seconds
- **Index Queries**: Single queries complete in < 100ms
- **Complex Queries**: Aggregations complete in < 1 second
- **Memory Usage**: 200+ bills with relationships in < 2 seconds

### Scalability Tests
- **Concurrent Users**: 10+ simultaneous operations
- **Batch Operations**: 100+ bills in single operation
- **Large Datasets**: 200+ bills with full relationships
- **Stress Testing**: Rapid operations over 5-second periods

## Monitoring and Debugging

### Test Output
- Detailed error messages for failures
- Performance timing for operations
- Database state verification
- Constraint violation reporting

### Debugging Tips
1. Check test database state after failures
2. Verify test data isolation
3. Review performance timing logs
4. Validate constraint enforcement
5. Check concurrent operation results

## Migration from API Tests

These integration tests replace the following obsolete API route tests:
- ❌ `__tests__/api/bills-assign.test.ts` (deleted)
- ❌ `__tests__/api/bills.test.ts` (deleted)
- ❌ `__tests__/integration/api/bill-assignment-race-condition.integration.test.ts` (deleted)
- ❌ `__tests__/integration/api/bills-simple.integration.test.ts` (deleted)
- ❌ `__tests__/integration/api/users.integration.test.ts` (deleted)
- ❌ `__tests__/integration/workflows/bill-lifecycle.integration.test.ts` (deleted)

### Why Integration Tests vs API Tests
1. **Direct Database Testing**: Tests actual database operations without HTTP layer
2. **Server Actions**: Tests the new server action functions directly
3. **Better Performance**: Faster execution without HTTP overhead
4. **More Reliable**: No network or HTTP-related flakiness
5. **Comprehensive Coverage**: Tests all database operations and constraints

## Best Practices

### Writing New Tests
1. Use existing test utilities (`createTestBill`, `getTestData`)
2. Reset database state between tests
3. Test both success and failure scenarios
4. Include performance assertions for critical paths
5. Verify database constraints and relationships

### Test Maintenance
1. Keep test data minimal and focused
2. Use descriptive test names and scenarios
3. Include clear assertions with meaningful error messages
4. Update tests when business rules change
5. Monitor test performance and optimize as needed

## Dependencies

### Required Packages
- `@prisma/client` - Database client
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest

### Test Configuration
- Uses `jest.integration.config.js` for integration test setup
- Separate test database configuration
- Global setup/teardown for database management
- Extended timeout for database operations
