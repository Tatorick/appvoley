-- Migration: Tournament Expenses Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tournament_expenses (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    category      TEXT NOT NULL,       -- 'Transporte', 'Hospedaje', 'Alimentación', 'Inscripción', 'Uniformes', 'Otro'
    description   TEXT,
    amount        DECIMAL(10,2) NOT NULL,
    expense_date  DATE DEFAULT CURRENT_DATE,
    created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tournament_expenses ENABLE ROW LEVEL SECURITY;

-- All club managers (owner, admin, coach, assistant) can manage expenses
CREATE POLICY "Club managers manage tournament expenses" ON tournament_expenses
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments t
        JOIN club_members cm ON t.club_id = cm.club_id
        WHERE t.id = tournament_expenses.tournament_id
          AND cm.profile_id = auth.uid()
          AND cm.role_in_club IN ('owner', 'admin', 'coach', 'assistant')
    )
);
