-- 48_club_logo_url.sql
-- Adds logo_url to clubs table

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN clubs.logo_url IS 'URL of the club logo image';
