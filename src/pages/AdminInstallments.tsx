import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useSomobayStore } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  HandCoins, 
  Plus 
} from 'lucide-react';
import { QuickCollectModal } from '../components/QuickCollectModal';
import { ReceiptModal, ReceiptData } from '../components/ReceiptModal';
import { isDateOverdue } from '../lib/dateUtils';
import { motion } from 'motion/react';

export default function AdminInstallments() {
  const navigate = useNavigate();
  const { memberPlans, fetchMemberPlans, adminStats } = useSomobayStore();
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'paid'>('overdue');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchMemberPlans();
  }, []);

  const overdueList = memberPlans.filter(mp => 
    mp.status === 'active' && isDateOverdue(mp.next_due_date)
  );

  const activeList = memberPlans.filter(mp => 
    mp.status === 'active' && !isDateOverdue(mp.next_due_date)
  );

  const paidList = memberPlans.filter(mp => 
    mp.status === 'completed' || (Number(mp.total_collected || 0) >= Number(mp.plan?.target_amount || 0) && Number(mp.plan?.target_amount || 0) > 0)
  );

  const displayList = activeTab === 'overdue' 
    ? overdueList 
    : activeTab === 'today' 
      ? activeList 
      : paidList;

  const filteredList = displayList.filter(mp => 
    mp.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mp.plan?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileLayout>
      {/* Segmented Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-[14px] text-[12px] font-semibold bangla">
        {[
          { id: 'overdue', label: `বকেয়া (${overdueList.length})` },
          { id: 'today', label: `আজকের (${activeList.length})` },
          { id: 'paid', label: `পরিশোধিত (${paidList.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 rounded-[10px] transition-all duration-150 active:scale-[0.96] select-none cursor-pointer text-center ${
              activeTab === tab.id
                ? 'bg-white text-primary font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="সদস্য বা সমিতির নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-border rounded-[16px] py-2.5 pl-10 pr-4 text-[13px] bangla text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus:outline-none focus:border-primary"
        />
      </div>

      {/* Installment List */}
      <div className="flex flex-col gap-2.5 pb-20">
        {filteredList.length > 0 ? (
          filteredList.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.12), duration: 0.18 }}
              className="bg-white p-3.5 rounded-[18px] border border-border shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 ${
                  activeTab === 'overdue' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-primary'
                }`}>
                  {item.profile?.full_name?.substring(0, 1) || 'স'}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-[14px] font-bold text-slate-800 bangla leading-tight truncate">
                    {item.profile?.full_name || 'সদস্য'}
                  </h3>
                  <p className="text-[11px] text-slate-500 bangla mt-0.5 truncate">
                    {item.plan?.name} • কিস্তি: ৳{(item.plan?.installment_amount || 0).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'paid' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-primary text-[12px] font-bold bangla flex items-center gap-1 border border-emerald-200/60">
                    <CheckCircle2 size={14} />
                    <span>পরিশোধিত</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedMemberId(item.member_id);
                      setShowCollectModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-bold bangla active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <HandCoins size={14} />
                    <span>আদায়</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Coins size={32} className="text-slate-300" />
            <p className="text-[14px] font-medium text-slate-400 bangla">কোন কিস্তি পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Button: কিস্তি আদায় করুন */}
      <div className="fixed bottom-[74px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pointer-events-none z-40">
        <button
          onClick={() => {
            setSelectedMemberId(null);
            setShowCollectModal(true);
          }}
          className="pointer-events-auto ml-auto flex items-center gap-1.5 px-5 py-3 rounded-full bg-primary text-white font-bold text-[13px] bangla shadow-lg shadow-emerald-700/25 active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>কিস্তি আদায় করুন</span>
        </button>
      </div>

      <QuickCollectModal
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        preSelectedMemberId={selectedMemberId}
        onPaymentSuccess={(receipt) => {
          setReceiptData(receipt);
          fetchMemberPlans();
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
