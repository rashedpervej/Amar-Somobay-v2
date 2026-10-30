-- ==============================================================================
-- MIGRATION: COOPERATIVE CODE & GENERAL SCHEME_TYPE STANDARDIZATION
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: COOPERATIVE CODE (SAM-XXXX) STANDARDIZATION
-- ------------------------------------------------------------------------------

-- 1. Ensure organizations table has cooperative_code column
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS cooperative_code text;

-- 2. Backfill cooperative_code from reg_number for existing records
UPDATE public.organizations 
SET cooperative_code = UPPER(TRIM(reg_number))
WHERE (cooperative_code IS NULL OR cooperative_code = '') 
  AND reg_number IS NOT NULL 
  AND reg_number != '';

-- 3. If any organization still lacks a code, generate unique SAM-XXXX
UPDATE public.organizations 
SET cooperative_code = 'SAM-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::text, 4, '0')
WHERE cooperative_code IS NULL OR cooperative_code = '';

-- 4. Sync reg_number and slug with cooperative_code for seamless routing compatibility
UPDATE public.organizations
SET reg_number = cooperative_code,
    slug = LOWER(cooperative_code)
WHERE cooperative_code IS NOT NULL;

-- 5. Enforce NOT NULL and UNIQUE on cooperative_code
ALTER TABLE public.organizations 
ALTER COLUMN cooperative_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_cooperative_code_unique 
ON public.organizations (UPPER(cooperative_code));

-- ------------------------------------------------------------------------------
-- PART 2: GENERAL SCHEME_TYPE STANDARDIZATION ('General')
-- ------------------------------------------------------------------------------

-- 1. Drop existing CHECK constraint and add new constraint supporting 'General'
ALTER TABLE public.somobay_plans 
DROP CONSTRAINT IF EXISTS somobay_plans_scheme_type_check;

ALTER TABLE public.somobay_plans 
ADD CONSTRAINT somobay_plans_scheme_type_check 
CHECK (scheme_type IN ('General', 'savings', 'rosca', 'joint_goal', 'qard'));

-- 2. Set database column default to 'General'
ALTER TABLE public.somobay_plans 
ALTER COLUMN scheme_type SET DEFAULT 'General';

-- 3. Safe Data Migration: Update existing 'savings' records to 'General'
-- (Leaves 'rosca', 'joint_goal', 'qard' completely intact)
UPDATE public.somobay_plans 
SET scheme_type = 'General' 
WHERE scheme_type = 'savings';

-- 4. Re-verify summary
DO $$
DECLARE
  v_org_count int;
  v_general_count int;
BEGIN
  SELECT COUNT(*) INTO v_org_count FROM public.organizations;
  SELECT COUNT(*) INTO v_general_count FROM public.somobay_plans WHERE scheme_type = 'General';
  RAISE NOTICE 'Migration Complete: % organizations updated, % plans migrated to General.', v_org_count, v_general_count;
END $$;
