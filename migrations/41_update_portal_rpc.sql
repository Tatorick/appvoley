-- 41_update_portal_rpc.sql
-- Actualiza la función get_player_portal_info para incluir:
--   • Torneos en los que el jugador está convocado + su calendario de partidos
--   • Estadísticas físicas (physical_assessments) con historial para gráfica de progresión
--   • Logs de rendimiento (player_performance_logs)
--   • Nombre del entrenador principal del club
--   • Pagos de torneos (tournament_payments)
--   • Solicitudes de corrección previas del jugador

CREATE OR REPLACE FUNCTION get_player_portal_info(
    p_club_code TEXT,
    p_dni TEXT,
    p_dob DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_club_id UUID;
    v_player_id UUID;
    v_player_data JSON;
    v_payments JSON;
    v_matches JSON;
    v_team_info JSON;
    -- Nuevos
    v_coach JSON;
    v_tournaments JSON;
    v_stats JSON;
    v_correction_requests JSON;
BEGIN
    -- 1. Validar Club Code
    SELECT id INTO v_club_id
    FROM clubs
    WHERE codigo = p_club_code;

    IF v_club_id IS NULL THEN
        RETURN json_build_object('error', 'Código de club inválido');
    END IF;

    -- 2. Encontrar Jugador (DNI + DOB dentro del club)
    SELECT id INTO v_player_id
    FROM players
    WHERE club_id = v_club_id
      AND dni = p_dni
      AND dob = p_dob;

    IF v_player_id IS NULL THEN
        RETURN json_build_object('error', 'Jugador no encontrado o datos incorrectos');
    END IF;

    -- 3. Datos básicos del jugador
    SELECT json_build_object(
        'first_name', first_name,
        'last_name', last_name,
        'position', position,
        'jersey_number', jersey_number,
        'height', height,
        'dob', dob,
        'phone', phone,
        'club_name', (SELECT nombre FROM clubs WHERE id = v_club_id)
    ) INTO v_player_data
    FROM players
    WHERE id = v_player_id;

    -- 4. Equipo(s) asignado(s)
    SELECT json_agg(json_build_object(
        'team_name', t.nombre,
        'category', c.nombre
    )) INTO v_team_info
    FROM team_assignments ta
    JOIN teams t ON ta.team_id = t.id
    JOIN categories c ON t.category_id = c.id
    WHERE ta.player_id = v_player_id;

    -- 5. Pagos de mensualidades y matrículas (treasury_movements)
    SELECT json_agg(json_build_object(
        'date', date,
        'amount', amount,
        'category', category,
        'description', description,
        'payment_month', payment_month
    ) ORDER BY date DESC) INTO v_payments
    FROM treasury_movements
    WHERE player_id = v_player_id
      AND type = 'income'
      AND date >= (CURRENT_DATE - INTERVAL '1 year');

    -- 6. Partidos del equipo (historial reciente)
    SELECT json_agg(json_build_object(
        'date', m.date,
        'opponent', m.opponent_name,
        'score_us', m.score_us,
        'score_them', m.score_them,
        'result', CASE WHEN m.score_us > m.score_them THEN 'W' ELSE 'L' END,
        'tournament', m.tournament_name
    ) ORDER BY m.date DESC) INTO v_matches
    FROM matches m
    WHERE m.team_id IN (
        SELECT team_id FROM team_assignments WHERE player_id = v_player_id
    )
    AND m.status = 'completed'
    LIMIT 20;

    -- 7. Entrenador principal del club
    SELECT json_build_object(
        'name', p.nombre_completo
    ) INTO v_coach
    FROM club_members cm
    JOIN profiles p ON cm.profile_id = p.id
    WHERE cm.club_id = v_club_id
      AND cm.role_in_club IN ('owner', 'entrenador_principal', 'coach')
    ORDER BY
        CASE cm.role_in_club
            WHEN 'entrenador_principal' THEN 1
            WHEN 'owner' THEN 2
            WHEN 'coach' THEN 3
        END
    LIMIT 1;

    -- 8. Torneos convocados + calendario de cada torneo + pagos del torneo
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'name', t.name,
            'location', t.location,
            'start_date', t.start_date,
            'end_date', t.end_date,
            'status', t.status,
            'cost_per_player', t.cost_per_player,
            'roster_status', tr.status,
            'amount_paid', (
                SELECT COALESCE(SUM(tp.amount), 0)
                FROM tournament_payments tp
                WHERE tp.tournament_id = t.id
                  AND tp.player_id = v_player_id
            ),
            'schedule', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', ts.id,
                        'match_date', ts.match_date,
                        'match_time', ts.match_time,
                        'opponent', ts.opponent,
                        'venue', ts.venue,
                        'phase', ts.phase,
                        'our_score', ts.our_score,
                        'opponent_score', ts.opponent_score,
                        'status', ts.status,
                        'notes', ts.notes
                    ) ORDER BY ts.match_date, ts.match_time
                ), '[]'::json)
                FROM tournament_schedule ts
                WHERE ts.tournament_id = t.id
            )
        ) ORDER BY t.start_date DESC
    ) INTO v_tournaments
    FROM tournament_roster tr
    JOIN tournaments t ON tr.tournament_id = t.id
    WHERE tr.player_id = v_player_id;

    -- 9. Estadísticas físicas (historial completo para graficar progresión)
    SELECT json_build_object(
        'latest', (
            SELECT json_build_object(
                'assessment_date', assessment_date,
                'weight_kg', weight_kg,
                'height_cm', height_cm,
                'standing_reach_cm', standing_reach_cm,
                'attack_jump_cm', attack_jump_cm,
                'block_jump_cm', block_jump_cm,
                'notes', notes
            )
            FROM physical_assessments
            WHERE player_id = v_player_id
            ORDER BY assessment_date DESC
            LIMIT 1
        ),
        'history', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'assessment_date', assessment_date,
                    'weight_kg', weight_kg,
                    'height_cm', height_cm,
                    'attack_jump_cm', attack_jump_cm,
                    'block_jump_cm', block_jump_cm,
                    'standing_reach_cm', standing_reach_cm
                ) ORDER BY assessment_date ASC
            ), '[]'::json)
            FROM physical_assessments
            WHERE player_id = v_player_id
        ),
        'performance_logs', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'date', date,
                    'metric_type', metric_type,
                    'value', value,
                    'notes', notes
                ) ORDER BY date ASC
            ), '[]'::json)
            FROM player_performance_logs
            WHERE player_id = v_player_id
            ORDER BY date DESC
            LIMIT 50
        )
    ) INTO v_stats;

    -- 10. Solicitudes de corrección previas del jugador (para mostrar estado)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id,
            'field_name', field_name,
            'requested_value', requested_value,
            'current_value', current_value,
            'notes', notes,
            'status', status,
            'created_at', created_at
        ) ORDER BY created_at DESC
    ), '[]'::json) INTO v_correction_requests
    FROM player_correction_requests
    WHERE player_id = v_player_id
    LIMIT 20;

    -- Resultado final
    RETURN json_build_object(
        'player', v_player_data,
        'teams', v_team_info,
        'payments', v_payments,
        'matches', v_matches,
        'coach', v_coach,
        'tournaments', v_tournaments,
        'stats', v_stats,
        'correction_requests', v_correction_requests
    );
END;
$$;

-- Permisos (igual que antes)
GRANT EXECUTE ON FUNCTION get_player_portal_info TO anon;
GRANT EXECUTE ON FUNCTION get_player_portal_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_portal_info TO service_role;
