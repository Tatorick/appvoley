-- 50_add_indexes.sql
-- SAFE: Only adds indexes — improves query speed, does NOT change behavior
-- Run this in Supabase SQL Editor

-- Players
CREATE INDEX IF NOT EXISTS idx_players_club ON players(club_id);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_club ON teams(club_id);

-- Tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_club ON tournaments(club_id);

-- Club Members
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_profile ON club_members(profile_id);

-- Matchmaking
CREATE INDEX IF NOT EXISTS idx_matchmaking_club ON matchmaking_posts(club_id);
