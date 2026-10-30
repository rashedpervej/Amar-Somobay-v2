import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { SomobayPlan } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Plus, 
  ChevronRight, 
  Trash2,
  PiggyBank,
  RotateCw,
  Target,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Search,
  Sliders,
  CheckCircle2,
  Archive,
  PowerOff,
  Power,
  RotateCcw,
  AlertCircle,
  FileText
} from 'lucide-react';

type TabStatus = 'active' | 'inactive' | 'archived';
type CategoryFilter = 'all' | 'General' | 'rosca' | 'joint_goal';

export default function ManageSomobay() {
  const { cooperativeSlug } = useParams<{ cooperativeSlug?: string }>();
  const navigate = useNavigate();
  const context = useOutletContext<{ organization: any; membership: any }>();

  const { profile, activeOrganization, activeRole, memberships } = useAuthStore();
  const currentOrg = context?.organization || activeOrganization;
  const currentSlug = cooperativeSlug || currentOrg?.slug || 'somobay';

  const [plans, setPlans] = useState<SomobayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // 3 Primary Status Tabs: Active, Inactive, Archive
  const [activeTab, setActiveTab] = useState<TabStatus>('active');

  // Secondary Category Filter & Search
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPlans = async () => {
    try {
      let query = supabase
        .from('somobay_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentOrg?.id) {
        query = query.eq('organization_id', currentOrg.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans in ManageSomobay:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchPlans();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentOrg?.id]);

  // Status classifier
  const getPlanStatus = (p: SomobayPlan): TabStatus => {
    const st = (p.status as string) || '';
    if (st === 'archived' || st === 'archive' || st === 'completed') return 'archived';
    if (st === 'inactive' || st === 'paused' || p.is_active === false) return 'inactive';
    return 'active';
  };

  // Status counts for badge pills
  const counts = useMemo(() => {
    let act = 0;
    let inact = 0;
    let arch = 0;
    plans.forEach(p => {
      const st = getPlanStatus(p);
      if (st === 'active') act++;
      else if (st === 'inactive') inact++;
      else if (st === 'archived') arch++;
    });
    return { active: act, inactive: inact, archived: arch };
  }, [plans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      // 1. Status match
      if (getPlanStatus(p) !== activeTab) return false;

      // 2. Category match
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'General') {
          if (p.scheme_type !== 'General' && p.scheme_type !== 'savings' && p.scheme_type) return false;
        } else if (p.scheme_type !== categoryFilter) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [plans, activeTab, categoryFilter, searchQuery]);

  // Update Status in Backend (Database)
  const handleUpdateStatus = async (plan: SomobayPlan, targetStatus: TabStatus) => {
    const statusLabels: Record<TabStatus, string> = {
      active: 'সক্রিয় (Active)',
      inactive: 'নিষ্ক্রিয় (Inactive)',
      archived: 'আর্কাইভ (Archive)'
    };

    const confirmMsg = targetStatus === 'archived'
      ? `আপনি কি নিশ্চিত যে "${plan.name}" সমবায়টি আর্কাইভ করতে চান? এর সকল হিসাব ও খতিয়ান আজীবন সংরক্ষিত থাকবে।`
      : targetStatus === 'inactive'
      ? `আপনি কি নিশ্চিত যে "${plan.name}" সমবায়টি নিষ্ক্রিয় করতে চান? এটি ড্যাশবোর্ড থেকে সাময়িক লুকানো থাকবে।`
      : `আপনি কি নিশ্চিত যে "${plan.name}" সমবায়টি পুনরায় সক্রিয় করতে চান?`;

    if (!confirm(confirmMsg)) return;

    try {
      setActionLoadingId(plan.id);
      const is_active = targetStatus === 'active';
      const { error } = await supabase
        .from('somobay_plans')
        .update({
          status: targetStatus,
          is_active: is_active
        })
        .eq('id', plan.id);

      if (error) throw error;

      await fetchPlans();
      alert(`"${plan.name}" সমবায়ের স্ট্যাটাস সফলভাবে "${statusLabels[targetStatus]}" করা হয়েছে!`);
    } catch (err: any) {
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: ' + (err.message || 'ত্রুটি'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Plan permanently
  const handleDeletePlan = async (plan: SomobayPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`সতর্কতা: আপনি কি নিশ্চিত যে "${plan.name}" সমবায়টি স্থায়ীভাবে মুছে ফেলতে চান? মুছে ফেলার চেয়ে "আর্কাইভ" করা নিরাপদ।`)) return;

    try {
      setActionLoadingId(plan.id);
      const { error } = await supabase.from('somobay_plans').delete().eq('id', plan.id);
      if (error) throw error;
      await fetchPlans();
      alert(`"${plan.name}" সমবায়টি স্থায়ীভাবে মুছে ফেলা হয়েছে!`);
    } catch (err: any) {
      alert('মুছে ফেলতে সমস্যা হয়েছে: ' + (err.message || 'ত্রুটি'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getSchemeIcon = (schemeType?: string) => {
    if (schemeType === 'rosca') {
      return (
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
          <RotateCw size={20} />
        </div>
      );
    }
    if (schemeType === 'joint_goal') {
      return (
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
          <Target size={20} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary shrink-0">
        <PiggyBank size={20} />
      </div>
    );
  };

  const getSchemeLabel = (schemeType?: string) => {
    if (schemeType === 'rosca') return 'রোসকা';
    if (schemeType === 'joint_goal') return 'যৌথ সঞ্চয়';
    return 'সাধারণ সমবায়';
  };

  return (
    <MobileLayout
      headerTitle="Manage Somobay"
      headerSubtitle="সমবায় পরিচালনা ও নিয়ন্ত্রণ"
      showBack={true}
      onBack={() => navigate(`/somobay/${currentSlug}/more`)}
      headerRight={
        <button
          onClick={() => navigate('/somobay/create')}
          className="px-2.5 py-1 bg-emerald-50 text-primary border border-emerald-200 rounded-lg text-[12px] font-bold bangla flex items-center gap-1 hover:bg-emerald-100 transition-colors cursor-pointer"
          title="নতুন সমবায় যোগ করুন"
        >
          <Plus size={14} />
          <span>নতুন সমবায়</span>
        </button>
      }
    >
      <div className="space-y-4 pb-24 pt-1">
        {/* Top 3 Primary Action Tabs (Active, Inactive, Archive) */}
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] bangla flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inactive')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] bangla flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'inactive'
                ? 'bg-white text-amber-800 shadow-xs border border-amber-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Inactive</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'inactive' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {counts.inactive}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] bangla flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-white text-purple-800 shadow-xs border border-purple-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive size={14} className={activeTab === 'archived' ? 'text-purple-600' : 'text-slate-400'} />
            <span>Archive</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'archived' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {counts.archived}
            </span>
          </button>
        </div>

        {/* Tab Context Banner */}
        <div className={`p-3 rounded-2xl border text-[12px] bangla flex items-start gap-2.5 ${
          activeTab === 'active'
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
            : activeTab === 'inactive'
            ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
            : 'bg-purple-50/70 border-purple-200/80 text-purple-900'
        }`}>
          {activeTab === 'active' && (
            <>
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>সক্রিয় সমবায়:</strong> বর্তমানে চলমান সমবায়সমূহ। সাধারণ সদস্য ও ড্যাশবোর্ডে এগুলো প্রদর্শিত হয়।
              </span>
            </>
          )}
          {activeTab === 'inactive' && (
            <>
              <PowerOff size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>নিষ্ক্রিয় সমবায়:</strong> সাময়িক স্থগিত রাখা সমবায়। ড্যাশবোর্ড ক্লিন রাখতে এগুলো লুকানো থাকে, তবে যেকোনো সময় সক্রিয় করা যায়।
              </span>
            </>
          )}
          {activeTab === 'archived' && (
            <>
              <Archive size={16} className="text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>আর্কাইভ সমবায়:</strong> সমাপ্ত বা স্থায়ীভাবে সংরক্ষিত সমবায়। এর সকল হিসাব ও লেনদেন ইতিহাস আজীবন অক্ষুণ্ণ থাকবে।
              </span>
            </>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="সমবায়ের নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] bangla focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* Category Chips (3 Categories) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold bangla">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              সব ক্যাটাগরি
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('General')}
              className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'General'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              সাধারণ সমবায়
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('rosca')}
              className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'rosca'
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              রোসকা
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('joint_goal')}
              className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'joint_goal'
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              যৌথ সঞ্চয়
            </button>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[12px] text-slate-400 bangla">সমবায় তালিকা লোড হচ্ছে...</p>
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="space-y-3">
            {filteredPlans.map((plan) => {
              const currentStatus = getPlanStatus(plan);
              const isLoadingThis = actionLoadingId === plan.id;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {getSchemeIcon(plan.scheme_type)}
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-bold text-slate-800 bangla leading-tight truncate">
                          {plan.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[11px] bangla">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.2 rounded border border-slate-200">
                            {getSchemeLabel(plan.scheme_type)}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] border ${
                            currentStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : currentStatus === 'inactive'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {currentStatus === 'active' ? 'সক্রিয়' : currentStatus === 'inactive' ? 'নিষ্ক্রিয়' : 'আর্কাইভকৃত'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="স্থায়ীভাবে মুছে ফেলুন"
                      disabled={isLoadingThis}
                      onClick={(e) => handleDeletePlan(plan, e)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Financial & Schedule Snapshot */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-[11px] bangla text-slate-600 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">কিস্তির পরিমাণ</span>
                      <strong className="text-emerald-800 font-semibold text-[12px]">
                        ৳{(plan.installment_amount || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ধরণ ও মেয়াদ</span>
                      <strong className="text-slate-700 font-medium capitalize">
                        {plan.frequency === 'weekly' ? 'সাপ্তাহিক' : 'মাসিক'}
                        {plan.duration_months ? ` (${plan.duration_months} মাস)` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">টার্গেট / সদস্য</span>
                      <strong className="text-slate-700 font-medium">
                        {plan.total_members_limit ? `${plan.total_members_limit} জন` : 'সীমাহীন'}
                      </strong>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (plan.scheme_type === 'rosca') {
                          navigate(`/rosca/${plan.id}`);
                        } else if (plan.scheme_type === 'joint_goal') {
                          navigate(`/joint-goals/${plan.id}`);
                        } else {
                          navigate(`/somobay/${currentSlug}/plans`);
                        }
                      }}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold bangla inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileText size={13} />
                      <span>খতিয়ান ও কিস্তি</span>
                      <ChevronRight size={13} />
                    </button>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5">
                      {currentStatus === 'active' && (
                        <>
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateStatus(plan, 'inactive')}
                            className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <PowerOff size={12} />
                            <span>নিষ্ক্রিয় করুন</span>
                          </button>
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateStatus(plan, 'archived')}
                            className="py-1 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Archive size={12} />
                            <span>আর্কাইভ</span>
                          </button>
                        </>
                      )}

                      {currentStatus === 'inactive' && (
                        <>
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateStatus(plan, 'active')}
                            className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Power size={12} />
                            <span>সক্রিয় করুন</span>
                          </button>
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateStatus(plan, 'archived')}
                            className="py-1 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Archive size={12} />
                            <span>আর্কাইভ</span>
                          </button>
                        </>
                      )}

                      {currentStatus === 'archived' && (
                        <>
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateStatus(plan, 'active')}
                            className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-200 rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw size={12} />
                            <span>পুনরুদ্ধার (Restore)</span>
                          </button>
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateStatus(plan, 'inactive')}
                            className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>নিষ্ক্রিয় তালিকায় নিন</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State for Selected Tab */
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4 my-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              activeTab === 'active'
                ? 'bg-emerald-50 text-primary border border-emerald-100'
                : activeTab === 'inactive'
                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                : 'bg-purple-50 text-purple-600 border border-purple-100'
            }`}>
              {activeTab === 'active' ? (
                <Building2 size={28} />
              ) : activeTab === 'inactive' ? (
                <PowerOff size={28} />
              ) : (
                <Archive size={28} />
              )}
            </div>

            <div className="space-y-1 max-w-xs mx-auto">
              <h4 className="text-[16px] font-bold text-slate-800 bangla">
                {activeTab === 'active' && 'কোনো সক্রিয় সমবায় পাওয়া যায়নি'}
                {activeTab === 'inactive' && 'কোনো নিষ্ক্রিয় সমবায় নেই'}
                {activeTab === 'archived' && 'কোনো আর্কাইভ সমবায় নেই'}
              </h4>
              <p className="text-[12px] text-slate-500 bangla">
                {activeTab === 'active' && 'একটি নতুন সমবায় তৈরি করে কার্যক্রম শুরু করুন।'}
                {activeTab === 'inactive' && 'যেসব সমবায় সাময়িক বন্ধ করা হবে, সেগুলো এখানে সংরক্ষিত থাকবে।'}
                {activeTab === 'archived' && 'আর্কাইভ করা সমবায়গুলোর হিসাব ও খতিয়ান আজীবন এখানে সুরক্ষিত থাকবে।'}
              </p>
            </div>

            {activeTab === 'active' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/somobay/create')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[13px] font-bold bangla shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                  <span>নতুন সমবায় শুরু করুন</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
