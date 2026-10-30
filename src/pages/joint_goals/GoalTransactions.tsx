import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { SomobayPlan, JointGoalExpense } from '../../store/useSomobayStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getTodayLocalDate } from '../../lib/dateUtils';
import { 
  ArrowLeft, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Calendar, 
  Loader2, 
  X, 
  Trash2, 
  Receipt, 
  FileText,
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GoalTransactions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<JointGoalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'inflow' | 'outflow'>('all');

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(getTodayLocalDate());
  const [spentBy, setSpentBy] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const g = await jointGoalService.getGoalById(id);
      setGoal(g);

      const [conts, exps] = await Promise.all([
        jointGoalService.getContributions(id),
        jointGoalService.getExpenses(id)
      ]);

      setContributions(conts);
      setExpenses(exps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!expenseTitle.trim()) {
      setModalError('খরচের শিরোনাম প্রদান করুন');
      return;
    }

    if (!expenseAmount || Number(expenseAmount) <= 0) {
      setModalError('সঠিক পরিমাণ উল্লেখ করুন');
      return;
    }

    setSavingExpense(true);
    try {
      await jointGoalService.addExpense({
        plan_id: id!,
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        expense_date: expenseDate,
        spent_by: spentBy.trim() || undefined,
        approved_by: profile?.full_name || 'এডমিন',
        note: expenseNote.trim() || undefined
      });

      setShowExpenseModal(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setSpentBy('');
      setExpenseNote('');
      await loadData();
    } catch (err: any) {
      setModalError('খরচ সংরক্ষণ করতে ব্যর্থ: ' + (err.message || ''));
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const confirm = window.confirm('আপনি কি এই খরচের এন্ট্রিটি মুছে ফেলতে চান?');
    if (!confirm) return;

    try {
      await jointGoalService.deleteExpense(expenseId);
      await loadData();
    } catch (err: any) {
      alert('ব্যয় মুছে ফেলতে সমস্যা হয়েছে: ' + (err.message || ''));
    }
  };

  if (loading || !goal) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">লেনদেন লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  const totalInflow = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalOutflow = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netBalance = Math.max(0, totalInflow - totalOutflow);

  // Combine inflow and outflow into unified list
  interface UnifiedTx {
    id: string;
    type: 'inflow' | 'outflow';
    date: string;
    title: string;
    subtitle: string;
    amount: number;
    raw: any;
  }

  const unifiedList: UnifiedTx[] = [
    ...contributions.map(c => ({
      id: `in-${c.id}`,
      type: 'inflow' as const,
      date: c.payment_date || '',
      title: c.member?.full_name || 'সদস্য অবদান',
      subtitle: c.note || 'অনুমোদিত অবদান',
      amount: Number(c.amount) || 0,
      raw: c
    })),
    ...expenses.map(e => ({
      id: `out-${e.id}`,
      type: 'outflow' as const,
      date: e.expense_date,
      title: e.title,
      subtitle: e.spent_by ? `ব্যয় করেছেন: ${e.spent_by}` : (e.note || 'তহবিল ব্যয়'),
      amount: Number(e.amount) || 0,
      raw: e
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTxs = unifiedList.filter(tx => {
    if (filterType === 'inflow') return tx.type === 'inflow';
    if (filterType === 'outflow') return tx.type === 'outflow';
    return true;
  });

  return (
    <MobileLayout
      headerTitle="তহবিল লেনদেন ও খরচ"
      headerSubtitle={goal.name}
      backTo={`/joint-goals/${id}`}
      showBack={true}
      headerRight={
        <button
          onClick={() => setShowExpenseModal(true)}
          className="h-11 min-h-[44px] px-2 flex items-center gap-1 text-white text-[13px] font-bold bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
          title="নতুন খরচ"
        >
          <Plus size={18} strokeWidth={2.6} />
          <span>খরচ</span>
        </button>
      }
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Balance Overview Card */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <span className="text-[11px] font-bold text-slate-500 bangla uppercase tracking-wider block">
            তহবিল স্থিতি ও লেনদেন চিত্র
          </span>

          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 font-bold bangla">অবশিষ্ট নীট তহবিল</span>
              <div className="text-[22px] font-black text-emerald-800 bangla leading-tight mt-0.5">
                ৳{netBalance.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/90 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
              <Wallet size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold bangla">
                <TrendingUp size={14} />
                <span>মোট জমা (অবদান)</span>
              </div>
              <div className="text-[16px] font-black text-emerald-700 bangla mt-1">
                +৳{totalInflow.toLocaleString()}
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-rose-800 text-[11px] font-bold bangla">
                <TrendingDown size={14} />
                <span>মোট ব্যয় (খরচ)</span>
              </div>
              <div className="text-[16px] font-black text-rose-700 bangla mt-1">
                -৳{totalOutflow.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold bangla transition-all ${
              filterType === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-slate-600'
            }`}
          >
            সবগুলো ({unifiedList.length})
          </button>
          <button
            onClick={() => setFilterType('inflow')}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold bangla transition-all ${
              filterType === 'inflow' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-slate-600'
            }`}
          >
            জমা ({contributions.length})
          </button>
          <button
            onClick={() => setFilterType('outflow')}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold bangla transition-all ${
              filterType === 'outflow' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white border border-border text-slate-600'
            }`}
          >
            ব্যয় ({expenses.length})
          </button>
        </div>

        {/* Transactions Timeline List */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-[14px] font-bold text-slate-800 bangla">লেনদেন বিবরণী</h3>
            <span className="text-[11px] text-slate-400 bangla">{filteredTxs.length} টি রেকর্ড</span>
          </div>

          {filteredTxs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredTxs.map((tx) => {
                const isInflow = tx.type === 'inflow';

                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isInflow ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {isInflow ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-slate-800 bangla leading-snug truncate">
                          {tx.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 bangla mt-0.5 truncate">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="truncate">{tx.subtitle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`text-[14px] font-black bangla block ${
                          isInflow ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isInflow ? `+৳${tx.amount.toLocaleString()}` : `-৳${tx.amount.toLocaleString()}`}
                        </span>
                        <span className={`text-[10px] font-semibold bangla px-2 py-0.5 rounded-full inline-block ${
                          isInflow ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isInflow ? 'অবদান' : 'খরচ'}
                        </span>
                      </div>

                      {!isInflow && (
                        <button
                          onClick={() => handleDeleteExpense(tx.raw.id)}
                          className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 bangla text-[13px] space-y-2">
              <Receipt size={32} className="mx-auto text-slate-300" />
              <p>কোনো লেনদেন রেকর্ড পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      </div>

      {/* Expense Recording Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ArrowDownLeft size={18} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-800 bangla">তহবিলের খরচ লিপিবদ্ধ করুন</h3>
                </div>
                <button 
                  onClick={() => setShowExpenseModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {modalError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-[13px] bangla">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-700 bangla">খরচের শিরোনাম / বিবরণ *</label>
                  <input 
                    type="text"
                    placeholder="যেমন: স্টেশনারি ক্রয়, ভেন্যু ভাড়া"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] bangla text-slate-800 outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-700 bangla">খরচের পরিমাণ (৳) *</label>
                  <input 
                    type="number"
                    placeholder="যেমন: ৫০০"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-700 bangla">তারিখ *</label>
                  <input 
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] bangla text-slate-800 outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-700 bangla">ব্যয়কারী / পরিশোধ প্রাপক (ঐচ্ছিক)</label>
                  <input 
                    type="text"
                    placeholder="যেমন: করিম সাহেব"
                    value={spentBy}
                    onChange={(e) => setSpentBy(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] bangla text-slate-800 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-700 bangla">নোট / মন্তব্য (ঐচ্ছিক)</label>
                  <input 
                    type="text"
                    placeholder="বিল নং বা অতিরিক্ত বিবরণ"
                    value={expenseNote}
                    onChange={(e) => setExpenseNote(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] bangla text-slate-800 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] bangla"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={savingExpense}
                    className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-[13px] bangla flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {savingExpense ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
