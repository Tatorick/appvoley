-- Migration: Add cost_breakdown to tournaments
-- Run this in Supabase SQL Editor

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS cost_breakdown jsonb DEFAULT '[]'::jsonb;
