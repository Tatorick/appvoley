-- 24_create_attendance_tables.sql

-- 1. Training Sessions Table
CREATE TABLE training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    topic TEXT, -- e.g. "Defense Drills", "Physical"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Attendance Records Table
CREATE TABLE attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: One record per player per session
    UNIQUE(session_id, player_id) 
);

-- RLS
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policies for Sessions
CREATE POLICY "Club view sessions" ON training_sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = training_sessions.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = training_sessions.club_id
        AND club_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Staff manage sessions" ON training_sessions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = training_sessions.club_id
        AND clubs.created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = training_sessions.club_id
        AND club_members.profile_id = auth.uid()
        AND club_members.role IN ('admin', 'coach')
    )
);

-- Policies for Attendance Records
-- View: Same as sessions (if you can see session, you can see attendance)
CREATE POLICY "Club view attendance" ON attendance
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM training_sessions
        WHERE training_sessions.id = attendance.session_id
        AND (
            EXISTS (
                SELECT 1 FROM clubs 
                WHERE clubs.id = training_sessions.club_id 
                AND clubs.created_by = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = training_sessions.club_id
                AND club_members.profile_id = auth.uid()
            )
        )
    )
);

-- Manage: Staff
CREATE POLICY "Staff manage attendance" ON attendance
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM training_sessions
        WHERE training_sessions.id = attendance.session_id
        AND (
             EXISTS (
                SELECT 1 FROM clubs 
                WHERE clubs.id = training_sessions.club_id 
                AND clubs.created_by = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = training_sessions.club_id
                AND club_members.profile_id = auth.uid()
                AND club_members.role IN ('admin', 'coach')
            )
        )
    )
);
