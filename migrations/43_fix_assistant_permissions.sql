-- 43_fix_assistant_permissions.sql
-- Permite que los asistentes (staff/assistant) puedan registrar resultados de partidos y gestionar el matchmaking

-- 1. Actualizar permisos de la tabla Matches (Estadísticas / Resultados)
DROP POLICY IF EXISTS "Staff manage matches" ON matches;

CREATE POLICY "Staff manage matches" ON matches
FOR ALL USING (
    is_club_owner(club_id)
    OR get_club_role(club_id) IN ('owner', 'admin', 'coach', 'assistant', 'staff', 'entrenador_principal')
);

-- Nota: match_posts (Matchmaking) ya tiene una política abierta para creadores:
-- "Clubs create match_posts" (auth.uid() = created_by)
-- Así que con el cambio en React (Matchmaking.jsx) es suficiente para el frontend.
