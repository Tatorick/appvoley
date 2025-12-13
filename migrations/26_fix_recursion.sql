-- 26_fix_recursion.sql

-- 1. Create a secure function to check role without triggering RLS recursion
-- SECURITY DEFINER allows this function to run with the privileges of the creator (likely admin),
-- bypassing the RLS on club_members when called inside the policy.
CREATE OR REPLACE FUNCTION public.get_club_role(lookup_club_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role_in_club
  FROM club_members
  WHERE club_id = lookup_club_id
  AND profile_id = auth.uid()
  LIMIT 1;
$$;

-- 2. Drop the problematic recursive policies from the previous migration
DROP POLICY IF EXISTS "Club admins can view all members" ON club_members;
DROP POLICY IF EXISTS "Members can view their own membership" ON club_members;

-- 3. Create new non-recursive policies for club_members

-- Policy A: Users can ALWAYS see their own membership row.
-- This is the base case that allows other queries to check "Am I a member?"
CREATE POLICY "View own membership" ON club_members
FOR SELECT USING (
    auth.uid() = profile_id
);

-- Policy B: Admins and Owners can see ALL members of their club.
-- We use the SECURITY DEFINER function to check the user's role, preventing recursion.
CREATE POLICY "Admins and Owners view all members" ON club_members
FOR SELECT USING (
    -- 1. Check if user is the Club Owner (via clubs table - no recursion)
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_members.club_id
        AND clubs.created_by = auth.uid()
    )
    OR
    -- 2. Check if user has an admin role (via secure function - breaks recursion)
    get_club_role(club_members.club_id) IN ('owner', 'admin', 'coach', 'staff')
);
