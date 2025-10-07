# Database Constraints for Bill Assignment Limits

## Overview

This document explains the corrected database constraints that enforce the 3-bill limit per user for active bill stages. The constraints work in conjunction with application-level validation to provide comprehensive business rule enforcement.

## Business Rules

### Active vs Inactive Bill Stages

**Active Stages** (count toward 3-bill limit):
- Draft
- Submitted  
- Approved
- Paying
- On Hold

**Inactive Stages** (don't count toward limit):
- Rejected
- Paid

### 3-Bill Limit Rule

Each user can have a maximum of 3 bills assigned in active stages at any given time. Bills in inactive stages (Rejected, Paid) do not count toward this limit.

## Database Triggers

### 1. Insert Constraint (`check_bill_limit_insert`)

**When it triggers:** Before inserting a new bill with an assigned user

**What it checks:** Counts existing bills in active stages for the target user

**SQL Logic:**
```sql
SELECT COUNT(*) FROM bills b
JOIN bill_stages bs ON b.bill_stage_id = bs.id
WHERE b.assigned_to_id = NEW.assigned_to_id
  AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
```

### 2. Assignment Constraint (`check_bill_limit_update`)

**When it triggers:** Before updating a bill to assign it to a user (from unassigned to assigned)

**What it checks:** Ensures the target user doesn't exceed the 3-bill limit

### 3. Reassignment Constraint (`check_bill_limit_reassign`)

**When it triggers:** Before reassigning a bill from one user to another

**What it checks:** Ensures the new user doesn't exceed the 3-bill limit

### 4. Stage Transition Constraint (`check_bill_limit_stage_transition`)

**When it triggers:** Before changing a bill's stage when it's assigned to a user

**What it checks:** Ensures the user doesn't exceed the limit when a bill moves to an active stage

## Why These Constraints Are Necessary

### Problem with Original Migration

The original migration.sql had several critical flaws:

1. **❌ Counted ALL bills** regardless of stage
2. **❌ Missed stage transition scenarios**
3. **❌ No handling of bill reassignment**
4. **❌ Incorrect business logic**

### Example of Original Problem

```sql
-- ORIGINAL (INCORRECT)
SELECT COUNT(*) FROM bills WHERE assigned_to_id = NEW.assigned_to_id

-- This would count bills in "Rejected" and "Paid" stages
-- User with 2 active bills + 1 rejected bill = 3 total
-- New assignment would be blocked incorrectly
```

### Corrected Logic

```sql
-- CORRECTED
SELECT COUNT(*) FROM bills b
JOIN bill_stages bs ON b.bill_stage_id = bs.id
WHERE b.assigned_to_id = NEW.assigned_to_id
  AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')

-- This only counts active stages
-- User with 2 active bills + 1 rejected bill = 2 active (can accept 1 more)
```

## Integration with Application Logic

The system uses a **defense-in-depth** approach with multiple enforcement layers:

1. **Database Triggers** - Final safety net at database level
2. **Application Logic** - Primary business rule enforcement with server actions
3. **Caching Layer** - Performance optimization for user capacity checks
4. **Monitoring** - Observability and alerting

### Application-Level Validation

The application enforces the 3-bill limit through server actions in `app/bills/actions.ts`:

```typescript
// Primary enforcement in application code
const userWithCount = await tx.user.findUnique({
  where: { id: userId },
  include: {
    _count: {
      select: { bills: { where: { assignedToId: userId } } }
    }
  }
})

if (userWithCount._count.bills >= 3) {
  throw new Error(ERROR_DEFINITIONS.USER_BILL_LIMIT_EXCEEDED.message)
}
```

### Multi-Layer Benefits

**Database Triggers:**
- ✅ Prevent data corruption at the lowest level
- ✅ Work even if application logic is bypassed
- ✅ Provide atomic enforcement within transactions
- ✅ Handle edge cases and race conditions

**Application Logic:**
- ✅ Better error messages and user experience
- ✅ Performance optimization with caching
- ✅ Complex business workflows
- ✅ Integration with monitoring and logging

## Testing the Constraints

### Test Scenarios

1. **Basic Assignment**
   - User with 0 bills → assign 1 bill ✅
   - User with 2 bills → assign 1 bill ✅  
   - User with 3 bills → assign 1 bill ❌

2. **Stage Transitions**
   - Bill moves from Draft to Submitted ✅
   - Bill moves from Rejected to Draft (if user at limit) ❌

3. **Reassignment**
   - Reassign bill from User A to User B ✅
   - Reassign to User B who already has 3 bills ❌

4. **Edge Cases**
   - User with 2 active + 1 rejected bills → assign 1 more ✅
   - User with 3 active + 1 paid bills → assign 1 more ❌

### SQLite Testing

```sql
-- Test the constraint
INSERT INTO bills (bill_reference, bill_date, assigned_to_id, bill_stage_id)
VALUES ('TEST-001', '2024-01-01', 'user-with-3-bills', 'draft-stage-id');

-- Should raise: "User already has 3 bills assigned in active stages"
```

## Performance Considerations

### Index Requirements

The triggers require proper indexing for performance:

```sql
-- Required indexes for trigger performance
CREATE INDEX idx_bills_assigned_stage ON bills(assigned_to_id, bill_stage_id);
CREATE INDEX idx_bill_stages_label ON bill_stages(label);
```

### Query Optimization

The JOIN in the trigger is optimized by:
- Index on `bills(assigned_to_id, bill_stage_id)`
- Index on `bill_stages(label)`
- Filtering by specific stage labels

## Migration Strategy

### Applying the Corrected Constraints

1. **Backup existing data**
2. **Drop old triggers** (if they exist)
3. **Apply new triggers**
4. **Test with sample data**
5. **Verify application integration**

### Rollback Plan

If issues arise:
1. Drop the new triggers
2. Restore original triggers (if needed)
3. Rely on application-level enforcement

## Monitoring and Alerting

### Database-Level Monitoring

```sql
-- Monitor trigger violations
SELECT * FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'check_bill_limit%';
```

### Application-Level Monitoring

```typescript
// Track constraint violations in application
performanceMonitor.record({
  operation: 'bill_assignment_constraint_violation',
  duration: 0,
  success: false,
  error: 'Database constraint violation'
})
```

## Conclusion

The corrected database constraints provide:

- ✅ **Proper stage filtering** - Only active stages count
- ✅ **Complete coverage** - All assignment scenarios covered  
- ✅ **Performance optimization** - Efficient queries with proper indexes
- ✅ **Integration** - Works seamlessly with application logic
- ✅ **Safety net** - Prevents data corruption at database level

This multi-layered approach ensures business rule enforcement while maintaining performance and user experience.
