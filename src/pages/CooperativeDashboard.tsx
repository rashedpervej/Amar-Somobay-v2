import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  PiggyBank, 
  Users, 
  Settings, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  FileText, 
  RotateCw, 
  Target, 
  Coins,
  ArrowLeft,
  Sliders,
  Wallet,
  Phone,
  UserCheck,
  TrendingUp,
  Clock,
  Plus,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

// Helper: Convert number to Bengali numerals
const toBn = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, d => bnDigits[Number(d)]);
};

// Helper: Format Bengali Date
const formatBnDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'তথ্য নেই';
  try {
    const d = new Date(dateStr);
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${toBn(d.getDate())} ${months[d.getMonth()]}, ${toBn(d.getFullYear())}`;
  } catch {
    return dateStr;
  }
};

export default function CooperativeDashboard() {
  const { cooperativeSlug } = useParams<{ cooperativeSlug: string }>();
  const navigate = useNavigate();
  const context = useOutletContext<{ organization: any; membership: any }>();

  const { profile, activeOrganization } = useAuthStore();
  const { plans, memberPlans, fetchPlans, fetchMemberPlans, adminStats, fetchAdminStats } = useSomobayStore();

  const [adminInfo, setAdminInfo] = useState<any>(null);

  const currentOrg = context?.organization || activeOrganization;
  const currentSlug = cooperativeSlug || currentOrg?.slug || 'somobay';

  useEffect(() => {
    fetchPlans();
    fetchMemberPlans();
    fetchAdminStats();

    if (currentOrg?.id) {
      supabase
        .from('organization_members')
        .select('user_id, role, joined_at, profiles:profiles(id, full_name, phone, email)')
        .eq('organization_id', currentOrg.id)
        .eq('role', 'cooperative_admin')
        .maybeSingle()
        .then(({ data }) => {
          if (data) setAdminInfo(data);
        });
    }
  }, [currentOrg?.id]);

  // Category Plans (Only active schemes for this organization)
  const activePlans = plans.filter(p => p.status === 'active' || p.is_active);
  const generalSavingsPlan = activePlans.find(p => p.scheme_type === 'General' || p.scheme_type === 'savings' || !p.scheme_type);
  const roscaPlan = activePlans.find(p => p.scheme_type === 'rosca');
  const jointGoalPlan = activePlans.find(p => p.scheme_type === 'joint_goal');

  // Stats
  const activeMembersCount = memberPlans.filter(mp => mp.status === 'active').length || adminStats.totalMembers;
  const generalSavingsMembers = memberPlans.filter(mp => generalSavingsPlan && mp.plan_id === generalSavingsPlan.id && mp.status === 'active').length;

  const adminName = adminInfo?.profiles?.full_name || profile?.full_name || 'সমবায় প্রশাসক';
  const adminPhone = adminInfo?.profiles?.phone || profile?.phone || '০১৭xxxxxxxx';
  const regDate = formatBnDate(currentOrg?.created_at);

  const hubItems = [
    {
      id: 'general-cooperative',
      title: 'সাধারণ সমবায় ও কিস্তি আদায়',
      subtitle: 'সঞ্চয় জমা নিন (Quick/Bulk), কিস্তি আদায় ও বকেয়া হিসাব',
      path: `/somobay/${currentSlug}/general-cooperative`,
      icon: <PiggyBank size={22} />,
      color: 'text-primary',
      bg: 'bg-primary-light',
      stat: `৳${(adminStats.totalCollections || 0).toLocaleString()}`
    },
    {
      id: 'members',
      title: 'সমবায় সদস্যবৃন্দ ও লেজার',
      subtitle: 'সদস্য তালিকা, প্রোফাইল, সদস্যপদ ও সঞ্চয় স্থিতি',
      path: `/somobay/${currentSlug}/members`,
      icon: <Users size={22} />,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      stat: `${activeMembersCount} জন সদস্য`
    },
    {
      id: 'reports',
      title: 'সমবায় রিপোর্ট ও অডিট হিসাব',
      subtitle: 'সদস্য তালিকা, কিস্তি ও বকেয়া রিপোর্ট এক্সপোর্ট',
      path: `/somobay/${currentSlug}/reports`,
      icon: <FileText size={22} />,
      color: 'text-sky-700',
      bg: 'bg-sky-50',
      stat: 'এক্সপোর্ট'
    },
    {
      id: 'settings',
      title: 'সমবায় সঞ্চয় পলিসি ও সেটিংস',
      subtitle: 'কিস্তির সময়সূচি, সুদমুক্ত সঞ্চয় নিয়ম ও উত্তোলন শর্তাবলি',
      path: `/somobay/${currentSlug}/settings`,
      icon: <Sliders size={22} />,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      stat: 'কনফিগার'
    }
  ];

  return (
    <MobileLayout
      headerTitle={currentOrg?.name || 'সমবায় সার্বিক ড্যাশবোর্ড'}
      headerSubtitle={currentOrg?.cooperative_code ? `সমিতি কোড: #${currentOrg.cooperative_code}` : currentOrg?.reg_number ? `সমিতি কোড: #${currentOrg.reg_number}` : 'সমিতি ওভারভিউ'}
      showBack={true}
      onBack={() => navigate('/somobay')}
      backTo="/somobay"
      headerRight={
        <button
          onClick={() => navigate(`/somobay/${currentSlug}/settings`)}
          className="p-1.5 text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          title="সেটিংস"
        >
          <Settings size={20} />
        </button>
      }
    >
      <div className="space-y-4 pb-20">

        {/* 1. সমিতির সামগ্রিক পরিচিতি ও অনুমোদন ব্যানার */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Building2 size={26} />
              </div>
              <div>
                <h1 className="text-[17px] font-bold text-slate-800 bangla leading-tight">
                  {currentOrg?.name || 'গ্রামীণ সমবায় সমিতি'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-primary border border-emerald-200 bangla">
                    অনুমোদিত ও সক্রিয় সমবায়
                  </span>
                  {currentOrg?.reg_number && (
                    <span className="text-[11px] text-slate-500 font-mono font-semibold">
                      #{currentOrg.reg_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* সমিতি রেজিস্ট্রেশন ও আবেদন তথ্য সামারি */}
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-2 text-[11px] bangla text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px]">আবেদন / অনুমোদনের তারিখ</span>
              <strong className="text-slate-700">{regDate}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">পরিচালক / সভাপতি</span>
              <strong className="text-slate-700">{adminName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">যোগাযোগ ফোন</span>
              <strong className="text-slate-700 font-mono">{adminPhone}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">সমিতি ধরন</span>
              <strong className="text-emerald-700">বহুমুখী প্রাথমিক সমবায়</strong>
            </div>
          </div>
        </div>

        {/* 2. সার্বিক আর্থিক ও লেনদেন সারসংক্ষেপ (Transaction KPI Overview) */}
        <div>
          <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider bangla px-1 mb-2 block">
            সার্বিক লেনদেন ও আর্থিক স্থিতি
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl p-3.5 border border-border shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 bangla block">মোট সংগৃহীত সঞ্চয়</span>
              <span className="text-[18px] font-bold text-primary mt-1 block">
                ৳{(adminStats.totalCollections || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 bangla mt-0.5 block">সকল প্ল্যান মিলিয়ে মোট জমা</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-border shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 bangla block">বকেয়া কিস্তির পরিমাণ</span>
              <span className="text-[18px] font-bold text-amber-600 mt-1 block">
                ৳{(adminStats.pendingDues || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 bangla mt-0.5 block">চলতি বকেয়া আদায় বাকি</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-border shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 bangla block">সক্রিয় সদস্য সংখ্যা</span>
              <span className="text-[18px] font-bold text-slate-800 mt-1 block">
                {activeMembersCount} জন
              </span>
              <span className="text-[10px] text-slate-400 bangla mt-0.5 block">অনুমোদিত সমিতিসদস্য</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-border shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 bangla block">চলতি সমিতি তহবিল</span>
              <span className="text-[18px] font-bold text-emerald-800 mt-1 block">
                ৳{(adminStats.totalCollections || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 bangla mt-0.5 block">নেট লভ্য সঞ্চয় স্থিতি</span>
            </div>
          </div>
        </div>

        {/* 3. ক্যাটাগরিভিত্তিক সমবায় প্ল্যানসমূহ ও আপডেট (Plan Details & Status) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider bangla block">
              সমিতির আওতাধীন সমবায় প্ল্যানসমূহ ও আপডেট
            </span>
            <span className="text-[11px] text-slate-400 bangla">
              ৩টি ক্যাটাগরি
            </span>
          </div>

          {/* ১. সাধারণ সমবায় প্ল্যান */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary shrink-0">
                  <PiggyBank size={18} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800 bangla leading-tight">
                    সাধারণ সমবায়
                  </h3>
                  <span className="text-[10px] text-slate-400 bangla">নিয়মিত সাপ্তাহিক/মাসিক কিস্তি সঞ্চয়</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bangla ${
                generalSavingsPlan 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {generalSavingsPlan ? 'সক্রিয়' : 'চালু নেই'}
              </span>
            </div>

            {generalSavingsPlan ? (
              <div className="space-y-2.5">
                <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 bangla">
                        {generalSavingsPlan.name}
                      </h4>
                      {generalSavingsPlan.description && (
                        <p className="text-[11px] text-slate-500 bangla line-clamp-1 mt-0.5">
                          {generalSavingsPlan.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded font-bold bangla shrink-0">
                      প্ল্যান সক্রিয়
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-100/60 text-[11px] bangla text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">কিস্তির পরিমাণ</span>
                      <strong className="text-emerald-800">৳{(generalSavingsPlan.installment_amount || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">কিস্তির ধরণ</span>
                      <strong className="text-slate-700">{generalSavingsPlan.frequency === 'weekly' ? 'সাপ্তাহিক' : 'মাসিক'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">সদস্য সংখ্যা</span>
                      <strong className="text-slate-700">{generalSavingsMembers || activeMembersCount} জন</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/somobay/${currentSlug}/plans/${generalSavingsPlan.id}`)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold bangla flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>"{generalSavingsPlan.name}" এর খতিয়ান ও কিস্তি আদায়</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-[12px] text-slate-500 bangla">
                  এই সমিতিতে এখনো সাধারণ সমবায় প্ল্যান চালু করা হয়নি
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/somobay/create/general')}
                  className="py-1.5 px-3 bg-primary text-white rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 shadow-xs hover:bg-primary-dark transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>সাধারণ সমবায় শুরু করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* ২. রোসকা / ঘূর্ণায়মান সঞ্চয় প্ল্যান */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <RotateCw size={18} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800 bangla leading-tight">
                    রোসকা / ঘূর্ণায়মান সঞ্চয়
                  </h3>
                  <span className="text-[10px] text-slate-400 bangla">লটারি বা কিস্তির সম্মিলিত ফান্ড বিতরণ</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bangla ${
                roscaPlan 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {roscaPlan ? 'সক্রিয়' : 'চালু নেই'}
              </span>
            </div>

            {roscaPlan ? (
              <div className="space-y-2.5">
                <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h4 className="text-[14px] font-bold text-slate-800 bangla">
                      {roscaPlan.name}
                    </h4>
                    <span className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-bold bangla">
                      রোসকা সক্রিয়
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-100/60 text-[11px] bangla text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">মোট ফান্ড / পট</span>
                      <strong className="text-indigo-800">৳{(roscaPlan.target_amount || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">কিস্তির পরিমাণ</span>
                      <strong className="text-slate-700">৳{(roscaPlan.installment_amount || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/rosca/${roscaPlan.id}`)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[12px] font-bold bangla flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <span>"{roscaPlan.name}" এর রোসকা রাউন্ড দেখুন</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-[12px] text-slate-500 bangla">
                  ঘূর্ণায়মান সঞ্চয় (রোসকা) এখনো শুরু করা হয়নি
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/somobay/create/rosca')}
                  className="py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>রোসকা শুরু করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* ৩. যৌথ লক্ষ্য সমবায় প্ল্যান */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800 bangla leading-tight">
                    যৌথ সঞ্চয় ও লক্ষ্য
                  </h3>
                  <span className="text-[10px] text-slate-400 bangla">নির্দিষ্ট সামাজিক বা বিনিয়োগ লক্ষ্যভিত্তিক ফান্ড</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bangla ${
                jointGoalPlan 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {jointGoalPlan ? 'সক্রিয়' : 'চালু নেই'}
              </span>
            </div>

            {jointGoalPlan ? (
              <div className="space-y-2.5">
                <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100 space-y-1.5">
                  <h4 className="text-[14px] font-bold text-slate-800 bangla">
                    {jointGoalPlan.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-100/60 text-[11px] bangla text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">টার্গেট লক্ষ্যমাত্রা</span>
                      <strong className="text-amber-800">৳{(jointGoalPlan.target_amount || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">কিস্তির হার</span>
                      <strong className="text-slate-700">৳{(jointGoalPlan.installment_amount || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/joint-goals/${jointGoalPlan.id}`)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[12px] font-bold bangla flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <span>"{jointGoalPlan.name}" এর লক্ষ্য বিবরণ দেখুন</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-[12px] text-slate-500 bangla">
                  যৌথ লক্ষ্য সমবায় এখনো শুরু করা হয়নি
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/somobay/create/joint-goal')}
                  className="py-1.5 px-3 bg-amber-600 text-white rounded-lg text-[11px] font-bold bangla inline-flex items-center gap-1 shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>যৌথ লক্ষ্য শুরু করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. সমবায় প্রশাসনিক কার্যতালিকা ও ব্যবস্থাপনা মেনু */}
        <div className="space-y-2">
          <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider bangla px-1 block">
            সমবায় প্রশাসনিক টুলস ও ম্যানেজমেন্ট মেনু
          </span>

          {hubItems.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.99 }}
              className="bg-white rounded-2xl p-3.5 border border-border shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 shadow-xs`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-800 bangla leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 bangla mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 bangla">
                  {item.stat}
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* 5. সকল সমবায় তালিকায় ফিরে যাওয়ার শর্টকাট */}
        <div className="pt-1">
          <button
            onClick={() => navigate('/somobay')}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[12px] bangla rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>সকল সমবায় তালিকায় ফিরুন</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
