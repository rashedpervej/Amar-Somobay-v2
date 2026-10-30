import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { generalSavingsService } from '../lib/generalSavingsService';
import { 
  Building2,
  Settings2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ChevronRight, 
  Clock, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function GeneralSavingsSettings() {
  const navigate = useNavigate();
  const { cooperativeSlug } = useParams<{ cooperativeSlug: string }>();
  const [searchParams] = useSearchParams();
  const isNewlyCreated = searchParams.get('created') === 'true';

  const { profile, activeOrganization, activeOrganizationId } = useAuthStore();
  const { plans, fetchPlans } = useSomobayStore();

  const [activeTab, setActiveTab] = useState<'general' | 'withdrawals' | 'accounting'>('general');
  const [loading, setLoading] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [successMsg, setSuccessMsg] = useState(isNewlyCreated ? 'অভিনন্দন! সমবায় সফলভাবে গঠিত হয়েছে। এবার সেটিংস ও নিয়মাবলি কনফিগার করুন।' : '');
  const [errorMsg, setErrorMsg] = useState('');

  // Cooperative Basic Info
  const [cooperativeName, setCooperativeName] = useState(activeOrganization?.name || '');

  // Pending Withdrawals State
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // General Rules Config
  const [config, setConfig] = useState({
    allow_partial_deposit: true,
    min_balance_requirement: 500,
    allow_withdrawals: true,
    require_withdrawal_approval: true
  });

  useEffect(() => {
    if (activeOrganization?.name) {
      setCooperativeName(activeOrganization.name);
    }
    fetchPlans();
    loadPendingWithdrawals();
  }, [activeOrganization, fetchPlans]);

  const loadPendingWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const orgId = activeOrganizationId || activeOrganization?.id || '00000000-0000-0000-0000-000000000001';
      const { data, error } = await supabase
        .from('savings_withdrawals')
        .select(`
          id,
          amount,
          requested_at,
          purpose,
          status,
          member_id,
          member_plan_id,
          member:profiles(full_name, phone)
        `)
        .eq('organization_id', orgId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (!error && data) {
        setPendingWithdrawals(data);
      }
    } catch (e) {
      console.error('Error loading withdrawals:', e);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleUpdateCooperativeName = async () => {
    if (!cooperativeName.trim()) {
      setErrorMsg('সমিতির নাম খালি রাখা যাবে না।');
      return;
    }
    setSavingOrg(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const orgId = activeOrganizationId || activeOrganization?.id;
      if (orgId) {
        const { error: orgErr } = await supabase
          .from('organizations')
          .update({ name: cooperativeName.trim() })
          .eq('id', orgId);

        if (orgErr) throw orgErr;

        await supabase
          .from('app_settings')
          .update({ organization_name: cooperativeName.trim(), app_name: cooperativeName.trim() })
          .eq('organization_id', orgId);
      }

      setSuccessMsg('সমিতির তথ্য সফলভাবে আপডেট করা হয়েছে!');
    } catch (err: any) {
      setErrorMsg(err.message || 'সমিতির তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string, decision: 'approved' | 'rejected') => {
    try {
      const orgId = activeOrganizationId || activeOrganization?.id || '00000000-0000-0000-0000-000000000001';
      const res = await generalSavingsService.processWithdrawal({
        withdrawal_id: withdrawalId,
        organization_id: orgId,
        admin_id: profile?.id || 'admin',
        decision
      });

      if (!res.success) throw new Error(res.error);

      setSuccessMsg(decision === 'approved' ? 'উত্তোলন আবেদন অনুমোদিত হয়েছে!' : 'উত্তোলন আবেদন বাতিল করা হয়েছে।');
      loadPendingWithdrawals();
    } catch (e: any) {
      setErrorMsg(e.message || 'আবেদন প্রক্রিয়া করতে ব্যর্থ হয়েছে।');
    }
  };

  const currentSlug = cooperativeSlug || activeOrganization?.slug;
  const activePlansCount = plans.filter(p => p.status === 'active' || p.is_active).length;

  return (
    <MobileLayout
      headerTitle="সমবায় সেটিংস"
      showBack={true}
      onBack={() => navigate(currentSlug ? `/somobay/${currentSlug}` : '/somobay')}
    >
      {/* Welcome Banner for newly created cooperative */}
      {isNewlyCreated && (
        <div className="p-3.5 mb-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-[12px] bangla flex items-start gap-2.5 shadow-xs">
          <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-[13px] text-emerald-950">
              অভিনন্দন! সমবায় তৈরি সম্পন্ন হয়েছে।
            </strong>
            <p className="text-emerald-800 mt-0.5 leading-relaxed">
              আপনার সমবায়ের মৌলিক তথ্য, সাধারণ নিয়মাবলি এবং সদস্যদের সঞ্চয় উত্তোলন সংক্রান্ত সেটিংস নিচে প্রয়োজনমতো কনফিগার করুন।
            </p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-[12px] font-semibold bangla mb-3">
        {[
          { id: 'general', label: 'সাধারণ সেটিংস' },
          { id: 'withdrawals', label: 'উত্তোলন ও অনুমোদন' },
          { id: 'accounting', label: 'হিসাব ও অডিট' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-white text-primary font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] bangla rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-[12px] bangla rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-4 pb-20">
        
        {/* TAB 1: সাধারণ সেটিংস */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            
            {/* 1. সমিতির মৌলিক তথ্য */}
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-slate-800 bangla border-b pb-2 flex items-center gap-2">
                <Building2 size={17} className="text-primary" />
                <span>সমিতির মৌলিক তথ্য</span>
              </h3>

              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                  সমিতির নাম
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cooperativeName}
                    onChange={e => setCooperativeName(e.target.value)}
                    placeholder="সমিতির পূর্ণ নাম লিখুন"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] bangla focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateCooperativeName}
                    disabled={savingOrg}
                    className="bg-primary hover:bg-primary-dark text-white text-[12px] font-bold bangla px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{savingOrg ? '...' : 'সংরক্ষণ'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold bangla block">সমিতি কোড</span>
                  <span className="text-[13px] font-mono font-bold text-slate-800">
                    #{activeOrganization?.reg_number || activeOrganization?.slug?.toUpperCase() || 'SAM-xxxx'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold bangla block">সমিতির স্ট্যাটাস</span>
                  <span className="text-[12px] font-bold text-emerald-700 bangla inline-flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    সক্রিয় সমবায়
                  </span>
                </div>
              </div>
            </div>

            {/* 2. সঞ্চয় স্কিম ও প্ল্যান ম্যানেজমেন্ট হাব লিঙ্ক */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Layers size={17} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 bangla leading-tight">
                      সঞ্চয় স্কিম ও প্ল্যান ব্যবস্থাপনা
                    </h4>
                    <span className="text-[11px] text-emerald-800 bangla">
                      বর্তমানে {activePlansCount} টি সঞ্চয় প্ল্যান সক্রিয় রয়েছে
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11.5px] text-slate-600 bangla leading-relaxed">
                সদস্যদের জন্য নতুন সঞ্চয় প্ল্যান তৈরি, কিস্তি সংশোধন, প্ল্যান চালু বা বন্ধ করতে সরাসরি স্কিম ম্যানেজমেন্ট পেজে যান।
              </p>
              <button
                type="button"
                onClick={() => navigate(currentSlug ? `/somobay/${currentSlug}/plans` : '/somobay')}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[12px] font-bold bangla flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>স্কিম ও প্ল্যান পরিচালনা করুন</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 3. সঞ্চয় ও কিস্তির নিয়মাবলি */}
            <div className="space-y-3 pt-1">
              <h3 className="text-[14px] font-bold text-slate-800 bangla border-b pb-2 flex items-center gap-2">
                <Settings2 size={17} className="text-primary" />
                <span>সঞ্চয় ও কিস্তির নিয়মাবলি</span>
              </h3>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[12px] text-emerald-800 bangla flex items-start gap-2">
                <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>১০০% সুদমুক্ত ও জিরো পেনাল্টি নীতি:</strong> কিস্তি দেরিতে জমা হলে কোনো আর্থিক জরিমানা বা পেনাল্টি ধার্য হবে না। বকেয়াকে কেবল সাধারণ বকেয়া হিসেবে দেখানো হবে।
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800 bangla">আংশিক জমা সুবিধা</h4>
                    <p className="text-[11px] text-slate-500 bangla">সদস্য কিস্তির কম পরিমাণ টাকাও সঞ্চয় হিসেবে জমা রাখতে পারবেন</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.allow_partial_deposit}
                    onChange={e => setConfig(prev => ({ ...prev, allow_partial_deposit: e.target.checked }))}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                  অ্যাকাউন্টে বাধ্যতামূলক ন্যূনতম স্থিতি (টাকা)
                </label>
                <input
                  type="number"
                  value={config.min_balance_requirement}
                  onChange={e => setConfig(prev => ({ ...prev, min_balance_requirement: Number(e.target.value) }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] bangla focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-slate-500 bangla mt-1 block">
                  সঞ্চয় উত্তোলন করলেও এই পরিমাণ অর্থ অ্যাকাউন্টে সর্বদা সংরক্ষিত থাকবে।
                </span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: উত্তোলন ও অনুমোদন */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <h3 className="text-[14px] font-bold text-slate-800 bangla border-b pb-2">
              সদস্য উত্তোলন সেটিংস ও অনুমোদন কিউ
            </h3>

            {/* Policy Toggles */}
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 bangla">সদস্য উত্তোলন সুবিধা</h4>
                  <p className="text-[11px] text-slate-500 bangla">সদস্য অ্যাপ থেকে সাধারণ সঞ্চয় উত্তোলনের আবেদন করতে পারবেন</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.allow_withdrawals}
                  onChange={e => setConfig(prev => ({ ...prev, allow_withdrawals: e.target.checked }))}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 bangla">অ্যাডমিন অনুমোদন বাধ্যতামূলক</h4>
                  <p className="text-[11px] text-slate-500 bangla">উত্তোলনের অর্থ বিতরণের পূর্বে অ্যাডমিনের যাচাই ও অনুমোদন আবশ্যক</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.require_withdrawal_approval}
                  onChange={e => setConfig(prev => ({ ...prev, require_withdrawal_approval: e.target.checked }))}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Pending Requests Queue */}
            <div className="pt-2 border-t space-y-2.5">
              <div className="flex justify-between items-center">
                <h4 className="text-[13px] font-bold text-slate-800 bangla flex items-center gap-1.5">
                  <Clock size={16} className="text-amber-600" />
                  <span>পেন্ডিং উত্তোলন আবেদন ({pendingWithdrawals.length} টি)</span>
                </h4>
                <button
                  type="button"
                  onClick={loadPendingWithdrawals}
                  className="text-[11px] text-primary font-bold bangla cursor-pointer"
                >
                  রিফ্রেশ
                </button>
              </div>

              {loadingWithdrawals ? (
                <div className="text-center py-6 text-[12px] text-slate-400 bangla">লোড হচ্ছে...</div>
              ) : pendingWithdrawals.length > 0 ? (
                <div className="space-y-2">
                  {pendingWithdrawals.map(req => (
                    <div key={req.id} className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-[13px] text-slate-800 bangla block">
                            {req.member?.full_name || 'অজ্ঞাত সদস্য'}
                          </strong>
                          <span className="text-[11px] text-slate-500 bangla">
                            মোবাইল: {req.member?.phone || 'নেই'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-bold text-rose-600">
                            ৳{req.amount?.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block bangla">
                            {new Date(req.requested_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </div>

                      {req.purpose && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg bangla">
                          উদ্দেশ্য: {req.purpose}
                        </p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleProcessWithdrawal(req.id, 'rejected')}
                          className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[12px] bangla rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        >
                          বাতিল করুন
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProcessWithdrawal(req.id, 'approved')}
                          className="flex-1 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold text-[12px] bangla rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          অনুমোদন করুন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-[12px] text-slate-400 bangla">
                  কোনো পেন্ডিং উত্তোলন আবেদন নেই।
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: হিসাব ও অডিট */}
        {activeTab === 'accounting' && (
          <div className="space-y-3.5">
            <h3 className="text-[14px] font-bold text-slate-800 bangla border-b pb-2">হিসাবরক্ষণ ও অডিট ট্রেইল</h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-[13px] font-bold text-slate-800 bangla">অপরিবর্তনীয় লেজার নীতিমালা</h4>
              <p className="text-[11px] text-slate-600 bangla leading-relaxed">
                কোনো আর্থিক লেনদেন ডেটাবেস থেকে সরাসরি এডিট বা ডিলিট করা সম্পূর্ণ নিষিদ্ধ। ভুল সংশোধন করতে হলে সংশোধন বা রিভার্সাল এন্ট্রি ব্যবহার করা হয় যা অডিট লগে সংরক্ষিত থাকে।
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-[12px] text-emerald-900 bangla">
              <strong>শেয়ার মূলধন বনাম সাধারণ সঞ্চয়:</strong>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                শেয়ার মূলধন হলো সমবায়ের দীর্ঘমেয়াদি মূলধন, যা নিয়মিত সঞ্চয়ের সাথে মিশ্রিত হয় না। সাধারণ সঞ্চয়ের ব্যালেন্স ও শেয়ার মূলধনের খতিয়ান সম্পূর্ণ আলাদা সংরক্ষিত।
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/reports')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] bangla rounded-xl text-center cursor-pointer"
              >
                লেজার ও অডিট রিপোর্ট
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/savings')}
                className="flex-1 py-2.5 bg-primary text-white font-bold text-[12px] bangla rounded-xl text-center shadow-xs cursor-pointer"
              >
                সঞ্চয় আদায় ড্যাশবোর্ড
              </button>
            </div>
          </div>
        )}

      </div>
    </MobileLayout>
  );
}
