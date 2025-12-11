-- 23_create_matches_table.sql

CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- Our team
    opponent_name TEXT NOT NULL, -- Free text for now
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT,
    type TEXT CHECK (type IN ('friendly', 'tournament', 'league')) DEFAULT 'friendly',
    status TEXT CHECK (status IN ('scheduled', 'completed', 'canceled')) DEFAULT 'scheduled',
    
    -- Results
    score_us INTEGER DEFAULT 0,
    score_them INTEGER DEFAULT 0,
    set_scores TEXT, -- e.g. "25-20, 20-25, 15-10"
    
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 1. View: Everyone in the club (members) + Public if we want? 
-- Let's stick to Club Members for now.
CREATE POLICY "Club members view matches" ON matches
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = matches.club_id
        AND club_members.profile_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = matches.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- 2. Manage: Admins and Coaches
CREATE POLICY "Staff manage matches" ON matches
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = matches.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = matches.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role IN ('admin', 'coach')
    )
);

-- Index for querying by date/club
CREATE INDEX idx_matches_club_date ON matches(club_id, date);
