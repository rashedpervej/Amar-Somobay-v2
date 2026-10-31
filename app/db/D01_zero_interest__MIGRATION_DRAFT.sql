-- ============================================================================
-- D-01 · সম্পূর্ণ সুদমুক্ত নীতি — MIGRATION DRAFT (অনুমোদন-সাপেক্ষ)
-- ----------------------------------------------------------------------------
-- ⛔ অনুমোদন ছাড়া এই ফাইল কোনো ডেটাবেসে (staging বা production) চালানো নিষিদ্ধ।
--
-- প্রকৃতি: ADDITIVE ও NON-DESTRUCTIVE।
--   • কোনো কলাম DROP করা হয় না (Source A-র কোড ও বিদ্যমান ডেটা ভাঙবে না)।
--   • কোনো বিদ্যমান সারির মান UPDATE/পুনর্লিখন করা হয় না।
--   • বিদ্যমান ডেটায় শূন্য-লঙ্ঘন থাকলে এই স্ক্রিপ্ট থেমে যায় (RAISE EXCEPTION),
--     নিজে থেকে ডেটা "ঠিক" করে না — কারণ আর্থিক ডেটা পরিবর্তন অনুমোদন ছাড়া নিষিদ্ধ।
--   • বিলম্ব ফি/জরিমানা সম্পর্কিত কোনো কলাম বা ট্রিগার স্পর্শ করা হয় না
--     (late_fee_amount, pending_fine, penalty_paid অপরিবর্তিত — ব্যবহারকারীর সিদ্ধান্ত)।
--
-- পূর্বশর্ত: D01_zero_interest__AUDIT_ONLY.sql চালিয়ে ফলাফল রিপোর্টে যুক্ত করতে হবে।
--           অডিটের ৩/৪ নম্বর কুয়েরিতে plans_with_nonzero_profit = ০ হতে হবে।
-- ============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- ধাপ ০ · প্রিফ্লাইট: কলাম আছে কিনা, এবং শূন্য-লঙ্ঘন আছে কিনা
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_has_column boolean;
  v_offenders  bigint;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='somobay_plans' AND column_name='profit_percentage'
  ) INTO v_has_column;

  IF NOT v_has_column THEN
    RAISE NOTICE 'D-01: somobay_plans.profit_percentage কলাম নেই — কিছু করার নেই (স্ক্রিপ্ট এখানেই শেষ)।';
    RETURN;
  END IF;

  EXECUTE 'SELECT count(*) FROM public.somobay_plans WHERE COALESCE(profit_percentage,0) <> 0'
    INTO v_offenders;

  IF v_offenders > 0 THEN
    RAISE EXCEPTION
      'D-01 প্রিফ্লাইট ব্যর্থ: %টি স্কিমে profit_percentage শূন্য নয়। বিদ্যমান আর্থিক ডেটা অনুমোদন ছাড়া পরিবর্তন করা হবে না — আগে AUDIT ONLY স্ক্রিপ্টের ৩/৪ নম্বর কুয়েরির ফলাফলসহ সিদ্ধান্ত নিন (বিকল্প A: মান ০-এ আনার অনুমতি, বিকল্প B: সংশ্লিষ্ট স্কিম নিষ্ক্রিয় করা, বিকল্প C: শুধু ট্রিগার+ডিফল্ট লাগিয়ে পুরনো সারি অপরিবর্তিত রাখা)।',
      v_offenders;
  END IF;

  RAISE NOTICE 'D-01 প্রিফ্লাইট সফল: কোনো স্কিমে শূন্য-লঙ্ঘন নেই।';
END $$;

-- ---------------------------------------------------------------------------
-- ধাপ ১ · গার্ড ট্রিগার: নতুন/সম্পাদিত কোনো স্কিমে সুদের হার ০ ছাড়া লেখা যাবে না
--          (ক্লায়েন্ট কোড ভুল করলেও ডেটাবেস স্তরে তা আটকাবে — defence in depth)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_zero_interest_plans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
BEGIN
  -- নীতি D-01: সুদ/মুনাফা সম্পূর্ণ নিষিদ্ধ। শূন্য ছাড়া মান এলে ০-এ বাঁধা হয় এবং
  -- ঘটনাটি audit_logs-এ লেখা হয় (যাতে কে কী লিখতে চেয়েছিল তার প্রমাণ থাকে)।
  IF NEW.profit_percentage IS DISTINCT FROM 0 THEN
    BEGIN
      INSERT INTO public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.organization_id,
        auth.uid(),
        'policy.zero_interest.enforced',
        'somobay_plans',
        NEW.id,
        jsonb_build_object(
          'attempted_profit_percentage', NEW.profit_percentage,
          'forced_to', 0,
          'policy', 'D-01'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- অডিট লেখা ব্যর্থ হলেও মূল লেখা আটকানো হবে না; তবে বার্তা লগ হবে
      RAISE WARNING 'D-01: অডিট লগ লেখা যায়নি (%) — মান তবুও ০-এ বাঁধা হলো', SQLERRM;
    END;

    NEW.profit_percentage := 0;
  END IF;

  RETURN NEW;
END;
$func$;

REVOKE ALL ON FUNCTION public.enforce_zero_interest_plans() FROM public;
GRANT EXECUTE ON FUNCTION public.enforce_zero_interest_plans() TO authenticated, service_role;

DROP TRIGGER IF EXISTS tr_enforce_zero_interest_plans ON public.somobay_plans;
CREATE TRIGGER tr_enforce_zero_interest_plans
  BEFORE INSERT OR UPDATE OF profit_percentage ON public.somobay_plans
  FOR EACH ROW EXECUTE FUNCTION public.enforce_zero_interest_plans();

-- ---------------------------------------------------------------------------
-- ধাপ ২ · কলাম ডিফল্ট ০ (নতুন সারিতে ভুল করেও অন্য মান বসবে না)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='somobay_plans' AND column_name='profit_percentage') THEN
    ALTER TABLE public.somobay_plans ALTER COLUMN profit_percentage SET DEFAULT 0;
    RAISE NOTICE 'D-01: profit_percentage DEFAULT 0 সেট করা হয়েছে।';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- ধাপ ৩ · CHECK constraint (NOT VALID → VALIDATE; কোনো সারি বদলায় না)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='somobay_plans' AND column_name='profit_percentage') THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid='public.somobay_plans'::regclass AND conname='chk_somobay_plans_zero_interest') THEN
    ALTER TABLE public.somobay_plans
      ADD CONSTRAINT chk_somobay_plans_zero_interest
      CHECK (COALESCE(profit_percentage, 0) = 0) NOT VALID;
    RAISE NOTICE 'D-01: CHECK constraint যোগ হয়েছে (NOT VALID)।';
  END IF;

  -- VALIDATE ব্যর্থ হলে কোনো ডেটা বদলায় না; শুধু constraint অকার্যকর অবস্থায় থাকে
  ALTER TABLE public.somobay_plans VALIDATE CONSTRAINT chk_somobay_plans_zero_interest;
  RAISE NOTICE 'D-01: CHECK constraint VALIDATE সফল — সব বিদ্যমান সারি নীতি মেনে চলে।';
END $$;

-- ---------------------------------------------------------------------------
-- ধাপ ৪ · কলাম মন্তব্য (নীতির নথি ডেটাবেসেই থাকবে)
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN public.somobay_plans.profit_percentage IS
  'নীতি D-01: সম্পূর্ণ সুদমুক্ত প্ল্যাটফর্ম — এই মান সর্বদা ০। ট্রিগার tr_enforce_zero_interest_plans ও CHECK chk_somobay_plans_zero_interest দিয়ে বাঁধা। কলামটি শুধু সামঞ্জস্য রক্ষার জন্য আছে; নতুন কোডে ব্যবহার নিষিদ্ধ।';

-- ---------------------------------------------------------------------------
-- ধাপ ৫ · (ঐচ্ছিক, কমেন্ট করা) কঠোর মোড: ০ ছাড়া মান এলে লেখাই প্রত্যাখ্যান
--          চাইলে অনুমোদন নিয়ে সক্রিয় করুন — তখন কোনো লেখা নীরবে সংশোধন হবে না।
-- ---------------------------------------------------------------------------
-- CREATE OR REPLACE FUNCTION public.enforce_zero_interest_plans_strict()
-- RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $func$
-- BEGIN
--   IF NEW.profit_percentage IS DISTINCT FROM 0 THEN
--     RAISE EXCEPTION 'নীতি D-01 লঙ্ঘন: সুদ বা মুনাফার হার (%) গ্রহণযোগ্য নয় — শুধু ০ অনুমোদিত।', NEW.profit_percentage;
--   END IF;
--   RETURN NEW;
-- END; $func$;
-- DROP TRIGGER IF EXISTS tr_enforce_zero_interest_plans ON public.somobay_plans;
-- CREATE TRIGGER tr_enforce_zero_interest_plans
--   BEFORE INSERT OR UPDATE OF profit_percentage ON public.somobay_plans
--   FOR EACH ROW EXECUTE FUNCTION public.enforce_zero_interest_plans_strict();

-- ---------------------------------------------------------------------------
-- ধাপ ৬ · যাচাই (প্রয়োগের পর চালান)
-- ---------------------------------------------------------------------------
SELECT conname, pg_get_constraintdef(oid) AS definition, convalidated
FROM pg_constraint
WHERE conrelid='public.somobay_plans'::regclass AND conname='chk_somobay_plans_zero_interest';

SELECT tgname, tgenabled FROM pg_trigger
WHERE tgrelid='public.somobay_plans'::regclass AND tgname='tr_enforce_zero_interest_plans';

SELECT count(*) AS nonzero_profit_plans_after
FROM public.somobay_plans WHERE COALESCE(profit_percentage,0) <> 0;

-- লাইভ পরীক্ষা (নিজে থেকে চালিয়ে দেখুন; ব্যর্থ হওয়া = নীতি কাজ করছে):
-- INSERT INTO public.somobay_plans (name, scheme_type, duration_months, installment_amount,
--   target_amount, profit_percentage, late_fee_amount, is_active, status)
-- VALUES ('পরীক্ষা স্কিম','savings',12,1000,12000, 10, 0, false, 'inactive')
-- RETURNING profit_percentage;   -- প্রত্যাশিত: 0 (ট্রিগার বাঁধবে) + audit_logs-এ একটি সারি

-- ---------------------------------------------------------------------------
-- রোলব্যাক (প্রয়োজনে; ডেটা অক্ষত থাকবে)
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS tr_enforce_zero_interest_plans ON public.somobay_plans;
-- DROP FUNCTION IF EXISTS public.enforce_zero_interest_plans();
-- ALTER TABLE public.somobay_plans DROP CONSTRAINT IF EXISTS chk_somobay_plans_zero_interest;
-- ALTER TABLE public.somobay_plans ALTER COLUMN profit_percentage DROP DEFAULT;
