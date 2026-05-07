-- ============================================================
-- Migration 46: Club Certificate Configuration
-- Adds fields needed to generate professional justification
-- and membership certificates.
-- All columns are nullable so existing data is unaffected.
-- ============================================================

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS coach_certificate_name  TEXT,
  ADD COLUMN IF NOT EXISTS coach_certificate_title TEXT DEFAULT 'Entrenador',
  ADD COLUMN IF NOT EXISTS ministerial_agreement   TEXT,
  ADD COLUMN IF NOT EXISTS club_email              TEXT,
  ADD COLUMN IF NOT EXISTS coach_signature_url     TEXT;

COMMENT ON COLUMN clubs.coach_certificate_name  IS 'Nombre del entrenador tal como aparecerá en los certificados';
COMMENT ON COLUMN clubs.coach_certificate_title IS 'Título/Cargo para certificados (Ej: Presidente, Entrenador Principal)';
COMMENT ON COLUMN clubs.ministerial_agreement   IS 'Número de Acuerdo Ministerial del club';
COMMENT ON COLUMN clubs.club_email              IS 'Correo oficial del club para pie de certificados';
COMMENT ON COLUMN clubs.coach_signature_url     IS 'URL de la imagen PNG de la firma del entrenador (almacenada en Storage)';
