-- 21_social_matchmaking.sql

-- TABLE: match_posts
-- Description: Stores offers for friendlies (topes) and tournaments.
-- This acts as the "Marketplace" or "Social Feed" for the app.

CREATE TABLE match_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE, -- The Host Club
    type TEXT CHECK (type IN ('friendly', 'tournament')), -- 'tope' or 'torneo'
    title TEXT NOT NULL, -- e.g. "Tope Sub-18 Femenino"
    description TEXT,
    date_start DATE NOT NULL,
    date_end DATE, -- Optional, mostly for tournaments
    time TEXT, -- e.g. "14:00" or "TBD"
    location TEXT NOT NULL,
    level TEXT, -- e.g. "Inicial", "Intermedio", "Avanzado"
    
    -- Hospitality Options (JSONB for flexibility)
    -- Structure: { "housing": true/false, "food": true/false, "transport": true/false, "notes": "..." }
    hospitality JSONB DEFAULT '{}'::jsonb,
    
    contact_info TEXT, -- WhatsApp number or email to show publicly
    
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS POLICIES

ALTER TABLE match_posts ENABLE ROW LEVEL SECURITY;

-- 1. READ: Public (Everyone can see the feed)
CREATE POLICY "Public view match_posts" ON match_posts
FOR SELECT
USING (true);

-- 2. INSERT: Authenticated Users (Clubs) can post
CREATE POLICY "Clubs create match_posts" ON match_posts
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 3. UPDATE/DELETE: Only the creator (Owner/Member of the club acting as creator)
-- Ideally check if auth.uid() is the creator or an admin of the club. 
-- For MVP simplification, we rely on 'created_by' which should be the user's ID.
CREATE POLICY "Creators manage match_posts" ON match_posts
FOR ALL
USING (auth.uid() = created_by);

-- INDEXES
CREATE INDEX idx_match_posts_status ON match_posts(status);
CREATE INDEX idx_match_posts_date_start ON match_posts(date_start);
