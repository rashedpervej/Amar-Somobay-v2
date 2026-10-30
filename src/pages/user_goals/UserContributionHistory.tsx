import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { useAuthStore } from '../../store/useAuthStore';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  Home,
  X,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UserContributionHistory() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [allGoals, setAllGoals] = useState<SomobayPlan[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalId || '');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'success' | 'due' | 'ref'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    jointGoalService.getGoals().then(goals => {
      setAllGoals(goals);
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
    });
  }, []);

  const loadPayments = async (gid: string) => {
    if (!gid || !profile?.id) return;
    setLoading(true);
    try {
      const summary = await jointGoalService.getUserGoalSummary(gid, profile.id);
      setPayments(summary.payments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGoalId) {
      loadPayments(selectedGoalId);
    }
  }, [selectedGoalId, profile?.id]);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = (p.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.payment_date || '').includes(searchQuery);
    return matchesSearch;
  });

  return (
    <MobileLayout
      headerTitle="অবদানের ইতিহাস"
      backTo={`/goals/${selectedGoalId}`}
      showBack={true}
      headerRight={
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title={showSearch ? 'অনুসন্ধান বন্ধ' : 'অনুসন্ধান'}
          aria-label="অনুসন্ধান"
        >
          {showSearch ? <X size={22} strokeWidth={2.4} /> : <Search size={22} strokeWidth={2.4} />}
        </button>
      }
    >
      <div className="space-y-4 pb-12">

        {/* Goal Selector Pill */}
        <div className="relative">
          <select
            value={selectedGoalId}
            onChange={(e) => {
              setSelectedGoalId(e.target.value);
              navigate(`/goals/${e.target.value}/contributions`);
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

        {/* Search bar collapsible */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <input
                type="text"
                placeholder="তারিখ বা নোট দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-border rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Chips: সব | সফল | বকেয়া | রেফারেন্স */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'সব' },
            { id: 'success', label: 'সফল' },
            { id: 'due', label: 'বকেয়া' },
            { id: 'ref', label: 'রেফারেন্স' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold bangla transition-all ${
                activeFilter === f.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Chronological Contribution List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[13px] text-slate-500 bangla">লোড হচ্ছে...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border divide-y divide-slate-100 shadow-sm overflow-hidden">
            {filteredPayments.map((p, idx) => (
              <div key={p.id || idx} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-[14px] font-black text-slate-800 bangla">
                      ৳ {Number(p.amount).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-400 bangla block">
                      {p.payment_date || 'তারিখ নেই'} {p.note ? `• ${p.note}` : ''}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full bangla border border-emerald-200">
                  সফল
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center p-6 space-y-2">
            <Receipt size={32} className="mx-auto text-slate-300" />
            <h4 className="text-[14px] font-bold text-slate-700 bangla">কোন রেকর্ড পাওয়া যায়নি</h4>
            <p className="text-[12px] text-slate-400 bangla">এই ফিল্টারে কোনো অবদানের রেকর্ড নেই।</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
