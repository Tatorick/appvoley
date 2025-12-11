-- 19_enforce_roles.sql

-- Helper function to check role (Optional, but cleaner for policies)
-- actually, direct EXISTS queries are often more performant/reliable in RLS than PL/pgSQL functions due to caching context, but let's stick to direct queries for transparency.

-- 1. PLAYERS Policies (Refining 12_create_players_table.sql)
DROP POLICY IF EXISTS "Club owners manage players" ON players;
DROP POLICY IF EXISTS "Club members view players" ON players;

-- View: All members can view
CREATE POLICY "Members view players" ON players
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = players.club_id
        AND club_members.profile_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = players.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- Manage: Owner, Admin, Coach ONLY (No Assistants)
CREATE POLICY "Staff manage players" ON players
FOR ALL
USING (
    -- Is Owner
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = players.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    -- Is Admin or Coach
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = players.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role IN ('admin', 'coach')
    )
);


-- 2. TEAMS Policies (Refining 06_fix_teams_rls.sql)
DROP POLICY IF EXISTS "Club members can create teams" ON teams;
DROP POLICY IF EXISTS "Club members can update teams" ON teams;
DROP POLICY IF EXISTS "Club members can delete teams" ON teams;

-- Create/Update/Delete: Owner, Admin, Coach
CREATE POLICY "Staff manage teams" ON teams
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = teams.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = teams.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role IN ('admin', 'coach')
    )
);

-- 3. INVITATIONS Policies (Refining 16_staff_invitations.sql)
-- Currently: "Club owners manage invitations"
-- We want to add Admins too.
DROP POLICY IF EXISTS "Club owners manage invitations" ON club_invitations;

CREATE POLICY "Admins manage invitations" ON club_invitations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_invitations.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = club_invitations.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role = 'admin'
    )
);

-- 4. CLUB SETTINGS (Refining 08_fix_club_update_policy.sql)
-- Currently: "Creators can update their clubs"
-- Add Admin
DROP POLICY IF EXISTS "Creators can update their clubs" ON clubs;

CREATE POLICY "Admins update clubs" ON clubs
FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = clubs.id
        AND club_members.profile_id = auth.uid()
        AND club_members.role = 'admin'
    )
);
