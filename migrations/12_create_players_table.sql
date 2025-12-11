-- 12_create_players_table.sql

-- 1. Create Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL, -- Player can be in the club verification pool without a team? Or required? User said "Select Team", implies required. Let's leave nullable for flexibility but enforce in frontend/trigger if needed.
    
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Masculino', 'Femenino')),
    height INT, -- in cm
    position TEXT,
    jersey_number INT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- A. View Policies
-- Club owners can view their players
CREATE POLICY "Club owners view players" ON players
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = players.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- Members can view players (e.g. teammates) - Simplified to Club Members for now
CREATE POLICY "Club members view players" ON players
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = players.club_id
        AND club_members.profile_id = auth.uid()
    )
);

-- B. Write Policies (Insert/Update/Delete) - Owner Only for now
CREATE POLICY "Club owners manage players" ON players
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = players.club_id
        AND clubs.created_by = auth.uid()
    )
);

-- 4. Age Validation Trigger Function
CREATE OR REPLACE FUNCTION validate_player_age_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    cat_min INT;
    cat_max INT;
    player_age INT;
    team_name TEXT;
BEGIN
    -- Only validate if assigned to a team
    IF NEW.team_id IS NOT NULL THEN
        
        -- Get category limits and team name
        SELECT c.edad_min, c.edad_max, t.nombre INTO cat_min, cat_max, team_name
        FROM teams t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = NEW.team_id;

        -- Check if category bounds exist
        IF cat_min IS NOT NULL AND cat_max IS NOT NULL THEN
            -- Calculate Age (Simplistic: Year difference)
            -- More precise: EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.dob))
            player_age := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.dob));

            IF player_age < cat_min OR player_age > cat_max THEN
                RAISE EXCEPTION 'El jugador tiene % años, pero el equipo "%" es para edades entre % y %.', player_age, team_name, cat_min, cat_max;
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach Trigger
DROP TRIGGER IF EXISTS trg_validate_player_age ON players;
CREATE TRIGGER trg_validate_player_age
BEFORE INSERT OR UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION validate_player_age_on_insert();
