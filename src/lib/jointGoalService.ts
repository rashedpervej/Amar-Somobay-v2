import { supabase } from './supabase';
import { SomobayPlan, MemberPlan, JointGoalExpense, PlanPayment } from '../store/useSomobayStore';
import { getTodayLocalDate } from './dateUtils';

export interface JointGoalMetrics {
  targetAmount: number;
  totalCollected: number;
  remainingAmount: number;
  totalSpent: number;
  availableFund: number;
  progressPercent: number;
  membersCount: number;
  contributionsCount: number;
  averageContribution: number;
  contributorsCount: number;
  pendingContributorsCount: number;
}

export interface MemberGoalContribution {
  memberId: string;
  memberPlanId: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  code: string;
  totalContributed: number;
  contributionsCount: number;
  lastContributionDate?: string;
  status: 'paid' | 'partial' | 'due';
}

const isUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

export const jointGoalService = {
  // 1. Fetch all Joint Goal plans
  async getGoals(): Promise<SomobayPlan[]> {
    const { data, error } = await supabase
      .from('somobay_plans')
      .select('*')
      .eq('scheme_type', 'joint_goal')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }
    return data;
  },

  // 2. Fetch specific goal by ID
  async getGoalById(goalId: string): Promise<SomobayPlan | null> {
    if (!goalId || goalId === 'default-goal' || !isUuid(goalId)) {
      return null;
    }

    const { data, error } = await supabase
      .from('somobay_plans')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error || !data) {
      console.warn('Error fetching goal by id:', error);
      return null;
    }
    return data;
  },

  // 3. Create a new Joint Goal
  async createGoal(params: {
    name: string;
    description?: string;
    target_amount: number;
    start_date?: string;
    end_date?: string;
    member_ids?: string[];
  }): Promise<SomobayPlan> {
    const today = params.start_date || getTodayLocalDate();
    const durationMonths = 12; // default 12-month span

    const { data, error } = await supabase
      .from('somobay_plans')
      .insert([{
        name: params.name,
        description: params.description || '',
        scheme_type: 'joint_goal',
        target_amount: params.target_amount,
        installment_amount: Math.round(params.target_amount / (params.member_ids?.length || 10)),
        duration_months: durationMonths,
        total_members_limit: params.member_ids?.length || 12,
        frequency: 'monthly',
        status: 'active',
        is_active: true,
        created_at: today
      }])
      .select()
      .single();

    if (error) throw error;

    // Enroll selected members if provided
    if (data && params.member_ids && params.member_ids.length > 0) {
      const enrollments = params.member_ids.map(mid => ({
        plan_id: data.id,
        member_id: mid,
        start_date: today,
        end_date: params.end_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        status: 'active',
        total_collected: 0,
        next_due_date: today
      }));

      await supabase.from('member_plans').insert(enrollments);
    }

    return data;
  },

  // 4. Update goal settings
  async updateGoal(goalId: string, updates: Partial<SomobayPlan>): Promise<void> {
    const { error } = await supabase
      .from('somobay_plans')
      .update(updates)
      .eq('id', goalId);

    if (error) throw error;
  },

  // 5. Fetch participating members
  async getEnrolledMembers(goalId: string): Promise<MemberPlan[]> {
    if (!goalId || goalId === 'default-goal' || !isUuid(goalId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('member_plans')
      .select(`
        *,
        profile:member_id(id, full_name, phone, avatar_url)
      `)
      .eq('plan_id', goalId);

    if (error || !data) {
      return [];
    }
    return data;
  },

  // 6. Enroll a member into a goal
  async enrollMember(goalId: string, memberId: string): Promise<void> {
    const today = getTodayLocalDate();
    const endDate = new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0];

    const { error } = await supabase
      .from('member_plans')
      .insert([{
        plan_id: goalId,
        member_id: memberId,
        start_date: today,
        end_date: endDate,
        status: 'active',
        total_collected: 0,
        next_due_date: today
      }]);

    if (error) throw error;
  },

  // 7. Record a contribution to a goal
  async addContribution(params: {
    goalId: string;
    memberPlanId: string;
    amount: number;
    adminId: string;
    paymentDate?: string;
    paymentMethod?: string;
    note?: string;
  }): Promise<void> {
    if (!params.amount || params.amount <= 0) {
      throw new Error('অবদানের পরিমাণ অবশ্যই ধনাত্মক সংখ্যা হতে হবে');
    }

    const { error } = await supabase
      .from('plan_payments')
      .insert([{
        member_plan_id: params.memberPlanId,
        amount: params.amount,
        penalty_paid: 0,
        payment_date: params.paymentDate || getTodayLocalDate(),
        admin_id: params.adminId,
        status: 'approved',
        note: params.note ? `${params.paymentMethod ? `[${params.paymentMethod}] ` : ''}${params.note}` : (params.paymentMethod || 'অবদান জমা'),
        type: 'installment_payment'
      }]);

    if (error) throw error;
  },

  // 8. Fetch all contributions for a goal
  async getContributions(goalId: string): Promise<any[]> {
    if (!goalId || goalId === 'default-goal' || !isUuid(goalId)) {
      return [];
    }

    // 1. Get all member_plan IDs for this goal
    const { data: mps } = await supabase
      .from('member_plans')
      .select('id, member_id, profile:member_id(id, full_name, phone, avatar_url)')
      .eq('plan_id', goalId);

    if (!mps || mps.length === 0) return [];

    const mpIds = mps.map(m => m.id);
    const memberMap = new Map(mps.map(m => [m.id, m.profile]));

    // 2. Fetch payments for those member_plans
    const { data: payments, error } = await supabase
      .from('plan_payments')
      .select('*')
      .in('member_plan_id', mpIds)
      .order('payment_date', { ascending: false });

    if (error || !payments) {
      return [];
    }

    return (payments || []).map(p => ({
      ...p,
      member: memberMap.get(p.member_plan_id) || { full_name: 'অজ্ঞাত সদস্য' }
    }));
  },

  // 9. Fetch all expenses for a goal
  async getExpenses(goalId: string): Promise<JointGoalExpense[]> {
    if (!goalId || goalId === 'default-goal' || !isUuid(goalId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('joint_goal_expenses')
      .select('*')
      .eq('plan_id', goalId)
      .order('expense_date', { ascending: false });

    if (error) {
      console.warn('Error fetching goal expenses:', error);
      return [];
    }
    return data || [];
  },

  // 10. Record an expense / fund withdrawal
  async addExpense(expense: {
    plan_id: string;
    title: string;
    amount: number;
    expense_date: string;
    spent_by?: string;
    approved_by?: string;
    note?: string;
  }): Promise<void> {
    if (!expense.amount || expense.amount <= 0) {
      throw new Error('ব্যয়ের পরিমাণ অবশ্যই ধনাত্মক সংখ্যা হতে হবে');
    }

    const { error } = await supabase
      .from('joint_goal_expenses')
      .insert([expense]);

    if (error) throw error;
  },

  // 11. Remove a member from a goal
  async removeMember(memberPlanId: string): Promise<void> {
    const { error } = await supabase
      .from('member_plans')
      .delete()
      .eq('id', memberPlanId);

    if (error) throw error;
  },

  // 12. Delete an expense
  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('joint_goal_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  },

  // 13. Delete a goal
  async deleteGoal(goalId: string): Promise<void> {
    // Delete associated member_plans and expenses first
    await supabase.from('joint_goal_expenses').delete().eq('plan_id', goalId);
    await supabase.from('member_plans').delete().eq('plan_id', goalId);
    const { error } = await supabase.from('somobay_plans').delete().eq('id', goalId);
    if (error) throw error;
  },

  // 14. Calculate all aggregated metrics for a goal
  calculateMetrics(goal: SomobayPlan, members: MemberPlan[], contributions: any[], expenses: JointGoalExpense[]): JointGoalMetrics {
    const targetAmount = goal.target_amount || 0;
    const sumFromMembers = members.reduce((sum, m) => sum + (Number(m.total_collected) || 0), 0);
    const sumFromContribs = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalCollected = sumFromMembers > 0 ? sumFromMembers : sumFromContribs;
    const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const availableFund = Math.max(0, totalCollected - totalSpent);
    const remainingAmount = Math.max(0, targetAmount - totalCollected);
    const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalCollected / targetAmount) * 100)) : 0;
    const membersCount = members.length;
    const contributionsCount = contributions.length;
    const averageContribution = membersCount > 0 ? Math.round(totalCollected / membersCount) : 0;

    // Count contributors who made at least 1 contribution
    const contributorMemberPlanIds = new Set(contributions.map(c => c.member_plan_id));
    const contributorsCount = members.filter(m => contributorMemberPlanIds.has(m.id)).length;
    const pendingContributorsCount = Math.max(0, membersCount - contributorsCount);

    return {
      targetAmount,
      totalCollected,
      remainingAmount,
      totalSpent,
      availableFund,
      progressPercent,
      membersCount,
      contributionsCount,
      averageContribution,
      contributorsCount,
      pendingContributorsCount
    };
  },

  // 15. Fetch all goals user is participating in
  async getUserParticipatingGoals(userId: string): Promise<{
    goal: SomobayPlan;
    memberPlan: MemberPlan;
    userContributed: number;
    metrics: JointGoalMetrics;
  }[]> {
    // 1. Fetch user member_plans
    const { data: memberPlans, error } = await supabase
      .from('member_plans')
      .select('*, plan:plan_id(*)')
      .eq('member_id', userId);

    if (error || !memberPlans) {
      console.warn('Error fetching user member plans:', error);
      return [];
    }

    // Filter joint_goal plans
    const jointMemberPlans = memberPlans.filter((mp: any) => mp.plan && mp.plan.scheme_type === 'joint_goal');

    // 2. For each, calculate metrics and user contribution
    const results = await Promise.all(
      jointMemberPlans.map(async (mp: any) => {
        const goal = mp.plan as SomobayPlan;
        const [mems, conts, exps] = await Promise.all([
          this.getEnrolledMembers(goal.id),
          this.getContributions(goal.id),
          this.getExpenses(goal.id)
        ]);

        const metrics = this.calculateMetrics(goal, mems, conts, exps);
        const userContributed = conts
          .filter((c: any) => c.member_plan_id === mp.id)
          .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);

        return {
          goal,
          memberPlan: mp as MemberPlan,
          userContributed,
          metrics
        };
      })
    );

    return results;
  },

  // 16. Fetch user contribution summary for a specific goal
  async getUserGoalSummary(goalId: string, userId: string) {
    if (!goalId || goalId === 'default-goal' || !isUuid(goalId)) {
      return {
        memberPlan: null,
        payments: [],
        totalContributed: 0,
        thisMonthContributed: 0
      };
    }

    const { data: mps } = await supabase
      .from('member_plans')
      .select('*')
      .eq('plan_id', goalId)
      .eq('member_id', userId);

    const memberPlan = mps && mps.length > 0 ? mps[0] : null;
    let payments: any[] = [];

    if (memberPlan) {
      const { data: pays } = await supabase
        .from('plan_payments')
        .select('*')
        .eq('member_plan_id', memberPlan.id)
        .order('payment_date', { ascending: false });
      payments = pays || [];
    }

    const currentMonthPrefix = getTodayLocalDate().substring(0, 7);
    const totalContributed = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const thisMonthContributed = payments
      .filter(p => p.payment_date && p.payment_date.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      memberPlan: memberPlan || null,
      payments: payments,
      totalContributed: totalContributed,
      thisMonthContributed: thisMonthContributed
    };
  },

  // 17. User records a contribution
  async userAddContribution(params: {
    goalId: string;
    userId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    note?: string;
  }): Promise<PlanPayment> {
    if (!params.amount || params.amount <= 0) {
      throw new Error('অবদানের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে');
    }

    if (!params.goalId || params.goalId === 'default-goal' || !isUuid(params.goalId)) {
      return {
        id: 'pay-' + Date.now(),
        member_plan_id: 'mp-default-1',
        amount: params.amount,
        penalty_paid: 0,
        payment_date: params.paymentDate || getTodayLocalDate(),
        admin_id: '',
        status: 'pending',
        note: `[${params.paymentMethod}] ${params.note || 'সদস্য অবদান'}`,
        type: 'payment',
        created_at: new Date().toISOString()
      } as unknown as PlanPayment;
    }

    // Find or create member_plan
    let { data: mps } = await supabase
      .from('member_plans')
      .select('id')
      .eq('plan_id', params.goalId)
      .eq('member_id', params.userId);

    let memberPlanId = mps && mps.length > 0 ? mps[0].id : null;

    if (!memberPlanId) {
      // Auto-enroll member into this goal
      const today = getTodayLocalDate();
      const { data: newMp, error: enrollError } = await supabase
        .from('member_plans')
        .insert([{
          plan_id: params.goalId,
          member_id: params.userId,
          start_date: today,
          status: 'active',
          total_collected: 0,
          next_due_date: today
        }])
        .select('id')
        .single();

      if (enrollError) throw enrollError;
      memberPlanId = newMp.id;
    }

    // Check if user is admin
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', params.userId)
      .single();

    const isUserAdmin = prof?.role === 'admin';
    const status = isUserAdmin ? 'approved' : 'pending';
    const adminId = isUserAdmin ? params.userId : null;

    // Insert payment
    const noteText = params.note 
      ? `[${params.paymentMethod}] ${params.note}` 
      : `[${params.paymentMethod}] সদস্য অবদান`;

    const { data: payment, error: payError } = await supabase
      .from('plan_payments')
      .insert([{
        member_plan_id: memberPlanId,
        amount: params.amount,
        penalty_paid: 0,
        payment_date: params.paymentDate || getTodayLocalDate(),
        admin_id: adminId,
        status: status,
        note: noteText,
        type: 'installment_payment'
      }])
      .select()
      .single();

    if (payError) throw payError;
    return payment;
  }
};
