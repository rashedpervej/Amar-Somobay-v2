-- ==============================================================================
-- PHASE 3: CORE WORKFLOW COMPLETION MIGRATION
-- 1. Member Savings Withdrawal Requests (সঞ্চয় উত্তোলন আবেদন)
-- 2. Pending Payment Approval Security Policies
-- 3. ROSCA Payout Ledger Synchronization
-- ==============================================================================

-- 0. Ensure wallet_transactions ledger table exists
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_member ON public.wallet_transactions(member_id);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Authenticated users can view wallet transactions" ON public.wallet_transactions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can manage wallet transactions" ON public.wallet_transactions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')));

-- 1. Create table for member savings withdrawal requests
CREATE TABLE IF NOT EXISTS public.savings_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_plan_id UUID NOT NULL REFERENCES public.member_plans(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    account_number TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_savings_withdrawals_member ON public.savings_withdrawals(member_id);
CREATE INDEX IF NOT EXISTS idx_savings_withdrawals_status ON public.savings_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_savings_withdrawals_plan ON public.savings_withdrawals(member_plan_id);

-- Enable RLS
ALTER TABLE public.savings_withdrawals ENABLE ROW LEVEL SECURITY;

-- Member policies: can view own requests, can insert own requests
DROP POLICY IF EXISTS "Members can view own withdrawal requests" ON public.savings_withdrawals;
CREATE POLICY "Members can view own withdrawal requests"
ON public.savings_withdrawals FOR SELECT
TO authenticated
USING (
    member_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
);

DROP POLICY IF EXISTS "Members can create own withdrawal requests" ON public.savings_withdrawals;
CREATE POLICY "Members can create own withdrawal requests"
ON public.savings_withdrawals FOR INSERT
TO authenticated
WITH CHECK (
    member_id = auth.uid() AND status = 'pending'
);

-- Admin policies: can update (approve/reject)
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.savings_withdrawals;
CREATE POLICY "Admins can update withdrawal requests"
ON public.savings_withdrawals FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
);

-- 2. Ensure plan_payments has status column and admin update policy for approval queue
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plan_payments' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.plan_payments ADD COLUMN status TEXT DEFAULT 'approved';
    END IF;
END $$;

-- Policy allowing admins to update plan_payments status (Approval Queue)
DROP POLICY IF EXISTS "Admins can update plan_payments status" ON public.plan_payments;
CREATE POLICY "Admins can update plan_payments status"
ON public.plan_payments FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
);

-- 3. Trigger: Automatically adjust member_plans total_collected upon approved withdrawal
CREATE OR REPLACE FUNCTION public.handle_approved_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Mark processed timestamp
        NEW.processed_at = NOW();

        -- Deduct from member_plans total_collected
        UPDATE public.member_plans
        SET total_collected = GREATEST(0, total_collected - NEW.amount)
        WHERE id = NEW.member_plan_id;

        -- Record transaction entry in wallet_transactions
        INSERT INTO public.wallet_transactions (
            member_id,
            amount,
            transaction_type,
            note,
            admin_id
        ) VALUES (
            NEW.member_id,
            NEW.amount,
            'withdrawal',
            COALESCE(NEW.admin_note, 'সঞ্চয় তহবিল থেকে উত্তোলন অনুমোদন'),
            NEW.admin_id
        );

        -- Send notification to member
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            source_module
        ) VALUES (
            NEW.member_id,
            'সঞ্চয় উত্তোলন অনুমোদিত',
            'আপনার ' || NEW.amount::text || ' টাকা সঞ্চয় উত্তোলন আবেদন অনুমোদিত ও পরিশোধ করা হয়েছে।',
            'success',
            'plan'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_approved_withdrawal ON public.savings_withdrawals;
CREATE TRIGGER trg_handle_approved_withdrawal
BEFORE UPDATE ON public.savings_withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.handle_approved_withdrawal();
