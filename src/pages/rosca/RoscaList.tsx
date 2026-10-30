import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Users, 
  RotateCw, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  X,
  Loader2,
  CheckCircle2,
  Layers,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

export default function RoscaList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SomobayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // New Group Form State
  const [newGroup, setNewGroup] = useState({
    name: '',
    duration_months: 12,
    installment_amount: 1000,
    total_members_limit: 12,
    due_date: 15
  });

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await roscaService.getRoscaPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    try {
      setCreating(true);
      const created = await roscaService.createRoscaPlan(newGroup);
      setShowCreateModal(false);
      setNewGroup({
        name: '',
        duration_months: 12,
        installment_amount: 1000,
        total_members_limit: 12,
        due_date: 15
      });
      await loadPlans();
      navigate(`/rosca/${created.id}`);
    } catch (err: any) {
      alert('গ্রুপ তৈরি করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setCreating(false);
    }
  };

  const filteredPlans = plans.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'active') return matchesSearch && p.status !== 'completed';
    if (activeTab === 'completed') return matchesSearch && p.status === 'completed';
    return matchesSearch;
  });

  const activeCount = plans.filter(p => p.status !== 'completed').length;
  const completedCount = plans.filter(p => p.status === 'completed').length;

  // Visual color pallete for group cards
  const colorThemes = [
    { bg: 'bg-purple-50 text-purple-600', badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-600' },
    { bg: 'bg-amber-50 text-amber-600', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
    { bg: 'bg-rose-50 text-rose-600', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
    { bg: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-primary' }
  ];

  return (
    <MobileLayout
      headerTitle="রোটেশনাল সঞ্চয় (ROSCA)"
      backTo="/somobay/manage"
      showBack={true}
      headerRight={
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title={showSearch ? 'অনুসন্ধান বন্ধ' : 'অনুসন্ধান'}
          aria-label="অনুসন্ধান"
        >
          <Search size={22} strokeWidth={2.4} />
        </button>
      }
    >

      {/* Expandable Search Input */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-2"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="গ্রুপের নাম দিয়ে খুঁজুন..."
                className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-[14px] bangla outline-none focus:border-primary shadow-sm"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Filter Tabs: সকল, চলমান, সমাপ্ত */}
      <div className="flex border-b border-border pb-1 gap-6 text-[14px] bangla font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 relative transition-colors ${
            activeTab === 'all' ? 'text-primary font-bold' : 'text-text-secondary'
          }`}
        >
          সকল ({plans.length})
          {activeTab === 'all' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-2 relative transition-colors ${
            activeTab === 'active' ? 'text-primary font-bold' : 'text-text-secondary'
          }`}
        >
          চলমান ({activeCount})
          {activeTab === 'active' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 relative transition-colors ${
            activeTab === 'completed' ? 'text-primary font-bold' : 'text-text-secondary'
          }`}
        >
          সমাপ্ত ({completedCount})
          {activeTab === 'completed' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* 3. CTA Button: + নতুন ROSCA গ্রুপ */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
      >
        <Plus size={18} />
        <span>নতুন ROSCA গ্রুপ তৈরি করুন</span>
      </button>

      {/* 4. Groups List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-primary" size={28} />
          <span className="text-[13px] bangla">লোড হচ্ছে...</span>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-border text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto">
            <RotateCw size={24} />
          </div>
          <h3 className="text-[16px] font-bold text-text-primary bangla">কোনো ROSCA গ্রুপ পাওয়া যায়নি</h3>
          <p className="text-[12px] text-text-secondary bangla max-w-[260px] mx-auto">
            রোটেশনাল সঞ্চয় চালু করতে উপরে "+ নতুন ROSCA গ্রুপ" বাটনে ট্যাপ করুন।
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPlans.map((plan, idx) => {
            const theme = colorThemes[idx % colorThemes.length];
            const isCompleted = plan.status === 'completed';
            const duration = plan.duration_months || 12;
            const installment = plan.installment_amount || 0;
            const membersLimit = plan.total_members_limit || duration;
            const completedMonths = isCompleted ? duration : (plan.current_cycle ? Math.min(duration, Math.max(0, plan.current_cycle - 1)) : 0);
            const progress = duration > 0 ? Math.round((completedMonths / duration) * 100) : 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.2), duration: 0.2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/rosca/${plan.id}`)}
                className="bg-white rounded-2xl p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${theme.bg} flex items-center justify-center shrink-0`}>
                      <Users size={22} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-text-primary bangla leading-snug">
                        {plan.name}
                      </h3>
                      <p className="text-[12px] text-text-secondary bangla mt-0.5">
                        ৳ {installment.toLocaleString()} / মাস | {membersLimit} সদস্য
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full bangla ${
                      isCompleted ? 'bg-red-50 text-red-600' : theme.badge
                    }`}>
                      {isCompleted ? 'সমাপ্ত' : 'চলমান'}
                    </span>
                    <button
                      type="button"
                      title="গ্রুপটি মুছে ফেলুন"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`আপনি কি নিশ্চিত যে "${plan.name}" ROSCA গ্রুপটি মুছে ফেলতে চান?`)) return;
                        try {
                          await supabase.from('somobay_plans').delete().eq('id', plan.id);
                          alert('গ্রুপটি সফলভাবে মুছে ফেলা হয়েছে!');
                          loadPlans();
                        } catch (err: any) {
                          alert('মুছে ফেলতে সমস্যা হয়েছে: ' + (err.message || ''));
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar section */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-text-secondary bangla">
                    <span>{completedMonths} / {duration} মাস শেষ</span>
                    <span className="font-mono text-text-primary">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isCompleted ? 'bg-[#16A34A]' : theme.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create New ROSCA Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-[430px] bg-white rounded-t-[24px] sm:rounded-[24px] p-5 relative z-10 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                    <RotateCw size={18} />
                  </div>
                  <h3 className="text-[17px] font-bold text-text-primary bangla">নতুন ROSCA গ্রুপ তৈরি</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-text-primary bangla">গ্রুপের নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমনঃ ১২ মাস সঞ্চয় গ্রুপ-১"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-2.5 text-[14px] bangla outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-text-primary bangla">মেয়াদ (মাস) *</label>
                    <input
                      type="number"
                      min={2}
                      max={60}
                      required
                      value={newGroup.duration_months}
                      onChange={(e) => {
                        const dur = Number(e.target.value);
                        setNewGroup({ ...newGroup, duration_months: dur, total_members_limit: dur });
                      }}
                      className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-2.5 text-[14px] bangla outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-text-primary bangla">মোট সদস্য *</label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      required
                      value={newGroup.total_members_limit}
                      onChange={(e) => setNewGroup({ ...newGroup, total_members_limit: Number(e.target.value) })}
                      className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-2.5 text-[14px] bangla outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-text-primary bangla">মাসিক কিস্তি (টাকা) *</label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      required
                      value={newGroup.installment_amount}
                      onChange={(e) => setNewGroup({ ...newGroup, installment_amount: Number(e.target.value) })}
                      className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-2.5 text-[14px] bangla outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-text-primary bangla">প্রতি মাসের তারিখ *</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={newGroup.due_date}
                      onChange={(e) => setNewGroup({ ...newGroup, due_date: Number(e.target.value) })}
                      className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-2.5 text-[14px] bangla outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Calculation summary preview */}
                <div className="p-3 bg-primary-light rounded-xl border border-primary/20 text-[12px] bangla space-y-1">
                  <div className="flex justify-between font-semibold text-primary">
                    <span>প্রতি পালায় মোট ড্র পুল:</span>
                    <span className="font-bold">৳ {(newGroup.installment_amount * newGroup.total_members_limit).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    প্রতি মাসে ১ জন সদস্য মোট ৳{(newGroup.installment_amount * newGroup.total_members_limit).toLocaleString()} এককালীন ড্র পাবেন।
                  </p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl border border-border text-slate-600 font-semibold bangla text-[14px]"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[14px] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {creating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    <span>তৈরি করুন</span>
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
