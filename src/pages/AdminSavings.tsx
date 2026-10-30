import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useSomobayStore } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Search, 
  PiggyBank, 
  HandCoins, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Clock,
  Banknote,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { QuickCollectModal } from '../components/QuickCollectModal';
import { ReceiptModal, ReceiptData } from '../components/ReceiptModal';
import { isDateOverdue } from '../lib/dateUtils';

export default function AdminSavings() {
  const navigate = useNavigate();
  const { cooperativeSlug } = useParams<{ cooperativeSlug?: string }>();
  const { memberPlans, fetchMemberPlans, adminStats, fetchAdminStats } = useSomobayStore();
  const [activeTab, setActiveTab] = useState<'monthly' | 'collection' | 'fines'>('monthly');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberPlans();
    fetchAdminStats();
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          member_plans (
            id,
            status,
            total_collected,
            pending_fine,
            next_due_date,
            plan:somobay_plans(id, name, installment_amount)
          )
        `);
      if (!error && data) {
        setMembers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const overdueMembers = members.filter(m => 
    m.member_plans?.some((mp: any) => mp.status === 'active' && isDateOverdue(mp.next_due_date))
  );

  const collectedCount = Math.max(0, members.length - overdueMembers.length);
  const totalCollectedAmount = adminStats.totalCollections || 0;
  const totalOverdueAmount = adminStats.pendingDues || 0;

  const filteredMembers = members.filter(m => 
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const backTarget = cooperativeSlug ? `/somobay/${cooperativeSlug}` : '/dashboard';
  const settingsTarget = cooperativeSlug ? `/somobay/${cooperativeSlug}/settings` : '/admin/savings/settings';

  return (
    <MobileLayout
      headerTitle="সাধারণ সঞ্চয় ব্যবস্থাপনা"
      showBack={true}
      backTo={backTarget}
      headerRight={
        <button
          onClick={() => navigate(settingsTarget)}
          className="p-1.5 text-slate-600 hover:text-primary rounded-xl hover:bg-slate-100 transition-colors"
          title="সঞ্চয় পলিসি ও সেটিংস"
        >
          <Settings size={20} />
        </button>
      }
    >

      {/* Segmented Tabs (Screen 7: মাসিক সঞ্চয়, কিস্তি আদায়, জরিমানা) */}
      {/* Segmented Tabs: মাসিক সঞ্চয়, কিস্তি আদায়, উত্তোলন আবেদন */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-[14px] text-[12px] font-semibold bangla">
        {[
          { id: 'monthly', label: 'মাসিক সঞ্চয়' },
          { id: 'collection', label: 'কিস্তি আদায়' },
          { id: 'withdrawals', label: 'উত্তোলন আবেদন' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'withdrawals') {
                navigate('/admin/savings/settings');
              } else {
                setActiveTab(tab.id as any);
              }
            }}
            className={`py-2 rounded-[10px] transition-all text-center ${
              activeTab === tab.id
                ? 'bg-white text-primary font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Month Dropdown Selector */}
      <div className="relative">
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full appearance-none bg-white border border-border text-slate-700 text-[13px] font-semibold bangla rounded-[14px] px-3.5 py-2.5 shadow-sm cursor-pointer focus:outline-none focus:border-primary"
        >
          {monthOptions.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* 2 KPI Cards (Screen 7) */}
      <div className="grid grid-cols-2 gap-3">
        {/* মোট আদায় */}
        <div className="bg-white rounded-[18px] p-3.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 bangla">মোট আদায়</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[19px] font-bold text-primary leading-tight">
              ৳{totalCollectedAmount.toLocaleString('bn-BD')}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 bangla">
              আদায়কৃত সদস্য: {collectedCount.toLocaleString('bn-BD')} জন
            </div>
          </div>
        </div>

        {/* মোট বকেয়া */}
        <div className="bg-white rounded-[18px] p-3.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 bangla">মোট বকেয়া</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[19px] font-bold text-rose-600 leading-tight">
              ৳{totalOverdueAmount.toLocaleString('bn-BD')}
            </div>
            <div className="mt-0.5 text-[11px] text-rose-500 bangla">
              বকেয়া সদস্য: {overdueMembers.length.toLocaleString('bn-BD')} জন
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="সদস্যের নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-border rounded-[16px] py-2.5 pl-10 pr-4 text-[13px] bangla text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus:outline-none focus:border-primary"
        />
      </div>

      {/* Member Savings List */}
      <div className="flex flex-col gap-2.5 pb-20">
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-white rounded-[16px] border border-border animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length > 0 ? (
          filteredMembers.map((member, i) => {
            const hasOverdue = member.member_plans?.some((mp: any) => mp.status === 'active' && isDateOverdue(mp.next_due_date));
            const plan = member.member_plans?.[0]?.plan;
            const amount = plan?.installment_amount || 0;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.12), duration: 0.18 }}
                onClick={() => navigate(`/members/${member.id}`)}
                className="bg-white p-3 rounded-[16px] border border-border shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-primary border border-emerald-100 flex items-center justify-center font-bold text-[14px] shrink-0 overflow-hidden">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.full_name?.substring(0, 1) || 'স'}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-[14px] font-bold text-slate-800 bangla leading-tight truncate">{member.full_name}</h3>
                    <span className="text-[12px] text-slate-400 font-medium mt-0.5">SM-{member.id.substring(0, 3).toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[14px] font-bold text-slate-800">৳{amount.toLocaleString('bn-BD')}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold bangla border ${
                    hasOverdue 
                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                    : 'bg-primary-light text-primary border-emerald-200'
                  }`}>
                    {hasOverdue ? 'বকেয়া' : 'আদায়কৃত'}
                  </span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <PiggyBank size={32} className="text-slate-300" />
            <p className="text-[14px] font-medium text-slate-400 bangla">কোন তথ্য পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Buttons: বাল্ক জমা + সঞ্চয় আদায় */}
      <div className="fixed bottom-[74px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pointer-events-none z-40 flex items-center justify-end gap-2">
        <button
          onClick={() => navigate('/savings/bulk')}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[12px] bangla shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Banknote size={16} className="text-emerald-600" />
          <span>বাল্ক জমা</span>
        </button>

        <button
          onClick={() => setShowCollectModal(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary text-white font-bold text-[12px] bangla shadow-lg shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>সঞ্চয় আদায়</span>
        </button>
      </div>

      {/* Quick Collect & Shareable Receipt Modals */}
      <QuickCollectModal
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        onPaymentSuccess={(receipt) => {
          setReceiptData(receipt);
          loadMembers();
          fetchAdminStats();
        }}
      />

      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </MobileLayout>
  );
}
