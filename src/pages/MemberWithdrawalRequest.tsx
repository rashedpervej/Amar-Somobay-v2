import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { withdrawalService, WithdrawalRequest } from '../lib/withdrawalService';
import { 
  ArrowLeft, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Send,
  Building,
  Smartphone,
  Info,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const toBn = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, d => bnDigits[Number(d)]);
};

const formatBnCurrency = (amount: number): string => {
  return '৳ ' + toBn(Math.round(amount).toLocaleString('en-IN'));
};

export default function MemberWithdrawalRequest() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { memberPlans, fetchMemberPlans } = useSomobayStore();

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('বিকাশ');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active plans for this member
  const userPlans = memberPlans.filter(mp => mp.member_id === profile?.id && mp.status === 'active');
  const selectedPlan = userPlans.find(mp => mp.id === selectedPlanId) || userPlans[0];

  useEffect(() => {
    fetchMemberPlans();
    loadWithdrawals();
  }, [profile?.id]);

  useEffect(() => {
    if (userPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(userPlans[0].id);
    }
  }, [userPlans]);

  const loadWithdrawals = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await withdrawalService.getMemberWithdrawals(profile.id);
      setWithdrawals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = Number(selectedPlan?.total_collected) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !selectedPlan) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('সঠিক উত্তোলনের পরিমাণ লিখুন।');
      return;
    }

    if (numAmount > currentBalance) {
      alert(`আপনার বর্তমান জমাকৃত ব্যালেন্স (${formatBnCurrency(currentBalance)}) এর বেশি উত্তোলন সম্ভব নয়।`);
      return;
    }

    try {
      setSubmitting(true);
      await withdrawalService.createWithdrawalRequest({
        memberId: profile.id,
        memberPlanId: selectedPlan.id,
        amount: numAmount,
        paymentMethod,
        accountNumber: accountNumber || undefined,
        reason: reason || undefined
      });

      alert('আপনার সঞ্চয় উত্তোলন আবেদন সফলভাবে পাঠানো হয়েছে! সমিতির এডমিন যাচাই করে অনুমোদন করবেন।');
      setAmount('');
      setAccountNumber('');
      setReason('');
      loadWithdrawals();
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'আবেদন সম্পন্ন করা যায়নি'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="সঞ্চয় উত্তোলন আবেদন"
      headerSubtitle="সমিতির তহবিল থেকে সঞ্চয় উত্তোলন"
      backTo="/dashboard"
      showBack={true}
    >
      <div className="space-y-4 pb-20">

        {/* Current Balance Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-900/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-emerald-100 bangla">উত্তোলনযোগ্য সঞ্চয় ব্যালেন্স</span>
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>

          <div>
            <h2 className="text-[28px] font-black bangla leading-tight">
              {formatBnCurrency(currentBalance)}
            </h2>
            <p className="text-[12px] text-emerald-100/90 bangla mt-0.5">
              স্কিম: {selectedPlan?.plan?.name || 'মাসিক সঞ্চয়'}
            </p>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-slate-800 bangla">
            নতুন উত্তোলন আবেদন করুন
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Select Scheme */}
            {userPlans.length > 1 && (
              <div>
                <label className="text-[12px] font-semibold text-slate-500 bangla block mb-1">
                  সঞ্চয় স্কিম নির্বাচন করুন
                </label>
                <div className="relative">
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-border rounded-xl text-[13px] bangla text-slate-800 outline-none appearance-none"
                  >
                    {userPlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.plan?.name} (জমা: {formatBnCurrency(p.total_collected || 0)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-semibold text-slate-500 bangla">
                  উত্তোলনের পরিমাণ (টাকা)
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance))}
                  className="text-[11px] font-bold text-primary hover:underline bangla"
                >
                  সর্বোচ্চ টাকা
                </button>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="যেমনঃ ৫,০০০"
                required
                min={100}
                max={currentBalance}
                className="w-full h-11 px-3.5 bg-slate-50 border border-border rounded-xl text-[15px] font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 bangla block mb-1">
                গ্রহণের মাধ্যম
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['বিকাশ', 'নগদ', 'অফিস ক্যাশ'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-xl text-[12px] font-bold bangla border transition-all ${
                      paymentMethod === method
                        ? 'bg-primary text-white border-primary'
                        : 'bg-slate-50 text-slate-600 border-border hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Account / Mobile Number */}
            {paymentMethod !== 'অফিস ক্যাশ' && (
              <div>
                <label className="text-[12px] font-semibold text-slate-500 bangla block mb-1">
                  {paymentMethod} নম্বর
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="যেমনঃ ০১৭০০-০০০০০০"
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-border rounded-xl text-[13px] bangla text-slate-900 outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 bangla block mb-1">
                উত্তোলনের কারণ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="যেমনঃ জরুরি ব্যক্তিগত প্রয়োজন"
                className="w-full h-11 px-3.5 bg-slate-50 border border-border rounded-xl text-[13px] bangla text-slate-900 outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || currentBalance <= 0}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary-dark text-white text-[14px] font-bold bangla flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Send size={16} />
              <span>{submitting ? 'পাঠানো হচ্ছে...' : 'আবেদন জমা দিন'}</span>
            </button>
          </form>
        </div>

        {/* Withdrawal History */}
        <div className="space-y-2.5">
          <h3 className="text-[14px] font-bold text-slate-800 bangla px-1">
            পূর্ববর্তী উত্তোলন আবেদনসমূহ
          </h3>

          {withdrawals.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200 p-4">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="text-slate-400 text-[12px] bangla">কোনো পূর্ববর্তী আবেদন নেই</p>
            </div>
          ) : (
            withdrawals.map((w) => {
              const isPending = w.status === 'pending';
              const isApproved = w.status === 'approved';

              return (
                <div
                  key={w.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 ${
                      isApproved 
                        ? 'bg-emerald-50 text-primary' 
                        : isPending 
                          ? 'bg-amber-50 text-amber-600' 
                          : 'bg-rose-50 text-rose-600'
                    }`}>
                      <Wallet size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-bold text-slate-900 bangla leading-tight truncate">
                        {formatBnCurrency(w.amount)}
                      </h4>
                      <span className="text-[11px] text-slate-400 bangla block mt-0.5">
                        {w.payment_method} • {new Date(w.created_at).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold bangla border shrink-0 ${
                    isApproved
                      ? 'bg-emerald-50 text-primary border-emerald-200'
                      : isPending
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {isApproved ? 'পরিশোধিত' : isPending ? 'পেন্ডিং' : 'বাতিল'}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </MobileLayout>
  );
}
