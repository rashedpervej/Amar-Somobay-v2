import React, { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  PiggyBank, 
  Clock, 
  Filter, 
  Search, 
  ChevronDown, 
  X,
  Calendar as CalendarIcon,
  User as UserIcon,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Plus,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../store/useSettingsStore';
import { supabase } from '../lib/supabase';

export default function SavingsHistory() {
  const profile = useAuthStore(state => state.profile);
  const settings = useSettingsStore(state => state.settings);
  const { allActivity, fetchUnifiedActivity, totalSavings, fetchTotalSavings, wallet, fetchWallet, loading } = useWalletStore();
  const { plans, fetchPlans, memberPlans, fetchMemberPlans } = useSomobayStore();
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isAdmin = profile?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'savings' | 'transactions'>('savings');
  const [txCategory, setTxCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    memberId: '',
    planId: '',
    type: ''
  });
  const [members, setMembers] = useState<any[]>([]);
  const [membersInPlan, setMembersInPlan] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) {
      const initialFilters = isAdmin ? {} : { memberId: profile.id };
      fetchUnifiedActivity(initialFilters);
      if (!isAdmin) {
        fetchMemberPlans(profile.id);
        fetchTotalSavings();
        fetchWallet(profile.id);
      }
      if (isAdmin) {
        fetchPlans();
        fetchMembers();
      }
    }
  }, [profile?.id, isAdmin, fetchUnifiedActivity, fetchMemberPlans, fetchTotalSavings, fetchWallet, fetchPlans]);

  const fetchMembers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'member');
    if (data) {
      setMembers(data);
      setMembersInPlan(data);
    }
  };

  const fetchMembersOfPlan = async (planId: string) => {
    if (!planId) {
      setMembersInPlan(members);
      return;
    }
    const { data } = await supabase
      .from('member_plans')
      .select('member_id, profiles(id, full_name)')
      .eq('plan_id', planId);
    
    if (data) {
      const planMembers = data.map((mp: any) => mp.profiles).filter(Boolean);
      setMembersInPlan(planMembers);
    }
  };

  const handleApplyFilters = () => {
    fetchUnifiedActivity({
      memberId: filters.memberId || (isAdmin ? undefined : profile?.id),
      planId: filters.planId
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ memberId: '', planId: '', type: '' });
    fetchUnifiedActivity(isAdmin ? {} : { memberId: profile?.id });
    setShowFilters(false);
  };

  const getTxTypeLabel = (type: string) => {
    switch (type) {
      case 'savings': return 'সঞ্চয় জমা';
      case 'deposit': return 'আমানত';
      case 'plan_payment': return 'কিস্তি পরিশোধ';
      case 'installment': return 'কিস্তি জমা';
      case 'loan': return 'ঋণ';
      case 'fine': return 'জরিমানা';
      case 'adjustment': return 'সমন্বয়';
      default: return 'লেনদেন';
    }
  };

  const getTxTypeColor = (type: string) => {
    switch (type) {
      case 'savings': return 'bg-primary-light text-primary';
      case 'plan_payment': return 'bg-primary-light text-primary';
      case 'installment': return 'bg-amber-50 text-amber-600';
      case 'loan': return 'bg-purple-50 text-purple-600';
      case 'fine': return 'bg-rose-50 text-[#DC2626]';
      case 'deposit': return 'bg-cyan-50 text-cyan-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // Member computed metrics
  const activeUserPlans = memberPlans.filter(p => p.status === 'active');
  const activePlansCount = activeUserPlans.length;
  const totalMemberSaved = activeUserPlans.reduce((sum, p) => sum + Number(p.total_collected || 0), 0) || totalSavings;
  const earliestDue = activeUserPlans
    .filter(p => p.next_due_date)
    .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime())[0]?.next_due_date;

  // Filtered transactions for member or admin
  const userActivity = allActivity;

  const filteredItems = isAdmin
    ? (filters.type ? userActivity.filter(tx => tx.transaction_type === filters.type) : userActivity)
    : (txCategory === 'all'
        ? userActivity
        : userActivity.filter(tx => {
            if (txCategory === 'savings') return tx.transaction_type === 'savings' || tx.transaction_type === 'deposit';
            if (txCategory === 'installment') return tx.transaction_type === 'plan_payment' || tx.transaction_type === 'installment';
            if (txCategory === 'loan') return tx.transaction_type === 'loan';
            if (txCategory === 'fine') return tx.transaction_type === 'fine' || tx.type === 'fine';
            return true;
          })
      );

  const savingsDeposits = userActivity.filter(tx => 
    tx.transaction_type === 'savings' || tx.transaction_type === 'deposit' || (tx.transaction_type === 'plan_payment' && tx.amount > 0)
  );

  // ---------------- ADMIN VIEW ----------------
  if (isAdmin) {
    return (
      <MobileLayout
        headerTitle="আর্থিক লেনদেন অডিট"
        showBack={true}
        headerRight={
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title="ফিল্টার"
            aria-label="ফিল্টার"
          >
            <Filter size={22} strokeWidth={showFilters ? 2.8 : 2.2} />
          </button>
        }
      >

        {/* Filters Panel for Admin */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[16px] p-4 mb-4 shadow-sm border border-border relative z-20"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[14px] font-semibold text-slate-800 bangla">ফিল্টার করুন</h3>
                <button onClick={() => setShowFilters(false)} className="text-slate-400"><X size={18} /></button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 bangla">প্ল্যান নির্বাচন</span>
                  <select 
                    value={filters.planId}
                    onChange={(e) => {
                      const newPlanId = e.target.value;
                      setFilters(f => ({ ...f, planId: newPlanId, memberId: '' }));
                      fetchMembersOfPlan(newPlanId);
                    }}
                    className="w-full bg-bg-soft border border-border rounded-xl p-2.5 text-[13px] bangla text-slate-800 outline-none"
                  >
                    <option value="">সকল প্ল্যান</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 bangla">সদস্য নির্বাচন</span>
                  <select 
                    value={filters.memberId}
                    onChange={(e) => setFilters(f => ({ ...f, memberId: e.target.value }))}
                    className="w-full bg-bg-soft border border-border rounded-xl p-2.5 text-[13px] bangla text-slate-800 outline-none"
                  >
                    <option value="">{filters.planId ? 'প্ল্যানের সকল সদস্য' : 'সকল সদস্য'}</option>
                    {membersInPlan.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={clearFilters}
                    className="flex-1 py-2 rounded-xl font-semibold bangla text-slate-600 bg-slate-100 text-[13px]"
                  >
                    ক্লিয়ার
                  </button>
                  <button 
                    onClick={handleApplyFilters}
                    className="flex-2 py-2 rounded-xl font-semibold bangla text-white shadow-sm text-[13px] bg-primary"
                  >
                    প্রয়োগ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Transaction List */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[15px] font-semibold text-slate-800 bangla">লেনদেন তালিকা</h2>
            <span className="text-[11px] text-slate-400 bangla">{filteredItems.length} টি রেকর্ড</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((tx) => (
                <div key={tx.id} className="bg-white p-3.5 rounded-[16px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTxTypeColor(tx.transaction_type)}`}>
                      {tx.amount >= 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-800 bangla leading-tight">{getTxTypeLabel(tx.transaction_type)}</div>
                      <div className="text-[11px] text-slate-400 bangla mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('bn-BD')} • {tx.profiles?.full_name || 'সদস্য'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[15px] font-bold bangla ${tx.amount < 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                      {tx.amount < 0 ? '-' : '+'}৳{Math.abs(tx.amount).toLocaleString('bn-BD')}
                    </div>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full font-medium">সফল</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 bangla bg-white rounded-[16px] border border-dashed border-border">
                কোনো লেনদেন রেকর্ড পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ---------------- MEMBER VIEW (Matches Reference Screen 4 & Screen 7) ----------------
  return (
    <MobileLayout
      headerTitle={activeTab === 'savings' ? 'আমার সঞ্চয়' : 'লেনদেনের বিবরণ'}
      showBack={false}
      headerRight={
        <button 
          onClick={() => navigate('/savings/insights')}
          className="h-11 min-h-[44px] px-2 flex items-center gap-1 text-white text-[13px] font-bold bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
        >
          <span>ইনসাইট</span>
          <ChevronRight size={16} strokeWidth={2.4} />
        </button>
      }
    >
      {/* Segmented Top Tabs (Reference Style) */}
      <div className="bg-[#E2E8F0]/50 p-1 rounded-xl flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('savings')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold bangla transition-all ${
            activeTab === 'savings'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          আমার সঞ্চয়
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold bangla transition-all ${
            activeTab === 'transactions'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          সকল লেনদেন
        </button>
      </div>

      {/* TAB 1: আমার সঞ্চয় (Reference Screen 4) */}
      {activeTab === 'savings' && (
        <div className="flex flex-col gap-3.5">
          {/* Emerald Green Summary Card */}
          <div 
            className="w-full bg-primary rounded-[20px] p-5 text-white shadow-md relative overflow-hidden"
            style={{
              backgroundImage: "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.12) 0%, transparent 60%)"
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[12px] text-white/80 bangla font-medium">মোট সঞ্চিত অর্থ</span>
                <div className="text-[26px] font-bold leading-tight mt-0.5 bangla text-white">
                  ৳{totalMemberSaved.toLocaleString('bn-BD')}
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
                সক্রিয় হিসাব
              </span>
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[12px] bangla text-white/90">
              <div className="flex items-center gap-1.5">
                <PiggyBank size={15} className="text-white/80" />
                <span>চলমান প্ল্যান: {activePlansCount.toLocaleString('bn-BD')} টি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-white/80" />
                <span>পরবর্তী জমা: {earliestDue ? new Date(earliestDue).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : 'কোনো বকেয়া নেই'}</span>
              </div>
            </div>
          </div>

          {/* Primary CTA Buttons: + নতুন সঞ্চয় জমা & সঞ্চয় উত্তোলন */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate('/savings/deposit')}
              className="bg-primary hover:bg-primary-dark text-white py-3.5 px-3 rounded-[16px] font-semibold text-[13px] bangla flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>সঞ্চয় জমা করুন</span>
            </button>
            <button
              onClick={() => navigate('/savings/withdraw')}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3.5 px-3 rounded-[16px] font-semibold text-[13px] bangla flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <CreditCard size={18} className="text-amber-600" />
              <span>সঞ্চয় উত্তোলন</span>
            </button>
          </div>

          {/* সঞ্চয়ের ইতিহাস Section */}
          <div className="flex flex-col gap-2.5 mt-1">
            <div className="flex justify-between items-center px-0.5">
              <h2 className="text-[16px] font-semibold text-slate-800 bangla">সঞ্চয়ের ইতিহাস</h2>
              <span className="text-[12px] text-slate-400 bangla">{savingsDeposits.length} টি জমা</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : savingsDeposits.length > 0 ? (
                savingsDeposits.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.12), duration: 0.18 }}
                    className="bg-white p-3.5 rounded-[16px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                        <ArrowDownLeft size={20} strokeWidth={2.2} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-slate-800 bangla leading-tight">
                          {tx.plan_name || 'মাসিক সঞ্চয়'}
                        </span>
                        <span className="text-[11px] text-slate-400 bangla font-normal mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })} • {tx.note || 'নগদ জমা'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[15px] font-bold text-[#16A34A] bangla">
                        +৳{Math.abs(tx.amount).toLocaleString('bn-BD')}
                      </span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full font-medium mt-0.5">
                        সফল
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 bangla bg-white rounded-[16px] border border-dashed border-border">
                  এখনও কোনো সঞ্চয় জমা রেকর্ড নেই
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: সকল লেনদেন (Reference Screen 7) */}
      {activeTab === 'transactions' && (
        <div className="flex flex-col gap-3">
          {/* Horizontal Filter Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'সব' },
              { id: 'savings', label: 'সঞ্চয়' },
              { id: 'installment', label: 'কিস্তি' },
              { id: 'loan', label: 'ঋণ' },
              { id: 'fine', label: 'জরিমানা' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTxCategory(tab.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold bangla whitespace-nowrap transition-all border ${
                  txCategory === tab.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-slate-600 border-border hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Categorized List */}
          <div className="flex flex-col gap-2.5">
            {filteredItems.length > 0 ? (
              filteredItems.map((tx, i) => {
                const isDeposit = tx.amount >= 0;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.12), duration: 0.18 }}
                    className="bg-white p-3.5 rounded-[16px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDeposit ? 'bg-primary-light text-primary' : 'bg-rose-50 text-[#DC2626]'}`}>
                        {isDeposit ? <ArrowDownLeft size={20} strokeWidth={2.2} /> : <ArrowUpRight size={20} strokeWidth={2.2} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-slate-800 bangla leading-tight">
                          {getTxTypeLabel(tx.transaction_type)}
                        </span>
                        <span className="text-[11px] text-slate-400 bangla font-normal mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {tx.plan_name && ` • ${tx.plan_name}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[15px] font-bold bangla ${isDeposit ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {isDeposit ? '+' : '-'}৳{Math.abs(tx.amount).toLocaleString('bn-BD')}
                      </span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full font-medium mt-0.5">
                        সফল
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 bangla bg-white rounded-[16px] border border-dashed border-border">
                এই ক্যাটাগরিতে কোনো লেনদেন নেই
              </div>
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
