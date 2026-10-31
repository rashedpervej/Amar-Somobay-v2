-- ============================================================================
-- D-02 · Cross-Tenant Isolation — REMEDIATION DRAFT (অনুমোদন-সাপেক্ষ)
-- ----------------------------------------------------------------------------
-- ⛔ অনুমোদন ছাড়া এই ফাইল কোনো ডেটাবেসে (staging বা production) চালানো নিষিদ্ধ।
--
-- প্রকৃতি: শুধু নীতি (policy) ও গার্ড পরিবর্তন — কোনো আর্থিক সারি বদলানো হয় না।
--   • ধাপ ৬-এর ব্যাকফিল ডিফল্টভাবে বন্ধ (ফ্ল্যাগ false) এবং এক সমবায় থাকলেই কেবল সম্ভব।
--   • প্রতিটি DROP POLICY-র পাশে লেখা আছে কোন ফাইল থেকে নীতিটি এসেছিল (অডিট ট্রেইল)।
--   • বিকল্প: একটি সময়ে একটি ধাপ চালান; প্রতিটি ধাপের পরে ধাপ ৮-এর যাচাই কুয়েরি চালান।
--
-- পূর্বশর্ত: D02_tenant_isolation__AUDIT_ONLY.sql চালিয়ে ফলাফল রিপোর্টে যুক্ত করুন।
-- নির্ভরতা: MULTI_TENANT_FOUNDATION_UP.sql-এর helper ফাংশন (is_org_member, is_org_admin,
--           is_org_collector_or_admin, is_platform_admin) আগে থেকেই থাকতে হবে; না থাকলে
--           ধাপ ২ আগে চালান।
-- ⚠️ MULTI_TENANT_FOUNDATION_DOWN.sql কখনোই চালাবেন না — এটি USING(true) নীতি ফিরিয়ে আনে।
-- ============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- ধাপ ০ · প্রিফ্লাইট: organization_id NULL সারি আছে কিনা (থাকলে অনুমান না করে থামা)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_null_org bigint := 0;
  v_default_org bigint := 0;
  v_org_count int;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
             AND table_name='somobay_plans' AND column_name='organization_id') THEN
    EXECUTE 'SELECT count(*) FROM public.somobay_plans WHERE organization_id IS NULL' INTO v_null_org;
    EXECUTE 'SELECT count(*) FROM public.somobay_plans WHERE organization_id = ''00000000-0000-0000-0000-000000000001''' INTO v_default_org;
  END IF;
  SELECT count(*) INTO v_org_count FROM public.organizations;

  RAISE NOTICE 'D-02 প্রিফ্লাইট: সমবায় সংখ্যা=% , NULL org স্কিম=% , ডিফল্ট-org স্কিম=%',
    v_org_count, v_null_org, v_default_org;

  IF v_null_org > 0 AND v_org_count > 1 THEN
    RAISE EXCEPTION
      'D-02 প্রিফ্লাইট ব্যর্থ: %টি সারিতে organization_id NULL অথচ একাধিক সমবায় আছে। কোন সমবায়ের ডেটা তা অনুমান করা হবে না — আগে ম্যানুয়াল ম্যাপিং সিদ্ধান্ত দিন (রিপোর্টের সিদ্ধান্ত-তালিকা দেখুন)।', v_null_org;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- ধাপ ১ · helper ফাংশন নিশ্চিতকরণ (SECURITY DEFINER + search_path সহ)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = p_user_id);
END; $$;

CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id uuid, p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM public.organization_members
  WHERE organization_id = p_org_id AND user_id = p_user_id AND status = 'active';
  RETURN v_role;
END; $$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  -- D-02: NULL org হলে সদস্যপদ অস্বীকার (fail closed)
  IF p_org_id IS NULL OR p_user_id IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.organization_members
                 WHERE organization_id = p_org_id AND user_id = p_user_id AND status = 'active');
END; $$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN (public.get_user_org_role(p_org_id, p_user_id) = 'cooperative_admin');
END; $$;

CREATE OR REPLACE FUNCTION public.is_org_collector_or_admin(p_org_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN (public.get_user_org_role(p_org_id, p_user_id) IN ('cooperative_admin','collector'));
END; $$;

-- প্রোফাইলের বিশেষায়িত কলাম রক্ষা (supabase_security_fixes.sql-এর ফাংশনে search_path ছিল না,
-- এবং বৈশ্বিক admin যেকোনো ব্যবহারকারীর রোল বদলাতে পারত — দুটোই ঠিক করা হলো)
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- D-02: শুধু প্ল্যাটফর্ম প্রশাসক বৈশ্বিক রোল/স্ট্যাটাস বদলাতে পারবেন
    IF NOT public.is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি (D-02): বৈশ্বিক রোল বা স্ট্যাটাস পরিবর্তনের অনুমতি নেই।';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- ধাপ ২ · USING(true) ও বৈশ্বিক-রোল নির্ভর নীতি বাতিল (উৎস ফাইলসহ তালিকা)
-- ---------------------------------------------------------------------------
-- profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;      -- প্রাথমিক Supabase setup
DROP POLICY IF EXISTS "Authenticated users can view profiles"     ON public.profiles;      -- SOMOBAY_PRODUCTION_MASTER_MIGRATION.sql:37
DROP POLICY IF EXISTS "profiles_select_policy"                    ON public.profiles;      -- FIX_PROFILES_RECURSION.sql:46, FIX_ALL_RLS_AND_STORAGE.sql:50
DROP POLICY IF EXISTS "fallback_profiles_select"                  ON public.profiles;      -- MULTI_TENANT_FOUNDATION_DOWN.sql
DROP POLICY IF EXISTS "tenant_isolated_profiles_select"           ON public.profiles;      -- MULTI_TENANT_FOUNDATION_UP.sql:347 (নতুন করে তৈরি হবে)
-- organizations
DROP POLICY IF EXISTS "org_select_policy"                         ON public.organizations; -- FIX_ALL_RLS_AND_STORAGE.sql:115 (USING(true))
DROP POLICY IF EXISTS "org_all_policy"                            ON public.organizations;
-- somobay_plans
DROP POLICY IF EXISTS "Public read somobay_plans"                 ON public.somobay_plans; -- fix_schema.sql:51 (USING(true))
DROP POLICY IF EXISTS "Anyone can view active plans"              ON public.somobay_plans; -- supabase_security_fixes.sql:112 (USING(true))
DROP POLICY IF EXISTS "Admins manage somobay_plans"               ON public.somobay_plans; -- fix_schema.sql:53 (বৈশ্বিক admin)
DROP POLICY IF EXISTS "Admins can insert or update plans"         ON public.somobay_plans; -- supabase_security_fixes.sql:117 (বৈশ্বিক admin)
DROP POLICY IF EXISTS "fallback_plans_select"                     ON public.somobay_plans; -- MULTI_TENANT_FOUNDATION_DOWN.sql:30
-- member_plans
DROP POLICY IF EXISTS "Users view own member_plans"               ON public.member_plans;  -- fix_schema.sql:56
DROP POLICY IF EXISTS "Admins manage member_plans"                ON public.member_plans;  -- fix_schema.sql:58 (বৈশ্বিক admin)
-- plan_payments
DROP POLICY IF EXISTS "Admin manage payments"                     ON public.plan_payments; -- fix_schema.sql:47 (বৈশ্বিক admin, FOR ALL)
DROP POLICY IF EXISTS "No client deletion of payments"            ON public.plan_payments;
-- rosca / joint goal / wallet
DROP POLICY IF EXISTS "Anyone can view rosca periods"             ON public.rosca_periods;         -- SOMOBAY_PRODUCTION_MASTER_MIGRATION.sql:97
DROP POLICY IF EXISTS "Anyone can view joint goal expenses"       ON public.joint_goal_expenses;   -- SOMOBAY_PRODUCTION_MASTER_MIGRATION.sql:124
DROP POLICY IF EXISTS "Authenticated users can view wallet transactions" ON public.wallet_transactions; -- PHASE_3_WORKFLOWS.sql:23
-- qard hasanah
DROP POLICY IF EXISTS "Anyone can view qard fund status"          ON public.qard_funds;    -- QARD_HASANAH_PRODUCTION_MIGRATION.sql:92
DROP POLICY IF EXISTS "fallback_qard_funds_select"                ON public.qard_funds;    -- MULTI_TENANT_FOUNDATION_DOWN.sql:62
DROP POLICY IF EXISTS "Members can view their own qard applications" ON public.qard_applications;
DROP POLICY IF EXISTS "Members can create their own qard applications" ON public.qard_applications;
DROP POLICY IF EXISTS "Admins can view all qard applications"     ON public.qard_applications;
DROP POLICY IF EXISTS "Admins can update qard applications"       ON public.qard_applications;
DROP POLICY IF EXISTS "Members can view their own qard loans"     ON public.qard_loans;
DROP POLICY IF EXISTS "Admins can view all qard loans"            ON public.qard_loans;
DROP POLICY IF EXISTS "Admins can manage qard loans"              ON public.qard_loans;
DROP POLICY IF EXISTS "tenant_qard_funds_select"                  ON public.qard_funds;
DROP POLICY IF EXISTS "tenant_qard_funds_manage"                  ON public.qard_funds;
DROP POLICY IF EXISTS "tenant_qard_applications_select"           ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_applications_insert"           ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_applications_update"           ON public.qard_applications;
DROP POLICY IF EXISTS "tenant_qard_loans_select"                  ON public.qard_loans;
DROP POLICY IF EXISTS "tenant_qard_loans_manage"                  ON public.qard_loans;
-- settings / promotions
DROP POLICY IF EXISTS "Public read app_settings"                  ON public.app_settings;  -- APP_SETTINGS_SETUP.sql:26, SETTINGS_SEGREGATION_AND_SECURITY.sql:41
DROP POLICY IF EXISTS "Allow public read access to active promotions" ON public.promotions; -- PROMOTIONS_AND_NOTICES_SCHEMA.sql:61
DROP POLICY IF EXISTS "org_members_select_policy"                 ON public.organization_members;
DROP POLICY IF EXISTS "org_members_modify_policy"                 ON public.organization_members;
DROP POLICY IF EXISTS "audit_logs_select_policy"                  ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy"                  ON public.audit_logs;

-- ---------------------------------------------------------------------------
-- ধাপ ৩ · tenant-স্কোপড নীতি পুনঃপ্রতিষ্ঠা (সব ক্রিয়া organization_id দিয়ে বাঁধা)
-- ---------------------------------------------------------------------------
-- ৩a. organizations — শুধু নিজের সমবায় + প্ল্যাটফর্ম প্রশাসক
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_organizations_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_organizations_modify" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_org_admin(id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- ৩b. organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_org_members_select" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_org_members_modify" ON public.organization_members
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- ৩c. profiles — নিজের প্রোফাইল + একই সমবায়ের সহ-সদস্য (ফোন/নাম ডিরেক্টরির জন্য)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_members om_self
      JOIN public.organization_members om_other
        ON om_other.organization_id = om_self.organization_id
      WHERE om_self.user_id = auth.uid() AND om_self.status = 'active'
        AND om_other.user_id = profiles.id AND om_other.status = 'active'
    )
  );
CREATE POLICY "tenant_profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "tenant_profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ৩d. স্কিম ও সদস্য-সংযোগ
ALTER TABLE public.somobay_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_plans_select" ON public.somobay_plans
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_plans_modify" ON public.somobay_plans
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

ALTER TABLE public.member_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_member_plans_select" ON public.member_plans
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()
    OR public.is_org_collector_or_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );
CREATE POLICY "tenant_member_plans_modify" ON public.member_plans
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- ৩e. পেমেন্ট — collector/admin জমা নিতে পারে; মুছে ফেলা কারও জন্য নয় (audit trail)
ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_payments_select" ON public.plan_payments
  FOR SELECT TO authenticated
  USING (
    collected_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.member_plans mp WHERE mp.id = plan_payments.member_plan_id AND mp.member_id = auth.uid())
    OR public.is_org_collector_or_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );
CREATE POLICY "tenant_payments_insert" ON public.plan_payments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_payments_update" ON public.plan_payments
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
-- DELETE নীতি ইচ্ছাকৃতভাবে নেই → ক্লায়েন্ট থেকে পেমেন্ট মুছে ফেলা অসম্ভব

-- ৩f. ROSCA / Joint Goal / wallet
ALTER TABLE public.rosca_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rosca_select" ON public.rosca_periods
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_rosca_modify" ON public.rosca_periods
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

ALTER TABLE public.joint_goal_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_jg_select" ON public.joint_goal_expenses
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_jg_modify" ON public.joint_goal_expenses
  FOR ALL TO authenticated
  USING (public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

ALTER TABLE public.member_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_wallets_select" ON public.member_wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_wallets_modify" ON public.member_wallets
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_wallet_tx_select" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_wallet_tx_insert" ON public.wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- ৩g. উত্তোলন
ALTER TABLE public.savings_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_withdrawals_select" ON public.savings_withdrawals
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_withdrawals_insert" ON public.savings_withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid() AND public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "tenant_withdrawals_update" ON public.savings_withdrawals
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- ৩h. কর্জে হাসানা (তহবিল আলাদা রাখা বাধ্যতামূলক)
ALTER TABLE public.qard_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_qard_funds_select" ON public.qard_funds
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_qard_funds_modify" ON public.qard_funds
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

ALTER TABLE public.qard_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_qard_apps_select" ON public.qard_applications
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_qard_apps_insert" ON public.qard_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = member_id AND public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "tenant_qard_apps_update" ON public.qard_applications
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR (member_id = auth.uid() AND status = 'pending'))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR (member_id = auth.uid() AND status = 'pending'));

ALTER TABLE public.qard_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_qard_loans_select" ON public.qard_loans
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_qard_loans_modify" ON public.qard_loans
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

ALTER TABLE public.qard_repayments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_qard_repay_select" ON public.qard_repayments
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_org_collector_or_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_qard_repay_insert" ON public.qard_repayments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_collector_or_admin(organization_id, auth.uid()) OR (member_id = auth.uid() AND public.is_org_member(organization_id, auth.uid())));

-- ৩i. নোটিফিকেশন, প্রমোশন, সেটিংস, অডিট
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NOT NULL AND (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid())));

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_promotions_select" ON public.promotions
  FOR SELECT TO authenticated
  USING (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_promotions_modify" ON public.promotions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_app_settings_select" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_app_settings_modify" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_audit_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant_audit_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NOT NULL AND (public.is_org_member(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid())));
-- অডিট লগ সম্পাদনা/মুছে ফেলা নিষিদ্ধ (কোনো UPDATE/DELETE নীতি নেই)

-- ৩j. platform_admins
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_admins_select_policy" ON public.platform_admins;
CREATE POLICY "platform_admins_select" ON public.platform_admins
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- ধাপ ৪ · member_actions — repo-তে এই টেবিলের RLS/নীতি নেই (finding F-08)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.member_actions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.member_actions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "tenant_member_actions_select" ON public.member_actions';
    EXECUTE 'CREATE POLICY "tenant_member_actions_select" ON public.member_actions
             FOR SELECT TO authenticated
             USING (user_id = auth.uid() OR public.is_org_admin(organization_id, auth.uid()) OR public.is_platform_admin(auth.uid()))';
    EXECUTE 'DROP POLICY IF EXISTS "tenant_member_actions_insert" ON public.member_actions';
    EXECUTE 'CREATE POLICY "tenant_member_actions_insert" ON public.member_actions
             FOR INSERT TO authenticated
             WITH CHECK (organization_id IS NOT NULL AND user_id = auth.uid() AND public.is_org_member(organization_id, auth.uid()))';
    RAISE NOTICE 'D-02: member_actions-এ RLS ও tenant নীতি যোগ হয়েছে (সম্পাদনা/মুছে ফেলা নিষিদ্ধ)।';
  ELSE
    RAISE NOTICE 'D-02: member_actions টেবিল নেই — ধাপ ৪ স্কিপ।';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- ধাপ ৫ · লেখার সময় organization_id বাধ্যতামূলক (fail closed ট্রিগার)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.require_tenant_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'নিরাপত্তা ত্রুটি (D-02): organization_id ছাড়া % সারি লেখা যাবে না।', TG_TABLE_NAME;
  END IF;
  IF NEW.organization_id = '00000000-0000-0000-0000-000000000001'
     AND NOT public.is_org_member(NEW.organization_id, auth.uid())
     AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'নিরাপত্তা ত্রুটি (D-02): ডিফল্ট সমবায়ে ফলব্যাক লেখা নিষিদ্ধ।';
  END IF;
  IF NOT (public.is_org_member(NEW.organization_id, auth.uid()) OR public.is_platform_admin(auth.uid())) THEN
    RAISE EXCEPTION 'নিরাপত্তা ত্রুটি (D-02): যে সমবায়ের সদস্য নন, সেখানে লেখা যাবে না।';
  END IF;
  RETURN NEW;
END; $$;

DO $$
DECLARE t text;
  tables text[] := ARRAY['somobay_plans','member_plans','plan_payments','rosca_periods',
    'joint_goal_expenses','member_wallets','wallet_transactions','promotions','notifications',
    'qard_funds','qard_applications','qard_loans','qard_repayments','savings_withdrawals','app_settings'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.'||t) IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS tr_require_tenant_org ON public.%I', t);
      EXECUTE format('CREATE TRIGGER tr_require_tenant_org BEFORE INSERT ON public.%I
                      FOR EACH ROW EXECUTE FUNCTION public.require_tenant_org()', t);
    END IF;
  END LOOP;
  RAISE NOTICE 'D-02: % টি টেবিলে organization_id বাধ্যতামূলক ট্রিগার যোগ হয়েছে।', array_length(tables,1);
END $$;

-- ---------------------------------------------------------------------------
-- ধাপ ৬ · ব্যাকফিল (ডিফল্ট বন্ধ) — এক সমবায় থাকলেই কেবল, অনুমোদন নিয়ে সক্রিয় করুন
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  allow_single_org_backfill boolean := false;   -- ⚠️ অনুমোদন পেলে true করুন
  v_org_count int;
  v_org uuid;
  t text;
  tables text[] := ARRAY['somobay_plans','member_plans','plan_payments','rosca_periods',
    'joint_goal_expenses','member_wallets','wallet_transactions','notifications',
    'qard_funds','qard_applications','qard_loans','qard_repayments','savings_withdrawals','app_settings','promotions'];
BEGIN
  IF NOT allow_single_org_backfill THEN
    RAISE NOTICE 'D-02: ব্যাকফিল বন্ধ আছে (ডিফল্ট)। NULL organization_id সারি অপরিবর্তিত থাকবে।';
    RETURN;
  END IF;

  SELECT count(*), min(id) INTO v_org_count, v_org FROM public.organizations;
  IF v_org_count <> 1 THEN
    RAISE EXCEPTION 'D-02: একাধিক সমবায় আছে (%টি) — কোন সমবায়ের ডেটা তা অনুমান করা হবে না।', v_org_count;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.'||t) IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      EXECUTE format('UPDATE public.%I SET organization_id = $1 WHERE organization_id IS NULL', t) USING v_org;
      RAISE NOTICE 'D-02: % টেবিলের NULL organization_id সারি একমাত্র সমবায়ে যুক্ত হয়েছে।', t;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- ধাপ ৭ · Storage (ড্রাফট — বাকেটের নাম জানা দরকার; অনুমোদন নিয়ে পূরণ করুন)
-- ---------------------------------------------------------------------------
-- নীতি: ফাইলের path অবশ্যই organization_id দিয়ে শুরু হবে, এবং লেখার আগে
-- membership যাচাই হবে। উদাহরণ (প্রতিটি বাকেটের জন্য আলাদা করে তৈরি করুন):
--
-- DROP POLICY IF EXISTS "tenant_scoped_receipts" ON storage.objects;
-- CREATE POLICY "tenant_scoped_receipts" ON storage.objects
--   FOR ALL TO authenticated
--   USING (
--     bucket_id = 'receipts'
--     AND public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid())
--   )
--   WITH CHECK (
--     bucket_id = 'receipts'
--     AND public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid())
--   );
--
-- প্রচলিত (পুরনো) ফাইল যেগুলো org-prefix ছাড়া আছে সেগুলোর তালিকা:
-- SELECT bucket_id, name FROM storage.objects
--  WHERE bucket_id NOT IN ('avatars','branding')
--    AND (storage.foldername(name))[1] !~* '^[0-9a-f]{8}-' LIMIT 200;

-- ---------------------------------------------------------------------------
-- ধাপ ৮ · যাচাই (প্রয়োগের পরে অবশ্যই চালান; ফলাফল রিপোর্টে যুক্ত করুন)
-- ---------------------------------------------------------------------------
-- ৮a. কোনো USING(true) নীতি অবশিষ্ট নেই
SELECT tablename, policyname, qual FROM pg_policies
WHERE schemaname='public' AND (qual ~* '\(\s*true\s*\)' OR with_check ~* '\(\s*true\s*\)');

-- ৮b. বৈশ্বিক profiles.role নির্ভর নীতি অবশিষ্ট নেই
SELECT tablename, policyname, qual FROM pg_policies
WHERE schemaname='public' AND qual ~* 'profiles' AND qual ~* '''admin''';

-- ৮c. RLS বন্ধ আছে এমন tenant টেবিল নেই
SELECT c.relname, c.relrowsecurity FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
  AND c.relname IN ('app_settings','somobay_plans','member_plans','plan_payments','rosca_periods',
    'joint_goal_expenses','member_wallets','wallet_transactions','promotions','notifications',
    'qard_funds','qard_applications','qard_loans','qard_repayments','audit_logs','member_actions',
    'savings_withdrawals','organizations','organization_members','profiles')
  AND NOT c.relrowsecurity;

-- ৮d. SECURITY DEFINER ফাংশনে search_path আছে
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prosecdef
  AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig,',') ~* 'search_path');

-- ৮e. বাস্তব পরীক্ষা (দুই test user দিয়ে, tests/d02-tenant-isolation.mjs --live):
--     A-সমবায়ের সদস্য হয়ে B-এর somobay_plans/member_plans/qard_* SELECT → ০ সারি আসতে হবে
--     B-এর সারিতে INSERT/UPDATE চেষ্টা → error 42501 আসতে হবে

-- ---------------------------------------------------------------------------
-- রোলব্যাক (প্রয়োজনে — নীতিগুলো আগের অবস্থায় ফেরানো হবে না; নিরাপদ দিকই থেকে যাবে)
-- ---------------------------------------------------------------------------
-- DROP POLICY IF EXISTS "tenant_..." ON public.<table>;   -- উপরের তালিকা অনুযায়ী
-- DROP TRIGGER IF EXISTS tr_require_tenant_org ON public.<table>;
-- DROP FUNCTION IF EXISTS public.require_tenant_org();
-- ⚠️ পুরনো USING(true) নীতি ফিরিয়ে আনা যাবে না — এগুলোই ছিল ঝুঁকির উৎস।
