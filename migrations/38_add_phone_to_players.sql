-- 38_add_phone_to_players.sql
-- Add optional phone number field to players table

ALTER TABLE players ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment for clarity
COMMENT ON COLUMN players.phone IS 'Phone number for WhatsApp notifications (format: 09XXXXXXXX or 593XXXXXXXXX)';
