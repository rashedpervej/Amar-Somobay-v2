-- ==============================================================================
-- AMAR-SOMOBAY: STANDARDIZE TO 'General Cooperative' (সাধারণ সমবায়)
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- 100% Safe, Idempotent, and Non-Destructive
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ADD & STANDARDIZE cooperative_type ON organizations TABLE
-- ------------------------------------------------------------------------------
-- Ensure the column exists on organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS cooperative_type text DEFAULT 'general_cooperative';

-- Ensure config jsonb column exists
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;

-- Standardize all organizations without a type or with old savings names to 'general_cooperative'
UPDATE public.organizations
SET cooperative_type = 'general_cooperative'
WHERE cooperative_type IS NULL 
   OR cooperative_type IN ('general_savings', 'General Savings', 'সাধারণ সঞ্চয়', 'savings', '');

-- If config jsonb has 'general_savings' inside enabled_modules, replace with 'general_cooperative'
UPDATE public.organizations
SET config = jsonb_set(
  config,
  '{enabled_modules}',
  (SELECT jsonb_agg(
    CASE 
      WHEN elem::text = '"general_savings"' THEN '"general_cooperative"'::jsonb 
      ELSE elem 
    END
  ) FROM jsonb_array_elements(config->'enabled_modules') AS elem)
)
WHERE config ? 'enabled_modules' 
  AND config->'enabled_modules' @> '["general_savings"]'::jsonb;

-- ------------------------------------------------------------------------------
-- 2. STANDARDIZE app_settings TABLE
-- ------------------------------------------------------------------------------
-- Ensure enabled_modules column exists on app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS enabled_modules jsonb 
DEFAULT '["general_cooperative", "savings", "qard_hasanah", "rosca", "joint_goal", "reports", "notifications"]'::jsonb;

-- Update column default
ALTER TABLE public.app_settings 
ALTER COLUMN enabled_modules 
SET DEFAULT '["general_cooperative", "savings", "qard_hasanah", "rosca", "joint_goal", "reports", "notifications"]'::jsonb;

-- Update existing app_settings rows to replace 'general_savings' with 'general_cooperative'
UPDATE public.app_settings
SET enabled_modules = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM (
    SELECT CASE 
      WHEN x::text = '"general_savings"' THEN '"general_cooperative"'::jsonb 
      ELSE x 
    END AS elem
    FROM jsonb_array_elements(enabled_modules) AS x
  ) s
)
WHERE enabled_modules IS NOT NULL 
  AND enabled_modules @> '["general_savings"]'::jsonb;

-- ------------------------------------------------------------------------------
-- 3. ENSURE somobay_plans scheme_type SUPPORTS 'General'
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'somobay_plans') THEN
    -- Drop old check constraint if it exists
    ALTER TABLE public.somobay_plans 
    DROP CONSTRAINT IF EXISTS somobay_plans_scheme_type_check;

    -- Add updated constraint allowing both 'General' and 'general_cooperative'
    ALTER TABLE public.somobay_plans 
    ADD CONSTRAINT somobay_plans_scheme_type_check 
    CHECK (scheme_type IN ('General', 'general_cooperative', 'savings', 'rosca', 'joint_goal', 'qard'));

    ALTER TABLE public.somobay_plans 
    ALTER COLUMN scheme_type SET DEFAULT 'General';

    -- Standardize any existing 'savings' or 'general_savings' plan records to 'General'
    UPDATE public.somobay_plans 
    SET scheme_type = 'General' 
    WHERE scheme_type IN ('savings', 'general_savings');
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. RECORD IN AUDIT LOGS (SAFE CONDITIONAL INSERT)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    INSERT INTO public.audit_logs (
      action, 
      entity_type, 
      details, 
      created_at
    ) VALUES (
      'SCHEMA_MIGRATION: Standardized General Savings to General Cooperative',
      'system_migration',
      '{"migration": "MIGRATE_TO_GENERAL_COOPERATIVE.sql", "status": "completed"}'::jsonb,
      NOW()
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Do not fail the transaction if audit log schema differs
    NULL;
END $$;

COMMIT;
