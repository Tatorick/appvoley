-- FIX: Visibility Issues
-- 1. Ensure Categories are readable
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
FOR SELECT
TO authenticated
USING (true);

-- 2. Ensure Teams are viewable by Creators explicitly (Backup to club_members check)
DROP POLICY IF EXISTS "Club members can view teams" ON teams;
CREATE POLICY "Club members and owners can view teams" ON teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = teams.club_id
    AND club_members.profile_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM clubs
    WHERE clubs.id = teams.club_id
    AND clubs.created_by = auth.uid()
  )
);
