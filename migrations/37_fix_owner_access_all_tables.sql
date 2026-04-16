-- 37_fix_owner_access_all_tables.sql
-- 
-- ROOT CAUSE: The club owner (identified by clubs.created_by) is often NOT
-- inserted into club_members. Many RLS policies only check club_members,
-- meaning the owner gets blocked from seeing their own club's data.
--
-- This migration adds a helper function (is_club_owner) and rebuilds ALL
-- affected policies to include an owner check via clubs.created_by.
-- This is the definitive fix. Run ONCE against Supabase SQL Editor.

-- ============================================================
-- 0. HELPER FUNCTION: check if current user is owner of a club
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_club_owner(p_club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clubs
    WHERE clubs.id = p_club_id
    AND clubs.created_by = auth.uid()
  );
$$;

-- ============================================================
-- 1. TOURNAMENTS — Owner was completely blocked
-- ============================================================
DROP POLICY IF EXISTS "Club members view tournaments" ON tournaments;
DROP POLICY IF EXISTS "Club admins manage tournaments" ON tournaments;
DROP POLICY IF EXISTS "Club admins and owners manage tournaments" ON tournaments;
DROP POLICY IF EXISTS "Club members and owners view tournaments" ON tournaments;

CREATE POLICY "Tournaments: owners and members view" ON tournaments
FOR SELECT USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = tournaments.club_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Tournaments: owners and admins manage" ON tournaments
FOR ALL USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = tournaments.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
);

-- ============================================================
-- 2. TOURNAMENT_ROSTER
-- ============================================================
DROP POLICY IF EXISTS "Club members view roster" ON tournament_roster;
DROP POLICY IF EXISTS "Club admins manage roster" ON tournament_roster;
DROP POLICY IF EXISTS "Club admins and owners manage roster" ON tournament_roster;

CREATE POLICY "Roster: owners and members view" ON tournament_roster
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_roster.tournament_id
        AND (
            is_club_owner(tournaments.club_id)
            OR EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = tournaments.club_id
                AND club_members.profile_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Roster: owners and admins manage" ON tournament_roster
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_roster.tournament_id
        AND (
            is_club_owner(tournaments.club_id)
            OR EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = tournaments.club_id
                AND club_members.profile_id = auth.uid()
                AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
            )
        )
    )
);

-- ============================================================
-- 3. TOURNAMENT_PAYMENTS
-- ============================================================
DROP POLICY IF EXISTS "Club admins view payments" ON tournament_payments;
DROP POLICY IF EXISTS "Players view own payments" ON tournament_payments;
DROP POLICY IF EXISTS "Club admins manage payments" ON tournament_payments;
DROP POLICY IF EXISTS "Club admins and owners manage payments" ON tournament_payments;

CREATE POLICY "Tournament Payments: owners and admins manage" ON tournament_payments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_payments.tournament_id
        AND (
            is_club_owner(tournaments.club_id)
            OR EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = tournaments.club_id
                AND club_members.profile_id = auth.uid()
                AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
            )
        )
    )
);

-- ============================================================
-- 4. TREASURY_MOVEMENTS — Uses .role (wrong column) → fix to role_in_club
-- ============================================================
DROP POLICY IF EXISTS "Admins view treasury" ON treasury_movements;
DROP POLICY IF EXISTS "Admins manage treasury" ON treasury_movements;

CREATE POLICY "Treasury: owners and admins view" ON treasury_movements
FOR SELECT USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = treasury_movements.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin')
    )
);

CREATE POLICY "Treasury: owners and admins manage" ON treasury_movements
FOR ALL USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = treasury_movements.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin')
    )
);

-- ============================================================
-- 5. PLAYERS — Reinforce owner access (from migration 19)
-- ============================================================
DROP POLICY IF EXISTS "Members view players" ON players;
DROP POLICY IF EXISTS "Staff manage players" ON players;
-- Also drop from migration 12 just in case they still exist
DROP POLICY IF EXISTS "Club owners view players" ON players;
DROP POLICY IF EXISTS "Club members view players" ON players;
DROP POLICY IF EXISTS "Club owners manage players" ON players;

CREATE POLICY "Players: owners and members view" ON players
FOR SELECT USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = players.club_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Players: owners and staff manage" ON players
FOR ALL USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = players.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
);

-- ============================================================
-- 6. TEAMS — Reinforce (some migrations used wrong role column)
-- ============================================================
DROP POLICY IF EXISTS "View teams final" ON teams;
DROP POLICY IF EXISTS "Manage teams final" ON teams;
DROP POLICY IF EXISTS "Staff manage teams" ON teams;

CREATE POLICY "Teams: owners and members view" ON teams
FOR SELECT USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = teams.club_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Teams: owners and staff manage" ON teams
FOR ALL USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = teams.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
);

-- ============================================================
-- 7. TEAM_ASSIGNMENTS
-- ============================================================
DROP POLICY IF EXISTS "View team assignments final" ON team_assignments;
DROP POLICY IF EXISTS "Manage team assignments final" ON team_assignments;

CREATE POLICY "Team Assignments: owners and members view" ON team_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = team_assignments.team_id
        AND (
            is_club_owner(teams.club_id)
            OR EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = teams.club_id
                AND club_members.profile_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Team Assignments: owners and staff manage" ON team_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = team_assignments.team_id
        AND (
            is_club_owner(teams.club_id)
            OR EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = teams.club_id
                AND club_members.profile_id = auth.uid()
                AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
            )
        )
    )
);

-- ============================================================
-- 8. CATEGORIES — also need owner access
-- ============================================================
DROP POLICY IF EXISTS "Club members view categories" ON categories;
DROP POLICY IF EXISTS "Club admins manage categories" ON categories;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users (categories are mostly reference data)
CREATE POLICY "Categories: authenticated users view" ON categories
FOR SELECT TO authenticated USING (
    club_id IS NULL  -- system-wide categories visible to all
    OR is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = categories.club_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Categories: owners and staff manage" ON categories
FOR ALL USING (
    is_club_owner(club_id)
    OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = categories.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
);

-- ============================================================
-- 9. CLUB_MEMBERS — Make sure owner can manage and view
-- ============================================================
DROP POLICY IF EXISTS "Club owners can manage members" ON club_members;
DROP POLICY IF EXISTS "Club owners view members" ON club_members;
DROP POLICY IF EXISTS "Admins and Owners view all members" ON club_members;

-- Keep "View own membership" from migration 26
-- Add owner view all members (without recursion — uses clubs table)
CREATE POLICY "Club owners view all members" ON club_members
FOR SELECT USING (
    auth.uid() = profile_id  -- see your own row
    OR EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_members.club_id
        AND clubs.created_by = auth.uid()
    )
    OR get_club_role(club_members.club_id) IN ('owner', 'admin', 'coach', 'staff')
);

CREATE POLICY "Club owners manage members" ON club_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_members.club_id
        AND clubs.created_by = auth.uid()
    )
    OR get_club_role(club_members.club_id) IN ('owner', 'admin')
);
