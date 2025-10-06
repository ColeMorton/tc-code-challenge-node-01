-- Database constraints and triggers for bill assignment optimization
-- This file contains SQL constraints that can be applied to enhance data integrity

-- 1. Create a view for user bill counts (materialized view equivalent for SQLite)
CREATE VIEW IF NOT EXISTS user_bill_counts AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  COALESCE(bill_counts.bill_count, 0) as bill_count,
  CASE 
    WHEN COALESCE(bill_counts.bill_count, 0) >= 3 THEN 1 
    ELSE 0 
  END as has_reached_limit,
  CASE 
    WHEN COALESCE(bill_counts.bill_count, 0) >= 3 THEN 0 
    ELSE 3 - COALESCE(bill_counts.bill_count, 0) 
  END as remaining_slots
FROM users u
LEFT JOIN (
  SELECT 
    assigned_to_id,
    COUNT(*) as bill_count
  FROM bills 
  WHERE assigned_to_id IS NOT NULL
    AND bill_stage_id IN (
      SELECT id FROM bill_stages 
      WHERE label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    )
  GROUP BY assigned_to_id
) bill_counts ON u.id = bill_counts.assigned_to_id;

-- 2. Create a trigger to check user bill limit before assignment
CREATE TRIGGER IF NOT EXISTS check_user_bill_limit_before_insert
BEFORE INSERT ON bills
WHEN NEW.assigned_to_id IS NOT NULL
BEGIN
  SELECT CASE 
    WHEN (
      SELECT bill_count 
      FROM user_bill_counts 
      WHERE user_id = NEW.assigned_to_id
    ) >= 3
    THEN RAISE(ABORT, 'User has reached maximum bill limit of 3')
  END;
END;

-- 3. Create a trigger to check user bill limit before assignment update
CREATE TRIGGER IF NOT EXISTS check_user_bill_limit_before_update
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL AND OLD.assigned_to_id IS NULL
BEGIN
  SELECT CASE 
    WHEN (
      SELECT bill_count 
      FROM user_bill_counts 
      WHERE user_id = NEW.assigned_to_id
    ) >= 3
    THEN RAISE(ABORT, 'User has reached maximum bill limit of 3')
  END;
END;

-- 4. Create a trigger to validate assignment stage constraints
CREATE TRIGGER IF NOT EXISTS validate_assignment_stage
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL AND OLD.assigned_to_id IS NULL
BEGIN
  SELECT CASE 
    WHEN NEW.bill_stage_id NOT IN (
      SELECT id FROM bill_stages WHERE label IN ('Draft', 'Submitted')
    )
    THEN RAISE(ABORT, 'Bills can only be assigned in Draft or Submitted stage')
  END;
END;

-- 5. Create a trigger to automatically set submitted_at when transitioning to Submitted stage
CREATE TRIGGER IF NOT EXISTS set_submitted_at_on_assignment
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL 
  AND OLD.assigned_to_id IS NULL
  AND NEW.bill_stage_id IN (SELECT id FROM bill_stages WHERE label = 'Draft')
BEGIN
  UPDATE bills 
  SET 
    submitted_at = CURRENT_TIMESTAMP,
    bill_stage_id = (SELECT id FROM bill_stages WHERE label = 'Submitted')
  WHERE id = NEW.id;
END;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_assigned_stage 
ON bills(assigned_to_id, bill_stage_id) 
WHERE assigned_to_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bills_assignable 
ON bills(id, bill_stage_id) 
WHERE assigned_to_id IS NULL 
  AND bill_stage_id IN (
    SELECT id FROM bill_stages WHERE label IN ('Draft', 'Submitted')
  );

-- 7. Create a function to get user assignment capacity (SQLite doesn't support functions, so using a view)
CREATE VIEW IF NOT EXISTS user_assignment_capacity AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  COALESCE(COUNT(b.id), 0) as current_assigned_count,
  (3 - COALESCE(COUNT(b.id), 0)) as available_slots,
  CASE 
    WHEN COALESCE(COUNT(b.id), 0) >= 3 THEN 'FULL' 
    WHEN COALESCE(COUNT(b.id), 0) >= 2 THEN 'NEARLY_FULL'
    ELSE 'AVAILABLE' 
  END as capacity_status
FROM users u
LEFT JOIN bills b ON u.id = b.assigned_to_id 
  AND b.bill_stage_id IN (
    SELECT id FROM bill_stages 
    WHERE label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
  )
GROUP BY u.id, u.name, u.email;
