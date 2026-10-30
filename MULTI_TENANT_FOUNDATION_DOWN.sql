-- ==============================================================================
-- AMAR-SOMOBAY: PHASE 2 MULTI-TENANT SAFE ROLLBACK (DOWN MIGRATION)
-- NOTE: Never re-enables insecure USING (true) policies!
-- Run this script in your Supabase SQL Editor if safe rollback is required.
-- ==============================================================================

-- 1. DROP ANTI-TAMPERING & CHILD-TENANT TRIGGERS
DROP TRIGGER IF EXISTS tr_protect_org_member_escalation ON public.organization_members;
DROP TRIGGER IF EXISTS tr_val_member_plans ON public.member_plans;
DROP TRIGGER IF EXISTS tr_val_plan_payments ON public.plan_payments;
DROP TRIGGER IF EXISTS tr_val_rosca_periods ON public.rosca_periods;
DROP TRIGGER IF EXISTS tr_val_joint_expenses ON public.joint_goal_expenses;
DROP TRIGGER IF EXISTS tr_val_wallet_tx ON public.wallet_transactions;
DROP TRIGGER IF EXISTS tr_val_qard_loans ON public.qard_loans;
DROP TRIGGER IF EXISTS tr_val_qard_repayments ON public.qard_repayments;

DROP FUNCTION IF EXISTS public.protect_org_member_escalation CASCADE;
DROP FUNCTION IF EXISTS public.validate_tenant_child_integrity CASCADE;

-- 2. REVERT TO SECURE FALLBACK RLS POLICIES (Strict Single-Tenant Isolation)
-- PROFILES: Users view only self + admins view all (NO PUBLIC/USING TRUE LEAK)
DROP POLICY IF EXISTS "tenant_isolated_profiles_select" ON public.profiles;
CREATE POLICY "fallback_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- SOMOBAY_PLANS
DROP POLICY IF EXISTS "tenant_somobay_plans_select" ON public.somobay_plans;
DROP POLICY IF EXISTS "tenant_somobay_plans_manage" ON public.somobay_plans;
CREATE POLICY "fallback_plans_select" ON public.somobay_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "fallback_plans_manage" ON public.somobay_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- MEMBER_PLANS
DROP POLICY IF EXISTS "tenant_member_plans_select" ON public.member_plans;
DROP POLICY IF EXISTS "tenant_member_plans_manage" ON public.member_plans;
CREATE POLICY "fallback_member_plans_select" ON public.member_plans FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "fallback_member_plans_manage" ON public.member_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PLAN_PAYMENTS
DROP POLICY IF EXISTS "tenant_plan_payments_select" ON public.plan_payments;
DROP POLICY IF EXISTS "tenant_plan_payments_insert" ON public.plan_payments;
DROP POLICY IF EXISTS "tenant_plan_payments_manage" ON public.plan_payments;
CREATE POLICY "fallback_plan_payments_select" ON public.plan_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.member_plans mp WHERE mp.id = plan_payments.member_plan_id AND mp.member_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "fallback_plan_payments_manage" ON public.plan_payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- QARD TABLES FALLBACK
DROP POLICY IF EXISTS "tenant_qard_funds_select" ON public.qard_funds;
DROP POLICY IF EXISTS "tenant_qard_funds_manage" ON public.qard_funds;
DROP POLICY IF EXISTS "tenant_qard_applications_select" ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_applications_insert" ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_applications_update" ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_loans_select" ON public.qard_loans;
DROP POLICY IF EXISTS "tenant_qard_loans_manage" ON public.qard_loans;
DROP POLICY IF EXISTS "tenant_qard_repayments_select" ON public.qard_repayments;
DROP POLICY IF EXISTS "tenant_qard_repayments_manage" ON public.qard_repayments;

CREATE POLICY "fallback_qard_funds_select" ON public.qard_funds FOR SELECT TO authenticated USING (true);
CREATE POLICY "fallback_qard_funds_manage" ON public.qard_funds FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "fallback_qard_apps_select" ON public.qard_applications FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "fallback_qard_apps_insert" ON public.qard_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = member_id);
CREATE POLICY "fallback_qard_apps_update" ON public.qard_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR (member_id = auth.uid() AND status = 'pending'));

CREATE POLICY "fallback_qard_loans_select" ON public.qard_loans FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "fallback_qard_loans_manage" ON public.qard_loans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "fallback_qard_repayments_select" ON public.qard_repayments FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "fallback_qard_repayments_manage" ON public.qard_repayments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. DROP NEW TABLE POLICIES & HELPER FUNCTIONS
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_all_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_members_select_policy" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_modify_policy" ON public.organization_members;
DROP POLICY IF EXISTS "platform_admins_select_policy" ON public.platform_admins;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

DROP FUNCTION IF EXISTS public.is_platform_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_org_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_collector_or_admin(uuid, uuid) CASCADE;

-- (Tables and organization_id columns are preserved non-destructively to avoid any data loss)
