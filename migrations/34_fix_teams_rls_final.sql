-- 34_fix_teams_rls_final.sql

-- 1. Ensure Clubs are readable (Public Read)
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON clubs;
CREATE POLICY "Clubs are viewable by everyone" ON clubs FOR SELECT USING (true);

-- 2. Fix Teams RLS
-- Drop old policies to be safe
DROP POLICY IF EXISTS "View teams policy" ON teams;
DROP POLICY IF EXISTS "Manage teams policy" ON teams;
DROP POLICY IF EXISTS "Club members can view teams" ON teams;
DROP POLICY IF EXISTS "Club members can create teams" ON teams;
DROP POLICY IF EXISTS "Club members can update teams" ON teams;
DROP POLICY IF EXISTS "Club members can delete teams" ON teams;

-- Policy: Everyone can view teams (or at least authenticated users)
-- We can restrict to club members if we want, but for debugging/usability, 
-- letting auth users see teams is often fine if they know the club_id.
-- But let's stick to "Club Members + Owner" for correctness.

CREATE POLICY "View teams final" ON teams
FOR SELECT
USING (
    -- 1. Club Owner
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = teams.club_id
        AND clubs.created_by = auth.uid()
    )
    OR
    -- 2. Club Member (Any role)
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = teams.club_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Manage teams final" ON teams
FOR ALL
USING (
    -- 1. Club Owner
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = teams.club_id
        AND clubs.created_by = auth.uid()
    )
    OR
    -- 2. Club Admin/Coach
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = teams.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'entrenador_principal', 'coach')
    )
);

-- 3. Fix Team Assignments RLS
-- Ensure we can read assignments to count players
DROP POLICY IF EXISTS "Club owners manage assignments" ON team_assignments;
DROP POLICY IF EXISTS "Club members view assignments" ON team_assignments;

CREATE POLICY "View team assignments final" ON team_assignments
FOR SELECT
USING (
    -- Link via Team -> Club -> Owner/Member
    EXISTS (
        SELECT 1 FROM teams
        JOIN clubs ON teams.club_id = clubs.id
        WHERE teams.id = team_assignments.team_id
        AND (
            clubs.created_by = auth.uid() -- Owner
            OR
            EXISTS ( -- Member
                SELECT 1 FROM club_members
                WHERE club_members.club_id = clubs.id
                AND club_members.profile_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Manage team assignments final" ON team_assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM teams
        JOIN clubs ON teams.club_id = clubs.id
        WHERE teams.id = team_assignments.team_id
        AND (
            clubs.created_by = auth.uid() -- Owner
            OR
            EXISTS ( -- Admin/Coach
                SELECT 1 FROM club_members
                WHERE club_members.club_id = clubs.id
                AND club_members.profile_id = auth.uid()
                AND club_members.role_in_club IN ('owner', 'admin', 'entrenador_principal', 'coach')
            )
        )
    )
);
