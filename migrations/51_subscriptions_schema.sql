-- 51_subscriptions_schema.sql
-- SAFE: Creates NEW tables only — does NOT modify existing tables
-- Run this in Supabase SQL Editor

-- =============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id              UUID REFERENCES clubs(id) ON DELETE CASCADE UNIQUE,
    plan                 TEXT CHECK (plan IN ('free', 'basic', 'pro')) NOT NULL DEFAULT 'free',
    billing_cycle        TEXT CHECK (billing_cycle IN ('monthly', 'annual', 'none')) DEFAULT 'none',
    status               TEXT CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')) DEFAULT 'trial',
    trial_start          TIMESTAMPTZ DEFAULT NOW(),
    trial_end            TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_club ON subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =============================================================================
-- 2. SUBSCRIPTION PAYMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscription_payments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id   UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    club_id           UUID REFERENCES clubs(id) ON DELETE CASCADE,
    amount            DECIMAL(10,2) NOT NULL,
    currency          TEXT DEFAULT 'USD',
    payment_method    TEXT CHECK (payment_method IN ('card', 'paypal', 'transfer')) NOT NULL,
    payment_reference TEXT,             -- Transaction ID or reference number
    receipt_url       TEXT,             -- URL of uploaded receipt/comprobante
    payment_date      TIMESTAMPTZ DEFAULT NOW(),
    period_start      DATE NOT NULL,
    period_end        DATE NOT NULL,
    status            TEXT CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    verified_by       UUID REFERENCES profiles(id),
    verified_at       TIMESTAMPTZ,
    rejection_reason  TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_club ON subscription_payments(club_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(status);

-- =============================================================================
-- 3. RLS POLICIES
-- =============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Club owner can view their own subscription
CREATE POLICY "Club owner views subscription" ON subscriptions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = subscriptions.club_id
        AND clubs.created_by = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = subscriptions.club_id
        AND club_members.profile_id = auth.uid()
    )
);

-- Subscriptions: Only system (via RPC) or admin can modify
CREATE POLICY "System manages subscriptions" ON subscriptions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = subscriptions.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- Subscription Payments: Club owner views their payments
CREATE POLICY "Club owner views sub payments" ON subscription_payments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = subscription_payments.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- Subscription Payments: Club owner can insert (submit payment)
CREATE POLICY "Club owner submits payment" ON subscription_payments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = subscription_payments.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- =============================================================================
-- 4. AUTO-CREATE SUBSCRIPTION ON CLUB CREATION
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO subscriptions (club_id, plan, billing_cycle, status, trial_start, trial_end)
    VALUES (
        NEW.id,
        'free',
        'none',
        'trial',
        NOW(),
        NOW() + INTERVAL '7 days'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_subscription ON clubs;
CREATE TRIGGER trg_create_subscription
    AFTER INSERT ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_default_subscription();

-- =============================================================================
-- 5. HELPER: Get subscription status for current user's club
-- =============================================================================
CREATE OR REPLACE FUNCTION get_my_subscription()
RETURNS TABLE (
    plan TEXT,
    status TEXT,
    billing_cycle TEXT,
    trial_end TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    days_left INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        s.plan,
        CASE
            WHEN s.status = 'trial' AND s.trial_end < NOW() THEN 'expired'
            WHEN s.status = 'active' AND s.current_period_end < NOW() THEN 'expired'
            ELSE s.status
        END AS status,
        s.billing_cycle,
        s.trial_end,
        s.current_period_end,
        CASE
            WHEN s.status = 'trial' THEN GREATEST(0, EXTRACT(DAY FROM s.trial_end - NOW())::INT)
            WHEN s.status = 'active' THEN GREATEST(0, EXTRACT(DAY FROM s.current_period_end - NOW())::INT)
            ELSE 0
        END AS days_left
    FROM subscriptions s
    JOIN clubs c ON c.id = s.club_id
    WHERE c.created_by = auth.uid()
       OR EXISTS (
           SELECT 1 FROM club_members cm
           WHERE cm.club_id = s.club_id AND cm.profile_id = auth.uid()
       )
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_my_subscription() TO authenticated;

-- =============================================================================
-- 6. CREATE SUBSCRIPTIONS FOR EXISTING CLUBS (backfill)
-- =============================================================================
INSERT INTO subscriptions (club_id, plan, billing_cycle, status, trial_start, trial_end)
SELECT
    c.id,
    'free',
    'none',
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days'
FROM clubs c
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.club_id = c.id
);
