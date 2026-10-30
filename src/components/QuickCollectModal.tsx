import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  User, 
  HandCoins, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Calendar,
  Receipt
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ReceiptData } from './ReceiptModal';

interface QuickCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedMemberId?: string | null;
  onPaymentSuccess?: (receipt: ReceiptData) => void;
}

export const QuickCollectModal: React.FC<QuickCollectModalProps> = ({
  isOpen,
  onClose,
  preSelectedMemberId,
  onPaymentSuccess
}) => {
  const { profile: adminProfile } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  const [memberPlans, setMemberPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
  const [includePenalty, setIncludePenalty] = useState<boolean>(true);
  const [note, setNote] = useState<string>('নগদ কিস্তি আদায়');
  
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch initial members
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (preSelectedMemberId) {
        fetchSpecificMember(preSelectedMemberId);
      } else {
        fetchMembers('');
      }
    } else {
      // Reset state when closed
      setSelectedMember(null);
      setMemberPlans([]);
      setSelectedPlanId('');
      setSearchTerm('');
    }
  }, [isOpen, preSelectedMemberId]);

  const fetchSpecificMember = async (id: string) => {
    setLoadingMembers(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .eq('id', id)
        .single();
      if (data) {
        setSelectedMember(data);
        fetchMemberActivePlans(data.id);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchMembers = async (search: string) => {
    setLoadingMembers(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .eq('role', 'member')
        .limit(10);

      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data } = await query;
      setMembers(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchMemberActivePlans = async (memberId: string) => {
    setLoadingPlans(true);
    try {
      const { data } = await supabase
        .from('member_plans')
        .select(`
          id,
          plan_id,
          status,
          total_collected,
          pending_fine,
          next_due_date,
          plan:somobay_plans(id, name, installment_amount, frequency, scheme_type, duration_months)
        `)
        .eq('member_id', memberId)
        .eq('status', 'active');

      const activePlans = data || [];
      setMemberPlans(activePlans);

      if (activePlans.length > 0) {
        // Auto-select first plan
        const first = activePlans[0];
        const planObj = (Array.isArray(first.plan) ? first.plan[0] : first.plan) as any;
        setSelectedPlanId(first.id);
        setInstallmentAmount(planObj?.installment_amount || 0);
        setPenaltyAmount(first.pending_fine || 0);
      } else {
        setSelectedPlanId('');
        setInstallmentAmount(0);
        setPenaltyAmount(0);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectMember = (m: any) => {
    setSelectedMember(m);
    fetchMemberActivePlans(m.id);
  };

  const handleSelectPlan = (mpId: string) => {
    setSelectedPlanId(mpId);
    const mp = memberPlans.find(p => p.id === mpId);
    if (mp) {
      const planObj = (Array.isArray(mp.plan) ? mp.plan[0] : mp.plan) as any;
      setInstallmentAmount(planObj?.installment_amount || 0);
      setPenaltyAmount(mp.pending_fine || 0);
    }
  };

  const activeMemberPlan = memberPlans.find(p => p.id === selectedPlanId);
  const totalDueAmount = installmentAmount + (includePenalty ? penaltyAmount : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !activeMemberPlan || installmentAmount <= 0) {
      setErrorMsg('সদস্য, সমিতি এবং কিস্তির পরিমাণ সঠিকভাবে পূরণ করুন।');
      return;
    }

    if (submitting) return; // Prevent double submit
    setSubmitting(true);
    setErrorMsg('');

    try {
      const activeOrgId = adminProfile?.id ? (useAuthStore.getState().activeOrganizationId || '00000000-0000-0000-0000-000000000001') : '00000000-0000-0000-0000-000000000001';
      
      const { data: newPayment, error: payError } = await supabase
        .from('plan_payments')
        .insert([{
          organization_id: activeOrgId,
          member_plan_id: activeMemberPlan.id,
          amount: installmentAmount,
          penalty_paid: 0, // No fine or penalty in General Cooperative
          admin_id: adminProfile?.id,
          note: note || 'নগদ কিস্তি আদায়',
          status: 'approved',
          type: 'installment',
          payment_date: new Date().toISOString()
        }])
        .select('id, created_at')
        .single();

      if (payError) throw payError;

      const activePlanObj = (Array.isArray(activeMemberPlan.plan) ? activeMemberPlan.plan[0] : activeMemberPlan.plan) as any;

      // Send member in-app notification
      await supabase.from('notifications').insert([{
        organization_id: activeOrgId,
        user_id: selectedMember.id,
        title: 'কিস্তি জমা গ্রহণ সফল',
        message: `আপনার "${activePlanObj?.name || 'সমিতি'}" সমিতিতে ৳${installmentAmount.toLocaleString()} নগদ জমা গ্রহণ করা হয়েছে।`,
        type: 'success',
        source_module: 'plan'
      }]);

      const trxId = newPayment?.id ? newPayment.id.substring(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();

      const receipt: ReceiptData = {
        transactionId: trxId,
        memberName: selectedMember.full_name || 'সদস্য',
        memberPhone: selectedMember.phone,
        planName: activePlanObj?.name || 'সমিতি',
        schemeType: activePlanObj?.scheme_type,
        amount: installmentAmount,
        penaltyPaid: includePenalty ? penaltyAmount : 0,
        totalCollected: totalDueAmount,
        adminName: adminProfile?.full_name || 'এডমিন',
        paymentDate: new Date().toISOString(),
        nextDueDate: activeMemberPlan.next_due_date,
        note: note
      };

      onClose();
      if (onPaymentSuccess) {
        onPaymentSuccess(receipt);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'কিস্তি জমা করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-[440px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0f172a] rounded-t-[32px] sm:rounded-[32px] shadow-2xl border-t sm:border border-slate-100 dark:border-white/10 flex flex-col pb-6 sm:pb-2"
        >
          {/* Mobile Drag Pill */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <HandCoins size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white bangla leading-tight">
                  দ্রুত কিস্তি গ্রহণ
                </h2>
                <span className="text-[11px] text-slate-400 bangla">সরাসরি নগদ জমা ও তাৎক্ষণিক রসিদ</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-center gap-2 bangla">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Member Selection */}
            {!selectedMember ? (
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 bangla">
                  সদস্য খুঁজুন (নাম বা মোবাইল নম্বর)
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="সদস্যের নাম বা নম্বর লিখুন..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      fetchMembers(e.target.value);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm bangla outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                </div>

                {loadingMembers ? (
                  <div className="flex justify-center p-6 text-slate-400">
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mt-1">
                    {members.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-left transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {m.full_name?.charAt(0) || 'স'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 bangla leading-none">
                              {m.full_name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              {m.phone || 'মোবাইল নেই'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bangla">নির্বাচন</span>
                      </button>
                    ))}
                    {members.length === 0 && (
                      <p className="text-center text-xs text-slate-400 bangla py-4">কোনো সদস্য পাওয়া যায়নি</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Member Card */
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedMember.full_name?.charAt(0) || 'স'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 bangla leading-tight">
                      {selectedMember.full_name}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedMember.phone || 'সদস্য আইডি: ' + selectedMember.id.substring(0, 6)}
                    </span>
                  </div>
                </div>
                {!preSelectedMemberId && (
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 bangla underline"
                  >
                    বদলান
                  </button>
                )}
              </div>
            )}

            {/* 2. Scheme & Payment Form */}
            {selectedMember && (
              loadingPlans ? (
                <div className="flex justify-center p-8">
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                </div>
              ) : memberPlans.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2">
                  <AlertCircle size={24} className="text-amber-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 bangla font-medium">
                    এই সদস্য বর্তমানে কোনো সক্রিয় সমিতিতে নিবন্ধিত নন।
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Scheme selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 bangla">
                      সমিতি নির্বাচন করুন
                    </label>
                    <div className="flex flex-col gap-2">
                      {memberPlans.map((mp: any) => {
                        const pInfo = (Array.isArray(mp.plan) ? mp.plan[0] : mp.plan) as any;
                        return (
                          <label
                            key={mp.id}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedPlanId === mp.id
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-600'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="selectedPlan"
                                checked={selectedPlanId === mp.id}
                                onChange={() => handleSelectPlan(mp.id)}
                                className="accent-emerald-600"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 bangla">
                                  {pInfo?.name}
                                </p>
                                <span className="text-[10px] text-slate-400 bangla">
                                  নির্ধারিত কিস্তি: ৳{Number(pInfo?.installment_amount || 0).toLocaleString()} /{pInfo?.frequency === 'weekly' ? 'সপ্তাহ' : 'মাস'}
                                </span>
                              </div>
                            </div>
                            {Boolean(mp.pending_fine && mp.pending_fine > 0) && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold bangla">
                                বকেয়া জরিমানা ৳{mp.pending_fine}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bangla">
                        কিস্তির পরিমাণ (টাকা) *
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={installmentAmount || ''}
                        onChange={(e) => setInstallmentAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-base font-black text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bangla">
                        বিলম্ব জরিমানা (যদি থাকে)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={penaltyAmount || ''}
                        onChange={(e) => setPenaltyAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-base font-black text-rose-500 outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {penaltyAmount > 0 && (
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none bangla">
                      <input
                        type="checkbox"
                        checked={includePenalty}
                        onChange={(e) => setIncludePenalty(e.target.checked)}
                        className="accent-emerald-600 w-4 h-4 rounded"
                      />
                      <span>জরিমানা সহ মোট টাকা একসাথে জমা নেবেন</span>
                    </label>
                  )}

                  {/* Summary Box */}
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 bangla font-medium">সর্বমোট নগদ গ্রহণ</span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 bangla leading-none mt-0.5">
                        ৳{totalDueAmount.toLocaleString('bn-BD')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 bangla">পেমেন্ট মেথড</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 bangla mt-0.5">নগদ (Cash)</p>
                    </div>
                  </div>

                  {/* Submit Button with debounce lock */}
                  <button
                    type="submit"
                    disabled={submitting || totalDueAmount <= 0}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 bangla"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>জমা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Receipt size={18} />
                        <span>৳{totalDueAmount.toLocaleString('bn-BD')} নগদ আদায় নিশ্চিত করুন</span>
                      </>
                    )}
                  </button>
                </form>
              )
            )}
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
