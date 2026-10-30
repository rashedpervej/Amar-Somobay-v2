import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { useAuthStore } from '../../store/useAuthStore';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  UserCheck, 
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserMyMemberDetails() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalContributed, setTotalContributed] = useState(0);
  const [thisMonthContributed, setThisMonthContributed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!goalId || !profile?.id) return;
      setLoading(true);
      try {
        const g = await jointGoalService.getGoalById(goalId);
        setGoal(g);

        const summary = await jointGoalService.getUserGoalSummary(goalId, profile.id);
        setPayments(summary.payments);
        setTotalContributed(summary.totalContributed);
        setThisMonthContributed(summary.thisMonthContributed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goalId, profile?.id]);

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

  const goalTarget = Number(goal.target_amount || 0);
  const memberLimit = Number(goal.total_members_limit || 1);
  const myTarget = Math.round(goalTarget / memberLimit);
  const excessAmount = Math.max(0, totalContributed - myTarget);

  return (
    <MobileLayout
      headerTitle="আমার তথ্য"
      backTo={`/goals/${goalId}/members`}
      showBack={true}
      headerRight={
        <button 
          onClick={() => navigate(`/goals/${goalId}/contributions`)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title="অবদানসমূহ দেখুন"
          aria-label="অবদানসমূহ দেখুন"
        >
          <Search size={22} strokeWidth={2.4} />
        </button>
      }
    >
      <div className="space-y-4 pb-12">

        {/* Member Profile Card */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-[18px] text-slate-700 bangla shrink-0 shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0) || 'স'
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-text-primary bangla leading-tight truncate">
              {profile?.full_name || 'সদস্য'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {profile?.id ? `SM-${profile.id.slice(0, 4).toUpperCase()}` : 'SM-MEMBER'}
              </span>
              <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full bangla">
                এই লক্ষ্য
              </span>
            </div>
            <span className="text-[11px] text-slate-400 bangla block mt-0.5">
              সদস্য হিসেবে যুক্ত আছি
            </span>
          </div>
        </div>

        {/* 2x2 Financial Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">মোট অবদান</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {totalContributed.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">এই মাস</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {thisMonthContributed.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">আমার লক্ষ্য</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {myTarget.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 space-y-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 bangla block">অতিরিক্ত</span>
            <div className="text-[18px] font-black text-primary bangla">
              ৳ {excessAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Section: অবদানের ইতিহাস */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-bold text-text-primary bangla">অবদানের ইতিহাস</h3>
            <button
              onClick={() => navigate(`/goals/${goalId}/contributions`)}
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
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="text-[14px] font-black text-slate-800 bangla">
                        ৳ {Number(p.amount).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-400 bangla block">
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
              কোনো অবদানের রেকর্ড নেই।
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
