import React, { useState, useEffect } from 'react';
import { SomobayPlan, MemberPlan, JointGoalExpense, useSomobayStore } from '../../store/useSomobayStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  TrendingUp, 
  Receipt, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign,
  PiggyBank,
  X
} from 'lucide-react';

interface JointGoalManagerProps {
  plan: SomobayPlan;
  enrolledMembers: MemberPlan[];
  totalCollected: number;
  onRefresh?: () => void;
}

export const JointGoalManager: React.FC<JointGoalManagerProps> = ({ 
  plan, 
  enrolledMembers, 
  totalCollected,
  onRefresh 
}) => {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { fetchGoalExpenses, recordGoalExpense } = useSomobayStore();

  const [expenses, setExpenses] = useState<JointGoalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    spent_by: '',
    note: ''
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await fetchGoalExpenses(plan.id);
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [plan.id]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const remainingFund = Math.max(0, totalCollected - totalSpent);
  const targetAmount = plan.target_amount || 0;
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalCollected / targetAmount) * 100)) : 0;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (!formData.title.trim()) {
      alert('ব্যয়ের খাত বা শিরোনাম লিখুন।');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      alert('সঠিক টাকার পরিমাণ দিন।');
      return;
    }
    if (amountNum > remainingFund) {
      if (!confirm(`সতর্কতা: বর্তমান তহবিলে আছে ৳${remainingFund.toLocaleString()}, কিন্তু ব্যয় চাওয়া হচ্ছে ৳${amountNum.toLocaleString()}। আপনি কি তবুও জমা দিতে চান?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      await recordGoalExpense({
        plan_id: plan.id,
        title: formData.title.trim(),
        amount: amountNum,
        expense_date: formData.expense_date,
        spent_by: formData.spent_by || profile?.full_name || 'এডমিন',
        approved_by: profile?.id,
        note: formData.note
      });

      setShowAddExpense(false);
      setFormData({
        title: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        spent_by: '',
        note: ''
      });
      await loadExpenses();
      if (onRefresh) onRefresh();
      alert('যৌথ তহবিলের ব্যয় সফলভাবে রেকর্ড করা হয়েছে!');
    } catch (err: any) {
      alert('ব্যয় সংরক্ষণ করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Collective Target Progress Card */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-200 bangla bg-white/10 px-3 py-1 rounded-full">
                <Target size={12} /> Joint Goal / যৌথ সঞ্চয় তহবিল
              </span>
              <h3 className="text-[22px] font-black bangla mt-2">
                তহবিল লক্ষ্য: ৳{targetAmount.toLocaleString()}
              </h3>
              <p className="text-[12px] text-blue-200/80 bangla mt-0.5">
                {plan.description || 'নির্দিষ্ট যৌথ উদ্দেশ্য পূরণের লক্ষ্যে সংগৃহীত কমন ফান্ড'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-300">
              <Target size={26} />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="my-4 space-y-1.5">
            <div className="flex justify-between items-center text-[12px] font-bold bangla text-blue-200">
              <span>অর্জিত অগ্রগতি</span>
              <span className="text-cyan-300 font-black">{progressPercent}%</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-center">
              <span className="text-[10px] text-blue-200 bangla block font-medium">মোট জমা ফান্ড</span>
              <span className="text-[16px] font-bold bangla text-white">
                ৳{totalCollected.toLocaleString()}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-center">
              <span className="text-[10px] text-blue-200 bangla block font-medium">মোট যৌথ ব্যয়</span>
              <span className="text-[16px] font-bold bangla text-rose-300">
                ৳{totalSpent.toLocaleString()}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-center">
              <span className="text-[10px] text-blue-200 bangla block font-medium">অবশিষ্ট তহবিল</span>
              <span className="text-[16px] font-bold bangla text-emerald-300">
                ৳{remainingFund.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collective Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
          <Target size={18} />
        </div>
        <div className="text-[12px] bangla text-blue-900 dark:text-blue-200 leading-relaxed">
          <p className="font-bold mb-0.5">যৌথ সঞ্চয় / কমন ফান্ড নিয়মাবলি:</p>
          <p className="text-blue-700 dark:text-blue-300">
            এটি একটি সমন্বিত সাধারণ ফান্ড। এখানে কোনো একক সদস্যের ব্যক্তিগত উত্তোলন নেই; অর্জিত তহবিল সম্পূর্ণ সমবায়ের সম্মিলিত সিদ্ধান্ত ও অনুমোদিত ব্যয় নির্বাহের কাজে ব্যবহৃত হয়।
          </p>
        </div>
      </div>

      {/* Action Button: Add Expense */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla">
            যৌথ তহবিলের খরচ পরিচালনা
          </h4>
          <p className="text-[12px] text-slate-400 bangla">
            কমন ফান্ড থেকে কোনো ব্যয় বা ক্রয় করা হলে হিসাব রাখুন
          </p>
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold bangla text-[13px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>ব্যয় যোগ করুন</span>
        </button>
      </div>

      {/* Expenses History */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={18} className="text-blue-500" />
          <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">
            তহবিল থেকে খরচের খতিয়ান ({expenses.length}টি)
          </h4>
        </div>

        {expenses.length === 0 ? (
          <p className="text-[13px] text-slate-400 bangla text-center py-6">
            এখনো যৌথ তহবিল থেকে কোনো খরচ রেকর্ড করা হয়নি।
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center font-bold">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h5 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 bangla">
                      {exp.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 bangla mt-0.5">
                      <span>ব্যয়কারী: {exp.spent_by || 'এডমিন'}</span>
                      <span>•</span>
                      <span>{new Date(exp.expense_date).toLocaleDateString('bn-BD')}</span>
                    </div>
                    {exp.note && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 bangla italic block mt-0.5">
                        নোট: {exp.note}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[15px] font-black text-rose-500 bangla">
                    -৳{Number(exp.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Contributions Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <PiggyBank size={18} className="text-emerald-500" />
          <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">
            সদস্যদের অবদানের অনুপাত ({enrolledMembers.length} জন)
          </h4>
        </div>

        <div className="space-y-2">
          {enrolledMembers.map((m) => {
            const memberShare = totalCollected > 0 ? Math.round((m.total_collected / totalCollected) * 100) : 0;
            return (
              <div 
                key={m.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xs bangla">
                    {m.profile?.full_name?.charAt(0) || 'স'}
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 bangla block">
                      {m.profile?.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400 bangla">
                      মোট জমা: ৳{m.total_collected.toLocaleString()} ({memberShare}% অবদান)
                    </span>
                  </div>
                </div>
                <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 bangla">
                  ৳{m.total_collected.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddExpense(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[32px] p-6 relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[18px] font-black text-slate-800 dark:text-slate-100 bangla">
                  যৌথ তহবিল থেকে ব্যয় যোগ করুন
                </h3>
                <button
                  onClick={() => setShowAddExpense(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">ব্যয়ের খাত বা শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমনঃ অনুষ্ঠান বাবদ সরঞ্জাম ক্রয়"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[14px]"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    placeholder="যেমনঃ ৫০০০"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[15px]"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 bangla ml-1">
                    বর্তমান অবশিষ্ট তহবিল: ৳{remainingFund.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">খরচের তারিখ</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[14px]"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">কার মাধ্যমে ব্যয় হয়েছে</label>
                  <input
                    type="text"
                    placeholder="যেমনঃ সভাপতি / কোষাধ্যক্ষ"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[14px]"
                    value={formData.spent_by}
                    onChange={(e) => setFormData({ ...formData, spent_by: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">নোট বা রশিদ বিবরণ</label>
                  <textarea
                    rows={2}
                    placeholder="ঐচ্ছিক অতিরিক্ত বিবরণ..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[13px]"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold bangla text-[15px] shadow-lg shadow-blue-600/20 active:scale-95 transition-all mt-4"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'ব্যয় রেকর্ড সম্পন্ন করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
