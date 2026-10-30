import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { generateCooperativeSlug } from '../lib/slugUtils';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  MapPin, 
  Phone, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { 
  BD_DIVISIONS, 
  BD_DISTRICTS, 
  BD_UPAZILAS, 
  getUnionsByDistrictAndUpazila, 
  cleanUnionName 
} from '../data/bdGeo';
import { motion } from 'motion/react';

export default function ApplyCooperative() {
  const navigate = useNavigate();
  const { user, profile, fetchMemberships, memberships } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Location Hierarchy: Division -> District -> Upazila -> Union/Pouroshova -> Village/Moholla
  const [division, setDivision] = useState(profile?.division || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [upazila, setUpazila] = useState(profile?.upazila || '');
  const [unionPouro, setUnionPouro] = useState(profile?.union_pouro || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [isCustomUnion, setIsCustomUnion] = useState(false);

  const [phone, setPhone] = useState(profile?.phone || '');
  const [roleTitle, setRoleTitle] = useState('সভাপতি (President)');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-populate from profile once available
  useEffect(() => {
    if (profile) {
      if (!division && profile.division) setDivision(profile.division);
      if (!district && profile.district) setDistrict(profile.district);
      if (!upazila && profile.upazila) setUpazila(profile.upazila);
      if (!unionPouro && profile.union_pouro) setUnionPouro(profile.union_pouro);
      if (!village && profile.village) setVillage(profile.village);
      if (!phone && profile.phone) setPhone(profile.phone);
    }
  }, [profile]);

  // Derived options
  const districtOptions = division ? (BD_DISTRICTS[division] || []) : [];
  const upazilaOptions = district ? (BD_UPAZILAS[district] || []) : [];
  const unionOptions = (district && upazila)
    ? getUnionsByDistrictAndUpazila(district, upazila)
    : (upazila ? getUnionsByDistrictAndUpazila('', upazila) : []);

  // Check if user already has a pending application
  const [pendingApplication, setPendingApplication] = useState<any>(null);
  const [existingJoinPending, setExistingJoinPending] = useState<any>(null);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const checkPendingApp = async () => {
    if (!user) return;
    try {
      setLoadingCheck(true);
      const { data, error } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const pendingNew = data.find(m => m.role === 'cooperative_admin' && (
          m.status === 'pending' || m.status === 'rejected' ||
          m.organization?.status === 'pending' || m.organization?.status === 'rejected'
        ));
        if (pendingNew?.organization) {
          setPendingApplication({
            ...pendingNew.organization,
            membership_status: pendingNew.status,
            rejection_reason: pendingNew.rejection_reason || pendingNew.organization?.rejection_reason || pendingNew.organization?.config?.rejection_reason
          });
        } else {
          setPendingApplication(null);
        }

        const pendingJoin = data.find(m => m.role === 'member' && (m.status === 'pending' || m.status === 'rejected'));
        if (pendingJoin) {
          setExistingJoinPending(pendingJoin.organization || { id: pendingJoin.organization_id, name: 'বিদ্যমান সমিতি' });
        } else {
          setExistingJoinPending(null);
        }
      } else {
        setPendingApplication(null);
        setExistingJoinPending(null);
      }
    } catch (err) {
      console.error('Error checking pending application:', err);
    } finally {
      setLoadingCheck(false);
    }
  };

  useEffect(() => {
    checkPendingApp();
  }, [user]);

  const handleReapply = async (orgId: string) => {
    if (!user || !orgId) return;
    try {
      setWithdrawing(true);
      await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', orgId);

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          new BroadcastChannel('amar_somobay_live_sync').postMessage({ type: 'DATA_CHANGED' });
        } catch (_) {}
      }

      setPendingApplication(null);
      await fetchMemberships();
      await checkPendingApp();
    } catch (err: any) {
      console.error('Error clearing old application:', err);
      alert('পুনরায় আবেদন করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setWithdrawing(false);
    }
  };

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

      setPendingApplication(null);
      setExistingJoinPending(null);
      await fetchMemberships();
      await checkPendingApp();
      alert('আপনার আবেদনটি সফলভাবে প্রত্যাহার করা হয়েছে। আপনি এখন নতুন আবেদন করতে পারবেন।');
    } catch (err: any) {
      console.error('Error withdrawing application:', err);
      alert(err.message || 'আবেদন প্রত্যাহার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('দয়া করে প্রথমে লগইন করুন।');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('দয়া করে সমিতির নাম লিখুন।');
      return;
    }

    if (!division) {
      setErrorMsg('দয়া করে সমিতির বিভাগ নির্বাচন করুন।');
      return;
    }

    if (!district) {
      setErrorMsg('দয়া করে সমিতির জেলা নির্বাচন করুন।');
      return;
    }

    if (!upazila) {
      setErrorMsg('দয়া করে সমিতির উপজেলা নির্বাচন করুন।');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('দয়া করে আপনার মোবাইল নম্বর লিখুন।');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Build full formatted address string
      const fullAddress = [
        village.trim(),
        unionPouro.trim(),
        upazila.trim(),
        district.trim(),
        division.trim()
      ].filter(Boolean).join(', ');

      // Generate a permanent unique cooperative code: e.g. SAM-4078
      const cooperativeCode = `SAM-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Insert new organization with status 'pending' & location in config
      const { data: newOrg, error: orgErr } = await supabase
        .from('organizations')
        .insert([{
          name: name.trim(),
          cooperative_code: cooperativeCode,
          reg_number: cooperativeCode,
          slug: cooperativeCode.toLowerCase(),
          status: 'pending',
          config: {
            description: description.trim(),
            address: fullAddress,
            division: division || null,
            district: district || null,
            upazila: upazila || null,
            union_pouro: unionPouro || null,
            village: village.trim() || null,
            role_title: roleTitle,
            phone: phone.trim()
          }
        }])
        .select()
        .single();

      if (orgErr) throw orgErr;

      // 2. Link applicant in organization_members with role 'cooperative_admin' & status 'pending'
      const { error: memErr } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'cooperative_admin',
          status: 'pending'
        }]);

      if (memErr) throw memErr;

      // 3. Update user profile phone and address if not already filled
      const profileUpdates: Record<string, any> = {};
      if (phone.trim() && !profile?.phone) profileUpdates.phone = phone.trim();
      if (division && !profile?.division) profileUpdates.division = division;
      if (district && !profile?.district) profileUpdates.district = district;
      if (upazila && !profile?.upazila) profileUpdates.upazila = upazila;
      if (unionPouro && !profile?.union_pouro) profileUpdates.union_pouro = unionPouro;
      if (village && !profile?.village) profileUpdates.village = village.trim();

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
      }

      setSuccessMsg('আপনার সমিতির আবেদনটি সফলভাবে জমা হয়েছে!');
      setPendingApplication(newOrg);
      
      // Trigger live sync across Super Admin dashboard and tabs
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          new BroadcastChannel('amar_somobay_live_sync').postMessage({ type: 'DATA_CHANGED' });
        } catch (_) {}
      }

      await fetchMemberships();
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setErrorMsg(err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="সমিতি পরিচালনার আবেদন"
      headerSubtitle="নতুন সমিতি চালুর আবেদন ফরম"
      backTo="/dashboard"
      showBack={true}
    >
      <div className="p-4 space-y-4 pb-28">
        {/* Intro Banner */}
        <div className="bg-linear-to-r from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full bangla">
              সমিতি অ্যাডমিন অনবোর্ডিং
            </span>
          </div>
          <h2 className="text-[17px] font-bold bangla leading-snug">
            আপনার সমবায় সমিতি ডিজিটাল প্ল্যাটফর্মে পরিচালনা করুন
          </h2>
          <p className="text-[12px] text-emerald-100/90 bangla leading-relaxed">
            সমিতির নাম ও তথ্য দিয়ে আবেদন জমা দিন। সুপার অ্যাডমিন অনুমোদন দিলেই আপনার সমিতি আইডি সক্রিয় হবে এবং আপনি সমবায় পরিচালনা করতে পারবেন।
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[13px] bangla flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[13px] bangla flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Admin Qualification Blocked Card */}
        {profile?.is_admin_blocked && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-rose-900 bangla leading-tight">
                  অ্যাডমিন আবেদন সাময়িকভাবে স্থগিত
                </h3>
                <p className="text-[12px] text-rose-700 bangla mt-1 leading-relaxed">
                  সুপার অ্যাডমিন কর্তৃক আপনার অ্যাকাউন্ট থেকে নতুন সমবায় সমিতি তৈরির আবেদন করার যোগ্যতা স্থগিত করা হয়েছে।
                </p>
              </div>
            </div>

            {profile?.admin_blocked_reason && (
              <div className="p-3 bg-white/90 rounded-xl border border-rose-100 text-[12px] bangla text-rose-900 space-y-0.5">
                <span className="font-bold text-rose-800">ব্লকের কারণ / মন্তব্য:</span>
                <p className="text-slate-700">{profile.admin_blocked_reason}</p>
              </div>
            )}

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[12px] text-emerald-900 bangla">
              💡 আপনি আপনার এলাকার যেকোনো বিদ্যমান সমবায় সমিতিতে সাধারণ সদস্য হিসেবে যোগদান করতে পারেন।
            </div>

            <button
              type="button"
              onClick={() => navigate('/cooperative/join')}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[13px] font-bold bangla cursor-pointer active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>সমিতিতে যুক্ত হোন (Join Cooperative)</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Rejected Application Card */}
        {pendingApplication && (pendingApplication.status === 'rejected' || pendingApplication.membership_status === 'rejected') && !profile?.is_admin_blocked && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4.5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-[14px] bangla">
                <AlertCircle size={19} className="text-rose-600 shrink-0" />
                <span>আবেদনটি বাতিল / প্রত্যাখ্যাত হয়েছে</span>
              </div>
              <span className="text-[11px] font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full bangla">
                বাতিলকৃত
              </span>
            </div>

            <div className="p-3.5 bg-white/90 rounded-xl border border-rose-100 space-y-2 text-[12px] bangla">
              <div>
                <span className="text-slate-500">সমিতির নাম: </span>
                <strong className="text-slate-800">{pendingApplication.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">ট্র্যাকিং কোড: </span>
                <strong className="font-mono text-emerald-700">#{pendingApplication.reg_number}</strong>
              </div>
              
              {/* Rejection Reason from Super Admin */}
              <div className="pt-2 border-t border-rose-100 text-[12.5px]">
                <span className="font-bold text-rose-800 block mb-0.5">সুপার অ্যাডমিনের মন্তব্য / কারণ:</span>
                <p className="text-slate-700 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/70 leading-relaxed">
                  {pendingApplication.rejection_reason || 'তথ্য বা প্রমাণাদি অসম্পূর্ণ থাকায় আবেদনটি বাতিল করা হয়েছে।'}
                </p>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-600 bangla leading-relaxed">
              সুপার অ্যাডমিনের মন্তব্য অনুযায়ী প্রয়োজনীয় তথ্য সংশোধন করে আপনি পুনরায় নতুন আবেদন জমা দিতে পারেন।
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={withdrawing}
                onClick={() => handleWithdrawApplication(pendingApplication.id, 'org')}
                className="py-2.5 px-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[12px] font-bold bangla transition-all active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {withdrawing ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>আবেদন মুছুন</span>
              </button>
              <button
                type="button"
                disabled={withdrawing}
                onClick={() => handleReapply(pendingApplication.id)}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[12.5px] font-bold bangla shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {withdrawing ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>সংশোধন করে পুনরায় আবেদন করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Pending Application Status Card */}
        {pendingApplication && pendingApplication.status !== 'rejected' && pendingApplication.membership_status !== 'rejected' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-[14px] bangla">
                <Clock size={18} className="text-amber-600 shrink-0" />
                <span>আবেদন পর্যালোচনায় রয়েছে</span>
              </div>
              <span className="text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full bangla">
                অনুমোদনের অপেক্ষায়
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-amber-100 space-y-1.5 text-[12px] bangla">
              <div>
                <span className="text-slate-500">সমিতির নাম: </span>
                <strong className="text-slate-800">{pendingApplication.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">ট্র্যাকিং কোড: </span>
                <strong className="font-mono text-emerald-700">#{pendingApplication.reg_number}</strong>
              </div>
              <div>
                <span className="text-slate-500">আবেদনের তারিখ: </span>
                <span className="text-slate-700">
                  {new Date(pendingApplication.created_at).toLocaleDateString('bn-BD')}
                </span>
              </div>
              {pendingApplication.config?.address && (
                <div>
                  <span className="text-slate-500">অঞ্চল ও ঠিকানা: </span>
                  <span className="text-slate-700 font-medium">{pendingApplication.config.address}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-amber-800/90 bangla leading-relaxed">
              সুপার অ্যাডমিন আপনার আবেদনটি যাচাই করছেন। অনুমোদন সম্পন্ন হলে আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে সমিতি অ্যাডমিন ড্যাশবোর্ড চালু হয়ে যাবে।
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={withdrawing}
                onClick={() => handleWithdrawApplication(pendingApplication.id, 'org')}
                className="py-2.5 px-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[12px] font-bold bangla transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                {withdrawing ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>আবেদন প্রত্যাহার</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-[12px] font-bold bangla hover:bg-amber-700 transition-colors cursor-pointer"
              >
                ড্যাশবোর্ডে ফিরে যান
              </button>
            </div>
          </div>
        )}

        {/* Existing Join Pending Card */}
        {existingJoinPending && !pendingApplication && !profile?.is_admin_blocked && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-[14px] bangla">
              <AlertCircle size={18} className="text-blue-600 shrink-0" />
              <span>যোগদানের আবেদন চলমান রয়েছে</span>
            </div>
            <p className="text-[12px] text-blue-800 bangla leading-relaxed">
              আপনি ইতিমধ্যে <b>"{existingJoinPending.name}"</b> সমিতিতে যোগদানের আবেদন জমা দিয়েছেন। আপনার আবেদনটি নিষ্পত্তি না হওয়া পর্যন্ত নতুন সমিতি পরিচালনার আবেদন করা যাবে না।
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={withdrawing}
                onClick={() => handleWithdrawApplication(existingJoinPending.id, 'join')}
                className="py-2.5 px-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[12px] font-bold bangla transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                {withdrawing ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>প্রত্যাহার করুন</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/cooperative/join')}
                className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-[12px] font-bold bangla cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                যোগদানের আবেদন দেখুন
              </button>
            </div>
          </div>
        )}

        {/* Application Form */}
        {!pendingApplication && !existingJoinPending && !profile?.is_admin_blocked && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-4.5 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-[14px] font-bold text-slate-800 bangla">
                সমিতি নিবন্ধনের আবেদন ফরম
              </h3>
              <p className="text-[11px] text-slate-500 bangla mt-0.5">
                সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন
              </p>
            </div>

            {/* Samity Name */}
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
                <Building2 size={15} className="text-primary" />
                <span>সমিতির নাম *</span>
              </label>
              <input
                type="text"
                placeholder="যেমন: ধানমন্ডি প্রবাসী কল্যাণ সমবায় সমিতি"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
                <FileText size={15} className="text-primary" />
                <span>সমিতির মূল লক্ষ্য ও বিবরণ (ঐচ্ছিক)</span>
              </label>
              <textarea
                rows={2}
                placeholder="সমিতির মূল উদ্দেশ্য ও সাধারণ সদস্যদের বিবরণ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
              />
            </div>

            {/* ========================================================= */}
            {/* অঞ্চল ও ঠিকানা: বিভাগ, জেলা, উপজেলা, ইউনিয়ন/পৌরসভা, গ্রাম/মহল্লা */}
            {/* ========================================================= */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-primary" />
                <span className="text-[13px] font-bold text-slate-700 bangla">অঞ্চল ও ঠিকানা *</span>
              </div>

              {/* বিভাগ ও জেলা (Grid 2 cols) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* বিভাগ */}
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-600 bangla">বিভাগ *</label>
                  <div className="relative flex items-center">
                    <select
                      value={division}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDivision(val);
                        setDistrict('');
                        setUpazila('');
                        setUnionPouro('');
                        setIsCustomUnion(false);
                      }}
                      required
                      className="w-full min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-3 pr-8 py-2.5 bangla text-[13px] font-medium outline-none text-slate-800 focus:border-primary focus:bg-white appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {BD_DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* জেলা */}
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-600 bangla">জেলা *</label>
                  <div className="relative flex items-center">
                    <select
                      value={district}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDistrict(val);
                        setUpazila('');
                        setUnionPouro('');
                        setIsCustomUnion(false);
                      }}
                      disabled={!division}
                      required
                      className="w-full min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-3 pr-8 py-2.5 bangla text-[13px] font-medium outline-none text-slate-800 focus:border-primary focus:bg-white disabled:opacity-50 appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">
                        {!division ? 'প্রথমে বিভাগ' : 'নির্বাচন করুন'}
                      </option>
                      {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* উপজেলা ও ইউনিয়ন/পৌরসভা (Grid 2 cols) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* উপজেলা */}
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-600 bangla">উপজেলা *</label>
                  <div className="relative flex items-center">
                    <select
                      value={upazila}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUpazila(val);
                        setUnionPouro('');
                        setIsCustomUnion(false);
                      }}
                      disabled={!district}
                      required
                      className="w-full min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-3 pr-8 py-2.5 bangla text-[13px] font-medium outline-none text-slate-800 focus:border-primary focus:bg-white disabled:opacity-50 appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">
                        {!district ? 'প্রথমে জেলা' : 'নির্বাচন করুন'}
                      </option>
                      {upazilaOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* ইউনিয়ন/পৌরসভা */}
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-600 bangla">ইউনিয়ন/পৌরসভা</label>
                  <div className="relative flex items-center">
                    <select
                      value={
                        isCustomUnion
                          ? '__other__'
                          : unionOptions.includes(unionPouro)
                          ? unionPouro
                          : unionOptions.includes(cleanUnionName(unionPouro))
                          ? cleanUnionName(unionPouro)
                          : unionPouro
                          ? '__other__'
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__other__') {
                          setIsCustomUnion(true);
                          if (unionOptions.includes(unionPouro)) {
                            setUnionPouro('');
                          }
                        } else {
                          setIsCustomUnion(false);
                          setUnionPouro(val);
                        }
                      }}
                      disabled={!upazila}
                      className="w-full min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-3 pr-8 py-2.5 bangla text-[13px] font-medium outline-none text-slate-800 focus:border-primary focus:bg-white disabled:opacity-50 appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">
                        {!upazila ? 'প্রথমে উপজেলা' : 'নির্বাচন করুন'}
                      </option>
                      {unionOptions.map(u => <option key={u} value={u}>{u}</option>)}
                      <option value="__other__">অন্যান্য (লিখুন)</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Custom Union Input if selected */}
              {(isCustomUnion || (unionPouro && !unionOptions.includes(unionPouro))) && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={unionPouro}
                    onChange={(e) => setUnionPouro(e.target.value)}
                    placeholder="ইউনিয়ন বা পৌরসভার নাম লিখুন"
                    autoFocus={isCustomUnion && !unionPouro}
                    className="w-full min-h-[48px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              )}

              {/* গ্রাম বা মহল্লা */}
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-600 bangla">গ্রাম বা মহল্লা</label>
                <input
                  type="text"
                  placeholder="যেমন: মধ্যপাড়া, রোড নং ৫ বা এলাকা"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full min-h-[48px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
                />
              </div>
            </div>

            {/* Applicant Role & Phone */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1">
                  <UserCheck size={14} className="text-primary" />
                  <span>আপনার পদবী *</span>
                </label>
                <div className="relative flex items-center">
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full min-h-[46px] p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold bangla text-slate-800 outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="সভাপতি (President)">সভাপতি</option>
                    <option value="সাধারণ সম্পাদক (General Secretary)">সাধারণ সম্পাদক</option>
                    <option value="কোষাধ্যক্ষ (Treasurer)">কোষাধ্যক্ষ</option>
                    <option value="পরিচালক (Director)">পরিচালক</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 text-slate-400 pointer-events-none" size={15} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1">
                  <Phone size={14} className="text-primary" />
                  <span>মোবাইল নম্বর *</span>
                </label>
                <input
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full min-h-[46px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Terms note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-[11px] text-slate-600 bangla leading-relaxed">
              <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
              <span>
                আবেদন সাবমিট করার পর সুপার অ্যাডমিন যাচাই-বাছাই করে অনুমোদন দেবেন। অনুমোদনের পর আপনি আপনার সমিতির জন্য সাধারণ সমবায়, রোসকা ও জয়েন্ট গোল স্কিম চালু করতে পারবেন।
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary text-white rounded-xl text-[14px] font-bold bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-98 transition-all hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>আবেদন জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>আবেদন সম্পন্ন করুন</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </MobileLayout>
  );
}
