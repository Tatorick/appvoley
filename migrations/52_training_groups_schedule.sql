-- Migration 52: Training Groups - Add schedule columns to teams
-- Adds support for formative groups with recurring schedules

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'competicion'
    CHECK (tipo IN ('formativo', 'competicion')),
  ADD COLUMN IF NOT EXISTS dias_semana TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hora_inicio TIME,
  ADD COLUMN IF NOT EXISTS hora_fin TIME,
  ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Existing teams default to 'competicion' which is already set by DEFAULT

-- Index for quick filtering by tipo
CREATE INDEX IF NOT EXISTS idx_teams_tipo ON teams(tipo);
