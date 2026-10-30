import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan, MemberPlan, RoscaPeriod, PlanPayment } from '../../store/useSomobayStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ArrowLeft, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Banknote, 
  Trophy, 
  CreditCard, 
  FileText, 
  Loader2,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RoscaMemberDetail() {
  const { id, memberId } = useParams<{ id: string; memberId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const [plan, setPlan] = useState<SomobayPlan | null>(null);
  const [memberPlan, setMemberPlan] = useState<MemberPlan | null>(null);
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [periods, setPeriods] = useState<RoscaPeriod[]>([]);
  const [payments, setPayments] = useState<PlanPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'summary' | 'installments' | 'transactions' | 'notices'
  const [activeTab, setActiveTab] = useState<'summary' | 'installments' | 'transactions' | 'notices'>('summary');

  // Single Installment Deposit Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [payNote, setPayNote] = useState('কিস্তি পরিশোধ');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id || !memberId) return;

    const loadMemberData = async () => {
      setLoading(true);
      try {
        const planData = await roscaService.getRoscaPlanById(id);
        setPlan(planData);
        if (planData) setPayAmount(planData.installment_amount);

        // Fetch member profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .single();
        setMemberProfile(prof);

        // Fetch member plan enrollment
        const { data: mp } = await supabase
          .from('member_plans')
          .select('*')
          .eq('plan_id', id)
          .eq('member_id', memberId)
          .maybeSingle();
        setMemberPlan(mp);

        // Fetch rosca periods
        const periodsData = await roscaService.getRoscaPeriods(id);
        setPeriods(periodsData);

        // Fetch payments for this member plan
        if (mp) {
          const { data: paymentsData } = await supabase
            .from('plan_payments')
            .select('*')
            .eq('member_plan_id', mp.id)
            .order('payment_date', { ascending: false });
          setPayments(paymentsData || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadMemberData();
  }, [id, memberId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('অননুমোদিত অ্যাকশন: শুধুমাত্র অ্যাডমিন কিস্তি রেকর্ড করতে পারবেন।');
      return;
    }
    if (!memberPlan || !profile?.id) return;
    try {
      setPaying(true);
      await roscaService.recordInstallment({
        memberPlanId: memberPlan.id,
        amount: payAmount,
        adminId: profile.id,
        note: payNote
      });
      setShowPayModal(false);
      // Reload payments
      const { data: paymentsData } = await supabase
        .from('plan_payments')
        .select('*')
        .eq('member_plan_id', memberPlan.id)
        .order('payment_date', { ascending: false });
      setPayments(paymentsData || []);
      alert('কিস্তি সফলভাবে জমা করা হয়েছে!');
    } catch (err: any) {
      alert('কিস্তি জমা করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setPaying(false);
    }
  };

  if (loading || !memberProfile) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[14px] bangla">লোড হচ্ছে...</span>
        </div>
      </MobileLayout>
    );
  }

  const durationMonths = plan?.duration_months || 12;
  const installmentAmount = plan?.installment_amount || 0;
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const paidMonthsCount = installmentAmount > 0 ? Math.floor(totalPaid / installmentAmount) : 0;

  // Check if this member won any period in this cycle
  const wonPeriod = periods.find(p => p.recipient_id === memberId && p.status === 'drawn');
  const hasWon = !!wonPeriod;
  const lastPayment = payments[0]?.payment_date;

  return (
    <MobileLayout
      headerTitle="সদস্যের বিস্তারিত"
      showBack={true}
    >
      {/* Member Profile Hero Card (Screen 4) */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-xs flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xl bangla overflow-hidden shadow-xs border-2 border-white mb-2">
          {memberProfile.avatar_url ? (
            <img src={memberProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            memberProfile.full_name?.charAt(0) || 'স'
          )}
        </div>

        <h2 className="text-[17px] font-bold text-text-primary bangla leading-tight">
          {memberProfile.full_name}
        </h2>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11.5px] font-mono text-text-secondary">
            SM-{memberId.slice(0, 4).toUpperCase()}
          </span>
          {hasWon ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E0E7FF] text-[#4338CA] bangla">
              ড্র পেয়েছে
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary bangla">
              সক্রিয়
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 text-[11px] text-text-secondary bangla mt-2 pt-2 border-t border-slate-100 w-full">
          <span className="flex items-center gap-1 font-mono">
            <Phone size={12} /> {memberProfile.phone || 'ফোন নম্বর নেই'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar size={12} /> যোগদান: {memberPlan?.start_date ? new Date(memberPlan.start_date).toLocaleDateString('bn-BD') : '—'}
          </span>
        </div>
      </div>

      {/* Internal Tabs: সারসংক্ষেপ | কিস্তি | লেনদেন | নোটিস */}
      <div className="flex border-b border-border gap-4 text-[13px] bangla font-medium">
        {[
          { key: 'summary', label: 'সারসংক্ষেপ' },
          { key: 'installments', label: 'কিস্তি' },
          { key: 'transactions', label: 'লেনদেন' },
          { key: 'notices', label: 'নোটিস' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`pb-2 whitespace-nowrap relative transition-colors ${
              activeTab === t.key ? 'text-primary font-bold' : 'text-text-secondary'
            }`}
          >
            {t.label}
            {activeTab === t.key && (
              <motion.div layoutId="member-subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Financial Summary 4-Grid Box (Screen 4) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">মোট জমা</span>
          <span className="text-[17px] font-bold text-text-primary bangla block mt-0.5">
            ৳ {totalPaid.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">মোট কিস্তি</span>
          <span className="text-[17px] font-bold text-text-primary bangla block mt-0.5">
            ৳ {installmentAmount.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">ড্র পেয়েছে</span>
          <span className={`text-[13px] font-bold bangla block mt-0.5 ${hasWon ? 'text-[#4338CA]' : 'text-slate-400'}`}>
            {hasWon ? `মাস ${wonPeriod.period_no}` : 'এখনও পায়নি'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">শেষ পরিশোধ</span>
          <span className="text-[13px] font-bold text-text-primary bangla block mt-0.5">
            {lastPayment ? new Date(lastPayment).toLocaleDateString('bn-BD') : 'তথ্য নেই'}
          </span>
        </div>
      </div>

      {/* 12-Month Installment Indicator Grid (Screen 4 Highlight Component) */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
        <h3 className="text-[14px] font-bold text-text-primary bangla">
          কিস্তির অবস্থা (এই চক্র)
        </h3>

        {/* 12-Month Indicator Pill Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {Array.from({ length: durationMonths }).map((_, i) => {
            const monthNo = i + 1;
            const isWinnerMonth = wonPeriod?.period_no === monthNo;
            const isPaid = monthNo <= paidMonthsCount;
            const isDue = monthNo > paidMonthsCount && monthNo <= 5;

            let bgColor = 'bg-slate-100 text-slate-400';
            if (isWinnerMonth) bgColor = 'bg-[#E0E7FF] text-[#4338CA] ring-2 ring-[#4338CA] font-bold';
            else if (isPaid) bgColor = 'bg-primary-light text-primary font-bold';
            else if (isDue) bgColor = 'bg-amber-100 text-amber-700 font-bold';

            return (
              <div
                key={monthNo}
                className={`h-9 rounded-xl flex items-center justify-center font-mono text-[13px] transition-all ${bgColor}`}
                title={`মাস ${monthNo}`}
              >
                {monthNo}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-around text-[10.5px] font-semibold bangla pt-1 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>পরিশোধিত</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>বকেয়া/চলমান</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4338CA]" />
            <span>ড্র পেয়েছে</span>
          </div>
        </div>
      </div>

      {/* Transactions History list if activeTab is transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-2">
          <h4 className="text-[13px] font-bold text-text-primary bangla">লেনদেনের ইতিহাস</h4>
          {payments.length === 0 ? (
            <p className="text-[12px] text-slate-400 bangla text-center py-4 bg-white rounded-xl border border-border">
              এখনও কোনো পেমেন্ট রেকর্ড নেই।
            </p>
          ) : (
            payments.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-border flex justify-between items-center text-[13px] bangla">
                <div>
                  <span className="font-bold text-text-primary block">{p.note || 'কিস্তি জমা'}</span>
                  <span className="text-[11px] text-text-secondary">{p.payment_date}</span>
                </div>
                <span className="font-bold text-primary">৳ {Number(p.amount).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Action Buttons (Screen 4) */}
      <div className="flex gap-2.5 pt-1">
        {isAdmin && (
          <button
            onClick={() => setShowPayModal(true)}
            className="flex-1 h-[46px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[14px] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all"
          >
            <span>কিস্তি রেকর্ড করুন</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('transactions')}
          className="flex-1 h-[46px] bg-white border border-border hover:bg-slate-50 text-text-primary rounded-xl font-semibold bangla text-[14px] flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
        >
          <span>লেনদেন দেখুন</span>
        </button>
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[380px] bg-white rounded-3xl p-5 relative z-10 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="text-[16px] font-bold text-text-primary bangla">কিস্তি জমা রেকর্ড</h3>
                <button onClick={() => setShowPayModal(false)} className="text-slate-400 p-1">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-text-primary bangla">পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-[15px] font-bold bangla outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-text-primary bangla">নোট / বিবরণ</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-[13px] bangla outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-slate-600 font-semibold bangla text-[13px]"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={paying}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[13px] flex items-center justify-center gap-1.5"
                  >
                    {paying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>জমা সম্পন্ন করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
