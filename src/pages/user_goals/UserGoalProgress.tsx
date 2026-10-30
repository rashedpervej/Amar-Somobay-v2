import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService, JointGoalMetrics } from '../../lib/jointGoalService';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign, 
  Loader2,
  Home
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserGoalProgress() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();

  const [allGoals, setAllGoals] = useState<SomobayPlan[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalId || '');
  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [members, setMembers] = useState<MemberPlan[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<JointGoalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jointGoalService.getGoals().then(goals => {
      setAllGoals(goals);
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
    });
  }, []);

  const loadData = async (gid: string) => {
    if (!gid) return;
    setLoading(true);
    try {
      const g = await jointGoalService.getGoalById(gid);
      setGoal(g);

      const [mems, conts, exps] = await Promise.all([
        jointGoalService.getEnrolledMembers(gid),
        jointGoalService.getContributions(gid),
        jointGoalService.getExpenses(gid)
      ]);

      setMembers(mems);
      setContributions(conts);
      if (g) {
        setMetrics(jointGoalService.calculateMetrics(g, mems, conts, exps));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGoalId) {
      loadData(selectedGoalId);
    }
  }, [selectedGoalId]);

  if (loading && !goal) {
    return (
      <MobileLayout>
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  const percent = metrics?.progressPercent || 0;
  const collected = metrics?.totalCollected || 0;
  const target = metrics?.targetAmount || Number(goal?.target_amount || 0);
  const remaining = metrics?.remainingAmount || Math.max(0, target - collected);
  const memberCount = metrics?.membersCount || members.length || 0;
  const avgContribution = metrics?.averageContribution || (memberCount > 0 ? Math.round(collected / memberCount) : 0);
  const lastPayment = contributions.length > 0 ? contributions[0] : null;

  // Monthly trend calculation based on real database contributions
  const months = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন'];
  // Calculate distributed heights based on real database contributions
  const monthMap = new Map<string, number>();
  contributions.forEach(c => {
    const d = c.payment_date || '';
    const m = d ? parseInt(d.split('-')[1]) : 1;
    monthMap.set(String(m), (monthMap.get(String(m)) || 0) + Number(c.amount));
  });

  const monthValues = [1, 2, 3, 4, 5, 6].map(m => monthMap.get(String(m)) || 0);
  const maxMonthVal = Math.max(...monthValues, 5000);

  return (
    <MobileLayout
      headerTitle="লক্ষ্যের অগ্রগতি"
      backTo={`/goals/${selectedGoalId}`}
      showBack={true}
    >
      <div className="space-y-4 pb-12">

        {/* Goal Selector Pill */}
        <div className="relative">
          <select
            value={selectedGoalId}
            onChange={(e) => {
              setSelectedGoalId(e.target.value);
              navigate(`/goals/${e.target.value}/progress`);
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

        {/* Progress Card */}
        <div className="bg-white rounded-2xl border border-border p-4.5 shadow-sm">
          <div className="flex items-center gap-5">
            {/* Donut Chart Gauge */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#087F5B] transition-all duration-700"
                  strokeWidth="12"
                  strokeDasharray={251}
                  strokeDashoffset={251 - (251 * percent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[18px] font-black text-slate-800 bangla leading-none">
                  {percent}%
                </span>
              </div>
            </div>

            {/* Bullets & Stats */}
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span className="text-[12px] text-slate-600 bangla">সংগৃহীত:</span>
                <strong className="text-[14px] font-bold text-primary bangla truncate">
                  ৳ {collected.toLocaleString()}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                <span className="text-[12px] text-slate-500 bangla">লক্ষ্য:</span>
                <span className="text-[13px] font-semibold text-slate-700 bangla truncate">
                  ৳ {target.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-[12px] text-slate-500 bangla">বাকি:</span>
                <span className="text-[13px] font-bold text-rose-600 bangla truncate">
                  ৳ {remaining.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: মাসভিত্তিক অবদান (Bar Chart) */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <h3 className="text-[14px] font-bold text-text-primary bangla">মাসভিত্তিক অবদান</h3>

          <div className="pt-2 pb-1">
            <div className="h-32 flex items-end justify-between gap-2.5 px-2">
              {months.map((m, idx) => {
                const val = monthValues[idx] || 0;
                // If 0, show a baseline height of 10%
                const pct = Math.max(12, Math.round((val / maxMonthVal) * 90));

                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div 
                      className="w-full max-w-[24px] bg-primary rounded-t-md transition-all duration-500"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[11px] font-medium text-slate-500 bangla">
                      {m}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3-Column Summary Metrics Footer */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white border border-border rounded-xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-400 bangla block font-medium">সদস্য সংখ্যা</span>
            <strong className="text-[14px] font-black text-slate-800 bangla block mt-0.5">
              {memberCount}
            </strong>
          </div>

          <div className="bg-white border border-border rounded-xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-400 bangla block font-medium">গড় অবদান</span>
            <strong className="text-[13px] font-black text-emerald-700 bangla block mt-0.5 truncate">
              ৳ {avgContribution.toLocaleString()}
            </strong>
          </div>

          <div className="bg-white border border-border rounded-xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-400 bangla block font-medium">শেষ অবদান</span>
            <strong className="text-[11px] font-bold text-slate-700 bangla block mt-0.5 truncate">
              {lastPayment?.payment_date ? lastPayment.payment_date : '০১ আগস্ট ২০২৪'}
            </strong>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
