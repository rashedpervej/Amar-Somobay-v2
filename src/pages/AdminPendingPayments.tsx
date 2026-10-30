import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { withdrawalService, WithdrawalRequest } from '../lib/withdrawalService';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HandCoins, 
  Wallet, 
  Search, 
  RefreshCw,
  AlertCircle,
  FileText,
  User,
  Building,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Format Bengali numerals
const toBn = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, d => bnDigits[Number(d)]);
};

const formatBnCurrency = (amount: number): string => {
  return '৳ ' + toBn(Math.round(amount).toLocaleString('en-IN'));
};

export default function AdminPendingPayments() {
  const navigate = useNavigate();
  const { profile, activeOrganizationId } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeOrganizationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch pending deposits from plan_payments (scoped to current organization)
      let depositQuery = supabase
        .from('plan_payments')
        .select(`
          id,
          amount,
          penalty_paid,
          payment_date,
          note,
          status,
          type,
          member_plan:member_plan_id!inner(
            id,
            total_collected,
            plan:somobay_plans!inner(id, name, scheme_type, installment_amount, organization_id),
            profile:member_id(id, full_name, phone, avatar_url)
          )
        `)
        .eq('status', 'pending');

      if (activeOrganizationId) {
        depositQuery = depositQuery.eq('member_plan.plan.organization_id', activeOrganizationId);
      }

      const { data: deposits, error: dErr } = await depositQuery.order('payment_date', { ascending: false });

      if (!dErr && deposits) {
        setPendingDeposits(deposits);
      }

      // 2. Fetch pending withdrawals (scoped to current organization)
      const withdrawals = await withdrawalService.getAllPendingWithdrawals(activeOrganizationId || undefined);
      setPendingWithdrawals(withdrawals);
    } catch (e) {
      console.error('Error loading pending approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  // Approve a pending deposit
  const handleApproveDeposit = async (paymentId: string) => {
    if (!profile?.id) return;
    try {
      setProcessingId(paymentId);
      const { error } = await supabase
        .from('plan_payments')
        .update({
          status: 'approved',
          admin_id: profile.id
        })
        .eq('id', paymentId);

      if (error) throw error;

      alert('জমা সফলভাবে অনুমোদিত হয়েছে এবং সদস্যের সঞ্চয় হিসাবে যোগ হয়েছে!');
      loadData();
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'অনুমোদন ব্যর্থ হয়েছে'));
    } finally {
      setProcessingId(null);
    }
  };

  // Reject a pending deposit
  const handleRejectDeposit = async (paymentId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই জমাটি বাতিল করতে চান?')) return;
    try {
      setProcessingId(paymentId);
      const { error } = await supabase
        .from('plan_payments')
        .update({
          status: 'rejected',
          admin_id: profile?.id
        })
        .eq('id', paymentId);

      if (error) throw error;

      alert('জমা বাতিল করা হয়েছে।');
      loadData();
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'বাতিলকরণ ব্যর্থ হয়েছে'));
    } finally {
      setProcessingId(null);
    }
  };

  // Approve a withdrawal request
  const handleApproveWithdrawal = async (withdrawalId: string) => {
    if (!profile?.id) return;
    try {
      setProcessingId(withdrawalId);
      await withdrawalService.processWithdrawalRequest({
        id: withdrawalId,
        status: 'approved',
        adminId: profile.id,
        adminNote: 'সঞ্চয় উত্তোলন অনুমোদন ও পরিশোধ সম্পন্ন'
      });

      alert('সঞ্চয় উত্তোলন অনুমোদন ও লেজারে ভাউচার এন্ট্রি সফল হয়েছে!');
      loadData();
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'অনুমোদন ব্যর্থ হয়েছে'));
    } finally {
      setProcessingId(null);
    }
  };

  // Reject a withdrawal request
  const handleRejectWithdrawal = async (withdrawalId: string) => {
    const reason = prompt('বাতিলের কারণ লিখুন (ঐচ্ছিক):') || 'শর্তাবলি পূরণ না হওয়ায়';
    try {
      setProcessingId(withdrawalId);
      await withdrawalService.processWithdrawalRequest({
        id: withdrawalId,
        status: 'rejected',
        adminId: profile?.id || '',
        adminNote: reason
      });

      alert('উত্তোলন আবেদন বাতিল করা হয়েছে।');
      loadData();
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'বাতিলকরণ ব্যর্থ হয়েছে'));
    } finally {
      setProcessingId(null);
    }
  };

  // Filter lists by search query
  const filteredDeposits = pendingDeposits.filter(d => {
    const name = d.member_plan?.profile?.full_name || '';
    const phone = d.member_plan?.profile?.phone || '';
    const planName = d.member_plan?.plan?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      planName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredWithdrawals = pendingWithdrawals.filter(w => {
    const name = w.member?.full_name || '';
    const phone = w.member?.phone || '';
    const planName = w.plan?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      planName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <MobileLayout
      headerTitle="পেন্ডিং অনুমোদন কিউ"
      headerSubtitle="সদস্যদের জমা ও উত্তোলন যাচাইকরণ"
      backTo="/dashboard"
      showBack={true}
      headerRight={
        <button
          onClick={loadData}
          className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform"
          title="রিফ্রেশ"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >
      <div className="space-y-3.5 pb-20">
        {/* Segmented Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl text-[13px] font-bold bangla">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'deposits'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <HandCoins size={16} />
            <span>পেন্ডিং জমা ({toBn(pendingDeposits.length)})</span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'withdrawals'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Wallet size={16} />
            <span>উত্তোলন আবেদন ({toBn(pendingWithdrawals.length)})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="সদস্যের নাম বা ফোন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-border rounded-xl py-2.5 pl-10 pr-4 text-[13px] bangla text-slate-800 shadow-xs focus:outline-none focus:border-primary"
          />
        </div>

        {/* TAB 1: PENDING DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="space-y-3">
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-1" />
                <h4 className="text-[15px] font-bold text-slate-800 bangla">কোনো পেন্ডিং জমা নেই</h4>
                <p className="text-[12px] text-slate-400 bangla">
                  {searchQuery ? 'আপনার অনুসন্ধানের সাথে কোনো রেকর্ড মিলেনি।' : 'সদস্যদের সকল জমা অনুমোদিত রয়েছে।'}
                </p>
              </div>
            ) : (
              filteredDeposits.map((item) => {
                const member = item.member_plan?.profile;
                const plan = item.member_plan?.plan;
                const isProcessing = processingId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
                  >
                    {/* Header: Member & Plan */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-emerald-50 text-primary font-bold text-[14px] flex items-center justify-center shrink-0 border border-emerald-100">
                          {member?.full_name?.[0] || 'স'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-900 bangla leading-tight truncate">
                            {member?.full_name || 'অজ্ঞাত সদস্য'}
                          </h4>
                          <span className="text-[11px] text-slate-400 bangla block mt-0.5">
                            {member?.phone || '০১৭০০-০০০০০০'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <strong className="text-[16px] font-black text-primary bangla block leading-tight">
                          {formatBnCurrency(item.amount)}
                        </strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-block mt-0.5 bangla">
                          অনুমোদন অপেক্ষায়
                        </span>
                      </div>
                    </div>

                    {/* Details Pill */}
                    <div className="bg-slate-50 rounded-xl p-2.5 text-[12px] bangla text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">স্কিম:</span>
                        <strong className="text-slate-800">{plan?.name || 'সাধারণ সঞ্চয়'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">তারিখ:</span>
                        <span>{item.payment_date || 'আজ'}</span>
                      </div>
                      {item.note && (
                        <div className="flex justify-between pt-1 border-t border-slate-200/50">
                          <span className="text-slate-400">বিবরণ/TrxID:</span>
                          <span className="text-slate-700 font-medium truncate max-w-[200px]">{item.note}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleRejectDeposit(item.id)}
                        disabled={isProcessing}
                        className="py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-[12px] font-bold bangla flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        <span>বাতিল করুন</span>
                      </button>
                      <button
                        onClick={() => handleApproveDeposit(item.id)}
                        disabled={isProcessing}
                        className="py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[12px] font-bold bangla flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} />
                        <span>{isProcessing ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন দিন'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PENDING WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-1" />
                <h4 className="text-[15px] font-bold text-slate-800 bangla">কোনো উত্তোলন আবেদন নেই</h4>
                <p className="text-[12px] text-slate-400 bangla">
                  সদস্যদের নতুন সঞ্চয় উত্তোলন আবেদন এখানে প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              filteredWithdrawals.map((w) => {
                const isProcessing = processingId === w.id;
                const totalBalance = Number(w.member_plan?.total_collected) || 0;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
                  >
                    {/* Header: Member & Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 font-bold text-[14px] flex items-center justify-center shrink-0 border border-blue-100">
                          {w.member?.full_name?.[0] || 'স'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-900 bangla leading-tight truncate">
                            {w.member?.full_name || 'সদস্য'}
                          </h4>
                          <span className="text-[11px] text-slate-400 bangla block mt-0.5">
                            {w.member?.phone || '০১৭০০-০০০০০০'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <strong className="text-[16px] font-black text-rose-600 bangla block leading-tight">
                          {formatBnCurrency(w.amount)}
                        </strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-block mt-0.5 bangla">
                          উত্তোলন চাওয়া হয়েছে
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Box */}
                    <div className="bg-slate-50 rounded-xl p-3 text-[12px] bangla text-slate-700 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">স্কিম:</span>
                        <strong className="text-slate-800">{w.plan?.name || 'সঞ্চয় স্কিম'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">বর্তমান জমাকৃত ব্যালেন্স:</span>
                        <strong className="text-primary">{formatBnCurrency(totalBalance)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">পদ্ধতি ও হিসাব:</span>
                        <strong className="text-slate-800">{w.payment_method} {w.account_number ? `(${w.account_number})` : ''}</strong>
                      </div>
                      {w.reason && (
                        <div className="pt-1.5 border-t border-slate-200 text-slate-600 text-[11px]">
                          কারণ: {w.reason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleRejectWithdrawal(w.id)}
                        disabled={isProcessing}
                        className="py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-[12px] font-bold bangla flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        <span>বাতিল করুন</span>
                      </button>
                      <button
                        onClick={() => handleApproveWithdrawal(w.id)}
                        disabled={isProcessing}
                        className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold bangla flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} />
                        <span>{isProcessing ? 'পরিশোধ হচ্ছে...' : 'অনুমোদন ও পরিশোধ'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
