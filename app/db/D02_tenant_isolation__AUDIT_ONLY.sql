-- ============================================================================
-- D-02 · Cross-Tenant Isolation — AUDIT ONLY (শুধু পড়া, কোনো পরিবর্তন নয়)
-- ----------------------------------------------------------------------------
-- উদ্দেশ্য: বর্তমান ডেটাবেসে organization-level isolation কোথায় দুর্বল তা প্রমাণসহ বের করা।
-- নিয়ম:   এই ফাইলে শুধু SELECT / catalog কুয়েরি আছে — চালানো নিরাপদ।
-- আউটপুট: ফলাফল reports/phase1-d01-d02-report.md-এ যুক্ত করুন।
--         যেসব সারি ঝুঁকিপূর্ণ চিহ্নিত হয়, কেবল তার জন্যই REMEDIATION ড্রাফটের
--         সংশ্লিষ্ট ধাপ অনুমোদনের জন্য উপস্থাপন করা হবে।
-- ============================================================================

-- ১. সব RLS নীতির তালিকা + ঝুঁকি চিহ্নিতকরণ
SELECT schemaname,
       tablename,
       policyname,
       cmd,
       roles,
       permissive,
       qual,
       with_check,
       CASE
         WHEN qual ~* '\(\s*true\s*\)' OR with_check ~* '\(\s*true\s*\)'
           THEN '🔴 CRITICAL: USING(true) — সব tenant-এর সারি দৃশ্যমান'
         WHEN qual ~* 'profiles' AND qual ~* '''''admin'''''
           THEN '🔴 CRITICAL: বৈশ্বিক profiles.role=''admin'' দিয়ে অ্যাক্সেস — অন্য সমবায়েও প্রযোজ্য'
         WHEN qual !~* 'organization_id|is_org_member|is_org_admin|is_platform_admin|member_id|user_id|auth\.uid'
           THEN '🟠 HIGH: tenant-স্কোপিং শর্ত অনুপস্থিত'
         ELSE '🟢 scoped'
       END AS risk
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY risk DESC, tablename, policyname;

-- ২. যেসব টেবিলে RLS চালু নেই (tenant ডেটা থাকলেও)
WITH tenant_tables(t) AS (VALUES
  ('app_settings'),('somobay_plans'),('member_plans'),('plan_payments'),
  ('rosca_periods'),('joint_goal_expenses'),('member_wallets'),('wallet_transactions'),
  ('promotions'),('notifications'),('qard_funds'),('qard_applications'),
  ('qard_loans'),('qard_repayments'),('audit_logs'),('member_actions'),
  ('savings_withdrawals'),('organizations'),('organization_members'),('profiles'),
  ('platform_admins')
)
SELECT tt.t                                          AS table_name,
       (to_regclass('public.'||tt.t) IS NOT NULL)    AS table_exists,
       c.relrowsecurity                              AS rls_enabled,
       c.relforcerowsecurity                         AS rls_forced,
       (SELECT count(*) FROM pg_policies p WHERE p.tablename = tt.t AND p.schemaname='public') AS policy_count,
       CASE WHEN to_regclass('public.'||tt.t) IS NOT NULL AND NOT c.relrowsecurity
            THEN '🔴 CRITICAL: RLS বন্ধ — authenticated/anon সব সারি পড়তে-লিখতে পারে'
            WHEN to_regclass('public.'||tt.t) IS NOT NULL AND c.relrowsecurity
                 AND (SELECT count(*) FROM pg_policies p WHERE p.tablename = tt.t AND p.schemaname='public') = 0
            THEN '🟢 RLS চালু + কোনো নীতি নেই = সব অস্বীকৃত (নিরাপদ)'
            ELSE '🟢 RLS চালু'
       END AS finding
FROM tenant_tables tt
LEFT JOIN pg_class c ON c.oid = to_regclass('public.'||tt.t)
ORDER BY finding DESC, table_name;

-- ৩. SECURITY DEFINER ফাংশন যেগুলোর search_path সেট নেই (হাইজ্যাক ঝুঁকি)
SELECT n.nspname                                     AS schema,
       p.proname                                     AS function_name,
       pg_get_function_identity_arguments(p.oid)     AS args,
       p.prosecdef                                   AS security_definer,
       p.proconfig                                   AS config,
       CASE WHEN p.prosecdef AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig,',') ~* 'search_path')
            THEN '🔴 HIGH: SECURITY DEFINER + search_path সেট নেই'
            ELSE '🟢 ok' END AS finding
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
ORDER BY finding DESC, p.proname;

-- ৪. tenant টেবিলে organization_id NULL বা হার্ডকোডেড ডিফল্ট org — কত সারি ঝুলছে
--    (নিচের কুয়েরিটি প্রতি টেবিলের জন্য আলাদা SELECT তৈরি করে দেয়; সেগুলো চালিয়ে সংখ্যা নিন)
WITH tenant_tables(t) AS (VALUES
  ('app_settings'),('somobay_plans'),('member_plans'),('plan_payments'),
  ('rosca_periods'),('joint_goal_expenses'),('member_wallets'),('wallet_transactions'),
  ('promotions'),('notifications'),('qard_funds'),('qard_applications'),
  ('qard_loans'),('qard_repayments'),('audit_logs'),('member_actions'),('savings_withdrawals')
), cols AS (
  SELECT tt.t AS table_name
  FROM tenant_tables tt
  JOIN information_schema.columns c
    ON c.table_schema='public' AND c.table_name=tt.t AND c.column_name='organization_id'
)
SELECT table_name,
       format('SELECT %L AS table_name, count(*) AS total_rows, '
              'count(*) FILTER (WHERE organization_id IS NULL) AS null_org, '
              'count(*) FILTER (WHERE organization_id = %L) AS default_org_rows FROM public.%I',
              table_name, '00000000-0000-0000-0000-000000000001', table_name) AS query_to_run
FROM cols
ORDER BY table_name;

-- ৫. বৈশ্বিক profiles.role='admin' কিন্তু কোনো সমবায়ে সদস্যপদ নেই (F-01 এর সুবিধাভোগী)
SELECT p.id, p.full_name, p.role AS global_role, p.status,
       (SELECT count(*) FROM public.organization_members om WHERE om.user_id = p.id) AS memberships,
       (SELECT count(*) FROM public.organization_members om WHERE om.user_id = p.id AND om.status='active') AS active_memberships,
       CASE WHEN NOT EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = p.id)
            THEN '🔴 CRITICAL: বৈশ্বিক admin অথচ platform_admins-এ নেই — পুরনো কোডে যেকোনো সমবায়ে অ্যাক্সেস পেত'
            ELSE '🟠 platform_admins-এ আছে (নথিভুক্ত প্ল্যাটফর্ম ভূমিকা)' END AS finding
FROM public.profiles p
WHERE p.role = 'admin'
ORDER BY finding;

-- ৬. বৈশ্বিক রোল নির্ভর নীতি (tenant স্কোপিং ছাড়াই লেখার অনুমতি)
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND (qual ~* 'profiles' OR with_check ~* 'profiles')
  AND (qual ~* '''admin''' OR with_check ~* '''admin''' OR qual ~* 'role = ''admin''')
ORDER BY tablename;

-- ৭. anon/authenticated-কে দেওয়া সরাসরি GRANT (RLS ছাড়াই টেবিল অ্যাক্সেস)
SELECT table_schema, table_name, grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee, privilege_type;

-- ৮. Storage: বাকেট ও নীতিতে tenant স্কোপিং আছে কিনা
SELECT b.id AS bucket, b.public, b.file_size_limit, b.allowed_mime_types,
       (SELECT count(*) FROM storage.policies sp WHERE sp.bucket_id = b.id) AS policy_count
FROM storage.buckets b
ORDER BY b.id;

SELECT bucket_id, name, action, roles,
       coalesce(definition,'')  AS using_expr,
       coalesce(checks,'')      AS with_check_expr,
       CASE WHEN coalesce(definition,'') !~* 'organization|org_id' AND coalesce(checks,'') !~* 'organization|org_id'
            THEN '🟠 MEDIUM: storage নীতিতে tenant স্কোপিং নেই (path prefix দিয়ে আলাদা করা দরকার)'
            ELSE '🟢 scoped' END AS finding
FROM storage.policies
ORDER BY finding DESC, bucket_id;

-- ৯. Realtime publication-এ কোন টেবিল আছে (tenant ফিল্টার ছাড়া broadcast ঝুঁকি)
SELECT n.nspname AS schema, c.relname AS table_name,
       CASE WHEN n.nspname='public' THEN '🟠 যাচাই করুন: realtime গ্রাহক কি organization_id ফিল্টার করে?' ELSE '🟢 system' END AS note
FROM pg_publication p
JOIN pg_publication_rel pr ON pr.prpubid = p.oid
JOIN pg_class c ON c.oid = pr.prrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE p.pubname = 'supabase_realtime'
ORDER BY n.nspname, c.relname;

-- ১০. ট্রিগার যা tenant integrity রক্ষা করে (উপস্থিতি যাচাই)
SELECT tgrelid::regclass AS table_name, tgname, tgenabled,
       pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname ~* 'tenant|integrity|protect|escalation|withdrawal|qard|payment'
ORDER BY table_name, tgname;

-- ১১. সারসংক্ষেপ: মোট ঝুঁকি সংখ্যা
SELECT
 (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND (qual ~* '\(\s*true\s*\)' OR with_check ~* '\(\s*true\s*\)')) AS permissive_policies,
 (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.qual ~* '''admin''' AND p.qual ~* 'profiles')            AS global_role_policies,
 (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig,',') ~* 'search_path')) AS definer_without_search_path,
 (SELECT count(*) FROM public.profiles p WHERE p.role='admin'
    AND NOT EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id=p.id AND om.status='active')
    AND NOT EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id=p.id))                                             AS global_admins_without_membership;
