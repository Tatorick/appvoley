-- FIX: RLS Policies for CLUBS and MEMBERS for Updates

-- Ensure creators can update their club details
DROP POLICY IF EXISTS "Creators can update their clubs" ON clubs;
CREATE POLICY "Creators can update their clubs" ON clubs
FOR UPDATE
USING (auth.uid() = created_by);

-- Ensure creators can manage their members (Create/Delete/Update)
DROP POLICY IF EXISTS "Club owners can manage members" ON club_members;
CREATE POLICY "Club owners can manage members" ON club_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs 
        WHERE id = club_members.club_id 
        AND created_by = auth.uid()
    )
);

-- Allow members to view other members of their club
CREATE POLICY "Members can view club roster" ON club_members
FOR SELECT
USING (
    EXISTS (
         SELECT 1 FROM club_members cm_auth
         WHERE cm_auth.profile_id = auth.uid()
         AND cm_auth.club_id = club_members.club_id
    )
);
