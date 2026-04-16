-- 36_fix_rls_role_column.sql
-- FIX: Several policies from 19_enforce_roles.sql referenced club_members.role
-- but the actual column is club_members.role_in_club (see schema.sql line 40).
-- This caused admins and coaches to be silently blocked from managing players and teams.

-- 1. Fix PLAYERS policies
DROP POLICY IF EXISTS "Members view players" ON players;
DROP POLICY IF EXISTS "Staff manage players" ON players;

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

CREATE POLICY "Staff manage players" ON players
FOR ALL
USING (
    -- Is Owner
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = players.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    -- Is Admin or Coach (using role_in_club, not role)
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = players.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('admin', 'coach', 'entrenador_principal', 'owner')
    )
);

-- 2. Fix TEAMS policies (already fixed in 34_fix_teams_rls_final.sql, but drop the 19_enforce_roles ones to be safe)
DROP POLICY IF EXISTS "Staff manage teams" ON teams;

-- Note: "View teams final" and "Manage teams final" from migration 34 should already be correct.
-- Only recreate if 19's version overrode them.
-- Check if policy from 34 exists before creating:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teams' AND policyname = 'Manage teams final'
    ) THEN
        CREATE POLICY "Manage teams final" ON teams
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM clubs
                WHERE clubs.id = teams.club_id
                AND clubs.created_by = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = teams.club_id
                AND club_members.profile_id = auth.uid()
                AND club_members.role_in_club IN ('owner', 'admin', 'entrenador_principal', 'coach')
            )
        );
    END IF;
END
$$;

-- 3. Fix INVITATIONS policy
DROP POLICY IF EXISTS "Admins manage invitations" ON club_invitations;

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
        AND club_members.role_in_club = 'admin'
    )
);

-- 4. Fix CLUBS UPDATE policy
DROP POLICY IF EXISTS "Admins update clubs" ON clubs;

CREATE POLICY "Admins update clubs" ON clubs
FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = clubs.id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club = 'admin'
    )
);
