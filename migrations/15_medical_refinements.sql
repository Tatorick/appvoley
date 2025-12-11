-- 15_medical_refinements.sql

-- Add insurance_number to medical_profiles
ALTER TABLE medical_profiles 
ADD COLUMN IF NOT EXISTS insurance_number TEXT;

-- Ensure RLS policies are good (already done in 14, but good to double check implicit adds are covered by 'ALL' or 'SELECT' policies).
-- The existing policies on medical_profiles use "FOR ALL" for owners and "FOR SELECT" for members, so new columns are covered.
