-- ==============================================================================
-- AMAR-SOMOBAY: PHASE 2 MULTI-TENANT ARCHITECTURE FOUNDATION (UP MIGRATION)
-- Complete, Hardened, Non-Recursive RLS with Child-Parent Tenant Integrity
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. BASE ENTITIES & PLATFORM TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  reg_number text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('cooperative_admin', 'collector', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'platform_owner' CHECK (permission_level IN ('platform_owner', 'auditor')),
  granted_by text NOT NULL DEFAULT 'SUPERUSER_SQL',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. NON-RECURSIVE SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id uuid, p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.organization_members
  WHERE organization_id = p_org_id 
    AND user_id = p_user_id 
    AND status = 'active';
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id 
      AND user_id = p_user_id 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (public.get_user_org_role(p_org_id, p_user_id) = 'cooperative_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_org_collector_or_admin(p_org_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.get_user_org_role(p_org_id, p_user_id);
  RETURN (v_role IN ('cooperative_admin', 'collector'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_user_org_role(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_org_member(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_org_collector_or_admin(uuid, uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_collector_or_admin(uuid, uuid) TO authenticated;

-- 3. SEED DEFAULT ORGANIZATION ('গ্রামীণ সমবায় লিমিটেড')
-- ==============================================================================

INSERT INTO public.organizations (id, name, slug, reg_number, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'গ্রামীণ সমবায় লিমিটেড',
  'gramin-somobay',
  NULL,
  'active'
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. ADD organization_id TO ALL TENANT-OWNED TABLES & BACKFILL
-- ==============================================================================

DO $$
DECLARE
  v_default_org uuid := '00000000-0000-0000-0000-000000000001';
  t text;
  tables text[] := ARRAY[
    'app_settings', 'somobay_plans', 'member_plans', 'plan_payments',
    'rosca_periods', 'joint_goal_expenses', 'member_wallets', 'wallet_transactions',
    'promotions', 'notifications', 'qard_funds', 'qard_applications',
    'qard_loans', 'qard_repayments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'organization_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE', t);
    END IF;

    EXECUTE format('UPDATE public.%I SET organization_id = %L WHERE organization_id IS NULL', t, v_default_org);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_organization_id ON public.%I(organization_id)', t, t);
  END LOOP;
END $$;

-- 5. MIGRATE EXISTING 8 USERS INTO organization_members
-- ==============================================================================

INSERT INTO public.organization_members (organization_id, user_id, role, status)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  p.id,
  CASE 
    WHEN p.role = 'admin' THEN 'cooperative_admin'
    ELSE 'member'
  END,
  CASE 
    WHEN p.role = 'pending' THEN 'pending'
    ELSE 'active'
  END
FROM public.profiles p
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 6. SEED PLATFORM OWNER (Rashed Pervej)
-- ==============================================================================

INSERT INTO public.platform_admins (user_id, permission_level, granted_by)
SELECT '2c97334f-6cde-4557-a0ce-e2a3a684f8f2', 'platform_owner', 'SUPERUSER_MIGRATION'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = '2c97334f-6cde-4557-a0ce-e2a3a684f8f2');

-- 7. ANTI-TAMPERING & RELATED-RECORD INTEGRITY TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.protect_org_member_escalation()
RETURNS trigger AS $$
BEGIN
  IF OLD.user_id = auth.uid() AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: আপনি নিজের মেম্বারশিপ রোল পরিবর্তন করতে পারবেন না।';
    END IF;
  END IF;

  IF NOT (public.is_org_admin(NEW.organization_id, auth.uid()) OR public.is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: শুধুমাত্র সমবায় অ্যাডমিন সদস্যদের রোল বা স্ট্যাটাস পরিবর্তন করতে পারবেন।';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_protect_org_member_escalation ON public.organization_members;
CREATE TRIGGER tr_protect_org_member_escalation
  BEFORE UPDATE OR INSERT ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_org_member_escalation();

CREATE OR REPLACE FUNCTION public.validate_tenant_child_integrity()
RETURNS trigger AS $$
DECLARE
  v_parent_org uuid;
BEGIN
  -- 1. member_plans -> somobay_plans
  IF TG_TABLE_NAME = 'member_plans' AND NEW.plan_id IS NOT NULL THEN
    SELECT organization_id INTO v_parent_org FROM public.somobay_plans WHERE id = NEW.plan_id;
    IF v_parent_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: সদস্যের স্কিম ও মূল স্কিমের সমবায় এক হতে হবে।';
    END IF;
  END IF;

  -- 2. plan_payments -> member_plans
  IF TG_TABLE_NAME = 'plan_payments' AND NEW.member_plan_id IS NOT NULL THEN
    SELECT organization_id INTO v_parent_org FROM public.member_plans WHERE id = NEW.member_plan_id;
    IF v_parent_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: পেমেন্ট ও সদস্যের প্ল্যান একই সমবায়ের হতে হবে।';
    END IF;
  END IF;

  -- 3. rosca_periods -> somobay_plans
  IF TG_TABLE_NAME = 'rosca_periods' AND NEW.plan_id IS NOT NULL THEN
    SELECT organization_id INTO v_parent_org FROM public.somobay_plans WHERE id = NEW.plan_id;
    IF v_parent_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: রোস্কা চক্র ও প্ল্যানের সমবায় এক হতে হবে।';
    END IF;
  END IF;

  -- 4. joint_goal_expenses -> somobay_plans
  IF TG_TABLE_NAME = 'joint_goal_expenses' AND NEW.plan_id IS NOT NULL THEN
    SELECT organization_id INTO v_parent_org FROM public.somobay_plans WHERE id = NEW.plan_id;
    IF v_parent_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: যৌথ ব্যয় ও স্কিমের সমবায় এক হতে হবে।';
    END IF;
  END IF;

  -- 5. wallet_transactions -> member_wallets (via member_id = user_id)
  IF TG_TABLE_NAME = 'wallet_transactions' AND NEW.member_id IS NOT NULL THEN
    SELECT organization_id INTO v_parent_org FROM public.member_wallets WHERE user_id = NEW.member_id LIMIT 1;
    IF v_parent_org IS NOT NULL AND v_parent_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: লেনদেন ও ওয়ালেটের সমবায় এক হতে হবে।';
    END IF;
  END IF;

  -- 6. qard_loans -> qard_applications
  IF TG_TABLE_NAME = 'qard_loans' AND NEW.application_id IS NOT NULL THEN
    SELECT organization_id INTO v_parent_org FROM public.qard_applications WHERE id = NEW.application_id;
    IF v_parent_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: কর্জ ঋণ ও মূল আবেদনের সমবায় এক হতে হবে।';
    END IF;
  END IF;

  -- 7. qard_repayments -> qard_loans
  IF TG_TABLE_NAME = 'qard_repayments' AND NEW.loan_id IS NOT NULL THEN
    SELECT organization_id INTO v_parent_org FROM public.qard_loans WHERE id = NEW.loan_id;
    IF v_parent_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: কিস্তি পরিশোধ ও ঋণের সমবায় এক হতে হবে।';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_val_member_plans ON public.member_plans;
CREATE TRIGGER tr_val_member_plans BEFORE INSERT OR UPDATE ON public.member_plans FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_child_integrity();

DROP TRIGGER IF EXISTS tr_val_plan_payments ON public.plan_payments;
CREATE TRIGGER tr_val_plan_payments BEFORE INSERT OR UPDATE ON public.plan_payments FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_child_integrity();

DROP TRIGGER IF EXISTS tr_val_rosca_periods ON public.rosca_periods;
CREATE TRIGGER tr_val_rosca_periods BEFORE INSERT OR UPDATE ON public.rosca_periods FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_child_integrity();

DROP TRIGGER IF EXISTS tr_val_joint_expenses ON public.joint_goal_expenses;
CREATE TRIGGER tr_val_joint_expenses BEFORE INSERT OR UPDATE ON public.joint_goal_expenses FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_child_integrity();

DROP TRIGGER IF EXISTS tr_val_wallet_tx ON public.wallet_transactions;
CREATE TRIGGER tr_val_wallet_tx BEFORE INSERT OR UPDATE ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_child_integrity();

DROP TRIGGER IF EXISTS tr_val_qard_loans ON public.qard_loans;
CREATE TRIGGER tr_val_qard_loans BEFORE INSERT OR UPDATE ON public.qard_loans FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_child_integrity();

DROP TRIGGER IF EXISTS tr_val_qard_repayments ON public.qard_repayments;
CREATE TRIGGER tr_val_qard_repayments BEFORE INSERT OR UPDATE ON public.qard_repayments FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_child_integrity();

-- 8. COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 8a. organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;
CREATE POLICY "org_select_policy" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id, auth.uid()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "org_all_policy" ON public.organizations;
CREATE POLICY "org_all_policy" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- 8b. organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_members_select_policy" ON public.organization_members;
CREATE POLICY "org_members_select_policy" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "org_members_modify_policy" ON public.organization_members;
CREATE POLICY "org_members_modify_policy" ON public.organization_members
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8c. platform_admins
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_admins_select_policy" ON public.platform_admins;
CREATE POLICY "platform_admins_select_policy" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- 8d. audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8e. profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "tenant_isolated_profiles_select" ON public.profiles;
CREATE POLICY "tenant_isolated_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members om_v
      JOIN public.organization_members om_t ON om_v.organization_id = om_t.organization_id
      WHERE om_v.user_id = auth.uid() AND om_t.user_id = profiles.id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 8f. app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings viewable by anyone" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "tenant_app_settings_select" ON public.app_settings;
DROP POLICY IF EXISTS "tenant_app_settings_manage" ON public.app_settings;

CREATE POLICY "tenant_app_settings_select" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_app_settings_manage" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8g. somobay_plans
ALTER TABLE public.somobay_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.somobay_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON public.somobay_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON public.somobay_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON public.somobay_plans;
DROP POLICY IF EXISTS "tenant_somobay_plans_select" ON public.somobay_plans;
DROP POLICY IF EXISTS "tenant_somobay_plans_manage" ON public.somobay_plans;

CREATE POLICY "tenant_somobay_plans_select" ON public.somobay_plans
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_somobay_plans_manage" ON public.somobay_plans
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8h. member_plans
ALTER TABLE public.member_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own plans" ON public.member_plans;
DROP POLICY IF EXISTS "Admins can view all member plans" ON public.member_plans;
DROP POLICY IF EXISTS "Admins can manage member plans" ON public.member_plans;
DROP POLICY IF EXISTS "tenant_member_plans_select" ON public.member_plans;
DROP POLICY IF EXISTS "tenant_member_plans_manage" ON public.member_plans;

CREATE POLICY "tenant_member_plans_select" ON public.member_plans
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid() 
    OR public.is_org_collector_or_admin(organization_id, auth.uid()) 
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "tenant_member_plans_manage" ON public.member_plans
  FOR ALL TO authenticated
  USING (public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8i. plan_payments
ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.plan_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.plan_payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.plan_payments;
DROP POLICY IF EXISTS "tenant_plan_payments_select" ON public.plan_payments;
DROP POLICY IF EXISTS "tenant_plan_payments_insert" ON public.plan_payments;
DROP POLICY IF EXISTS "tenant_plan_payments_manage" ON public.plan_payments;

CREATE POLICY "tenant_plan_payments_select" ON public.plan_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.member_plans mp WHERE mp.id = plan_payments.member_plan_id AND mp.member_id = auth.uid())
    OR public.is_org_collector_or_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "tenant_plan_payments_insert" ON public.plan_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_collector_or_admin(organization_id, auth.uid())
    OR (auth.uid() = admin_id AND public.is_org_member(organization_id, auth.uid()))
  );

CREATE POLICY "tenant_plan_payments_manage" ON public.plan_payments
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8j. rosca_periods
ALTER TABLE public.rosca_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view rosca periods" ON public.rosca_periods;
DROP POLICY IF EXISTS "Admins can manage rosca periods" ON public.rosca_periods;
DROP POLICY IF EXISTS "tenant_rosca_periods_select" ON public.rosca_periods;
DROP POLICY IF EXISTS "tenant_rosca_periods_manage" ON public.rosca_periods;

CREATE POLICY "tenant_rosca_periods_select" ON public.rosca_periods
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_rosca_periods_manage" ON public.rosca_periods
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8k. joint_goal_expenses
ALTER TABLE public.joint_goal_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view joint goal expenses" ON public.joint_goal_expenses;
DROP POLICY IF EXISTS "Admins can manage joint goal expenses" ON public.joint_goal_expenses;
DROP POLICY IF EXISTS "tenant_joint_goal_expenses_select" ON public.joint_goal_expenses;
DROP POLICY IF EXISTS "tenant_joint_goal_expenses_manage" ON public.joint_goal_expenses;

CREATE POLICY "tenant_joint_goal_expenses_select" ON public.joint_goal_expenses
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_joint_goal_expenses_manage" ON public.joint_goal_expenses
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8l. member_wallets (Correct column is user_id)
ALTER TABLE public.member_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.member_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.member_wallets;
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.member_wallets;
DROP POLICY IF EXISTS "tenant_member_wallets_select" ON public.member_wallets;
DROP POLICY IF EXISTS "tenant_member_wallets_manage" ON public.member_wallets;

CREATE POLICY "tenant_member_wallets_select" ON public.member_wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_member_wallets_manage" ON public.member_wallets
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8m. wallet_transactions (Correct column is member_id)
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can manage wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "tenant_wallet_transactions_select" ON public.wallet_transactions;
DROP POLICY IF EXISTS "tenant_wallet_transactions_manage" ON public.wallet_transactions;

CREATE POLICY "tenant_wallet_transactions_select" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "tenant_wallet_transactions_manage" ON public.wallet_transactions
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8n. qard_funds
ALTER TABLE public.qard_funds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view qard fund status" ON public.qard_funds;
DROP POLICY IF EXISTS "Admins can manage qard fund" ON public.qard_funds;
DROP POLICY IF EXISTS "tenant_qard_funds_select" ON public.qard_funds;
DROP POLICY IF EXISTS "tenant_qard_funds_manage" ON public.qard_funds;

CREATE POLICY "tenant_qard_funds_select" ON public.qard_funds
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_qard_funds_manage" ON public.qard_funds
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8o. qard_applications
ALTER TABLE public.qard_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their own qard applications" ON public.qard_applications;
DROP POLICY IF EXISTS "Members can create their own qard applications" ON public.qard_applications;
DROP POLICY IF EXISTS "Admins can view all qard applications" ON public.qard_applications;
DROP POLICY IF EXISTS "Admins can update qard applications" ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_applications_select" ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_applications_insert" ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_applications_update" ON public.qard_applications;

CREATE POLICY "tenant_qard_applications_select" ON public.qard_applications
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "tenant_qard_applications_insert" ON public.qard_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = member_id 
    AND public.is_org_member(organization_id, auth.uid())
  );

CREATE POLICY "tenant_qard_applications_update" ON public.qard_applications
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR (member_id = auth.uid() AND status = 'pending'))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR (member_id = auth.uid() AND status = 'pending'));

-- 8p. qard_loans
ALTER TABLE public.qard_loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their own qard loans" ON public.qard_loans;
DROP POLICY IF EXISTS "Admins can view all qard loans" ON public.qard_loans;
DROP POLICY IF EXISTS "Admins can manage qard loans" ON public.qard_loans;
DROP POLICY IF EXISTS "tenant_qard_loans_select" ON public.qard_loans;
DROP POLICY IF EXISTS "tenant_qard_loans_manage" ON public.qard_loans;

CREATE POLICY "tenant_qard_loans_select" ON public.qard_loans
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "tenant_qard_loans_manage" ON public.qard_loans
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8q. qard_repayments
ALTER TABLE public.qard_repayments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their own repayments" ON public.qard_repayments;
DROP POLICY IF EXISTS "Admins can view all repayments" ON public.qard_repayments;
DROP POLICY IF EXISTS "Admins can manage repayments" ON public.qard_repayments;
DROP POLICY IF EXISTS "tenant_qard_repayments_select" ON public.qard_repayments;
DROP POLICY IF EXISTS "tenant_qard_repayments_manage" ON public.qard_repayments;

CREATE POLICY "tenant_qard_repayments_select" ON public.qard_repayments
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "tenant_qard_repayments_manage" ON public.qard_repayments
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8r. promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "tenant_promotions_select" ON public.promotions;
DROP POLICY IF EXISTS "tenant_promotions_manage" ON public.promotions;

CREATE POLICY "tenant_promotions_select" ON public.promotions
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_promotions_manage" ON public.promotions
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- 8s. notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "tenant_notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "tenant_notifications_manage" ON public.notifications;

CREATE POLICY "tenant_notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_notifications_manage" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- ==============================================================================
-- END OF PHASE 2 MULTI-TENANT FOUNDATION MIGRATION
-- ==============================================================================
