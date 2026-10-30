import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSomobayStore } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  PiggyBank, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock
} from 'lucide-react';

export default function CreateGeneralCooperative() {
  const navigate = useNavigate();
  const { activeOrganizationId } = useAuthStore();
  const { fetchPlans } = useSomobayStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState<number | ''>(1000);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [dueDate, setDueDate] = useState<number>(10);

  const [existingSavings, setExistingSavings] = useState<any>(null);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const { data } = await supabase
          .from('somobay_plans')
          .select('id, name, status')
          .or('scheme_type.eq.General,scheme_type.eq.savings')
          .eq('status', 'active')
          .maybeSingle();

        if (data) {
          setExistingSavings(data);
        }
      } catch (err) {
        console.error('Error checking existing savings:', err);
      } finally {
        setLoadingCheck(false);
      }
    };
    checkExisting();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (existingSavings) {
      setErrorMsg('আপনার সমিতিতে ইতোমধ্যে ১টি সক্রিয় সাধারণ সমবায় রয়েছে। সর্বোচ্চ ১টি সাধারণ সমবায় পরিচালিত হতে পারে।');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('দয়া করে সমবায়ের নাম লিখুন (যেমন: গ্রামীণ সমবায় লিমিটেড)');
      return;
    }

    if (!installmentAmount || Number(installmentAmount) <= 0) {
      setErrorMsg('কিস্তির পরিমাণ ০-এর বেশি হতে হবে।');
      return;
    }

    setSubmitting(true);
    try {
      const planPayload: any = {
        name: name.trim(),
        description: description.trim() || 'সাধারণ সমবায়',
        scheme_type: 'General',
        savings_type: 'both',
        installment_amount: Number(installmentAmount),
        frequency: frequency,
        due_date: frequency === 'monthly' ? Number(dueDate) : null,
        due_day: frequency === 'weekly' ? 0 : null,
        duration_months: 12,
        target_amount: Number(installmentAmount) * 12,
        profit_percentage: 0,
        late_fee_amount: 0,
        is_active: true,
        status: 'active'
      };

      if (activeOrganizationId) {
        planPayload.organization_id = activeOrganizationId;
      }

      const { error } = await supabase
        .from('somobay_plans')
        .insert([planPayload]);

      if (error) throw error;

      await fetchPlans();
      alert(`"${name}" সাধারণ সমবায় সফলভাবে তৈরি করা হয়েছে!`);
      navigate('/somobay');
    } catch (err: any) {
      setErrorMsg(err.message || 'সাধারণ সমবায় তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="নতুন সাধারণ সমবায় তৈরি"
      headerSubtitle="General Cooperative Setup"
      backTo="/somobay/create"
      showBack={true}
    >
      <div className="p-4 space-y-4 pb-28">
        {/* Banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
            <PiggyBank size={22} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-emerald-950 bangla">সাধারণ সমবায় সমিতি</h3>
            <p className="text-[12px] text-emerald-800 bangla">
              সদস্যদের নিয়মিত কিস্তি সঞ্চয়, মূলধন সংরক্ষণ ও সুদমুক্ত সমবায় পরিচালনা।
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-[13px] bangla">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {existingSavings && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-[13px] bangla">
              <Lock size={18} className="text-amber-600 shrink-0" />
              <span>১টি সাধারণ সমবায় সীমা পূর্ণ হয়েছে</span>
            </div>
            <p className="text-[12px] text-amber-700 bangla">
              আপনার সমিতিতে ইতোমধ্যে <strong>"{existingSavings.name}"</strong> সাধারণ সমবায় সক্রিয় রয়েছে। প্রতি সমিতিতে সর্বোচ্চ ১টি সাধারণ সমবায় অনুমোদিত।
            </p>
            <button
              type="button"
              onClick={() => navigate(`/somobay/manage/${existingSavings.id}`)}
              className="w-full py-2 bg-amber-600 text-white rounded-xl text-[12px] font-bold bangla hover:bg-amber-700 transition-colors"
            >
              বিদ্যমান সাধারণ সমবায় ড্যাশবোর্ডে যান
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-4.5 space-y-4 shadow-sm">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <Building2 size={15} className="text-primary" />
              <span>সমবায়ের নাম *</span>
            </label>
            <input 
              type="text"
              placeholder="যেমন: গ্রামীণ সমবায় লিমিটেড বা গ্রাম কল্যাণ সমবায়"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
              required
              disabled={!!existingSavings}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-slate-700 bangla block">
              বিবরণ ও উদ্দেশ্য (ঐচ্ছিক)
            </label>
            <textarea 
              placeholder="সমবায়ের মূল উদ্দেশ্য ও কার্যক্রম..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
              disabled={!!existingSavings}
            />
          </div>

          {/* Installment Amount & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
                <DollarSign size={15} className="text-primary" />
                <span>কিস্তির পরিমাণ (৳) *</span>
              </label>
              <input 
                type="number"
                min="50"
                step="50"
                placeholder="1000"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
                required
                disabled={!!existingSavings}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
                <Calendar size={15} className="text-primary" />
                <span>কিস্তির ধরণ *</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
                disabled={!!existingSavings}
              >
                <option value="monthly">মাসিক কিস্তি</option>
                <option value="weekly">সাপ্তাহিক কিস্তি</option>
              </select>
            </div>
          </div>

          {/* Due Date for monthly */}
          {frequency === 'monthly' && (
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-700 bangla block">
                প্রতি মাসের জমার শেষ তারিখ
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  min="1"
                  max="31"
                  value={dueDate}
                  onChange={(e) => setDueDate(Number(e.target.value))}
                  className="w-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-center text-slate-800 outline-none focus:border-primary"
                  disabled={!!existingSavings}
                />
                <span className="text-[12px] text-slate-500 bangla">তারিখের মধ্যে কিস্তি পরিশোধযোগ্য</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !!existingSavings}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-95 transition-all hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>সাধারণ সমবায় তৈরি সম্পন্ন করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
