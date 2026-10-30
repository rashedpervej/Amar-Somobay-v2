import { supabase } from './supabase';
import { getTodayLocalDate } from './dateUtils';

export interface WithdrawalRequest {
  id: string;
  member_id: string;
  member_plan_id: string;
  amount: number;
  payment_method: string;
  account_number?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_id?: string;
  admin_note?: string;
  created_at: string;
  processed_at?: string;
  member?: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
  plan?: {
    id: string;
    name: string;
    scheme_type?: string;
  };
  member_plan?: {
    id: string;
    total_collected: number;
    status: string;
  };
}

export const withdrawalService = {
  // 1. Fetch withdrawal requests for a specific member
  async getMemberWithdrawals(memberId: string): Promise<WithdrawalRequest[]> {
    const { data, error } = await supabase
      .from('savings_withdrawals')
      .select(`
        *,
        member_plan:member_plan_id(
          id,
          total_collected,
          status,
          plan:somobay_plans(id, name, scheme_type)
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching member withdrawals:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      plan: row.member_plan?.plan
    }));
  },

  // 2. Fetch all pending withdrawal requests for Admin Queue (scoped by organization)
  async getAllPendingWithdrawals(organizationId?: string): Promise<WithdrawalRequest[]> {
    let query = supabase
      .from('savings_withdrawals')
      .select(`
        *,
        member:member_id(id, full_name, phone, avatar_url),
        member_plan:member_plan_id(
          id,
          total_collected,
          status,
          plan:somobay_plans(id, name, scheme_type)
        )
      `)
      .eq('status', 'pending');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching pending withdrawals:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      plan: row.member_plan?.plan
    }));
  },

  // 3. Member submits a withdrawal request
  async createWithdrawalRequest(params: {
    memberId: string;
    memberPlanId: string;
    amount: number;
    paymentMethod: string;
    accountNumber?: string;
    reason?: string;
  }): Promise<WithdrawalRequest> {
    if (params.amount <= 0) {
      throw new Error('উত্তোলনের পরিমাণ অবশ্যই ০ টাকার বেশি হতে হবে।');
    }

    // Verify member has enough balance
    const { data: mp, error: mpErr } = await supabase
      .from('member_plans')
      .select('id, total_collected')
      .eq('id', params.memberPlanId)
      .single();

    if (mpErr || !mp) throw new Error('সঞ্চয় প্ল্যান খুঁজে পাওয়া যায়নি।');
    if ((Number(mp.total_collected) || 0) < params.amount) {
      throw new Error(`আপনার বর্তমান জমাকৃত ব্যালেন্স (৳ ${Number(mp.total_collected).toLocaleString()}) এর চেয়ে বেশি উত্তোলন করা সম্ভব নয়।`);
    }

    // Fetch organization_id from member_plan
    const { data: planInfo } = await supabase
      .from('member_plans')
      .select('organization_id')
      .eq('id', params.memberPlanId)
      .single();

    const orgId = planInfo?.organization_id || '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabase
      .from('savings_withdrawals')
      .insert([{
        organization_id: orgId,
        member_id: params.memberId,
        member_plan_id: params.memberPlanId,
        amount: params.amount,
        payment_method: params.paymentMethod,
        account_number: params.accountNumber || null,
        purpose: params.reason || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 4. Admin approves or rejects a withdrawal request
  async processWithdrawalRequest(params: {
    id: string;
    status: 'approved' | 'rejected';
    adminId: string;
    adminNote?: string;
  }): Promise<void> {
    const { id, status, adminId, adminNote } = params;

    const { error } = await supabase
      .from('savings_withdrawals')
      .update({
        status,
        admin_id: adminId,
        admin_note: adminNote || (status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'),
        processed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }
};
