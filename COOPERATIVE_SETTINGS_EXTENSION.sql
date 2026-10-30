-- ==============================================================================
-- AMAR-SOMOBAY: COOPERATIVE SETUP & GENERAL SAVINGS EXTENSIONS (NON-DESTRUCTIVE)
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- 1. ADD EXTENSIBLE JSONB CONFIGURATION COLUMNS TO organizations & app_settings
DO $$
BEGIN
  -- organizations: metadata for 6-step creation details (legal, committee, modules)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'config'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN config jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- app_settings: enabled_modules list and general savings preferences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'enabled_modules'
  ) THEN
    ALTER TABLE public.app_settings 
    ADD COLUMN enabled_modules jsonb DEFAULT '["general_cooperative", "savings", "qard_hasanah", "rosca", "joint_goal", "reports", "notifications"]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'savings_config'
  ) THEN
    ALTER TABLE public.app_settings 
    ADD COLUMN savings_config jsonb DEFAULT '{
      "currency": "BDT",
      "default_savings_method": "both",
      "min_deposit": 50,
      "allow_partial_deposit": true,
      "allow_withdrawals": true,
      "require_withdrawal_approval": true,
      "auto_reminders": true
    }'::jsonb;
  END IF;
END $$;

-- 2. NON-DESTRUCTIVE POLICIES FOR COOPERATIVE CREATION
-- Allows authenticated user to create their cooperative organization
DROP POLICY IF EXISTS "org_insert_policy" ON public.organizations;
CREATE POLICY "org_insert_policy" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allows authenticated user creating an organization to assign themselves as cooperative_admin
DROP POLICY IF EXISTS "org_members_creator_insert_policy" ON public.organization_members;
CREATE POLICY "org_members_creator_insert_policy" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_org_admin(organization_id, auth.uid()) OR 
    public.is_platform_admin(auth.uid())
  );

