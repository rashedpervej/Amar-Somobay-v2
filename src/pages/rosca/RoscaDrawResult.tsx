import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan, RoscaPeriod } from '../../store/useSomobayStore';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Calendar, 
  RotateCw, 
  Trophy, 
  Users, 
  ChevronRight, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function RoscaDrawResult() {
  const { id, periodId } = useParams<{ id: string; periodId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<SomobayPlan | null>(null);
  const [period, setPeriod] = useState<RoscaPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !periodId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const p = await roscaService.getRoscaPlanById(id);
        setPlan(p);

        const { data: per } = await supabase
          .from('rosca_periods')
          .select(`
            *,
            recipient:recipient_id(id, full_name, phone, avatar_url)
          `)
          .eq('id', periodId)
          .single();
        setPeriod(per);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, periodId]);

  if (loading || !plan || !period) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[14px] bangla">লোড হচ্ছে...</span>
        </div>
      </MobileLayout>
    );
  }

  const durationMonths = plan.duration_months || 12;
  const membersLimit = plan.total_members_limit || 12;
  const payoutAmount = period.payout_amount || (membersLimit * plan.installment_amount);
  const drawDate = period.drawn_at 
    ? new Date(period.drawn_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
    : (period.due_date 
        ? new Date(period.due_date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }));

  return (
    <MobileLayout
      headerTitle="ড্র ফলাফল"
      backTo={`/rosca/${id}`}
      showBack={true}
    >
      <div className="flex flex-col items-center text-center py-4 space-y-4">
        {/* Celebration Graphic */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center shadow-lg shadow-[#087F5B]/15">
            <CheckCircle2 size={46} className="text-primary" strokeWidth={2.5} />
          </div>
          <Sparkles className="absolute -top-1 -right-1 text-amber-400 animate-bounce" size={24} />
          <Sparkles className="absolute -bottom-1 -left-1 text-purple-400 animate-pulse" size={20} />
        </motion.div>

        {/* Title & Subtitle */}
        <div>
          <h2 className="text-[22px] font-bold text-text-primary bangla leading-tight">
            ড্র সম্পন্ন হয়েছে!
          </h2>
          <p className="text-[13px] text-text-secondary bangla mt-1">
            নির্বাচিত সদস্য সফলভাবে ড্র পেয়েছেন।
          </p>
        </div>

        {/* Winner Profile Card (Screen 7) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-white rounded-3xl p-5 border border-border shadow-md space-y-4 text-left"
        >
          <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
            <div className="w-13 h-13 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold text-lg bangla overflow-hidden shrink-0 border border-primary/20">
              {period.recipient?.avatar_url ? (
                <img src={period.recipient.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                period.recipient?.full_name?.charAt(0) || 'স'
              )}
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-text-primary bangla leading-tight">
                {period.recipient?.full_name || 'সদস্যের নাম'}
              </h3>
              <span className="text-[12px] font-mono text-text-secondary mt-0.5 block">
                SM-{String(period.period_no).padStart(3, '0')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11.5px] text-text-secondary bangla block">প্রাপ্তির পরিমাণ</span>
              <span className="text-[24px] font-bold text-primary bangla block leading-tight">
                ৳ {Number(payoutAmount).toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 bangla">
                (৳ {plan.installment_amount.toLocaleString()} × {membersLimit} সদস্য)
              </span>
            </div>

            <div className="p-3 bg-bg-soft rounded-2xl border border-border space-y-2 text-[12.5px] bangla">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  <span>ড্র তারিখ:</span>
                </span>
                <span className="font-semibold text-text-primary">{drawDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <RotateCw size={14} className="text-slate-400" />
                  <span>চক্র ও রাউন্ড:</span>
                </span>
                <span className="font-semibold text-text-primary">Cycle {period.cycle_no} (মাস {period.period_no} / {durationMonths})</span>
              </div>
            </div>

            {/* Financial Payout Voucher Box (Task 9) */}
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-800 bangla flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>লেজারে পেআউট ভাউচার এন্ট্রি সম্পন্ন</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10.5px] font-bold uppercase tracking-wider">
                  PAID
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                <span className="text-slate-600 bangla">ভাউচার রেফারেন্স:</span>
                <span className="font-mono font-semibold text-slate-800 select-all">
                  {period.notes?.match(/RO-PAY-[A-Za-z0-9\-]+/)?.[0] || `RO-PAY-${period.cycle_no}-${period.period_no}-${period.id.slice(0, 4).toUpperCase()}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 bangla">খাত ও ধরন:</span>
                <span className="font-medium text-slate-700 bangla">কমিটি ড্র পেআউট (ROSCA Pot)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons (Screen 7) */}
        <div className="w-full space-y-2.5 pt-2">
          <button
            onClick={() => navigate(`/rosca/${id}?tab=history`)}
            className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
          >
            <span>ড্র ইতিহাস দেখুন</span>
          </button>

          {period.recipient?.id && (
            <button
              onClick={() => navigate(`/rosca/${id}/members/${period.recipient?.id}`)}
              className="w-full h-[46px] bg-white border border-border hover:bg-slate-50 text-text-primary rounded-xl font-semibold bangla text-[14px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <span>সদস্যের বিস্তারিত দেখুন</span>
            </button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
