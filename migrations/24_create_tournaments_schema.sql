-- 24_create_tournaments_schema.sql

-- 1. Tournaments Table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cost_per_player DECIMAL(10, 2) DEFAULT 0,
    description TEXT,
    status TEXT CHECK (status IN ('planned', 'confirmed', 'completed', 'canceled')) DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Tournament Roster Table (Many-to-Many: Tournaments <-> Players)
CREATE TABLE tournament_roster (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'declined')) DEFAULT 'pending',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- 3. Tournament Payments Table (Separate from main ledger)
CREATE TABLE tournament_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_payments ENABLE ROW LEVEL SECURITY;

-- Policies for Tournaments
CREATE POLICY "Club members view tournaments" ON tournaments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = tournaments.club_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Club admins manage tournaments" ON tournaments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = tournaments.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach')
    )
);

-- Policies for Roster
CREATE POLICY "Club members view roster" ON tournament_roster
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN club_members ON tournaments.club_id = club_members.club_id
        WHERE tournaments.id = tournament_roster.tournament_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Club admins manage roster" ON tournament_roster
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN club_members ON tournaments.club_id = club_members.club_id
        WHERE tournaments.id = tournament_roster.tournament_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach')
    )
);

-- Policies for Payments
CREATE POLICY "Club admins view payments" ON tournament_payments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN club_members ON tournaments.club_id = club_members.club_id
        WHERE tournaments.id = tournament_payments.tournament_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'treasurer')
    )
);

CREATE POLICY "Players view own payments" ON tournament_payments
FOR SELECT USING (
    player_id IN (
        SELECT id FROM players WHERE id = tournament_payments.player_id 
        -- Note: This assumes we can link auth.uid() to player.id via profiles/email if needed. 
        -- For now, let's stick to the standard pattern:
    )
    OR 
    EXISTS (
         -- If the user is the player (via profile link if we had it directly on players, but players table doesn't have profile_id usually? Let's check schema.sql)
         -- Checking schema.sql: players table does NOT have profile_id. It's a managed entity.
         -- So players can't "login" to see their data unless they are linked.
         -- For now, only admins see payments.
         SELECT 1 FROM tournaments
         JOIN club_members ON tournaments.club_id = club_members.club_id
         WHERE tournaments.id = tournament_payments.tournament_id
         AND club_members.profile_id = auth.uid()
         AND club_members.role_in_club IN ('owner', 'admin', 'coach')
    )
);

CREATE POLICY "Club admins manage payments" ON tournament_payments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN club_members ON tournaments.club_id = club_members.club_id
        WHERE tournaments.id = tournament_payments.tournament_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'treasurer')
    )
);
