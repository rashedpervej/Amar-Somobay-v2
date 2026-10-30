import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan, MemberPlan, RoscaPeriod } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  RotateCw, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Trophy, 
  Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function RoscaProgress() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<SomobayPlan | null>(null);
  const [periods, setPeriods] = useState<RoscaPeriod[]>([]);
  const [enrolledMembers, setEnrolledMembers] = useState<MemberPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const p = await roscaService.getRoscaPlanById(id);
        setPlan(p);
        const per = await roscaService.getRoscaPeriods(id);
        setPeriods(per);
        const mem = await roscaService.getEnrolledMembers(id);
        setEnrolledMembers(mem);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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

  const durationMonths = plan.duration_months || 12;
  const currentCycle = plan.current_cycle || 1;
  const cyclePeriods = periods.filter(p => p.cycle_no === currentCycle);
  const completedCount = cyclePeriods.filter(p => p.status === 'drawn').length;
  const remainingCount = Math.max(0, durationMonths - completedCount);
  const progressPercent = Math.round((completedCount / durationMonths) * 100);

  // SVG Circular progress math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <MobileLayout
      headerTitle="চক্রের অগ্রগতি"
      backTo={`/rosca/${id}`}
      showBack={true}
    >
      {/* Donut Chart Radial Progress Card (Screen 9) */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-xs flex flex-col items-center text-center">
        <div className="relative w-36 h-36 flex items-center justify-center mb-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            {/* Background ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="text-[#F1F5F9]"
              strokeWidth="11"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="text-primary transition-all duration-1000 ease-out"
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[26px] font-bold text-text-primary bangla leading-none">
              {progressPercent}%
            </span>
            <span className="text-[11px] text-text-secondary bangla mt-1">
              Cycle {currentCycle}
            </span>
          </div>
        </div>

        <p className="text-[13px] font-semibold text-text-primary bangla mt-1">
          {completedCount} / {durationMonths} মাস শেষ
        </p>
      </div>

      {/* 3-Column Stats Grid (Screen 9) */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="bg-white p-3 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">মোট মাস</span>
          <span className="text-[17px] font-bold text-text-primary bangla block mt-0.5">
            {durationMonths}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">সম্পন্ন</span>
          <span className="text-[17px] font-bold text-[#16A34A] bangla block mt-0.5">
            {completedCount}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">বাকি</span>
          <span className="text-[17px] font-bold text-[#D97706] bangla block mt-0.5">
            {remainingCount}
          </span>
        </div>
      </div>

      {/* Vertical Connected Timeline / Stepper (Screen 9) */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-xs space-y-4">
        <h3 className="text-[14px] font-bold text-text-primary bangla">
          মাসের ক্রমিক তালিকা
        </h3>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2E8F0]">
          {Array.from({ length: durationMonths }).map((_, i) => {
            const monthNo = i + 1;
            const period = cyclePeriods.find(p => p.period_no === monthNo);
            const isDrawn = period?.status === 'drawn';
            const winner = enrolledMembers.find(m => m.member_id === period?.recipient_id);

            return (
              <div key={monthNo} className="relative flex items-center justify-between">
                {/* Timeline Dot */}
                <div className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isDrawn 
                    ? 'bg-primary border-primary text-white' 
                    : 'bg-white border-slate-300'
                }`}>
                  {isDrawn && <CheckCircle2 size={12} strokeWidth={3} />}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-bold text-text-primary bangla">
                    মাস {monthNo} :
                  </span>
                  <span className={`text-[13px] bangla ${isDrawn ? 'font-bold text-text-primary' : 'text-slate-400'}`}>
                    {isDrawn ? (winner?.profile?.full_name || 'প্রাপক নির্বাচিত') : 'নির্ধারিত হয়নি'}
                  </span>
                </div>

                {isDrawn && (
                  <span className="text-[11px] font-semibold text-[#16A34A] bg-primary-light px-2 py-0.5 rounded-full bangla">
                    সম্পন্ন
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}
