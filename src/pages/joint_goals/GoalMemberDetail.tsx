import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { supabase } from '../../lib/supabase';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar, 
  CreditCard, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  TrendingUp,
  Receipt,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GoalMemberDetail() {
  const { id: goalId, memberId } = useParams<{ id: string; memberId: string }>();
  const [searchParams] = useSearchParams();
  const planMemberIdParam = searchParams.get('planMemberId');
  const navigate = useNavigate();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [memberPlan, setMemberPlan] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  const loadData = async () => {
    if (!goalId || !memberId) return;
    setLoading(true);
    try {
      const g = await jointGoalService.getGoalById(goalId);
      setGoal(g);

      // Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single();
      setProfile(prof);

      // Fetch member_plan
      let mpQuery = supabase
        .from('member_plans')
        .select('*')
        .eq('plan_id', goalId)
        .eq('member_id', memberId);

      if (planMemberIdParam) {
        mpQuery = supabase.from('member_plans').select('*').eq('id', planMemberIdParam);
      }

      const { data: mps } = await mpQuery;
      const mp = mps && mps.length > 0 ? mps[0] : null;
      setMemberPlan(mp);

      if (mp) {
        // Fetch member payments
        const { data: payments } = await supabase
          .from('plan_payments')
          .select('*')
          .eq('member_plan_id', mp.id)
          .order('payment_date', { ascending: false });
        setContributions(payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [goalId, memberId]);

  const handleRemoveMember = async () => {
    if (!memberPlan) return;
    const confirm = window.confirm('আপনি কি নিশ্চিত যে এই সদস্যকে এই যৌথ লক্ষ্য থেকে অপসারণ করতে চান?');
    if (!confirm) return;

    setRemoving(true);
    try {
      await jointGoalService.removeMember(memberPlan.id);
      alert('সদস্যকে যৌথ লক্ষ্য থেকে অপসারণ করা হয়েছে');
      navigate(`/joint-goals/${goalId}?tab=members`);
    } catch (err: any) {
      alert('অপসারণে ব্যর্থ: ' + (err.message || ''));
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">সদস্যের তথ্য লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  const totalContributed = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const targetPerMember = goal?.installment_amount || 
    (goal?.target_amount && goal?.total_members_limit ? Math.round(goal.target_amount / goal.total_members_limit) : 10000);
  const remainingTarget = Math.max(0, targetPerMember - totalContributed);
  const lastPayment = contributions.length > 0 ? contributions[0] : null;

  return (
    <MobileLayout
      headerTitle="সদস্যের অবদান বিবরণী"
      headerSubtitle={goal?.name || 'যৌথ সঞ্চয় লক্ষ্য'}
      backTo={`/joint-goals/${goalId}?tab=members`}
      showBack={true}
      headerRight={
        memberPlan ? (
          <button 
            onClick={handleRemoveMember}
            disabled={removing}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title="সদস্য অপসারণ"
            aria-label="সদস্য অপসারণ"
          >
            {removing ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={21} strokeWidth={2.2} />}
          </button>
        ) : null
      }
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Member Profile Card */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-[20px] bangla shrink-0">
            {profile?.full_name?.charAt(0) || 'স'}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-black text-text-primary bangla leading-tight truncate">
              {profile?.full_name || 'সদস্য নাম'}
            </h2>
            <div className="flex items-center gap-2 text-[12px] text-slate-500 bangla mt-1">
              <Phone size={12} className="text-slate-400" />
              <span>{profile?.phone || 'ফোন নম্বর নেই'}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bangla mt-0.5">
              <Calendar size={12} />
              <span>যুক্ত হয়েছেন: {memberPlan?.start_date || 'তথ্য নেই'}</span>
            </div>
          </div>
        </div>

        {/* 4-Grid Financial Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 bangla">মোট অবদান</span>
            <div className="text-[20px] font-black text-emerald-700 bangla">
              ৳{totalContributed.toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-600 bangla">সফলভাবে পরিশোধিত</p>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-amber-800 bangla">বাকি লক্ষ্য</span>
            <div className="text-[20px] font-black text-amber-700 bangla">
              ৳{remainingTarget.toLocaleString()}
            </div>
            <p className="text-[10px] text-amber-600 bangla">প্রত্যাশিত অংশ থেকে</p>
          </div>

          <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-sky-800 bangla">শেষ অবদান</span>
            <div className="text-[16px] font-black text-sky-700 bangla truncate">
              {lastPayment ? `৳${Number(lastPayment.amount).toLocaleString()}` : 'নেই'}
            </div>
            <p className="text-[10px] text-sky-600 bangla">{lastPayment?.payment_date || 'তারিখ নেই'}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-slate-700 bangla">মোট কিস্তি/জমা</span>
            <div className="text-[20px] font-black text-slate-800 bangla">
              {contributions.length} টি
            </div>
            <p className="text-[10px] text-slate-500 bangla">লেনদেন সম্পন্ন</p>
          </div>
        </div>

        {/* Primary CTA: অবদান জমা দিন */}
        <button
          onClick={() => navigate(`/joint-goals/${goalId}/contribute?memberPlanId=${memberPlan?.id}`)}
          className="w-full py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-primary-dark"
        >
          <Plus size={18} />
          <span>নতুন অবদান জমা দিন</span>
        </button>

        {/* Individual Contributions History List */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-[14px] font-bold text-slate-800 bangla">ব্যক্তিগত অবদান তালিকা</h3>
            <span className="text-[12px] text-slate-500 bangla">{contributions.length} টি রেকর্ড</span>
          </div>

          {contributions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {contributions.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <ArrowUpRight size={20} />
                    </div>
                    <div>
                      <div className="text-[14px] font-black text-emerald-700 bangla">
                        +৳{Number(c.amount).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 bangla mt-0.5">
                        <span>{c.payment_date}</span>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold">{c.note || 'নগদ'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bangla px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    অনুমোদিত
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 bangla text-[13px]">
              এই সদস্য এখনো কোনো অবদান জমা দেননি।
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
