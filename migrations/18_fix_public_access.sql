-- 18_fix_public_access.sql

-- 1. Ensure basic permissions for anon (unauthenticated) and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE clubs TO anon, authenticated;
GRANT SELECT ON TABLE club_invitations TO anon, authenticated;

-- 2. Policy for Clubs: Allow public read of club names/info
-- (Drop first to avoid conflict if I named it differently or it exists)
DROP POLICY IF EXISTS "Public read access" ON clubs;
CREATE POLICY "Public read access" ON clubs
FOR SELECT
TO public -- 'public' role includes anon and authenticated
USING (true);

-- 3. Policy for Invitations: Re-affirm the policy
DROP POLICY IF EXISTS "Anyone can view valid invitations by token" ON club_invitations;
CREATE POLICY "Anyone can view valid invitations by token" ON club_invitations
FOR SELECT
TO public
USING (
    status = 'pending' 
    AND expires_at > now()
);
