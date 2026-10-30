import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService, JointGoalMetrics } from '../../lib/jointGoalService';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  Loader2, 
  Info, 
  Bell, 
  CheckCircle2,
  Home,
  Droplets,
  Building2,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserGoalDetails() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [members, setMembers] = useState<MemberPlan[]>([]);
  const [metrics, setMetrics] = useState<JointGoalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!goalId) return;
      setLoading(true);
      try {
        const g = await jointGoalService.getGoalById(goalId);
        if (!g) {
          navigate('/somobay');
          return;
        }
        setGoal(g);

        const [mems, conts, exps] = await Promise.all([
          jointGoalService.getEnrolledMembers(goalId),
          jointGoalService.getContributions(goalId),
          jointGoalService.getExpenses(goalId)
        ]);

        setMembers(mems);
        setMetrics(jointGoalService.calculateMetrics(g, mems, conts, exps));
      } catch (e) {
        console.error('Error loading goal details:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goalId]);

  if (loading || !goal) {
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
  const isCompleted = goal.status === 'completed' || percent >= 100;
  const remaining = metrics?.remainingAmount || 0;
  const collected = metrics?.totalCollected || 0;
  const target = metrics?.targetAmount || goal?.target_amount || 0;
  const memberCount = members.length > 0 ? members.length : (goal.total_members_limit || 12);

  return (
    <MobileLayout
      headerTitle="লক্ষ্যের বিবরণ"
      backTo="/somobay"
      showBack={true}
      headerRight={
        <button 
          onClick={() => navigate(`/goals/${goalId}/notices`)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title="নোটিশ"
          aria-label="নোটিশ"
        >
          <Bell size={22} strokeWidth={2.2} />
        </button>
      }
    >
      <div className="space-y-4 pb-20">

        {/* Hero Banner / Card */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-900 to-[#065F46] p-6 text-white shadow-sm flex flex-col justify-end min-h-[160px]">
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold bangla border ${
              isCompleted 
                ? 'bg-amber-400 text-amber-950 border-amber-300' 
                : 'bg-emerald-400/20 text-emerald-100 border-emerald-300/40 backdrop-blur-md'
            }`}>
              {isCompleted ? 'সম্পন্ন' : 'চলমান'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2">
              <Home size={22} />
            </div>
            <h2 className="text-[20px] font-black bangla leading-tight">{goal.name}</h2>
            <p className="text-[12px] text-emerald-100/90 bangla line-clamp-2">
              {goal.description || 'সম্মিলিত সঞ্চয় ও প্রজেক্ট বাস্তবায়ন তহবিল।'}
            </p>
          </div>
        </div>

        {/* Financial Progress Card */}
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

        {/* 3 Information Tiles */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div 
            onClick={() => navigate(`/goals/${goalId}/members`)}
            className="bg-white border border-border rounded-xl p-2.5 shadow-sm cursor-pointer hover:border-emerald-300 transition-all active:scale-95"
          >
            <Users size={16} className="mx-auto text-primary mb-1" />
            <span className="text-[10px] text-slate-500 bangla block font-medium">সদস্য</span>
            <strong className="text-[13px] font-bold text-slate-800 bangla block mt-0.5">
              {memberCount} জন
            </strong>
          </div>

          <div className="bg-white border border-border rounded-xl p-2.5 shadow-sm">
            <Calendar size={16} className="mx-auto text-teal-600 mb-1" />
            <span className="text-[10px] text-slate-500 bangla block font-medium">শুরু তারিখ</span>
            <strong className="text-[12px] font-bold text-slate-800 bangla block mt-0.5 truncate">
              {goal.created_at ? new Date(goal.created_at).toLocaleDateString('bn-BD') : '০১ জানু ২০২৪'}
            </strong>
          </div>

          <div className="bg-white border border-border rounded-xl p-2.5 shadow-sm">
            <Calendar size={16} className="mx-auto text-amber-600 mb-1" />
            <span className="text-[10px] text-slate-500 bangla block font-medium">শেষ তারিখ</span>
            <strong className="text-[12px] font-bold text-slate-800 bangla block mt-0.5 truncate">
              ৩১ ডিসে ২০২৪
            </strong>
          </div>
        </div>

        {/* 4 Compact Tabs Navigation */}
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
          <button 
            className="flex-1 py-1.5 rounded-lg text-[12px] font-bold bangla bg-white text-primary shadow-sm"
          >
            সারসংক্ষেপ
          </button>
          <button 
            onClick={() => navigate(`/goals/${goalId}/my-contribution`)}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-bold bangla text-slate-600 hover:text-slate-800"
          >
            আমার অবদান
          </button>
          <button 
            onClick={() => navigate(`/goals/${goalId}/members`)}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-bold bangla text-slate-600 hover:text-slate-800"
          >
            সদস্য
          </button>
          <button 
            onClick={() => navigate(`/goals/${goalId}/contributions`)}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-bold bangla text-slate-600 hover:text-slate-800"
          >
            লেনদেন
          </button>
        </div>

        {/* Goal Description Section */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-2">
          <h3 className="text-[14px] font-bold text-text-primary bangla">লক্ষ্যের বিবরণ</h3>
          <p className="text-[13px] text-slate-600 bangla leading-relaxed">
            {goal.description || 'সম্মিলিতভাবে একটি বাড়ি নির্মাণের জন্য সঞ্চয় করা হবে।'}
          </p>
        </div>

        {/* Quick Links: Progress Analytics, Goal Info, Notices */}
        <div className="space-y-2">
          <div 
            onClick={() => navigate(`/goals/${goalId}/progress`)}
            className="bg-white border border-border rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.99] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <span className="text-[13px] font-bold text-slate-800 bangla">অগ্রগতি ও পরিসংখ্যান</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>

          <div 
            onClick={() => navigate(`/goals/${goalId}/information`)}
            className="bg-white border border-border rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.99] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Info size={16} />
              </div>
              <span className="text-[13px] font-bold text-slate-800 bangla">লক্ষ্যের সাধারণ তথ্য</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
        </div>

        {/* Sticky Primary Action: এখনই অবদান করুন */}
        <div className="pt-2">
          <button
            onClick={() => navigate(`/goals/${goalId}/contribute`)}
            className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-95 transition-all hover:bg-primary-dark"
          >
            <span>এখনই অবদান করুন</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
