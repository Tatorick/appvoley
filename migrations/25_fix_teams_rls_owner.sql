-- 25_fix_teams_rls_owner.sql

-- Drop existing policies to recreate them robustly or add new ones?
-- It is safer to DROP and RECREATE to strictly define access.

DROP POLICY IF EXISTS "Club members can view teams" ON teams;
DROP POLICY IF EXISTS "Club members can create teams" ON teams;
DROP POLICY IF EXISTS "Club members can update teams" ON teams;
DROP POLICY IF EXISTS "Club members can delete teams" ON teams;

-- 1. View Teams (Select)
CREATE POLICY "View teams policy" ON teams
FOR SELECT
USING (
    -- Options:
    -- A. Start with Club Owner
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = teams.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    -- B. Link via Club Members
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = teams.club_id
        AND club_members.profile_id = auth.uid()
    )
);

-- 2. Create Teams (Insert)
CREATE POLICY "Manage teams policy" ON teams
FOR ALL
USING (
    -- Owner
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = teams.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    -- Admin/Coach membership
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = teams.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('entrenador_principal', 'admin', 'coach', 'owner') -- Adjust roles as per your enum/string usage
    )
);
