-- ============================================================
-- Migration 45: Player Education Info (for justification certificates)
-- Adds optional school data to players table
-- All columns are nullable so existing data is unaffected
-- ============================================================

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS school_name            TEXT,
  ADD COLUMN IF NOT EXISTS school_principal       TEXT,
  ADD COLUMN IF NOT EXISTS school_principal_title TEXT DEFAULT 'Lic.',
  ADD COLUMN IF NOT EXISTS school_grade           TEXT;

COMMENT ON COLUMN players.school_name            IS 'Nombre de la institución educativa del jugador';
COMMENT ON COLUMN players.school_principal       IS 'Nombre del rector/director de la institución';
COMMENT ON COLUMN players.school_principal_title IS 'Título del rector (Lic., Dr., Ing., etc.)';
COMMENT ON COLUMN players.school_grade           IS 'Curso o nivel actual (ej. 3ro de Bachillerato, Nivel Teens 8)';
