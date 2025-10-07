# Database Constraint Architecture Diagram

## Multi-Layer Defense Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                              │
│  • Form validation (client-side)                                            │
│  • Real-time feedback                                                       │
│  • User-friendly error messages                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION BUSINESS LAYER                          │
│  • Server Actions (createBill, assignBillAction)                         │
│  • Business rule validation                                               │
│  • Performance optimization (caching)                                     │
│  • Complex workflows (stage transitions)                                  │
│  • Monitoring and alerting                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                   │
│  • Atomic constraint enforcement (triggers)                              │
│  • Final safety net                                                       │
│  • Race condition prevention                                              │
│  • Data integrity guarantee                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Constraint Flow Diagram

```
                    BILL ASSIGNMENT REQUEST
                              │
                              ▼
                    ┌─────────────────────┐
                    │   CLIENT VALIDATION  │
                    │  • Form validation  │
                    │  • Real-time checks  │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ APPLICATION LAYER   │
                    │ • Business logic    │
                    │ • Cache check      │
                    │ • User capacity     │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  DATABASE TRIGGER   │
                    │ • Atomic check      │
                    │ • Stage filtering   │
                    │ • Final enforcement │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   SUCCESS/FAILURE   │
                    │ • Assignment made   │
                    │ • Error returned    │
                    └─────────────────────┘
```

## Business Rule Logic

```
                    BILL STAGE CLASSIFICATION
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ACTIVE STAGES         INACTIVE STAGES
            (Count toward limit)  (Don't count)
                    │                   │
            ┌───────┴───────┐          │
            │               │          │
            ▼               ▼          ▼
        • Draft         • Approved   • Rejected
        • Submitted     • Paying     • Paid
                       • On Hold
```

## Constraint Enforcement Points

```
                    DATABASE TRIGGERS
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            INSERT TRIGGER         UPDATE TRIGGER
            • New bill assignment  • Assign unassigned bill
            • Stage filtering      • Reassignment
                                   • Stage transitions
```

## Error Handling Flow

```
                    CONSTRAINT VIOLATION
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            DATABASE LEVEL         APPLICATION LEVEL
            • RAISE(ABORT)         • User-friendly message
            • Transaction rollback  • Detailed error info
            • Atomic failure       • Retry logic
```

## Performance Optimization

```
                    CACHING STRATEGY
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            APPLICATION CACHE      DATABASE INDEXES
            • User capacity cache   • assigned_to_id index
            • TTL-based expiry     • bill_stage_id index
            • Invalidation logic   • Composite indexes
```

## Testing Strategy

```
                    TEST COVERAGE
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            UNIT TESTS             INTEGRATION TESTS
            • Constraint logic     • End-to-end workflows
            • Edge cases           • Performance testing
            • Error scenarios      • Race conditions
```

## Key Improvements Made

### 1. **Corrected Stage Filtering**
```sql
-- BEFORE (Incorrect)
SELECT COUNT(*) FROM bills WHERE assigned_to_id = NEW.assigned_to_id

-- AFTER (Correct)
SELECT COUNT(*) FROM bills b
JOIN bill_stages bs ON b.bill_stage_id = bs.id
WHERE b.assigned_to_id = NEW.assigned_to_id
  AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
```

### 2. **Complete Scenario Coverage**
- ✅ New bill assignment
- ✅ Unassigned bill assignment
- ✅ Bill reassignment
- ✅ Stage transitions

### 3. **Proper Error Messages**
- ✅ Clear, actionable error messages
- ✅ Distinction between active/inactive stages
- ✅ User-friendly feedback

### 4. **Performance Optimization**
- ✅ Efficient database queries
- ✅ Proper indexing strategy
- ✅ Minimal performance impact

## Implementation Benefits

✅ **Data Integrity**: Atomic constraint enforcement at database level
✅ **Business Logic Accuracy**: Only active stages count toward limit
✅ **Performance**: Optimized queries with proper indexing
✅ **Maintainability**: Clear documentation and comprehensive tests
✅ **Scalability**: Efficient constraint checking for high-volume operations
✅ **Reliability**: Multi-layer defense against data corruption

This architecture ensures robust enforcement of the 3-bill limit business rule while maintaining performance and providing excellent user experience.
