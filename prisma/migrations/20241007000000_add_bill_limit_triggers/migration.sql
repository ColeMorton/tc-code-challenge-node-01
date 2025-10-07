-- ============================================================================
-- CORRECTED BILL ASSIGNMENT CONSTRAINTS
-- ============================================================================
-- These triggers enforce the 3-bill limit for active bill stages only
-- Active stages: Draft, Submitted, Approved, Paying, On Hold
-- Inactive stages: Rejected, Paid (don't count toward limit)

-- 1. Enforce 3-bill limit when inserting a bill with an assigned user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_insert
BEFORE INSERT ON bills
WHEN NEW.assigned_to_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned in active stages')
  END;
END;

-- 2. Enforce 3-bill limit when updating a bill to assign it to a user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_update
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL
  AND OLD.assigned_to_id IS NULL
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned in active stages')
  END;
END;

-- 3. Enforce 3-bill limit when reassigning a bill to a different user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_reassign
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL
  AND OLD.assigned_to_id IS NOT NULL
  AND NEW.assigned_to_id != OLD.assigned_to_id
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'Target user already has 3 bills assigned in active stages')
  END;
END;

-- 4. Enforce 3-bill limit when transitioning bills to active stages
-- This handles cases where a bill moves from inactive to active stage
CREATE TRIGGER IF NOT EXISTS check_bill_limit_stage_transition
BEFORE UPDATE ON bills
WHEN OLD.bill_stage_id != NEW.bill_stage_id
  AND NEW.assigned_to_id IS NOT NULL
BEGIN
  -- Only check if the new stage is an active stage
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned in active stages')
  END;
END;
