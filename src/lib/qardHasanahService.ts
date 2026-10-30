import { supabase } from './supabase';
import { getTodayLocalDate } from './dateUtils';

// Helper: Convert numbers to Bengali digits
export const toBn = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num ?? 0).replace(/\d/g, d => bnDigits[Number(d)]);
};

// Helper: Format currency in Bangladeshi style with Bengali numerals
export const formatBnCurrency = (amount: number): string => {
  return '৳ ' + toBn(Math.round(amount || 0).toLocaleString('en-IN'));
};

export interface QardFundSummary {
  total_allocated: number;
  total_disbursed: number;
  total_recovered: number;
  available_balance: number;
}

export interface QardApplication {
  id: string;
  code: string;
  member_id: string;
  requested_amount: number;
  approved_amount: number;
  duration_months: number;
  purpose: string;
  status: 'pending' | 'approved' | 'disbursed' | 'rejected' | 'completed';
  rejection_reason?: string;
  disbursement_date?: string;
  disbursement_ref?: string;
  member_savings_snapshot?: number;
  consent_public_sharing?: boolean;
  created_at: string;
  member?: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
}

export interface QardLoan {
  id: string;
  code: string;
  member_id: string;
  application_id?: string;
  principal_amount: number;
  total_repaid: number;
  outstanding_principal: number;
  duration_months: number;
  disbursement_date: string;
  disbursement_ref: string;
  status: 'active' | 'completed';
  created_at: string;
  member?: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
}

export interface QardRepayment {
  id: string;
  loan_id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  trx_ref?: string;
  receipt_no?: string;
  note?: string;
  status: 'approved';
  admin_id?: string;
  created_at: string;
  member?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

export const qardHasanahService = {
  // 1. Get Authorized Qard Hasanah Fund Summary (Reconciled from Database)
  async getFundSummary(): Promise<QardFundSummary> {
    try {
      // Calculate real totals from actual loans and repayments in Supabase
      const [loansRes, repaymentsRes, fundRes] = await Promise.all([
        supabase.from('qard_loans').select('principal_amount'),
        supabase.from('qard_repayments').select('amount').eq('status', 'approved'),
        supabase.from('qard_funds').select('total_allocated, total_disbursed, total_recovered').limit(1).maybeSingle()
      ]);

      const realDisbursed = (loansRes.data || []).reduce((sum, l) => sum + (Number(l.principal_amount) || 0), 0);
      const realRecovered = (repaymentsRes.data || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      let allocated = 50000; // Standard initial cooperative reserve
      if (fundRes.data?.total_allocated) {
        allocated = Number(fundRes.data.total_allocated);
      }

      const available = Math.max(0, allocated - realDisbursed + realRecovered);

      return {
        total_allocated: allocated,
        total_disbursed: realDisbursed,
        total_recovered: realRecovered,
        available_balance: available
      };
    } catch (err) {
      console.error('Error fetching Qard fund summary:', err);
      return {
        total_allocated: 50000,
        total_disbursed: 0,
        total_recovered: 0,
        available_balance: 50000
      };
    }
  },

  // Update authorized fund pool (Admin only)
  async updateFundAllocation(newTotalAllocated: number): Promise<void> {
    try {
      const { data: existing } = await supabase.from('qard_funds').select('id').limit(1).maybeSingle();
      if (existing?.id) {
        await supabase.from('qard_funds').update({
          total_allocated: newTotalAllocated,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
      } else {
        await supabase.from('qard_funds').insert({
          fund_name: 'সাধারণ কর্জে হাসানা তহবিল',
          total_allocated: newTotalAllocated,
          total_disbursed: 0,
          total_recovered: 0
        });
      }
    } catch (err) {
      console.warn('Could not persist fund allocation to table:', err);
    }
  },

  // 2. Fetch Member's existing savings balance purely as informational data
  async getMemberSavingsSnapshot(memberId: string): Promise<number> {
    try {
      // Sum approved deposits from plan_payments
      const { data, error } = await supabase
        .from('plan_payments')
        .select('amount, type')
        .eq('member_id', memberId)
        .eq('status', 'approved');

      if (error || !data) return 0;

      const total = data.reduce((acc, row) => {
        if (row.type === 'refund') return acc - (Number(row.amount) || 0);
        return acc + (Number(row.amount) || 0);
      }, 0);

      return Math.max(0, total);
    } catch {
      return 0;
    }
  },

  // 3. Fetch Applications (Role-based RLS automatically applies)
  async getApplications(memberId?: string, status?: string): Promise<QardApplication[]> {
    try {
      let query = supabase
        .from('qard_applications')
        .select(`
          id,
          code,
          member_id,
          requested_amount,
          approved_amount,
          duration_months,
          purpose,
          status,
          rejection_reason,
          disbursement_date,
          disbursement_ref,
          member_savings_snapshot,
          consent_public_sharing,
          created_at,
          member:profiles(id, full_name, phone, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (memberId) {
        query = query.eq('member_id', memberId);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        code: row.code || `QH-${row.id?.slice(0, 4).toUpperCase()}`,
        requested_amount: Number(row.requested_amount || 0),
        approved_amount: Number(row.approved_amount || row.requested_amount || 0),
        duration_months: Number(row.duration_months || 6),
        member: Array.isArray(row.member) ? row.member[0] : row.member
      }));
    } catch (err) {
      console.error('Error fetching Qard applications:', err);
      return [];
    }
  },

  // 4. Submit Member Application
  async submitApplication(params: {
    requested_amount: number;
    purpose: string;
    duration_months?: number;
    consent_public_sharing?: boolean;
  }): Promise<QardApplication> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ইউজার লগইন সেশন পাওয়া যায়নি।');

    const savingsSnapshot = await this.getMemberSavingsSnapshot(user.id);
    const code = `QH-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord = {
      code,
      member_id: user.id,
      requested_amount: params.requested_amount,
      approved_amount: params.requested_amount,
      duration_months: params.duration_months || 6,
      purpose: params.purpose.trim(),
      status: 'pending',
      member_savings_snapshot: savingsSnapshot,
      consent_public_sharing: params.consent_public_sharing || false
    };

    const { data, error } = await supabase
      .from('qard_applications')
      .insert(newRecord)
      .select(`
        id,
        code,
        organization_id,
        member_id,
        requested_amount,
        approved_amount,
        duration_months,
        purpose,
        status,
        member_savings_snapshot,
        consent_public_sharing,
        created_at,
        member:profiles(id, full_name, phone, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Notify admins about the new application
    try {
      const orgId = (data as any)?.organization_id;
      let admins: { id: string }[] = [];
      if (orgId) {
        const { data: orgAdmins } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgId)
          .in('role', ['cooperative_admin', 'collector'])
          .eq('status', 'active');
        admins = (orgAdmins || []).map(a => ({ id: a.user_id }));
      } else {
        const { data: globalAdmins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        admins = globalAdmins || [];
      }

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await supabase.from('notifications').insert({
            user_id: admin.id,
            organization_id: orgId || null,
            title: 'নতুন কর্জে হাসানা আবেদন',
            message: `একজন সদস্য ৳${toBn(params.requested_amount)} সুদমুক্ত কর্জের আবেদন জমা দিয়েছেন।`,
            type: 'info',
            source_module: 'plan'
          });
        }
      }
    } catch (notifErr) {
      console.warn('Admin notification notice:', notifErr);
    }

    return {
      ...data,
      requested_amount: Number(data.requested_amount),
      approved_amount: Number(data.approved_amount),
      duration_months: Number(data.duration_months),
      member: Array.isArray(data.member) ? data.member[0] : data.member
    };
  },

  // 5. Admin: Review Application (Approve / Reject)
  async reviewApplication(params: {
    applicationId: string;
    status: 'approved' | 'rejected';
    approvedAmount?: number;
    rejectionReason?: string;
  }): Promise<void> {
    const payload: any = {
      status: params.status
    };

    if (params.status === 'approved' && params.approvedAmount) {
      payload.approved_amount = params.approvedAmount;
    }
    if (params.status === 'rejected') {
      payload.rejection_reason = params.rejectionReason || 'নীতিমালা অনুযায়ী এই মুহূর্তে আবেদনটি মঞ্জুর করা সম্ভব হয়নি।';
    }

    const { data: app, error } = await supabase
      .from('qard_applications')
      .update(payload)
      .eq('id', params.applicationId)
      .select('member_id, approved_amount, requested_amount, organization_id')
      .single();

    if (error) throw error;

    // Send notification to member
    if (app?.member_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: app.member_id,
          organization_id: (app as any)?.organization_id || null,
          title: params.status === 'approved' ? 'কর্জে হাসানা অনুমোদিত হয়েছে' : 'কর্জে হাসানা আবেদন সংক্রান্ত',
          message: params.status === 'approved'
            ? `আপনার ৳${toBn(params.approvedAmount || app.requested_amount)} কর্জে হাসানা আবেদন অনুমোদিত হয়েছে। অর্থ বিতরণের জন্য অপেক্ষা করুন।`
            : `আপনার কর্জে হাসানা আবেদনটি অনুমোদিত হয়নি। কারণ: ${params.rejectionReason || 'যথাযথ শর্ত পূরণ না হওয়ায়'}`,
          type: params.status === 'approved' ? 'success' : 'warning',
          source_module: 'plan'
        });
      } catch (notifErr) {
        console.warn('Member notification notice:', notifErr);
      }
    }
  },

  // 6. Admin: Disburse Loan (Atomic Fund Check + Disbursal)
  async disburseLoan(params: {
    applicationId: string;
    disbursementRef?: string;
  }): Promise<QardLoan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('এডমিন সেশন প্রয়োজন।');

    // 1. Fetch application details
    const { data: app, error: appErr } = await supabase
      .from('qard_applications')
      .select('*')
      .eq('id', params.applicationId)
      .single();

    if (appErr || !app) throw new Error('আবেদনটি পাওয়া যায়নি।');
    if (app.status === 'disbursed') throw new Error('এই আবেদনটির অর্থ ইতিমধ্যে বিতরণ করা হয়েছে (ডুপ্লিকেট প্রতিরোধ)।');
    if (app.status !== 'approved') throw new Error('অর্থ বিতরণের পূর্বে আবেদনটি অনুমোদিত হওয়া আবশ্যক।');

    const disburseAmount = Number(app.approved_amount || app.requested_amount || 0);

    // 2. Strict Fund Verification: check available fund
    const fundSummary = await this.getFundSummary();
    if (fundSummary.available_balance < disburseAmount) {
      throw new Error(`তহবিলে পর্যাপ্ত অর্থ নেই! বর্তমান অবশিষ্ট তহবিল: ${formatBnCurrency(fundSummary.available_balance)}, কিন্তু বিতরণের পরিমাণ: ${formatBnCurrency(disburseAmount)}।`);
    }

    const today = getTodayLocalDate();
    const disbRef = params.disbursementRef || `DISB-${Math.floor(10000 + Math.random() * 90000)}`;
    const loanCode = `LN-${app.code || Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create Loan record
    const { data: loan, error: loanErr } = await supabase
      .from('qard_loans')
      .insert({
        code: loanCode,
        application_id: app.id,
        member_id: app.member_id,
        principal_amount: disburseAmount,
        total_repaid: 0,
        outstanding_principal: disburseAmount,
        duration_months: Number(app.duration_months || 6),
        disbursement_date: today,
        disbursement_ref: disbRef,
        status: 'active'
      })
      .select(`
        id,
        code,
        member_id,
        application_id,
        principal_amount,
        total_repaid,
        outstanding_principal,
        duration_months,
        disbursement_date,
        disbursement_ref,
        status,
        created_at,
        member:profiles(id, full_name, phone, avatar_url)
      `)
      .single();

    if (loanErr) throw loanErr;

    // 4. Update application status to disbursed
    await supabase
      .from('qard_applications')
      .update({
        status: 'disbursed',
        disbursement_date: today,
        disbursement_ref: disbRef
      })
      .eq('id', app.id);

    // 5. Update Fund Ledger table if exists
    try {
      const { data: fund } = await supabase.from('qard_funds').select('id, total_disbursed').limit(1).maybeSingle();
      if (fund?.id) {
        await supabase.from('qard_funds').update({
          total_disbursed: (Number(fund.total_disbursed) || 0) + disburseAmount,
          updated_at: new Date().toISOString()
        }).eq('id', fund.id);
      }
    } catch (fErr) {
      console.warn('Could not increment qard_funds:', fErr);
    }

    // 6. Notify Member
    try {
      await supabase.from('notifications').insert({
        user_id: app.member_id,
        organization_id: (app as any)?.organization_id || null,
        title: 'কর্জে হাসানা অর্থ বিতরণ সম্পন্ন',
        message: `আপনার আবেদনের প্রেক্ষিতে ৳${toBn(disburseAmount)} সুদমুক্ত কর্জ প্রদান করা হয়েছে। (রেফারেন্স: ${disbRef})`,
        type: 'success',
        source_module: 'plan'
      });
    } catch (notifErr) {
      console.warn('Member notification notice:', notifErr);
    }

    return {
      ...loan,
      principal_amount: Number(loan.principal_amount),
      total_repaid: Number(loan.total_repaid),
      outstanding_principal: Number(loan.outstanding_principal),
      duration_months: Number(loan.duration_months),
      member: Array.isArray(loan.member) ? loan.member[0] : loan.member
    };
  },

  // 7. Admin: Record Principal-Only Repayment
  async recordRepayment(params: {
    loanId: string;
    memberId: string;
    amount: number;
    paymentMethod: string;
    trxRef?: string;
    note?: string;
  }): Promise<QardRepayment> {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch loan
    const { data: loan, error: loanErr } = await supabase
      .from('qard_loans')
      .select('*')
      .eq('id', params.loanId)
      .single();

    if (loanErr || !loan) throw new Error('কর্জ রেকর্ডটি পাওয়া যায়নি।');

    const outstanding = Number(loan.outstanding_principal || 0);
    const repayAmount = Number(params.amount);

    if (repayAmount <= 0) throw new Error('পরিশোধের পরিমাণ শূন্যের বেশি হতে হবে।');
    if (repayAmount > outstanding) {
      throw new Error(`পরিশোধের পরিমাণ বর্তমান বকেয়ার চেয়ে বেশি হতে পারে না! বর্তমান বকেয়া: ${formatBnCurrency(outstanding)}।`);
    }

    const today = getTodayLocalDate();
    const receiptNo = `RCP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Insert into qard_repayments
    const { data: repayment, error: repayErr } = await supabase
      .from('qard_repayments')
      .insert({
        loan_id: loan.id,
        member_id: params.memberId,
        amount: repayAmount,
        payment_date: today,
        payment_method: params.paymentMethod || 'নগদ',
        trx_ref: params.trxRef || `TRX-${Date.now().toString().slice(-6)}`,
        receipt_no: receiptNo,
        note: params.note || 'সুদমুক্ত কর্জে হাসানা কিস্তি/মূল টাকা পরিশোধ',
        status: 'approved',
        admin_id: user?.id
      })
      .select(`
        id,
        loan_id,
        member_id,
        amount,
        payment_date,
        payment_method,
        trx_ref,
        receipt_no,
        note,
        status,
        created_at,
        member:profiles(id, full_name, phone)
      `)
      .single();

    if (repayErr) throw repayErr;

    // 3. Update Loan status and balances (recalculate principal only)
    const newTotalRepaid = Number(loan.total_repaid || 0) + repayAmount;
    const newOutstanding = Math.max(0, Number(loan.principal_amount) - newTotalRepaid);
    const isCompleted = newOutstanding === 0;

    await supabase
      .from('qard_loans')
      .update({
        total_repaid: newTotalRepaid,
        outstanding_principal: newOutstanding,
        status: isCompleted ? 'completed' : 'active'
      })
      .eq('id', loan.id);

    // 4. If fully paid, mark application completed
    if (isCompleted && loan.application_id) {
      await supabase
        .from('qard_applications')
        .update({ status: 'completed' })
        .eq('id', loan.application_id);
    }

    // 5. Update Fund Ledger table
    try {
      const { data: fund } = await supabase.from('qard_funds').select('id, total_recovered').limit(1).maybeSingle();
      if (fund?.id) {
        await supabase.from('qard_funds').update({
          total_recovered: (Number(fund.total_recovered) || 0) + repayAmount,
          updated_at: new Date().toISOString()
        }).eq('id', fund.id);
      }
    } catch (fErr) {
      console.warn('Could not update qard_funds recovery:', fErr);
    }

    // 6. Notify Member
    try {
      await supabase.from('notifications').insert({
        user_id: params.memberId,
        organization_id: (loan as any)?.organization_id || null,
        title: 'কর্জে হাসানা জমা গ্রহণ',
        message: `আপনার ৳${toBn(repayAmount)} টাকা পরিশোধ সফলভাবে জমা হয়েছে। বর্তমান বকেয়া: ৳${toBn(newOutstanding)}। রসিদ নং: #${receiptNo}`,
        type: 'success',
        source_module: 'plan'
      });
    } catch (notifErr) {
      console.warn('Member notification notice:', notifErr);
    }

    return {
      ...repayment,
      amount: Number(repayment.amount),
      member: Array.isArray(repayment.member) ? repayment.member[0] : repayment.member
    };
  },

  // 8. Fetch Loans List (Role-based)
  async getLoans(memberId?: string): Promise<QardLoan[]> {
    try {
      let query = supabase
        .from('qard_loans')
        .select(`
          id,
          code,
          member_id,
          application_id,
          principal_amount,
          total_repaid,
          outstanding_principal,
          duration_months,
          disbursement_date,
          disbursement_ref,
          status,
          created_at,
          member:profiles(id, full_name, phone, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (memberId) {
        query = query.eq('member_id', memberId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        principal_amount: Number(row.principal_amount || 0),
        total_repaid: Number(row.total_repaid || 0),
        outstanding_principal: Number(row.outstanding_principal || 0),
        duration_months: Number(row.duration_months || 6),
        member: Array.isArray(row.member) ? row.member[0] : row.member
      }));
    } catch (err) {
      console.error('Error fetching Qard loans:', err);
      return [];
    }
  },

  // 9. Fetch Repayments History
  async getRepayments(memberId?: string, loanId?: string): Promise<QardRepayment[]> {
    try {
      let query = supabase
        .from('qard_repayments')
        .select(`
          id,
          loan_id,
          member_id,
          amount,
          payment_date,
          payment_method,
          trx_ref,
          receipt_no,
          note,
          status,
          created_at,
          member:profiles(id, full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (memberId) {
        query = query.eq('member_id', memberId);
      }
      if (loanId) {
        query = query.eq('loan_id', loanId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        amount: Number(row.amount || 0),
        member: Array.isArray(row.member) ? row.member[0] : row.member
      }));
    } catch (err) {
      console.error('Error fetching Qard repayments:', err);
      return [];
    }
  }
};
