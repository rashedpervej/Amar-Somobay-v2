import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { SomobayPlan } from '../store/useSomobayStore';
import { generateCooperativeSlug } from '../lib/slugUtils';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Plus, 
  ChevronRight, 
  PiggyBank, 
  RotateCw, 
  Target, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Users,
  CheckCircle2 
} from 'lucide-react';

export default function SomobayList() {
  const navigate = useNavigate();
  const { profile, memberships, fetchMemberships, activeRole } = useAuthStore();

  const [plans, setPlans] = useState<SomobayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('somobay_plans')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPlans(data);
      }
    } catch (err) {
      console.error('Error fetching plans in SomobayList:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMemberships(),
          fetchPlans()
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeMemberships = memberships.filter(m => m.status === 'active' && m.organization);
  const isPlatformAdmin = profile?.role === 'admin';
  const hasAnySomobay = plans.length > 0 || activeMemberships.length > 0;

  // Helper for scheme name in Bengali
  const getSchemeLabel = (schemeType?: string) => {
    if (schemeType === 'rosca') return 'রোসকা';
    if (schemeType === 'joint_goal') return 'যৌথ সঞ্চয়';
    return 'সাধারণ সমবায়';
  };

  // Helper for scheme icon
  const getSchemeIcon = (schemeType?: string) => {
    if (schemeType === 'rosca') {
      return (
        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
          <RotateCw size={22} />
        </div>
      );
    }
    if (schemeType === 'joint_goal') {
      return (
        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
          <Target size={22} />
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary shrink-0">
        <PiggyBank size={22} />
      </div>
    );
  };

  return (
    <MobileLayout
      headerTitle="আমার সমবায়"
      showBack={true}
      onBack={() => navigate('/dashboard')}
    >
      <div className="space-y-4 pb-20 pt-1">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[13px] text-slate-400 bangla">সমবায়ের তথ্য লোড হচ্ছে...</p>
          </div>
        ) : hasAnySomobay ? (
          /* Active Somobays List */
          <div className="space-y-3.5">
            <div className="px-1">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider bangla">
                সক্রিয় সমবায় ({plans.length > 0 ? plans.length : activeMemberships.length})
              </span>
            </div>

            {/* List all created Somobays (Plans) directly */}
            {plans.length > 0 ? (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const matchingMembership = activeMemberships.find(m => m.organization_id === plan.organization_id);
                  const org = matchingMembership?.organization || activeMemberships[0]?.organization;
                  const orgCode = org?.cooperative_code || org?.reg_number || org?.slug;
                  const isOrgAdmin = matchingMembership?.role === 'cooperative_admin' || isPlatformAdmin || activeRole === 'cooperative_admin';

                  // Scheme-specific destination:
                  // - General Cooperative: /somobay/:orgCode/plans/:planId
                  // - ROSCA: /rosca/:id
                  // - Joint Goal: /joint-goals/:id
                  let targetUrl = orgCode ? `/somobay/${orgCode}/plans/${plan.id}` : `/somobay/plans/${plan.id}`;
                  if (plan.scheme_type === 'rosca') {
                    targetUrl = `/rosca/${plan.id}`;
                  } else if (plan.scheme_type === 'joint_goal') {
                    targetUrl = `/joint-goals/${plan.id}`;
                  }

                  return (
                    <div
                      key={plan.id}
                      onClick={() => navigate(targetUrl)}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group space-y-3"
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {getSchemeIcon(plan.scheme_type)}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-[16px] font-bold text-slate-800 bangla truncate leading-tight group-hover:text-primary transition-colors">
                                {plan.name}
                              </h4>
                              {/* Simple Green Checkmark to denote Active */}
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 fill-emerald-50" />
                            </div>

                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[11px] text-slate-500 bangla">
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                                {getSchemeLabel(plan.scheme_type)}
                              </span>
                              {activeMemberships.length > 1 && org && (
                                <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-[130px]">
                                  {org.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Right Admin / Role Icon (Clean without text) */}
                        <div className="shrink-0 pt-0.5">
                          {isOrgAdmin ? (
                            <div 
                              className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-primary shadow-2xs" 
                              title="প্রশাসক (Admin)"
                            >
                              <ShieldCheck size={15} />
                            </div>
                          ) : (
                            <div 
                              className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500" 
                              title="সদস্য (Member)"
                            >
                              <Users size={14} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Details (Installment, Frequency, Schedule) */}
                      <div className="grid grid-cols-2 gap-2 text-[12px] bangla text-slate-600 pt-2.5 border-t border-slate-100">
                        <div>
                          <span className="text-[11px] text-slate-400 block">কিস্তির পরিমাণ</span>
                          <strong className="text-emerald-800 text-[13px]">
                            ৳{(plan.installment_amount || 0).toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block">সময়সূচি ও ধরণ</span>
                          <strong className="text-slate-700 capitalize">
                            {plan.frequency === 'weekly' ? 'সাপ্তাহিক' : 'মাসিক'}
                            {plan.duration_months ? ` (${plan.duration_months} মাস)` : ''}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* If Organizations exist but no plan created yet */
              <div className="space-y-3">
                {activeMemberships.map((m) => {
                  const org = m.organization!;
                  const code = org.cooperative_code || org.reg_number || org.slug || generateCooperativeSlug(org.name, org.id);
                  const isOrgAdmin = m.role === 'cooperative_admin' || isPlatformAdmin || activeRole === 'cooperative_admin';

                  return (
                    <div
                      key={m.id}
                      onClick={() => navigate(`/somobay/${code}`)}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary shrink-0">
                          <Building2 size={22} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[15px] font-bold text-slate-800 bangla truncate leading-tight">
                            {org.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {org.reg_number && (
                              <span className="text-[11px] font-semibold text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                                #{org.reg_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOrgAdmin ? (
                          <div 
                            className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-primary" 
                            title="প্রশাসক (Admin)"
                          >
                            <ShieldCheck size={15} />
                          </div>
                        ) : (
                          <div 
                            className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500" 
                            title="সদস্য (Member)"
                          >
                            <Users size={14} />
                          </div>
                        )}
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Single Clean Button */}
            <button
              type="button"
              onClick={() => navigate('/somobay/create')}
              className="w-full py-3 px-4 border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl text-[13px] font-bold text-primary bangla flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-99"
            >
              <Plus size={16} />
              <span>আরেকটি সমবায় খুলুন</span>
            </button>
          </div>
        ) : (
          /* Clean Empty State */
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-5 my-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary mx-auto shadow-xs">
              <Building2 size={32} />
            </div>
            <div className="space-y-1.5 max-w-xs mx-auto">
              <h3 className="text-[17px] font-bold text-slate-800 bangla">
                আপনার কোনো সমবায় নেই
              </h3>
              <p className="text-[13px] text-slate-500 bangla leading-relaxed">
                একটি নতুন সমবায় সমিতি গঠন করে সদস্য ও সঞ্চয় কার্যক্রম পরিচালনা শুরু করুন।
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/somobay/create')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[14px] font-bold bangla shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-98"
              >
                <Plus size={18} />
                <span>সমবায় খুলুন</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
