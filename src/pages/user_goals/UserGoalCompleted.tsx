import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService, JointGoalMetrics } from '../../lib/jointGoalService';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserGoalCompleted() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [metrics, setMetrics] = useState<JointGoalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId) return;
    setLoading(true);
    jointGoalService.getGoalById(goalId).then(async g => {
      setGoal(g);
      if (g) {
        const [mems, conts, exps] = await Promise.all([
          jointGoalService.getEnrolledMembers(goalId),
          jointGoalService.getContributions(goalId),
          jointGoalService.getExpenses(goalId)
        ]);
        setMetrics(jointGoalService.calculateMetrics(g, mems, conts, exps));
      }
      setLoading(false);
    });
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

  const target = metrics?.targetAmount || goal.target_amount || 0;
  const collected = metrics?.totalCollected || target;
  const memberCount = metrics?.membersCount || goal.total_members_limit || 12;

  return (
    <MobileLayout
      headerTitle="সম্পন্ন লক্ষ্য"
      backTo="/somobay"
      showBack={true}
    >
      <div className="space-y-5 pb-12">

        {/* Celebration Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-border p-6 text-center space-y-4 shadow-sm"
        >
          {/* Trophy Illustration / Icon */}
          <div className="w-24 h-24 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
            <Award size={52} strokeWidth={1.8} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[20px] font-black text-slate-800 bangla leading-tight">
              লক্ষ্য সম্পন্ন হয়েছে!
            </h2>
            <p className="text-[13px] text-slate-600 bangla leading-relaxed max-w-xs mx-auto">
              "{goal.name}" সফলভাবে সম্পন্ন হয়েছে। সকল সদস্যের সহযোগিতার জন্য ধন্যবাদ।
            </p>
          </div>

          {/* Stats Box (2x2 Grid) */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[11px] font-medium text-slate-400 bangla block">লক্ষ্য পরিমাণ</span>
              <strong className="text-[15px] font-black text-slate-800 bangla block mt-0.5">
                ৳ {target.toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 bangla block">সংগৃহীত</span>
              <strong className="text-[15px] font-black text-primary bangla block mt-0.5">
                ৳ {collected.toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 bangla block">সদস্য</span>
              <strong className="text-[14px] font-bold text-slate-800 bangla block mt-0.5">
                {memberCount} জন
              </strong>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 bangla block">সমাপ্তির তারিখ</span>
              <strong className="text-[12px] font-bold text-slate-800 bangla block mt-0.5 truncate">
                ৩১ ডিসেম্বর ২০২৪
              </strong>
            </div>
          </div>

          {/* Primary Action Button: বিবরণ দেখুন */}
          <button
            onClick={() => navigate(`/goals/${goalId}`)}
            className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-95 transition-all hover:bg-primary-dark"
          >
            <span>বিবরণ দেখুন</span>
          </button>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
