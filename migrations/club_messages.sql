-- ============================================
-- FASE 2: Chat entre Clubs — Script Idempotente
-- Si ya ejecutaste el script anterior, usa este.
-- Puedes ejecutarlo tantas veces como quieras sin errores.
-- ============================================

-- Tabla (IF NOT EXISTS previene error si ya existe)
CREATE TABLE IF NOT EXISTS club_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_request_id UUID REFERENCES match_requests(id) ON DELETE CASCADE,
    sender_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    sender_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si ya existen, luego recrear
DROP POLICY IF EXISTS "Clubs in request can read messages" ON club_messages;
DROP POLICY IF EXISTS "Clubs in request can send messages" ON club_messages;

CREATE POLICY "Clubs in request can read messages" ON club_messages
FOR SELECT USING (
    match_request_id IN (
        SELECT id FROM match_requests
        WHERE requesting_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
           OR hosting_club_id    IN (SELECT id FROM clubs WHERE created_by = auth.uid())
    )
);

CREATE POLICY "Clubs in request can send messages" ON club_messages
FOR INSERT WITH CHECK (
    match_request_id IN (
        SELECT id FROM match_requests
        WHERE requesting_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
           OR hosting_club_id    IN (SELECT id FROM clubs WHERE created_by = auth.uid())
    )
    AND sender_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
);

-- ✅ Listo. No se requiere configuración de Realtime.
-- La app usa polling cada 4 segundos — funciona en plan gratuito.
