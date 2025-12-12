-- 31_generate_club_code.sql

-- 1. Ensure 'codigo' column exists and is unique
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE;

-- 2. Create a function to generate random club codes
CREATE OR REPLACE FUNCTION generate_unique_club_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    -- Only generate if not provided
    IF NEW.codigo IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Loop until unique
    WHILE NOT done LOOP
        -- Generate random string: CLUB-XXXX (where X is A-Z0-9)
        new_code := 'CLUB-' || upper(substring(md5(random()::text) from 1 for 4));
        
        -- Check uniqueness
        PERFORM 1 FROM clubs WHERE codigo = new_code;
        IF NOT FOUND THEN
            done := TRUE;
        END IF;
    END LOOP;

    NEW.codigo := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger (Before Insert)
DROP TRIGGER IF EXISTS trg_generate_club_code ON clubs;
CREATE TRIGGER trg_generate_club_code
BEFORE INSERT ON clubs
FOR EACH ROW
EXECUTE FUNCTION generate_unique_club_code();

-- 4. Backfill existing clubs
DO $$
DECLARE
    r RECORD;
    new_code TEXT;
    done BOOLEAN;
BEGIN
    FOR r IN SELECT id FROM clubs WHERE codigo IS NULL LOOP
        done := FALSE;
        WHILE NOT done LOOP
            new_code := 'CLUB-' || upper(substring(md5(random()::text) from 1 for 4)); -- e.g. CLUB-A1B2
            
            PERFORM 1 FROM clubs WHERE codigo = new_code;
            IF NOT FOUND THEN
                UPDATE clubs SET codigo = new_code WHERE id = r.id;
                done := TRUE;
            END IF;
        END LOOP;
    END LOOP;
END $$;
