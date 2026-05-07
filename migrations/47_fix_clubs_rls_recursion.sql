-- 47_fix_clubs_rls_recursion.sql
-- Fixes infinite recursion error when updating the clubs table
-- by using the SECURITY DEFINER get_club_role function instead of directly querying club_members

DROP POLICY IF EXISTS "Admins update clubs" ON clubs;

CREATE POLICY "Admins update clubs" ON clubs
FOR UPDATE
USING (
    created_by = auth.uid() OR
    get_club_role(id) IN ('admin', 'owner')
);
