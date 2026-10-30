import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getTodayLocalDate } from '../../lib/dateUtils';
import { 
  ArrowLeft, 
  Target, 
  CreditCard, 
  Calendar, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User,
  Wallet,
  Building,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AddContribution() {
  const { id: goalId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preSelectedMemberPlanId = searchParams.get('memberPlanId') || '';
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [members, setMembers] = useState<MemberPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [memberPlanId, setMemberPlanId] = useState(preSelectedMemberPlanId);
  const [amount, setAmount] = useState<number | ''>(1000);
  const [paymentDate, setPaymentDate] = useState(getTodayLocalDate());
  const [paymentMethod, setPaymentMethod] = useState<'নগদ' | 'বিকাশ' | 'নগদ/রকেট' | 'ব্যাংক ট্রান্সফার'>('নগদ');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  useEffect(() => {
    const load = async () => {
      if (!goalId) return;
      setLoading(true);
      try {
        const g = await jointGoalService.getGoalById(goalId);
        setGoal(g);

        const mems = await jointGoalService.getEnrolledMembers(goalId);
        setMembers(mems);

        if (preSelectedMemberPlanId) {
          setMemberPlanId(preSelectedMemberPlanId);
        } else if (mems.length > 0) {
          setMemberPlanId(mems[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goalId, preSelectedMemberPlanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!memberPlanId) {
      setErrorMsg('অনুগ্রহ করে একজন সদস্য নির্বাচন করুন');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('অবদানের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে');
      return;
    }

    setSubmitting(true);
    try {
      await jointGoalService.addContribution({
        goalId: goalId!,
        memberPlanId,
        amount: Number(amount),
        adminId: user?.id || 'admin',
        paymentDate,
        paymentMethod,
        note
      });

      alert('অবদান সফলভাবে যুক্ত করা হয়েছে!');
      navigate(`/joint-goals/${goalId}`);
    } catch (err: any) {
      setErrorMsg('অবদান যুক্ত করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      headerTitle="অবদান জমা দিন"
      headerSubtitle={goal?.name || 'যৌথ সঞ্চয় লক্ষ্য'}
      backTo={`/joint-goals/${goalId}`}
      showBack={true}
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Goal Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 bangla">যৌথ সঞ্চয় লক্ষ্য</span>
            <h3 className="text-[15px] font-black text-emerald-950 bangla">{goal?.name}</h3>
            <p className="text-[12px] text-emerald-700 bangla">
              লক্ষ্যমাত্রা: ৳{(goal?.target_amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
            <Target size={24} />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-[13px] bangla">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-4.5 space-y-4 shadow-sm">
          {/* Member Picker */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <User size={15} className="text-primary" />
              <span>সদস্য নির্বাচন করুন *</span>
            </label>
            {members.length > 0 ? (
              <select
                value={memberPlanId}
                onChange={(e) => setMemberPlanId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
              >
                {members.map((m) => {
                  const p = (m as any).profile;
                  return (
                    <option key={m.id} value={m.id}>
                      {p?.full_name || 'সদস্য'} ({p?.phone || 'ফোন নেই'})
                    </option>
                  );
                })}
              </select>
            ) : (
              <p className="text-[12px] text-rose-600 bangla">
                এই লক্ষ্যে কোনো সদস্য নেই। আগে সদস্য যুক্ত করুন।
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <DollarSign size={15} className="text-primary" />
              <span>অবদানের পরিমাণ (৳) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[16px] bangla">৳</span>
              <input 
                type="number"
                placeholder="যেমন: ১০০০"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[16px] font-bold text-slate-800 bangla outline-none focus:border-primary focus:bg-white transition-all"
                required
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-bold bangla transition-all ${
                    amount === q 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ৳{q.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <Calendar size={15} className="text-primary" />
              <span>জমার তারিখ *</span>
            </label>
            <input 
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
              required
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <CreditCard size={15} className="text-primary" />
              <span>পেমেন্ট মাধ্যম *</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'নগদ', label: 'নগদ (Cash)', icon: <Wallet size={16} /> },
                { id: 'বিকাশ', label: 'বিকাশ (bKash)', icon: <Smartphone size={16} /> },
                { id: 'নগদ/রকেট', label: 'নগদ/রকেট', icon: <Smartphone size={16} /> },
                { id: 'ব্যাংক ট্রান্সফার', label: 'ব্যাংক ট্রান্সফার', icon: <Building size={16} /> }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-2.5 rounded-xl border text-[12px] font-bold bangla flex items-center gap-2 transition-all ${
                    paymentMethod === m.id 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' 
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={paymentMethod === m.id ? 'text-emerald-700' : 'text-slate-400'}>
                    {m.icon}
                  </span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note / Memo */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <FileText size={15} className="text-primary" />
              <span>নোট বা রেফারেন্স (ঐচ্ছিক)</span>
            </label>
            <input 
              type="text"
              placeholder="ট্রানজেকশন আইডি বা মন্তব্য"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || members.length === 0}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-95 transition-all hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>অবদান নিশ্চিত করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
