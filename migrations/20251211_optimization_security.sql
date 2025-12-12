-- Optimization: Add Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_teams_club_id ON teams(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_profile_id ON club_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_ledger_club_id ON payments_ledger(club_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_posts_club_id ON matchmaking_posts(club_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_posts_status ON matchmaking_posts(estado);

-- Security: RLS for club_members
-- User requested this to be visible for matchmaking/public profiles.
-- If no policy existed, it was private by default.
DROP POLICY IF EXISTS "Club members are viewable by everyone" ON club_members;
CREATE POLICY "Club members are viewable by everyone" ON club_members FOR SELECT USING (true);

-- Ensure other tables have basic protection if not already defined in schema.sql
-- (Assuming schema.sql policies are applied, but adding safety checks if needed)
