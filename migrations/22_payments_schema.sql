-- 22_payments_schema.sql

-- TABLE: treasury_movements
-- Description: Stores all financial transactions (Income/Expenses) for the club.

CREATE TABLE treasury_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL, -- Ingreso o Egreso
    amount DECIMAL(10, 2) NOT NULL, -- Money amount
    description TEXT NOT NULL, -- e.g. "Balones Mikasa", "Cuota Mensual Juan"
    category TEXT, -- e.g. "Cuotas", "Material", "Torneos", "Alquiler", "Sueldos"
    
    date DATE DEFAULT CURRENT_DATE,
    
    -- Optional Link to Player (for Monthly Fees tracking)
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS POLICIES

ALTER TABLE treasury_movements ENABLE ROW LEVEL SECURITY;

-- 1. VIEW: Owners, Admins (Maybe Coaches? Let's restrict to Admin/Owner for privacy)
CREATE POLICY "Admins view treasury" ON treasury_movements
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = treasury_movements.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = treasury_movements.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role IN ('admin', 'owner') -- Only Admin/Owner
    )
);

-- 2. MANAGE: Owners and Admins only
CREATE POLICY "Admins manage treasury" ON treasury_movements
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = treasury_movements.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = treasury_movements.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role IN ('admin', 'owner')
    )
);

-- Indexes for charts/filtering
CREATE INDEX idx_treasury_club_date ON treasury_movements(club_id, date);
CREATE INDEX idx_treasury_type ON treasury_movements(type);
