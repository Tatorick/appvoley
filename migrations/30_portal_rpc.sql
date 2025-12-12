-- 30_portal_rpc.sql

-- Function to securely fetch player data for the public portal
-- Returns JSON to allow flexible structure
CREATE OR REPLACE FUNCTION get_player_portal_info(
    p_club_code TEXT,
    p_dni TEXT,
    p_dob DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres) to bypass RLS, BUT we validate strict inputs
AS $$
DECLARE
    v_club_id UUID;
    v_player_id UUID;
    v_player_data JSON;
    v_payments JSON;
    v_matches JSON;
    v_team_info JSON;
BEGIN
    -- 1. Validate Club Code
    SELECT id INTO v_club_id
    FROM clubs
    WHERE codigo = p_club_code;

    IF v_club_id IS NULL THEN
        RETURN json_build_object('error', 'Código de club inválido');
    END IF;

    -- 2. Find Player (Match DNI and DOB within that Club)
    SELECT id INTO v_player_id
    FROM players
    WHERE club_id = v_club_id
    AND dni = p_dni
    AND dob = p_dob;

    IF v_player_id IS NULL THEN
        RETURN json_build_object('error', 'Jugador no encontrado o datos incorrectos');
    END IF;

    -- 3. Fetch Player Basic Info
    SELECT json_build_object(
        'first_name', first_name,
        'last_name', last_name,
        'position', position,
        'jersey_number', jersey_number,
        'height', height,
        'dob', dob,
        'club_name', (SELECT nombre FROM clubs WHERE id = v_club_id)
    ) INTO v_player_data
    FROM players
    WHERE id = v_player_id;

    -- 4. Fetch Active Team (Assignments)
    SELECT json_agg(json_build_object(
        'team_name', t.nombre,
        'category', c.nombre
    )) INTO v_team_info
    FROM team_assignments ta
    JOIN teams t ON ta.team_id = t.id
    JOIN categories c ON t.category_id = c.id
    WHERE ta.player_id = v_player_id;

    -- 5. Fetch Payments (Current Year)
    -- We'll return critical payments: Matricula and Current Monthly Fees status check
    -- For simplicity, let's return ALL income movements for this player for the current and previous year
    SELECT json_agg(json_build_object(
        'date', date,
        'amount', amount,
        'category', category,
        'description', description,
        'payment_month', payment_month
    )) INTO v_payments
    FROM treasury_movements
    WHERE player_id = v_player_id
    AND type = 'income'
    AND date >= (CURRENT_DATE - INTERVAL '1 year');

    -- 6. Fetch Completed Matches Stats (Just summary for now)
    -- This requires aggregation. Let's return raw match count for frontend to process, 
    -- or pre-calculated stats if we had a materialized view. 
    -- Let's return list of last 20 matches for the player's TEAMS.
    -- (Exact player participation isn't tracked per match yet, just team, so this is an approximation: "Matches of my team")
    SELECT json_agg(json_build_object(
        'date', m.date,
        'opponent', m.opponent_name,
        'score_us', m.score_us,
        'score_them', m.score_them,
        'result', CASE WHEN m.score_us > m.score_them THEN 'W' ELSE 'L' END,
        'tournament', m.tournament_name
    )) INTO v_matches
    FROM matches m
    WHERE m.team_id IN (SELECT team_id FROM team_assignments WHERE player_id = v_player_id)
    AND m.status = 'completed'
    ORDER BY m.date DESC
    LIMIT 20;

    -- Result
    RETURN json_build_object(
        'player', v_player_data,
        'teams', v_team_info,
        'payments', v_payments,
        'matches', v_matches
    );
END;
$$;

-- Grant execute to public/anon so the portal can call it without login
GRANT EXECUTE ON FUNCTION get_player_portal_info TO anon;
GRANT EXECUTE ON FUNCTION get_player_portal_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_portal_info TO service_role;
