import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { useAuthStore } from '../../store/useAuthStore';
import { SomobayPlan } from '../../store/useSomobayStore';
import { getTodayLocalDate } from '../../lib/dateUtils';
import { 
  ArrowLeft, 
  ChevronDown, 
  Calendar, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Home
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserAddContribution() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [allGoals, setAllGoals] = useState<SomobayPlan[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalId || '');
  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [amount, setAmount] = useState<number | ''>(1000);
  const [paymentDate, setPaymentDate] = useState(getTodayLocalDate());
  const [paymentMethod, setPaymentMethod] = useState<'নগদ' | 'বিকাশ' | 'নগদ/রকেট' | 'ব্যাংক ট্রান্সফার'>('নগদ');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    jointGoalService.getGoals().then(goals => {
      setAllGoals(goals);
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedGoalId) {
      setLoading(true);
      jointGoalService.getGoalById(selectedGoalId).then(g => {
        setGoal(g);
        setLoading(false);
      });
    }
  }, [selectedGoalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedGoalId || !profile?.id) return;

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক অবদানের পরিমাণ লিখুন');
      return;
    }

    setSubmitting(true);
    try {
      await jointGoalService.userAddContribution({
        goalId: selectedGoalId,
        userId: profile.id,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        note
      });

      alert('আপনার অবদানের অনুরোধ সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন যাচাই করে অনুমোদন করবেন।');
      navigate(`/goals/${selectedGoalId}/my-contribution`);
    } catch (err: any) {
      setErrorMsg('অবদান জমা দিতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="অবদান করুন"
      backTo={`/goals/${selectedGoalId}`}
      showBack={true}
    >
      <div className="space-y-4 pb-12">

        {/* Goal Selector Pill Banner */}
        <div className="relative">
          <select
            value={selectedGoalId}
            onChange={(e) => {
              setSelectedGoalId(e.target.value);
              navigate(`/goals/${e.target.value}/contribute`);
            }}
            className="w-full pl-12 pr-10 py-3 bg-white border border-border rounded-2xl text-[14px] font-bold text-slate-800 bangla appearance-none outline-none shadow-sm cursor-pointer"
          >
            {allGoals.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center pointer-events-none">
            <Home size={15} />
          </div>
          <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-[13px] bangla">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Contribution Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-4.5 space-y-4 shadow-sm">
          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla">
              অবদানের পরিমাণ *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[15px] bangla">৳</span>
              <input 
                type="number"
                placeholder="যেমন: ১০,০০০"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[16px] font-bold text-slate-800 bangla outline-none focus:border-primary focus:bg-white transition-all"
                required
              />
            </div>

            {/* Quick chips */}
            <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
              {[500, 1000, 2000, 5000, 10000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold bangla whitespace-nowrap transition-all ${
                    amount === val 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ৳{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Date Field */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla">
              তারিখ *
            </label>
            <div className="relative">
              <input 
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 bangla outline-none focus:border-primary focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Payment Method Field */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla">
              পেমেন্ট মাধ্যম
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 bangla outline-none focus:border-primary focus:bg-white appearance-none cursor-pointer"
              >
                <option value="নগদ">নগদ</option>
                <option value="বিকাশ">বিকাশ</option>
                <option value="নগদ/রকেট">নগদ/রকেট</option>
                <option value="ব্যাংক ট্রান্সফার">ব্যাংক ট্রান্সফার</option>
              </select>
              <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Note Field */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 bangla">
              নোট (ঐচ্ছিক)
            </label>
            <input 
              type="text"
              placeholder="উদাহরণ: মাসিক অবদান"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 bangla outline-none focus:border-primary focus:bg-white"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-95 transition-all hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>জমা হচ্ছে...</span>
                </>
              ) : (
                <span>অবদান জমা দিন</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
