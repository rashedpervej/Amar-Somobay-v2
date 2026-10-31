-- ============================================================================
-- D-01 · সম্পূর্ণ সুদমুক্ত নীতি — AUDIT ONLY (শুধু পড়া, কোনো পরিবর্তন নয়)
-- ----------------------------------------------------------------------------
-- উদ্দেশ্য: profit_percentage / সুদ-সমতুল্য কোনো কলাম, ডিফল্ট, ফাংশন বা ট্রিগার
--           ডেটাবেসে আছে কিনা এবং বিদ্যমান ডেটায় এর প্রভাব কত — তা আগে জানা।
-- নিয়ম:     এই ফাইলে শুধু SELECT আছে। এটি চালানো নিরাপদ; কোনো সারি বদলায় না।
-- আউটপুট:  প্রতিটি কুয়েরির ফলাফল reports/phase1-d01-d02-report.md-এ যুক্ত করুন।
--           ফলাফল না দেখে D01_zero_interest__MIGRATION_DRAFT.sql চালানো নিষিদ্ধ।
-- সীমা:     বিলম্ব ফি/জরিমানা (late_fee_amount, pending_fine, penalty_paid) এই
--           নীতির আওতার বাইরে — ব্যবহারকারীর সিদ্ধান্ত অনুযায়ী অপরিবর্তিত।
-- ============================================================================

-- ১. সুদ/মুনাফা-সদৃশ নামের কলাম পুরো স্কিমাতে খোঁজা
SELECT table_schema, table_name, column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
       column_name ~* '(profit|interest|riba|dividend|markup|yield|return_rate)'
    OR column_name IN ('profit_percentage','profit_rate','interest_rate','interest_amount')
  )
ORDER BY table_name, column_name;

-- ২. somobay_plans-এ profit_percentage কলামের বর্তমান অবস্থা (ডিফল্ট, CHECK, nullable)
SELECT a.attname                                   AS column_name,
       format_type(a.atttypid, a.atttypmod)        AS type,
       pg_get_expr(d.adbin, d.adrelid)             AS default_expr,
       a.attnotnull                                AS not_null,
       (SELECT count(*) FROM pg_constraint c
         WHERE c.conrelid = a.attrelid AND c.contype = 'c'
           AND a.attnum = ANY (c.conkey))           AS check_constraints_on_column
FROM pg_attribute a
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE a.attrelid = 'public.somobay_plans'::regclass
  AND a.attname = 'profit_percentage'
  AND a.attnum > 0 AND NOT a.attisdropped;

-- ৩. বিদ্যমান ডেটায় শূন্য-লঙ্ঘন: কোন স্কিমে সুদের হার ০ নয়? (সবচেয়ে গুরুত্বপূর্ণ প্রশ্ন)
SELECT COALESCE(scheme_type, '(null)')             AS scheme_type,
       count(*)                                    AS plans,
       count(*) FILTER (WHERE COALESCE(profit_percentage,0) <> 0) AS plans_with_nonzero_profit,
       COALESCE(min(profit_percentage), 0)         AS min_profit,
       COALESCE(max(profit_percentage), 0)         AS max_profit,
       array_agg(DISTINCT profit_percentage) FILTER (WHERE COALESCE(profit_percentage,0) <> 0) AS distinct_nonzero_values
FROM public.somobay_plans
GROUP BY scheme_type
ORDER BY scheme_type;

-- ৪. কোন সমবায়ে (organization) শূন্য-লঙ্ঘন — প্রভাবের পরিধি
SELECT p.organization_id,
       o.name                                      AS organization_name,
       count(*)                                    AS affected_plans,
       array_agg(p.id)                             AS plan_ids,
       array_agg(DISTINCT p.profit_percentage)     AS profit_values
FROM public.somobay_plans p
LEFT JOIN public.organizations o ON o.id = p.organization_id
WHERE COALESCE(p.profit_percentage, 0) <> 0
GROUP BY p.organization_id, o.name
ORDER BY affected_plans DESC;

-- ৫. এই স্কিমগুলোর সদস্য-সংযোগ ও পেমেন্টের পরিমাণ (কত বড় প্রভাব)
SELECT p.id                                        AS plan_id,
       p.name                                      AS plan_name,
       p.profit_percentage,
       count(DISTINCT mp.id)                       AS member_plans,
       count(pp.id)                                AS payments,
       COALESCE(sum(pp.amount) FILTER (WHERE pp.status = 'approved'), 0) AS approved_amount_sum
FROM public.somobay_plans p
LEFT JOIN public.member_plans mp ON mp.plan_id = p.id
LEFT JOIN public.plan_payments pp ON pp.member_plan_id = mp.id
WHERE COALESCE(p.profit_percentage, 0) <> 0
GROUP BY p.id, p.name, p.profit_percentage
ORDER BY approved_amount_sum DESC;

-- ৬. পেমেন্ট টাইপের তালিকা — সুদ/মুনাফা জাতীয় কোনো টাইপ ব্যবহৃত হয়েছে কিনা
SELECT type, count(*) AS rows, COALESCE(sum(amount),0) AS amount_sum
FROM public.plan_payments
GROUP BY type
ORDER BY rows DESC;

-- ৭. ডেটাবেস ফাংশন/ট্রিগার যেগুলো profit_percentage ব্যবহার করে
SELECT p.proname                                   AS function_name,
       n.nspname                                   AS schema,
       pg_get_function_identity_arguments(p.oid)   AS args,
       (p.proconfig IS NULL)                       AS missing_search_path_guard,
       substring(pg_get_functiondef(p.oid) from 1 for 400) AS definition_head
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ~* 'profit_percentage|interest_rate|profit_rate'
ORDER BY p.proname;

-- ৮. ভিউ/ম্যাটেরিয়াল ভিউ-তে সুদের হার দেখানো হচ্ছে কিনা
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ~* 'profit_percentage|interest'
ORDER BY table_name;

-- ৯. ইতোমধ্যে কোনো CHECK constraint আছে কিনা (ডুপ্লিকেট এড়াতে)
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.somobay_plans'::regclass AND contype = 'c'
ORDER BY conname;

-- ১০. বিলম্ব ফি/জরিমানার বর্তমান অবস্থা (তথ্যের জন্য — এই নীতিতে অপরিবর্তিত থাকবে)
SELECT count(*)                                        AS plans_total,
       count(*) FILTER (WHERE COALESCE(late_fee_amount,0) > 0) AS plans_with_late_fee,
       COALESCE(max(late_fee_amount),0)                AS max_late_fee
FROM public.somobay_plans;

-- ১১. সারসংক্ষেপ সিদ্ধান্ত-সহায়ক সংখ্যা
SELECT
  (SELECT count(*) FROM public.somobay_plans WHERE COALESCE(profit_percentage,0) <> 0) AS nonzero_profit_plans,
  (SELECT count(*) FROM public.somobay_plans)                                           AS total_plans,
  (SELECT count(*) FROM public.plan_payments WHERE type ~* 'profit|interest|dividend')  AS interest_like_payments;
