-- Migration: Add final result columns to tournaments table
-- Run this in Supabase SQL Editor

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS final_position integer,
  ADD COLUMN IF NOT EXISTS final_notes     text;

-- Update the status check constraint to allow 'finished' status (if one exists)
-- Safe to run even if the constraint doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tournaments' AND constraint_name = 'tournaments_status_check'
  ) THEN
    ALTER TABLE tournaments DROP CONSTRAINT tournaments_status_check;
    ALTER TABLE tournaments
      ADD CONSTRAINT tournaments_status_check
      CHECK (status IN ('planned', 'confirmed', 'canceled', 'finished'));
  END IF;
END $$;
