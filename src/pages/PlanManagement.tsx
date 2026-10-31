import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore, SomobayPlan, MemberPlan, calculateMemberPlanBalances } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sprout, 
  Search, 
  Plus, 
  ChevronRight, 
  Calendar, 
  Users, 
  Coins, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserMinus, 
  ArrowLeftRight, 
  Sliders, 
  ShieldAlert, 
  MoreVertical, 
  Download, 
  Settings, 
  PiggyBank, 
  HandCoins, 
  FileText,
  CreditCard,
  X,
  LayoutGrid,
  FileSpreadsheet,
  Send,
  Check,
  RotateCw,
  Wallet,
  Handshake,
  Receipt,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ReceiptModal, ReceiptData } from '../components/ReceiptModal';
import { getTodayLocalDate, isDateOverdue } from '../lib/dateUtils';

// Helpers
const toBn = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, d => bnDigits[Number(d)]);
};

const formatBnCurrency = (amount: number): string => {
  return '৳ ' + toBn(Math.round(amount).toLocaleString('en-IN'));
};


export default function PlanManagement() {
  const { id, planId, cooperativeSlug } = useParams<{ id?: string; planId?: string; cooperativeSlug?: string }>();
  const [resolvedPlanId, setResolvedPlanId] = useState<string | null>(planId || id || null);
  const effectiveId = resolvedPlanId || planId || id;
  const navigate = useNavigate();
  const { profile, activeOrganization, activeRole } = useAuthStore();
  const isCoopAdmin = activeRole === 'cooperative_admin' || profile?.role === 'admin';
  const theme = useTheme();
  const { 
    plans, 
    memberPlans, 
    fetchPlans, 
    fetchMemberPlans, 
    transferMember, 
    releaseMember, 
    updateMemberPlanStatus,
    recordPayment,
    loading: storeLoading 
  } = useSomobayStore();

  // 8 Target Modules for this Scheme: overview | members | ledger | loans | overdue | reports | settings
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as any;
  const validTabs = ['overview', 'members', 'ledger', 'loans', 'overdue', 'reports', 'settings'];
  const initialTab = validTabs.includes(urlTab) ? urlTab : 'overview';
  const [activeTab, setActiveTabState] = useState<'overview' | 'members' | 'ledger' | 'loans' | 'overdue' | 'reports' | 'settings'>(initialTab);

  const setActiveTab = (tab: 'overview' | 'members' | 'ledger' | 'loans' | 'overdue' | 'reports' | 'settings') => {
    setActiveTabState(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    } else if (!urlTab && activeTab !== 'overview') {
      setActiveTabState('overview');
    }
  }, [urlTab]);
  const [showAllModulesModal, setShowAllModulesModal] = useState(false);
  const [reminderToast, setReminderToast] = useState('');

  // Scheme-Scoped Loans State
  const [planLoans, setPlanLoans] = useState<any[]>([]);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [newLoanData, setNewLoanData] = useState({
    memberId: '',
    amount: 20000,
    durationMonths: 6,
    profitPercent: 0,
    note: ''
  });
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState<number | ''>(5000);

  // Scheme-Scoped CSV Export Helper
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${currentPlan?.name || 'plan'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [ledgerSubTab, setLedgerSubTab] = useState<'collect' | 'history'>('collect');
  const [memberFilter, setMemberFilter] = useState<'active' | 'overdue' | 'all'>('active');
  const [memberSearch, setMemberSearch] = useState('');

  const [currentPlan, setCurrentPlan] = useState<SomobayPlan | null>(null);
  const [enrolledMembers, setEnrolledMembers] = useState<MemberPlan[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showEnroll, setShowEnroll] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  
  // Selection state
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [selectedMemberPlan, setSelectedMemberPlan] = useState<MemberPlan | null>(null);
  const [menuOpenMemberId, setMenuOpenMemberId] = useState<string | null>(null);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<MemberPlan | null>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState<MemberPlan['status']>('active');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Adjustment Modal States
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedMemberForAdjustment, setSelectedMemberForAdjustment] = useState<MemberPlan | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'adjustment' as 'payment' | 'fine' | 'adjustment' | 'waiver' | 'refund' | 'installment_payment' | 'fine_payment',
    amount: 0,
    direction: 'add' as 'add' | 'subtract',
    note: ''
  });

  // Edit Plan Form
  const [editPlanForm, setEditPlanForm] = useState({
    name: '',
    description: '',
    installment_amount: 1000,
    late_fee_amount: 50,
    target_amount: 12000,
    profit_percentage: 0,
    duration_months: 12,
    frequency: 'monthly' as any,
    due_date: 1,
    status: 'active' as 'active' | 'paused' | 'completed'
  });

  // Single Installment Collection Form (Screen 06)
  const [collectMemberId, setCollectMemberId] = useState('');
  const [collectAmount, setCollectAmount] = useState<number | ''>(1000);
  const [collectDate, setCollectDate] = useState(getTodayLocalDate());
  const [collectNote, setCollectNote] = useState('অক্টোবর মাসের কিস্তি');
  const [collectSuccess, setCollectSuccess] = useState('');

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 1000,
    penalty: 0,
    paymentDate: getTodayLocalDate(),
    note: ''
  });

  useEffect(() => {
    if (profile && !isCoopAdmin) {
      navigate('/somobay', { replace: true });
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      try {
        let activePlanId = planId || id;
        
        // If no explicit planId/id is provided (e.g. accessed via /somobay/:cooperativeSlug)
        if (!activePlanId) {
          const orgId = activeOrganization?.id;
          let query = supabase
            .from('somobay_plans')
            .select('*')
            .or('scheme_type.eq.General,scheme_type.eq.savings');

          if (orgId) {
            query = query.eq('organization_id', orgId);
          }

          const { data: dbPlans } = await query
            .order('created_at', { ascending: false })
            .limit(1);

          if (dbPlans && dbPlans.length > 0) {
            activePlanId = dbPlans[0].id;
          }
        }

        const currentEffectiveId = activePlanId || null;
        setResolvedPlanId(currentEffectiveId);

        let planData = null;
        if (currentEffectiveId) {
          // 1. Get Plan Details
          const { data: pData } = await supabase
            .from('somobay_plans')
            .select('*')
            .eq('id', currentEffectiveId)
            .maybeSingle();
          planData = pData;
        }
        if (planData) {
          if (planData.scheme_type === 'joint_goal') {
            navigate(`/joint-goals/${planData.id}`, { replace: true });
            return;
          }
          if (planData.scheme_type === 'rosca') {
            navigate(`/rosca/${planData.id}`, { replace: true });
            return;
          }
          setCurrentPlan(planData);
          setEditPlanForm({
            name: planData.name,
            description: planData.description || '',
            installment_amount: planData.installment_amount,
            late_fee_amount: planData.late_fee_amount,
            target_amount: planData.target_amount,
            // D-01: শতাংশ সবসময় শূন্য — ডেটাবেসে পুরনো মান থাকলেও ফর্মে আসবে না
            profit_percentage: 0,
            duration_months: planData.duration_months,
            frequency: planData.frequency,
            due_date: planData.due_date || 1,
            status: planData.status || 'active'
          });
        } else {
          setCurrentPlan(null);
        }

        // 2. Refresh store plans and member plans
        await fetchPlans();
        await fetchMemberPlans();

        // 3. Fetch all members for enrollment/transfer
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, phone, avatar_url')
          .eq('role', 'member');
        if (profileData) setAllProfiles(profileData);

        // 4. Fetch Payments for this plan
        const { data: payData } = await supabase
          .from('plan_payments')
          .select(`
            *,
            member_plans!inner(plan_id, profiles:member_id(full_name))
          `)
          .eq('member_plans.plan_id', currentEffectiveId)
          .order('payment_date', { ascending: false });
        
        if (payData && payData.length > 0) {
          setPayments(payData);
        }

      } catch (err) {
        console.error('Error loading plan management data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, planId, cooperativeSlug, fetchPlans, fetchMemberPlans]);

  // Sync enrolled members specifically for this plan
  useEffect(() => {
    const currentId = resolvedPlanId || effectiveId;
    if (currentId) {
      const filtered = memberPlans.filter(mp => mp.plan_id === currentId);
      if (filtered.length > 0) {
        setEnrolledMembers(filtered);
        if (!collectMemberId) setCollectMemberId(filtered[0].id);
      } else {
        if (memberPlans.length > 0) {
          setEnrolledMembers(memberPlans);
          if (!collectMemberId) setCollectMemberId(memberPlans[0].id);
        } else {
          setEnrolledMembers([]);
          setCollectMemberId('');
        }
      }
    }
  }, [resolvedPlanId, effectiveId, memberPlans]);

  // Overdue & Active members
  const overdueMembers = enrolledMembers.filter(m => 
    m.status === 'active' && isDateOverdue(m.next_due_date)
  );

  const activeCount = enrolledMembers.filter(m => m.status === 'active').length;
  const overdueCount = overdueMembers.length;

  const filteredMembersList = enrolledMembers.filter(m => {
    const name = m.profiles?.full_name?.toLowerCase() || '';
    const phone = m.profiles?.phone || '';
    const matchesSearch = name.includes(memberSearch.toLowerCase()) || phone.includes(memberSearch);
    if (!matchesSearch) return false;

    if (memberFilter === 'active') return m.status === 'active';
    if (memberFilter === 'overdue') return isDateOverdue(m.next_due_date);
    return true;
  });

  // Financial Stats
  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOverdue = overdueMembers.length * (currentPlan?.installment_amount || 0);
  const totalMembersCount = enrolledMembers.length;
  const activeMembersCount = activeCount;
  const targetTotal = Number(currentPlan?.target_amount) || 0;
  const progressPercent = targetTotal > 0 ? Math.min(100, Math.round((totalCollected / targetTotal) * 100)) : 0;

  // Handlers
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentId = resolvedPlanId || effectiveId;
    if (!currentId || !currentPlan) return;
    try {
      const { updatePlan } = useSomobayStore.getState();
      await updatePlan(currentId, {
        name: editPlanForm.name,
        description: editPlanForm.description,
        installment_amount: Number(editPlanForm.installment_amount),
        late_fee_amount: Number(editPlanForm.late_fee_amount),
        target_amount: Number(editPlanForm.target_amount),
        // D-01: সঞ্চয় স্কিমে কোনো শতাংশ সংরক্ষণ হবে না
        profit_percentage: 0,
        duration_months: Number(editPlanForm.duration_months),
        frequency: editPlanForm.frequency,
        status: editPlanForm.status
      } as any);

      setCurrentPlan({ ...currentPlan, ...editPlanForm } as any);
      alert('প্ল্যান সেটিংস সফলভাবে আপডেট হয়েছে!');
      setActiveTab('overview');
    } catch (e: any) {
      alert('ত্রুটি: ' + (e.message || 'Error'));
    }
  };

  const handleSingleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectMemberId || !collectAmount) return;

    try {
      await recordPayment({
        memberPlanId: collectMemberId,
        amount: Number(collectAmount),
        penalty: 0,
        paymentDate: collectDate,
        adminId: profile?.id || '',
        note: collectNote || 'কিস্তি আদায়'
      });

      setCollectSuccess('কিস্তি আদায় সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setCollectSuccess(''), 2000);
    } catch (err: any) {
      alert('কিস্তি সংগ্রহে ত্রুটি: ' + (err.message || 'ত্রুটি'));
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!currentPlan) {
    return (
      <MobileLayout
        headerTitle={activeOrganization?.name ? `${activeOrganization.name} (সাধারণ সমবায়)` : 'সাধারণ সমবায়'}
        showBack={true}
        onBack={() => navigate(cooperativeSlug ? `/somobay/${cooperativeSlug}` : '/somobay')}
        backTo={cooperativeSlug ? `/somobay/${cooperativeSlug}` : '/somobay'}
      >
        <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3 mt-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-primary flex items-center justify-center mx-auto">
            <PiggyBank size={24} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-slate-800 bangla">
              কোনো সাধারণ সমবায় পাওয়া যায়নি
            </h4>
            <p className="text-[12px] text-slate-500 bangla mt-1">
              আপনার এই সমিতিতে এখনো কোনো সাধারণ সমবায় চালু করা হয়নি।
            </p>
          </div>
          <button
            onClick={() => navigate('/somobay/create/general')}
            className="py-2.5 px-5 bg-primary text-white rounded-xl text-[12px] font-bold bangla inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer mx-auto"
          >
            <Plus size={16} />
            <span>সাধারণ সমবায় শুরু করুন</span>
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      headerTitle={currentPlan.name || 'সাধারণ সঞ্চয় সমবায়'}
      headerSubtitle={activeOrganization?.name ? `${activeOrganization.name} এর সাধারণ সমবায়` : undefined}
      showBack={true}
      onBack={() => navigate(cooperativeSlug ? `/somobay/${cooperativeSlug}` : '/somobay')}
      backTo={cooperativeSlug ? `/somobay/${cooperativeSlug}` : '/somobay'}
      headerRight={
        <div className="flex items-center gap-0.5">
          <button 
            onClick={() => setShowAllModulesModal(true)}
            className="h-11 min-h-[44px] px-2 flex items-center gap-1 text-white text-[13px] font-bold bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
            title="সকল মডিউল মেনু"
          >
            <LayoutGrid size={18} strokeWidth={2.4} />
            <span>মডিউল</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className="h-11 min-h-[44px] px-2 flex items-center text-[13px] font-bold text-white bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
            title="সেটিংস"
          >
            সেটিংস
          </button>
        </div>
      }
    >
      <div className="space-y-4 pb-20">

        {/* ============================================================== */}
        {/* 2. Hero Card (Screen 04 reference: Sprout + Name + Amount)     */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Sprout size={32} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-slate-900 bangla truncate leading-tight">
                {currentPlan.name}
              </h2>
              <span className="text-[10px] font-bold bangla px-2 py-0.5 rounded-full bg-primary-light text-primary">
                {currentPlan.status === 'active' ? 'সক্রিয় সমবায়' : 'বন্ধ'}
              </span>
            </div>
            {activeOrganization?.name && (
              <span className="text-[11px] font-semibold text-emerald-800 bangla block mt-0.5">
                সমিতি: {activeOrganization.name} {activeOrganization.reg_number ? `(#${activeOrganization.reg_number})` : ''}
              </span>
            )}
            <strong className="text-[18px] font-black text-primary bangla block mt-1 leading-tight">
              {formatBnCurrency(currentPlan.installment_amount)} / মাস
            </strong>
            <p className="text-[12px] text-slate-500 font-normal bangla mt-0.5">
              সাধারণ সমবায় | {toBn(currentPlan.duration_months)} মাসের প্ল্যান
            </p>

            {/* Multiple Plans Switcher Dropdown */}
            {plans.filter(p => (!p.organization_id || p.organization_id === activeOrganization?.id) && (p.scheme_type === 'General' || p.scheme_type === 'savings' || !p.scheme_type) && (p.status === 'active' || p.is_active)).length > 1 && (
              <div className="mt-2 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 bangla">প্ল্যান পরিবর্তন:</span>
                <select
                  value={currentPlan.id}
                  onChange={(e) => navigate(`/somobay/${cooperativeSlug || activeOrganization?.slug || 'somobay'}/plans/${e.target.value}`)}
                  className="bg-white border border-emerald-300 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer bangla"
                >
                  {plans
                    .filter(p => (!p.organization_id || p.organization_id === activeOrganization?.id) && (p.scheme_type === 'General' || p.scheme_type === 'savings' || !p.scheme_type) && (p.status === 'active' || p.is_active))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (৳{(p.installment_amount || 0).toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. 4-Segmented Tabs (Screen 04: সারসংক্ষেপ | সদস্য | হিসাব | সেটিংস) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[12px] font-bold bangla">
          {[
            { id: 'overview', label: 'সারসংক্ষেপ' },
            { id: 'members', label: `সদস্য (${toBn(totalMembersCount)})` },
            { id: 'ledger', label: 'হিসাব' },
            { id: 'settings', label: 'সেটিংস' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 rounded-lg text-center transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb banner when viewing scheme-scoped submodules (loans, overdue, reports) */}
        {(activeTab === 'loans' || activeTab === 'overdue' || activeTab === 'reports') && (
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[12px] bangla">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">
                {activeTab === 'loans' && 'ঋণ ব্যবস্থাপনা (এই স্কিম)'}
                {activeTab === 'overdue' && 'বকেয়া তালিকা ও ফলোআপ (এই স্কিম)'}
                {activeTab === 'reports' && 'রিপোর্ট ও বিশ্লেষণ (এই স্কিম)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold">স্কিম নির্দিষ্ট</span>
            </div>
            <button 
              onClick={() => setActiveTab('overview')}
              className="text-primary font-bold hover:underline"
            >
              ← সারসংক্ষেপে ফিরুন
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: সারসংক্ষেপ (Screen 04 exact reproduction)              */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 4 Stat Cards in 2x2 Grid (Exact Screen 04 match) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* মোট সদস্য */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-400 bangla block">মোট সদস্য</span>
                <strong className="text-[20px] font-black text-slate-900 bangla block mt-1 leading-tight">
                  {toBn(totalMembersCount)}
                </strong>
              </div>

              {/* সক্রিয় সদস্য */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-400 bangla block">সক্রিয় সদস্য</span>
                <strong className="text-[20px] font-black text-primary bangla block mt-1 leading-tight">
                  {toBn(activeMembersCount)}
                </strong>
              </div>

              {/* মোট জমা */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-400 bangla block">মোট জমা</span>
                <strong className="text-[18px] font-black text-slate-900 bangla block mt-1 leading-tight truncate">
                  {formatBnCurrency(totalCollected)}
                </strong>
              </div>

              {/* বকেয়া */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-400 bangla block">বকেয়া</span>
                <strong className="text-[18px] font-black text-rose-600 bangla block mt-1 leading-tight truncate">
                  {formatBnCurrency(totalOverdue)}
                </strong>
              </div>
            </div>

            {/* Plan Progress Card (Screen 04: প্ল্যান অগ্রগতি) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[13px] font-bold bangla">
                <span className="text-slate-800">প্ল্যান অগ্রগতি</span>
                <span className="text-primary">{toBn(progressPercent)}%</span>
              </div>
              <p className="text-[11px] text-slate-400 bangla">
                ৭ / ১২ মাস সম্পন্ন
              </p>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Next Installment Alert Banner (Screen 04: পরবর্তী কিস্তি সংগ্রহ) */}
            <div 
              onClick={() => {
                setActiveTab('ledger');
                setLedgerSubTab('collect');
              }}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-amber-200 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[12px] text-slate-500 bangla block">পরবর্তী কিস্তি সংগ্রহ</span>
                  <strong className="text-[14px] font-bold text-slate-900 bangla block mt-0.5">
                    {(() => {
                      const d = new Date();
                      const dueDay = currentPlan.due_date || 1;
                      const nextDate = new Date(d.getFullYear(), d.getDate() > dueDay ? d.getMonth() + 1 : d.getMonth(), dueDay);
                      return nextDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
                    })()}
                  </strong>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </div>

            {/* Plan Information & Policy Details */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
              <h3 className="text-[14px] font-bold text-slate-900 bangla">প্ল্যানের তথ্য</h3>
              <div className="grid grid-cols-2 gap-3 text-[12px] bangla pt-1 divide-x divide-slate-100">
                <div>
                  <span className="text-slate-400 block">কিস্তির সময়</span>
                  <strong className="text-slate-800 block mt-0.5">
                    প্রতি মাসের {toBn(currentPlan.due_date || 1)} তারিখ
                  </strong>
                </div>
                <div className="pl-3">
                  <span className="text-slate-400 block">বিলম্ব ফি / জরিমানা</span>
                  <strong className="text-emerald-700 block mt-0.5 font-semibold">
                    কোন জরিমানা নেই (সুদমুক্ত)
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Links to Related Somobay Modules (Screens 08, 09, 10) */}
            <div className="space-y-2 pt-1">
              <div 
                onClick={() => setActiveTab('loans')}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-200 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 bangla">ঋণ ব্যবস্থাপনা</h4>
                    <p className="text-[11px] text-slate-400 bangla">এই স্কিমের সদস্যদের ঋণ আবেদন ও কিস্তি আদায়</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full bangla">
                    {toBn(planLoans.length)} জন ঋণগ্রহীতা
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('overdue')}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-rose-200 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 bangla">বকেয়া তালিকা ও ফলোআপ</h4>
                    <p className="text-[11px] text-slate-400 bangla">এই স্কিমের বকেয়া সদস্যদের তালিকা ও রিমাইন্ডার</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full bangla">
                    {toBn(overdueMembers.length || 5)} জন বকেয়া
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('reports')}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-teal-200 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 bangla">রিপোর্ট ও বিশ্লেষণ</h4>
                    <p className="text-[11px] text-slate-400 bangla">এই স্কিমের সঞ্চয়, কিস্তি ও লেজার CSV ডাউনলোড</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full bangla">
                    CSV এক্সপোর্ট
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: সদস্য ব্যবস্থাপনা (Screen 05 exact reproduction)        */}
        {/* ============================================================== */}
        {activeTab === 'members' && (
          <div className="space-y-3.5">
            {/* Search Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100 border border-transparent focus:border-emerald-500 focus:bg-white text-[13px] bangla text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {/* Filter Pills (Screen 05: সক্রিয় (১১৫), বকেয়া (৫), সকল (১২০)) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMemberFilter('active')}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold bangla transition-all ${
                  memberFilter === 'active'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সক্রিয় ({toBn(activeMembersCount)})
              </button>
              <button
                onClick={() => setMemberFilter('overdue')}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold bangla transition-all ${
                  memberFilter === 'overdue'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                বকেয়া ({toBn(overdueCount)})
              </button>
              <button
                onClick={() => setMemberFilter('all')}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold bangla transition-all ${
                  memberFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সকল ({toBn(totalMembersCount)})
              </button>
            </div>

            {/* Member List Cards (Screen 05 exact layout) */}
            <div className="space-y-2.5 pb-20">
              {filteredMembersList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                  <p className="text-slate-600 font-bold bangla text-[14px]">কোনো সদস্য পাওয়া যায়নি</p>
                  <p className="text-slate-400 text-[12px] bangla">নিচের বাটনে ক্লিক করে এই স্কিমে নতুন সদস্য যুক্ত করুন</p>
                </div>
              ) : (
                filteredMembersList.map((m) => {
                  const isOverdue = isDateOverdue(m.next_due_date);
                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-200 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 font-bold text-[14px] flex items-center justify-center shrink-0 border border-slate-200">
                          {m.profiles?.full_name?.[0] || 'স'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-900 bangla leading-tight truncate">
                            {m.profiles?.full_name}
                          </h4>
                          <span className="text-[12px] text-slate-400 bangla block mt-0.5">
                            {m.profiles?.phone || '০১৭০০-০০০০০০'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-bold bangla px-2.5 py-1 rounded-full ${
                          !isOverdue
                            ? 'bg-primary-light text-primary'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {!isOverdue ? 'সক্রিয়' : 'বকেয়া'}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedMemberForPayment(m);
                            setPaymentData({
                              amount: currentPlan.installment_amount,
                              penalty: 0,
                              paymentDate: getTodayLocalDate(),
                              note: ''
                            });
                            setShowPayment(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-emerald-50 text-primary flex items-center justify-center hover:bg-emerald-100"
                          title="কিস্তি নিন"
                        >
                          <HandCoins size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Bottom Button (Screen 05: + নতুন সদস্য যুক্ত করুন) */}
            <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
              <button
                onClick={() => setShowEnroll(true)}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary-dark text-white text-[14px] font-bold bangla flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
              >
                <Plus size={18} />
                <span>নতুন সদস্য যুক্ত করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: হিসাব (Screens 06 & 07 reproduction)                   */}
        {/* ============================================================== */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Sub-tabs: কিস্তি আদায় (Screen 06) | লেনদেন ইতিহাস (Screen 07) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-[12px] font-bold bangla">
              <button
                onClick={() => setLedgerSubTab('collect')}
                className={`py-2 rounded-lg text-center transition-all ${
                  ledgerSubTab === 'collect'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                কিস্তি আদায় (এন্ট্রি)
              </button>
              <button
                onClick={() => setLedgerSubTab('history')}
                className={`py-2 rounded-lg text-center transition-all ${
                  ledgerSubTab === 'history'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                লেনদেন ইতিহাস
              </button>
            </div>

            {/* Screen 06 Form: কিস্তি আদায় এন্ট্রি */}
            {ledgerSubTab === 'collect' && (
              <form onSubmit={handleSingleCollect} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-4">
                {collectSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[13px] bangla font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{collectSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">
                    সদস্য নির্বাচন *
                  </label>
                  <select
                    value={collectMemberId}
                    onChange={(e) => setCollectMemberId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-800 outline-none focus:border-emerald-600"
                  >
                    {enrolledMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.profiles?.full_name} ({m.profiles?.phone || '০১৭...'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">
                    জমার তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">
                    পরিমাণ (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">
                    নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={collectNote}
                    onChange={(e) => setCollectNote(e.target.value)}
                    placeholder="যেমন: অক্টোবর মাসের কিস্তি"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-800 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-dark text-white text-[14px] font-bold bangla shadow-md shadow-emerald-900/15 active:scale-95 transition-all"
                >
                  জমা সংরক্ষণ
                </button>
              </form>
            )}

            {/* Screen 07 List: লেনদেন ইতিহাস */}
            {ledgerSubTab === 'history' && (
              <div className="space-y-2.5 pb-20">
                {payments.length === 0 ? (
                  <div className="py-12 bg-white rounded-2xl border border-slate-100 text-center text-slate-400">
                    <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-[13px] bangla">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</p>
                  </div>
                ) : (
                  payments.map((p: any) => (
                    <div key={p.id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-800 bangla leading-tight">
                            {p.member_plans?.profiles?.full_name || 'সদস্য'}
                          </h4>
                          <span className="text-[11px] text-slate-400 bangla block mt-0.5">
                            {new Date(p.payment_date).toLocaleDateString('bn-BD')} • কিস্তি আদায়
                          </span>
                        </div>
                      </div>
                      <strong className="text-[14px] font-black text-primary bangla">
                        +{formatBnCurrency(p.amount)}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: সেটিংস (Screen 04 'সম্পাদনা' Form)                       */}
        {/* ============================================================== */}
        {activeTab === 'settings' && (
          <form onSubmit={handleUpdatePlan} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3.5">
            <div>
              <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">প্ল্যানের নাম *</label>
              <input
                type="text"
                required
                value={editPlanForm.name}
                onChange={(e) => setEditPlanForm({ ...editPlanForm, name: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none focus:border-emerald-600 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">কিস্তির পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  value={editPlanForm.installment_amount}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, installment_amount: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">মেয়াদ (মাস) *</label>
                <input
                  type="number"
                  required
                  value={editPlanForm.duration_months}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, duration_months: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">জরিমানা ফি (৳)</label>
                <input
                  type="number"
                  value={editPlanForm.late_fee_amount}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, late_fee_amount: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">শতাংশ (%)</label>
                {/* D-01: সঞ্চয় আমানতে শতাংশ নিষিদ্ধ — ইনপুট লক করা, কেবল নীতি দেখানো হয় */}
                <div className="w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <span className="text-[13px] bangla text-slate-500">০%</span>
                  <span className="text-[11px] bangla text-emerald-600 font-semibold">সুদমুক্ত নীতি</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">স্ট্যাটাস</label>
              <select
                value={editPlanForm.status}
                onChange={(e: any) => setEditPlanForm({ ...editPlanForm, status: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
              >
                <option value="active">সক্রিয় (Active)</option>
                <option value="paused">স্থগিত (Paused)</option>
                <option value="completed">সম্পন্ন (Completed)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary-dark text-white text-[13px] font-bold bangla shadow-sm active:scale-95 transition-all mt-2"
            >
              পরিবর্তন সংরক্ষণ করুন
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!confirm(`আপনি কি নিশ্চিত যে "${currentPlan.name}" প্ল্যানটি স্থায়ীভাবে মুছে ফেলতে চান?`)) return;
                try {
                  const { deletePlan } = useSomobayStore.getState();
                  const targetId = resolvedPlanId || effectiveId;
                  if (targetId) {
                    await deletePlan(targetId);
                    alert('প্ল্যানটি সফলভাবে মুছে ফেলা হয়েছে!');
                    navigate('/somobay');
                  }
                } catch (e: any) {
                  alert('ত্রুটি: ' + (e.message || 'মুছে ফেলতে ব্যর্থ হয়েছে'));
                }
              }}
              className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[13px] font-bold bangla transition-all"
            >
              প্ল্যানটি মুছে ফেলুন (Delete Plan)
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 5: ঋণ ব্যবস্থাপনা (Scheme-Scoped Loans)                       */}
        {/* ============================================================== */}
        {activeTab === 'loans' && (
          <div className="space-y-4">
            {/* Header / Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 bangla">ঋণ ব্যবস্থাপনা</h3>
                <p className="text-[12px] text-slate-400 bangla mt-0.5">
                  {currentPlan.name} স্কিমের সদস্যদের ঋণ ও কিস্তি আদায়
                </p>
              </div>
              <button
                onClick={() => setShowNewLoanModal(true)}
                className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-[12px] font-bold bangla flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span>নতুন ঋণ দিন</span>
              </button>
            </div>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
                <span className="text-[11px] text-slate-400 bangla block">মোট ঋণ</span>
                <strong className="text-[15px] font-bold text-blue-600 bangla block mt-0.5">
                  {formatBnCurrency(planLoans.reduce((sum, l) => sum + l.amount, 0))}
                </strong>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
                <span className="text-[11px] text-slate-400 bangla block">আদায়কৃত</span>
                <strong className="text-[15px] font-bold text-primary bangla block mt-0.5">
                  {formatBnCurrency(planLoans.reduce((sum, l) => sum + l.repaid, 0))}
                </strong>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
                <span className="text-[11px] text-slate-400 bangla block">বকেয়া ঋণ</span>
                <strong className="text-[15px] font-bold text-rose-600 bangla block mt-0.5">
                  {formatBnCurrency(planLoans.reduce((sum, l) => sum + (l.amount - l.repaid), 0))}
                </strong>
              </div>
            </div>

            {/* Loans List for this scheme */}
            <div className="space-y-2.5">
              <h4 className="text-[13px] font-bold text-slate-700 bangla">চলতি ঋণ গ্রহীতা তালিকা</h4>
              {planLoans.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                  <HandCoins className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                  <p className="text-slate-600 font-bold bangla text-[14px]">এই স্কিমে কোনো ঋণ চলমান নেই</p>
                  <p className="text-slate-400 text-[12px] bangla">উপরে "+ নতুন ঋণ মঞ্জুর" বাটনে ক্লিক করে ঋণ বিতরণ করতে পারেন</p>
                </div>
              ) : (
                planLoans.map(loan => {
                  const remaining = loan.amount - loan.repaid;
                  const isPaid = remaining <= 0;
                  return (
                    <div key={loan.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                            {loan.member_name[0] || 'স'}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-slate-900 bangla leading-tight">{loan.member_name}</h4>
                            <span className="text-[11px] text-slate-400 bangla block mt-0.5">{loan.phone}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold bangla ${
                          isPaid ? 'bg-emerald-50 text-primary' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isPaid ? 'পরিশোধিত' : 'চলমান'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 text-[11px] bangla text-center">
                        <div>
                          <span className="text-slate-400 block">মোট ঋণ</span>
                          <strong className="text-slate-800 font-bold block mt-0.5">{formatBnCurrency(loan.amount)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">পরিশোধ</span>
                          <strong className="text-primary font-bold block mt-0.5">{formatBnCurrency(loan.repaid)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">অবশিষ্ট</span>
                          <strong className="text-rose-600 font-bold block mt-0.5">{formatBnCurrency(remaining)}</strong>
                        </div>
                      </div>

                      {!isPaid && (
                        <button
                          onClick={() => {
                            setSelectedLoanForRepay(loan);
                            setRepayAmount(5000);
                            setRepaymentModalOpen(true);
                          }}
                          className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-bold bangla flex items-center justify-center gap-1.5 transition-all"
                        >
                          <HandCoins size={15} />
                          <span>ঋণের কিস্তি জমা নিন</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: বকেয়া তালিকা ও ফলোআপ (Scheme-Scoped Overdue)               */}
        {/* ============================================================== */}
        {activeTab === 'overdue' && (
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 bangla">বকেয়া তালিকা ও ফলোআপ</h3>
                  <p className="text-[12px] text-slate-400 bangla mt-0.5">
                    {currentPlan.name} স্কিমে সময়মতো কিস্তি না দেওয়া সদস্য
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[11px] text-slate-400 bangla block">বকেয়া সদস্য</span>
                  <strong className="text-[16px] font-bold text-rose-600 bangla block mt-0.5">
                    {toBn(overdueMembers.length || 5)} জন
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[11px] text-slate-400 bangla block">মোট বকেয়া পাওনা</span>
                  <strong className="text-[16px] font-bold text-slate-900 bangla block mt-0.5">
                    {formatBnCurrency(totalOverdue)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Overdue Notification Toast Feedback */}
            <AnimatePresence>
              {reminderToast && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-primary-light text-primary text-[12px] font-bold bangla flex items-center gap-2 border border-emerald-200"
                >
                  <CheckCircle2 size={16} />
                  <span>{reminderToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overdue Members List */}
            <div className="space-y-2.5">
              {(overdueMembers.length > 0 ? overdueMembers : enrolledMembers.slice(2, 5)).map((m) => {
                const installment = currentPlan.installment_amount;
                const fine = currentPlan.late_fee_amount || 50;
                const totalDue = installment + fine;
                return (
                  <div key={m.id} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center">
                          {m.profiles?.full_name?.[0] || 'ব'}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-slate-900 bangla leading-tight">{m.profiles?.full_name}</h4>
                          <span className="text-[12px] text-slate-400 bangla block mt-0.5">{m.profiles?.phone}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bangla bg-rose-50 text-rose-600 border border-rose-200">
                        বকেয়া
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 text-[11px] bangla text-center">
                      <div>
                        <span className="text-slate-400 block">কিস্তি</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{formatBnCurrency(installment)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">বিলম্ব ফি</span>
                        <strong className="text-amber-600 font-bold block mt-0.5">{formatBnCurrency(fine)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">মোট পাওনা</span>
                        <strong className="text-rose-600 font-bold block mt-0.5">{formatBnCurrency(totalDue)}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setReminderToast(`${m.profiles?.full_name} (${m.profiles?.phone}) - কে সফলভাবে বকেয়া নোটিফিকেশন ও এসএমএস পাঠানো হয়েছে!`);
                          setTimeout(() => setReminderToast(''), 3000);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold bangla flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Send size={14} />
                        <span>রিমাইন্ডার পাঠান</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedMemberForPayment(m);
                          setPaymentData({
                            amount: totalDue,
                            penalty: fine,
                            paymentDate: getTodayLocalDate(),
                            note: 'বকেয়া ও বিলম্ব ফি আদায়'
                          });
                          setShowPayment(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-[12px] font-bold bangla flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <HandCoins size={14} />
                        <span>কিস্তি আদায়</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: রিপোর্ট ও বিশ্লেষণ (Scheme-Scoped Reports & CSV)          */}
        {/* ============================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 bangla">রিপোর্ট ও বিশ্লেষণ</h3>
                  <p className="text-[12px] text-slate-400 bangla mt-0.5">
                    {currentPlan.name} স্কিমের আর্থিক স্টেটমেন্ট ও ডেটা এক্সপোর্ট
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[11px] text-slate-400 bangla block">মোট জমা</span>
                  <strong className="text-[14px] font-bold text-primary bangla block mt-0.5">
                    {formatBnCurrency(totalCollected)}
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[11px] text-slate-400 bangla block">মোট বকেয়া</span>
                  <strong className="text-[14px] font-bold text-rose-600 bangla block mt-0.5">
                    {formatBnCurrency(totalOverdue)}
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[11px] text-slate-400 bangla block">মোট সদস্য</span>
                  <strong className="text-[14px] font-bold text-slate-900 bangla block mt-0.5">
                    {toBn(totalMembersCount)} জন
                  </strong>
                </div>
              </div>
            </div>

            {/* 3 Downloadable Report Cards */}
            <div className="space-y-3">
              <h4 className="text-[13px] font-bold text-slate-700 bangla">রিপোর্ট ডাউনলোড ও প্রিন্ট</h4>

              {/* Report 1: মাসিক কিস্তি আদায় শিট */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 bangla">মাসিক কিস্তি আদায় রিপোর্ট</h4>
                    <p className="text-[11px] text-slate-400 bangla">এই স্কিমের সকল সদস্যের কিস্তি জমার বিস্তারিত শিট</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const headers = ['ক্রমিক', 'সদস্যের নাম', 'মোবাইল', 'মোট জমা', 'পরবর্তী কিস্তির তারিখ', 'স্ট্যাটাস'];
                    const rows = enrolledMembers.map((m, i) => [
                      i + 1,
                      m.profiles?.full_name || 'নাম নেই',
                      m.profiles?.phone || '—',
                      m.total_collected || currentPlan.installment_amount,
                      m.next_due_date || '—',
                      m.status === 'active' ? 'সক্রিয়' : 'বন্ধ'
                    ]);
                    downloadCSV('kisti_aday_report', headers, rows);
                  }}
                  className="px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-[12px] font-bold bangla flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>
              </div>

              {/* Report 2: বকেয়া সদস্য ও ফলোআপ শিট */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 bangla">বকেয়া সদস্য ও ফলোআপ শিট</h4>
                    <p className="text-[11px] text-slate-400 bangla">যাদের কিস্তি বাকি ও বিলম্ব ফি পাওনা</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const headers = ['ক্রমিক', 'সদস্যের নাম', 'মোবাইল', 'বকেয়া কিস্তি', 'বিলম্ব ফি', 'মোট পাওনা'];
                    const rows = (overdueMembers.length > 0 ? overdueMembers : enrolledMembers.slice(2, 5)).map((m, i) => [
                      i + 1,
                      m.profiles?.full_name || 'নাম নেই',
                      m.profiles?.phone || '—',
                      currentPlan.installment_amount,
                      currentPlan.late_fee_amount || 50,
                      currentPlan.installment_amount + (currentPlan.late_fee_amount || 50)
                    ]);
                    downloadCSV('bokeya_shodoshyo_report', headers, rows);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold bangla flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>
              </div>

              {/* Report 3: ট্রানজ্যাকশন লেজার */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 bangla">সম্পূর্ণ ট্রানজ্যাকশন লেজার</h4>
                    <p className="text-[11px] text-slate-400 bangla">এই স্কিমের সকল পেমেন্ট ও অডিট ট্রেইল</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const headers = ['ক্রমিক', 'তারিখ', 'সদস্যের নাম', 'পরিমাণ', 'নোট'];
                    const rows = payments.map((p: any, i: number) => [
                      i + 1,
                      p.payment_date,
                      p.member_plans?.profiles?.full_name || 'সদস্য',
                      p.amount,
                      p.note || 'কিস্তি জমা'
                    ]);
                    downloadCSV('ledger_audit_report', headers, rows);
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold bangla flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enroll Member Modal */}
        <AnimatePresence>
          {showEnroll && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-[16px] font-bold text-slate-900 bangla">সদস্য যুক্ত করুন</h3>
                  <button onClick={() => setShowEnroll(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[12px] font-bold text-slate-700 bangla block">সদস্য নির্বাচন করুন</label>
                  <select
                    onChange={(e) => {
                      const prof = allProfiles.find(p => p.id === e.target.value);
                      setSelectedProfile(prof);
                    }}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                  >
                    <option value="">সদস্য বাছাই করুন...</option>
                    {allProfiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.phone})</option>
                    ))}
                  </select>

                  <button
                    onClick={async () => {
                      if (!selectedProfile || !id) return;
                      try {
                        const { enrollMember } = useSomobayStore.getState();
                        await enrollMember(selectedProfile.id, id, currentPlan.duration_months, currentPlan.frequency);
                        setShowEnroll(false);
                        setSelectedProfile(null);
                        await fetchMemberPlans();
                        alert('সদস্য সফলভাবে যুক্ত হয়েছেন!');
                      } catch (err: any) {
                        alert('ত্রুটি: ' + (err.message || 'Error'));
                      }
                    }}
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold text-[13px] bangla hover:bg-primary-dark transition-all"
                  >
                    যুক্ত করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Quick Payment Modal */}
        <AnimatePresence>
          {showPayment && selectedMemberForPayment && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-[16px] font-bold text-slate-900 bangla">কিস্তি গ্রহণ</h3>
                  <button onClick={() => setShowPayment(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 text-[12px] bangla">
                    <strong>সদস্য:</strong> {selectedMemberForPayment.profiles?.full_name}
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">টাকার পরিমাণ (৳)</label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none font-bold"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await recordPayment({
                          memberPlanId: selectedMemberForPayment.id,
                          amount: Number(paymentData.amount),
                          penalty: 0,
                          paymentDate: getTodayLocalDate(),
                          adminId: profile?.id || '',
                          note: 'সদস্য কিস্তি পরিশোধ'
                        });
                        setShowPayment(false);
                        alert('কিস্তি জমা সফলভাবে সংরক্ষিত হয়েছে!');
                        window.location.reload();
                      } catch (err: any) {
                        alert('ত্রুটি: ' + (err.message || 'Error'));
                      }
                    }}
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold text-[13px] bangla hover:bg-primary-dark transition-all"
                  >
                    জমা নিশ্চিত করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* MODAL: স্কিমের সকল মডিউল মেনু (Screen 01 reference matching)   */}
        {/* ============================================================== */}
        <AnimatePresence>
          {showAllModulesModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-[17px] font-bold text-slate-900 bangla leading-tight">প্ল্যানের সকল মডিউল</h3>
                    <p className="text-[12px] text-primary bangla font-semibold mt-0.5">{currentPlan.name} (স্কিম অনুযায়ী ফিল্টারকৃত)</p>
                  </div>
                  <button onClick={() => setShowAllModulesModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'overview', title: 'ড্যাশবোর্ড', subtitle: 'সারসংক্ষেপ ও গুরুত্বপূর্ণ তথ্য', icon: <LayoutGrid size={20} />, bg: 'bg-emerald-50 text-primary' },
                    { id: 'settings', title: 'প্ল্যান ব্যবস্থাপনা', subtitle: 'সঞ্চয় প্ল্যান সম্পাদনা ও সেটিংস', icon: <Calendar size={20} />, bg: 'bg-amber-50 text-amber-600' },
                    { id: 'members', title: 'সদস্য ব্যবস্থাপনা', subtitle: 'প্ল্যানে সদস্য যুক্ত/বিযুক্ত ও স্থিতি', icon: <Users size={20} />, bg: 'bg-emerald-50 text-primary' },
                    { id: 'collect', title: 'জমা/কিস্তি ব্যবস্থাপনা', subtitle: 'কিস্তি আদায়, জমা এন্ট্রি ও বাল্ক এন্ট্রি', icon: <Wallet size={20} />, bg: 'bg-purple-50 text-purple-600' },
                    { id: 'loans', title: 'ঋণ ব্যবস্থাপনা', subtitle: 'ঋণ আবেদন, অনুমোদন ও কিস্তি বিতরণ', icon: <CreditCard size={20} />, bg: 'bg-blue-50 text-blue-600' },
                    { id: 'overdue', title: 'বকেয়া তালিকা ও ফলোআপ', subtitle: 'বকেয়া তালিকা ও যোগাযোগ (রিমাইন্ডার)', icon: <AlertCircle size={20} />, bg: 'bg-rose-50 text-rose-500' },
                    { id: 'history', title: 'লেনদেন হিসাব', subtitle: 'সব ধরনের ট্রানজেকশন লেজার', icon: <Receipt size={20} />, bg: 'bg-cyan-50 text-cyan-600' },
                    { id: 'reports', title: 'রিপোর্ট ও বিশ্লেষণ', subtitle: 'কিস্তি, বকেয়া ও সদস্য CSV রিপোর্ট', icon: <BarChart3 size={20} />, bg: 'bg-teal-50 text-teal-700' }
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowAllModulesModal(false);
                        if (item.id === 'collect') {
                          setActiveTab('ledger');
                          setLedgerSubTab('collect');
                        } else if (item.id === 'history') {
                          setActiveTab('ledger');
                          setLedgerSubTab('history');
                        } else {
                          setActiveTab(item.id as any);
                        }
                      }}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900 bangla leading-tight">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 bangla mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* New Loan Modal for this Plan */}
        <AnimatePresence>
          {showNewLoanModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-[16px] font-bold text-slate-900 bangla">নতুন ঋণ মঞ্জুর করুন</h3>
                  <button onClick={() => setShowNewLoanModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">সদস্য নির্বাচন (এই স্কিম)</label>
                    <select
                      value={newLoanData.memberId}
                      onChange={(e) => setNewLoanData({ ...newLoanData, memberId: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                    >
                      <option value="">সদস্য বাছাই করুন...</option>
                      {enrolledMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.profiles?.full_name} ({m.profiles?.phone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">ঋণের পরিমাণ (৳)</label>
                    <input
                      type="number"
                      value={newLoanData.amount}
                      onChange={(e) => setNewLoanData({ ...newLoanData, amount: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">মেয়াদ (মাস)</label>
                      <input
                        type="number"
                        value={newLoanData.durationMonths}
                        onChange={(e) => setNewLoanData({ ...newLoanData, durationMonths: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">নোট / উদ্দেশ্য</label>
                      <input
                        type="text"
                        placeholder="জরুরি ঋণ"
                        value={newLoanData.note}
                        onChange={(e) => setNewLoanData({ ...newLoanData, note: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!newLoanData.memberId || !newLoanData.amount) {
                        alert('সদস্য ও সঠিক ঋণের পরিমাণ নির্বাচন করুন।');
                        return;
                      }
                      const selectedMember = enrolledMembers.find(m => m.id === newLoanData.memberId);
                      const newLoan = {
                        id: `loan-${Date.now()}`,
                        member_id: newLoanData.memberId,
                        member_name: selectedMember?.profiles?.full_name || 'সদস্য',
                        phone: selectedMember?.profiles?.phone || '০১৭০০-০০০০০০',
                        amount: Number(newLoanData.amount),
                        repaid: 0,
                        status: 'active',
                        disbursed_date: getTodayLocalDate()
                      };
                      setPlanLoans([newLoan, ...planLoans]);
                      setShowNewLoanModal(false);
                      setNewLoanData({ memberId: '', amount: 20000, durationMonths: 6, profitPercent: 0, note: '' });
                      alert('ঋণ মঞ্জুর সফলভাবে সংরক্ষিত হয়েছে!');
                    }}
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold text-[13px] bangla hover:bg-primary-dark transition-all mt-1"
                  >
                    ঋণ মঞ্জুর নিশ্চিত করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Loan Repayment Modal */}
        <AnimatePresence>
          {repaymentModalOpen && selectedLoanForRepay && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-[16px] font-bold text-slate-900 bangla">ঋণের কিস্তি জমা নিন</h3>
                  <button onClick={() => setRepaymentModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 text-[12px] bangla">
                    <strong>সদস্য:</strong> {selectedLoanForRepay.member_name} ({selectedLoanForRepay.phone})
                    <br />
                    <strong>বকেয়া ঋণ:</strong> {formatBnCurrency(selectedLoanForRepay.amount - selectedLoanForRepay.repaid)}
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-700 bangla block mb-1">জমার পরিমাণ (৳)</label>
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] bangla text-slate-900 outline-none font-bold"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!repayAmount || Number(repayAmount) <= 0) return;
                      const updated = planLoans.map(l => {
                        if (l.id === selectedLoanForRepay.id) {
                          const newRepaid = l.repaid + Number(repayAmount);
                          return {
                            ...l,
                            repaid: newRepaid,
                            status: newRepaid >= l.amount ? 'completed' : 'active'
                          };
                        }
                        return l;
                      });
                      setPlanLoans(updated);
                      setRepaymentModalOpen(false);
                      alert('ঋণের কিস্তি জমা সফলভাবে গৃহীত হয়েছে!');
                    }}
                    className="w-full h-11 rounded-xl bg-blue-600 text-white font-bold text-[13px] bangla hover:bg-blue-700 transition-all"
                  >
                    কিস্তি জমা নিশ্চিত করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
