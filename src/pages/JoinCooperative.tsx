import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Search, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UserPlus, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  QrCode,
  Share2,
  Clock,
  Phone,
  PhoneCall,
  MessageCircle,
  MapPin,
  ChevronDown,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { BD_DIVISIONS, BD_DISTRICTS } from '../data/bdGeo';

export default function JoinCooperative() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const { user, profile, fetchMemberships, memberships } = useAuthStore();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  // Area Cooperatives State (আপনার এলাকার সমিতি)
  const [areaOrgs, setAreaOrgs] = useState<any[]>([]);
  const [loadingAreaOrgs, setLoadingAreaOrgs] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState(profile?.division || '');
  const [selectedDistrict, setSelectedDistrict] = useState(profile?.district || '');

  // Contact Manager Modal State
  const [contactModalOrg, setContactModalOrg] = useState<any | null>(null);

  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [existingNewOrgPending, setExistingNewOrgPending] = useState<any>(null);
  const [existingJoinPending, setExistingJoinPending] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Initialize area filter from user profile once available
  useEffect(() => {
    if (profile) {
      if (profile.division && !selectedDivision) setSelectedDivision(profile.division);
      if (profile.district && !selectedDistrict) setSelectedDistrict(profile.district);
    }
  }, [profile]);

  const checkUserPendingApps = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('organization_members')
      .select('*, organization:organizations(*)')
      .eq('user_id', user.id);

    if (data && data.length > 0) {
      const pendingNew = data.find(m => m.role === 'cooperative_admin' && (m.status === 'pending' || m.organization?.status === 'pending'));
      if (pendingNew) setExistingNewOrgPending(pendingNew.organization || { name: 'নতুন সমিতি' });
      else setExistingNewOrgPending(null);

      const pendingJoin = data.find(m => m.role === 'member' && (m.status === 'pending' || m.status === 'rejected'));
      if (pendingJoin) {
        setExistingJoinPending({
          ...(pendingJoin.organization || { id: pendingJoin.organization_id, name: 'বিদ্যমান সমিতি' }),
          membership_status: pendingJoin.status,
          rejection_reason: pendingJoin.rejection_reason
        });
      } else {
        setExistingJoinPending(null);
      }
    } else {
      setExistingNewOrgPending(null);
      setExistingJoinPending(null);
    }
  };

  useEffect(() => {
    checkUserPendingApps();
  }, [user]);

  // Initial code/slug from URL if provided (উপায় ২: ইনভাইট লিংক)
  useEffect(() => {
    const codeParam = searchParams.get('code') || slug;
    if (codeParam) {
      loadByCodeOrSlug(codeParam);
    }
  }, [searchParams, slug]);

  const loadByCodeOrSlug = async (param: string) => {
    try {
      setSearching(true);
      const cleanParam = param.replace('#', '').trim();
      const { data } = await supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(
            id,
            role,
            status,
            profile:profiles(id, full_name, phone, avatar_url)
          )
        `)
        .eq('status', 'active')
        .or(`reg_number.ilike.%${cleanParam}%,slug.eq.${cleanParam},name.ilike.%${cleanParam}%`)
        .limit(1);

      if (data && data.length > 0) {
        setSelectedOrg(data[0]);
      }
    } catch (err) {
      console.error('Error finding org by param:', err);
    } finally {
      setSearching(false);
    }
  };

  // Fetch all active cooperatives for area exploration
  const fetchAreaOrganizations = async () => {
    try {
      setLoadingAreaOrgs(true);
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(
            id,
            role,
            status,
            profile:profiles(id, full_name, phone, avatar_url)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) throw error;
      setAreaOrgs(data || []);
    } catch (err) {
      console.error('Error fetching area orgs:', err);
      setAreaOrgs([]);
    } finally {
      setLoadingAreaOrgs(false);
    }
  };

  useEffect(() => {
    fetchAreaOrganizations();
  }, [user]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setErrorMsg('');
    try {
      const cleanQ = query.replace('#', '').trim();
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          members:organization_members(
            id,
            role,
            status,
            profile:profiles(id, full_name, phone, avatar_url)
          )
        `)
        .eq('status', 'active')
        .or(`name.ilike.%${cleanQ}%,reg_number.ilike.%${cleanQ}%,slug.ilike.%${cleanQ}%`)
        .limit(10);

      if (error) throw error;
      setOrganizations(data || []);
      if (data && data.length === 1) {
        setSelectedOrg(data[0]);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorMsg('সমিতি খুঁজতে সমস্যা হয়েছে।');
    } finally {
      setSearching(false);
    }
  };

  const handleJoinRequest = async (org: any) => {
    if (!user) {
      setErrorMsg('দয়া করে প্রথমে লগইন করুন।');
      return;
    }

    setJoining(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', org.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          alert('আপনি ইতিমধ্যে এই সমিতির সক্রিয় সদস্য!');
          navigate('/somobay');
          return;
        } else if (existing.status === 'pending') {
          alert('আপনার যোগদানের অনুরোধ ইতিমধ্যে পর্যালোচনায় রয়েছে!');
          return;
        } else if (existing.status === 'rejected') {
          // Clean up old rejected application before creating fresh request
          await supabase.from('organization_members').delete().eq('id', existing.id);
        }
      }

      // Insert fresh join request
      const { error: insErr } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: org.id,
          user_id: user.id,
          role: 'member',
          status: 'pending'
        }]);

      if (insErr) throw insErr;

      setSuccessMsg(`"${org.name}" সমিতিতে যোগদানের অনুরোধ সফলভাবে পাঠানো হয়েছে!`);
      await fetchMemberships();
      setTimeout(() => {
        navigate('/pending');
      }, 1500);
    } catch (err: any) {
      console.error('Join request error:', err);
      setErrorMsg(err.message || 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।');
    } finally {
      setJoining(false);
    }
  };

  const handleWithdraw = async (orgId: string, type: 'org' | 'join') => {
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

      setExistingNewOrgPending(null);
      setExistingJoinPending(null);
      await fetchMemberships();
      await checkUserPendingApps();
      alert('আপনার আবেদনটি সফলভাবে প্রত্যাহার করা হয়েছে। আপনি এখন যেকোনো সমিতিতে যুক্ত হতে পারবেন।');
    } catch (err: any) {
      console.error('Error withdrawing application:', err);
      alert(err.message || 'আবেদন প্রত্যাহার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setWithdrawing(false);
    }
  };

  // Helper to extract manager/admin contact details
  const getOrgManager = (org: any) => {
    if (!org) return { name: 'সমিতি ম্যানেজার', phone: '', roleTitle: 'ম্যানেজার' };
    const adminMember = org.members?.find((m: any) => m.role === 'cooperative_admin');
    const name = adminMember?.profile?.full_name || 'সমিতি ম্যানেজার';
    const phone = org.config?.phone || adminMember?.profile?.phone || '';
    const roleTitle = org.config?.role_title || 'সমিতি অ্যাডমিন';
    return { name, phone, roleTitle };
  };

  const getWhatsAppUrl = (phone: string, orgName: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '88' + clean;
    } else if (!clean.startsWith('88') && clean.length === 10) {
      clean = '880' + clean;
    }
    const text = encodeURIComponent(`আসসালামু আলাইকুম, আমি "${orgName}" সমবায় সমিতিতে যুক্ত হতে আগ্রহী। বিস্তারিত জানতে চাই।`);
    return `https://wa.me/${clean}?text=${text}`;
  };

  // Filter area organizations strictly based on selected division and district
  // A user CANNOT see all organizations nationwide simultaneously - only selected area or their own profile area!
  const filteredAreaOrgs = areaOrgs.filter((org) => {
    if (!selectedDivision) return false;
    const orgDiv = org.config?.division;
    const orgAddr = org.config?.address || '';
    if (orgDiv && orgDiv !== selectedDivision) return false;
    if (!orgDiv && !orgAddr.includes(selectedDivision)) return false;

    if (selectedDistrict) {
      const orgDist = org.config?.district;
      if (orgDist && orgDist !== selectedDistrict) return false;
      if (!orgDist && !orgAddr.includes(selectedDistrict)) return false;
    }
    return true;
  });

  return (
    <MobileLayout
      headerTitle="সমিতিতে জয়েন করুন"
      headerSubtitle="সদস্য হিসেবে যুক্ত হোন"
      backTo="/dashboard"
      showBack={true}
    >
      <div className="p-4 space-y-4 pb-28">
        {/* Banner */}
        <div className="bg-linear-to-r from-teal-700 to-teal-900 text-white rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full bangla">
              সদস্য অন্তর্ভুক্তি (Member Join)
            </span>
          </div>
          <h2 className="text-[17px] font-bold bangla leading-snug">
            আপনার পরিচিত সমিতিতে এক ক্লিকে যুক্ত হোন
          </h2>
          <p className="text-[12px] text-teal-100/90 bangla leading-relaxed">
            আপনার এলাকার সক্রিয় সমিতি খুঁজুন, ম্যানেজারের সাথে সরাসরি যোগাযোগ করুন অথবা কোড দিয়ে জয়েন করুন।
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

        {/* Existing New Org Application Notice Card */}
        {existingNewOrgPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-[14px] bangla">
              <Clock size={18} className="text-amber-600 shrink-0" />
              <span>নতুন সমিতি পরিচালনার আবেদন চলমান</span>
            </div>
            <p className="text-[12px] text-amber-800 bangla leading-relaxed">
              আপনি ইতিমধ্যে <b>"{existingNewOrgPending.name}"</b> নতুন সমিতি পরিচালনার আবেদন জমা দিয়েছেন। সুপার অ্যাডমিনের সিদ্ধান্ত না পাওয়া পর্যন্ত বিদ্যমান সমিতিতে সদস্য হওয়ার আবেদন স্থগিত থাকবে।
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate('/cooperative/apply')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[12px] font-bold bangla cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                সমিতি পরিচালনার আবেদন দেখুন
              </button>
            </div>
          </div>
        )}

        {/* Rejected Join Application Notice */}
        {existingJoinPending && !existingNewOrgPending && existingJoinPending.membership_status === 'rejected' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-[14px] bangla">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <span>যোগদানের আবেদন বাতিল হয়েছে</span>
              </div>
              <span className="text-[10px] font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full bangla">
                বাতিলকৃত
              </span>
            </div>
            <p className="text-[12px] text-rose-800 bangla leading-relaxed">
              <b>"{existingJoinPending.name}"</b> সমিতিতে আপনার যোগদানের আবেদনটি বাতিল করা হয়েছে।
            </p>
            {existingJoinPending.rejection_reason && (
              <div className="p-2.5 bg-white/80 rounded-xl border border-rose-100 text-[11.5px] bangla text-rose-900">
                <span className="font-bold">বাতিলের কারণ: </span>
                <span>{existingJoinPending.rejection_reason}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={withdrawing}
                onClick={() => handleWithdraw(existingJoinPending.id, 'join')}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-[12px] font-bold bangla cursor-pointer active:scale-95 transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {withdrawing ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>অন্য সমিতিতে আবেদন করুন (বাতিল রেকর্ড মুছুন)</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Join Pending Application Notice */}
        {existingJoinPending && !existingNewOrgPending && existingJoinPending.membership_status !== 'rejected' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-[14px] bangla">
                <Clock size={18} className="text-blue-600 shrink-0" />
                <span>যোগদানের আবেদন চলমান রয়েছে</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full bangla">
                পর্যালোচনাধীন
              </span>
            </div>
            <p className="text-[12px] text-blue-800 bangla leading-relaxed">
              আপনি ইতিমধ্যে <b>"{existingJoinPending.name}"</b> সমিতিতে যোগদানের আবেদন পাঠিয়েছেন। সমিতির অ্যাডমিন আবেদনটি পর্যালোচনা করছেন।
            </p>
          </div>
        )}

        {!existingNewOrgPending && (
          <>
            {/* Selected Org Confirmation Card (উপায় ২: ইনভাইট লিংক দিয়ে এলে) */}
            {selectedOrg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-4.5 border-2 border-emerald-300 shadow-md space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-slate-800 bangla leading-tight">
                        {selectedOrg.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          #{selectedOrg.reg_number}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold bangla">
                          অনুমোদিত সমিতি
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrg.config?.address && (
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-600 bangla">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span>{selectedOrg.config.address}</span>
                  </div>
                )}

                <p className="text-[12px] text-slate-600 bangla leading-relaxed">
                  আপনি এই সমিতিতে সাধারণ সদস্য হিসেবে যুক্ত হতে অনুরোধ পাঠাতে পারেন। অ্যাডমিন অনুমোদন করলে আপনার অ্যাকাউন্টে সমিতির সঞ্চয় খতিয়ান চালু হবে।
                </p>

                <div className="flex gap-2 pt-1">
                  {/* Contact Manager Button */}
                  <button
                    type="button"
                    onClick={() => setContactModalOrg(selectedOrg)}
                    className="py-3 px-3.5 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 rounded-xl text-[12px] font-bold bangla flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    title="ম্যানেজারের সাথে কল বা হোয়াটসঅ্যাপে কথা বলুন"
                  >
                    <PhoneCall size={15} className="text-emerald-700" />
                    <span>ম্যানেজার</span>
                  </button>

                  <button
                    type="button"
                    disabled={joining}
                    onClick={() => handleJoinRequest(selectedOrg)}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 shadow-sm hover:bg-primary-dark transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {joining ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>অনুরোধ পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>যুক্ত হওয়ার অনুরোধ পাঠান</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* আপনার এলাকার সমিতি দেখুন (Area Cooperatives & Contact Manager) */}
            {/* ========================================================= */}
            <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800 bangla leading-tight">
                      আপনার এলাকার সমিতি সমূহ
                    </h3>
                    <p className="text-[11px] text-slate-500 bangla mt-0.5">
                      নিকটবর্তী সক্রিয় সমবায় নির্বাচন করুন
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full bangla">
                  {filteredAreaOrgs.length}টি সমিতি
                </span>
              </div>

              {/* Area Filter Selector (বিভাগ ও জেলা) */}
              <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
                <div className="relative flex items-center">
                  <select
                    value={selectedDivision}
                    onChange={(e) => {
                      setSelectedDivision(e.target.value);
                      setSelectedDistrict('');
                    }}
                    className="w-full min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-2.5 pr-7 py-2 bangla text-[12px] font-medium outline-none text-slate-800 focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {BD_DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 text-slate-400 pointer-events-none" size={14} />
                </div>

                <div className="relative flex items-center">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedDivision}
                    className="w-full min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-2.5 pr-7 py-2 bangla text-[12px] font-medium outline-none text-slate-800 focus:border-primary disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    <option value="">
                      {!selectedDivision ? 'প্রথমে বিভাগ বাছুন' : 'জেলা নির্বাচন করুন'}
                    </option>
                    {(selectedDivision ? BD_DISTRICTS[selectedDivision] || [] : []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>

              {/* User's Profile Area Pill if detected */}
              {profile?.district && (
                <div className="flex items-center justify-between text-[11px] bangla bg-emerald-50/70 border border-emerald-100 rounded-xl px-3 py-1.5">
                  <span className="text-emerald-900 flex items-center gap-1 truncate mr-2">
                    <span>📍 আপনার প্রোফাইল এলাকা:</span>
                    <strong>{profile.district}{profile.division ? `, ${profile.division}` : ''}</strong>
                  </span>
                  {(selectedDivision !== profile.division || selectedDistrict !== profile.district) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDivision(profile.division || '');
                        setSelectedDistrict(profile.district || '');
                      }}
                      className="text-primary font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      আমার এলাকা
                    </button>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loadingAreaOrgs && (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-[12px] bangla">সমিতি তালিকা লোড হচ্ছে...</span>
                </div>
              )}

              {/* Cooperatives List */}
              {!loadingAreaOrgs && (
                <div className="space-y-2.5 pt-1">
                  {filteredAreaOrgs.length > 0 ? (
                    filteredAreaOrgs.map((org) => {
                      const manager = getOrgManager(org);
                      return (
                        <div
                          key={org.id}
                          className="p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold mt-0.5">
                                <Building2 size={18} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[13.5px] font-bold text-slate-800 bangla leading-snug">
                                  {org.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                                    #{org.reg_number || org.cooperative_code}
                                  </span>
                                  {(org.config?.district || org.config?.address) && (
                                    <span className="text-[10px] text-slate-500 bangla flex items-center gap-0.5 truncate max-w-[170px]">
                                      <MapPin size={11} className="text-slate-400 shrink-0" />
                                      <span>{org.config?.address || `${org.config?.upazila ? org.config.upazila + ', ' : ''}${org.config?.district}`}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold bangla shrink-0">
                              অনুমোদিত
                            </span>
                          </div>

                          {/* Manager Name if known */}
                          {manager.name && manager.name !== 'সমিতি ম্যানেজার' && (
                            <div className="text-[11px] text-slate-500 bangla flex items-center gap-1 pl-1">
                              <span className="text-slate-400">ম্যানেজার:</span>
                              <span className="text-slate-700 font-semibold">{manager.name}</span>
                              {manager.roleTitle && <span className="text-slate-400">({manager.roleTitle})</span>}
                            </div>
                          )}

                          {/* Action Buttons: Contact Manager & Join */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                            {/* Contact Manager Button */}
                            <button
                              type="button"
                              onClick={() => setContactModalOrg(org)}
                              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-xl text-[11px] font-bold bangla flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                              title="ম্যানেজারের সাথে কল বা হোয়াটসঅ্যাপে কথা বলুন"
                            >
                              <PhoneCall size={13} className="text-emerald-700" />
                              <span>ম্যানেজার</span>
                            </button>

                            {/* Join Button */}
                            <button
                              type="button"
                              disabled={joining}
                              onClick={() => handleJoinRequest(org)}
                              className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark active:scale-95 text-white rounded-xl text-[11px] font-bold bangla flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              <UserPlus size={13} />
                              <span>যুক্ত হন</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2.5">
                      <p className="text-[13px] font-bold text-slate-700 bangla">
                        {!selectedDivision ? 'সমিতি দেখতে বিভাগ নির্বাচন করুন' : 'কোনো সক্রিয় সমিতি পাওয়া যায়নি'}
                      </p>

                      {/* If user selected a different area, allow 1-click return to own area */}
                      {profile?.division && (selectedDivision !== profile.division || selectedDistrict !== profile.district) && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDivision(profile.division || '');
                              setSelectedDistrict(profile.district || '');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11.5px] font-bold bangla cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <MapPin size={13} className="text-emerald-700" />
                            <span>আমার নিজের এলাকার সমিতি</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search Box (কোড বা নাম দিয়ে সার্চ) */}
            <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider bangla block">
                কোড বা নাম দিয়ে নির্দিষ্ট সমিতি খুঁজুন
              </span>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="সমিতি কোড (যেমন: SAM-101) বা নাম লিখুন..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[12px] font-bold bangla hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {searching ? 'খোঁজা হচ্ছে...' : 'খুঁজুন'}
                </button>
              </form>

              {/* Search Results */}
              {organizations.length > 0 && !selectedOrg && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 bangla block">
                    প্রাপ্ত ফলাফল ({organizations.length})
                  </span>
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="p-3 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[12px] shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold text-slate-800 bangla leading-tight truncate">
                            {org.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">#{org.reg_number}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Contact Manager */}
                        <button
                          type="button"
                          onClick={() => setContactModalOrg(org)}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-lg text-[10px] font-bold bangla flex items-center gap-1 cursor-pointer"
                        >
                          <PhoneCall size={11} className="text-emerald-700" />
                          <span>ম্যানেজার</span>
                        </button>

                        <button
                          type="button"
                          disabled={joining}
                          onClick={() => handleJoinRequest(org)}
                          className="px-2.5 py-1 bg-primary text-white rounded-lg text-[11px] font-bold bangla hover:bg-primary-dark cursor-pointer disabled:opacity-50"
                        >
                          যুক্ত হন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* How it works FAQ card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-[12px] bangla text-slate-600 leading-relaxed">
          <strong className="text-slate-800 block font-bold">
            সদস্য হওয়ার প্রক্রিয়া:
          </strong>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
            <li>আপনার এলাকার তালিকাভুক্ত সমিতি থেকে উপযুক্ত সমিতি বেছে নিন অথবা সমিতি কোড দিয়ে সার্চ করুন।</li>
            <li>যেকোনো প্রয়োজনে <b>'ম্যানেজার'</b> বাটনে ক্লিক করে সরাসরি ফোন বা হোয়াটসঅ্যাপে কথা বলতে পারেন।</li>
            <li>অনুরোধ পাঠানোর পর অ্যাডমিন অনুমোদন দিলে আপনার অ্যাকাউন্টে সমিতির যাবতীয় সুবিধা চালু হয়ে যাবে।</li>
          </ul>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Contact Manager Modal / Drawer (Phone Call & WhatsApp)     */}
      {/* ========================================================= */}
      {contactModalOrg && (() => {
        const manager = getOrgManager(contactModalOrg);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900 bangla leading-tight">
                      ম্যানেজারের সাথে যোগাযোগ
                    </h3>
                    <p className="text-[11px] text-slate-500 bangla truncate max-w-[220px]">
                      {contactModalOrg.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModalOrg(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Manager Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 bangla uppercase tracking-wider block">
                      দায়িত্বপ্রাপ্ত কর্মকর্তা
                    </span>
                    <h4 className="text-[15px] font-bold text-slate-900 bangla mt-0.5">
                      {manager.name}
                    </h4>
                    <span className="text-[12px] text-emerald-700 font-medium bangla">
                      {manager.roleTitle}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold">
                    <Building2 size={22} />
                  </div>
                </div>

                {contactModalOrg.config?.address && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] text-slate-600 bangla">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{contactModalOrg.config.address}</span>
                  </div>
                )}
              </div>

              {/* Contact Actions: Call & WhatsApp */}
              {manager.phone ? (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-500 bangla block">
                    যোগাযোগের মাধ্যম নির্বাচন করুন:
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Direct Call Button */}
                    <a
                      href={`tel:${manager.phone.replace(/\s+/g, '')}`}
                      className="py-3 px-3 bg-[#1b7a54] hover:bg-[#166344] active:scale-95 text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 shadow-xs transition-all text-center"
                    >
                      <Phone size={16} />
                      <span>সরাসরি কল</span>
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={getWhatsAppUrl(manager.phone, contactModalOrg.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-3 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 shadow-xs transition-all text-center"
                    >
                      <MessageCircle size={16} />
                      <span>হোয়াটসঅ্যাপ</span>
                    </a>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 bangla">মোবাইল নম্বর: </span>
                    <strong className="text-[13px] font-mono font-bold text-emerald-800 tracking-wider">
                      {manager.phone}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[12px] bangla space-y-1.5">
                  <p className="font-semibold">
                    এই সমিতির ম্যানেজারের সরাসরি ফোন নম্বর যুক্ত করা নেই।
                  </p>
                  <p className="text-[11px] text-amber-700">
                    আপনি সরাসরি 'যুক্ত হওয়ার অনুরোধ' পাঠালে কর্তৃপক্ষ আপনার প্রোফাইল দেখে যোগাযোগ করবেন।
                  </p>
                </div>
              )}

              {/* Bottom Join or Close Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const org = contactModalOrg;
                    setContactModalOrg(null);
                    handleJoinRequest(org);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-bold bangla transition-colors cursor-pointer"
                >
                  সমিতিতে যুক্ত হওয়ার অনুরোধ পাঠান
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </MobileLayout>
  );
}
