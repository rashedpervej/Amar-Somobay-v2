-- ==============================================================================
-- AMAR-SOMOBAY: QARD HASANAH (সুদমুক্ত পারস্পরিক আর্থিক সহায়তা)
-- PRODUCTION MASTER DATABASE MIGRATION & SECURITY HARDENING
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- 1. Create Dedicated Qard Hasanah Authorized Fund Ledger
CREATE TABLE IF NOT EXISTS public.qard_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_name text NOT NULL DEFAULT 'সাধারণ কর্জে হাসানা তহবিল',
  total_allocated numeric(12,2) NOT NULL DEFAULT 50000.00 CHECK (total_allocated >= 0),
  total_disbursed numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (total_disbursed >= 0),
  total_recovered numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (total_recovered >= 0),
  note text DEFAULT 'সমিতির অনুমোদিত প্রারম্ভিক সুদমুক্ত তহবিল',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial fund allocation if table is empty
INSERT INTO public.qard_funds (fund_name, total_allocated, total_disbursed, total_recovered, note)
SELECT 'সাধারণ কর্জে হাসানা তহবিল', 50000.00, 0.00, 0.00, 'প্রাথমিক অনুমোদিত সুদমুক্ত সহায়তা তহবিল'
WHERE NOT EXISTS (SELECT 1 FROM public.qard_funds);

-- 2. Ensure qard_applications table exists with all privacy & snapshot fields
CREATE TABLE IF NOT EXISTS public.qard_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  member_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  requested_amount numeric(12,2) NOT NULL CHECK (requested_amount > 0),
  approved_amount numeric(12,2) DEFAULT 0,
  duration_months integer NOT NULL DEFAULT 6,
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  disbursement_date date,
  disbursement_ref text,
  member_savings_snapshot numeric(12,2) DEFAULT 0,
  consent_public_sharing boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns safely if table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qard_applications' AND column_name = 'member_savings_snapshot') THEN
    ALTER TABLE public.qard_applications ADD COLUMN member_savings_snapshot numeric(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qard_applications' AND column_name = 'consent_public_sharing') THEN
    ALTER TABLE public.qard_applications ADD COLUMN consent_public_sharing boolean DEFAULT false;
  END IF;
END $$;

-- 3. Ensure qard_loans table exists
CREATE TABLE IF NOT EXISTS public.qard_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  member_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  application_id uuid REFERENCES public.qard_applications(id) ON DELETE RESTRICT,
  principal_amount numeric(12,2) NOT NULL CHECK (principal_amount > 0),
  total_repaid numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_repaid >= 0),
  outstanding_principal numeric(12,2) NOT NULL CHECK (outstanding_principal >= 0),
  duration_months integer NOT NULL DEFAULT 6,
  disbursement_date date NOT NULL DEFAULT CURRENT_DATE,
  disbursement_ref text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Ensure qard_repayments table exists
CREATE TABLE IF NOT EXISTS public.qard_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES public.qard_loans(id) ON DELETE RESTRICT NOT NULL,
  member_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'নগদ',
  trx_ref text,
  receipt_no text,
  note text,
  status text NOT NULL DEFAULT 'approved',
  admin_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS) on all Qard tables
ALTER TABLE public.qard_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qard_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qard_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qard_repayments ENABLE ROW LEVEL SECURITY;

-- 5a. RLS: qard_funds
DROP POLICY IF EXISTS "Anyone can view qard fund status" ON public.qard_funds;
CREATE POLICY "Anyone can view qard fund status"
ON public.qard_funds FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage qard fund" ON public.qard_funds;
CREATE POLICY "Admins can manage qard fund"
ON public.qard_funds FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5b. RLS: qard_applications (Strict Member Privacy)
DROP POLICY IF EXISTS "Users can view own qard applications" ON public.qard_applications;
CREATE POLICY "Users can view own qard applications"
ON public.qard_applications FOR SELECT
TO authenticated
USING (
  member_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Members can submit qard applications" ON public.qard_applications;
CREATE POLICY "Members can submit qard applications"
ON public.qard_applications FOR INSERT
TO authenticated
WITH CHECK (
  (member_id = auth.uid() AND status = 'pending') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update qard applications" ON public.qard_applications;
CREATE POLICY "Admins can update qard applications"
ON public.qard_applications FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5c. RLS: qard_loans
DROP POLICY IF EXISTS "Users can view own qard loans" ON public.qard_loans;
CREATE POLICY "Users can view own qard loans"
ON public.qard_loans FOR SELECT
TO authenticated
USING (
  member_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage qard loans" ON public.qard_loans;
CREATE POLICY "Admins can manage qard loans"
ON public.qard_loans FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5d. RLS: qard_repayments
DROP POLICY IF EXISTS "Users can view own qard repayments" ON public.qard_repayments;
CREATE POLICY "Users can view own qard repayments"
ON public.qard_repayments FOR SELECT
TO authenticated
USING (
  member_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage qard repayments" ON public.qard_repayments;
CREATE POLICY "Admins can manage qard repayments"
ON public.qard_repayments FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Trigger to automatically sync loan and fund on repayment
CREATE OR REPLACE FUNCTION public.handle_qard_repayment_sync()
RETURNS trigger AS $$
DECLARE
  v_total_repaid numeric(12,2) := 0;
  v_principal numeric(12,2) := 0;
  v_loan_id uuid;
  v_app_id uuid;
BEGIN
  v_loan_id := COALESCE(NEW.loan_id, OLD.loan_id);
  
  SELECT principal_amount, application_id INTO v_principal, v_app_id 
  FROM public.qard_loans 
  WHERE id = v_loan_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total_repaid 
  FROM public.qard_repayments 
  WHERE loan_id = v_loan_id AND status = 'approved';
  
  -- Update Loan Outstanding
  UPDATE public.qard_loans
  SET 
    total_repaid = v_total_repaid,
    outstanding_principal = GREATEST(0, v_principal - v_total_repaid),
    status = CASE 
      WHEN v_total_repaid >= v_principal THEN 'completed'
      ELSE 'active'
    END
  WHERE id = v_loan_id;

  -- If fully repaid, mark application completed
  IF v_total_repaid >= v_principal AND v_app_id IS NOT NULL THEN
    UPDATE public.qard_applications
    SET status = 'completed'
    WHERE id = v_app_id;
  END IF;

  -- Update Fund Recovered Amount
  UPDATE public.qard_funds
  SET 
    total_recovered = (SELECT COALESCE(SUM(amount), 0) FROM public.qard_repayments WHERE status = 'approved'),
    updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_qard_repayment_sync ON public.qard_repayments;
CREATE TRIGGER tr_qard_repayment_sync
AFTER INSERT OR UPDATE OR DELETE ON public.qard_repayments
FOR EACH ROW EXECUTE FUNCTION public.handle_qard_repayment_sync();

-- 7. Clean up any dummy Qard scheme from somobay_plans (since Qard is NOT a savings scheme)
DELETE FROM public.somobay_plans 
WHERE scheme_type = 'qard' AND name ILIKE '%কর্জে হাসানা%';
