-- Add gender column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS genero VARCHAR(20) DEFAULT 'Mixto';

-- Optional: Add a check constraint for valid values
ALTER TABLE teams ADD CONSTRAINT valid_gender CHECK (genero IN ('Masculino', 'Femenino', 'Mixto'));

-- Add comments
COMMENT ON COLUMN teams.genero IS 'Gender of the team: Masculino, Femenino, or Mixto';
