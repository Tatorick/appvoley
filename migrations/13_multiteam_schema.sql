-- 13_multiteam_schema.sql

-- 1. Create Junction Table
CREATE TABLE team_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, team_id) -- Prevent duplicate assignment
);

-- 2. Migrate existing data (if any)
INSERT INTO team_assignments (player_id, team_id)
SELECT id, team_id FROM players WHERE team_id IS NOT NULL;

-- 3. Remove column from players
ALTER TABLE players DROP COLUMN team_id;

-- 4. Enable RLS
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Assignments
-- View: If you can view the team OR the player, you can view the assignment?
-- Use Club-based logic for simplicity.
CREATE POLICY "Club owners manage assignments" ON team_assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = team_assignments.team_id
        AND teams.club_id IN (
            SELECT id FROM clubs WHERE created_by = auth.uid()
        )
    )
);

CREATE POLICY "Club members view assignments" ON team_assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = team_assignments.team_id
        AND teams.club_id IN (
             SELECT club_id FROM club_members WHERE profile_id = auth.uid()
        )
    )
);

-- 6. Updated Age Validation Trigger (Strict Max Limit Only)
CREATE OR REPLACE FUNCTION validate_roster_age()
RETURNS TRIGGER AS $$
DECLARE
    cat_max INT;
    player_age INT;
    player_dob DATE;
    team_name TEXT;
    cat_name TEXT;
BEGIN
    -- Get Player Info
    SELECT dob INTO player_dob FROM players WHERE id = NEW.player_id;
    
    -- Get Team/Category Info
    SELECT t.nombre, c.nombre, c.edad_max INTO team_name, cat_name, cat_max
    FROM teams t
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = NEW.team_id;

    -- Check Validation
    IF cat_max IS NOT NULL AND player_dob IS NOT NULL THEN
        player_age := EXTRACT(YEAR FROM age(CURRENT_DATE, player_dob));

        -- VALIDATION: Player Age MUST BE <= Category Max
        -- We Allow playing UP (younger players in older categories), so we ignore Min Age.
        IF player_age > cat_max THEN
            RAISE EXCEPTION 'El jugador tiene % años, excede el límite de % años del equipo "%" (%)', player_age, cat_max, team_name, cat_name;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Attach Trigger
CREATE TRIGGER trg_validate_roster_age
BEFORE INSERT OR UPDATE ON team_assignments
FOR EACH ROW
EXECUTE FUNCTION validate_roster_age();

-- 8. Drop old trigger on players
DROP TRIGGER IF EXISTS trg_validate_player_age ON players;
DROP FUNCTION IF EXISTS validate_player_age_on_insert;
