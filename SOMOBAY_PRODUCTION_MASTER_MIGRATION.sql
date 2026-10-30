-- ==============================================================================
-- AMAR-SOMOBAY: COMPLETE MASTER PRODUCTION MIGRATION
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY: PREVENT PRIVILEGE ESCALATION ON PROFILES
-- ==============================================================================
DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
DROP FUNCTION IF EXISTS public.check_profile_role_update() CASCADE;
DROP FUNCTION IF EXISTS public.check_profile_role_update CASCADE;

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

CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_update();

-- ==============================================================================
-- 2. SECURITY: PROTECT PUBLIC ACCESS TO PROFILES
-- ==============================================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- ==============================================================================
-- 3. SCHEMA: 3 COOPERATIVE SCHEME TYPES ON SOMOBAY_PLANS
-- ==============================================================================
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

-- ==============================================================================
-- 4. SCHEMA: SCHEME 2 - ROSCA PERIODS & DRAWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rosca_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.somobay_plans(id) ON DELETE CASCADE,
  cycle_no integer NOT NULL DEFAULT 1,
  period_no integer NOT NULL,
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

-- One payout per member per cycle constraint
CREATE UNIQUE INDEX IF NOT EXISTS one_rosca_payout_per_member_cycle
  ON public.rosca_periods (plan_id, cycle_no, recipient_id) 
  WHERE recipient_id IS NOT NULL;

ALTER TABLE public.rosca_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view rosca periods" ON public.rosca_periods;
CREATE POLICY "Anyone can view rosca periods" ON public.rosca_periods
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage rosca periods" ON public.rosca_periods;
CREATE POLICY "Admins can manage rosca periods" ON public.rosca_periods
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================================================
-- 5. SCHEMA: SCHEME 3 - JOINT GOAL EXPENSES TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 6. FINANCIAL CORRECTNESS: SYNC MEMBER PLAN SUMMARY (FIXED DOUBLE DEDUCTION)
-- ==============================================================================
-- Ensure member_plans has pending_fine column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'member_plans' AND column_name = 'pending_fine'
  ) THEN
    ALTER TABLE public.member_plans ADD COLUMN pending_fine numeric(12,2) DEFAULT 0;
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_plan_payment_sync ON public.plan_payments;
DROP FUNCTION IF EXISTS public.handle_plan_payment_sync() CASCADE;
DROP FUNCTION IF EXISTS public.handle_plan_payment_sync CASCADE;
DROP FUNCTION IF EXISTS public.sync_member_plan_summary(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.sync_member_plan_summary CASCADE;

CREATE OR REPLACE FUNCTION public.sync_member_plan_summary(p_member_plan_id UUID)
RETURNS VOID AS $func$
DECLARE
    r RECORD;
    v_total_installment NUMERIC(12,2) := 0;
    v_total_adjustment NUMERIC(12,2) := 0;
    v_total_refund NUMERIC(12,2) := 0;
    v_running_pending_fine NUMERIC(12,2) := 0;
    v_total_collected NUMERIC(12,2) := 0;

    v_plan_id UUID;
    v_installment_amount NUMERIC(12,2);
    v_frequency TEXT;
    v_due_day INTEGER;
    v_due_date INTEGER;
    v_start_date DATE;
    v_installments_collected INTEGER := 0;
    v_next_due DATE;
    v_current_month_start DATE;
    v_i INTEGER;
BEGIN
    -- Chronological calculation of payments
    FOR r IN 
        SELECT amount, type, penalty_paid
        FROM public.plan_payments
        WHERE member_plan_id = p_member_plan_id AND status = 'approved'
        ORDER BY payment_date ASC, created_at ASC, id ASC
    LOOP
        IF r.type IN ('fine', 'fine_accrued') THEN
            v_running_pending_fine := v_running_pending_fine + COALESCE(r.amount, 0);
        ELSIF r.type = 'waiver' THEN
            v_running_pending_fine := GREATEST(0, v_running_pending_fine - COALESCE(r.amount, 0));
        ELSIF r.type = 'fine_payment' THEN
            v_running_pending_fine := GREATEST(0, v_running_pending_fine - COALESCE(r.amount, 0));
        ELSIF r.type = 'adjustment' THEN
            v_total_adjustment := v_total_adjustment + COALESCE(r.amount, 0);
        ELSIF r.type = 'refund' THEN
            v_total_refund := v_total_refund + COALESCE(r.amount, 0);
        ELSIF r.type IN ('installment_payment', 'payment', 'installment') THEN
            IF COALESCE(r.penalty_paid, 0) > 0 THEN
                v_running_pending_fine := GREATEST(0, v_running_pending_fine - r.penalty_paid);
            END IF;
            v_total_installment := v_total_installment + COALESCE(r.amount, 0);
        END IF;
    END LOOP;

    -- Total savings capital collected (never negative)
    v_total_collected := GREATEST(0, v_total_installment + v_total_adjustment - v_total_refund);

    -- Fetch plan details
    SELECT 
        p.installment_amount, p.frequency, p.due_day, p.due_date, mp.start_date::DATE, mp.plan_id
    INTO 
        v_installment_amount, v_frequency, v_due_day, v_due_date, v_start_date, v_plan_id
    FROM public.member_plans mp
    JOIN public.somobay_plans p ON mp.plan_id = p.id
    WHERE mp.id = p_member_plan_id;

    IF v_plan_id IS NULL THEN
        RETURN;
    END IF;

    -- Installments collected count is purely based on actual installment savings collected
    IF COALESCE(v_installment_amount, 0) > 0 THEN
        v_installments_collected := FLOOR(v_total_collected / v_installment_amount);
    ELSE
        v_installments_collected := 0;
    END IF;

    -- Next due date calculation
    v_next_due := v_start_date;
    IF v_frequency = 'weekly' THEN
        v_next_due := v_next_due + ((COALESCE(v_due_day, 0) - EXTRACT(DOW FROM v_next_due)::INTEGER + 7) % 7) * INTERVAL '1 day';
        IF v_next_due <= v_start_date THEN
            v_next_due := v_next_due + INTERVAL '7 days';
        END IF;
        v_next_due := v_next_due + (v_installments_collected * 7) * INTERVAL '1 day';
    ELSIF v_frequency = 'monthly' THEN
        v_current_month_start := date_trunc('month', v_start_date)::DATE;
        v_next_due := (v_current_month_start + (COALESCE(v_due_date, 1) - 1) * INTERVAL '1 day')::DATE;
        IF EXTRACT(MONTH FROM v_next_due) != EXTRACT(MONTH FROM v_current_month_start) THEN
            v_next_due := (date_trunc('month', v_next_due) - INTERVAL '1 day')::DATE;
        END IF;
        IF v_next_due <= v_start_date THEN
            v_current_month_start := (v_current_month_start + INTERVAL '1 month')::DATE;
            v_next_due := (v_current_month_start + (COALESCE(v_due_date, 1) - 1) * INTERVAL '1 day')::DATE;
            IF EXTRACT(MONTH FROM v_next_due) != EXTRACT(MONTH FROM v_current_month_start) THEN
                v_next_due := (date_trunc('month', v_next_due) - INTERVAL '1 day')::DATE;
            END IF;
        END IF;
        FOR v_i IN 1..v_installments_collected LOOP
            v_current_month_start := (v_current_month_start + INTERVAL '1 month')::DATE;
            v_next_due := (v_current_month_start + (COALESCE(v_due_date, 1) - 1) * INTERVAL '1 day')::DATE;
            IF EXTRACT(MONTH FROM v_next_due) != EXTRACT(MONTH FROM v_current_month_start) THEN
                v_next_due := (date_trunc('month', v_next_due) - INTERVAL '1 day')::DATE;
            END IF;
        END LOOP;
    END IF;

    -- Update member_plans with BOTH total_collected, pending_fine, and next_due_date
    UPDATE public.member_plans
    SET 
        total_collected = v_total_collected,
        pending_fine = v_running_pending_fine,
        next_due_date = v_next_due
    WHERE id = p_member_plan_id;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on plan_payments to auto-sync summary on insert/update/delete
CREATE OR REPLACE FUNCTION public.handle_plan_payment_sync()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_member_plan_summary(OLD.member_plan_id);
    ELSE
        PERFORM public.sync_member_plan_summary(NEW.member_plan_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_plan_payment_sync ON public.plan_payments;
CREATE TRIGGER tr_plan_payment_sync
AFTER INSERT OR UPDATE OR DELETE ON public.plan_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_plan_payment_sync();

-- ==============================================================================
-- 7. ATOMIC RPC: RECORD BULK PLAN INSTALLMENTS
-- ==============================================================================
DROP FUNCTION IF EXISTS public.record_bulk_plan_installments(uuid[], uuid, numeric, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.record_bulk_plan_installments CASCADE;

CREATE OR REPLACE FUNCTION public.record_bulk_plan_installments(
  p_member_ids uuid[],
  p_plan_id uuid DEFAULT NULL,
  p_amount numeric DEFAULT 0,
  p_admin_id uuid DEFAULT NULL,
  p_note text DEFAULT 'বাল্ক কিস্তি সংগ্রহ'
)
RETURNS jsonb AS $$
DECLARE
  v_mid uuid;
  v_mp_id uuid;
  v_success_count integer := 0;
BEGIN
  -- Strict security check
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'অননুমোদিত অ্যাক্সেস: শুধুমাত্র অ্যাডমিন বাল্ক কিস্তি জমা করতে পারেন।';
  END IF;

  FOREACH v_mid IN ARRAY p_member_ids
  LOOP
    SELECT id INTO v_mp_id 
    FROM public.member_plans 
    WHERE member_id = v_mid 
      AND (plan_id = p_plan_id OR p_plan_id IS NULL)
      AND status = 'active'
    LIMIT 1;

    IF v_mp_id IS NOT NULL THEN
      INSERT INTO public.plan_payments (
        member_plan_id,
        amount,
        penalty_paid,
        admin_id,
        note,
        status,
        type
      ) VALUES (
        v_mp_id,
        p_amount,
        0,
        COALESCE(p_admin_id, auth.uid()),
        p_note,
        'approved',
        'installment'
      );

      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        source_module
      ) VALUES (
        v_mid,
        'কিস্তি পরিশোধ (বাল্ক)',
        format('%s টাকা কিস্তি জমা গ্রহণ করা হয়েছে।', p_amount),
        'success',
        'plan'
      );

      v_success_count := v_success_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_success_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. SECURITY: SECURE BULK_DEPOSIT_SELECTED RPC
-- ==============================================================================
-- Drop all existing variants to prevent Postgres 42P13 return type conflict
DROP FUNCTION IF EXISTS public.bulk_deposit_selected(uuid[], numeric, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_deposit_selected(uuid[], numeric, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_deposit_selected CASCADE;

CREATE OR REPLACE FUNCTION public.bulk_deposit_selected(
  member_ids uuid[],
  deposit_amount numeric,
  admin_uuid uuid,
  deposit_note text,
  dep_type text DEFAULT 'savings'
)
RETURNS jsonb AS $$
BEGIN
  -- Authorization verification
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'অননুমোদিত অ্যাক্সেস: শুধুমাত্র অ্যাডমিন বাল্ক ডিপোজিট করতে পারেন।';
  END IF;

  -- Proceed with recording
  INSERT INTO public.member_actions (
    member_id,
    action_type,
    amount,
    admin_id,
    note
  )
  SELECT 
    m_id,
    dep_type,
    deposit_amount,
    admin_uuid,
    deposit_note
  FROM unnest(member_ids) AS m_id;

  RETURN jsonb_build_object('success', true, 'count', array_length(member_ids, 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. CONFIGURATION: DISABLE WALLET SYSTEM BY DEFAULT
-- ==============================================================================
UPDATE public.app_settings 
SET is_wallet_enabled = false 
WHERE is_wallet_enabled IS DISTINCT FROM false;

-- Re-sync all existing member plans using the corrected mathematical formula
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.member_plans LOOP
        PERFORM public.sync_member_plan_summary(r.id);
    END LOOP;
END $$;
