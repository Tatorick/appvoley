-- 25_fix_rls_policies.sql

-- 1. Fix club_members RLS (It was enabled but had no policies, blocking access)
CREATE POLICY "Members can view their own membership" ON club_members
FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Club admins can view all members" ON club_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM club_members cm
        WHERE cm.club_id = club_members.club_id
        AND cm.profile_id = auth.uid()
        AND cm.role_in_club IN ('owner', 'admin', 'coach', 'staff')
    )
    OR
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_members.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- 2. Update Tournaments Policies to explicitly allow Club Owner (created_by in clubs table)
-- We drop and recreate to ensure the logic is correct.

DROP POLICY IF EXISTS "Club admins manage tournaments" ON tournaments;
CREATE POLICY "Club admins and owners manage tournaments" ON tournaments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = tournaments.club_id
        AND clubs.created_by = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = tournaments.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach')
    )
);

DROP POLICY IF EXISTS "Club members view tournaments" ON tournaments;
CREATE POLICY "Club members and owners view tournaments" ON tournaments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = tournaments.club_id
        AND clubs.created_by = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = tournaments.club_id
        AND club_members.profile_id = auth.uid()
    )
);

-- 3. Update Roster Policies
DROP POLICY IF EXISTS "Club admins manage roster" ON tournament_roster;
CREATE POLICY "Club admins and owners manage roster" ON tournament_roster
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN clubs ON tournaments.club_id = clubs.id
        WHERE tournaments.id = tournament_roster.tournament_id
        AND clubs.created_by = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN club_members ON tournaments.club_id = club_members.club_id
        WHERE tournaments.id = tournament_roster.tournament_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'coach')
    )
);

-- 4. Update Payments Policies
DROP POLICY IF EXISTS "Club admins manage payments" ON tournament_payments;
CREATE POLICY "Club admins and owners manage payments" ON tournament_payments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN clubs ON tournaments.club_id = clubs.id
        WHERE tournaments.id = tournament_payments.tournament_id
        AND clubs.created_by = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM tournaments
        JOIN club_members ON tournaments.club_id = club_members.club_id
        WHERE tournaments.id = tournament_payments.tournament_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('owner', 'admin', 'treasurer')
    )
);
