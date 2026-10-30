import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan, RoscaPeriod } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  RotateCw, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

export default function RoscaCompleted() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<SomobayPlan | null>(null);
  const [periods, setPeriods] = useState<RoscaPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingNext, setStartingNext] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const p = await roscaService.getRoscaPlanById(id);
        setPlan(p);
        const per = await roscaService.getRoscaPeriods(id);
        setPeriods(per);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStartNextCycle = async () => {
    if (!id) return;
    const confirmNext = window.confirm('আপনি কি এই গ্রুপের পরবর্তী চক্র (Cycle 2) চালু করতে চান? সকল সদস্য পুনরায় নতুন চক্রে ড্র পাওয়ার সুযোগ পাবেন।');
    if (!confirmNext) return;

    try {
      setStartingNext(true);
      const nextCycleNo = await roscaService.startNextCycle(id);
      alert(`অভিনন্দন! Cycle ${nextCycleNo} সফলভাবে শুরু হয়েছে।`);
      navigate(`/rosca/${id}?tab=overview`);
    } catch (err: any) {
      alert('নতুন চক্র শুরু করতে ত্রুটি হয়েছে: ' + (err.message || ''));
    } finally {
      setStartingNext(false);
    }
  };

  if (loading || !plan) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[14px] bangla">লোড হচ্ছে...</span>
        </div>
      </MobileLayout>
    );
  }

  const currentCycle = plan.current_cycle || 1;
  const durationMonths = plan.duration_months || 12;
  const membersLimit = plan.total_members_limit || 12;
  const startDate = plan.created_at ? new Date(plan.created_at).toLocaleDateString('bn-BD') : '—';
  const endDate = new Date(Date.now()).toLocaleDateString('bn-BD');

  return (
    <MobileLayout
      headerTitle="সম্পন্ন চক্র"
      backTo={`/rosca/${id}`}
      showBack={true}
    >
      <div className="flex flex-col items-center text-center py-6 space-y-4">
        {/* Large Trophy Graphic (Screen 12) */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center shadow-lg shadow-amber-500/10 border-2 border-amber-200">
            <Trophy size={54} className="text-amber-500" />
          </div>
          <Sparkles className="absolute -top-1 -right-2 text-amber-400" size={26} />
          <Sparkles className="absolute -bottom-1 -left-1 text-primary" size={20} />
        </motion.div>

        {/* Title & Subtitle (Screen 12) */}
        <div className="space-y-1">
          <h2 className="text-[22px] font-bold text-text-primary bangla leading-tight">
            চক্র সম্পন্ন হয়েছে!
          </h2>
          <p className="text-[13px] text-text-secondary bangla max-w-[280px] mx-auto">
            Cycle {currentCycle} সফলভাবে সম্পন্ন হয়েছে। সব সদস্য একবার করে ড্র পেয়েছেন।
          </p>
        </div>

        {/* 4-Grid Stats Box (Screen 12) */}
        <div className="w-full bg-white rounded-3xl p-5 border border-border shadow-xs grid grid-cols-2 gap-3 text-left">
          <div className="p-3 bg-bg-soft rounded-2xl border border-border">
            <span className="text-[11px] text-text-secondary bangla block">মোট সদস্য</span>
            <span className="text-[17px] font-bold text-text-primary bangla block mt-0.5">
              {membersLimit}
            </span>
          </div>

          <div className="p-3 bg-bg-soft rounded-2xl border border-border">
            <span className="text-[11px] text-text-secondary bangla block">মোট ড্র</span>
            <span className="text-[17px] font-bold text-text-primary bangla block mt-0.5">
              {durationMonths}
            </span>
          </div>

          <div className="p-3 bg-bg-soft rounded-2xl border border-border">
            <span className="text-[11px] text-text-secondary bangla block">শুরু</span>
            <span className="text-[13px] font-semibold text-text-primary bangla block mt-0.5">
              {startDate}
            </span>
          </div>

          <div className="p-3 bg-bg-soft rounded-2xl border border-border">
            <span className="text-[11px] text-text-secondary bangla block">শেষ</span>
            <span className="text-[13px] font-semibold text-text-primary bangla block mt-0.5">
              {endDate}
            </span>
          </div>
        </div>

        {/* Action Buttons (Screen 12) */}
        <div className="w-full space-y-2.5 pt-3">
          <button
            onClick={handleStartNextCycle}
            disabled={startingNext}
            className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {startingNext ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>নতুন চক্র শুরু করুন</span>
          </button>

          <button
            onClick={() => navigate(`/rosca/${id}?tab=history`)}
            className="w-full h-[46px] bg-white border border-border hover:bg-slate-50 text-text-primary rounded-xl font-semibold bangla text-[14px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <span>সম্পূর্ণ ইতিহাস দেখুন</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
