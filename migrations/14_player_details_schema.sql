-- 14_player_details_schema.sql

-- 1. Medical Profiles (1:1)
CREATE TABLE medical_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
    blood_type TEXT,
    allergies TEXT,
    conditions TEXT, -- Chronic conditions, asthma, etc.
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Injuries (1:N)
CREATE TABLE player_injuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    injury_date DATE NOT NULL,
    injury_type TEXT NOT NULL, -- e.g. 'Esguince', 'Fractura', 'Muscular'
    description TEXT,
    status TEXT CHECK (status IN ('Activa', 'Recuperado', 'En Tratamiento')),
    recovery_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Physical Assessments (1:N - Time Series)
CREATE TABLE physical_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Anthropometry
    weight_kg NUMERIC(5,2),
    height_cm INT, -- Tracking height changes (growth)
    standing_reach_cm INT, -- Alcance de pie (una mano arriba)
    
    -- Performance
    attack_jump_cm INT, -- Alcance máximo en ataque
    block_jump_cm INT, -- Alcance máximo en bloqueo
    
    -- Derived stats (Virtual)
    -- vertical_jump = attack_jump_cm - standing_reach_cm
    
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS
ALTER TABLE medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;

-- Simple RLS: Club Owners manage, Members view (Maybe restrict medical view? For now open to team).

-- Medical Profiles
CREATE POLICY "Club owners manage medical" ON medical_profiles
FOR ALL USING (
    EXISTS (SELECT 1 FROM players p JOIN clubs c ON p.club_id = c.id WHERE p.id = medical_profiles.player_id AND c.created_by = auth.uid())
);
CREATE POLICY "Club members view medical" ON medical_profiles
FOR SELECT USING (
    EXISTS (SELECT 1 FROM players p JOIN club_members cm ON p.club_id = cm.club_id WHERE p.id = medical_profiles.player_id AND cm.profile_id = auth.uid())
);

-- Injuries
CREATE POLICY "Club owners manage injuries" ON player_injuries
FOR ALL USING (
    EXISTS (SELECT 1 FROM players p JOIN clubs c ON p.club_id = c.id WHERE p.id = player_injuries.player_id AND c.created_by = auth.uid())
);
CREATE POLICY "Club members view injuries" ON player_injuries
FOR SELECT USING (
    EXISTS (SELECT 1 FROM players p JOIN club_members cm ON p.club_id = cm.club_id WHERE p.id = player_injuries.player_id AND cm.profile_id = auth.uid())
);

-- Assessments
CREATE POLICY "Club owners manage assessments" ON physical_assessments
FOR ALL USING (
    EXISTS (SELECT 1 FROM players p JOIN clubs c ON p.club_id = c.id WHERE p.id = physical_assessments.player_id AND c.created_by = auth.uid())
);
CREATE POLICY "Club members view assessments" ON physical_assessments
FOR SELECT USING (
    EXISTS (SELECT 1 FROM players p JOIN club_members cm ON p.club_id = cm.club_id WHERE p.id = physical_assessments.player_id AND cm.profile_id = auth.uid())
);
