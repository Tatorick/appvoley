-- FIX: Remove Recursive Policies
-- The previous policies caused a loop. We need to reset SELECT policies for club_members.

-- 1. Drop known problematic policies
DROP POLICY IF EXISTS "Members can view club roster" ON club_members;
DROP POLICY IF EXISTS "Club memberships are viewable by everyone" ON club_members;
DROP POLICY IF EXISTS "Users can view own 'club_members' rows" ON club_members;

-- 2. Create STRICTLY SAFE policies
-- Safe Policy A: I can see my own membership row.
CREATE POLICY "View own membership" ON club_members
FOR SELECT
USING (auth.uid() = profile_id);

-- Safe Policy B: I can see members IF I am the owner of the club.
-- This queries 'clubs' (which is safe), not 'club_members'.
CREATE POLICY "Club owners view members" ON club_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_members.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- Note: We temporarily removed "Members can see other members" (Roster View) to fix the crash.
-- We can add it back later using a SECURITY DEFINER function if needed.
