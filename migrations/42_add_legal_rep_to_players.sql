-- 42_add_legal_rep_to_players.sql

-- Add Legal Representative fields to players table
ALTER TABLE players
ADD COLUMN IF NOT EXISTS legal_rep_name TEXT,
ADD COLUMN IF NOT EXISTS legal_rep_surname TEXT,
ADD COLUMN IF NOT EXISTS legal_rep_phone TEXT,
ADD COLUMN IF NOT EXISTS legal_rep_dni TEXT;
