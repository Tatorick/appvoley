-- 26_create_player_stats.sql

-- Table for logging performance metrics (tests/evaluations)
CREATE TABLE player_performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    
    -- Elastic metric type: 'vertical_jump', 'attack_power_1_10', 'speed_20m', 'reception_quality_1_10'
    metric_type TEXT NOT NULL, 
    
    -- Numeric value is easiest for graphing. 
    -- If it's 1-10 scale, store as number.
    -- If it's centimeters, store as number.
    value NUMERIC NOT NULL,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- RLS
ALTER TABLE player_performance_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Club members (coaches/admins) can manage logs
CREATE POLICY "Manage performance logs" ON player_performance_logs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = player_performance_logs.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = player_performance_logs.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role_in_club IN ('entrenador_principal', 'admin', 'coach', 'owner')
    )
);

-- Policy: Players can view their OWN logs (optional, if players get access later)
CREATE POLICY "Players view own logs" ON player_performance_logs
FOR SELECT
USING (
    -- If the current user LINKED to this player? 
    -- For now, we only support club members viewing. 
    -- If we had a player-user link, we'd add it here.
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = player_performance_logs.club_id
        AND club_members.profile_id = auth.uid()
    )
);
