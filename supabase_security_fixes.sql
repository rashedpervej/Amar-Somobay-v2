-- ============================================================
-- AMAR-SOMOBAY (আমার সমবায়) — DATABASE SECURITY & INTEGRITY SCRIPT
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Ensure 'payment_date' column exists in plan_payments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_payments' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE public.plan_payments ADD COLUMN payment_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- 2. Protect profiles privileged columns (Prevents regular members from escalating to 'admin')
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER AS $$
DECLARE
  caller_role text;
BEGIN
  -- If role or status is being modified
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check if current authenticated caller has admin role in profiles
    SELECT role INTO caller_role 
    FROM public.profiles 
    WHERE id = auth.uid();

    IF caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'অননুমোদিত চেষ্টা: শুধুমাত্র অ্যাডমিন সদস্যের রোল বা স্ট্যাটাস পরিবর্তন করতে পারেন।';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 3. Row Level Security (RLS) Policies on plan_payments
ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;

-- Allow members to view payments for plans they belong to
DROP POLICY IF EXISTS "Members can view their own payments" ON public.plan_payments;
CREATE POLICY "Members can view their own payments"
ON public.plan_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.member_plans
    WHERE member_plans.id = plan_payments.member_plan_id
      AND member_plans.member_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated admins to insert any payment, and members to submit pending payments for their own plans
DROP POLICY IF EXISTS "Admins can insert plan payments" ON public.plan_payments;
DROP POLICY IF EXISTS "Authorized users can insert plan payments" ON public.plan_payments;
CREATE POLICY "Authorized users can insert plan payments"
ON public.plan_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  (
    status = 'pending'
    AND admin_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.member_plans
      WHERE member_plans.id = plan_payments.member_plan_id
        AND member_plans.member_id = auth.uid()
    )
  )
);

-- Only authenticated admins can update payments (e.g. approve or reject pending requests)
DROP POLICY IF EXISTS "Admins can update plan payments" ON public.plan_payments;
CREATE POLICY "Admins can update plan payments"
ON public.plan_payments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Disallow client-side delete of payments to preserve audit trail
DROP POLICY IF EXISTS "No client deletion of payments" ON public.plan_payments;
-- (No DELETE policy means nobody via client can delete payment rows)

-- 4. Row Level Security (RLS) on somobay_plans
ALTER TABLE public.somobay_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.somobay_plans;
CREATE POLICY "Anyone can view active plans"
ON public.somobay_plans FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert or update plans" ON public.somobay_plans;
CREATE POLICY "Admins can insert or update plans"
ON public.somobay_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================
-- SUCCESS: Database security migration is ready.
-- ============================================================
