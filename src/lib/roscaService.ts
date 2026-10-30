import { supabase } from './supabase';
import { SomobayPlan, MemberPlan, RoscaPeriod, PlanPayment } from '../store/useSomobayStore';
import { getTodayLocalDate } from './dateUtils';

export interface RoscaMemberMetrics {
  memberId: string;
  memberPlanId: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  code: string;
  hasWon: boolean;
  wonPeriodNo?: number;
  wonDate?: string;
  totalPaid: number;
  totalRequired: number;
  isPaidCurrentMonth: boolean;
  isOverdue: boolean;
  lastPaymentDate?: string;
  monthlyStatus: 'paid' | 'overdue' | 'upcoming';
}

export interface RoscaMetrics {
  totalMembers: number;
  installmentAmount: number;
  potAmount: number;
  durationMonths: number;
  currentCycle: number;
  completedDraws: number;
  remainingDraws: number;
  progressPercent: number;
  totalCollected: number;
  totalPayouts: number;
  totalDue: number;
  nextPeriod?: RoscaPeriod;
  isCycleCompleted: boolean;
}

export const roscaService = {
  // 1. Fetch all ROSCA plans
  async getRoscaPlans(): Promise<SomobayPlan[]> {
    const { data, error } = await supabase
      .from('somobay_plans')
      .select('*')
      .eq('scheme_type', 'rosca')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching rosca plans:', error);
      return [];
    }
    return data || [];
  },

  // 2. Fetch specific ROSCA plan
  async getRoscaPlanById(planId: string): Promise<SomobayPlan | null> {
    const { data, error } = await supabase
      .from('somobay_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.warn('Error fetching plan:', error);
      return null;
    }
    return data;
  },

  // 3. Create a new ROSCA group
  async createRoscaPlan(plan: {
    name: string;
    description?: string;
    duration_months: number;
    installment_amount: number;
    total_members_limit: number;
    due_date: number;
    start_date?: string;
  }): Promise<SomobayPlan> {
    const pot = plan.duration_months * plan.installment_amount;
    const { data, error } = await supabase
      .from('somobay_plans')
      .insert([{
        name: plan.name,
        description: plan.description || 'রোটেশনাল সঞ্চয় সমিতি (ROSCA)',
        scheme_type: 'rosca',
        duration_months: plan.duration_months,
        installment_amount: plan.installment_amount,
        target_amount: pot,
        total_members_limit: plan.total_members_limit || plan.duration_months,
        frequency: 'monthly',
        due_date: plan.due_date || 1,
        due_day: null,
        late_fee_amount: 50,
        profit_percentage: 0,
        status: 'active',
        is_active: true,
        current_cycle: 1,
        created_at: plan.start_date || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Automatically generate the 12 periods schedule for Cycle 1
    if (data) {
      await this.generateRoscaSchedule(data.id, data.duration_months, 1, data.installment_amount * data.total_members_limit);
    }

    return data;
  },

  // 4. Update ROSCA plan settings
  async updateRoscaPlan(planId: string, updates: Partial<SomobayPlan>): Promise<void> {
    const { error } = await supabase
      .from('somobay_plans')
      .update(updates)
      .eq('id', planId);

    if (error) throw error;
  },

  // 5. Fetch enrolled members for a ROSCA group
  async getEnrolledMembers(planId: string): Promise<MemberPlan[]> {
    const { data, error } = await supabase
      .from('member_plans')
      .select(`
        *,
        plan:somobay_plans(*),
        profile:member_id(id, full_name, phone, avatar_url)
      `)
      .eq('plan_id', planId);

    if (error) {
      console.warn('Error fetching enrolled members:', error);
      return [];
    }
    return data || [];
  },

  // 6. Enroll a member into a ROSCA group
  async enrollMember(planId: string, memberId: string, durationMonths: number = 12): Promise<void> {
    const today = getTodayLocalDate();
    const endDate = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { error } = await supabase
      .from('member_plans')
      .insert([{
        plan_id: planId,
        member_id: memberId,
        start_date: today,
        end_date: endDate,
        status: 'active',
        total_collected: 0,
        next_due_date: today
      }]);

    if (error) throw error;
  },

  // 7. Fetch all ROSCA periods for a plan (optionally filtered by cycle)
  async getRoscaPeriods(planId: string, cycleNo?: number): Promise<RoscaPeriod[]> {
    let query = supabase
      .from('rosca_periods')
      .select(`
        *,
        recipient:recipient_id(id, full_name, phone, avatar_url)
      `)
      .eq('plan_id', planId)
      .order('period_no', { ascending: true });

    if (cycleNo !== undefined) {
      query = query.eq('cycle_no', cycleNo);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching rosca periods:', error);
      return [];
    }
    return data || [];
  },

  // 8. Generate full schedule of periods for a cycle
  async generateRoscaSchedule(planId: string, totalPeriods: number = 12, cycleNo: number = 1, potAmount?: number): Promise<void> {
    const periodsToInsert = [];
    const now = new Date();

    for (let i = 1; i <= totalPeriods; i++) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() + (i - 1), 15);
      periodsToInsert.push({
        plan_id: planId,
        cycle_no: cycleNo,
        period_no: i,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'open',
        draw_method: 'lottery',
        payout_amount: potAmount || 0
      });
    }

    const { error } = await supabase
      .from('rosca_periods')
      .upsert(periodsToInsert, { onConflict: 'plan_id,cycle_no,period_no' });

    if (error) throw error;
  },

  // 9. Execute a ROSCA Draw (with strict business validation & ledger voucher)
  async conductDraw(params: {
    planId: string;
    periodId: string;
    recipientId: string;
    payoutAmount: number;
    method: 'lottery' | 'turn' | 'bidding';
    note?: string;
    adminId?: string;
  }): Promise<{ voucherRef: string }> {
    const { planId, periodId, recipientId, payoutAmount, method, note, adminId } = params;

    // A. Check if the period is already drawn
    const { data: period, error: pErr } = await supabase
      .from('rosca_periods')
      .select('*')
      .eq('id', periodId)
      .single();

    if (pErr || !period) throw new Error('ড্র পিরিয়ড খুঁজে পাওয়া যায়নি');
    if (period.status === 'drawn') throw new Error('এই রাউন্ডের ড্র ইতিমধ্যে সম্পন্ন হয়েছে');

    // B. Check if this recipient already won in the same cycle!
    const { data: existingWin } = await supabase
      .from('rosca_periods')
      .select('id, period_no')
      .eq('plan_id', planId)
      .eq('cycle_no', period.cycle_no)
      .eq('recipient_id', recipientId)
      .eq('status', 'drawn')
      .maybeSingle();

    if (existingWin) {
      throw new Error(`এই সদস্য ইতিমধ্যে ${existingWin.period_no}ম রাউন্ডে ড্র জিতেছেন। এক চক্রে দুইবার জেতার নিয়ম নেই।`);
    }

    // Generate unique financial voucher reference
    const voucherRef = `RO-PAY-${period.cycle_no}-${period.period_no}-${Date.now().toString().slice(-4).toUpperCase()}`;

    // C. Perform the draw update
    const drawnAt = new Date().toISOString();
    const noteWithVoucher = note 
      ? `${note} (ভাউচার: ${voucherRef})` 
      : `${period.period_no}ম রাউন্ড ড্র (ভাউচার: ${voucherRef})`;

    const { error: drawErr } = await supabase
      .from('rosca_periods')
      .update({
        recipient_id: recipientId,
        payout_amount: payoutAmount,
        draw_method: method,
        drawn_at: drawnAt,
        status: 'drawn',
        notes: noteWithVoucher
      })
      .eq('id', periodId);

    if (drawErr) throw drawErr;

    // D. Record payout voucher transaction in ledger (wallet_transactions)
    try {
      await supabase.from('wallet_transactions').insert([{
        member_id: recipientId,
        amount: payoutAmount,
        transaction_type: 'rosca_payout',
        note: `রোটেশনাল সঞ্চয় ড্র পেআউট ভাউচার (${voucherRef}): চক্র ${period.cycle_no}, রাউন্ড ${period.period_no} (${method === 'lottery' ? 'লটারি' : method === 'bidding' ? 'নিলাম' : 'পালা'})`,
        admin_id: adminId || null
      }]);
    } catch (wErr) {
      console.warn('Failed to insert payout voucher into wallet_transactions:', wErr);
    }

    // E. Send notification to the winner
    try {
      await supabase.from('notifications').insert([{
        user_id: recipientId,
        organization_id: (period as any)?.organization_id || null,
        title: 'অভিনন্দন! আপনি ড্র পেয়েছেন',
        message: `আপনার রোটেশনাল সঞ্চয় গ্রুপে আপনি ${period.period_no}ম রাউন্ডের ড্র জিতেছেন। সর্বমোট পুল: ৳${payoutAmount.toLocaleString()} (ভাউচার: ${voucherRef})`,
        type: 'success',
        source_module: 'plan'
      }]);
    } catch (e) {
      console.warn('Failed to insert notification:', e);
    }

    return { voucherRef };
  },

  // 10. Record single installment payment for a member
  async recordInstallment(params: {
    memberPlanId: string;
    amount: number;
    adminId: string;
    paymentDate?: string;
    note?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('plan_payments')
      .insert([{
        member_plan_id: params.memberPlanId,
        amount: params.amount,
        penalty_paid: 0,
        payment_date: params.paymentDate || getTodayLocalDate(),
        admin_id: params.adminId,
        status: 'approved',
        note: params.note || 'মাসিক কিস্তি জমা',
        type: 'installment_payment'
      }]);

    if (error) throw error;
  },

  // 11. Bulk record installment payments
  async bulkRecordInstallments(params: {
    memberPlanIds: string[];
    amountPerMember: number;
    adminId: string;
    paymentDate?: string;
    note?: string;
  }): Promise<void> {
    const payments = params.memberPlanIds.map(id => ({
      member_plan_id: id,
      amount: params.amountPerMember,
      penalty_paid: 0,
      payment_date: params.paymentDate || getTodayLocalDate(),
      admin_id: params.adminId,
      status: 'approved',
      note: params.note || 'একসাথে কিস্তি আদায়',
      type: 'installment_payment'
    }));

    const { error } = await supabase
      .from('plan_payments')
      .insert(payments);

    if (error) throw error;
  },

  // 12. Complete Current Cycle and start next cycle
  async startNextCycle(planId: string): Promise<number> {
    const plan = await this.getRoscaPlanById(planId);
    if (!plan) throw new Error('প্ল্যান পাওয়া যায়নি');

    const nextCycleNo = (plan.current_cycle || 1) + 1;

    // Update plan's current cycle
    const { error } = await supabase
      .from('somobay_plans')
      .update({
        current_cycle: nextCycleNo,
        status: 'active'
      })
      .eq('id', planId);

    if (error) throw error;

    // Generate schedule for the next cycle
    const pot = (plan.total_members_limit || 12) * plan.installment_amount;
    await this.generateRoscaSchedule(planId, plan.duration_months, nextCycleNo, pot);

    return nextCycleNo;
  }
};
