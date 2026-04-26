-- ============================================
-- FASE 1: Sistema de Solicitudes de Tope/Torneo
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS match_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES match_posts(id) ON DELETE CASCADE,
    requesting_club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    hosting_club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, requesting_club_id) -- Un club solo puede enviar 1 solicitud por post
);

-- Trigger para updated_at automático
CREATE TRIGGER update_match_requests_modtime
BEFORE UPDATE ON match_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- Un club puede ver las solicitudes donde es anfitrión o solicitante
CREATE POLICY "Clubs can see own requests" ON match_requests
FOR SELECT USING (
    requesting_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
    OR hosting_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
);

-- Solo el club solicitante puede crear una solicitud
CREATE POLICY "Club owners can send requests" ON match_requests
FOR INSERT WITH CHECK (
    requesting_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
);

-- El club anfitrión puede aceptar/rechazar; el solicitante puede cancelar
CREATE POLICY "Clubs can update their own requests" ON match_requests
FOR UPDATE USING (
    hosting_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
    OR requesting_club_id IN (SELECT id FROM clubs WHERE created_by = auth.uid())
);
