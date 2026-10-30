import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Users, 
  Target, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  X,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
  DollarSign,
  Clock,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSomobayStore } from '../../store/useSomobayStore';

export default function GoalList() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<SomobayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [showSearch, setShowSearch] = useState(false);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await jointGoalService.getGoals();
      setGoals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`আপনি কি নিশ্চিত যে "${goalName}" যৌথ সঞ্চয় লক্ষ্যটি মুছে ফেলতে চান?`)) return;
    try {
      await useSomobayStore.getState().deletePlan(goalId);
      await loadGoals();
      alert(`"${goalName}" সফলভাবে মুছে ফেলা হয়েছে!`);
    } catch (err: any) {
      alert('মুছে ফেলতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const filteredGoals = goals.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'active') return matchesSearch && g.status !== 'completed';
    if (activeTab === 'completed') return matchesSearch && g.status === 'completed';
    return matchesSearch;
  });

  const activeCount = goals.filter(g => g.status !== 'completed').length;
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const totalTargetAmount = goals.reduce((acc, g) => acc + (g.target_amount || 0), 0);

  return (
    <MobileLayout
      headerTitle="যৌথ সঞ্চয় লক্ষ্য"
      headerSubtitle="সমিতির সম্মিলিত তহবিল ও লক্ষ্যসমূহ"
      backTo="/somobay/manage"
      showBack={true}
      headerRight={
        <div className="flex items-center gap-0.5">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title={showSearch ? 'অনুসন্ধান বন্ধ' : 'অনুসন্ধান'}
            aria-label="অনুসন্ধান"
          >
            {showSearch ? <X size={21} strokeWidth={2.4} /> : <Search size={21} strokeWidth={2.4} />}
          </button>
          {activeCount < 1 ? (
            <button 
              onClick={() => navigate('/joint-goals/create')}
              className="h-11 min-h-[44px] px-2 flex items-center gap-1 text-white text-[13px] font-bold bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
              title="নতুন লক্ষ্য"
            >
              <Plus size={18} strokeWidth={2.6} />
              <span>নতুন</span>
            </button>
          ) : (
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white bangla">
              ১/১ সক্রিয়
            </span>
          )}
        </div>
      }
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Search Bar Collapsible */}
        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="লক্ষ্যের নাম বা উদ্দেশ্য লিখে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-border rounded-xl text-[14px] text-slate-800 placeholder-slate-400 bangla outline-none focus:border-primary focus:bg-white transition-all"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeCount >= 1 && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-[12px] bangla text-teal-900 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0" />
              <span>সর্বোচ্চ ১টি যৌথ সঞ্চয় সমবায় অনুমোদিত (১/১ সক্রিয়)</span>
            </div>
          </div>
        )}

        {/* Top Summary Banner */}
        <div className="bg-gradient-to-br from-[#087F5B] to-[#065F46] rounded-2xl p-4 text-white shadow-sm relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-emerald-100 bangla uppercase tracking-wider flex items-center gap-1.5">
                <Target size={13} />
                যৌথ সঞ্চয় ড্যাশবোর্ড
              </span>
              <h2 className="text-[20px] font-black bangla">৳{totalTargetAmount.toLocaleString()}</h2>
              <p className="text-[12px] text-emerald-100 bangla">মোট নির্ধারিত লক্ষ্যমাত্রা</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 text-right">
              <div className="text-[18px] font-bold bangla leading-none">{goals.length}</div>
              <div className="text-[10px] text-emerald-100 bangla mt-1">সর্বমোট লক্ষ্য</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/15">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300" />
              <span className="text-[12px] text-emerald-50 bangla">{activeCount}টি চলমান লক্ষ্য</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <div className="w-2 h-2 rounded-full bg-amber-300" />
              <span className="text-[12px] text-emerald-50 bangla">{completedCount}টি সম্পন্ন লক্ষ্য</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold bangla transition-all ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            সবগুলো ({goals.length})
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold bangla transition-all ${activeTab === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
          >
            চলমান ({activeCount})
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold bangla transition-all ${activeTab === 'completed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            সম্পন্ন ({completedCount})
          </button>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[13px] text-slate-500 bangla">যৌথ লক্ষ্য লোড হচ্ছে...</p>
          </div>
        ) : filteredGoals.length > 0 ? (
          <div className="space-y-3.5">
            {filteredGoals.map((goal, idx) => {
              const target = goal.target_amount || 0;
              const collected = goal.total_collected || 0;
              const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
              const isCompleted = goal.status === 'completed' || percent >= 100;
              const memberLimit = goal.total_members_limit || 10;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.2 }}
                  onClick={() => navigate(`/joint-goals/${goal.id}`)}
                  className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-emerald-300 transition-all cursor-pointer active:scale-[0.99] space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                        <Target size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-bold text-text-primary bangla leading-snug truncate">
                          {goal.name}
                        </h3>
                        {goal.description && (
                          <p className="text-[12px] text-slate-500 bangla line-clamp-1 mt-0.5">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGoal(goal.id, goal.name, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="প্ল্যান মুছে ফেলুন"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold bangla border shrink-0 ${
                        isCompleted 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-teal-50 text-teal-700 border-teal-200'
                      }`}>
                        {isCompleted ? 'সম্পন্ন' : 'চলমান'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Amount Row */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[12px] bangla">
                      <span className="text-slate-500">সংগৃহীত: <strong className="text-emerald-700 font-bold">৳{collected.toLocaleString()}</strong></span>
                      <span className="text-slate-500">লক্ষ্য: <strong className="text-text-primary font-bold">৳{target.toLocaleString()}</strong></span>
                    </div>

                    {/* Progress Track */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-600' : 'bg-primary'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 bangla">
                      <span>অগ্রগতি: {percent}%</span>
                      <span>অবশিষ্ট: ৳{Math.max(0, target - collected).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[12px] text-slate-600 bangla">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      <span>সর্বোচ্চ {memberLimit} জন সদস্য</span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-700 font-semibold group">
                      <span>বিবরণী দেখুন</span>
                      <ChevronRight size={14} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
              <Target size={28} />
            </div>
            <h3 className="text-[16px] font-bold text-slate-800 bangla">কোন যৌথ সঞ্চয় লক্ষ্য পাওয়া যায়নি</h3>
            <p className="text-[13px] text-slate-500 bangla max-w-xs">
              {searchQuery ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো লক্ষ্য নেই।' : 'সমিতির কোনো যৌথ লক্ষ্য এখনো তৈরি করা হয়নি। নতুন একটি যৌথ সঞ্চয় তহবিল শুরু করুন।'}
            </p>
            <button
              onClick={() => navigate('/joint-goals/create')}
              className="mt-2 px-5 py-2.5 rounded-full bg-primary text-white text-[13px] font-bold bangla shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>প্রথম লক্ষ্য তৈরি করুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-4 z-20">
        <button
          onClick={() => navigate('/joint-goals/create')}
          className="h-13 px-5 rounded-full bg-primary text-white font-bold text-[14px] bangla shadow-lg shadow-emerald-800/30 flex items-center gap-2 active:scale-95 transition-all hover:bg-primary-dark"
        >
          <Plus size={20} />
          <span>নতুন যৌথ লক্ষ্য</span>
        </button>
      </div>
    </MobileLayout>
  );
}
