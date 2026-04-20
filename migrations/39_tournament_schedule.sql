-- 39_tournament_schedule.sql
-- Calendario de partidos para cada torneo.
-- Cada partido tiene su propia cancha (venue), fecha, hora, rival, fase y resultado.

CREATE TABLE tournament_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    match_date DATE NOT NULL,
    match_time TIME,                        -- Hora del partido (puede ser NULL si aún no se define)
    opponent TEXT NOT NULL,                 -- Nombre del rival (texto libre)
    venue TEXT,                             -- Cancha/sede de ESTE partido (puede diferir entre partidos del torneo)
    phase TEXT DEFAULT 'Fase de grupos',    -- 'Fase de grupos', 'Cuartos', 'Semifinal', 'Final', etc.
    our_score INT,                          -- Marcador propio (NULL hasta que se juegue)
    opponent_score INT,                     -- Marcador rival (NULL hasta que se juegue)
    status TEXT DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'completed', 'canceled')),
    notes TEXT,                             -- Observaciones del entrenador
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE tournament_schedule ENABLE ROW LEVEL SECURITY;

-- Coaches, admins y owners gestionan (INSERT, UPDATE, DELETE)
CREATE POLICY "Coaches manage tournament schedule" ON tournament_schedule
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tournaments t
        JOIN club_members cm ON t.club_id = cm.club_id
        WHERE t.id = tournament_schedule.tournament_id
        AND cm.profile_id = auth.uid()
        AND cm.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tournaments t
        JOIN club_members cm ON t.club_id = cm.club_id
        WHERE t.id = tournament_schedule.tournament_id
        AND cm.profile_id = auth.uid()
        AND cm.role_in_club IN ('owner', 'admin', 'coach', 'entrenador_principal')
    )
);

-- Todos los miembros del club pueden ver el calendario
CREATE POLICY "Club members view schedule" ON tournament_schedule
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tournaments t
        JOIN club_members cm ON t.club_id = cm.club_id
        WHERE t.id = tournament_schedule.tournament_id
        AND cm.profile_id = auth.uid()
    )
);

-- Índice para consultas frecuentes por torneo
CREATE INDEX idx_tournament_schedule_tournament_id ON tournament_schedule(tournament_id);
CREATE INDEX idx_tournament_schedule_match_date ON tournament_schedule(match_date);
