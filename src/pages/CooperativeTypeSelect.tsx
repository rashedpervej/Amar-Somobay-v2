import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { 
  PiggyBank, 
  RotateCw, 
  Target, 
  Coins, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck, 
  Info,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

export default function CooperativeTypeSelect() {
  const navigate = useNavigate();
  const { activeOrganization } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExistingPlans = async () => {
      try {
        const { data } = await supabase
          .from('somobay_plans')
          .select('id, name, scheme_type, status')
          .eq('status', 'active');
        setPlans(data || []);
      } catch (err) {
        console.error('Error fetching plans in type select:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExistingPlans();
  }, []);

  const savingsPlan = plans.find(p => p.scheme_type === 'General' || p.scheme_type === 'savings');
  const roscaPlan = plans.find(p => p.scheme_type === 'rosca');
  const goalPlan = plans.find(p => p.scheme_type === 'joint_goal');

  const types = [
    {
      id: 'general_cooperative',
      title: 'সাধারণ সমবায়',
      englishTitle: 'General Cooperative',
      isExisting: !!savingsPlan,
      existingPlan: savingsPlan,
      badge: savingsPlan ? '১/১ সক্রিয় (সীমা পূর্ণ)' : '০/১ সক্রিয়',
      description: 'নিয়মিত সাপ্তাহিক/মাসিক কিস্তি সঞ্চয়, শেয়ার মূলধন, সদস্য কল্যাণ ও বহুমুখী সাধারণ সমবায় পরিচালনা।',
      icon: <PiggyBank size={28} className="text-emerald-700" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      badgeBg: savingsPlan ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
      actionBtn: savingsPlan ? 'সরাসরি ড্যাশবোর্ডে যান' : 'সাধারণ সমবায় তৈরি করুন',
      actionBg: savingsPlan ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-primary hover:bg-primary-dark text-white shadow-emerald-700/20',
      features: [
        'নির্দিষ্ট কিস্তি বা ইচ্ছামতো সঞ্চয় পদ্ধতি',
        'সাপ্তাহিক বা মাসিক জমা সময়সূচি',
        'শেয়ার মূলধন ও সাধারণ সমবায় পৃথক লেজার',
        'সুদমুক্ত প্রত্যাহারের আবেদন ও অনুমোদন'
      ],
      path: savingsPlan ? `/somobay/manage/${savingsPlan.id}` : '/somobay/create/general'
    },
    {
      id: 'rosca',
      title: 'রোসকা / ঘূর্ণায়মান সঞ্চয়',
      englishTitle: 'ROSCA / Rotational Savings',
      isExisting: !!roscaPlan,
      existingPlan: roscaPlan,
      badge: roscaPlan ? '১/১ সক্রিয় (সীমা পূর্ণ)' : '০/১ সক্রিয়',
      description: 'চক্রভিত্তিক পালাক্রমিক লটারি বা বিডিং ড্রয়ের মাধ্যমে সদস্যদের মধ্যে সমবায়ের পূর্ণ ফান্ডের আবর্তন।',
      icon: <RotateCw size={28} className="text-indigo-700" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      badgeBg: roscaPlan ? 'bg-indigo-100 text-indigo-900 border-indigo-300' : 'bg-indigo-50 text-indigo-800 border-indigo-200',
      actionBtn: roscaPlan ? 'রোসকা ড্যাশবোর্ডে যান' : 'রোসকা সমিতি তৈরি করুন',
      actionBg: roscaPlan ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
      features: [
        'নির্দিষ্ট সদস্য সংখ্যা ও পর্বভিত্তিক চক্র',
        'স্বচ্ছ ম্যানুয়াল বা স্বয়ংক্রিয় ড্র পদ্ধতি',
        'প্রতি পর্বে একজন সদস্যের মোট ফান্ড গ্রহণ'
      ],
      path: roscaPlan ? `/rosca/${roscaPlan.id}` : '/somobay/create/rosca'
    },
    {
      id: 'joint_goal',
      title: 'জয়েন্ট গোল / যৌথ সঞ্চয়',
      englishTitle: 'Joint Goal / Collective Savings',
      isExisting: !!goalPlan,
      existingPlan: goalPlan,
      badge: goalPlan ? '১/১ সক্রিয় (সীমা পূর্ণ)' : '০/১ সক্রিয়',
      description: 'নির্দিষ্ট কোনো সাধারণ লক্ষ্য (যেমন জমি ক্রয়, প্রকল্প বা তহবিল গঠন)-এর জন্য সম্মিলিত সঞ্চয়।',
      icon: <Target size={28} className="text-teal-700" />,
      iconBg: 'bg-teal-50 border-teal-100',
      badgeBg: goalPlan ? 'bg-teal-100 text-teal-900 border-teal-300' : 'bg-teal-50 text-teal-800 border-teal-200',
      actionBtn: goalPlan ? 'জয়েন্ট গোল ড্যাশবোর্ডে যান' : 'জয়েন্ট গোল তৈরি করুন',
      actionBg: goalPlan ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20',
      features: [
        'টার্গেট অ্যামাউন্ট ও ডেডলাইন ট্র্যাকিং',
        'সম্মিলিত একাধিক সদস্যের নিয়মিত অবদান',
        'রিয়েল-টাইম ফান্ড অগ্রগতি চার্ট'
      ],
      path: goalPlan ? `/joint-goals/${goalPlan.id}` : '/joint-goals/create'
    }
  ];

  return (
    <MobileLayout
      headerTitle="নতুন সমবায় তৈরি করুন"
      showBack={true}
      onBack={() => navigate(-1)}
    >
      <div className="space-y-4 pb-20">
        {/* Intro Header */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-xs">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider bangla block">
            ধাপ ১ — ধরণ নির্বাচন
          </span>
          <h2 className="text-[18px] font-bold text-slate-800 bangla mt-0.5">
            সমবায়ের ধরণ নির্বাচন করুন
          </h2>
          <p className="text-[12px] text-slate-500 bangla mt-1 leading-relaxed">
            প্রতিটি সমিতি থেকে প্রতিটি ক্যাটাগরিতে সর্বোচ্চ <strong>১টি সমবায়</strong> পরিচালনা করা যাবে।
          </p>
        </div>

        {/* Cooperative Type Cards */}
        <div className="space-y-3.5">
          {types.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl p-4 border border-border shadow-xs hover:border-emerald-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${t.iconBg}`}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-slate-800 bangla">
                      {t.title}
                    </h3>
                  </div>
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${t.badgeBg} bangla`}>
                    {t.badge}
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-slate-600 bangla leading-relaxed mb-3">
                {t.description}
              </p>

              {t.isExisting && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-3 flex items-center justify-between text-[11px] bangla text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock size={13} className="text-slate-500" />
                    <span>চলমান সমবায়: {t.existingPlan?.name}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">সক্রিয়</span>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="space-y-1.5 py-2 px-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                {t.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-600 bangla">
                    <CheckCircle2 size={13} className="text-primary shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate(t.path)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-[13px] bangla flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer ${t.actionBg}`}
              >
                <span>{t.actionBtn}</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Qard Hasanah Independence Info Card */}
        <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <Coins size={18} />
          </div>
          <div className="space-y-1 text-slate-700 text-[12px] bangla leading-relaxed">
            <strong className="text-amber-900 block font-bold">
              কর্জে হাসানা (সুদমুক্ত ধার ও সহায়তা) সম্পর্কে তথ্য:
            </strong>
            <p className="text-slate-600">
              কর্জে হাসানা কোনো বিনিয়োগ বা লাভ-লোকসানভিত্তিক সঞ্চয় স্কিম নয়। এটি বিপদগ্রস্ত সদস্যদের পাশে দাঁড়ানোর জন্য একটি সম্পূর্ণ সুদমুক্ত কল্যাণমূলক মডিউল। সমবায় গঠনের পর আপনি সমবায়ের প্রয়োজনে মডিউল সেটিংস থেকে এটি সক্রিয় করতে পারবেন।
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
