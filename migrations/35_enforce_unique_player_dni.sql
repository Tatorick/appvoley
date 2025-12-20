-- 35_enforce_unique_player_dni.sql

-- 1. Add UNIQUE constraint to 'dni' column in 'players' table.
-- This ensures that a player (identified by DNI) cannot be registered more than once in the entire database.
-- Since players belong to a club via 'club_id', this effectively prevents a player from being in multiple clubs
-- (unless they are deleted from one first).

-- Note: This might fail if there are already duplicate DNIs in the database.
-- If so, duplicates must be resolved manually before applying.

ALTER TABLE players
ADD CONSTRAINT players_dni_key UNIQUE (dni);

-- 2. Ensure DNI is not null (optional but recommended if it's the unique identifier)
-- We'll leave it nullable for now in case there are legacy players without DNI, 
-- but the unique constraint will allow multiple NULLs (standard SQL behavior) 
-- or just one NULL depending on DB, usually multiple.
-- Ideally, we should enforce NOT NULL for new players, but let's stick to the unique constraint first.
