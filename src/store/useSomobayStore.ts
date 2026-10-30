import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { formatLocalDate, getTodayLocalDate } from '../lib/dateUtils';

export interface SomobayPlan {
  id: string;
  name: string;
  description: string;
  duration_months: number;
  installment_amount: number;
  frequency: 'weekly' | 'monthly' | 'custom';
  due_day?: number; // 0-6 for weekly (Sunday-Saturday)
  due_date?: number; // 1-31 for monthly
  target_amount: number;
  profit_percentage: number;
  late_fee_amount: number;
  scheme_type?: 'General' | 'savings' | 'rosca' | 'joint_goal' | 'qard';
  total_members_limit?: number;
  current_cycle?: number;
  is_active: boolean;
  status: 'active' | 'paused' | 'completed' | 'inactive' | 'archived';
  organization_id?: string;
  created_at?: string;
}

export interface RoscaPeriod {
  id: string;
  plan_id: string;
  cycle_no: number;
  period_no: number;
  due_date?: string;
  recipient_id?: string;
  payout_amount: number;
  draw_method: 'lottery' | 'turn' | 'bidding';
  draw_seed?: string;
  drawn_at?: string;
  status: 'open' | 'drawn' | 'completed';
  notes?: string;
  recipient?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface JointGoalExpense {
  id: string;
  plan_id: string;
  title: string;
  amount: number;
  expense_date: string;
  spent_by?: string;
  approved_by?: string;
  proof_url?: string;
  note?: string;
  created_at?: string;
}

export interface MemberPlan {
  id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'matured' | 'cancelled';
  total_collected: number;
  pending_fine?: number;
  next_due_date: string | null;
  plan?: SomobayPlan;
  profile?: {
    full_name: string;
  };
}

export interface PlanPayment {
  id: string;
  member_plan_id: string;
  amount: number;
  penalty_paid: number;
  payment_date: string;
  admin_id: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  type?: 'payment' | 'fine' | 'adjustment' | 'waiver' | 'refund';
}

export interface PlanBalances {
  totalInstallment: number;
  totalAdjustment: number;
  totalPendingFine: number;
  effectiveInstallmentBalance: number;
  totalFinesCollected: number;
}

export function calculateMemberPlanBalances(payments: any[]): PlanBalances {
  const sortedPayments = [...payments]
    .filter(p => !p.status || p.status === 'approved')
    .sort((a, b) => new Date(a.payment_date || a.created_at || 0).getTime() - new Date(b.payment_date || b.created_at || 0).getTime());

  let totalInstallment = 0;
  let totalAdjustment = 0;
  let totalRefund = 0;
  let runningPendingFine = 0;
  let totalFinesCollected = 0;

  for (const p of sortedPayments) {
    const type = p.type || 'payment';
    const amount = Number(p.amount) || 0;
    const penaltyPaid = Number(p.penalty_paid) || 0;

    if (type === 'fine' || type === 'fine_accrued') {
      runningPendingFine += amount;
    } else if (type === 'fine_payment') {
      const finePaid = Math.min(amount, runningPendingFine);
      runningPendingFine -= finePaid;
      totalFinesCollected += amount;
    } else if (type === 'waiver') {
      const waiverAmt = Math.min(amount, runningPendingFine);
      runningPendingFine -= waiverAmt;
    } else if (type === 'adjustment') {
      totalAdjustment += amount;
    } else if (type === 'refund') {
      totalRefund += amount;
    } else if (type === 'installment_payment' || type === 'payment' || type === 'installment') {
      if (penaltyPaid > 0) {
        const penaltyAdjusted = Math.min(penaltyPaid, runningPendingFine);
        runningPendingFine -= penaltyAdjusted;
        totalFinesCollected += penaltyPaid;
      }
      totalInstallment += amount;
    }
  }

  const netAdjustment = totalAdjustment - totalRefund;
  const effectiveInstallmentBalance = Math.max(0, totalInstallment + netAdjustment);

  return {
    totalInstallment,
    totalAdjustment: netAdjustment,
    totalPendingFine: Math.max(0, runningPendingFine),
    effectiveInstallmentBalance,
    totalFinesCollected: Math.max(0, totalFinesCollected)
  };
}

interface SomobayState {
  plans: SomobayPlan[];
  memberPlans: MemberPlan[];
  loading: boolean;
  
  adminStats: {
    totalMembers: number;
    activePlanTypes: number;
    activeEnrollments: number;
    totalCollections: number;
    totalFinesCollected: number;
    overdueMembers: number;
    pendingDues: number;
  };
  
  fetchPlans: () => Promise<void>;
  fetchMemberPlans: (userId?: string) => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  createPlan: (plan: Omit<SomobayPlan, 'id' | 'is_active'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<SomobayPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  enrollMember: (memberId: string, planId: string, durationMonths: number, frequency: string) => Promise<void>;
  recordPayment: (data: {
    memberPlanId: string;
    amount: number;
    penalty: number;
    adminId: string;
    note: string;
    type?: 'payment' | 'fine' | 'adjustment' | 'waiver' | 'refund' | 'installment_payment' | 'fine_payment';
    paymentDate?: string;
  }) => Promise<void>;
  sendReminders: () => Promise<{ sent: number; alreadyNotified: number }>;
  transferMember: (memberPlanId: string, currentMemberId: string, newMemberId: string, adminId: string) => Promise<void>;
  releaseMember: (memberPlanId: string, adminId: string) => Promise<void>;
  updateMemberPlanStatus: (memberPlanId: string, status: MemberPlan['status'], adminId: string) => Promise<void>;
  fetchRoscaPeriods: (planId: string) => Promise<RoscaPeriod[]>;
  conductRoscaDraw: (periodId: string, recipientId: string, payoutAmount: number, method: 'lottery' | 'turn' | 'bidding', note?: string) => Promise<void>;
  generateRoscaSchedule: (planId: string, totalPeriods: number, cycleNo?: number) => Promise<void>;
  fetchGoalExpenses: (planId: string) => Promise<JointGoalExpense[]>;
  recordGoalExpense: (expense: Omit<JointGoalExpense, 'id' | 'created_at'>) => Promise<void>;
}

export const useSomobayStore = create<SomobayState>((set, get) => ({
  plans: [],
  memberPlans: [],
  loading: false,
  adminStats: {
    totalMembers: 0,
    activePlanTypes: 0,
    activeEnrollments: 0,
    totalCollections: 0,
    totalFinesCollected: 0,
    overdueMembers: 0,
    pendingDues: 0
  },

  fetchPlans: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('somobay_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) set({ plans: data || [] });
    set({ loading: false });
  },

  fetchMemberPlans: async (userId) => {
    set({ loading: true });
    // Use explicit join syntax with table names to avoid ambiguity
    let query = supabase
      .from('member_plans')
      .select(`
        *,
        plan:somobay_plans(*),
        profiles:member_id(full_name)
      `);
    
    if (userId) {
      query = query.eq('member_id', userId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching member plans:', error);
    } else {
      // Fetch approved payments to dynamically calculate exact balances
      const { data: paymentsData } = await supabase
        .from('plan_payments')
        .select('*')
        .eq('status', 'approved');

      const approvedPayments = paymentsData || [];

      const enrichedPlans = (data || []).map((mp: any) => {
        const paymentsForMember = approvedPayments.filter((p: any) => p.member_plan_id === mp.id);
        const stats = calculateMemberPlanBalances(paymentsForMember);
        return {
          ...mp,
          total_collected: stats.effectiveInstallmentBalance,
          pending_fine: stats.totalPendingFine
        };
      });

      set({ memberPlans: enrichedPlans });
    }
    set({ loading: false });
  },

  fetchAdminStats: async () => {
    try {
      set({ loading: true });
      const today = getTodayLocalDate();

      // 1. Total Members
      const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member');

      // 2. Active Plan Types (Templates)
      const { count: planTypesCount } = await supabase.from('somobay_plans').select('*', { count: 'exact', head: true }).eq('is_active', true);

      // 3. Active Enrollments & Overdue Info
      const { data: plansData } = await supabase.from('member_plans').select('id, next_due_date, status, plan:somobay_plans(installment_amount)');
      
      const activeEnrollments = plansData?.filter(p => p.status === 'active') || [];
      const overduePlans = activeEnrollments.filter(p => p.next_due_date && p.next_due_date < today);
      
      // Calculate pending dues (rough estimate)
      const pendingDues = overduePlans.reduce((acc, curr) => acc + ((curr.plan as any)?.installment_amount || 0), 0);

      // 4. Total Collections and Fines from All Time using Centralized Formula
      const { data: paymentsData } = await supabase.from('plan_payments').select('member_plan_id, amount, type, status, penalty_paid');
      const approvedPayments = paymentsData?.filter(p => !p.status || p.status === 'approved') || [];
      
      const paymentsGrouped: { [key: string]: any[] } = {};
      for (const p of approvedPayments) {
        const mpId = p.member_plan_id || 'unknown';
        if (!paymentsGrouped[mpId]) {
          paymentsGrouped[mpId] = [];
        }
        paymentsGrouped[mpId].push(p);
      }

      let totalCollectionsAll = 0;
      let totalFinesCollectedAll = 0;

      for (const mpId of Object.keys(paymentsGrouped)) {
        const groupStats = calculateMemberPlanBalances(paymentsGrouped[mpId]);
        totalCollectionsAll += groupStats.effectiveInstallmentBalance;
        totalFinesCollectedAll += groupStats.totalFinesCollected;
      }

      // 5. Overdue Members (Unique members)
      const { data: overdueMembersData } = await supabase.from('member_plans').select('member_id').eq('status', 'active').lt('next_due_date', today);
      const overdueMembersCount = new Set(overdueMembersData?.map(m => m.member_id)).size;

      set({
        adminStats: {
          totalMembers: membersCount || 0,
          activePlanTypes: planTypesCount || 0,
          activeEnrollments: activeEnrollments.length,
          totalCollections: totalCollectionsAll,
          totalFinesCollected: totalFinesCollectedAll,
          overdueMembers: overdueMembersCount,
          pendingDues
        }
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      set({ loading: false });
    }
  },

  createPlan: async (plan) => {
    const targetType = plan.scheme_type || 'General';
    
    // Enforce Rule 1: Max 1 active/running Scheme per category
    let existingQuery = supabase
      .from('somobay_plans')
      .select('id, name, scheme_type, status')
      .neq('status', 'completed');

    if (targetType === 'General' || targetType === 'savings') {
      existingQuery = existingQuery.or('scheme_type.eq.General,scheme_type.eq.savings');
    } else {
      existingQuery = existingQuery.eq('scheme_type', targetType);
    }

    const { data: existingPlans } = await existingQuery;

    const typeLabels: Record<string, string> = {
      General: 'সাধারণ সমবায় (General Cooperative)',
      savings: 'সাধারণ সঞ্চয় (সমবায় সমিতি)',
      rosca: 'মেয়াদি / রোটেশনাল সঞ্চয় (ROSCA)',
      joint_goal: 'যৌথ সঞ্চয় (Joint Goal)'
    };

    if (existingPlans && existingPlans.length > 0) {
      const typeName = typeLabels[targetType] || targetType;
      throw new Error(`এই ক্যাটাগরিতে (${typeName}) ইতিমধ্যে একটি স্কিম ("${existingPlans[0].name}") বিদ্যমান রয়েছে। প্রাথমিক পর্যায়ে প্রতি ক্যাটাগরিতে সর্বোচ্চ ১টি স্কিম পরিচালিত হবে। প্রয়োজন হলে বিদ্যমান স্কিমটি সম্পাদনা বা পরিচালনা করুন।`);
    }

    // Enforce Rule 2: Strict Zero Interest (No profit percentage)
    const sanitizedPlan = {
      ...plan,
      profit_percentage: 0
    };

    const { error } = await supabase.from('somobay_plans').insert([sanitizedPlan]);
    if (error) throw error;
    get().fetchPlans();
  },

  deletePlan: async (id: string) => {
    try {
      // 1. Delete associated payments if any
      const { data: mps } = await supabase
        .from('member_plans')
        .select('id')
        .eq('plan_id', id);
      
      if (mps && mps.length > 0) {
        const mpIds = mps.map(m => m.id);
        await supabase.from('plan_payments').delete().in('member_plan_id', mpIds);
      }

      // 2. Delete member plans
      await supabase.from('member_plans').delete().eq('plan_id', id);

      // 3. Delete rosca periods & joint expenses
      await supabase.from('rosca_periods').delete().eq('plan_id', id);
      await supabase.from('joint_goal_expenses').delete().eq('plan_id', id);

      // 4. Delete the plan itself
      const { error } = await supabase
        .from('somobay_plans')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting plan:', error);
        throw error;
      }
      await get().fetchPlans();
    } catch (err) {
      console.error('deletePlan caught error:', err);
      throw err;
    }
  },

  updatePlan: async (id, plan) => {
    const { error } = await supabase.from('somobay_plans').update(plan).eq('id', id);
    if (error) throw error;
    get().fetchPlans();
  },

  enrollMember: async (memberId, planId, durationMonths, frequency) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Get plan details to respect due settings
    const { data: plan } = await supabase.from('somobay_plans').select('due_day, due_date').eq('id', planId).single();

    // Calculate initial next due date based on frequency and plan settings
    const nextDue = new Date();
    nextDue.setHours(0, 0, 0, 0); // Normalize to start of day

    if (frequency === 'weekly') {
      const targetDay = plan?.due_day ?? 0;
      const currentDay = nextDue.getDay();
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      
      // If today is target day, let's see if we should start today or next week
      // For enrollment, usually we start from the next upcoming one
      if (daysToAdd === 0) daysToAdd = 7; 
      
      nextDue.setDate(nextDue.getDate() + daysToAdd);
    } else if (frequency === 'monthly') {
      const targetDate = plan?.due_date ?? 1;
      const currentMonthDay = nextDue.getDate();
      
      if (currentMonthDay >= targetDate) {
        // Target date for this month has passed or is today, go to next month
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
      nextDue.setDate(targetDate);
    }

    const { error } = await supabase.from('member_plans').insert([{
      member_id: memberId,
      plan_id: planId,
      start_date: formatLocalDate(startDate),
      end_date: formatLocalDate(endDate),
      next_due_date: formatLocalDate(nextDue),
      status: 'active'
    }]);

    if (error) throw error;
    get().fetchMemberPlans();
  },

  recordPayment: async (data) => {
    // 1. Insert payment record - Source of Truth
    const paymentPayload: any = {
      member_plan_id: data.memberPlanId,
      amount: data.amount,
      penalty_paid: data.penalty,
      admin_id: data.adminId,
      note: data.note,
      status: 'approved',
      type: data.type || 'payment'
    };
    if (data.paymentDate) {
      paymentPayload.payment_date = data.paymentDate;
    }

    const { error: pError } = await supabase.from('plan_payments').insert([paymentPayload]);

    if (pError) throw pError;

    // We no longer manually update member_plans here.
    // The database trigger trg_sync_member_plan_summary handles it.
    
    // Record Notification based on dynamic type
    const { data: mpData } = await supabase.from('member_plans').select('member_id, plan:somobay_plans(name)').eq('id', data.memberPlanId).single();
     if (mpData) {
      let title = '';
      let message = '';
      let nType: 'success' | 'warning' | 'info' | 'error' = 'success';

      const type = data.type || 'payment';
      if (type === 'fine' || type === 'fine_payment') {
        title = 'জরিমানা যুক্ত';
        message = `আপনার "${(mpData as any).plan?.name}" প্ল্যানে ${data.amount.toLocaleString()} টাকা জরিমানা যুক্ত করা হয়েছে। নোট: ${data.note || 'নেই'}`;
        nType = 'warning';
      } else if (type === 'waiver') {
        title = 'জরিমানা মওকুফ';
        message = `আপনার "${(mpData as any).plan?.name}" প্ল্যানে ${data.amount.toLocaleString()} টাকা জরিমানা মওকুফ করা হয়েছে। নোট: ${data.note || 'নেই'}`;
        nType = 'success';
      } else if (type === 'adjustment') {
        title = 'সমন্বয়';
        message = `আপনার "${(mpData as any).plan?.name}" প্ল্যানে ${data.amount.toLocaleString()} টাকা সমন্বয় করা হয়েছে। নোট: ${data.note || 'নেই'}`;
        nType = 'info';
      } else if (type === 'refund') {
        title = 'টাকা রিফান্ড';
        message = `আপনার "${(mpData as any).plan?.name}" প্ল্যান থেকে ${data.amount.toLocaleString()} টাকা ফেরত/রিফান্ড করা হয়েছে। নোট: ${data.note || 'নেই'}`;
        nType = 'error';
      } else if (data.amount === 0 && data.penalty > 0) {
        title = 'জরিমানা আদায়';
        message = `আপনার "${(mpData as any).plan?.name}" প্ল্যানে ${data.penalty.toLocaleString()} টাকা জরিমানা পরিশোধ করা হয়েছে। নোট: ${data.note || 'নেই'}`;
        nType = 'success';
      } else {
        // Fallback for standard installment payment
        title = 'কিস্তি পরিশোধ';
        let detailText = `কিস্তি জমা দেওয়া হয়েছে`;
        if (data.penalty > 0) {
          detailText += ` (বিলম্ব ফি ৳${data.penalty.toLocaleString()} সহ)`;
        }
        message = `আপনার "${(mpData as any).plan?.name}" প্ল্যানে ${data.amount.toLocaleString()} টাকা ${detailText}। তারিখ: ${new Date().toLocaleDateString('bn-BD')}`;
        nType = 'success';
      }

      await supabase.from('notifications').insert([{
        user_id: mpData.member_id,
        organization_id: (mpData as any).organization_id || (mpData as any).plan?.organization_id || null,
        title,
        message,
        type: nType,
        source_module: 'plan'
      }]);
    }
    
    // Refresh to get updated data from the DB
    get().fetchMemberPlans();
    get().fetchAdminStats();
  },

  sendReminders: async () => {
    const { memberPlans } = get();
    const today = new Date();
    const overduePlans = memberPlans.filter(mp => 
      mp.status === 'active' && 
      mp.next_due_date && 
      new Date(mp.next_due_date) <= today
    );

    let sent = 0;
    let alreadyNotified = 0;

    for (const plan of overduePlans) {
      // Check if we already sent a reminder today to this user for this plan
      const { data: existingReminders } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', plan.member_id)
        .eq('type', 'warning')
        .ilike('message', `%${plan.plan?.name}%`)
        .gte('created_at', formatLocalDate(today));

      if (existingReminders && existingReminders.length > 0) {
        alreadyNotified++;
        continue;
      }

      await supabase.from('notifications').insert([{
        user_id: plan.member_id,
        organization_id: (plan as any).organization_id || (plan as any).plan?.organization_id || null,
        title: 'কিস্তি জমা দেওয়ার সময় হয়েছে',
        message: `আপনার "${plan.plan?.name}" প্ল্যান এর কিস্তি জমা দেওয়ার তারিখ পার হয়েছে। অনুগ্রহ করে দ্রুত জমা দিন।`,
        type: 'warning',
        source_module: 'plan'
      }]);
      sent++;
    }

    return { sent, alreadyNotified };
  },

  transferMember: async (memberPlanId, currentMemberId, newMemberId, adminId) => {
    // 1. Update the member_plan record to have the new member
    const { error: updateError } = await supabase
      .from('member_plans')
      .update({ member_id: newMemberId })
      .eq('id', memberPlanId);

    if (updateError) throw updateError;

    // 2. Log this in member_actions or similar for audit trail
    await supabase.from('member_actions').insert([{
      member_id: newMemberId,
      action_type: 'plan_transfer',
      amount: 0,
      note: `Tranferred from member ID ${currentMemberId}. Original member enrollment ID: ${memberPlanId}`,
      admin_id: adminId,
      status: 'approved'
    }]);

    // 3. Notify the new member
    await supabase.from('notifications').insert([{
      user_id: newMemberId,
      title: 'নতুন প্ল্যান হস্তান্তর',
      message: 'একটি চালু থাকা সমবায় প্ল্যান আপনার নামে হস্তান্তর করা হয়েছে।',
      type: 'info',
      source_module: 'plan'
    }]);

    get().fetchMemberPlans();
  },

  releaseMember: async (memberPlanId, adminId) => {
    const { error } = await supabase
      .from('member_plans')
      .update({ status: 'cancelled' })
      .eq('id', memberPlanId);

    if (error) throw error;
    get().fetchMemberPlans();
  },

  updateMemberPlanStatus: async (memberPlanId, status, adminId) => {
    const { error } = await supabase
      .from('member_plans')
      .update({ status })
      .eq('id', memberPlanId);

    if (error) throw error;
    get().fetchMemberPlans();
  },

  fetchRoscaPeriods: async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('rosca_periods')
        .select(`
          *,
          recipient:recipient_id(full_name, avatar_url)
        `)
        .eq('plan_id', planId)
        .order('period_no', { ascending: true });
      if (error) {
        console.warn('Error fetching rosca periods:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('Rosca periods table might be pending migration:', e);
      return [];
    }
  },

  conductRoscaDraw: async (periodId, recipientId, payoutAmount, method, note) => {
    const { error } = await supabase
      .from('rosca_periods')
      .update({
        recipient_id: recipientId,
        payout_amount: payoutAmount,
        draw_method: method,
        drawn_at: new Date().toISOString(),
        status: 'drawn',
        notes: note
      })
      .eq('id', periodId);
    if (error) throw error;
  },

  generateRoscaSchedule: async (planId, totalPeriods, cycleNo = 1) => {
    const periodsToInsert = [];
    for (let i = 1; i <= totalPeriods; i++) {
      periodsToInsert.push({
        plan_id: planId,
        cycle_no: cycleNo,
        period_no: i,
        status: 'open',
        draw_method: 'lottery'
      });
    }
    const { error } = await supabase
      .from('rosca_periods')
      .upsert(periodsToInsert, { onConflict: 'plan_id,cycle_no,period_no' });
    if (error) throw error;
  },

  fetchGoalExpenses: async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('joint_goal_expenses')
        .select('*')
        .eq('plan_id', planId)
        .order('expense_date', { ascending: false });
      if (error) {
        console.warn('Error fetching goal expenses:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('Joint goal expenses table might be pending migration:', e);
      return [];
    }
  },

  recordGoalExpense: async (expense) => {
    const { error } = await supabase
      .from('joint_goal_expenses')
      .insert([expense]);
    if (error) throw error;
  }
}));
