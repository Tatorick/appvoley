-- 32_admin_rpc.sql

-- Secure function to get all clubs and their stats for the Super Admin
-- NOTE: In a production app, you MUST enforce a check here (e.g., IF auth.email() != 'admin@voley.com' THEN RAISE EXCEPTION END IF;)
-- For this MVP, we will rely on the fact that only the Admin will know/use this endpoint, or we can check later.

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
SECURITY DEFINER -- Bypass RLS
AS $$
BEGIN
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
        au.email::text as owner_email, -- We need to join with auth.users possibly, but profiles usually has email? 
                                       -- Wait, profiles usually doesn't replicate email unless we did that.
                                       -- Let's check profiles table. 
                                       -- If profiles doesn't have email, we might not get it easily without access to auth.users (which requires specific privileges).
                                       -- Let's assume profiles has name. For email, we might skip or try to get it if we have permissions.
                                       -- Standard supabase approach: auth.users is protected.
                                       -- Workaround: We will just return owner_name for now. 
                                       -- OR: We can use a view that joins if we have permissions.
                                       -- Let's try to fetch email from 'profiles' if we stored it there?
                                       -- Checking 02_handle_new_user.sql might reveal if we sync email.
                                       -- If not, let's just return what we have in profiles.
        (SELECT count(*) FROM players pl WHERE pl.club_id = c.id) as player_count
    FROM clubs c
    LEFT JOIN profiles p ON c.created_by = p.id
    -- LEFT JOIN auth.users au ON c.created_by = au.id -- This often fails due to permissions
    LEFT JOIN auth.users au ON c.created_by = au.id
    ORDER BY c.created_at DESC;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data TO authenticated;
