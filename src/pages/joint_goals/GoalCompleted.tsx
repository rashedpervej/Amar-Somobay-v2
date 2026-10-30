import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService, JointGoalMetrics } from '../../lib/jointGoalService';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  Users, 
  Target, 
  FileText, 
  Plus, 
  ChevronRight, 
  DollarSign, 
  Loader2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GoalCompleted() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [metrics, setMetrics] = useState<JointGoalMetrics | null>(null);
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

        if (g) {
          setMetrics(jointGoalService.calculateMetrics(g, mems, conts, exps));
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
          <p className="text-[13px] text-slate-500 bangla">লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      headerTitle="লক্ষ্য সম্পন্ন উদ্যাপন"
      headerSubtitle={goal.name}
      backTo={`/joint-goals/${id}`}
      showBack={true}
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Golden Trophy Celebration Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden space-y-4"
        >
          {/* Subtle sparkle background effects */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Trophy Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
            <Award size={44} className="text-amber-100" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold bangla uppercase tracking-wider">
              <CheckCircle2 size={13} />
              <span>লক্ষ্য সফলভাবে সম্পন্ন</span>
            </div>
            <h2 className="text-[22px] font-black bangla leading-tight pt-1">
              অভিনন্দন সমিতি পরিবার!
            </h2>
            <p className="text-[13px] text-amber-100 bangla max-w-xs mx-auto">
              "{goal.name}" যৌথ সঞ্চয় লক্ষ্যটি সদস্যদের সম্মিলিত প্রচেষ্টায় ১০০% বাস্তবায়িত হয়েছে।
            </p>
          </div>
        </motion.div>

        {/* Achievement Summary Cards */}
        <div className="bg-white rounded-2xl border border-border p-4.5 shadow-sm space-y-4">
          <h3 className="text-[14px] font-bold text-slate-800 bangla border-b border-slate-100 pb-2">
            চূড়ান্ত ফলাফল ও পরিসংখ্যান
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-500 bangla">নির্ধারিত লক্ষ্য</span>
              <div className="text-[17px] font-black text-slate-800 bangla mt-0.5">
                ৳{(metrics?.targetAmount || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <span className="text-[11px] font-bold text-emerald-800 bangla">মোট সংগৃহীত</span>
              <div className="text-[17px] font-black text-emerald-700 bangla mt-0.5">
                ৳{(metrics?.totalCollected || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
              <span className="text-[11px] font-bold text-sky-800 bangla">অংশগ্রহণকারী সদস্য</span>
              <div className="text-[17px] font-black text-sky-700 bangla mt-0.5">
                {metrics?.membersCount || 0} জন
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <span className="text-[11px] font-bold text-amber-800 bangla">অবশিষ্ট তহবিল স্থিতি</span>
              <div className="text-[17px] font-black text-amber-700 bangla mt-0.5">
                ৳{(metrics?.availableFund || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Fund Utilization Summary */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-primary" />
            <h4 className="text-[14px] font-bold text-slate-800 bangla">তহবিল ব্যবহার ও বণ্টন</h4>
          </div>

          <p className="text-[12px] text-slate-600 bangla leading-relaxed">
            এই তহবিলের অর্থ যৌথ উদ্দেশ্যের নিমিত্তে ব্যবহার করা হয়েছে। অবশিষ্ট তহবিল থাকলে তা সোসাইটির সাধারণ তহবিলে জমা অথবা সদস্যদের মধ্যে সমানুপাতিক হারে বণ্টন করা যায়।
          </p>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-[12px] bangla">
            <span className="text-slate-500">মোট ব্যয়িত পরিমাণ:</span>
            <span className="font-bold text-rose-700">৳{(metrics?.totalSpent || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => navigate(`/joint-goals/${id}/reports`)}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-primary-dark"
          >
            <FileText size={18} />
            <span>চূড়ান্ত অডিট রিপোর্ট দেখুন</span>
          </button>

          <button
            onClick={() => navigate('/joint-goals/create')}
            className="w-full py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-[14px] bangla flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-50"
          >
            <Plus size={18} />
            <span>নতুন যৌথ সঞ্চয় লক্ষ্য শুরু করুন</span>
          </button>

          <button
            onClick={() => navigate('/joint-goals')}
            className="w-full py-2.5 text-center text-slate-500 text-[13px] font-bold bangla hover:text-slate-700"
          >
            লক্ষ্য তালিকায় ফিরে যান
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
