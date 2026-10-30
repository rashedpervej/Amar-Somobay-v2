import React, { useState, useEffect } from 'react';
import { SomobayPlan, MemberPlan, RoscaPeriod, useSomobayStore } from '../../store/useSomobayStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Dices, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  AlertCircle,
  ChevronRight,
  History,
  RotateCw,
  Gift,
  X
} from 'lucide-react';

interface RoscaManagerProps {
  plan: SomobayPlan;
  enrolledMembers: MemberPlan[];
  onRefresh?: () => void;
}

export const RoscaManager: React.FC<RoscaManagerProps> = ({ plan, enrolledMembers, onRefresh }) => {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { fetchRoscaPeriods, conductRoscaDraw, generateRoscaSchedule } = useSomobayStore();

  const [periods, setPeriods] = useState<RoscaPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [activePeriod, setActivePeriod] = useState<RoscaPeriod | null>(null);
  
  // Draw modal states
  const [drawMode, setDrawMode] = useState<'lottery' | 'turn'>('lottery');
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerAnnounced, setWinnerAnnounced] = useState<any>(null);
  const [drawNote, setDrawNote] = useState('');

  const totalPeriods = plan.duration_months || 12;
  const potAmount = (enrolledMembers.length > 0 ? enrolledMembers.length : (plan.total_members_limit || 12)) * plan.installment_amount;

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const data = await fetchRoscaPeriods(plan.id);
      setPeriods(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, [plan.id]);

  const handleGenerateSchedule = async () => {
    try {
      setLoading(true);
      await generateRoscaSchedule(plan.id, totalPeriods, plan.current_cycle || 1);
      await loadPeriods();
      alert('সফলভাবে পালাক্রমিক সময়সূচী তৈরি হয়েছে!');
    } catch (e: any) {
      alert('শিডিউল তৈরি করতে সমস্যা হয়েছে: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Find who has already received payout in this cycle
  const receivedRecipientIds = new Set(
    periods.filter(p => p.status === 'drawn' && p.recipient_id).map(p => p.recipient_id!)
  );

  // Eligible members who haven't won yet
  const eligibleMembers = enrolledMembers.filter(m => !receivedRecipientIds.has(m.member_id));

  // Determine current / next open period
  const nextOpenPeriod = periods.find(p => p.status === 'open');
  const isCycleCompleted = periods.length > 0 && periods.every(p => p.status === 'drawn');

  const startDrawForPeriod = (period: RoscaPeriod) => {
    setActivePeriod(period);
    setSelectedWinnerId('');
    setWinnerAnnounced(null);
    setDrawNote('');
    setShowDrawModal(true);
  };

  const handleRandomDraw = () => {
    if (eligibleMembers.length === 0) {
      alert('ড্র করার মতো কোনো যোগ্য সদস্য নেই!');
      return;
    }
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
      setSelectedWinnerId(eligibleMembers[randomIndex].member_id);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        const finalWinnerIndex = Math.floor(Math.random() * eligibleMembers.length);
        const winner = eligibleMembers[finalWinnerIndex];
        setSelectedWinnerId(winner.member_id);
        setWinnerAnnounced(winner);
        setIsSpinning(false);
      }
    }, 100);
  };

  const confirmDrawSubmission = async () => {
    if (!activePeriod || !selectedWinnerId) {
      alert('দয়া করে প্রাপক নির্ধারণ করুন।');
      return;
    }
    try {
      await conductRoscaDraw(
        activePeriod.id,
        selectedWinnerId,
        potAmount,
        drawMode,
        drawNote || `${activePeriod.period_no}ম পালার ড্র`
      );
      setShowDrawModal(false);
      await loadPeriods();
      if (onRefresh) onRefresh();
      alert('অভিনন্দন! সফলভাবে ড্র সম্পন্ন হয়েছে এবং প্রাপককে নির্ধারণ করা হয়েছে।');
    } catch (e: any) {
      alert('ড্র সংরক্ষণ করতে ত্রুটি হয়েছে: ' + (e.message || ''));
    }
  };

  return (
    <div className="space-y-6">
      {/* ROSCA Top Highlight Card */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200 bangla bg-white/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <RotateCw size={12} />
                <span>রোটেশনাল সঞ্চয় চক্র (ROSCA)</span>
              </span>
              <h3 className="text-[22px] font-black bangla mt-2">
                প্রতি পালায় পুল: ৳{potAmount.toLocaleString()}
              </h3>
              <p className="text-[12px] text-purple-200/80 bangla mt-0.5">
                {enrolledMembers.length} জন সদস্য × ৳{plan.installment_amount.toLocaleString()} কিস্তি
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300">
              <Trophy size={26} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-center">
              <span className="text-[10px] text-purple-200 bangla block font-medium">সম্পন্ন ড্র</span>
              <span className="text-[16px] font-bold bangla text-white">
                {periods.filter(p => p.status === 'drawn').length} / {totalPeriods}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-center">
              <span className="text-[10px] text-purple-200 bangla block font-medium">ইতিমধ্যে পেয়েছেন</span>
              <span className="text-[16px] font-bold bangla text-emerald-300">
                {receivedRecipientIds.size} জন
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-center">
              <span className="text-[10px] text-purple-200 bangla block font-medium">বাকি সদস্য</span>
              <span className="text-[16px] font-bold bangla text-amber-300">
                {eligibleMembers.length} জন
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Banner: Conduct Next Draw or Generate Schedule */}
      {periods.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 text-center border border-slate-100 dark:border-slate-800 space-y-3">
          <Clock size={36} className="mx-auto text-purple-500 opacity-80" />
          <h4 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 bangla">
            পালাক্রমিক সময়সূচী তৈরি করা হয়নি
          </h4>
          <p className="text-[12px] text-slate-400 bangla max-w-[280px] mx-auto">
            {totalPeriods} মাসের জন্য ড্র শিডিউল স্বয়ংক্রিয়ভাবে তৈরি করতে নিচের বাটনে চাপ দিন।
          </p>
          <button
            onClick={handleGenerateSchedule}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold bangla text-[14px] shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            {totalPeriods} মাসের ড্র শিডিউল তৈরি করুন
          </button>
        </div>
      ) : isCycleCompleted ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-[28px] p-6 text-center space-y-2">
          <Sparkles size={36} className="mx-auto text-emerald-500" />
          <h4 className="text-[18px] font-black text-emerald-800 dark:text-emerald-200 bangla flex items-center justify-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <span>বর্তমান Cycle সম্পন্ন হয়েছে!</span>
          </h4>
          <p className="text-[12px] text-emerald-600 dark:text-emerald-400 bangla">
            সকল সদস্য একবার করে পুরো পুল পেয়েছেন।
          </p>
        </div>
      ) : nextOpenPeriod && (
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-[28px] p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bangla">
              পরবর্তী পালা: {nextOpenPeriod.period_no}/{totalPeriods}
            </span>
            <h4 className="text-[16px] font-black text-slate-800 dark:text-slate-100 bangla mt-0.5">
              এই পালার লটারি / প্রাপক নির্ধারণ
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 bangla">
              পুরো পুলের পরিমাণ: ৳{potAmount.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => startDrawForPeriod(nextOpenPeriod)}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold bangla text-[13px] shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            <Dices size={18} />
            <span>ড্র করুন</span>
          </button>
        </div>
      )}

      {/* 12-Period Visual Transparency Grid Board */}
      {periods.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">
                চক্রের সার্বিক চিত্র (Cycle Transparency Board)
              </h4>
            </div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bangla">
              {periods.filter(p => p.status === 'drawn').length}/{totalPeriods} সম্পন্ন
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {periods.map((p) => {
              const isDrawn = p.status === 'drawn';
              const isCurrent = p.id === nextOpenPeriod?.id;
              const winner = enrolledMembers.find(m => m.member_id === p.recipient_id);

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[92px] ${
                    isDrawn
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100'
                      : isCurrent
                        ? 'bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-500 shadow-md shadow-purple-500/10'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black bangla px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
                      রাউন্ড {p.period_no}
                    </span>
                    {isDrawn ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bangla flex items-center gap-0.5">
                        <CheckCircle2 size={12} /> পেয়েছেন
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bangla animate-pulse">
                        পরবর্তী ড্র
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bangla">অপেক্ষমান</span>
                    )}
                  </div>

                  <div>
                    {isDrawn ? (
                      <div>
                        <p className="text-xs font-bold bangla text-slate-900 dark:text-slate-100 truncate">
                          {winner?.profile?.full_name || 'প্রাপক'}
                        </p>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bangla">
                          ৳{Number(p.payout_amount || potAmount).toLocaleString()} পেয়েছেন
                        </span>
                      </div>
                    ) : isCurrent ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bangla">
                          ড্র বাকি
                        </span>
                        <button
                          onClick={() => startDrawForPeriod(p)}
                          className="px-2 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-lg bangla active:scale-95 transition-transform"
                        >
                          ড্র
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 bangla">লটারি নির্ধারিত হবে</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Eligible Members List (Waiting for Draw) */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-purple-500" />
            <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">
              পরবর্তী ড্রয়ের যোগ্য সদস্যবৃন্দ ({eligibleMembers.length} জন)
            </h4>
          </div>
        </div>

        {eligibleMembers.length === 0 ? (
          <p className="text-[13px] text-slate-400 bangla text-center py-4">
            কোনো যোগ্য সদস্য বাকি নেই অথবা সবাই টাকা পেয়ে গেছেন।
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {eligibleMembers.map((m) => (
              <div 
                key={m.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs bangla">
                    {m.profile?.full_name?.charAt(0) || 'স'}
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 bangla block leading-tight">
                      {m.profile?.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400 bangla">
                      মোট জমা: ৳{m.total_collected.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold bangla">
                  অপেক্ষমান
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draw History Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-purple-500" />
          <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">
            ড্র ও পালার ইতিহাস (Draw History)
          </h4>
        </div>

        <div className="space-y-3">
          {periods.map((p) => {
            const isDrawn = p.status === 'drawn';
            const winner = enrolledMembers.find(m => m.member_id === p.recipient_id);

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isDrawn 
                    ? 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30' 
                    : 'bg-slate-50/40 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black bangla ${
                    isDrawn ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {p.period_no}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 bangla">
                        পালা {p.period_no}
                      </span>
                      {isDrawn ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold bangla">
                          সম্পন্ন
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold bangla">
                          খোলা
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 bangla block">
                      {isDrawn ? (
                        <>প্রাপক: <strong className="text-purple-600 dark:text-purple-400">{winner?.profile?.full_name || p.recipient?.full_name || 'সদস্য'}</strong> ({p.draw_method === 'lottery' ? 'লটারি' : 'নির্ধারিত'})</>
                      ) : (
                        'ড্র এখনো হয়নি'
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[14px] font-black bangla block text-slate-800 dark:text-slate-200">
                    ৳{(p.payout_amount || potAmount).toLocaleString()}
                  </span>
                  {!isDrawn && (
                    <button
                      onClick={() => startDrawForPeriod(p)}
                      className="text-[11px] text-purple-600 dark:text-purple-400 font-bold bangla underline hover:opacity-80"
                    >
                      ড্র করুন
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Draw Execution Modal */}
      <AnimatePresence>
        {showDrawModal && activePeriod && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDrawModal(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 100, opacity: 0 }} 
              className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[32px] p-6 relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bangla">
                    পালা {activePeriod.period_no} এর ড্র
                  </span>
                  <h3 className="text-[18px] font-black text-slate-800 dark:text-slate-100 bangla">
                    প্রাপক নির্ধারণ ও পুল হস্তান্তর
                  </h3>
                </div>
                <button 
                  onClick={() => setShowDrawModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Pot info */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/30 text-center mb-5">
                <span className="text-[11px] text-purple-600 dark:text-purple-400 bangla font-bold block">এই পালায় প্রাপক পাবেন</span>
                <span className="text-[26px] font-black text-purple-700 dark:text-purple-300 bangla block">
                  ৳{potAmount.toLocaleString()}
                </span>
              </div>

              {/* Method tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => setDrawMode('lottery')}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold bangla transition-all flex items-center justify-center gap-1.5 ${
                    drawMode === 'lottery' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <Dices size={15} />
                  <span>লটারি (Random)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawMode('turn')}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold bangla transition-all flex items-center justify-center gap-1.5 ${
                    drawMode === 'turn' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <Users size={15} />
                  <span>সরাসরি নির্বাচন</span>
                </button>
              </div>

              {drawMode === 'lottery' ? (
                <div className="space-y-4 mb-5">
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {isSpinning ? (
                      <div className="space-y-2">
                        <Dices size={36} className="mx-auto text-purple-500 animate-spin" />
                        <span className="text-[14px] font-bold text-purple-600 bangla block animate-pulse">
                          লটারি ঘুরছে...
                        </span>
                      </div>
                    ) : winnerAnnounced ? (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                          <Trophy size={24} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 bangla block">নির্বাচিত প্রাপক:</span>
                        <h4 className="text-[18px] font-black text-slate-800 dark:text-slate-100 bangla">
                          {winnerAnnounced.profile?.full_name}
                        </h4>
                      </motion.div>
                    ) : (
                      <div className="space-y-2">
                        <Gift size={36} className="mx-auto text-slate-300" />
                        <span className="text-[12px] text-slate-400 bangla block">
                          যোগ্য {eligibleMembers.length} জনের মধ্য থেকে ড্র করতে নিচের বাটনে চাপ দিন
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRandomDraw}
                    disabled={isSpinning || eligibleMembers.length === 0}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold bangla text-[14px] shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Dices size={18} />
                    <span>{winnerAnnounced ? 'পুনরায় লটারি করুন' : 'লটারি পরিচালনা করুন'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mb-5">
                  <label className="text-[12px] font-bold text-slate-400 bangla ml-1">প্রাপক সদস্য নির্বাচন করুন</label>
                  <select
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[14px]"
                    value={selectedWinnerId}
                    onChange={(e) => setSelectedWinnerId(e.target.value)}
                  >
                    <option value="">-- সদস্য বেছে নিন --</option>
                    {eligibleMembers.map((m) => (
                      <option key={m.member_id} value={m.member_id}>
                        {m.profile?.full_name} (জমা: ৳{m.total_collected.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note input */}
              <div className="space-y-1.5 mb-6">
                <label className="text-[12px] font-bold text-slate-400 bangla ml-1">নোট বা মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমনঃ বিশেষ সভার উপস্থিতিতে ড্র"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none bangla text-[13px]"
                  value={drawNote}
                  onChange={(e) => setDrawNote(e.target.value)}
                />
              </div>

              {/* Confirm button */}
              <button
                type="button"
                onClick={confirmDrawSubmission}
                disabled={!selectedWinnerId || isSpinning}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold bangla text-[15px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                নিশ্চিত করুন ও পেআউট রেকর্ড করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
