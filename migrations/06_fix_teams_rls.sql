-- FIX: RLS Policy for TEAMS table

-- Allow members of a club to create teams for that club
CREATE POLICY "Club members can create teams" ON teams
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = teams.club_id
    AND club_members.profile_id = auth.uid()
    -- Optional: check for specific roles if needed, e.g. AND role_in_club IN ('admin', 'staff')
  )
);

-- Allow members to View teams (SELECT)
CREATE POLICY "Club members can view teams" ON teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = teams.club_id
    AND club_members.profile_id = auth.uid()
  )
);

-- Allow members to Update/Delete teams
CREATE POLICY "Club members can update teams" ON teams
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = teams.club_id
    AND club_members.profile_id = auth.uid()
  )
);

CREATE POLICY "Club members can delete teams" ON teams
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = teams.club_id
    AND club_members.profile_id = auth.uid()
  )
);
