import React, { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ChevronRight, 
  LogOut, 
  CheckCircle2, 
  Check, 
  RefreshCw, 
  Camera, 
  Phone, 
  MapPin, 
  Building2, 
  Users, 
  Sparkles, 
  Clock, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  Edit3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettingsStore } from '../store/useSettingsStore';

export default function PendingApproval() {
  const { profile, signOut, initialize } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [pendingNewOrgApp, setPendingNewOrgApp] = useState<any>(null);
  const [pendingJoinApp, setPendingJoinApp] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const appIcon = (settings?.logo_url && settings.logo_url !== '/somobay_logo.svg') ? settings.logo_url : '/icon.svg';

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) {
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      try {
        const { data } = await supabase
          .from('organization_members')
          .select('*, organization:organizations(*)')
          .eq('user_id', profile.id);

        if (data && data.length > 0) {
          // Check if ANY membership is active and its organization is active
          const activeMember = data.find(m => m.status === 'active' && m.organization?.status === 'active');
          if (activeMember) {
            if (profile.role === 'pending') {
              const targetRole = activeMember.role === 'cooperative_admin' ? 'admin' : 'member';
              await supabase.from('profiles').update({ role: targetRole }).eq('id', profile.id);
              useAuthStore.setState({ profile: { ...profile, role: targetRole } });
            }
            await useAuthStore.getState().fetchMemberships();
            navigate('/dashboard', { replace: true });
            return;
          }

          // Check if user applied to create a new organization (pending or rejected)
          const coopApp = data.find(m => m.role === 'cooperative_admin' && (
            m.status === 'pending' || m.status === 'rejected' ||
            m.organization?.status === 'pending' || m.organization?.status === 'rejected'
          ));
          if (coopApp?.organization) {
            setPendingNewOrgApp({
              ...coopApp.organization,
              membership_status: coopApp.status,
              rejection_reason: coopApp.rejection_reason || coopApp.organization.rejection_reason || coopApp.organization.config?.rejection_reason
            });
          } else {
            setPendingNewOrgApp(null);
          }

          // Check if user applied to join an existing organization (pending or rejected)
          const joinApp = data.find(m => m.role === 'member' && (m.status === 'pending' || m.status === 'rejected'));
          if (joinApp) {
            setPendingJoinApp({
              ...joinApp,
              organization: joinApp.organization,
              rejection_reason: joinApp.rejection_reason || joinApp.organization?.rejection_reason
            });
          } else {
            setPendingJoinApp(null);
          }
        } else {
          setPendingNewOrgApp(null);
          setPendingJoinApp(null);
        }
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [profile?.id, navigate]);

  const handleWithdrawApplication = async (orgId: string, type: 'org' | 'join') => {
    if (!user || !orgId) return;
    const confirmMsg = type === 'org'
      ? 'আপনি কি নিশ্চিত যে নতুন সমিতি পরিচালনার আবেদনটি প্রত্যাহার করতে চান? প্রত্যাহার করলে আপনি যেকোনো সময় আবার নতুন আবেদন বা বিদ্যমান সমিতিতে যুক্ত হতে পারবেন।'
      : 'আপনি কি নিশ্চিত যে সমিতিতে যোগদানের আবেদনটি প্রত্যাহার করতে চান? প্রত্যাহার করলে আপনি যেকোনো সময় অন্য কোনো সমিতিতে যোগদানের আবেদন করতে পারবেন।';

    if (!window.confirm(confirmMsg)) return;

    try {
      setWithdrawing(true);
      if (type === 'org') {
        try {
          await supabase.from('organizations').update({ status: 'rejected' }).eq('id', orgId);
        } catch (_) {}
      }

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', orgId);

      if (error) throw error;

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          new BroadcastChannel('amar_somobay_live_sync').postMessage({ type: 'DATA_CHANGED' });
        } catch (_) {}
      }

      setPendingNewOrgApp(null);
      setPendingJoinApp(null);
      await fetchMemberships();
      alert('আপনার আবেদনটি সফলভাবে প্রত্যাহার করা হয়েছে। আপনি এখন নতুন আবেদন করতে পারবেন।');
    } catch (err: any) {
      console.error('Error withdrawing application:', err);
      alert(err.message || 'আবেদন প্রত্যাহার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setWithdrawing(false);
    }
  };

  // Calculate completion percentage dynamically from data fill-up
  const hasIdentity = !!profile?.full_name?.trim();
  const hasPhoto = !!profile?.avatar_url?.trim();
  const hasAddress = !!(profile?.division && profile?.district && profile?.upazila);

  // Dynamic progress calculation based on individual profile data fields
  const calculateDynamicPercentage = () => {
    let score = 0;
    // Identity fields (max 35)
    if (profile?.full_name?.trim()) score += 25;
    if (profile?.gender) score += 5;
    if (profile?.date_of_birth) score += 5;

    // Photo field (max 25)
    if (profile?.avatar_url?.trim()) score += 25;

    // Address fields (max 40)
    if (profile?.division) score += 10;
    if (profile?.district) score += 10;
    if (profile?.upazila) score += 10;
    if (profile?.union_pouro || profile?.village) score += 10;

    return Math.min(100, Math.max(0, score));
  };

  const percentage = calculateDynamicPercentage();

  // Completed core milestones count (out of 3)
  const completedCount = (hasIdentity ? 1 : 0) + (hasPhoto ? 1 : 0) + (hasAddress ? 1 : 0);
  const remainingCount = 3 - completedCount;

  const handleRefresh = async () => {
    setRefreshing(true);
    await initialize();
    setTimeout(() => setRefreshing(false), 800);
  };

  // SVG Circular progress math (radius: 33, stroke: 7)
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine state-specific Bengali headings
  let stateTitle = 'প্রোফাইল অসম্পূর্ণ';
  if (percentage === 100 || completedCount === 3) {
    stateTitle = 'প্রোফাইল সম্পূর্ণ হয়েছে';
  } else if (remainingCount === 1) {
    stateTitle = 'আর মাত্র ১টি ধাপ বাকি';
  } else if (remainingCount === 2) {
    stateTitle = 'আর মাত্র ২টি ধাপ বাকি';
  } else {
    stateTitle = 'প্রোফাইল অসম্পূর্ণ';
  }

  if (loadingData) {
    return (
      <MobileLayout
        headerTitle="আপনার প্রোফাইল"
        showBack={true}
        onBack={() => navigate(-1)}
        showNav={false}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      headerTitle="আপনার প্রোফাইল"
      showBack={true}
      onBack={() => navigate(-1)}
      showNav={false}
    >
      <div className="space-y-4 pt-1 pb-24">
        {/* ========================================================= */}
        {/* HERO SECTION: Welcome & Avatar with minimal shapes (No box) */}
        {/* ========================================================= */}
        <div className="relative overflow-hidden px-1 pt-3 pb-3">
          {/* Minimal soft background shapes behind avatar */}
          <div className="absolute -top-6 -right-6 w-36 h-36 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-8 right-16 w-24 h-24 bg-emerald-50/70 rounded-full blur-xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4">
            {/* Left Content */}
            <div className="space-y-2.5 min-w-0">
              {/* App / Brand Logo (Clean, no surrounding box, larger display) */}
              <div className="flex items-center">
                <img
                  src={appIcon}
                  alt={settings?.app_name || 'আমার সমবায়'}
                  className="h-14 w-auto max-w-[160px] object-contain drop-shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icon.svg';
                  }}
                />
              </div>

              {/* Welcome text & User Info */}
              <div className="space-y-1">
                <h1 className="text-[19px] font-bold text-slate-900 bangla leading-tight">
                  স্বাগতম,
                </h1>
                <h2 className="text-[20px] font-black text-slate-900 bangla leading-tight truncate">
                  {profile?.full_name || 'নতুন সদস্য'}!
                </h2>

                {/* User provided mobile number */}
                {profile?.phone && (
                  <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600 font-medium pt-0.5">
                    <Phone size={13} className="text-emerald-700 shrink-0" />
                    <span className="font-mono">{profile.phone}</span>
                  </div>
                )}

                {/* User upazila, zila */}
                {(profile?.upazila || profile?.district) && (
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bangla">
                    <MapPin size={13} className="text-emerald-700 shrink-0" />
                    <span className="truncate">
                      {profile?.upazila ? `${profile.upazila}, ` : ''}{profile?.district || ''}
                    </span>
                  </div>
                )}
              </div>

              {percentage < 100 && (
                <p className="text-[12px] text-slate-500 bangla leading-relaxed pt-0.5">
                  আপনার প্রোফাইল সম্পন্ন করে সব সুবিধা ব্যবহার করুন।
                </p>
              )}
            </div>

            {/* Right User Photo with edit badge & minimal rays */}
            <div className="relative shrink-0 -mt-2.5">
              {/* Decorative rays */}
              <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-emerald-500">
                <span className="w-1 h-3 bg-emerald-400 rounded-full rotate-45 block" />
              </div>
              <div className="absolute top-1 -right-3 w-6 h-6 flex items-center justify-center text-emerald-500">
                <span className="w-3 h-1 bg-emerald-400 rounded-full block" />
              </div>

              <div 
                onClick={() => navigate('/settings/profile')}
                className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer group"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="avatar" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                ) : (
                  <User size={50} className="text-slate-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/settings/profile')}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
                title="প্রোফাইল সম্পাদন করুন"
              >
                <Edit3 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PENDING / REJECTED NOTICES                                */}
        {/* ========================================================= */}
        {pendingNewOrgApp && (
          <div className={`${
            (pendingNewOrgApp.status === 'rejected' || pendingNewOrgApp.membership_status === 'rejected')
              ? 'bg-rose-50 border-rose-200'
              : 'bg-amber-50 border-amber-200'
          } border p-4 rounded-2xl space-y-3 shadow-2xs`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${
                (pendingNewOrgApp.status === 'rejected' || pendingNewOrgApp.membership_status === 'rejected')
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              } flex items-center justify-center shrink-0 mt-0.5`}>
                {(pendingNewOrgApp.status === 'rejected' || pendingNewOrgApp.membership_status === 'rejected') ? (
                  <AlertCircle size={18} />
                ) : (
                  <Clock size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-[13.5px] font-bold ${
                  (pendingNewOrgApp.status === 'rejected' || pendingNewOrgApp.membership_status === 'rejected')
                    ? 'text-rose-900'
                    : 'text-amber-900'
                } bangla leading-tight`}>
                  {(pendingNewOrgApp.status === 'rejected' || pendingNewOrgApp.membership_status === 'rejected')
                    ? `"${pendingNewOrgApp.name}" সমিতির আবেদনটি বাতিল করা হয়েছে`
                    : `"${pendingNewOrgApp.name}" সমিতির আবেদন পর্যালোচনায় রয়েছে`}
                </h4>
                <p className={`text-[11px] ${
                  (pendingNewOrgApp.status === 'rejected' || pendingNewOrgApp.membership_status === 'rejected')
                    ? 'text-rose-700'
                    : 'text-amber-700'
                } bangla mt-1 leading-relaxed`}>
                  {(pendingNewOrgApp.status === 'rejected' || pendingNewOrgApp.membership_status === 'rejected')
                    ? `সুপার অ্যাডমিনের মন্তব্য: ${pendingNewOrgApp.rejection_reason || 'তথ্য বা শর্তাবলী অসম্পূর্ণ।'}`
                    : 'সুপার অ্যাডমিনের অনুমোদনের পর আপনি সমিতি পরিচালনা শুরু করতে পারবেন।'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-[11px] bangla">
              <span className="text-slate-600 font-mono font-medium">#{pendingNewOrgApp.reg_number || pendingNewOrgApp.cooperative_code}</span>
              <button
                type="button"
                onClick={() => navigate('/cooperative/apply')}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>আবেদনের অবস্থা</span>
                <ChevronRight size={13} className="text-slate-500" />
              </button>
            </div>
          </div>
        )}

        {pendingJoinApp && (
          <div className={`${
            pendingJoinApp.status === 'rejected'
              ? 'bg-rose-50 border-rose-200'
              : 'bg-blue-50 border-blue-200'
          } border p-4 rounded-2xl space-y-3 shadow-2xs`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${
                pendingJoinApp.status === 'rejected'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-blue-100 text-blue-700'
              } flex items-center justify-center shrink-0 mt-0.5`}>
                {pendingJoinApp.status === 'rejected' ? (
                  <AlertCircle size={18} />
                ) : (
                  <Clock size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-[13.5px] font-bold ${
                  pendingJoinApp.status === 'rejected' ? 'text-rose-900' : 'text-blue-900'
                } bangla leading-tight`}>
                  {pendingJoinApp.status === 'rejected'
                    ? `"${pendingJoinApp.organization?.name || 'সমিতি'}" সমিতিতে যোগদানের আবেদন বাতিল হয়েছে`
                    : `"${pendingJoinApp.organization?.name || 'সমিতি'}" সমিতিতে যোগদানের আবেদন প্রক্রিয়াধীন`}
                </h4>
                <p className={`text-[11px] ${
                  pendingJoinApp.status === 'rejected' ? 'text-rose-700' : 'text-blue-700'
                } bangla mt-1 leading-relaxed`}>
                  {pendingJoinApp.status === 'rejected'
                    ? `মন্তব্য: ${pendingJoinApp.rejection_reason || 'সমিতি কর্তৃপক্ষ আপনার আবেদনটি বাতিল করেছেন।'}`
                    : 'সমিতির অ্যাডমিনের অনুমোদনের পর আপনি সদস্য হিসেবে প্রবেশ করতে পারবেন।'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-[11px] bangla">
              <span className="text-slate-600">পদবী: সাধারণ সদস্য</span>
              <button
                type="button"
                onClick={() => navigate('/cooperative/join')}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>আবেদনের অবস্থা</span>
                <ChevronRight size={13} className="text-slate-500" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 1: PROFILE COMPLETION CARD (Hidden when 100% complete) */}
        {/* ========================================================= */}
        {percentage < 100 && (
          <>
            <div className="w-full bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4.5">
              {/* Top Row: Gauge + Status Title */}
              <div className="flex items-center gap-4">
                {/* Circular Gauge */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                    {/* Background Ring */}
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="stroke-slate-100"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    {/* Active Progress Ring */}
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="stroke-[#1b7a54] transition-all duration-700 ease-out"
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[17px] font-black tracking-tight ${percentage === 0 ? 'text-slate-800' : 'text-[#1b7a54]'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Title & Status */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold text-slate-900 bangla leading-tight">
                    {stateTitle}
                  </h3>
                  <p className="text-[12px] text-slate-500 bangla mt-1">
                    {percentage === 100 ? 'সব তথ্য সফলভাবে পূরণ করা হয়েছে' : 'প্রোফাইলের প্রয়োজনীয় তথ্যগুলো সম্পূর্ণ করুন'}
                  </p>
                </div>
              </div>

              {/* Stepper spanning FULL WIDTH of card so connecting lines are long & prominent */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-start justify-between w-full px-1">
                  {/* Step 1: Identity */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        hasIdentity 
                          ? 'bg-[#1b7a54] text-white shadow-2xs' 
                          : 'bg-[#eef8f2] text-[#1b7a54] border border-[#d6ecdf]'
                      }`}
                    >
                      {hasIdentity ? <Check size={19} strokeWidth={2.8} /> : <User size={18} strokeWidth={2} />}
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium bangla mt-2 text-center whitespace-nowrap">
                      পরিচয় লিখুন
                    </span>
                  </div>

                  {/* Extra Long Connecting Line 1 */}
                  <div className={`h-[3.5px] flex-1 mx-3 mt-[18px] rounded-full transition-all ${
                    hasIdentity && hasPhoto ? 'bg-[#1b7a54]' : 'bg-slate-200'
                  }`} />

                  {/* Step 2: Photo */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        hasPhoto 
                          ? 'bg-[#1b7a54] text-white shadow-2xs' 
                          : 'bg-[#eef8f2] text-[#1b7a54] border border-[#d6ecdf]'
                      }`}
                    >
                      {hasPhoto ? <Check size={19} strokeWidth={2.8} /> : <Camera size={18} strokeWidth={2} />}
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium bangla mt-2 text-center whitespace-nowrap">
                      প্রোফাইল ছবি
                    </span>
                  </div>

                  {/* Extra Long Connecting Line 2 */}
                  <div className={`h-[3.5px] flex-1 mx-3 mt-[18px] rounded-full transition-all ${
                    hasPhoto && hasAddress ? 'bg-[#1b7a54]' : 'bg-slate-200'
                  }`} />

                  {/* Step 3: Address */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        hasAddress 
                          ? 'bg-[#1b7a54] text-white shadow-2xs' 
                          : 'bg-[#edf4fc] text-[#3b82f6] border border-[#dbeafe]'
                      }`}
                    >
                      {hasAddress ? <Check size={19} strokeWidth={2.8} /> : <MapPin size={18} strokeWidth={2} />}
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium bangla mt-2 text-center whitespace-nowrap">
                      ঠিকানা লিখুন
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Edit Button: Centered, auto-width (not full width) */}
            <div className="flex justify-center -mt-1">
              <button
                type="button"
                onClick={() => navigate('/settings/profile')}
                className="w-auto px-6 h-[40px] bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 text-primary border border-emerald-200/90 rounded-full font-bold text-[13px] bangla transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                প্রোফাইল সম্পাদনা করুন
              </button>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* CARD 2: NEXT STEPS / APPLICATIONS                        */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          {/* Header */}
          {(!pendingNewOrgApp && !pendingJoinApp) ? (
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1b7a54] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15.5px] font-bold text-slate-900 bangla leading-tight">
                  কোনো আবেদন পাওয়া যায়নি
                </h3>
                <p className="text-[12px] text-slate-500 bangla mt-1 leading-relaxed">
                  এগিয়ে যেতে নিচের যেকোনো একটি নির্বাচন করুন।
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1b7a54] flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <h3 className="text-[15.5px] font-bold text-slate-900 bangla leading-tight">
                পরবর্তী পদক্ষেপ গুলো নিন
              </h3>
            </div>
          )}

          {/* Action Buttons: Stacked vertically, sleek and professional */}
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Action 1: সমিতি তৈরি করুন (Primary Highlight CTA) */}
            <button
              type="button"
              onClick={() => navigate('/cooperative/apply')}
              className="w-full bg-[#1b7a54] hover:bg-[#166344] active:scale-[0.98] text-white rounded-2xl py-3.5 px-4.5 flex items-center justify-between shadow-[0_4px_14px_rgba(27,122,84,0.22)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-white">
                  <Building2 size={20} />
                </div>
                <div className="text-left">
                  <span className="text-[14.5px] font-bold bangla tracking-wide block leading-tight">
                    সমিতি তৈরি করুন
                  </span>
                  <span className="text-[11px] text-emerald-100/85 bangla block mt-0.5">
                    নতুন সমবায় প্রতিষ্ঠান ও পরিচালনার আবেদন
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
                <ChevronRight size={18} className="text-white" />
              </div>
            </button>

            {/* Action 2: সমিতিতে যুক্ত হন (Secondary Outline/Soft CTA) */}
            <button
              type="button"
              onClick={() => navigate('/cooperative/join')}
              className="w-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 rounded-2xl py-3.5 px-4.5 flex items-center justify-between border-2 border-slate-200 hover:border-emerald-500 shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1b7a54] flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <span className="text-[14.5px] font-bold bangla tracking-wide block leading-tight text-slate-900 group-hover:text-[#1b7a54]">
                    সমিতিতে যুক্ত হন
                  </span>
                  <span className="text-[11px] text-slate-500 bangla block mt-0.5">
                    বিদ্যমান কোনো সমিতিতে সাধারণ সদস্য হিসেবে যোগ দিন
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#1b7a54]" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FIXED BOTTOM ACTION BAR: রিফ্রেশ করুন & লগ আউট (Bottom Edge) */}
      {/* ========================================================= */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-30">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-xl py-2.5 px-3 border border-slate-200/90 shadow-2xs flex items-center justify-center gap-2 text-slate-700 font-bold text-[12.5px] bangla transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ করুন</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full bg-rose-50 hover:bg-rose-100/80 active:scale-98 rounded-xl py-2.5 px-3 border border-rose-200/80 shadow-2xs flex items-center justify-center gap-2 text-rose-600 font-bold text-[12.5px] bangla transition-all cursor-pointer"
          >
            <LogOut size={15} className="text-rose-600" />
            <span>লগ আউট</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
