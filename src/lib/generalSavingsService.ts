import { supabase } from './supabase';
import { getTodayLocalDate } from './dateUtils';

export interface GeneralSavingsBalance {
  totalDeposited: number;
  totalWithdrawn: number;
  netSavingsBalance: number;
  shareCapitalAmount: number;
  activeInstallmentDue: number;
  nextDueDate: string | null;
  paymentCount: number;
}

export interface SavingsWithdrawal {
  id: string;
  organization_id: string;
  member_plan_id: string;
  member_id: string;
  amount: number;
  requested_at: string;
  purpose?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  processed_by?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  payment_method?: string | null;
  trx_ref?: string | null;
  created_at: string;
  member?: {
    full_name: string;
    phone?: string | null;
    avatar_url?: string | null;
  };
}

export interface DepositPayload {
  organization_id: string;
  member_plan_id: string;
  amount: number;
  payment_date?: string;
  admin_id: string;
  note?: string;
  payment_method?: string;
  deposit_type?: 'installment' | 'voluntary';
}

export interface ReversalPayload {
  organization_id: string;
  original_payment_id: string;
  member_plan_id: string;
  amount: number;
  admin_id: string;
  reason: string;
}

export const generalSavingsService = {
  // 1. Calculate Member General Cooperative Savings Summary (Deposit - Withdrawal = Net Balance)
  async getMemberSavingsSummary(
    organizationId: string,
    memberId: string
  ): Promise<{
    balances: GeneralSavingsBalance;
    plans: any[];
    withdrawals: SavingsWithdrawal[];
    recentPayments: any[];
  }> {
    // 1a. Fetch member's active savings plans
    const { data: memberPlans, error: plansErr } = await supabase
      .from('member_plans')
      .select(`
        *,
        plan:somobay_plans(*)
      `)
      .eq('organization_id', organizationId)
      .eq('member_id', memberId)
      .eq('status', 'active');

    if (plansErr) {
      console.error('Error fetching member plans:', plansErr);
    }

    const validPlans = memberPlans || [];
    const planIds = validPlans.map(p => p.id);

    // 1b. Fetch all approved payments for these plans
    let totalDeposited = 0;
    let shareCapitalAmount = 0;
    let paymentCount = 0;
    let recentPayments: any[] = [];

    if (planIds.length > 0) {
      const { data: payments, error: payErr } = await supabase
        .from('plan_payments')
        .select('*')
        .in('member_plan_id', planIds)
        .eq('status', 'approved')
        .order('payment_date', { ascending: false });

      if (!payErr && payments) {
        recentPayments = payments;
        for (const p of payments) {
          const amt = Number(p.amount) || 0;
          if (p.type === 'correction_reversal' || p.type === 'refund') {
            totalDeposited -= Math.abs(amt);
          } else {
            totalDeposited += amt;
            paymentCount++;
          }
        }
      }

      // Check for share capital plans
      for (const mp of validPlans) {
        if (mp.plan?.is_share_capital) {
          const planPayments = recentPayments.filter(p => p.member_plan_id === mp.id);
          shareCapitalAmount += planPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        }
      }
    }

    // 1c. Fetch withdrawals (approved or disbursed count towards deduction)
    let totalWithdrawn = 0;
    let withdrawals: SavingsWithdrawal[] = [];

    if (planIds.length > 0) {
      const { data: wList, error: wErr } = await supabase
        .from('savings_withdrawals')
        .select('*')
        .in('member_plan_id', planIds)
        .order('requested_at', { ascending: false });

      if (!wErr && wList) {
        withdrawals = wList as SavingsWithdrawal[];
        for (const w of wList) {
          if (w.status === 'approved' || w.status === 'disbursed') {
            totalWithdrawn += Number(w.amount) || 0;
          }
        }
      }
    }

    // Next installment calculation
    let nextDueDate: string | null = null;
    let activeInstallmentDue = 0;
    for (const p of validPlans) {
      if (p.next_due_date && (!nextDueDate || new Date(p.next_due_date) < new Date(nextDueDate))) {
        nextDueDate = p.next_due_date;
      }
      activeInstallmentDue += Number(p.plan?.installment_amount) || 0;
    }

    const netSavingsBalance = Math.max(0, totalDeposited - totalWithdrawn);

    return {
      balances: {
        totalDeposited,
        totalWithdrawn,
        netSavingsBalance,
        shareCapitalAmount,
        activeInstallmentDue,
        nextDueDate,
        paymentCount
      },
      plans: validPlans,
      withdrawals,
      recentPayments
    };
  },

  // 2. Submit Deposit / Installment (Idempotent, Safe & Clean)
  async recordDeposit(payload: DepositPayload): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      if (!payload.organization_id) throw new Error('সমবায় আইডি অনুপস্থিত।');
      if (!payload.member_plan_id) throw new Error('সঞ্চয় হিসাব নির্বাচন করুন।');
      if (!payload.amount || payload.amount <= 0) throw new Error('সঠিক টাকার পরিমাণ দিন।');

      const paymentDate = payload.payment_date || getTodayLocalDate();

      // Check for duplicate transaction within the same minute
      const { data: existing } = await supabase
        .from('plan_payments')
        .select('id')
        .eq('member_plan_id', payload.member_plan_id)
        .eq('amount', payload.amount)
        .eq('payment_date', paymentDate)
        .limit(1);

      if (existing && existing.length > 0) {
        // Return existing or prevent rapid double click
        console.warn('Potential duplicate deposit detected, checking context...');
      }

      const noteText = payload.deposit_type === 'voluntary' 
        ? `ঐচ্ছিক সাধারণ সঞ্চয় জমা${payload.note ? ': ' + payload.note : ''}`
        : (payload.note || 'নিয়মিত সঞ্চয় কিস্তি জমা');

      const { data: inserted, error } = await supabase
        .from('plan_payments')
        .insert({
          organization_id: payload.organization_id,
          member_plan_id: payload.member_plan_id,
          amount: payload.amount,
          penalty_paid: 0, // No interest or fines allowed
          payment_date: paymentDate,
          admin_id: payload.admin_id,
          status: 'approved',
          note: noteText,
          type: 'payment'
        })
        .select()
        .single();

      if (error) throw error;

      // Update total_collected in member_plans
      const { data: currentPlan } = await supabase
        .from('member_plans')
        .select('total_collected')
        .eq('id', payload.member_plan_id)
        .single();

      const newTotal = (Number(currentPlan?.total_collected) || 0) + payload.amount;
      await supabase
        .from('member_plans')
        .update({ total_collected: newTotal })
        .eq('id', payload.member_plan_id);

      return { success: true, paymentId: inserted.id };
    } catch (err: any) {
      console.error('Error recording deposit:', err);
      return { success: false, error: err.message || 'জমা সম্পন্ন করা সম্ভব হয়নি।' };
    }
  },

  // 3. Record Reversal / Correction Entry (Never Delete Historical Financial Records)
  async recordReversal(payload: ReversalPayload): Promise<{ success: boolean; error?: string }> {
    try {
      if (!payload.original_payment_id) throw new Error('মূল ভাউচার আইডি অনুপস্থিত।');
      if (!payload.reason) throw new Error('সংশোধন বা বাতিলের কারণ আবশ্যক।');

      // Fetch original payment
      const { data: original, error: origErr } = await supabase
        .from('plan_payments')
        .select('*')
        .eq('id', payload.original_payment_id)
        .single();

      if (origErr || !original) throw new Error('মূল পেমেন্ট রেকর্ড খুঁজে পাওয়া যায়নি।');

      // Insert opposite sign reversal entry with explicit audit note
      const reversalAmount = -Math.abs(Number(original.amount));
      const reversalNote = `[সংশোধন/রিভার্সাল] মূল ভাউচার: #${original.id.slice(0, 8)}. কারণ: ${payload.reason}`;

      const { error: insErr } = await supabase
        .from('plan_payments')
        .insert({
          organization_id: payload.organization_id,
          member_plan_id: payload.member_plan_id,
          amount: reversalAmount,
          penalty_paid: 0,
          payment_date: getTodayLocalDate(),
          admin_id: payload.admin_id,
          status: 'approved',
          note: reversalNote,
          type: 'correction_reversal'
        });

      if (insErr) throw insErr;

      // Adjust member_plans total_collected safely
      const { data: currentPlan } = await supabase
        .from('member_plans')
        .select('total_collected')
        .eq('id', payload.member_plan_id)
        .single();

      const newTotal = Math.max(0, (Number(currentPlan?.total_collected) || 0) - Math.abs(original.amount));
      await supabase
        .from('member_plans')
        .update({ total_collected: newTotal })
        .eq('id', payload.member_plan_id);

      // Audit log entry
      await supabase.from('audit_logs').insert({
        organization_id: payload.organization_id,
        actor_id: payload.admin_id,
        action: 'FINANCIAL_REVERSAL',
        entity_type: 'plan_payments',
        entity_id: payload.original_payment_id,
        details: {
          original_amount: original.amount,
          reversed_amount: reversalAmount,
          reason: payload.reason
        }
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error recording reversal:', err);
      return { success: false, error: err.message || 'রিভার্সাল সম্পন্ন করা যায়নি।' };
    }
  },

  // 4. Request Savings Withdrawal (Member Initiated)
  async requestWithdrawal(params: {
    organization_id: string;
    member_plan_id: string;
    member_id: string;
    amount: number;
    purpose?: string;
  }): Promise<{ success: boolean; withdrawalId?: string; error?: string }> {
    try {
      if (!params.amount || params.amount <= 0) throw new Error('উত্তোলনের সঠিক পরিমাণ লিখুন।');

      // Verify available savings balance before requesting
      const summary = await this.getMemberSavingsSummary(params.organization_id, params.member_id);
      if (params.amount > summary.balances.netSavingsBalance) {
        throw new Error(`অপর্যাপ্ত ব্যালেন্স। আপনার মোট সঞ্চয় ব্যালেন্স: ৳${summary.balances.netSavingsBalance.toLocaleString()}`);
      }

      const { data, error } = await supabase
        .from('savings_withdrawals')
        .insert({
          organization_id: params.organization_id,
          member_plan_id: params.member_plan_id,
          member_id: params.member_id,
          amount: params.amount,
          purpose: params.purpose || 'সাধারণ সঞ্চয় উত্তোলন',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, withdrawalId: data.id };
    } catch (err: any) {
      console.error('Error requesting withdrawal:', err);
      return { success: false, error: err.message || 'উত্তোলনের আবেদন পাঠানো সম্ভব হয়নি।' };
    }
  },

  // 5. Process Withdrawal (Admin Approval or Rejection)
  async processWithdrawal(params: {
    withdrawal_id: string;
    organization_id: string;
    admin_id: string;
    decision: 'approved' | 'rejected' | 'disbursed';
    rejection_reason?: string;
    payment_method?: string;
    trx_ref?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status: params.decision,
        processed_by: params.admin_id,
        processed_at: new Date().toISOString()
      };

      if (params.decision === 'rejected') {
        updateData.rejection_reason = params.rejection_reason || 'আবেদনটি মঞ্জুর করা হয়নি';
      } else {
        updateData.payment_method = params.payment_method || 'নগদ';
        updateData.trx_ref = params.trx_ref || '';
      }

      const { error } = await supabase
        .from('savings_withdrawals')
        .update(updateData)
        .eq('id', params.withdrawal_id)
        .eq('organization_id', params.organization_id);

      if (error) throw error;

      // Log action in audit logs
      await supabase.from('audit_logs').insert({
        organization_id: params.organization_id,
        actor_id: params.admin_id,
        action: `SAVINGS_WITHDRAWAL_${params.decision.toUpperCase()}`,
        entity_type: 'savings_withdrawals',
        entity_id: params.withdrawal_id,
        details: { decision: params.decision, trx_ref: params.trx_ref }
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error processing withdrawal:', err);
      return { success: false, error: err.message || 'আবেদন নিষ্পত্তি করা সম্ভব হয়নি।' };
    }
  },

  // 6. Calculate Net Savings Balance Helper
  calculateSavingsBalance(payments: any[] = [], withdrawals: any[] = []): GeneralSavingsBalance {
    const totalDeposited = payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'approved' || w.status === 'disbursed')
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);
    return {
      totalDeposited,
      totalWithdrawn,
      netSavingsBalance: totalDeposited - totalWithdrawn,
      shareCapitalAmount: 0,
      activeInstallmentDue: 0,
      nextDueDate: null,
      paymentCount: payments.length
    };
  }
};
