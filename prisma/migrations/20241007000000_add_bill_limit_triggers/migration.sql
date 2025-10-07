-- Enforce 3-bill limit when inserting a bill with an assigned user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_insert
BEFORE INSERT ON bills
WHEN NEW.assigned_to_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills
      WHERE assigned_to_id = NEW.assigned_to_id
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned')
  END;
END;

-- Enforce 3-bill limit when updating a bill to assign it to a user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_update
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL
  AND OLD.assigned_to_id IS NULL
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills
      WHERE assigned_to_id = NEW.assigned_to_id
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned')
  END;
END;
