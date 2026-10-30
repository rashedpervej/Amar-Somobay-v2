import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { ReceiptModal, ReceiptData } from '../components/ReceiptModal';
import { 
  ArrowLeft, 
  HandCoins, 
  CreditCard, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Building2,
  Smartphone,
  Coins,
  Zap,
  Send,
  Banknote,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SingleDeposit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramMemberId = searchParams.get('memberId');
  const { profile, activeOrganization } = useAuthStore();
  const { memberPlans, fetchMemberPlans } = useSomobayStore();

  const isAdmin = profile?.role === 'admin';
  const targetMemberId = (!isAdmin && profile?.id) ? profile.id : (paramMemberId || profile?.id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [fine, setFine] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bkash');
  const [trxId, setTrxId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (targetMemberId) {
      fetchMemberPlans(targetMemberId);
    }
  }, [targetMemberId, fetchMemberPlans]);

  const activePlans = memberPlans.filter((mp: any) => mp.status === 'active');

  useEffect(() => {
    if (activePlans.length > 0 && !selectedPlanId) {
      const first = activePlans[0];
      setSelectedPlanId(first.id);
      setAmount(Number(first.plan?.installment_amount || 0));
      setFine(Number(first.pending_fine || 0));
    }
  }, [activePlans, selectedPlanId]);

  const selectedPlan = activePlans.find((mp: any) => mp.id === selectedPlanId) || activePlans[0];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const chosen = activePlans.find((mp: any) => mp.id === planId);
    if (chosen) {
      setAmount(Number(chosen.plan?.installment_amount || 0));
      setFine(Number(chosen.pending_fine || 0));
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      setErrorMsg('অনুগ্রহ করে একটি প্ল্যান নির্বাচন করুন।');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('সঠিক কিস্তির পরিমাণ লিখুন।');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const totalPaid = amount + fine;
      const paymentStatus = isAdmin ? 'approved' : 'pending';
      const { data: newPayment, error: payError } = await supabase
        .from('plan_payments')
        .insert([{
          member_plan_id: selectedPlan.id,
          amount: amount,
          penalty_paid: fine,
          admin_id: isAdmin ? profile?.id : null,
          note: `${paymentMethod.toUpperCase()} কিস্তি পরিশোধ ${trxId ? `(Trx: ${trxId})` : ''} ${note}`.trim(),
          status: paymentStatus,
          type: 'installment',
          payment_date: new Date().toISOString()
        }])
        .select('id, created_at')
        .single();

      if (payError) throw payError;

      // In-app notification
      await supabase.from('notifications').insert([{
        user_id: targetMemberId,
        organization_id: (selectedPlan as any)?.plan?.organization_id || (selectedPlan as any)?.organization_id || null,
        title: isAdmin ? 'কিস্তি পরিশোধ সফল' : 'কিস্তি জমার অনুরোধ জমা হয়েছে',
        message: isAdmin 
          ? `আপনার "${selectedPlan.plan?.name || 'সমিতি'}" সমিতিতে ৳${totalPaid.toLocaleString()} কিস্তি জমা সম্পন্ন হয়েছে।`
          : `আপনার "${selectedPlan.plan?.name || 'সমিতি'}" সমিতিতে ৳${totalPaid.toLocaleString()} কিস্তি জমার অনুরোধ গ্রহণ করা হয়েছে। অ্যাডমিন যাচাই করে অনুমোদন করবেন।`,
        type: 'success',
        source_module: 'plan'
      }]);

      const txId = newPayment?.id ? newPayment.id.substring(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const receipt: ReceiptData = {
        transactionId: txId,
        memberName: profile?.full_name || 'সদস্য',
        memberPhone: profile?.phone,
        planName: selectedPlan.plan?.name || 'সমিতি',
        schemeType: selectedPlan.plan?.scheme_type,
        amount: amount,
        penaltyPaid: fine,
        totalCollected: totalPaid,
        adminName: isAdmin ? (profile?.full_name || 'এডমিন') : 'ডিজিটাল পরিশোধ',
        paymentDate: new Date().toISOString(),
        nextDueDate: selectedPlan.next_due_date,
        note: `পেমেন্ট মাধ্যম: ${paymentMethod.toUpperCase()}`
      };

      setReceiptData(receipt);
    } catch (err: any) {
      setErrorMsg(err.message || 'পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { id: 'bkash', name: 'বিকাশ (bKash)', color: 'border-pink-500 text-pink-600 bg-pink-50/50', icon: Smartphone },
    { id: 'nagad', name: 'নগদ (Nagad)', color: 'border-orange-500 text-orange-600 bg-orange-50/50', icon: Zap },
    { id: 'rocket', name: 'রকেট (Rocket)', color: 'border-purple-500 text-purple-600 bg-purple-50/50', icon: Send },
    { id: 'bank', name: 'ব্যাংক ট্রান্সফার', color: 'border-blue-500 text-blue-600 bg-blue-50/50', icon: Building2 },
    { id: 'cash', name: 'নগদ ক্যাশ জমা', color: 'border-emerald-500 text-emerald-600 bg-emerald-50/50', icon: Banknote },
  ];

  return (
    <MobileLayout
      headerTitle="কিস্তি পরিশোধ"
      showBack={true}
    >
      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-700 text-[13px] rounded-xl border border-rose-200 flex items-center gap-2 bangla mb-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick link to withdrawal */}
      <div className="mb-3 px-3.5 py-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between text-[12.5px] bangla">
        <span className="text-amber-900 font-medium">সঞ্চয় তহবিল থেকে টাকা উত্তোলন করতে চান?</span>
        <button
          type="button"
          onClick={() => navigate('/savings/withdraw')}
          className="text-amber-800 font-bold hover:underline shrink-0 ml-2"
        >
          উত্তোলন আবেদন →
        </button>
      </div>

      {/* Due / Selected Plan Card (Reference Screen 6) */}
      {selectedPlan ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3.5 flex flex-col gap-2.5"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 bangla uppercase tracking-wider">চলমান কিস্তি</span>
              <h2 className="text-[17px] font-bold text-slate-800 bangla leading-tight mt-0.5">{selectedPlan.plan?.name}</h2>
              <span className="text-[12px] text-slate-400 bangla mt-0.5 block">
                {selectedPlan.plan?.frequency === 'weekly' ? 'সাপ্তাহিক কিস্তি' : 'মাসিক কিস্তি'} • {selectedPlan.plan?.duration_months} মাস
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 bangla">নির্ধারিত তারিখ</span>
              <div className="text-[13px] font-semibold text-slate-700 bangla mt-0.5">
                {selectedPlan.next_due_date ? new Date(selectedPlan.next_due_date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : 'নির্ধারিত নেই'}
              </div>
            </div>
          </div>

          {/* Multiple plans switcher if user has more than 1 plan */}
          {activePlans.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none border-t border-slate-100 pt-2">
              {activePlans.map(mp => (
                <button
                  key={mp.id}
                  onClick={() => handleSelectPlan(mp.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold bangla whitespace-nowrap transition-all border ${
                    selectedPlanId === mp.id 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-slate-50 text-slate-600 border-border'
                  }`}
                >
                  {mp.plan?.name}
                </button>
              ))}
            </div>
          )}

          {/* Due highlight row */}
          <div className="p-3 bg-primary-light rounded-xl flex items-center justify-between">
            <span className="text-[13px] font-semibold text-primary bangla">প্রদেয় কিস্তি</span>
            <div className="text-right">
              <span className="text-[20px] font-bold text-primary bangla">
                ৳{(amount + fine).toLocaleString('bn-BD')}
              </span>
              {fine > 0 && (
                <span className="text-[10px] text-rose-600 bangla block font-medium">
                  (জরিমানা ৳{fine.toLocaleString('bn-BD')} সহ)
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-6 text-center text-slate-400 bangla bg-white rounded-[16px] border border-dashed border-border mb-3">
          কোনো সক্রিয় কিস্তি প্ল্যান পাওয়া যায়নি
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handlePayment} className="flex flex-col gap-3.5">
        {/* Payment Method Selector (Reference Screen 6) */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-slate-700 bangla">পেমেন্ট মাধ্যম নির্বাচন করুন</label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map(method => (
              <button
                type="button"
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === method.id
                    ? `${method.color} border-2 shadow-sm font-semibold`
                    : 'bg-white border-border text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                  <method.icon size={16} />
                </div>
                <span className="text-[12px] bangla">{method.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Account Details & Copy Helper */}
        {['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-[12px] bangla">
            <div>
              <span className="text-slate-500 block text-[11px]">
                {paymentMethod === 'bkash' ? 'বিকাশ পার্সোনাল / মার্চেন্ট নম্বর:' : paymentMethod === 'nagad' ? 'নগদ পার্সোনাল / মার্চেন্ট নম্বর:' : 'রকেট অ্যাকাউন্ট নম্বর:'}
              </span>
              <strong className="text-[14px] text-slate-800 tracking-wide font-mono">
                {(activeOrganization as any)?.phone || '01700000000'}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => {
                const num = (activeOrganization as any)?.phone || '01700000000';
                navigator.clipboard.writeText(num);
                setCopiedNumber(true);
                setTimeout(() => setCopiedNumber(false), 2000);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-primary text-slate-700 hover:text-primary rounded-xl font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              {copiedNumber ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>নম্বর কপি</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Amount Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-slate-700 bangla">কিস্তির পরিমাণ (টাকা)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="পরিমাণ লিখুন"
              className="w-full bg-white border border-border rounded-xl pl-9 pr-3.5 py-3 text-[16px] font-bold bangla text-slate-800 outline-none focus:border-primary"
              required
            />
          </div>
        </div>

        {/* TrxID / Ref Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-slate-700 bangla">ট্রানজেকশন আইডি / রেফারেন্স (ঐচ্ছিক)</label>
          <input
            type="text"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            placeholder="যেমন: TRX98273618 বা নগদ জমা"
            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-[13px] bangla text-slate-800 outline-none focus:border-primary"
          />
        </div>

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={submitting || !selectedPlan}
          className="w-full mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3.5 px-4 rounded-[16px] font-semibold text-[15px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <span>এখনি পরিশোধ করুন</span>
              <span>→</span>
            </>
          )}
        </button>
      </form>

      {/* Shareable Receipt Voucher Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => {
          setReceiptData(null);
          navigate('/savings');
        }}
        data={receiptData}
      />
    </MobileLayout>
  );
}
