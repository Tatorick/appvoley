-- 40_player_correction_requests.sql
-- Solicitudes de corrección que los jugadores envían desde el Portal del Jugador.
-- Incluye correcciones de datos personales y de pagos.
-- Las inserciones se hacen vía RPC con SECURITY DEFINER (sin auth directa del jugador).

CREATE TABLE player_correction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

    -- Qué campo quiere corregir. Ejemplos:
    -- Datos personales: 'dni', 'first_name', 'last_name', 'position', 'jersey_number', 'dob', 'phone', 'height'
    -- Pagos: 'payment_monthly', 'payment_tournament'
    field_name TEXT NOT NULL,

    current_value TEXT,             -- Valor actual que el sistema muestra
    requested_value TEXT NOT NULL,  -- Valor que el jugador dice que debería ser
    notes TEXT,                     -- Explicación libre del jugador

    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewed', 'applied', 'rejected')),

    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE player_correction_requests ENABLE ROW LEVEL SECURITY;

-- Solo entrenadores/admins pueden ver y gestionar las solicitudes
CREATE POLICY "Coaches view and manage correction requests" ON player_correction_requests
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM players p
        JOIN club_members cm ON p.club_id = cm.club_id
        WHERE p.id = player_correction_requests.player_id
        AND cm.profile_id = auth.uid()
        AND cm.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM players p
        JOIN club_members cm ON p.club_id = cm.club_id
        WHERE p.id = player_correction_requests.player_id
        AND cm.profile_id = auth.uid()
        AND cm.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
);

-- La inserción desde el portal se hace via RPC (SECURITY DEFINER), NO se necesita policy de INSERT pública.

-- Índices
CREATE INDEX idx_correction_requests_player_id ON player_correction_requests(player_id);
CREATE INDEX idx_correction_requests_status ON player_correction_requests(status);

-- =============================================================================
-- RPC: submit_player_correction
-- Llama desde el portal del jugador (anon/sin auth) validando identidad via DNI+DOB+código de club
-- =============================================================================
CREATE OR REPLACE FUNCTION submit_player_correction(
    p_club_code TEXT,
    p_dni TEXT,
    p_dob DATE,
    p_field_name TEXT,
    p_current_value TEXT,
    p_requested_value TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_id UUID;
    v_pending_count INT;
BEGIN
    -- 1. Validar identidad del jugador (mismo mecanismo que get_player_portal_info)
    SELECT p.id INTO v_player_id
    FROM players p
    JOIN clubs c ON p.club_id = c.id
    WHERE c.codigo = p_club_code
      AND p.dni = p_dni
      AND p.dob = p_dob;

    IF v_player_id IS NULL THEN
        RETURN json_build_object('error', 'Jugador no encontrado o datos incorrectos');
    END IF;

    -- 2. Anti-spam: máx 5 solicitudes pendientes por jugador
    SELECT COUNT(*) INTO v_pending_count
    FROM player_correction_requests
    WHERE player_id = v_player_id AND status = 'pending';

    IF v_pending_count >= 5 THEN
        RETURN json_build_object(
            'error', 'Ya tienes 5 solicitudes pendientes. Espera que tu entrenador las revise antes de enviar más.'
        );
    END IF;

    -- 3. Validar que el campo sea uno permitido
    IF p_field_name NOT IN (
        'dni', 'first_name', 'last_name', 'position', 'jersey_number',
        'dob', 'phone', 'height', 'payment_monthly', 'payment_tournament', 'other'
    ) THEN
        RETURN json_build_object('error', 'Campo no válido para solicitud de corrección');
    END IF;

    -- 4. Insertar la solicitud
    INSERT INTO player_correction_requests
        (player_id, field_name, current_value, requested_value, notes)
    VALUES
        (v_player_id, p_field_name, p_current_value, p_requested_value, p_notes);

    RETURN json_build_object('success', true, 'message', 'Solicitud enviada correctamente. Tu entrenador la revisará pronto.');
END;
$$;

-- Permisos: accesible desde el portal (sin login)
GRANT EXECUTE ON FUNCTION submit_player_correction TO anon;
GRANT EXECUTE ON FUNCTION submit_player_correction TO authenticated;
GRANT EXECUTE ON FUNCTION submit_player_correction TO service_role;
