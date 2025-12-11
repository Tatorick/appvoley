-- 20_add_role_column.sql

-- It seems 'club_members' was missing the 'role' column.
-- We add it safely.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'club_members'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE club_members ADD COLUMN role TEXT DEFAULT 'assistant';
        -- Optional: Add constraint
        ALTER TABLE club_members ADD CONSTRAINT check_club_member_role CHECK (role IN ('admin', 'coach', 'assistant'));
    END IF;
END $$;

-- Also checking if there was a 'rol' column by mistake and renaming it if so, finding it improbable though.
-- If 'rol' existed, the previous Rename attempts would have failed if I tried to rename 'role' to 'rol' instead of using it.
-- But let's stick to 'role' (English) to match 'club_invitations'.
