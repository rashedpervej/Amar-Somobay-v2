#!/usr/bin/env python3
"""
Phase 1 — Source A (amar-somobay-v2) এর জন্য D-01 ও D-02 প্যাচ তৈরি।
কোনো production/repo পরিবর্তন করে না: /tmp-তে দুই কপি (a=অপরিবর্তিত, b=প্যাচড) বানিয়ে
git diff --no-index দিয়ে unified diff তৈরি করে patches/ এ রাখে।
"""
import os, shutil, subprocess, sys, tempfile

# পাথ সব জায়গায় কাজ করে: স্ক্রিপ্টের নিজের অবস্থান থেকে workspace root বের করা হয়।
# প্রয়োজনে env দিয়ে বদলানো যায়: SOURCE_A_ROOT / PATCH_DIR / PATCH_WORK
HERE = os.path.dirname(os.path.abspath(__file__))          # <ws>/app/tools
APP_DIR = os.path.dirname(HERE)                            # <ws>/app
WS = os.path.dirname(APP_DIR)                              # <ws>
TMP = tempfile.gettempdir()

REF = os.environ.get('SOURCE_A_ROOT') or os.path.join(WS, 'reference', 'amar-somobay-v2')
WORK = os.environ.get('PATCH_WORK') or os.path.join(TMP, 'patchwork')
A = os.path.join(WORK, 'a')     # অপরিবর্তিত Source A
B1 = os.path.join(WORK, 'b1')   # শুধু D-01 সম্পাদনা
B2 = os.path.join(WORK, 'b2')   # D-01 + D-02 (চূড়ান্ত)
OUT = os.environ.get('PATCH_DIR') or os.path.join(WS, 'patches')

FILES = [
    'src/store/useSomobayStore.ts',
    'src/pages/PlanManagement.tsx',
    'src/pages/SavingsInsights.tsx',
    'src/pages/AdminUpdates.tsx',
    'src/components/CooperativeTenantGuard.tsx',
    'src/lib/qardHasanahService.ts',
    'src/lib/withdrawalService.ts',
    'src/components/QuickCollectModal.tsx',
    'src/pages/qard/AdminQardHasanah.tsx',
]

EDITS = []  # (file, old, new, tag)

# ============================ D-01 ============================
EDITS += [
('src/store/useSomobayStore.ts',
"""  target_amount: number;
  profit_percentage: number;
  late_fee_amount: number;""",
"""  target_amount: number;
  profit_percentage: number; // D-01: সর্বদা ০ — সুদ বা মুনাফা নিষিদ্ধ (ক্লায়েন্ট ও DB দুই স্তরেই লকড)
  late_fee_amount: number;""", 'D-01'),

('src/store/useSomobayStore.ts',
"""    // Enforce Rule 2: Strict Zero Interest (No profit percentage)
    const sanitizedPlan = {
      ...plan,
      profit_percentage: 0
    };""",
"""    // D-01: সম্পূর্ণ সুদমুক্ত নীতি — নিচের ফিল্ডগুলো কখনোই লেখা যাবে না, profit_percentage সর্বদা ০
    const bannedPlanFields = ['interest_rate', 'profit_rate', 'riba_rate', 'markup_percentage', 'dividend_rate']; // নিষিদ্ধ (D-01)
    const sanitizedPlan: any = {
      ...plan,
      profit_percentage: 0
    };
    bannedPlanFields.forEach((f) => { delete sanitizedPlan[f]; });""", 'D-01'),

('src/store/useSomobayStore.ts',
"""  updatePlan: async (id, plan) => {
    const { error } = await supabase.from('somobay_plans').update(plan).eq('id', id);
    if (error) throw error;
    get().fetchPlans();
  },""",
"""  updatePlan: async (id, plan) => {
    // D-01: সম্পাদনার সময়ও সুদ/মুনাফা লক — মান ০ ছাড়া কিছু লেখা যাবে না
    const bannedPlanFields = ['interest_rate', 'profit_rate', 'riba_rate', 'markup_percentage', 'dividend_rate']; // নিষিদ্ধ (D-01)
    const sanitizedPlan: any = { ...plan, profit_percentage: 0 };
    bannedPlanFields.forEach((f) => { delete sanitizedPlan[f]; });
    const { error } = await supabase.from('somobay_plans').update(sanitizedPlan).eq('id', id);
    if (error) throw error;
    get().fetchPlans();
  },""", 'D-01'),

('src/pages/PlanManagement.tsx',
"""  const [newLoanData, setNewLoanData] = useState({
    memberId: '',
    amount: 20000,
    durationMonths: 6,
    profitPercent: 0,
    note: ''
  });""",
"""  const [newLoanData, setNewLoanData] = useState({
    memberId: '',
    amount: 20000,
    durationMonths: 6,
    note: ''
  });""", 'D-01'),

('src/pages/PlanManagement.tsx',
"""    installment_amount: 1000,
    late_fee_amount: 50,
    target_amount: 12000,
    profit_percentage: 10,
    duration_months: 12,""",
"""    installment_amount: 1000,
    late_fee_amount: 50,
    target_amount: 12000,
    duration_months: 12,""", 'D-01'),

('src/pages/PlanManagement.tsx',
"""            target_amount: planData.target_amount,
            profit_percentage: planData.profit_percentage,
            duration_months: planData.duration_months,""",
"""            target_amount: planData.target_amount,
            duration_months: planData.duration_months,""", 'D-01'),

('src/pages/PlanManagement.tsx',
"""        target_amount: Number(editPlanForm.target_amount),
        profit_percentage: Number(editPlanForm.profit_percentage),
        duration_months: Number(editPlanForm.duration_months),""",
"""        target_amount: Number(editPlanForm.target_amount),
        profit_percentage: 0, // D-01: লকড — এই প্ল্যাটফর্মে সুদ বা মুনাফা হিসাব হয় না
        duration_months: Number(editPlanForm.duration_months),""", 'D-01'),

('src/pages/PlanManagement.tsx',
"""              <div>
                <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">লভ্যাংশ (%)</label>
                <input
                  type="number"
                  value={editPlanForm.profit_percentage}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, profit_percentage: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                />
              </div>""",
"""              <div>
                <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">সুদ ৳০ (নীতি D-01)</label>
                <div className="w-full h-11 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[13px] bangla text-emerald-800 flex items-center gap-2 font-semibold">
                  সম্পূর্ণ সুদমুক্ত — এই মান পরিবর্তনযোগ্য নয়
                </div>
              </div>""", 'D-01'),

('src/pages/PlanManagement.tsx',
"""setNewLoanData({ memberId: '', amount: 20000, durationMonths: 6, profitPercent: 0, note: '' });""",
"""setNewLoanData({ memberId: '', amount: 20000, durationMonths: 6, note: '' });""", 'D-01'),

('src/pages/SavingsInsights.tsx',
"""                <span className="text-slate-500 dark:text-slate-400 bangla">প্রত্যাশিত লভ্যাংশ হার</span>
                <span className="font-semibold text-slate-800 dark:text-slate-300 bangla">
                  {planInfo?.profit_percentage ? `${bn(planInfo.profit_percentage)}% মুনাফা` : 'সমিতির নিয়ম অনুযায়ী'}
                </span>""",
"""                <span className="text-slate-500 dark:text-slate-400 bangla">সুদ ৳০ (নীতি D-01)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 bangla">
                  সম্পূর্ণ সুদমুক্ত — কোনো পূর্বঘোষিত মুনাফা নেই
                </span>""", 'D-01'),

('src/pages/SavingsInsights.tsx',
"""              <span>সমিতি আইন মোতাবেক কিস্তির নিয়ম ভঙ্গ করলে বা নির্ধারিত সময়ের মধ্যে জমা দিতে ব্যর্থ হলে জরিমানার নিয়মাবলী কার্যকর হবে এবং কোনো ক্ষেত্রে মুনাফার হারে পরিবর্তন আসতে পারে।</span>""",
"""              <span>সমিতি আইন মোতাবেক কিস্তির নিয়ম ভঙ্গ করলে বা নির্ধারিত সময়ের মধ্যে জমা দিতে ব্যর্থ হলে জরিমানার নিয়মাবলী কার্যকর হবে। এই প্ল্যাটফর্মে কোনো সুদ বা মুনাফা হিসাব হয় না (নীতি D-01) — জরিমানা ছাড়া অতিরিক্ত কিছু ধার্য হয় না।</span>""", 'D-01'),

('src/pages/AdminUpdates.tsx',
"""২. সদস্য সঞ্চয়ের লভ্যাংশ ঘোষণা ও মুনাফা বণ্টন।""",
"""২. সদস্য সঞ্চয়ের হিসাব ও নিরীক্ষা প্রতিবেদন উপস্থাপন।""", 'D-01'),
]

# ============================ D-02 ============================
EDITS += [
('src/components/CooperativeTenantGuard.tsx',
"""        const currentMemberships = useAuthStore.getState().memberships;
        const currentProfile = useAuthStore.getState().profile;""",
"""        const currentMemberships = useAuthStore.getState().memberships;""", 'D-02'),

('src/components/CooperativeTenantGuard.tsx',
"""              const hasMembership = currentMemberships.some(m => m.organization_id === dbOrg.id && m.status === 'active');
              if (hasMembership || currentProfile?.role === 'admin') {""",
"""              const hasMembership = currentMemberships.some(m => m.organization_id === dbOrg.id && m.status === 'active');
              // D-02: বৈশ্বিক profiles.role কখনো অন্য সমবায়ে প্রবেশাধিকার দেয় না — শুধু সক্রিয় সদস্যপদ
              if (hasMembership) {""", 'D-02'),

('src/components/CooperativeTenantGuard.tsx',
"""          activeRole: currentMemberships.find(m => m.organization_id === targetOrg.id)?.role || (currentProfile?.role === 'admin' ? 'cooperative_admin' : 'member')""",
"""          // D-02: ভূমিকা শুধু organization_members থেকে আসে — বৈশ্বিক রোল থেকে অনুমান নিষিদ্ধ
          activeRole: currentMemberships.find(m => m.organization_id === targetOrg.id && m.status === 'active')?.role || 'member'""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""  async getFundSummary(): Promise<QardFundSummary> {
    try {
      // Calculate real totals from actual loans and repayments in Supabase
      const [loansRes, repaymentsRes, fundRes] = await Promise.all([
        supabase.from('qard_loans').select('principal_amount'),
        supabase.from('qard_repayments').select('amount').eq('status', 'approved'),
        supabase.from('qard_funds').select('total_allocated, total_disbursed, total_recovered').limit(1).maybeSingle()
      ]);""",
"""  async getFundSummary(organizationId?: string | null): Promise<QardFundSummary> {
    try {
      // D-02: প্রতিটি সমবায়ের তহবিল আলাদা — organization_id দিয়ে স্কোপ করা হয়
      const scope = (q: any) => (organizationId ? q.eq('organization_id', organizationId) : q);
      // Calculate real totals from actual loans and repayments in Supabase
      const [loansRes, repaymentsRes, fundRes] = await Promise.all([
        scope(supabase.from('qard_loans').select('principal_amount')),
        scope(supabase.from('qard_repayments').select('amount').eq('status', 'approved')),
        scope(supabase.from('qard_funds').select('total_allocated, total_disbursed, total_recovered')).limit(1).maybeSingle()
      ]);""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""  async updateFundAllocation(newTotalAllocated: number): Promise<void> {
    try {
      const { data: existing } = await supabase.from('qard_funds').select('id').limit(1).maybeSingle();""",
"""  async updateFundAllocation(newTotalAllocated: number, organizationId?: string | null): Promise<void> {
    if (!organizationId) throw new Error('সমবায় শনাক্ত করা যায়নি — তহবিল পরিবর্তন করা যাবে না (নীতি D-02)।');
    try {
      const { data: existing } = await supabase.from('qard_funds').select('id').eq('organization_id', organizationId).limit(1).maybeSingle();""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""        await supabase.from('qard_funds').insert({
          fund_name: 'সাধারণ কর্জে হাসানা তহবিল',
          total_allocated: newTotalAllocated,
          total_disbursed: 0,
          total_recovered: 0
        });""",
"""        await supabase.from('qard_funds').insert({
          organization_id: organizationId, // D-02: tenant ছাড়া তহবিল সারি তৈরি হবে না
          fund_name: 'সাধারণ কর্জে হাসানা তহবিল',
          total_allocated: newTotalAllocated,
          total_disbursed: 0,
          total_recovered: 0
        });""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""    const fundSummary = await this.getFundSummary();""",
"""    const fundSummary = await this.getFundSummary((app as any)?.organization_id);""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""    // 5. Update Fund Ledger table if exists
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
    }""",
"""    // 5. Update Fund Ledger table if exists (D-02: সমবায়-স্কোপড)
    try {
      const fundOrgId = (app as any)?.organization_id;
      if (!fundOrgId) {
        console.warn('D-02: আবেদনের organization_id নেই — তহবিল খাতা হালনাগাদ করা হয়নি।');
      } else {
        const { data: fund } = await supabase.from('qard_funds').select('id, total_disbursed').eq('organization_id', fundOrgId).limit(1).maybeSingle();
        if (fund?.id) {
          await supabase.from('qard_funds').update({
            total_disbursed: (Number(fund.total_disbursed) || 0) + disburseAmount,
            updated_at: new Date().toISOString()
          }).eq('id', fund.id);
        }
      }
    } catch (fErr) {
      console.warn('Could not increment qard_funds:', fErr);
    }""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""    // 5. Update Fund Ledger table
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
    }""",
"""    // 5. Update Fund Ledger table (D-02: সমবায়-স্কোপড)
    try {
      const fundOrgId = (loan as any)?.organization_id;
      if (!fundOrgId) {
        console.warn('D-02: ঋণের organization_id নেই — তহবিল খাতা হালনাগাদ করা হয়নি।');
      } else {
        const { data: fund } = await supabase.from('qard_funds').select('id, total_recovered').eq('organization_id', fundOrgId).limit(1).maybeSingle();
        if (fund?.id) {
          await supabase.from('qard_funds').update({
            total_recovered: (Number(fund.total_recovered) || 0) + repayAmount,
            updated_at: new Date().toISOString()
          }).eq('id', fund.id);
        }
      }
    } catch (fErr) {
      console.warn('Could not update qard_funds recovery:', fErr);
    }""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""      } else {
        const { data: globalAdmins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        admins = globalAdmins || [];
      }""",
"""      } else {
        // D-02: সমবায় শনাক্ত না হলে অন্য সমবায়ের অ্যাডমিনকে নোটিশ পাঠানো যাবে না
        console.warn('D-02: আবেদনের organization_id নেই — নোটিফিকেশন পাঠানো হয়নি।');
      }""", 'D-02'),

('src/lib/qardHasanahService.ts',
"""            organization_id: orgId || null,
            title: 'নতুন কর্জে হাসানা আবেদন',""",
"""            organization_id: orgId, // D-02: tenant ছাড়া নোটিফিকেশন নয়
            title: 'নতুন কর্জে হাসানা আবেদন',""", 'D-02'),

('src/lib/withdrawalService.ts',
"""    const orgId = planInfo?.organization_id || '00000000-0000-0000-0000-000000000001';""",
"""    // D-02: ডিফল্ট সমবায়ে ফলব্যাক নিষিদ্ধ — অন্য tenant-এ ডেটা লেখা যাবে না
    const orgId = planInfo?.organization_id;
    if (!orgId) throw new Error('সমবায় শনাক্ত করা যায়নি — উত্তোলনের আবেদন জমা দেওয়া যাচ্ছে না (নীতি D-02)।');""", 'D-02'),

('src/components/QuickCollectModal.tsx',
"""      let query = supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .eq('role', 'member')
        .limit(10);

      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data } = await query;
      setMembers(data || []);""",
"""      // D-02: শুধু সক্রিয় সমবায়ের সদস্য — অন্য সমবায়ের সদস্য এই তালিকায় আসবে না
      const listOrgId = useAuthStore.getState().activeOrganizationId;
      if (!listOrgId) { setMembers([]); return; }
      const { data: tenantMembers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', listOrgId)
        .eq('role', 'member')
        .eq('status', 'active');
      const memberIds = (tenantMembers || []).map((r: any) => r.user_id);
      if (memberIds.length === 0) { setMembers([]); return; }

      let query = supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', memberIds)
        .limit(10);

      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data } = await query;
      setMembers(data || []);""", 'D-02'),

('src/components/QuickCollectModal.tsx',
"""      const activeOrgId = adminProfile?.id ? (useAuthStore.getState().activeOrganizationId || '00000000-0000-0000-0000-000000000001') : '00000000-0000-0000-0000-000000000001';""",
"""      // D-02: ডিফল্ট সমবায়ে ফলব্যাক নিষিদ্ধ
      const activeOrgId = useAuthStore.getState().activeOrganizationId;
      if (!activeOrgId) throw new Error('সমবায় শনাক্ত করা যায়নি — কিস্তি আদায় করা যাচ্ছে না (নীতি D-02)।');""", 'D-02'),

('src/pages/qard/AdminQardHasanah.tsx',
"""        qardHasanahService.getFundSummary(),""",
"""        qardHasanahService.getFundSummary(useAuthStore.getState().activeOrganizationId), // D-02""", 'D-02'),

('src/pages/qard/AdminQardHasanah.tsx',
"""      await qardHasanahService.updateFundAllocation(amount);""",
"""      await qardHasanahService.updateFundAllocation(amount, useAuthStore.getState().activeOrganizationId); // D-02""", 'D-02'),
]


EDITS += [
('src/store/useSomobayStore.ts',
"""import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { formatLocalDate, getTodayLocalDate } from '../lib/dateUtils';""",
"""import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { formatLocalDate, getTodayLocalDate } from '../lib/dateUtils';
import { useAuthStore } from './useAuthStore'; // D-02: সক্রিয় সমবায় দিয়ে স্কোপিং""", 'D-02'),

('src/store/useSomobayStore.ts',
"""      // 1. Total Members
      const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member');

      // 2. Active Plan Types (Templates)
      const { count: planTypesCount } = await supabase.from('somobay_plans').select('*', { count: 'exact', head: true }).eq('is_active', true);

      // 3. Active Enrollments & Overdue Info
      const { data: plansData } = await supabase.from('member_plans').select('id, next_due_date, status, plan:somobay_plans(installment_amount)');""",
"""      // D-02: ড্যাশবোর্ডের প্রতিটি সংখ্যা শুধু সক্রিয় সমবায়ের — অন্য সমবায়ের ডেটা মিশবে না
      const statsOrgId = useAuthStore.getState().activeOrganizationId;

      // 1. Total Members — বৈশ্বিক profiles.role নয়, নিজের সমবায়ের সদস্য তালিকা
      let membersQuery = supabase.from('organization_members').select('*', { count: 'exact', head: true })
        .eq('role', 'member').eq('status', 'active');
      if (statsOrgId) membersQuery = membersQuery.eq('organization_id', statsOrgId);
      const { count: membersCount } = await membersQuery;

      // 2. Active Plan Types (Templates)
      let planTypesQuery = supabase.from('somobay_plans').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (statsOrgId) planTypesQuery = planTypesQuery.eq('organization_id', statsOrgId);
      const { count: planTypesCount } = await planTypesQuery;

      // 3. Active Enrollments & Overdue Info
      let enrollQuery = supabase.from('member_plans').select('id, next_due_date, status, plan:somobay_plans(installment_amount)');
      if (statsOrgId) enrollQuery = enrollQuery.eq('organization_id', statsOrgId);
      const { data: plansData } = await enrollQuery;""", 'D-02'),

('src/store/useSomobayStore.ts',
"""      const { data: paymentsData } = await supabase.from('plan_payments').select('member_plan_id, amount, type, status, penalty_paid');""",
"""      let paymentsQuery = supabase.from('plan_payments').select('member_plan_id, amount, type, status, penalty_paid');
      if (statsOrgId) paymentsQuery = paymentsQuery.eq('organization_id', statsOrgId); // D-02
      const { data: paymentsData } = await paymentsQuery;""", 'D-02'),

('src/store/useSomobayStore.ts',
"""      const { data: overdueMembersData } = await supabase.from('member_plans').select('member_id').eq('status', 'active').lt('next_due_date', today);""",
"""      let overdueQuery = supabase.from('member_plans').select('member_id').eq('status', 'active').lt('next_due_date', today);
      if (statsOrgId) overdueQuery = overdueQuery.eq('organization_id', statsOrgId); // D-02
      const { data: overdueMembersData } = await overdueQuery;""", 'D-02'),
]



def nfc_index_map(text):
    """grapheme-cluster ভিত্তিক NFC ম্যাপ: প্রতিটি আউটপুট অক্ষর → আসল ফাইলের সূচক।"""
    import unicodedata
    out, mapping, i, n = [], [], 0, len(text)
    while i < n:
        j = i + 1
        while j < n and unicodedata.combining(text[j]):
            j += 1
        for c in unicodedata.normalize('NFC', text[i:j]):
            out.append(c)
            mapping.append(i)
        i = j
    return ''.join(out), mapping


def apply_edits(tree, tag):
    """একটি ট্রিতে শুধু tag-এর সম্পাদনাগুলো বসায়। ফিরে দেয় (সংখ্যা, normalization ফলব্যাক)।"""
    import unicodedata
    applied, normalized = 0, 0
    for f, old, new, t in EDITS:
        if t != tag:
            continue
        p = os.path.join(tree, f)
        s = open(p, encoding='utf-8').read()
        n = s.count(old)
        if n == 1:
            open(p, 'w', encoding='utf-8').write(s.replace(old, new))
            applied += 1
            continue

        # ফলব্যাক: Source A-তে বাংলা যুক্তাক্ষর ভিন্ন Unicode normalization-এ থাকতে পারে
        norm_s, mapping = nfc_index_map(s)
        norm_old = unicodedata.normalize('NFC', old)
        pos = norm_s.find(norm_old)
        occ = norm_s.count(norm_old)
        if pos == -1 or occ != 1:
            print(f'❌ {f} [{tag}] anchor পাওয়া যায়নি (exact={n}, nfc={occ}): {old[:70]!r}')
            sys.exit(1)
        start = mapping[pos]
        end = mapping[pos + len(norm_old)] if pos + len(norm_old) < len(mapping) else len(s)
        open(p, 'w', encoding='utf-8').write(s[:start] + new + s[end:])
        normalized += 1
        applied += 1
    return applied, normalized


def changed_files(left, right):
    out = []
    for f in FILES:
        a = open(os.path.join(left, f), encoding='utf-8').read()
        b = open(os.path.join(right, f), encoding='utf-8').read()
        if a != b:
            out.append(f)
    return sorted(out)


def fix_headers(body):
    """git --no-index 'a/<dir>/…' লেখে; -p1 এর জন্য ডিরেক্টরির স্তরটি বাদ দেওয়া হয়।"""
    out = []
    for line in body.splitlines(keepends=True):
        stripped = line.rstrip('\n')
        if line.startswith('diff --git '):
            parts = stripped.split(' ')
            def one(p, pre):
                assert p.startswith(pre), p
                return pre + p[len(pre):].split('/', 1)[1]
            line = f'diff --git {one(parts[2], "a/")} {one(parts[3], "b/")}\n'
        elif line.startswith('--- ') and stripped != '--- /dev/null':
            rest = stripped[4:]
            if rest.startswith('a/'):
                line = '--- a/' + rest[2:].split('/', 1)[1] + '\n'
        elif line.startswith('+++ ') and stripped != '+++ /dev/null':
            rest = stripped[4:]
            if rest.startswith('b/'):
                line = '+++ b/' + rest[2:].split('/', 1)[1] + '\n'
        out.append(line)
    return ''.join(out)


def main():
    if os.path.exists(WORK):
        shutil.rmtree(WORK)
    for tree in (A, B1):
        os.makedirs(tree, exist_ok=True)
        for f in FILES:
            dst = os.path.join(tree, f)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(REF, f), dst)
    # ক্রম গুরুত্বপূর্ণ: প্রথমে B1-এ D-01 বসবে, তারপর B1 → B2 কপি করে B2-তে D-02 বসবে।
    # (উল্টো করলে B2 = A + D-02 হয়ে যায় এবং 0002 প্যাচ D-01 সম্পাদনা উল্টে দেয়।)
    d01, n1 = apply_edits(B1, 'D-01')
    shutil.copytree(B1, B2)
    d02, n2 = apply_edits(B2, 'D-02')
    print(f'✅ সম্পাদনা প্রয়োগ: D-01 = {d01}, D-02 = {d02} '
          f'(normalization ফলব্যাক {n1 + n2} বার)')

    os.makedirs(OUT, exist_ok=True)

    def diff_for(left, right, files, out_name, title, note=''):
        chunks = []
        for f in files:
            r = subprocess.run(['git', 'diff', '--no-index', '--no-color', '--unified=6',
                                os.path.basename(left) + '/' + f, os.path.basename(right) + '/' + f],
                               capture_output=True, text=True, cwd=WORK)
            body = fix_headers(r.stdout)
            if not body.strip():
                print(f'⚠️ কোনো diff নেই: {f}')
                continue
            chunks.append(body)
        header = (f'# {title}\n'
                  f'# প্রয়োগ: Source A repo root থেকে  git apply -p1 patches/{out_name}\n'
                  f'# অথবা                        patch -p1 < patches/{out_name}\n'
                  + (f'# {note}\n' if note else '')
                  + '# কোনো database migration এখানে নেই — DB পরিবর্তন app/db/*.sql ফাইলে আলাদা ও অনুমোদন-সাপেক্ষ।\n')
        path = os.path.join(OUT, out_name)
        open(path, 'w', encoding='utf-8').write(header + ''.join(chunks))
        print(f'✅ লেখা হলো: {path} ({os.path.getsize(path)} বাইট, {len(chunks)} ফাইল, '
              f'{sum(len([1 for l in c.splitlines() if l.startswith("+") and not l.startswith("+++")]) for c in chunks)} যোগ-লাইন)')

    files1 = changed_files(A, B1)
    files2 = changed_files(B1, B2)
    diff_for(A, B1, files1, '0001-D01-zero-interest.patch',
             'D-01 · সম্পূর্ণ সুদমুক্ত: profit_percentage / মুনাফা UI ও লেখার পথ বন্ধ',
             'এই প্যাচটি আগে প্রয়োগ করতে হবে (0002-এর লাইন-নম্বর এর পরের অবস্থা ধরে লেখা)।')
    diff_for(B1, B2, files2, '0002-D02-tenant-isolation.patch',
             'D-02 · Cross-tenant isolation: কোড স্তরের স্কোপিং ও ডিফল্ট-org ফলব্যাক বন্ধ',
             'প্রয়োগের ক্রম: প্রথমে 0001-D01-zero-interest.patch, তারপর এই প্যাচ।')

    patched = os.path.join(TMP, 'somobay-patched')
    if os.path.exists(patched):
        shutil.rmtree(patched)
    shutil.copytree(B2, patched)
    print(f'✅ যাচাই ট্রি: {patched}')

    # বিশুদ্ধ কপিতে ধারাবাহিক প্রয়োগ + ফলাফল অভিন্ন কিনা
    verify = os.path.join(TMP, 'patch-verify')
    if os.path.exists(verify):
        shutil.rmtree(verify)
    shutil.copytree(A, verify)
    for p in ['0001-D01-zero-interest.patch', '0002-D02-tenant-isolation.patch']:
        raw = open(os.path.join(OUT, p), encoding='utf-8').read()
        body = ''.join(l for l in raw.splitlines(keepends=True) if not l.startswith('#'))
        open(os.path.join(TMP, '_apply.patch'), 'w', encoding='utf-8').write(body)
        r = subprocess.run(['git', 'apply', '--check', '-p1', '-v', os.path.join(TMP, '_apply.patch')],
                           capture_output=True, text=True, cwd=verify)
        print(('✅' if r.returncode == 0 else '❌') + f' git apply --check {p}: rc={r.returncode}')
        if r.returncode != 0:
            print(r.stdout[-1500:], r.stderr[-1500:])
            sys.exit(1)
        subprocess.run(['git', 'apply', '-p1', os.path.join(TMP, '_apply.patch')], cwd=verify, check=True)
    print('✅ দুই প্যাচ ধারাবাহিকভাবে (0001 → 0002) বিশুদ্ধ Source A কপিতে প্রয়োগযোগ্য')

    r = subprocess.run(['diff', '-rq', verify, B2], capture_output=True, text=True)
    same = r.returncode == 0
    print(('✅' if same else '❌') + ' প্রয়োগকৃত ট্রি ও প্যাচড ট্রি অভিন্ন')
    if not same:
        print(r.stdout[:2000])
        sys.exit(1)


if __name__ == '__main__':
    main()
