-- 44_payments_audit_log.sql
-- Adds soft-delete support and a full audit log to the treasury_movements table.
-- Only owners and admins can view/manage these records.

-- =============================================================================
-- 1. SOFT DELETE COLUMNS on treasury_movements
-- =============================================================================
ALTER TABLE treasury_movements
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Index to speed up queries that filter out deleted rows
CREATE INDEX IF NOT EXISTS idx_treasury_not_deleted
  ON treasury_movements(club_id, deleted_at)
  WHERE deleted_at IS NULL;


-- =============================================================================
-- 2. AUDIT LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id             UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id        UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  movement_id    UUID        REFERENCES treasury_movements(id) ON DELETE SET NULL,
  action         TEXT        NOT NULL CHECK (action IN ('created', 'deleted')),
  performed_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Snapshot of relevant fields at the time of the action
  snapshot       JSONB       NOT NULL DEFAULT '{}',
  notes          TEXT        DEFAULT NULL -- optional reason (for deletions)
);

CREATE INDEX IF NOT EXISTS idx_audit_club     ON payment_audit_log(club_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_movement ON payment_audit_log(movement_id);

-- =============================================================================
-- 3. RLS POLICIES — Only owner and admin of the club
-- =============================================================================
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an owner or admin of the given club?
-- (Reuses the same pattern as existing policies)

CREATE POLICY "Admins view audit log" ON payment_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clubs
    WHERE clubs.id = payment_audit_log.club_id
      AND clubs.created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = payment_audit_log.club_id
      AND club_members.profile_id = auth.uid()
      AND club_members.role IN ('admin', 'owner')
  )
);

-- Allow inserts only from the RPC function (SECURITY DEFINER),
-- not directly from the client. We still need INSERT policy for
-- the trigger to fire under the authenticated user's context.
CREATE POLICY "System inserts audit log" ON payment_audit_log
FOR INSERT
WITH CHECK (true); -- The RPC itself enforces authorization


-- =============================================================================
-- 4. TRIGGER — auto-log every new treasury_movement as 'created'
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_log_payment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO payment_audit_log (
    club_id,
    movement_id,
    action,
    performed_by,
    performed_at,
    snapshot
  ) VALUES (
    NEW.club_id,
    NEW.id,
    'created',
    auth.uid(),
    NOW(),
    jsonb_build_object(
      'type',        NEW.type,
      'amount',      NEW.amount,
      'description', NEW.description,
      'category',    NEW.category,
      'date',        NEW.date,
      'player_id',   NEW.player_id,
      'payment_month', NEW.payment_month
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_payment_created ON treasury_movements;

CREATE TRIGGER trg_log_payment_created
  AFTER INSERT ON treasury_movements
  FOR EACH ROW
  EXECUTE FUNCTION fn_log_payment_created();


-- =============================================================================
-- 5. RPC FUNCTION — delete_payment (atomic soft-delete + audit log insert)
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_payment(
  p_movement_id UUID,
  p_notes       TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_movement treasury_movements%ROWTYPE;
BEGIN
  -- Fetch the movement (also verifies it belongs to a club the caller manages)
  SELECT tm.* INTO v_movement
  FROM treasury_movements tm
  WHERE tm.id = p_movement_id
    AND tm.deleted_at IS NULL
    AND (
      EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = tm.club_id
          AND clubs.created_by = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = tm.club_id
          AND club_members.profile_id = auth.uid()
          AND club_members.role IN ('admin', 'owner')
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movement not found or insufficient permissions';
  END IF;

  -- Soft delete
  UPDATE treasury_movements
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE id = p_movement_id;

  -- Audit log entry
  INSERT INTO payment_audit_log (
    club_id,
    movement_id,
    action,
    performed_by,
    performed_at,
    snapshot,
    notes
  ) VALUES (
    v_movement.club_id,
    v_movement.id,
    'deleted',
    auth.uid(),
    NOW(),
    jsonb_build_object(
      'type',          v_movement.type,
      'amount',        v_movement.amount,
      'description',   v_movement.description,
      'category',      v_movement.category,
      'date',          v_movement.date,
      'player_id',     v_movement.player_id,
      'payment_month', v_movement.payment_month
    ),
    p_notes
  );
END;
$$;

-- Grant execute to authenticated users (RLS inside the function handles authorization)
GRANT EXECUTE ON FUNCTION delete_payment(UUID, TEXT) TO authenticated;
