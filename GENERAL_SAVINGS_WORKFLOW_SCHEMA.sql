-- ==============================================================================
-- AMAR-SOMOBAY: PHASE 3 GENERAL SAVINGS WORKFLOW SCHEMA MIGRATION
-- Adds Non-Destructive General Savings Extensions, Withdrawals & Ledger Policies
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. ADD NON-DESTRUCTIVE CONFIGURATION COLUMNS TO somobay_plans
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'somobay_plans' AND column_name = 'savings_type'
  ) THEN
    ALTER TABLE public.somobay_plans 
    ADD COLUMN savings_type text DEFAULT 'both' CHECK (savings_type IN ('fixed', 'flexible', 'both'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'somobay_plans' AND column_name = 'min_deposit_amount'
  ) THEN
    ALTER TABLE public.somobay_plans 
    ADD COLUMN min_deposit_amount numeric(12,2) DEFAULT 50.00 CHECK (min_deposit_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'somobay_plans' AND column_name = 'is_share_capital'
  ) THEN
    ALTER TABLE public.somobay_plans 
    ADD COLUMN is_share_capital boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'somobay_plans' AND column_name = 'allow_partial_withdraw'
  ) THEN
    ALTER TABLE public.somobay_plans 
    ADD COLUMN allow_partial_withdraw boolean DEFAULT true;
  END IF;
END $$;

-- 2. CREATE / EXTEND SAVINGS WITHDRAWALS TABLE (সঞ্চয় উত্তোলন ও নিষ্পত্তি লেজার)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.savings_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_plan_id uuid REFERENCES public.member_plans(id) ON DELETE RESTRICT,
  member_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  requested_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  purpose text,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed')),
  processed_by uuid REFERENCES public.profiles(id),
  processed_at timestamp with time zone,
  rejection_reason text,
  admin_note text,
  payment_method text DEFAULT 'নগদ',
  account_number text,
  trx_ref text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure organization_id and all necessary columns exist on savings_withdrawals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'savings_withdrawals' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.savings_withdrawals 
    ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  UPDATE public.savings_withdrawals 
  SET organization_id = '00000000-0000-0000-0000-000000000001' 
  WHERE organization_id IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'savings_withdrawals' AND column_name = 'purpose') THEN
    ALTER TABLE public.savings_withdrawals ADD COLUMN purpose text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'savings_withdrawals' AND column_name = 'reason') THEN
    ALTER TABLE public.savings_withdrawals ADD COLUMN reason text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'savings_withdrawals' AND column_name = 'account_number') THEN
    ALTER TABLE public.savings_withdrawals ADD COLUMN account_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'savings_withdrawals' AND column_name = 'admin_note') THEN
    ALTER TABLE public.savings_withdrawals ADD COLUMN admin_note text;
  END IF;
END $$;

-- Index for tenant-scoped fast lookups
CREATE INDEX IF NOT EXISTS idx_savings_withdrawals_org_id ON public.savings_withdrawals(organization_id);
CREATE INDEX IF NOT EXISTS idx_savings_withdrawals_member_id ON public.savings_withdrawals(member_id);
CREATE INDEX IF NOT EXISTS idx_savings_withdrawals_plan_id ON public.savings_withdrawals(member_plan_id);

-- 3. CHILD-PARENT TENANT INTEGRITY TRIGGER FOR SAVINGS WITHDRAWALS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.validate_savings_withdrawal_tenant()
RETURNS trigger AS $$
DECLARE
  v_plan_org uuid;
BEGIN
  SELECT organization_id INTO v_plan_org FROM public.member_plans WHERE id = NEW.member_plan_id;
  IF v_plan_org IS NOT NULL AND v_plan_org IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: উত্তোলনের আবেদন ও মূল সঞ্চয় হিসাব একই সমবায়ের হতে হবে।';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_val_savings_withdrawals ON public.savings_withdrawals;
CREATE TRIGGER tr_val_savings_withdrawals
  BEFORE INSERT OR UPDATE ON public.savings_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.validate_savings_withdrawal_tenant();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR SAVINGS WITHDRAWALS
-- ==============================================================================
ALTER TABLE public.savings_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_savings_withdrawals_select" ON public.savings_withdrawals;
CREATE POLICY "tenant_savings_withdrawals_select" ON public.savings_withdrawals
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "tenant_savings_withdrawals_insert" ON public.savings_withdrawals;
CREATE POLICY "tenant_savings_withdrawals_insert" ON public.savings_withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = member_id
    AND public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "tenant_savings_withdrawals_manage" ON public.savings_withdrawals;
CREATE POLICY "tenant_savings_withdrawals_manage" ON public.savings_withdrawals
  FOR UPDATE TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (member_id = auth.uid() AND status = 'pending')
  )
  WITH CHECK (
    public.is_org_admin(organization_id, auth.uid())
    OR (member_id = auth.uid() AND status = 'pending')
  );

-- ==============================================================================
-- END OF PHASE 3 GENERAL SAVINGS WORKFLOW SCHEMA MIGRATION
-- ==============================================================================
