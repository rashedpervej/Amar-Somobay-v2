-- ==============================================================================
-- AMAR-SOMOBAY: QARD HASANAH (সুদমুক্ত ঋণ) PRODUCTION DATABASE STANDARDIZATION
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- 1. Ensure somobay_plans supports 'qard' scheme_type
DO $$
BEGIN
  ALTER TABLE public.somobay_plans DROP CONSTRAINT IF EXISTS somobay_plans_scheme_type_check;
  ALTER TABLE public.somobay_plans ADD CONSTRAINT somobay_plans_scheme_type_check
    CHECK (scheme_type IN ('savings', 'rosca', 'joint_goal', 'qard'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Create qard_applications table
CREATE TABLE IF NOT EXISTS public.qard_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheme_id uuid REFERENCES public.somobay_plans(id) ON DELETE SET NULL,
  requested_amount numeric(12,2) NOT NULL CHECK (requested_amount > 0),
  approved_amount numeric(12,2) DEFAULT 0,
  duration_months integer NOT NULL DEFAULT 6,
  purpose text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'rejected')),
  rejection_reason text,
  disbursement_date date,
  disbursement_ref text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create qard_loans table
CREATE TABLE IF NOT EXISTS public.qard_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheme_id uuid REFERENCES public.somobay_plans(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.qard_applications(id) ON DELETE SET NULL,
  principal_amount numeric(12,2) NOT NULL CHECK (principal_amount > 0),
  total_repaid numeric(12,2) NOT NULL DEFAULT 0,
  outstanding_principal numeric(12,2) NOT NULL,
  monthly_installment numeric(12,2) NOT NULL DEFAULT 0,
  duration_months integer NOT NULL DEFAULT 6,
  disbursement_date date NOT NULL DEFAULT CURRENT_DATE,
  next_due_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'overdue')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create qard_repayments table
CREATE TABLE IF NOT EXISTS public.qard_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES public.qard_loans(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'নগদ',
  trx_ref text,
  note text,
  status text NOT NULL DEFAULT 'approved',
  admin_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.qard_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qard_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qard_repayments ENABLE ROW LEVEL SECURITY;

-- Policies for qard_applications
DROP POLICY IF EXISTS "Users can view own qard applications" ON public.qard_applications;
CREATE POLICY "Users can view own qard applications"
ON public.qard_applications FOR SELECT
USING (
  member_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Members can submit qard applications" ON public.qard_applications;
CREATE POLICY "Members can submit qard applications"
ON public.qard_applications FOR INSERT
WITH CHECK (
  (member_id = auth.uid() AND status = 'pending') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update qard applications" ON public.qard_applications;
CREATE POLICY "Admins can update qard applications"
ON public.qard_applications FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for qard_loans
DROP POLICY IF EXISTS "Users can view own qard loans" ON public.qard_loans;
CREATE POLICY "Users can view own qard loans"
ON public.qard_loans FOR SELECT
USING (
  member_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage qard loans" ON public.qard_loans;
CREATE POLICY "Admins can manage qard loans"
ON public.qard_loans FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for qard_repayments
DROP POLICY IF EXISTS "Users can view own qard repayments" ON public.qard_repayments;
CREATE POLICY "Users can view own qard repayments"
ON public.qard_repayments FOR SELECT
USING (
  member_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage qard repayments" ON public.qard_repayments;
CREATE POLICY "Admins can manage qard repayments"
ON public.qard_repayments FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Trigger to automatically recalculate loan outstanding_principal on repayment
CREATE OR REPLACE FUNCTION public.handle_qard_repayment_sync()
RETURNS trigger AS $$
DECLARE
  v_total_repaid numeric(12,2) := 0;
  v_principal numeric(12,2) := 0;
  v_loan_id uuid;
BEGIN
  v_loan_id := COALESCE(NEW.loan_id, OLD.loan_id);
  
  SELECT principal_amount INTO v_principal FROM public.qard_loans WHERE id = v_loan_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total_repaid 
  FROM public.qard_repayments 
  WHERE loan_id = v_loan_id AND status = 'approved';
  
  UPDATE public.qard_loans
  SET 
    total_repaid = v_total_repaid,
    outstanding_principal = GREATEST(0, v_principal - v_total_repaid),
    status = CASE 
      WHEN v_total_repaid >= v_principal THEN 'repaid'
      ELSE 'active'
    END
  WHERE id = v_loan_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_qard_repayment_sync ON public.qard_repayments;
CREATE TRIGGER tr_qard_repayment_sync
AFTER INSERT OR UPDATE OR DELETE ON public.qard_repayments
FOR EACH ROW EXECUTE FUNCTION public.handle_qard_repayment_sync();

-- 7. [নিষ্ক্রিয় — নীতি D-01 / Gate #2, ৩১ অক্টোবর ২০২৬]
--
-- নিচের সিডটি আর চালানো হবে না। কারণ: `scheme_type='qard'`-কে `somobay_plans`-এ
-- একটি সাধারণ সঞ্চয়-স্কিম হিসেবে তৈরি করছিল, যা QH-কে তার নিজস্ব মডিউল ও
-- লাইফসাইকেল থেকে দূরে সরিয়ে দিত এবং দ্বিতীয়/তৃতীয়বার চালালে ডুপ্লিকেট
-- QH-স্কিম তৈরি হতো (X1)। কর্জে হাসানা এখন শুধু `qard_funds` / `qard_loans` /
-- `qard_repayments` দিয়ে চলবে (দেখুন `specs/03`), এবং QH-তে কোনো
-- `profit_percentage` থাকবে না (নীতি D-01)।
--
-- ডিলিট করা হয়নি — ইতিহাস ও প্রয়োজনে রেফারেন্সের জন্য নিচে মন্তব্যে রাখা হলো।
-- ইতিমধ্যে তৈরি হওয়া সারি মুছতে হবে না; নীতি অনুযায়ী সেগুলো নিষ্ক্রিয় (is_active=false)
-- করার প্রস্তাব আলাদা অনুমোদনের বিষয়।
--
-- INSERT INTO public.somobay_plans (
--   name, description, scheme_type, duration_months, installment_amount,
--   target_amount, profit_percentage, late_fee_amount, is_active, status
-- )
-- SELECT
--   'কর্জে হাসানা — সুদমুক্ত ঋণ ফান্ড',
--   'জরুরি পারিবারিক, চিকিৎসা ও ব্যবসা প্রয়োজনে সম্পূর্ণ সুদমুক্ত ঋণ সুবিধা।',
--   'qard', 6, 5000, 30000, 0, 0, true, 'active'
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.somobay_plans WHERE scheme_type = 'qard'
-- );
