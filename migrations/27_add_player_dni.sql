-- 27_add_player_dni.sql

-- Add 'dni' column to players table
-- We use TEXT to accommodate leading zeros or formatting if needed, though clean numeric is preferred.
ALTER TABLE players
ADD COLUMN dni TEXT;

-- Optional: Add UNIQUE constraint per Club? 
-- Usually a player is unique globally, but maybe different clubs register the same person separately?
-- Let's keep it simple: No unique constraint for now to avoid blocking if multiple clubs have same player.
-- But we should index it for search.
CREATE INDEX idx_players_dni ON players(dni);
