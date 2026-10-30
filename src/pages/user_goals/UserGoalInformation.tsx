import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  Home, 
  Calendar, 
  Users, 
  DollarSign, 
  Loader2, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserGoalInformation() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId) return;
    setLoading(true);
    jointGoalService.getGoalById(goalId).then(g => {
      setGoal(g);
      setLoading(false);
    });
  }, [goalId]);

  if (loading || !goal) {
    return (
      <MobileLayout>
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">তথ্য লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  const isCompleted = goal.status === 'completed';

  return (
    <MobileLayout
      headerTitle="লক্ষ্যের তথ্য"
      backTo={`/goals/${goalId}`}
      showBack={true}
    >
      <div className="space-y-4 pb-12">

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center shrink-0">
            <Home size={26} />
          </div>

          <div>
            <h2 className="text-[16px] font-bold text-text-primary bangla leading-tight">
              {goal.name}
            </h2>
            <span className="text-[12px] text-slate-500 bangla block mt-0.5">
              সম্মিলিত সঞ্চয়
            </span>
          </div>
        </div>

        {/* বিবরণ Section */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-2">
          <h3 className="text-[14px] font-bold text-text-primary bangla">বিবরণ</h3>
          <p className="text-[13px] text-slate-600 bangla leading-relaxed">
            {goal.description || 'সম্মিলিতভাবে একটি বাড়ি নির্মাণের জন্য সঞ্চয় করা হবে।'}
          </p>
        </div>

        {/* 2x2 Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400 bangla block">লক্ষ্য পরিমাণ</span>
            <strong className="text-[16px] font-black text-slate-800 bangla block">
              ৳ {(goal.target_amount || 0).toLocaleString()}
            </strong>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400 bangla block">শুরু তারিখ</span>
            <strong className="text-[13px] font-bold text-slate-800 bangla block truncate">
              {goal.created_at ? new Date(goal.created_at).toLocaleDateString('bn-BD') : '—'}
            </strong>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400 bangla block">শেষ তারিখ</span>
            <strong className="text-[13px] font-bold text-slate-800 bangla block truncate">
              {goal.duration_months ? `${goal.duration_months} মাস মেয়াদি` : 'নির্ধারিত হয়নি'}
            </strong>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400 bangla block">মোট সদস্য</span>
            <strong className="text-[16px] font-black text-slate-800 bangla block">
              {goal.total_members_limit || 0} জন
            </strong>
          </div>
        </div>

        {/* অবস্থা / Status Row */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center justify-between">
          <span className="text-[13px] font-bold text-slate-700 bangla">অবস্থা</span>
          <span className={`px-3 py-1 rounded-full text-[12px] font-bold bangla border ${
            isCompleted 
              ? 'bg-amber-50 text-amber-800 border-amber-200' 
              : 'bg-primary-light text-primary border-emerald-200'
          }`}>
            {isCompleted ? 'সম্পন্ন' : 'চলমান'}
          </span>
        </div>
      </div>
    </MobileLayout>
  );
}
