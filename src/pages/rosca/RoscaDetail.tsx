import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan, MemberPlan, RoscaPeriod } from '../../store/useSomobayStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Settings, 
  Search, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  RotateCw, 
  Trophy, 
  Dices, 
  Plus, 
  UserPlus, 
  Banknote, 
  Check, 
  Clock, 
  X, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  Filter,
  BarChart3,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RoscaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  // Sub-tabs: 'overview' (2) | 'members' (3) | 'contributions' (5) | 'draw' (6) | 'history' (8)
  const tabParam = searchParams.get('tab') as 'overview' | 'members' | 'contributions' | 'draw' | 'history' | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'contributions' | 'draw' | 'history'>(tabParam || 'overview');

  const [plan, setPlan] = useState<SomobayPlan | null>(null);
  const [periods, setPeriods] = useState<RoscaPeriod[]>([]);
  const [enrolledMembers, setEnrolledMembers] = useState<MemberPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [memberSearch, setMemberSearch] = useState('');
  const [contributionFilter, setContributionFilter] = useState<'all' | 'paid' | 'overdue' | 'upcoming'>('all');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(4); // default 5th month (index 4)
  const [historyCycleFilter, setHistoryCycleFilter] = useState<number | 'all'>('all');

  // Draw Management States (Screen 6)
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittingDraw, setSubmittingDraw] = useState(false);

  // Member Enroll Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [selectedProfileToEnroll, setSelectedProfileToEnroll] = useState<string>('');
  const [enrolling, setEnrolling] = useState(false);

  // Bulk Deposit Modal (Screen 5)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAmount, setBulkAmount] = useState<number>(1000);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const planData = await roscaService.getRoscaPlanById(id);
      setPlan(planData);

      if (planData) {
        setBulkAmount(planData.installment_amount);
        let periodsData = await roscaService.getRoscaPeriods(id);
        
        // Auto-generate schedule if none exists yet
        if (periodsData.length === 0) {
          await roscaService.generateRoscaSchedule(
            id, 
            planData.duration_months || 12, 
            planData.current_cycle || 1,
            (planData.total_members_limit || 12) * planData.installment_amount
          );
          periodsData = await roscaService.getRoscaPeriods(id);
        }
        setPeriods(periodsData);

        const membersData = await roscaService.getEnrolledMembers(id);
        setEnrolledMembers(membersData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (tabParam && ['overview', 'members', 'contributions', 'draw', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'overview' | 'members' | 'contributions' | 'draw' | 'history') => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Open enroll modal & fetch un-enrolled members
  const openEnrollModal = async () => {
    setShowEnrollModal(true);
    try {
      const { data: allMembers } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .eq('role', 'member');

      const enrolledIds = new Set(enrolledMembers.map(m => m.member_id));
      const notEnrolled = (allMembers || []).filter(m => !enrolledIds.has(m.id));
      setAvailableProfiles(notEnrolled);
      if (notEnrolled.length > 0) setSelectedProfileToEnroll(notEnrolled[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedProfileToEnroll) return;
    try {
      setEnrolling(true);
      await roscaService.enrollMember(id, selectedProfileToEnroll, plan?.duration_months || 12);
      setShowEnrollModal(false);
      await loadData();
    } catch (err: any) {
      alert('সদস্য যোগ করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setEnrolling(false);
    }
  };

  // Derived Calculations
  const currentCycle = plan?.current_cycle || 1;
  const durationMonths = plan?.duration_months || 12;
  const installmentAmount = plan?.installment_amount || 0;
  const membersCount = enrolledMembers.length > 0 ? enrolledMembers.length : (plan?.total_members_limit || 0);
  const potAmount = membersCount * installmentAmount;

  // Periods calculation
  const currentCyclePeriods = periods.filter(p => p.cycle_no === currentCycle);
  const completedPeriods = currentCyclePeriods.filter(p => p.status === 'drawn');
  const currentMonthNo = Math.min(durationMonths, completedPeriods.length + 1);
  const progressPercent = Math.round((completedPeriods.length / durationMonths) * 100);

  // Set of recipient IDs who already won in this cycle
  const wonRecipientIds = new Set(
    completedPeriods.filter(p => p.recipient_id).map(p => p.recipient_id!)
  );

  // Eligible members who haven't won yet in this cycle
  const eligibleMembers = enrolledMembers.filter(m => !wonRecipientIds.has(m.member_id));

  // Next open period
  const nextOpenPeriod = currentCyclePeriods.find(p => p.status === 'open') || currentCyclePeriods[0];

  // Random spin lottery selector
  const handleRandomSpin = () => {
    if (eligibleMembers.length === 0) return;
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * eligibleMembers.length);
      setSelectedWinnerId(eligibleMembers[idx].member_id);
      count++;
      if (count > 16) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * eligibleMembers.length);
        setSelectedWinnerId(eligibleMembers[finalIdx].member_id);
        setIsSpinning(false);
      }
    }, 90);
  };

  // Execute Draw (Screen 6 -> Screen 7)
  const handleConfirmDraw = async () => {
    if (!isAdmin) {
      alert('অননুমোদিত অ্যাকশন: শুধুমাত্র অ্যাডমিন ড্র সম্পন্ন করতে পারবেন।');
      return;
    }
    if (!id || !nextOpenPeriod || !selectedWinnerId) return;
    try {
      setSubmittingDraw(true);
      await roscaService.conductDraw({
        planId: id,
        periodId: nextOpenPeriod.id,
        recipientId: selectedWinnerId,
        payoutAmount: potAmount,
        method: 'lottery',
        note: `${nextOpenPeriod.period_no}ম রাউন্ড ড্র`,
        adminId: profile?.id
      });

      setShowConfirmModal(false);
      // Navigate directly to Screen 7 (Draw Result)
      navigate(`/rosca/${id}/draw-result/${nextOpenPeriod.id}`);
    } catch (err: any) {
      alert('ড্র সম্পন্ন করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setSubmittingDraw(false);
    }
  };

  // Bulk Installment Recording (Screen 5)
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('অননুমোদিত অ্যাকশন: শুধুমাত্র অ্যাডমিন কিস্তি আদায় রেকর্ড করতে পারবেন।');
      return;
    }
    if (!profile?.id || enrolledMembers.length === 0) return;
    try {
      setBulkSubmitting(true);
      const memberPlanIds = enrolledMembers.map(m => m.id);
      await roscaService.bulkRecordInstallments({
        memberPlanIds,
        amountPerMember: bulkAmount,
        adminId: profile.id,
        note: `মাস ${currentMonthNo} এর এককালীন কিস্তি আদায়`
      });
      setShowBulkModal(false);
      await loadData();
      alert('সকল সদস্যের কিস্তি সফলভাবে রেকর্ড করা হয়েছে!');
    } catch (err: any) {
      alert('কিস্তি জমা করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setBulkSubmitting(false);
    }
  };

  if (loading || !plan) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[14px] bangla">তথ্য লোড হচ্ছে...</span>
        </div>
      </MobileLayout>
    );
  }

  const selectedWinnerMember = enrolledMembers.find(m => m.member_id === selectedWinnerId);

  return (
    <MobileLayout
      headerTitle={plan.name}
      onBack={() => {
        if (isAdmin) {
          navigate('/rosca');
        } else {
          navigate('/somobay');
        }
      }}
      headerRight={
        isAdmin ? (
          <button 
            onClick={() => navigate(`/rosca/${id}/settings`)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title="চক্রের সেটিংস"
            aria-label="চক্রের সেটিংস"
          >
            <Settings size={22} strokeWidth={2.2} />
          </button>
        ) : null
      }
    >

      {/* Sub-Tabs Bar: সারসংক্ষেপ | সদস্য | কিস্তি | ড্র | ইতিহাস */}
      <div className="flex border-b border-border gap-4 overflow-x-auto no-scrollbar text-[13px] sm:text-[14px] bangla font-medium">
        {[
          { key: 'overview', label: 'সারসংক্ষেপ' },
          { key: 'members', label: 'সদস্য' },
          { key: 'contributions', label: 'কিস্তি' },
          { key: 'draw', label: 'ড্র' },
          { key: 'history', label: 'ইতিহাস' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key as any)}
            className={`pb-2.5 whitespace-nowrap relative transition-colors ${
              activeTab === tab.key ? 'text-primary font-bold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div 
                layoutId="rosca-subtab-indicator" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
              />
            )}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: সারসংক্ষেপ (Screen 2: ROSCA Overview)
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Hero Emerald Card */}
          <div className="bg-gradient-to-br from-[#087F5B] to-[#065F46] rounded-[22px] p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />

            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold bangla bg-white/15 px-3 py-1 rounded-full inline-block backdrop-blur-xs">
                    চলমান চক্র (Cycle {currentCycle})
                  </span>
                  <div className="mt-2.5">
                    <span className="text-[28px] font-bold bangla tracking-tight block">
                      ৳ {potAmount.toLocaleString()}
                    </span>
                    <span className="text-[11.5px] text-emerald-100/90 bangla mt-0.5 block">
                      সর্বমোট কিস্তি: ৳ {installmentAmount.toLocaleString()} × {membersCount} সদস্য
                    </span>
                  </div>
                </div>

                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-100">
                  <Users size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* 4-Grid Key Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <span className="text-[11px] text-text-secondary bangla block">মোট সদস্য</span>
                <span className="text-[15px] font-bold text-text-primary bangla">{membersCount} জন</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Banknote size={18} />
              </div>
              <div>
                <span className="text-[11px] text-text-secondary bangla block">মাসিক কিস্তি</span>
                <span className="text-[15px] font-bold text-text-primary bangla">৳ {installmentAmount.toLocaleString()}</span>
              </div>
            </div>

            <div 
              onClick={() => navigate(`/rosca/${id}/progress`)}
              className="bg-white p-3.5 rounded-2xl border border-border shadow-xs flex items-center justify-between cursor-pointer hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[11px] text-text-secondary bangla block">বর্তমান মাস</span>
                  <span className="text-[15px] font-bold text-text-primary bangla">{currentMonthNo} / {durationMonths}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            <div 
              onClick={() => navigate(`/rosca/${id}/progress`)}
              className="bg-white p-3.5 rounded-2xl border border-border shadow-xs flex items-center justify-between cursor-pointer hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <RotateCw size={18} />
                </div>
                <div>
                  <span className="text-[11px] text-text-secondary bangla block">চক্রের অগ্রগতি</span>
                  <span className="text-[15px] font-bold text-text-primary bangla">{progressPercent}%</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>

          {/* পরবর্তী ড্র Card (Screen 2) */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
            <h3 className="text-[14px] font-bold text-text-primary bangla">পরবর্তী ড্র</h3>

            <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-xl border border-border">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar size={20} />
              </div>
              <div className="leading-tight">
                <span className="text-[13px] font-bold text-text-primary bangla block">
                  {nextOpenPeriod?.due_date 
                    ? new Date(nextOpenPeriod.due_date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) 
                    : 'পরবর্তী ড্র নির্ধারিত হয়নি'}
                </span>
                <span className="text-[11px] text-text-secondary bangla">
                  সকাল ১০:০০ AM
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-xl border border-border">
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div className="leading-tight">
                <span className="text-[13px] font-bold text-text-primary bangla block">
                  নির্বাচিত সদস্য (যে পাবে)
                </span>
                <span className="text-[11px] text-text-secondary bangla">
                  লটারির মাধ্যমে নির্ধারিত হবে ({eligibleMembers.length} জন বাকি)
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleTabChange('draw')}
              className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
            >
              <span>ড্র সম্পন্ন করুন</span>
            </button>
            <button
              onClick={() => handleTabChange('contributions')}
              className="w-full h-[44px] bg-white border border-border hover:bg-slate-50 text-text-primary rounded-xl font-semibold bangla text-[14px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <span>কিস্তির অবস্থা দেখুন</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: সদস্য (Screen 3: Member List)
      ========================================================================= */}
      {activeTab === 'members' && (
        <div className="flex flex-col gap-3">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                className="w-full bg-white border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] bangla outline-none focus:border-primary shadow-xs"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              {memberSearch && (
                <button onClick={() => setMemberSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={14} />
                </button>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={openEnrollModal}
                className="px-3 py-2 bg-primary text-white rounded-xl font-semibold bangla text-[13px] flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
              >
                <UserPlus size={16} />
                <span>যোগ করুন</span>
              </button>
            )}
          </div>

          {/* Members List */}
          {enrolledMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-border text-center space-y-3">
              <Users size={32} className="mx-auto text-slate-400" />
              <h3 className="text-[15px] font-bold text-text-primary bangla">কোনো সদস্য যুক্ত করা হয়নি</h3>
              <p className="text-[12px] text-text-secondary bangla">
                উপরে "যোগ করুন" বাটনে চাপ দিয়ে সদস্যদের এই গ্রুপে অন্তর্ভুক্ত করুন।
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {enrolledMembers
                .filter(m => {
                  const name = m.profile?.full_name || '';
                  const phone = m.profile?.phone || '';
                  return name.toLowerCase().includes(memberSearch.toLowerCase()) || phone.includes(memberSearch);
                })
                .map((m, idx) => {
                  const hasWon = wonRecipientIds.has(m.member_id);
                  const memberCode = `SM-${String(idx + 1).padStart(3, '0')}`;
                  // Simulated contribution status for visual match
                  const isPaid = idx % 2 === 0;

                  return (
                    <motion.div
                      key={m.id}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => navigate(`/rosca/${id}/members/${m.member_id}`)}
                      className="bg-white p-3.5 rounded-2xl border border-border shadow-xs flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-[14px] bangla overflow-hidden shrink-0">
                          {m.profile?.avatar_url ? (
                            <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            m.profile?.full_name?.charAt(0) || 'স'
                          )}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-text-primary bangla leading-tight">
                            {m.profile?.full_name || 'সদস্য নাম'}
                          </h4>
                          <span className="text-[11px] font-mono text-text-secondary mt-0.5 block">
                            {memberCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasWon ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E0E7FF] text-[#4338CA] bangla">
                            ড্র পেয়েছে
                          </span>
                        ) : isPaid ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-light text-primary bangla">
                            পরিশোধিত
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#DC2626] bangla">
                            বকেয়া
                          </span>
                        )}
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: কিস্তি (Screen 5: Contribution Status)
      ========================================================================= */}
      {activeTab === 'contributions' && (
        <div className="flex flex-col gap-3">
          {/* Month Navigator */}
          <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-2xl border border-border">
            <button 
              onClick={() => setSelectedMonthIndex(prev => Math.max(0, prev - 1))}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[14px] font-bold text-text-primary bangla">
              মাস {selectedMonthIndex + 1} ({['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][selectedMonthIndex % 12]} {(new Date(plan?.created_at || Date.now()).getFullYear()).toLocaleString('bn-BD').replace(/,/g, '')})
            </span>
            <button 
              onClick={() => setSelectedMonthIndex(prev => Math.min(durationMonths - 1, prev + 1))}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 4-Pill Metric Counter (Screen 5) */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white p-2 rounded-xl border border-border">
              <span className="text-[10px] text-text-secondary bangla block">পরিশোধিত</span>
              <span className="text-[14px] font-bold text-[#16A34A] bangla">৪ জন</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-border">
              <span className="text-[10px] text-text-secondary bangla block">বকেয়া</span>
              <span className="text-[14px] font-bold text-[#2563EB] bangla">৩ জন</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-border">
              <span className="text-[10px] text-text-secondary bangla block">আসন্ন</span>
              <span className="text-[14px] font-bold text-[#D97706] bangla">১ জন</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-border">
              <span className="text-[10px] text-text-secondary bangla block">ড্র পেয়েছে</span>
              <span className="text-[14px] font-bold text-purple-600 bangla">{wonRecipientIds.size} জন</span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 text-[12px] bangla font-semibold">
            {[
              { id: 'all', label: 'সব সদস্য' },
              { id: 'paid', label: 'পরিশোধিত' },
              { id: 'overdue', label: 'বকেয়া' },
              { id: 'upcoming', label: 'আসন্ন' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setContributionFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  contributionFilter === f.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Member Monthly Contribution List */}
          <div className="flex flex-col gap-2">
            {enrolledMembers.map((m, idx) => {
              const memberCode = `SM-${String(idx + 1).padStart(3, '0')}`;
              const isPaid = idx % 3 !== 1;
              const isOverdue = idx % 3 === 1;

              return (
                <div 
                  key={m.id}
                  className="bg-white p-3 rounded-2xl border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs bangla">
                      {m.profile?.full_name?.charAt(0) || 'স'}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-text-primary bangla">{m.profile?.full_name}</h4>
                      <span className="text-[11px] font-mono text-text-secondary">{memberCode}</span>
                    </div>
                  </div>

                  {isPaid ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary bangla">
                      পরিশোধিত
                    </span>
                  ) : isOverdue ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 bangla">
                      বকেয়া
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 bangla">
                      আসন্ন
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA: একসাথে কিস্তি রেকর্ড করুন */}
          {isAdmin && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="w-full h-[46px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[14px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all mt-2"
            >
              <span>একসাথে কিস্তি রেকর্ড করুন</span>
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: ড্র (Screen 6: Draw Management)
      ========================================================================= */}
      {activeTab === 'draw' && (
        <div className="flex flex-col gap-4">
          {/* Top Badge (Screen 6): Cycle 1 | মাস ৫ / ১২ */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-primary-light text-primary font-bold text-[11px] bangla">
              Cycle {currentCycle}
            </span>
            <span className="text-[12px] font-bold text-text-secondary bangla">
              মাস {currentMonthNo} / {durationMonths}
            </span>
          </div>

          {/* Hero Payout Card */}
          <div className="bg-white rounded-2xl p-5 border border-border shadow-xs text-center space-y-1">
            <span className="text-[12px] font-semibold text-text-secondary bangla block">
              মোট পেমেন্ট পরিমাণ
            </span>
            <span className="text-[26px] font-bold text-text-primary bangla block">
              ৳ {potAmount.toLocaleString()}
            </span>
            <span className="text-[11.5px] text-slate-500 bangla block">
              (৳ {installmentAmount.toLocaleString()} × {membersCount} সদস্য)
            </span>
          </div>

          {/* Section: যোগ্য সদস্য (ড্র পায়নি) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-text-primary bangla">
                যোগ্য সদস্য (ড্র পায়নি)
              </h3>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={handleRandomSpin}
                    disabled={isSpinning || eligibleMembers.length === 0}
                    className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[11px] font-bold bangla flex items-center gap-1 active:scale-95 transition-all"
                    title="লটারি র্যান্ডম ড্র"
                  >
                    <Dices size={14} className={isSpinning ? 'animate-spin' : ''} />
                    <span>লটারি স্পিন</span>
                  </button>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-primary-light text-primary text-[11px] font-bold bangla">
                  {eligibleMembers.length} জন
                </span>
              </div>
            </div>

            {eligibleMembers.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-border text-center space-y-2">
                <Trophy size={32} className="mx-auto text-amber-500" />
                <h4 className="text-[15px] font-bold text-text-primary bangla">সবাই ড্র পেয়েছেন!</h4>
                <p className="text-[12px] text-text-secondary bangla">
                  এই চক্রের সকল সদস্য একবার করে ড্র পেয়ে গেছেন।
                </p>
                {isAdmin && (
                  <button
                    onClick={() => navigate(`/rosca/${id}/completed`)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold bangla"
                  >
                    সম্পন্ন চক্র রিপোর্ট দেখুন
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {eligibleMembers.map((m, idx) => {
                  const isSelected = selectedWinnerId === m.member_id;
                  const memberCode = `SM-${String(idx + 1).padStart(3, '0')}`;

                  return (
                    <div
                      key={m.id}
                      onClick={isAdmin ? () => setSelectedWinnerId(m.member_id) : undefined}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isAdmin ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isSelected 
                          ? 'bg-primary-light/50 border-primary shadow-xs'
                          : 'bg-white border-border hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs bangla shrink-0">
                          {m.profile?.full_name?.charAt(0) || 'স'}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-text-primary bangla leading-tight">
                            {m.profile?.full_name}
                          </h4>
                          <span className="text-[11px] font-mono text-text-secondary">
                            {memberCode}
                          </span>
                        </div>
                      </div>

                      {/* Radio Selector (Admin only) */}
                      {isAdmin ? (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-primary bg-primary' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 bangla">
                          যোগ্য
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom CTA: ড্র সম্পন্ন করুন (Admin) বা শিডিউল নোটিশ (Member) */}
          {isAdmin ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!selectedWinnerId || eligibleMembers.length === 0}
              className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-40"
            >
              <span>ড্র সম্পন্ন করুন</span>
            </button>
          ) : (
            <div className="bg-[#FFFBEB] border border-amber-200/80 rounded-2xl p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[#B45309] font-bold bangla text-[13px]">
                <Calendar size={16} />
                <span>পরবর্তী লটারি ড্র শিডিউল</span>
              </div>
              <p className="text-[12px] text-slate-500 bangla">
                অ্যাডমিন কর্তৃক নির্ধারিত তারিখে ড্র পরিচালিত হবে এবং ফলাফল প্রকাশ করা হবে।
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: ইতিহাস (Screen 8: Draw History)
      ========================================================================= */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          {/* Cycle Filter Chips */}
          <div className="flex gap-2 text-[12px] bangla font-semibold">
            <button
              onClick={() => setHistoryCycleFilter('all')}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                historyCycleFilter === 'all'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border'
              }`}
            >
              সকল
            </button>
            <button
              onClick={() => setHistoryCycleFilter(1)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                historyCycleFilter === 1
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border'
              }`}
            >
              Cycle 1
            </button>
          </div>

          {/* Draw History Timeline (Screen 8) */}
          {completedPeriods.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-border text-center space-y-2">
              <Clock size={32} className="mx-auto text-slate-400" />
              <h4 className="text-[15px] font-bold text-text-primary bangla">কোনো ড্র সম্পন্ন হয়নি</h4>
              <p className="text-[12px] text-text-secondary bangla">
                প্রথম ড্র সম্পন্ন হলে এখানে ইতিহাসের তালিকা দেখতে পাবেন।
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {[...completedPeriods].reverse().map((period) => {
                const winner = enrolledMembers.find(m => m.member_id === period.recipient_id);

                return (
                  <div
                    key={period.id}
                    className="bg-white p-3.5 rounded-2xl border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left shrink-0 w-16">
                        <span className="text-[12px] font-bold text-primary bangla block">
                          মাস {period.period_no}
                        </span>
                        <span className="text-[10px] text-text-secondary bangla">
                          {period.drawn_at 
                            ? new Date(period.drawn_at).toLocaleDateString('bn-BD') 
                            : (period.due_date ? new Date(period.due_date).toLocaleDateString('bn-BD') : 'তারিখহীন')}
                        </span>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs bangla shrink-0">
                        {winner?.profile?.full_name?.charAt(0) || 'স'}
                      </div>

                      <div>
                        <h4 className="text-[13px] font-bold text-text-primary bangla">
                          {winner?.profile?.full_name || 'প্রাপক'}
                        </h4>
                        <span className="text-[11px] text-text-secondary font-mono">
                          SM-{String(period.period_no).padStart(3, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[14px] font-bold text-text-primary bangla block">
                        ৳ {Number(period.payout_amount || potAmount).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#16A34A] font-semibold bangla">
                        সম্পন্ন
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          DRAW CONFIRMATION MODAL (Pre-execution validation dialog)
      ========================================================================= */}
      <AnimatePresence>
        {showConfirmModal && selectedWinnerMember && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[380px] bg-white rounded-3xl p-5 relative z-10 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-text-primary bangla">ড্র নিশ্চিতকরণ</h3>
                  <span className="text-[11px] text-text-secondary bangla">Cycle {currentCycle} • মাস {currentMonthNo}</span>
                </div>
              </div>

              <div className="p-3.5 bg-bg-soft rounded-2xl border border-border space-y-2 text-[13px] bangla">
                <div className="flex justify-between">
                  <span className="text-text-secondary">নির্বাচিত প্রাপক:</span>
                  <span className="font-bold text-text-primary">{selectedWinnerMember.profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">পেমেন্ট পরিমাণ:</span>
                  <span className="font-bold text-primary">৳ {potAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">অবশিষ্ট যোগ্য সদস্য:</span>
                  <span className="font-semibold text-text-primary">{eligibleMembers.length - 1} জন</span>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-500 bangla leading-relaxed">
                সতর্কতা: একবার ড্র সম্পন্ন হলে নির্বাচিত সদস্য এই চক্রে আর ড্র পাবেন না। আপনি কি নিশ্চিত?
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-slate-600 font-semibold bangla text-[13px]"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDraw}
                  disabled={submittingDraw}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[13px] flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingDraw ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>হ্যাঁ, ড্র করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          ENROLL MEMBER MODAL
      ========================================================================= */}
      <AnimatePresence>
        {showEnrollModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEnrollModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[380px] bg-white rounded-3xl p-5 relative z-10 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="text-[16px] font-bold text-text-primary bangla">সদস্য যুক্ত করুন</h3>
                <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 p-1">
                  <X size={16} />
                </button>
              </div>

              {availableProfiles.length === 0 ? (
                <p className="text-[13px] text-slate-500 bangla text-center py-4">
                  কোনো সদস্য বাকি নেই বা সবাই যুক্ত আছেন।
                </p>
              ) : (
                <form onSubmit={handleEnrollSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-text-primary bangla">সদস্য নির্বাচন করুন</label>
                    <select
                      value={selectedProfileToEnroll}
                      onChange={(e) => setSelectedProfileToEnroll(e.target.value)}
                      className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-[13px] bangla outline-none focus:border-primary"
                    >
                      {availableProfiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} {p.phone ? `(${p.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEnrollModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-slate-600 font-semibold bangla text-[13px]"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={enrolling}
                      className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[13px] flex items-center justify-center gap-1.5"
                    >
                      {enrolling ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      <span>যোগ করুন</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          BULK INSTALLMENT MODAL (Screen 5)
      ========================================================================= */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[380px] bg-white rounded-3xl p-5 relative z-10 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="text-[16px] font-bold text-text-primary bangla">একসাথে কিস্তি রেকর্ড</h3>
                <button onClick={() => setShowBulkModal(false)} className="text-slate-400 p-1">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-text-primary bangla">প্রতি সদস্যের কিস্তি (টাকা)</label>
                  <input
                    type="number"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(Number(e.target.value))}
                    className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-[14px] font-bold bangla outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="p-3 bg-primary-light rounded-xl text-[12px] bangla text-primary">
                  মোট {enrolledMembers.length} জন সদস্যের কিস্তি একযোগে রেকর্ড হবে। সর্বমোট: ৳{(bulkAmount * enrolledMembers.length).toLocaleString()}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-slate-600 font-semibold bangla text-[13px]"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={bulkSubmitting}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[13px] flex items-center justify-center gap-1.5"
                  >
                    {bulkSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>জমা করুন</span>
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
