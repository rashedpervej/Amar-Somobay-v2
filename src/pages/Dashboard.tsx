import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { StatCard } from '../components/Dashboard/StatCard';
import { QuickAction } from '../components/Dashboard/QuickAction';
import { 
  Users, 
  Clock, 
  HandCoins, 
  CreditCard, 
  Bell,
  BarChart3,
  Sun,
  Moon,
  ChevronRight,
  User,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowLeftRight,
  PiggyBank,
  Coins,
  FileText,
  ChevronDown,
  Plus,
  Layers,
  ArrowUp,
  ArrowDown,
  Sprout,
  Wallet,
  Megaphone,
  HeartHandshake,
  Building2,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Search,
  Eye,
  ShieldCheck,
  PauseCircle,
  UserPlus,
  Check,
  Copy,
  Share2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { QuickCollectModal } from '../components/QuickCollectModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { ReceiptModal, ReceiptData } from '../components/ReceiptModal';
import { PromotionalCard } from '../components/PromotionalCard';
import { usePromotionStore } from '../store/usePromotionStore';
import { isDateOverdue } from '../lib/dateUtils';

export default function Dashboard() {
  const profile = useAuthStore(state => state.profile);
  const user = useAuthStore(state => state.user);
  const activeRole = useAuthStore(state => state.activeRole);
  const activeOrganization = useAuthStore(state => state.activeOrganization);
  const activeOrganizationId = useAuthStore(state => state.activeOrganizationId);
  const fetchMemberships = useAuthStore(state => state.fetchMemberships);
  const settings = useSettingsStore(state => state.settings);
  const totalSavings = useWalletStore(state => state.totalSavings);
  const fetchTotalSavings = useWalletStore(state => state.fetchTotalSavings);
  const wallet = useWalletStore(state => state.wallet);
  const fetchWallet = useWalletStore(state => state.fetchWallet);
  const { transactions, allActivity, fetchTransactions, fetchUnifiedActivity } = useWalletStore();
  const { memberPlans, fetchMemberPlans, adminStats, fetchAdminStats, plans, fetchPlans } = useSomobayStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();
  const { promotions, fetchPromotions } = usePromotionStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const [showQuickCollect, setShowQuickCollect] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const currentMonthYear = new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  const monthOptions = React.useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(d.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' }));
    }
    return list;
  }, []);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [pendingCooperativesCount, setPendingCooperativesCount] = useState(0);
  const [userPendingOrg, setUserPendingOrg] = useState<any>(null);

  // Cooperative Admin States
  const [pendingJoinRequestsCount, setPendingJoinRequestsCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isAdmin = profile?.role === 'admin' || activeRole === 'cooperative_admin';

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .eq('role', 'cooperative_admin')
        .then(({ data }) => {
          if (data && data.length > 0) {
            const pending = data.find(m => m.organization?.status === 'pending');
            setUserPendingOrg(pending?.organization || null);
          } else {
            setUserPendingOrg(null);
          }
        });
    }

    if (activeOrganizationId && isAdmin) {
      supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', activeOrganizationId)
        .eq('status', 'pending')
        .then(({ count }) => {
          if (count !== null) setPendingJoinRequestsCount(count);
        });
    }
  }, [user?.id, isAdmin, activeOrganizationId]);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};
    
    if (profile?.id) {
      const pId = profile.id;
      fetchNotifications(pId, activeOrganizationId).then(unsub => {
        if (active) unsubscribe = unsub;
        else unsub();
      });

      if (!isAdmin) {
        fetchMemberPlans(pId);
        fetchUnifiedActivity({ memberId: pId });
      } else {
        fetchAdminStats();
        fetchPlans();
        fetchUnifiedActivity();
      }
    }
    
    return () => {
      active = false;
      unsubscribe();
    };
  }, [profile?.id, activeOrganizationId, fetchNotifications, isAdmin, fetchMemberPlans, fetchAdminStats, fetchUnifiedActivity]);

  useEffect(() => {
    fetchPromotions(activeOrganizationId);
    if (isAdmin) {
      setLoading(false);
    } else if (profile?.id) {
      setLoading(false);
    }
  }, [isAdmin, profile?.id, activeOrganizationId, fetchPromotions]);

  const overdueMemberPlans = memberPlans.filter(mp => 
    mp.status === 'active' && isDateOverdue(mp.next_due_date)
  );

  const totalOverdueAmount = overdueMemberPlans.reduce((sum, mp) => {
    const installment = Number(mp.plan?.installment_amount || 0);
    const fine = Number(mp.pending_fine || 0);
    return sum + installment + fine;
  }, 0);

  const activePlansCount = memberPlans.filter(p => p.status === 'active').length;
  const activeUserPlans = memberPlans.filter(mp => mp.plan);
  const overallProgress = activeUserPlans.length > 0
    ? Math.max(0, Math.min(100, Math.round((activeUserPlans.reduce((acc, curr) => {
        const target = curr.plan?.target_amount || 1;
        const ratio = (curr.total_collected || 0) / target;
        return acc + Math.min(1, Math.max(0, ratio));
      }, 0) / activeUserPlans.length) * 100)))
    : 0;
  
  const earliestNextDue = memberPlans
    .filter(mp => mp.status === 'active' && mp.next_due_date)
    .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime())[0]?.next_due_date;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "সুপ্রভাত";
    if (hour < 18) return "শুভ দুপুর";
    return "শুভ সন্ধ্যা";
  };

  const filteredUnreadCount = unreadCount;

  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0" style={{ backgroundColor: `${theme.primary}1A` }}>
           {profile?.avatar_url ? (
             <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
           ) : (
             <span className="text-lg font-bold bangla" style={{ color: theme.primary }}>
               {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'ন'}
             </span>
           )}
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] text-slate-400 dark:text-slate-500 bangla font-medium leading-none mb-1">{getGreeting()}</span>
          <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">{profile?.full_name || 'সদস্য'}</h1>
          <div 
            className="mt-1 px-3 py-0.5 rounded-full w-fit" 
            style={{ 
              backgroundColor: profile?.role === 'admin' ? `${theme.primary}1A` : (theme.mode === 'light' ? '#f1f5f9' : '#1e293b'),
            }}
          >
            <span 
              className="text-[11px] font-bold bangla" 
              style={{ color: profile?.role === 'admin' ? theme.primary : '#64748b' }}
            >
              {profile?.role === 'admin' ? 'অ্যাডমিন (Admin)' : profile?.role === 'member' ? 'সদস্য (Member)' : 'অপেক্ষমান (Pending)'}
            </span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => navigate('/notifications')}
        className="bg-white/80 dark:bg-[#1e293b]/60 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 active:scale-95 transition-all relative backdrop-blur-md"
      >
        <Bell size={22} strokeWidth={2.2} />
        {filteredUnreadCount > 0 && (
          <div 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#0b0f1a] flex items-center justify-center text-[10px] font-extrabold text-white shadow-lg animate-pulse"
            style={{ backgroundColor: theme.primary }}
          >
            {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
          </div>
        )}
      </button>
    </div>
  );

  if (isAdmin) {
    const activePlans = plans.filter(p => p.is_active !== false);
    const totalPlansCount = activePlans.length;
    const savingsCount = activePlans.filter(p => p.scheme_type === 'General' || p.scheme_type === 'savings').length;
    const roscaCount = activePlans.filter(p => p.scheme_type === 'rosca').length;
    const jointCount = activePlans.filter(p => p.scheme_type === 'joint_goal').length;
    const qardCount = activePlans.filter(p => p.scheme_type === 'qard').length;
    const savingsPct = totalPlansCount > 0 ? Math.round((savingsCount / totalPlansCount) * 100) : 0;
    const roscaPct = totalPlansCount > 0 ? Math.round((roscaCount / totalPlansCount) * 100) : 0;
    const jointPct = totalPlansCount > 0 ? Math.round((jointCount / totalPlansCount) * 100) : 0;
    const qardPct = totalPlansCount > 0 ? Math.round((qardCount / totalPlansCount) * 100) : 0;

    const displayAdminActivity = allActivity.slice(0, 4);

    return (
      <MobileLayout
        headerTitle="ড্যাশবোর্ড"
        headerRight={
          <div className="flex items-center gap-1">
            <div className="relative flex items-center">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-transparent border-0 text-white text-[12px] font-bold bangla pl-1 pr-5 py-2 cursor-pointer focus:outline-none"
              >
                {monthOptions.map(m => (
                  <option key={m} value={m} className="text-slate-800">{m}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-white/90 pointer-events-none" />
            </div>

            <button 
              onClick={() => navigate('/notifications')}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform relative focus:outline-none cursor-pointer"
              title="বিজ্ঞপ্তি"
              aria-label="বিজ্ঞপ্তি"
            >
              <Bell size={22} strokeWidth={2.2} />
              {filteredUnreadCount > 0 && (
                <div className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
                </div>
              )}
            </button>
          </div>
        }
      >



        {/* Pending Member Join Requests Banner */}
        {pendingJoinRequestsCount > 0 && (
          <div 
            onClick={() => navigate('/members?tab=requests')}
            className="bg-amber-50 border border-amber-200 rounded-[20px] p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-amber-950 bangla flex items-center gap-1.5">
                  <span>{pendingJoinRequestsCount.toLocaleString('bn-BD')} টি নতুন যোগদানের আবেদন</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                </div>
                <div className="text-[11px] text-amber-700 bangla mt-0.5">
                  সদস্য হিসেবে যুক্ত করতে আবেদন অনুমোদন বা বাতিল করুন
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bangla bg-amber-200/80 px-2.5 py-1 rounded-full shrink-0">
              <span>দেখুন</span>
              <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* 4 KPI Cards (2x2 Grid) - Vibrant Colorful Style with Bubble Accents */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: মোট সদস্য (Warm Orange) */}
          <div 
            onClick={() => navigate('/members')}
            className="relative overflow-hidden rounded-[22px] p-3.5 bg-gradient-to-br from-[#FF7A45] to-[#EA580C] text-white shadow-[0_8px_20px_-6px_rgba(234,88,12,0.38)] flex flex-col justify-between cursor-pointer active:scale-[0.98] hover:shadow-[0_12px_24px_-6px_rgba(234,88,12,0.48)] transition-all min-h-[114px]"
          >
            {/* Bubble Accents matching reference */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none" />
            <div className="absolute right-6 -top-2 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-black/10 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white/90 bangla tracking-wide">মোট সদস্য</span>
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center border border-white/20 shadow-xs">
                <Users size={16} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="relative z-10 mt-2">
              <div className="text-[22px] font-black text-white leading-tight tracking-tight">
                {(adminStats.totalMembers || 0).toLocaleString('bn-BD')}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-white bangla font-semibold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full w-fit">
                <Users size={12} strokeWidth={2.5} />
                <span>সক্রিয় সদস্য তালিকা</span>
              </div>
            </div>
          </div>

          {/* Card 2: মোট সঞ্চয় (Royal Electric Blue) */}
          <div 
            onClick={() => navigate('/admin/savings')}
            className="relative overflow-hidden rounded-[22px] p-3.5 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_8px_20px_-6px_rgba(29,78,216,0.38)] flex flex-col justify-between cursor-pointer active:scale-[0.98] hover:shadow-[0_12px_24px_-6px_rgba(29,78,216,0.48)] transition-all min-h-[114px]"
          >
            {/* Bubble Accents matching reference */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none" />
            <div className="absolute right-6 -top-2 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-black/10 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white/90 bangla tracking-wide">মোট সঞ্চয়</span>
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center border border-white/20 shadow-xs">
                <PiggyBank size={16} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="relative z-10 mt-2">
              <div className="text-[20px] font-black text-white leading-tight tracking-tight">
                ৳{(adminStats.totalCollections || 0).toLocaleString('bn-BD')}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-white bangla font-semibold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full w-fit">
                <PiggyBank size={12} strokeWidth={2.5} />
                <span>মোট আদায়কৃত সঞ্চয়</span>
              </div>
            </div>
          </div>

          {/* Card 3: মোট ঋণ (Lush Forest Green) */}
          <div 
            onClick={() => navigate('/admin/loans')}
            className="relative overflow-hidden rounded-[22px] p-3.5 bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white shadow-[0_8px_20px_-6px_rgba(21,128,61,0.38)] flex flex-col justify-between cursor-pointer active:scale-[0.98] hover:shadow-[0_12px_24px_-6px_rgba(21,128,61,0.48)] transition-all min-h-[114px]"
          >
            {/* Bubble Accents matching reference */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none" />
            <div className="absolute right-6 -top-2 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-black/10 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white/90 bangla tracking-wide">মোট ঋণ</span>
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center border border-white/20 shadow-xs">
                <CreditCard size={16} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="relative z-10 mt-2">
              <div className="text-[20px] font-black text-white leading-tight tracking-tight">
                ৳{(0).toLocaleString('bn-BD')}
              </div>
              <div className="mt-1 text-[11px] text-white bangla font-semibold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full w-fit">
                চলমান স্কিম: {(adminStats.activeEnrollments || 0).toLocaleString('bn-BD')} টি
              </div>
            </div>
          </div>

          {/* Card 4: বকেয়া কিস্তি (Vivid Coral Rose) */}
          <div 
            onClick={() => navigate('/members?filter=overdue')}
            className="relative overflow-hidden rounded-[22px] p-3.5 bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white shadow-[0_8px_20px_-6px_rgba(225,29,72,0.38)] flex flex-col justify-between cursor-pointer active:scale-[0.98] hover:shadow-[0_12px_24px_-6px_rgba(225,29,72,0.48)] transition-all min-h-[114px]"
          >
            {/* Bubble Accents matching reference */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15 pointer-events-none" />
            <div className="absolute right-6 -top-2 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-black/10 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white/90 bangla tracking-wide">বকেয়া কিস্তি</span>
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center border border-white/20 shadow-xs">
                <AlertCircle size={16} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="relative z-10 mt-2">
              <div className="text-[20px] font-black text-white leading-tight tracking-tight">
                ৳{(adminStats.pendingDues || 0).toLocaleString('bn-BD')}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-white bangla font-semibold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full w-fit">
                <ArrowDown size={12} strokeWidth={2.5} />
                <span>বকেয়া: {(adminStats.overdueMembers || 0).toLocaleString('bn-BD')} জন</span>
              </div>
            </div>
          </div>
        </div>

        {/* সমিতি টাইপ অনুযায়ী বিভাজন (Donut Breakdown Card) */}
        <div className="bg-white rounded-[20px] p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <h2 className="text-[15px] font-bold text-slate-800 bangla mb-3">সমিতি টাইপ অনুযায়ী বিভাজন</h2>
          <div className="flex items-center justify-between gap-4">
            {/* SVG Donut Chart */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="14" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="transparent" 
                  stroke="#087F5B" 
                  strokeWidth="14"
                  strokeDasharray={`${(savingsPct * 238) / 100} 238`}
                  strokeDashoffset="0"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="transparent" 
                  stroke="#8B5CF6" 
                  strokeWidth="14"
                  strokeDasharray={`${(roscaPct * 238) / 100} 238`}
                  strokeDashoffset={`-${(savingsPct * 238) / 100}`}
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="transparent" 
                  stroke="#06B6D4" 
                  strokeWidth="14" 
                  strokeDasharray={`${(jointPct * 238) / 100} 238`}
                  strokeDashoffset={`-${((savingsPct + roscaPct) * 238) / 100}`}
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="transparent" 
                  stroke="#D97706" 
                  strokeWidth="14" 
                  strokeDasharray={`${(qardPct * 238) / 100} 238`}
                  strokeDashoffset={`-${((savingsPct + roscaPct + jointPct) * 238) / 100}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 bangla leading-none">মোট ক্যাটাগরি</span>
                <span className="text-[18px] font-bold text-slate-800 leading-tight mt-0.5">{totalPlansCount}টি</span>
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-center justify-between text-[12px] bangla">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <span className="text-slate-600 font-medium truncate">সাধারণ সমিতি</span>
                </div>
                <span className="font-bold text-slate-800 shrink-0">{savingsCount} ({savingsPct}%)</span>
              </div>

              <div className="flex items-center justify-between text-[12px] bangla">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
                  <span className="text-slate-600 font-medium truncate">রোসকা (মেয়াদি)</span>
                </div>
                <span className="font-bold text-slate-800 shrink-0">{roscaCount} ({roscaPct}%)</span>
              </div>

              <div className="flex items-center justify-between text-[12px] bangla">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shrink-0" />
                  <span className="text-slate-600 font-medium truncate">যৌথ সঞ্চয়</span>
                </div>
                <span className="font-bold text-slate-800 shrink-0">{jointCount} ({jointPct}%)</span>
              </div>

              <div className="flex items-center justify-between text-[12px] bangla">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] shrink-0" />
                  <span className="text-slate-600 font-medium truncate">কর্জে হাসানা</span>
                </div>
                <span className="font-bold text-slate-800 shrink-0">{qardCount} ({qardPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* দ্রুত কার্যক্রম (Quick Actions) */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-bold text-slate-800 bangla px-0.5">দ্রুত কার্যক্রম</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'collect', title: 'কিস্তি আদায়', icon: <HandCoins size={20} />, onClick: () => setShowQuickCollect(true), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { id: 'approvals', title: 'পেন্ডিং অনুমোদন', icon: <Clock size={20} />, onClick: () => navigate('/admin/payments/pending'), color: 'text-rose-600', bg: 'bg-rose-50' },
              { id: 'member', title: 'নতুন সদস্য', icon: <Plus size={20} />, onClick: () => setShowAddMember(true), color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'group', title: 'সমিতি ও গ্রুপ', icon: <Layers size={20} />, onClick: () => navigate('/somobay/manage'), color: 'text-purple-600', bg: 'bg-purple-50' },
              { id: 'savings', title: 'সাধারণ সমবায়', icon: <Sprout size={20} />, onClick: () => navigate('/somobay'), color: 'text-primary', bg: 'bg-primary-light' },
              { id: 'qard', title: 'কর্জে হাসানা', icon: <Coins size={20} />, onClick: () => navigate('/qard'), color: 'text-primary', bg: 'bg-primary-light' },
              { id: 'loans', title: 'ঋণ বণ্টন', icon: <CreditCard size={20} />, onClick: () => navigate('/admin/loans'), color: 'text-amber-600', bg: 'bg-amber-50' },
              { id: 'notices', title: 'নোটিশ বোর্ড', icon: <FileText size={20} />, onClick: () => navigate('/admin/notices'), color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="bg-white rounded-[16px] p-3 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all text-center group"
              >
                <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  {action.icon}
                </div>
                <span className="text-[12px] font-semibold text-slate-700 bangla leading-tight">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* সাম্প্রতিক কার্যক্রম (Recent Activity List) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center px-0.5">
            <h2 className="text-[15px] font-bold text-slate-800 bangla">সাম্প্রতিক কার্যক্রম</h2>
            <button 
              onClick={() => navigate('/admin/reports')} 
              className="text-primary text-[12px] font-semibold bangla flex items-center gap-0.5 hover:underline"
            >
              <span>সব দেখুন</span>
              <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {displayAdminActivity.length > 0 ? (
              displayAdminActivity.map((act: any, i) => (
                <div 
                  key={act.id || i}
                  className="bg-white p-3 rounded-[16px] border border-border shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-primary flex items-center justify-center font-bold text-[14px]">
                      {act.member_name?.substring(0, 1) || 'স'}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 bangla leading-tight">{act.member_name || 'সদস্য লেনদেন'}</h4>
                      <p className="text-[11px] text-slate-500 bangla mt-0.5">{act.note || act.transaction_type || 'কিস্তি সংগ্রহ'} • {act.time || 'আজ'}</p>
                    </div>
                  </div>
                  <div className="text-[13px] font-bold text-primary">
                    +৳{(Number(act.amount) || 0).toLocaleString('bn-BD')}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 bangla bg-white rounded-[16px] border border-dashed border-border">
                এখনো কোনো সাম্প্রতিক কার্যক্রম রেকর্ড নেই
              </div>
            )}
          </div>
        </div>

        {/* Quick Collect Modal */}
        <QuickCollectModal
          isOpen={showQuickCollect}
          onClose={() => setShowQuickCollect(false)}
          onPaymentSuccess={(receipt) => {
            setReceiptData(receipt);
            fetchAdminStats();
            fetchUnifiedActivity();
          }}
        />

        {/* Add Member Modal */}
        <AddMemberModal
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
          onMemberAdded={() => {
            fetchAdminStats();
            setShowAddMember(false);
          }}
        />

        {/* Receipt Voucher Modal */}
        <ReceiptModal
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          data={receiptData}
        />
      </MobileLayout>
    );
  }

  const displayActivity = allActivity;

  // Compute next installment plan and amount based on earliest due date
  const earliestDuePlan = memberPlans
    .filter(mp => mp.status === 'active' && mp.next_due_date)
    .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime())[0];

  const nextInstallmentAmount = earliestDuePlan 
    ? Number(earliestDuePlan.plan?.installment_amount || 0) + Number(earliestDuePlan.pending_fine || 0)
    : 0;

  // Member Dashboard UI (Matches Reference Screen)
  return (
    <MobileLayout hideHeader={true}>
      {/* Top Member Profile & Notification Bar (Matches Screenshot) */}
      <div className="flex items-center justify-between pt-1 pb-0.5">
        <div 
          onClick={() => navigate('/settings/profile')}
          className="flex items-center gap-3 cursor-pointer group active:opacity-85 transition-opacity"
        >
          <div 
            className="w-[46px] h-[46px] rounded-full flex items-center justify-center border border-slate-200 shadow-xs overflow-hidden shrink-0 bg-slate-100" 
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[17px] font-bold bangla text-primary">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'স'}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-[17px] font-bold text-[#0F172A] bangla leading-tight">
              {profile?.full_name || 'সম্মানিত সদস্য'}
            </h2>
            <p className="text-[13px] text-text-secondary bangla font-medium mt-0.5 leading-none">
              {profile?.id ? `সদস্য ID: SM-${profile.id.slice(0, 4).toUpperCase()}` : 'সদস্য একাউন্ট'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/notifications')}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1E293B] hover:text-[#0F172A] active:scale-90 transition-transform relative focus:outline-none cursor-pointer -mr-1"
          title="বিজ্ঞপ্তি"
          aria-label="বিজ্ঞপ্তি"
        >
          <Bell size={24} strokeWidth={2} />
          {filteredUnreadCount > 0 && (
            <div 
              className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 rounded-full border-2 border-white bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white shadow-xs"
            >
              {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Pending Cooperative Application Status (If any) */}
      {userPendingOrg && (
        <div 
          onClick={() => navigate('/cooperative/apply')}
          className="bg-amber-50 border border-amber-200 p-3.5 rounded-[18px] flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-bold text-amber-900 bangla leading-tight truncate">
                "{userPendingOrg.name}" সমিতির আবেদন পর্যালোচনায় রয়েছে
              </h4>
              <span className="bg-amber-200 text-amber-800 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                পেন্ডিং
              </span>
            </div>
            <p className="text-[11px] text-amber-700 bangla mt-0.5 truncate">
              ট্র্যাকিং কোড: #{userPendingOrg.reg_number || 'SAM-xxxx'} • সুপার অ্যাডমিনের অনুমোদনের পর সক্রিয় হবে
            </p>
          </div>
          <ChevronRight size={16} className="text-amber-500 shrink-0" />
        </div>
      )}


      {/* Due Alert for Members (Conditional) */}
      {overdueMemberPlans.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/somobay')}
          className="bg-rose-50 rounded-[16px] p-3 flex items-center gap-3 border border-rose-200 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm shrink-0">
            <AlertCircle size={22} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-[13px] font-bold text-slate-800 bangla leading-tight">বকেয়া কিস্তি পরিশোধের সময় হয়েছে</h3>
            <p className="text-[11px] text-slate-500 bangla mt-0.5 truncate">
              আপনার {overdueMemberPlans.length.toLocaleString('bn-BD')}টি কিস্তি (মোট ৳{totalOverdueAmount.toLocaleString('bn-BD')}) বকেয়া রয়েছে।
            </p>
          </div>
          <ChevronRight size={18} className="text-rose-400 shrink-0" />
        </motion.div>
      )}

      {/* 2. Main Somobay Summary Card (Circular Liquid Progress Tracker - Kept dynamic) */}
      <div 
        className="w-full relative rounded-[20px] overflow-hidden text-white shadow-md border border-white/10"
        style={{ 
          height: "196px", 
          backgroundColor: "#02362F",
          backgroundImage: "url('https://jkxmcbzipmcmyiwfqupx.supabase.co/storage/v1/object/public/branding/cad%20bg.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="relative w-full h-full p-[16px] pb-[12px] flex flex-col justify-between z-10">
          <div className="relative flex justify-between items-center z-10">
            <div>
              <h3 className="font-bold text-[15px] bangla tracking-wide text-white">সমবায় সারসংক্ষেপ</h3>
              <div className="w-[36px] h-[2.5px] bg-emerald-400 mt-1 rounded-full" />
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/savings/insights');
              }}
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 cursor-pointer border border-white/20 rounded-full px-3 py-1 text-[11px] bangla font-semibold transition-all relative z-20 text-white"
            >
              <span>বিস্তারিত দেখুন</span> <ChevronRight size={12} />
            </button>
          </div>

          <div className="relative grid grid-cols-[114px_1fr] gap-4 items-center z-10 mb-1 mt-1">
            {/* Circular Liquid Ring */}
            <div 
              className="relative w-[114px] h-[114px] flex flex-col items-center justify-center"
              style={{
                transform: "scale(1.35)",
                transformOrigin: 'center'
              }}
            >
              <svg className="absolute inset-0 w-full h-full -rotate-[225deg]" viewBox="-10 -10 100 100">
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className="stroke-white/10" 
                  strokeWidth="5.5" 
                  fill="transparent" 
                />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className="stroke-emerald-400 transition-all duration-500 ease-out" 
                  strokeWidth="5.5" 
                  fill="transparent"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * (overallProgress || 0)) / 100}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-[21px] rounded-full overflow-hidden bg-emerald-950/40 flex flex-col items-center justify-center z-10 border border-white/5 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 via-emerald-400 to-[#00ffbb] z-0 opacity-35" />
                <div 
                  className="absolute left-[-35px] w-[142px] h-[142px] transition-all duration-1000 ease-out z-10"
                  style={{ bottom: `${overallProgress}%` }}
                >
                  <div 
                    className="absolute inset-0 rounded-[38%] bg-[#02362F]/80"
                    style={{ transformOrigin: 'center' }}
                  />
                  <div 
                    className="absolute inset-0 rounded-[41%] bg-[#02362F]"
                    style={{ transformOrigin: 'center' }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 z-20 pointer-events-none" />
                <div className="relative z-30 flex flex-col items-center justify-center text-white drop-shadow-md">
                  <span className="text-[20px] font-extrabold leading-none">{overallProgress}%</span>
                  <span className="text-[9.5px] opacity-90 bangla mt-0.5 whitespace-nowrap">গড় অগ্রগতি</span>
                </div>
               </div>
            </div>

            {/* Next Due & Overdue Details */}
            <div className="flex flex-col justify-between text-[13px] pl-3 border-l-2 h-[86px] border-white/15 bangla ml-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Calendar size={14} />
                </div>
                <div>
                  <p className="text-[11px] text-white/70">পরবর্তী কিস্তি</p>
                  <p className="font-bold leading-tight text-[13px] text-white">
                    {earliestNextDue 
                      ? `${new Date(earliestNextDue).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })} ${nextInstallmentAmount > 0 ? `(৳${nextInstallmentAmount.toLocaleString('bn-BD')})` : ''}` 
                      : 'কিস্তি নেই (৳০)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                  <AlertCircle size={14} />
                </div>
                <div>
                  <p className="text-[11px] text-white/70">বকেয়া কিস্তি</p>
                  <p className="font-bold leading-tight text-[13px] text-white">
                    {overdueMemberPlans.length > 0 
                      ? `${overdueMemberPlans.length.toLocaleString('bn-BD')} টি (৳${totalOverdueAmount.toLocaleString('bn-BD')})` 
                      : 'বকেয়া নেই (৳০)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Six Quick Actions Grid (Matches Reference Screen 3: সঞ্চয়, ঋণ, কিস্তি, লেনদেন, মিটিং, নোটিশ) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[16px] font-semibold text-slate-800 bangla">দ্রুত কার্যক্রম</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'savings', title: 'সঞ্চয়', icon: <PiggyBank size={22} />, path: '/savings', color: 'text-primary', bg: 'bg-primary-light' },
            { id: 'installment', title: 'কিস্তি জমা', icon: <Coins size={22} />, path: '/savings/deposit', color: 'text-amber-600', bg: 'bg-amber-50' },
            { id: 'withdraw', title: 'উত্তোলন', icon: <Wallet size={22} />, path: '/savings/withdraw', color: 'text-rose-600', bg: 'bg-rose-50' },
            { id: 'qard', title: 'কর্জে হাসানা', icon: <HeartHandshake size={22} />, path: '/qard', color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { id: 'transactions', title: 'লেনদেন', icon: <ArrowLeftRight size={22} />, path: '/savings', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { id: 'updates', title: 'আপডেটস', icon: <Megaphone size={22} />, path: '/updates', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-[16px] p-3 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-center group"
            >
              <div className={`w-11 h-11 rounded-xl ${action.bg} ${action.color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                {action.icon}
              </div>
              <span className="text-[13px] font-semibold text-slate-700 bangla leading-tight">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Promotional Banner Card (Kept dynamic) */}
      {(() => {
        const activePromos = promotions.filter(p => p.is_active);
        if (activePromos.length === 0) return null;
        const currentPromo = activePromos[activePromoIndex % activePromos.length] || activePromos[0];

        return (
          <div className="mt-1">
            <PromotionalCard
              promo={currentPromo}
              totalCards={activePromos.length}
              currentIndex={activePromoIndex % activePromos.length}
              onNext={() => setActivePromoIndex((prev) => (prev + 1) % activePromos.length)}
              onPrev={() => setActivePromoIndex((prev) => (prev - 1 + activePromos.length) % activePromos.length)}
              onClick={() => navigate(`/promotions/${currentPromo.id}`)}
            />
          </div>
        );
      })()}

      {/* 6. Recent Activity / সাম্প্রতিক কার্যক্রম (Clean Light Cards) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center px-0.5">
          <h2 className="text-[16px] font-semibold text-slate-800 bangla">সাম্প্রতিক কার্যক্রম</h2>
          <button 
            onClick={() => navigate('/savings')} 
            className="text-primary text-[13px] font-semibold bangla flex items-center gap-0.5"
          >
            <span>সব দেখুন</span>
            <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {displayActivity.slice(0, 4).length > 0 ? (
            displayActivity.slice(0, 4).map((tx) => (
              <div 
                key={tx.id}
                className="bg-white p-3.5 rounded-[16px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between active:scale-[0.99] cursor-pointer"
                onClick={() => navigate('/savings')}
              >
                {(() => {
                  let iconBg = 'bg-primary-light text-primary';
                  let label = 'সঞ্চয় জমা';
                  let isDeposit = tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' || (tx.transaction_type === 'plan_payment' && tx.type !== 'refund' && tx.type !== 'fine' && tx.type !== 'fine_payment' && tx.amount >= 0);
                  let isNegative = tx.amount < 0 || tx.type === 'refund' || tx.type === 'fine' || tx.type === 'fine_payment';
                  let displayAmountClass = isNegative ? 'text-[#DC2626]' : 'text-[#16A34A]';
                  let displayAmountPrefix = isNegative ? '-' : '+';

                  if (tx.transaction_type === 'plan_payment') {
                    if (tx.type === 'fine' || tx.type === 'fine_payment') {
                      iconBg = 'bg-amber-50 text-amber-600';
                      label = 'জরিমানা যুক্ত';
                    } else if (tx.type === 'waiver') {
                      iconBg = 'bg-indigo-50 text-indigo-600';
                      label = 'জরিমানা মওকুফ';
                    } else if (tx.type === 'refund') {
                      iconBg = 'bg-rose-50 text-[#DC2626]';
                      label = 'টাকা রিফান্ড';
                    } else {
                      iconBg = 'bg-primary-light text-primary';
                      label = 'কিস্তি পরিশোধ';
                    }
                  } else if (tx.transaction_type === 'loan') {
                    iconBg = 'bg-purple-50 text-purple-600';
                    label = 'ঋণ গ্রহণ';
                  }

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                          {isDeposit ? <ArrowDownLeft size={20} strokeWidth={2.2} /> : <ArrowUpRight size={20} strokeWidth={2.2} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-slate-800 bangla leading-tight">
                            {label}
                          </span>
                          <span className="text-[11px] text-slate-400 bangla font-normal mt-0.5">
                            {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {tx.plan_name && ` • ${tx.plan_name}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-[15px] font-bold bangla ${displayAmountClass}`}>
                          {displayAmountPrefix}৳{Math.abs(tx.amount).toLocaleString('bn-BD')}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium bangla bg-emerald-50 px-1.5 py-0.2 rounded-full mt-0.5">
                          সফল
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))
          ) : (
             <div className="p-8 text-center text-slate-400 bangla bg-white rounded-[16px] border border-dashed border-border">
               এখনও কোনো সাম্প্রতিক লেনদেন রেকর্ড নেই
             </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
