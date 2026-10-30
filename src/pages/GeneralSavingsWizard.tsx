import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { cooperativeService } from '../lib/cooperativeService';
import { CooperativeSetupPayload } from '../types/cooperativeSetup';
import { 
  Building2, 
  FileCheck2, 
  Users2, 
  PiggyBank, 
  Boxes, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Upload, 
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
  Coins,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STEPS = [
  { id: 1, title: 'সমবায়ের তথ্য', icon: Building2 },
  { id: 2, title: 'নিবন্ধন ও আইন', icon: FileCheck2 },
  { id: 3, title: 'সদস্য ও কমিটি', icon: Users2 },
  { id: 4, title: 'সঞ্চয় প্রাথমিক নিয়ম', icon: PiggyBank },
  { id: 5, title: 'সহায়ক মডিউল', icon: Boxes },
  { id: 6, title: 'পর্যালোচনা ও তৈরি', icon: CheckCircle2 }
];

const AVAILABLE_MODULES = [
  { 
    id: 'general_cooperative', 
    label: 'সাধারণ সমবায় (General Cooperative)', 
    desc: 'নিয়মিত ও ইচ্ছামতো সঞ্চয় ও উত্তোলন (মূল মডিউল)', 
    required: true 
  },
  { 
    id: 'qard_hasanah', 
    label: 'কর্জে হাসানা (সুদমুক্ত মানবিক ধার)', 
    desc: 'বিপদগ্রস্ত সদস্যদের সুদবিহীন মানবিক সহায়তা', 
    required: false 
  },
  { 
    id: 'income_expense', 
    label: 'আয় ও ব্যয় হিসাব বই', 
    desc: 'ভাউচার, সাধারণ খতিয়ান ও ক্যাশ বই ট্র্যাকিং', 
    required: false 
  },
  { 
    id: 'notifications', 
    label: 'বিজ্ঞপ্তি ও সাধারণ সভা', 
    desc: 'সদস্য নোটিশ বোর্ড ও মিটিং নোটিফিকেশন', 
    required: false 
  }
];

export default function GeneralSavingsWizard() {
  const navigate = useNavigate();
  const { user, setActiveOrganizationId } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State specifically dedicated to General Cooperative
  const [formData, setFormData] = useState<CooperativeSetupPayload>({
    cooperative_type: 'general_cooperative',
    name: '',
    logo_url: null,
    activity_type: 'সাধারণ সমবায় সমিতি',
    description: '',
    country: 'বাংলাদেশ',
    division: 'ঢাকা',
    district: '',
    upazila: '',
    local_area: '',
    contact_number: '',
    address: '',

    legal_status: 'registered',
    reg_number: '',
    reg_date: '',
    certificate_url: null,
    bylaws_url: null,

    membership_rules: 'নিয়মিত সঞ্চয়কারী ও স্থানীয় স্থায়ী বাসিন্দা',
    committee: {
      chairperson: '',
      secretary: '',
      treasurer: '',
      manager: ''
    },

    currency: 'BDT',
    financial_year_start: '০১ জুলাই',
    financial_year_end: '৩০ জুন',
    separate_share_capital: true,
    savings_method: 'both',
    withdrawal_approval_required: true,

    enabled_modules: ['general_cooperative', 'qard_hasanah', 'income_expense', 'notifications']
  });

  const updateField = (field: keyof CooperativeSetupPayload, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const updateCommittee = (role: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      committee: { ...prev.committee, [role]: val }
    }));
  };

  const toggleModule = (modId: string) => {
    if (modId === 'general_cooperative') return; // Cannot disable the core module
    setFormData(prev => {
      const exists = prev.enabled_modules.includes(modId);
      return {
        ...prev,
        enabled_modules: exists
          ? prev.enabled_modules.filter(m => m !== modId)
          : [...prev.enabled_modules, modId]
      };
    });
  };

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setErrorMsg('দয়া করে সমবায়ের নাম লিখুন।');
        return;
      }
    }
    if (currentStep < 6) {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    } else {
      navigate('/somobay/create');
    }
  };

  const handleSubmit = async (isDraft = false) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await cooperativeService.saveCooperative(
        { ...formData, is_draft: isDraft },
        undefined,
        user?.id
      );

      if (!res.success) throw new Error(res.error);

      setSuccessMsg(isDraft ? 'খসড়া হিসেবে সংরক্ষিত হয়েছে!' : 'সাধারণ সমবায় সফলভাবে তৈরি হয়েছে!');
      if (res.organizationId) {
        setActiveOrganizationId(res.organizationId);
      }
      // Navigate to the standardized General Cooperative Settings page for this cooperative
      setTimeout(() => {
        const targetSlug = (res as any).slug || res.organizationId;
        navigate(`/somobay/${targetSlug}/settings?created=true`);
      }, 1000);
    } catch (e: any) {
      setErrorMsg(e.message || 'সমবায় তৈরি করতে ব্যর্থ হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="সাধারণ সমবায় নিবন্ধন"
      showBack={true}
      onBack={handlePrev}
    >
      {/* 6 Step Progress Indicator */}
      <div className="bg-white p-3 rounded-2xl border border-border shadow-xs mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[12px] font-bold text-primary bangla flex items-center gap-1.5">
            <PiggyBank size={15} />
            ধাপ {currentStep} / ৬: {STEPS[currentStep - 1].title}
          </span>
          <span className="text-[11px] text-slate-400 font-semibold bangla">
            {Math.round((currentStep / 6) * 100)}% সম্পন্ন
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] bangla flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] bangla flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs space-y-4 pb-20">
        {/* STEP 1: সমবায়ের সাধারণ তথ্য */}
        {currentStep === 1 && (
          <div className="space-y-3.5">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-2 text-[12px] text-emerald-900 bangla">
              <PiggyBank size={16} className="text-primary shrink-0" />
              <span>নির্বাচিত ধরণ: <strong>সাধারণ সমবায় সমিতি</strong></span>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                সমবায় বা সমিতির নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="যেমন: গ্রামীণ সমবায় লিমিটেড বা গ্রাম কল্যাণ সমবায়"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                বিবরণ ও উদ্দেশ্য (ঐচ্ছিক)
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={e => updateField('description', e.target.value)}
                placeholder="সমবায়ের মূল উদ্দেশ্য ও লক্ষ্য..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] bangla focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">বিভাগ</label>
                <input
                  type="text"
                  value={formData.division}
                  onChange={e => updateField('division', e.target.value)}
                  placeholder="ঢাকা"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">জেলা</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={e => updateField('district', e.target.value)}
                  placeholder="গাজীপুর"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">উপজেলা</label>
                <input
                  type="text"
                  value={formData.upazila}
                  onChange={e => updateField('upazila', e.target.value)}
                  placeholder="কালিয়াকৈর"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">এলাকা / গ্রাম</label>
                <input
                  type="text"
                  value={formData.local_area}
                  onChange={e => updateField('local_area', e.target.value)}
                  placeholder="মধ্যপাড়া"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">মোবাইল নম্বর</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={e => updateField('contact_number', e.target.value)}
                placeholder="০১XXXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* STEP 2: নিবন্ধন ও আইনি তথ্য */}
        {currentStep === 2 && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                সরকারি নিবন্ধন স্ট্যাটাস <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'registered', label: 'নিবন্ধিত' },
                  { id: 'in_progress', label: 'প্রক্রিয়াধীন' },
                  { id: 'unregistered', label: 'অনিবন্ধিত' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateField('legal_status', item.id)}
                    className={`py-2 px-1 text-center rounded-xl text-[12px] font-semibold bangla border transition-all ${
                      formData.legal_status === item.id
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.legal_status === 'registered' ? (
              <div className="space-y-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <div>
                  <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                    সরকারি নিবন্ধন নম্বর (Reg. No)
                  </label>
                  <input
                    type="text"
                    value={formData.reg_number || ''}
                    onChange={e => updateField('reg_number', e.target.value)}
                    placeholder="যেমন: সমবায়-২০২৬-১১৮"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] bangla focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">নিবন্ধনের তারিখ</label>
                  <input
                    type="date"
                    value={formData.reg_date || ''}
                    onChange={e => updateField('reg_date', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] bangla focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[12px] bangla flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  আইনি স্বচ্ছতার জন্য অনিবন্ধিত সমিতিকে সরকারি নিবন্ধিত হিসেবে উপস্থাপন করা হবে না। অ্যাপে এটি স্বচ্ছভাবে দেখানো হবে।
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: সদস্য ও কমিটি */}
        {currentStep === 3 && (
          <div className="space-y-3.5">
            <p className="text-[12px] text-slate-500 bangla">
              প্রাথমিক সেটআপে কমিটি অপূর্ণ থাকলে পরবর্তীতে পূর্ণ করা যাবে।
            </p>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">সভাপতি / Chairperson</label>
              <input
                type="text"
                value={formData.committee.chairperson}
                onChange={e => updateCommittee('chairperson', e.target.value)}
                placeholder="সভাপতির নাম"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">সাধারণ সম্পাদক / Secretary</label>
              <input
                type="text"
                value={formData.committee.secretary}
                onChange={e => updateCommittee('secretary', e.target.value)}
                placeholder="সম্পাদকের নাম"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">কোষাধ্যক্ষ / Treasurer</label>
              <input
                type="text"
                value={formData.committee.treasurer}
                onChange={e => updateCommittee('treasurer', e.target.value)}
                placeholder="কোষাধ্যক্ষের নাম"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] bangla focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* STEP 4: সাধারণ সমবায়ের প্রাথমিক নিয়ম (General Cooperative Rules) */}
        {currentStep === 4 && (
          <div className="space-y-3.5">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[12px] bangla flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary shrink-0" />
              <span>
                <strong>১০০% সুদমুক্ত নীতিমালা:</strong> কোনো প্রকার সুদ বা বিলম্ব জরিমানা গ্রহণযোগ্য নয়।
              </span>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">মুদ্রা (Currency)</label>
              <input
                type="text"
                disabled
                value="BDT (৳ - বাংলাদেশী টাকা)"
                className="w-full bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold bangla"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">অর্থবছর শুরু</label>
                <input
                  type="text"
                  value={formData.financial_year_start}
                  onChange={e => updateField('financial_year_start', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] bangla focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">অর্থবছর সমাপ্তি</label>
                <input
                  type="text"
                  value={formData.financial_year_end}
                  onChange={e => updateField('financial_year_end', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] bangla focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                প্রাথমিক সঞ্চয় জমার পদ্ধতি
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[12px] font-semibold bangla">
                {[
                  { id: 'fixed', label: 'নির্দিষ্ট কিস্তি' },
                  { id: 'flexible', label: 'ইচ্ছামতো জমা' },
                  { id: 'both', label: 'উভয় পদ্ধতি' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateField('savings_method', m.id)}
                    className={`py-2 px-1 rounded-xl border transition-all ${
                      formData.savings_method === m.id
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <strong className="text-[13px] text-slate-800 bangla block">শেয়ার মূলধন পৃথক হিসাব</strong>
                <span className="text-[11px] text-slate-500 bangla">সঞ্চয় ও শেয়ার মূলধনের খতিয়ান আলাদা থাকবে</span>
              </div>
              <input
                type="checkbox"
                checked={formData.separate_share_capital}
                onChange={e => updateField('separate_share_capital', e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <strong className="text-[13px] text-slate-800 bangla block">উত্তোলনে অ্যাডমিন অনুমোদন</strong>
                <span className="text-[11px] text-slate-500 bangla">সদস্যের সঞ্চয় উত্তোলনে অ্যাডমিনের যাচাই ও অনুমোদন আবশ্যক</span>
              </div>
              <input
                type="checkbox"
                checked={formData.withdrawal_approval_required}
                onChange={e => updateField('withdrawal_approval_required', e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 text-[11px] bangla">
              ℹ️ নির্দিষ্ট সঞ্চয় প্ল্যান (যেমন: ৫০০/১০০০ টাকা মাসিক কিস্তি), নির্দিষ্ট কিস্তির তারিখ ও পলিসি সমবায় তৈরির পর <strong>সাধারণ সঞ্চয় সেটিংস</strong> পেজে বিস্তারিত নির্ধারণ করতে পারবেন।
            </div>
          </div>
        )}

        {/* STEP 5: সহায়ক মডিউল নির্বাচন */}
        {currentStep === 5 && (
          <div className="space-y-2.5">
            <p className="text-[12px] text-slate-500 bangla">
              সাধারণ সঞ্চয় সমবায়ের সাথে সক্রিয় রাখতে চান এমন সহায়ক মডিউলগুলো নির্বাচন করুন:
            </p>

            {AVAILABLE_MODULES.map(mod => {
              const checked = formData.enabled_modules.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    mod.required 
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : checked 
                        ? 'bg-emerald-50/50 border-emerald-300 cursor-pointer' 
                        : 'bg-slate-50 border-slate-200 opacity-60 cursor-pointer'
                  }`}
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <strong className="text-[13px] text-slate-800 bangla">{mod.label}</strong>
                      {mod.required && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-semibold bangla">
                          মূল
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 bangla mt-0.5">{mod.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={mod.required}
                    checked={checked}
                    onChange={() => toggleModule(mod.id)}
                    className="w-5 h-5 accent-primary shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 6: পর্যালোচনা ও সমবায় তৈরি */}
        {currentStep === 6 && (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-[12px] bangla">
              <h4 className="font-bold text-slate-800 text-[13px] border-b pb-1">সমবায় তথ্যের সারসংক্ষেপ</h4>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">সমবায়ের নাম:</span>
                <span className="font-bold text-slate-800">{formData.name}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">ধরণ:</span>
                <span className="font-semibold text-primary">সাধারণ সঞ্চয় সমবায়</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">নিবন্ধন স্ট্যাটাস:</span>
                <span className="font-medium text-slate-800">
                  {formData.legal_status === 'registered' ? `নিবন্ধিত (${formData.reg_number || 'নম্বরবিহীন'})` : formData.legal_status === 'in_progress' ? 'প্রক্রিয়াধীন' : 'অনিবন্ধিত'}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">সঞ্চয় পদ্ধতি:</span>
                <span className="font-medium text-slate-800">
                  {formData.savings_method === 'fixed' ? 'নির্দিষ্ট কিস্তি' : formData.savings_method === 'flexible' ? 'ইচ্ছামতো জমা' : 'উভয় পদ্ধতি'}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">শেয়ার মূলধন পৃথক:</span>
                <span className="font-medium text-slate-800">{formData.separate_share_capital ? 'হ্যাঁ' : 'না'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">সক্রিয় মডিউল:</span>
                <span className="font-medium text-slate-800">{formData.enabled_modules.length} টি</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[12px] bangla flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <span>
                আমি নিশ্চিত করছি যে প্রদত্ত সকল তথ্য সঠিক ও সত্য। সমবায় তৈরি সম্পন্ন হলে আপনি সরাসরি সাধারণ সঞ্চয় সেটিংস পেজে চলে যাবেন।
              </span>
            </div>
          </div>
        )}

        {/* Navigation Step Actions */}
        <div className="pt-2">
          {currentStep < 6 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[13px] font-semibold bangla flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>পেছনে</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-2 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
              >
                <span>পরবর্তী ধাপ</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[13px] font-semibold bangla flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Save size={16} />
                <span>খসড়া সংরক্ষণ</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="flex-2 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                <span>সমবায় নিশ্চিত করুন</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
