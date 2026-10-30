-- ==============================================================================
-- SOMOBAY APP - STEP 1: SECURITY HARDENING & 3-SCHEME ARCHITECTURE MIGRATION
-- ==============================================================================

-- 1. CRITICAL SECURITY FIX: PREVENT PRIVILEGE ESCALATION ON PROFILES
-- Problem: Any authenticated member could update their own role to 'admin'
-- Fix: Trigger function to verify that only actual admins can modify 'role'

CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: শুধুমাত্র অ্যাডমিন সদস্যের রোল পরিবর্তন করতে পারবেন।';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_update();

-- 2. SECURE PROFILE SELECT ACCESS
-- Problem: Public (anonymous) could view all member emails and phones
-- Fix: Only authenticated users can view member profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- 3. ENSURE SOMOBAY_PLANS SUPPORTS THE 3 SCHEME TYPES
-- Type 1: 'savings' (সাধারণ সঞ্চয়/সমবায়)
-- Type 2: 'rosca' (পালাক্রমিক/রোটেশনাল সঞ্চয় সমিতি)
-- Type 3: 'joint_goal' (যৌথ লক্ষ্য / Collective Savings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'somobay_plans' AND column_name = 'scheme_type'
  ) THEN
    ALTER TABLE public.somobay_plans 
    ADD COLUMN scheme_type text DEFAULT 'savings' 
    CHECK (scheme_type IN ('savings', 'rosca', 'joint_goal'));
  END IF;

  -- ROSCA specific configuration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'somobay_plans' AND column_name = 'total_members_limit'
  ) THEN
    ALTER TABLE public.somobay_plans ADD COLUMN total_members_limit integer DEFAULT 12;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'somobay_plans' AND column_name = 'current_cycle'
  ) THEN
    ALTER TABLE public.somobay_plans ADD COLUMN current_cycle integer DEFAULT 1;
  END IF;
END $$;

-- 4. ROSCA PERIODS / DRAWS TABLE (For Scheme 2)
-- Tracks each round/period: recipient, status, draw date, draw seed/method
CREATE TABLE IF NOT EXISTS public.rosca_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.somobay_plans(id) ON DELETE CASCADE,
  cycle_no integer NOT NULL DEFAULT 1,
  period_no integer NOT NULL, -- e.g. 1 to 12
  due_date date,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  payout_amount numeric(12,2) DEFAULT 0,
  draw_method text DEFAULT 'lottery' CHECK (draw_method IN ('lottery', 'turn', 'bidding')),
  draw_seed text,
  drawn_at timestamp with time zone,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'drawn', 'completed')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(plan_id, cycle_no, period_no)
);

-- Ensure a member cannot receive payout more than once in the same cycle of a ROSCA plan
CREATE UNIQUE INDEX IF NOT EXISTS one_rosca_payout_per_member_cycle
  ON public.rosca_periods (plan_id, cycle_no, recipient_id) 
  WHERE recipient_id IS NOT NULL;

-- Enable RLS on rosca_periods
ALTER TABLE public.rosca_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view rosca periods" ON public.rosca_periods;
CREATE POLICY "Anyone can view rosca periods" ON public.rosca_periods
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage rosca periods" ON public.rosca_periods;
CREATE POLICY "Admins can manage rosca periods" ON public.rosca_periods
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. JOINT GOAL EXPENSES TABLE (For Scheme 3)
-- Collective Savings: Members deposit, and funds are used for the common goal/expenses
CREATE TABLE IF NOT EXISTS public.joint_goal_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.somobay_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  spent_by text,
  approved_by uuid REFERENCES public.profiles(id),
  proof_url text,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.joint_goal_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view joint goal expenses" ON public.joint_goal_expenses;
CREATE POLICY "Anyone can view joint goal expenses" ON public.joint_goal_expenses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage joint goal expenses" ON public.joint_goal_expenses;
CREATE POLICY "Admins can manage joint goal expenses" ON public.joint_goal_expenses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. APP_SETTINGS: Turn off wallet system by default
UPDATE public.app_settings 
SET is_wallet_enabled = false 
WHERE is_wallet_enabled IS DISTINCT FROM false;
