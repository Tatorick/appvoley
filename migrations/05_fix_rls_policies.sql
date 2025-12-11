-- FIX: Missing RLS Policies for Clubs and Members

-- 1. Policies for CLUBS
-- Allow authenticated users to create a club
CREATE POLICY "Authenticated users can create clubs" ON clubs 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Ensure creators can Update/Delete their clubs (Update was already there, but let's be safe)
DROP POLICY IF EXISTS "Creators can update their clubs" ON clubs;
CREATE POLICY "Creators can manage their clubs" ON clubs
FOR ALL
USING (auth.uid() = created_by);

-- 2. Policies for CLUB_MEMBERS
-- Allow public read of memberships? Or just members? 
-- Let's allow everyone to see who belongs to which club (for roster views).
CREATE POLICY "Club memberships are viewable by everyone" ON club_members
FOR SELECT
USING (true);

-- Allow Club Owners to manage members (Insert, Update, Delete)
-- This covers the initial registration where the owner adds themselves.
CREATE POLICY "Club owners can manage members" ON club_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs 
        WHERE id = club_members.club_id 
        AND created_by = auth.uid()
    )
);

-- Note: The initial insert of the owner into club_members should pass because:
-- 1. User inserts Club (Allowed by "Authenticated users can create clubs")
-- 2. User inserts Member (Allowed by "Club owners can manage members" because Club exists and user is created_by)
