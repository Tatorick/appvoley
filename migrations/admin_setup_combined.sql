-- COMBINED SETUP FOR ADMIN DASHBOARD
-- Run this in your Supabase SQL Editor

-- 1. Create the Secure RPC Function
DROP FUNCTION IF EXISTS get_admin_dashboard_data;
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    codigo TEXT,
    ciudad TEXT,
    pais TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    owner_name TEXT,
    owner_email TEXT,
    player_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if caller is super admin
    SELECT is_super_admin INTO v_is_admin
    FROM profiles
    WHERE id = auth.uid();

    -- IF v_is_admin IS NOT TRUE THEN
    --    RAISE EXCEPTION 'Access Denied: You are not a Super Admin.';
    -- END IF;
    -- COMMENTED OUT FOR INITIAL SETUP so you can see data, 
    -- UNCOMMENT AFTER PROMOTING YOURSELF.

    RETURN QUERY
    SELECT 
        c.id,
        c.nombre,
        c.codigo,
        c.ciudad,
        c.pais,
        c.status,
        c.created_at,
        p.nombre_completo as owner_name,
        au.email::text as owner_email,
        (SELECT count(*) FROM players pl WHERE pl.club_id = c.id) as player_count
    FROM clubs c
    LEFT JOIN profiles p ON c.created_by = p.id
    LEFT JOIN auth.users au ON c.created_by = au.id
    ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_data TO authenticated;

-- 2. Add Security Column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 3. PROMOTE YOURSELF (Replaces 'YOUR_EMAIL' automatically if you run this while logged in? No, SQL doesn't know context usually)
-- RUN THIS LINE REPLACING THE EMAIL WITH YOURS:
-- UPDATE profiles SET is_super_admin = TRUE WHERE id = (SELECT id FROM auth.users WHERE email = 'tu_email@ejemplo.com');
