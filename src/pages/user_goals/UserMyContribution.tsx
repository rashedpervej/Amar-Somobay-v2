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
  Plus, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  DollarSign,
  ChevronRight,
  Home
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserMyContribution() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [allGoals, setAllGoals] = useState<SomobayPlan[]>([]);
  const [currentGoal, setCurrentGoal] = useState<SomobayPlan | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalId || '');
  const [payments, setPayments] = useState<any[]>([]);
  const [totalContributed, setTotalContributed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load all goals for switcher
  useEffect(() => {
    jointGoalService.getGoals().then(goals => {
      setAllGoals(goals);
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
    });
  }, []);

  const loadUserData = async (gid: string) => {
    if (!gid || !profile?.id) return;
    setLoading(true);
    try {
      const g = await jointGoalService.getGoalById(gid);
      setCurrentGoal(g);

      const summary = await jointGoalService.getUserGoalSummary(gid, profile.id);
      setPayments(summary.payments);
      setTotalContributed(summary.totalContributed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGoalId) {
      loadUserData(selectedGoalId);
    }
  }, [selectedGoalId, profile?.id]);

  if (loading && !currentGoal) {
    return (
      <MobileLayout>
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">তথ্য লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  const goalTarget = currentGoal?.target_amount || 0;
  const memberLimit = currentGoal?.total_members_limit || 1;
  const proposedUserTarget = memberLimit > 0 ? Math.round(goalTarget / memberLimit) : 0;
  const excessAmount = Math.max(0, totalContributed - proposedUserTarget);

  return (
    <MobileLayout
      headerTitle="আমার অবদান"
      backTo={`/goals/${selectedGoalId}`}
      showBack={true}
      headerRight={
        <button 
          onClick={() => navigate(`/goals/${selectedGoalId}/contributions`)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title="অবদানসমূহ দেখুন"
          aria-label="অবদানসমূহ দেখুন"
        >
          <Search size={22} strokeWidth={2.4} />
        </button>
      }
    >
      <div className="space-y-4 pb-16">

        {/* Goal Selector Pill */}
        <div className="relative">
          <select
            value={selectedGoalId}
            onChange={(e) => {
              setSelectedGoalId(e.target.value);
              navigate(`/goals/${e.target.value}/my-contribution`);
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

        {/* 4-Grid Financial Summary Cards (2x2) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">মোট অবদান</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {totalContributed.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">মোট কিস্তি/লক্ষ্য</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {goalTarget.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">আমার লক্ষ্য (প্রস্তাবিত)</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {proposedUserTarget.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">অতিরিক্ত</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {excessAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Primary Action Button: অবদান করুন */}
        <div>
          <button
            onClick={() => navigate(`/goals/${selectedGoalId}/contribute`)}
            className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-95 transition-all hover:bg-primary-dark"
          >
            <span>অবদান করুন</span>
          </button>
        </div>

        {/* Section: আমার অবদানের ইতিহাস */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-bold text-text-primary bangla">আমার অবদানের ইতিহাস</h3>
            <button
              onClick={() => navigate(`/goals/${selectedGoalId}/contributions`)}
              className="text-[12px] font-bold text-primary bangla hover:underline"
            >
              সব দেখুন
            </button>
          </div>

          {payments.length > 0 ? (
            <div className="bg-white rounded-2xl border border-border divide-y divide-slate-100 shadow-sm overflow-hidden">
              {payments.slice(0, 5).map((p, idx) => (
                <div key={p.id || idx} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-800 bangla">
                        ৳ {Number(p.amount).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-400 bangla">
                        {p.payment_date || 'তারিখ নেই'}
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
            <div className="py-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center p-4 text-[13px] text-slate-400 bangla">
              এখনো কোনো অবদান জমা দেননি।
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
