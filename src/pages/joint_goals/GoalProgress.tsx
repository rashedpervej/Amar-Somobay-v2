import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService, JointGoalMetrics } from '../../lib/jointGoalService';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar, 
  Award, 
  Loader2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GoalProgress() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [metrics, setMetrics] = useState<JointGoalMetrics | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const g = await jointGoalService.getGoalById(id);
        setGoal(g);

        const [mems, conts, exps] = await Promise.all([
          jointGoalService.getEnrolledMembers(id),
          jointGoalService.getContributions(id),
          jointGoalService.getExpenses(id)
        ]);

        setContributions(conts);
        if (g) {
          const m = jointGoalService.calculateMetrics(g, mems, conts, exps);
          setMetrics(m);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !goal) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">অগ্রগতি তথ্য লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  const percent = metrics?.progressPercent || 0;
  const isCompleted = goal.status === 'completed' || percent >= 100;

  // Monthly breakdown calculation
  const monthMap = new Map<string, number>();
  contributions.forEach(c => {
    const d = c.payment_date || '';
    const monthKey = d ? d.substring(0, 7) : 'অন্যান্য';
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + (Number(c.amount) || 0));
  });

  const monthEntries = Array.from(monthMap.entries()).sort().slice(-6);
  const maxMonthVal = Math.max(...monthEntries.map(e => e[1]), 1000);

  // Milestones
  const milestones = [
    { targetPct: 25, label: 'প্রাথমিক ভিত্তি (২৫%)', desc: 'লক্ষ্যের প্রথম চতুর্থাংশ সঞ্চয় সম্পন্ন' },
    { targetPct: 50, label: 'অর্ধেক পথ (৫০%)', desc: '৫০% তহবিল সুরক্ষিত' },
    { targetPct: 75, label: 'অগ্রবর্তী মাইলফলক (৭৫%)', desc: 'চূড়ান্ত লক্ষ্য অর্জনের দ্বারপ্রান্তে' },
    { targetPct: 100, label: 'পূর্ণ লক্ষ্য অর্জন (১০০%)', desc: 'সম্মিলিত সঞ্চয় শতভাগ সফল' }
  ];

  return (
    <MobileLayout
      headerTitle="লক্ষ্য অগ্রগতি ও বিশ্লেষণ"
      headerSubtitle={goal.name}
      backTo={`/joint-goals/${id}`}
      showBack={true}
      headerRight={
        isCompleted ? (
          <button
            onClick={() => navigate(`/joint-goals/${id}/completed`)}
            className="h-11 min-h-[44px] px-2 flex items-center gap-1 text-white text-[13px] font-bold bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
            title="উদ্যাপন"
          >
            <Award size={18} strokeWidth={2.4} />
            <span>উদ্যাপন</span>
          </button>
        ) : null
      }
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Circular Progress Gauge Hero Card */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm text-center space-y-4">
          <div className="flex justify-center">
            {/* SVG Donut / Circular Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-100"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#087F5B] transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * percent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-[28px] font-black text-slate-800 bangla leading-none">
                  {percent}%
                </span>
                <span className="text-[10px] font-bold text-primary bangla mt-1 uppercase tracking-wider">
                  {isCompleted ? 'সম্পন্ন' : 'অগ্রগতি'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[16px] font-bold text-slate-800 bangla">{goal.name}</h3>
            <p className="text-[12px] text-slate-500 bangla">
              নির্ধারিত লক্ষ্য: ৳{(metrics?.targetAmount || 0).toLocaleString()}
            </p>
          </div>

          {/* Target Breakdown Row */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-emerald-50/70 rounded-xl p-2.5 text-left border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-bold bangla block">মোট সংগৃহীত</span>
              <span className="text-[15px] font-black text-emerald-700 bangla block mt-0.5">
                ৳{(metrics?.totalCollected || 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-amber-50/70 rounded-xl p-2.5 text-left border border-amber-100">
              <span className="text-[10px] text-amber-800 font-bold bangla block">অবশিষ্ট লক্ষ্য</span>
              <span className="text-[15px] font-black text-amber-700 bangla block mt-0.5">
                ৳{(metrics?.remainingAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-[14px] font-bold text-slate-800 bangla">মাসভিত্তিক সঞ্চয় প্রবাহ</h3>
            </div>
            <span className="text-[11px] text-slate-400 bangla">গত কয়েক মাস</span>
          </div>

          {monthEntries.length > 0 ? (
            <div className="pt-4 pb-2 space-y-3">
              <div className="h-36 flex items-end justify-between gap-2 px-2">
                {monthEntries.map(([mKey, mVal]) => {
                  const barHeight = Math.max(12, Math.round((mVal / maxMonthVal) * 100));
                  return (
                    <div key={mKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-700 bangla truncate">
                        ৳{mVal >= 1000 ? `${Math.round(mVal / 1000)}k` : mVal}
                      </span>
                      <div 
                        className="w-full max-w-[28px] bg-gradient-to-t from-[#087F5B] to-[#10B981] rounded-t-lg transition-all duration-500"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[10px] text-slate-500 bangla truncate">
                        {mKey.substring(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 bangla text-[12px]">
              পর্যাপ্ত মাসিক ডেটা নেই
            </div>
          )}
        </div>

        {/* 4 Detail Metrics Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-2xl border border-border p-3.5 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Users size={16} />
              <span className="text-[11px] font-bold text-slate-600 bangla">মোট সদস্য</span>
            </div>
            <div className="text-[18px] font-black text-slate-800 bangla">
              {metrics?.membersCount || 0} জন
            </div>
            <p className="text-[10px] text-slate-400 bangla">অংশীদার</p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-3.5 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <DollarSign size={16} />
              <span className="text-[11px] font-bold text-slate-600 bangla">গড় অবদান</span>
            </div>
            <div className="text-[18px] font-black text-primary bangla">
              ৳{(metrics?.averageContribution || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 bangla">সদস্যপ্রতি</p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-3.5 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={16} />
              <span className="text-[11px] font-bold text-slate-600 bangla">অবদানকারী হার</span>
            </div>
            <div className="text-[18px] font-black text-emerald-700 bangla">
              {metrics?.membersCount ? Math.round(((metrics.contributorsCount || 0) / metrics.membersCount) * 100) : 0}%
            </div>
            <p className="text-[10px] text-slate-400 bangla">{metrics?.contributorsCount || 0} জন জমা করেছেন</p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-3.5 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={16} />
              <span className="text-[11px] font-bold text-slate-600 bangla">মোট কিস্তি/জমা</span>
            </div>
            <div className="text-[18px] font-black text-slate-800 bangla">
              {metrics?.contributionsCount || 0} টি
            </div>
            <p className="text-[10px] text-slate-400 bangla">রেকর্ড</p>
          </div>
        </div>

        {/* Milestone Checklist */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Target size={16} className="text-primary" />
            <h3 className="text-[14px] font-bold text-slate-800 bangla">মাইলফলক ট্র্যাকার</h3>
          </div>

          <div className="space-y-2.5">
            {milestones.map((ms) => {
              const achieved = percent >= ms.targetPct;
              return (
                <div 
                  key={ms.targetPct} 
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    achieved 
                      ? 'bg-emerald-50/70 border-emerald-200' 
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      achieved ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {achieved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <h4 className={`text-[13px] font-bold bangla ${achieved ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {ms.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 bangla">{ms.desc}</p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${
                    achieved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {achieved ? 'অর্জিত' : 'আসন্ন'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
