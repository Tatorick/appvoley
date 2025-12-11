-- FIX: Infinite Recursion in RLS Policies

-- The 500 error is caused because querying 'teams' checks 'club_members',
-- which in turn checks 'club_members' again to see if you are a member, creating a loop.

-- 1. Add a simple, non-recursive policy for users to see THEIR OWN membership rows.
-- This allows the subqueries in other policies (like "Am I a member?") to succeed immediately.
CREATE POLICY "Users can view own 'club_members' rows" ON club_members
FOR SELECT
USING (auth.uid() = profile_id);

-- 2. Optional: We can keep the "Members can view club roster" policy for viewing OTHERS,
-- but the above policy handles the self-check needed for the 'teams' RLS.

-- 3. Ensure Categories are properly public (redundant check but safe)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
FOR SELECT
USING (true);
