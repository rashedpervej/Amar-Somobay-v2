import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService, JointGoalMetrics } from '../../lib/jointGoalService';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Target, 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Settings, 
  Award, 
  ChevronRight, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Layers,
  Sparkles,
  UserCheck,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [members, setMembers] = useState<MemberPlan[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<JointGoalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Members tab filter & search
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'paid' | 'due'>('all');

  // History tab filter
  const [historySearch, setHistorySearch] = useState('');

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [allSocietyMembers, setAllSocietyMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const loadGoalData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const g = await jointGoalService.getGoalById(id);
      if (!g) {
        navigate('/joint-goals');
        return;
      }
      setGoal(g);

      const [mems, conts, exps] = await Promise.all([
        jointGoalService.getEnrolledMembers(id),
        jointGoalService.getContributions(id),
        jointGoalService.getExpenses(id)
      ]);

      setMembers(mems);
      setContributions(conts);
      setExpenses(exps);

      const m = jointGoalService.calculateMetrics(g, mems, conts, exps);
      setMetrics(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoalData();
  }, [id]);

  const openAddMemberModal = async () => {
    setShowAddMemberModal(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, role')
        .order('full_name');
      
      // Filter out members already in the goal
      const existingIds = new Set(members.map(m => m.member_id));
      const available = (data || []).filter(p => !existingIds.has(p.id));
      setAllSocietyMembers(available);
      if (available.length > 0) {
        setSelectedMemberId(available[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnrollMember = async () => {
    if (!id || !selectedMemberId) return;
    setAddingMember(true);
    try {
      await jointGoalService.enrollMember(id, selectedMemberId);
      setShowAddMemberModal(false);
      await loadGoalData();
    } catch (err: any) {
      alert('সদস্য যোগ করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setAddingMember(false);
    }
  };

  if (loading || !goal) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">যৌথ লক্ষ্যের তথ্য লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  // Pre-calculate member contributions map
  const memberContributionSums = new Map<string, number>();
  contributions.forEach(c => {
    const cur = memberContributionSums.get(c.member_plan_id) || 0;
    memberContributionSums.set(c.member_plan_id, cur + (Number(c.amount) || 0));
  });

  const filteredMembers = members.filter(m => {
    const p = (m as any).profile;
    const name = p?.full_name || 'সদস্য';
    const matches = name.toLowerCase().includes(memberSearch.toLowerCase()) || 
      (p?.phone || '').includes(memberSearch);
    
    const paid = (memberContributionSums.get(m.id) || 0) > 0;
    if (memberFilter === 'paid') return matches && paid;
    if (memberFilter === 'due') return matches && !paid;
    return matches;
  });

  const filteredContributions = contributions.filter(c => {
    const memberName = c.member?.full_name || '';
    return memberName.toLowerCase().includes(historySearch.toLowerCase()) ||
      (c.note || '').toLowerCase().includes(historySearch.toLowerCase());
  });

  const progress = metrics?.progressPercent || 0;
  const isCompleted = goal.status === 'completed' || progress >= 100;

  return (
    <MobileLayout
      headerTitle={goal.name}
      headerSubtitle="যৌথ সঞ্চয় লক্ষ্য বিবরণী"
      backTo="/joint-goals"
      showBack={true}
      headerRight={
        <button 
          onClick={() => navigate(`/joint-goals/${id}/settings`)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title="সেটিংস"
          aria-label="সেটিংস"
        >
          <Settings size={22} strokeWidth={2.2} />
        </button>
      }
    >

      {/* Segmented Tab Navigation: বিবরণী | সদস্য | হিস্ট্রি */}
      <div className="bg-white border-b border-border px-4 py-2 sticky top-[57px] z-20">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSearchParams({ tab: 'overview' })}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold bangla transition-all ${
              activeTab === 'overview' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            সারসংক্ষেপ
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'members' })}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold bangla transition-all ${
              activeTab === 'members' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            সদস্য ({members.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'history' })}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold bangla transition-all ${
              activeTab === 'history' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            অবদান ({contributions.length})
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-28">
        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Completed Celebration Banner if achieved */}
            {isCompleted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(`/joint-goals/${id}/completed`)}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-amber-900 bangla">অভিনন্দন! লক্ষ্য অর্জিত হয়েছে</h4>
                    <p className="text-[11px] text-amber-700 bangla">চূড়ান্ত উদ্যাপন ও রিপোর্ট দেখতে ট্যাপ করুন</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-amber-600" />
              </motion.div>
            )}

            {/* Hero Card */}
            <div className="bg-white rounded-2xl border border-border p-4.5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bangla bg-primary-light text-primary border border-emerald-200">
                      {isCompleted ? 'লক্ষ্য সম্পন্ন' : 'সক্রিয় সঞ্চয়'}
                    </span>
                    <span className="text-[11px] text-slate-500 bangla">
                      {members.length} জন অংশীদার
                    </span>
                  </div>
                  <h2 className="text-[18px] font-black text-text-primary bangla leading-tight">
                    {goal.name}
                  </h2>
                  {goal.description && (
                    <p className="text-[12px] text-slate-600 bangla leading-relaxed">
                      {goal.description}
                    </p>
                  )}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                  <Target size={26} />
                </div>
              </div>

              {/* Progress Radial / Bar Section */}
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100">
                <div className="flex items-center justify-between text-[13px] bangla">
                  <span className="text-slate-500 font-medium">অগ্রগতি হার</span>
                  <span className="font-bold text-primary text-[15px]">{progress}%</span>
                </div>

                {/* Progress bar track */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-primary'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 bangla pt-1">
                  <span>সংগৃহীত: ৳{(metrics?.totalCollected || 0).toLocaleString()}</span>
                  <span>লক্ষ্য: ৳{(metrics?.targetAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* 3 Metric Summary Boxes */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
                  <div className="text-[10px] text-emerald-800 font-bold bangla">মোট সংগৃহীত</div>
                  <div className="text-[14px] font-black text-emerald-700 bangla mt-0.5 truncate">
                    ৳{(metrics?.totalCollected || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
                  <div className="text-[10px] text-amber-800 font-bold bangla">বাকি লক্ষ্য</div>
                  <div className="text-[14px] font-black text-amber-700 bangla mt-0.5 truncate">
                    ৳{(metrics?.remainingAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-2.5">
                  <div className="text-[10px] text-sky-800 font-bold bangla">অবশিষ্ট তহবিল</div>
                  <div className="text-[14px] font-black text-sky-700 bangla mt-0.5 truncate">
                    ৳{(metrics?.availableFund || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => navigate(`/joint-goals/${id}/contribute`)}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold text-[13px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-primary-dark"
                >
                  <Plus size={18} />
                  <span>অবদান যোগ করুন</span>
                </button>
                <button
                  onClick={openAddMemberModal}
                  className="py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-[13px] bangla flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-slate-200"
                >
                  <Users size={16} />
                  <span>সদস্য যোগ</span>
                </button>
              </div>
            </div>

            {/* Quick Action Hub (6 Modules) */}
            <div className="space-y-2">
              <h3 className="text-[14px] font-bold text-slate-800 bangla px-1">
                মডিউল ও অ্যাকশন
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Progress & Charts */}
                <div 
                  onClick={() => navigate(`/joint-goals/${id}/progress`)}
                  className="bg-white border border-border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 bangla truncate">অগ্রগতি বিশ্লেষণ</h4>
                    <p className="text-[11px] text-slate-500 bangla">চার্ট ও মাইলফলক</p>
                  </div>
                </div>

                {/* 2. Transactions & Expenses */}
                <div 
                  onClick={() => navigate(`/joint-goals/${id}/transactions`)}
                  className="bg-white border border-border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                    <DollarSign size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 bangla truncate">তহবিল ও খরচ</h4>
                    <p className="text-[11px] text-slate-500 bangla">আয়-ব্যয় ট্র্যাকিং</p>
                  </div>
                </div>

                {/* 3. Reports */}
                <div 
                  onClick={() => navigate(`/joint-goals/${id}/reports`)}
                  className="bg-white border border-border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 bangla truncate">অডিট রিপোর্ট</h4>
                    <p className="text-[11px] text-slate-500 bangla">PDF ও এক্সপোর্ট</p>
                  </div>
                </div>

                {/* 4. Settings */}
                <div 
                  onClick={() => navigate(`/joint-goals/${id}/settings`)}
                  className="bg-white border border-border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Settings size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 bangla truncate">লক্ষ্য সেটিংস</h4>
                    <p className="text-[11px] text-slate-500 bangla">পরিবর্তন ও সম্পন্ন</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Contributions Preview */}
            <div className="bg-white rounded-2xl border border-border p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-slate-800 bangla">সাম্প্রতিক অবদানসমূহ</h3>
                <button
                  onClick={() => setSearchParams({ tab: 'history' })}
                  className="text-[12px] text-primary font-bold bangla flex items-center gap-0.5 hover:underline"
                >
                  <span>সবগুলো</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {contributions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {contributions.slice(0, 5).map((c, i) => (
                    <div key={c.id || i} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center font-bold text-[12px] bangla">
                          {c.member?.full_name?.charAt(0) || 'স'}
                        </div>
                        <div>
                          <h5 className="text-[13px] font-bold text-slate-800 bangla leading-snug">
                            {c.member?.full_name || 'সদস্য'}
                          </h5>
                          <span className="text-[11px] text-slate-400 bangla">
                            {c.payment_date || 'সম্প্রতি'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[14px] font-black text-emerald-700 bangla">
                          +৳{Number(c.amount).toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400 bangla">
                          {c.note || 'অনুমোদিত'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 bangla text-[13px]">
                  এখনো কোনো অবদান জমা হয়নি। প্রথম অবদান যোগ করুন।
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: MEMBERS ===================== */}
        {activeTab === 'members' && (
          <div className="space-y-3.5">
            {/* Search & Filter Header */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="সদস্যের নাম বা ফোন লিখে খুঁজুন..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-[13px] text-slate-800 placeholder-slate-400 bangla outline-none focus:border-primary transition-all"
                />
              </div>

              <button
                onClick={openAddMemberModal}
                className="h-9 px-3.5 rounded-xl bg-primary text-white flex items-center gap-1.5 text-[12px] font-bold bangla shadow-sm shrink-0 active:scale-95"
              >
                <Plus size={16} />
                <span>সদস্য যুক্ত</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2">
              <button
                onClick={() => setMemberFilter('all')}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold bangla transition-all ${
                  memberFilter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                সব সদস্য ({members.length})
              </button>
              <button
                onClick={() => setMemberFilter('paid')}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold bangla transition-all ${
                  memberFilter === 'paid' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                অবদান দিয়েছে
              </button>
              <button
                onClick={() => setMemberFilter('due')}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold bangla transition-all ${
                  memberFilter === 'due' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                বাকি আছে
              </button>
            </div>

            {/* Member List */}
            {filteredMembers.length > 0 ? (
              <div className="space-y-2.5">
                {filteredMembers.map((m) => {
                  const p = (m as any).profile;
                  const totalGiven = memberContributionSums.get(m.id) || 0;
                  const hasContributed = totalGiven > 0;

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => navigate(`/joint-goals/${id}/members/${m.member_id}?planMemberId=${m.id}`)}
                      className="bg-white rounded-xl border border-border p-3 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.99] shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[14px] bangla shrink-0">
                          {p?.full_name?.charAt(0) || 'স'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-800 bangla leading-snug truncate">
                            {p?.full_name || 'সদস্য'}
                          </h4>
                          <p className="text-[11px] text-slate-500 bangla truncate">
                            {p?.phone || 'ফোন নেই'} • শুরু: {m.start_date || 'তারিখ নেই'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-emerald-700 bangla block">
                            ৳{totalGiven.toLocaleString()}
                          </span>
                          <span className={`text-[10px] font-semibold bangla px-2 py-0.5 rounded-full inline-block ${
                            hasContributed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {hasContributed ? 'অবদানকারী' : 'বাকি আছে'}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
                <Users size={32} className="mx-auto text-slate-300" />
                <h4 className="text-[14px] font-bold text-slate-700 bangla">কোন সদস্য পাওয়া যায়নি</h4>
                <p className="text-[12px] text-slate-400 bangla">উপরে "+ সদস্য যুক্ত" বাটনে ক্লিক করে সদস্য অন্তর্ভুক্ত করুন</p>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: CONTRIBUTION HISTORY ===================== */}
        {activeTab === 'history' && (
          <div className="space-y-3.5">
            {/* Summary Box */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 font-bold bangla">মোট সংগৃহীত অবদান</span>
                <h3 className="text-[18px] font-black text-emerald-700 bangla">৳{(metrics?.totalCollected || 0).toLocaleString()}</h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-800 font-bold bangla">মোট এন্ট্রি</span>
                <h3 className="text-[18px] font-black text-emerald-700 bangla">{contributions.length} টি</h3>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="সদস্যের নাম বা বিবরণী দিয়ে খুঁজুন..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-[13px] text-slate-800 placeholder-slate-400 bangla outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Contributions List */}
            {filteredContributions.length > 0 ? (
              <div className="space-y-2">
                {filteredContributions.map((c) => (
                  <div 
                    key={c.id} 
                    className="bg-white rounded-xl border border-border p-3 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={20} />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-800 bangla leading-snug">
                          {c.member?.full_name || 'সদস্য'}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 bangla mt-0.5">
                          <span>{c.payment_date || 'তারিখ নেই'}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{c.note || 'নগদ'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[15px] font-black text-emerald-700 bangla block">
                        +৳{Number(c.amount).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold bangla">
                        অনুমোদিত
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
                <Receipt size={32} className="mx-auto text-slate-300" />
                <h4 className="text-[14px] font-bold text-slate-700 bangla">কোন অবদান রেকর্ড নেই</h4>
                <p className="text-[12px] text-slate-400 bangla">এখনো কোনো সদস্য তহবিল জমা করেননি।</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck size={20} className="text-primary" />
                  <h3 className="text-[16px] font-bold text-slate-800 bangla">যৌথ লক্ষ্যে সদস্য যুক্ত করুন</h3>
                </div>
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {allSocietyMembers.length > 0 ? (
                <div className="space-y-3">
                  <label className="text-[12px] font-bold text-slate-600 bangla block">
                    সমিতির উপলব্ধ সদস্য নির্বাচন করুন:
                  </label>

                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] bangla text-slate-800 outline-none focus:border-primary"
                  >
                    {allSocietyMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.phone || 'ফোন নেই'})
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-slate-400 bangla">
                    * নির্বাচিত সদস্য এই যৌথ সঞ্চয় লক্ষ্যের অংশীদার হিসেবে নিবন্ধিত হবেন।
                  </p>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] bangla"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      disabled={addingMember || !selectedMemberId}
                      onClick={handleEnrollMember}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-[13px] bangla flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {addingMember ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      <span>যুক্ত করুন</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-[13px] text-slate-500 bangla">
                    সমিতির সকল সদস্য ইতোমধ্যে এই যৌথ লক্ষ্যে যুক্ত আছেন অথবা কোনো সদস্য উপলব্ধ নেই।
                  </p>
                  <button
                    onClick={() => setShowAddMemberModal(false)}
                    className="mt-2 px-4 py-2 bg-slate-100 rounded-xl text-[12px] font-bold bangla text-slate-700"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
