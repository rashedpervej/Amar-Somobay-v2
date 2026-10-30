import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Settings, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  ToggleLeft, 
  ToggleRight,
  Save
} from 'lucide-react';

export default function RoscaSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<SomobayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    duration_months: 12,
    installment_amount: 1000,
    total_members_limit: 12,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    auto_next_cycle: true
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const p = await roscaService.getRoscaPlanById(id);
        setPlan(p);
        if (p) {
          setFormData({
            name: p.name || `Cycle ${p.current_cycle || 1}`,
            duration_months: p.duration_months || 12,
            installment_amount: p.installment_amount || 0,
            total_members_limit: p.total_members_limit || 12,
            start_date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + (p.duration_months || 12) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            auto_next_cycle: true
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      await roscaService.updateRoscaPlan(id, {
        name: formData.name,
        duration_months: formData.duration_months,
        installment_amount: formData.installment_amount,
        total_members_limit: formData.total_members_limit,
        target_amount: formData.installment_amount * formData.total_members_limit
      });
      alert('চক্রের সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
      navigate(`/rosca/${id}`);
    } catch (err: any) {
      alert('সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !plan) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[14px] bangla">লোড হচ্ছে...</span>
        </div>
      </MobileLayout>
    );
  }

  const potAmount = formData.installment_amount * formData.total_members_limit;

  return (
    <MobileLayout
      headerTitle="চক্রের সেটিংস"
      backTo={`/rosca/${id}`}
    >

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-3xl p-5 border border-border shadow-xs space-y-3.5">
          {/* চক্রের নাম & মোট সদস্য */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-text-primary bangla">চক্রের নাম</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-[14px] font-bold bangla outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-text-primary bangla">মোট সদস্য</label>
              <input
                type="number"
                min={2}
                value={formData.total_members_limit}
                onChange={(e) => setFormData({ ...formData, total_members_limit: Number(e.target.value) })}
                className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-[14px] font-bold bangla outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          {/* মাসিক কিস্তি & মোট ড্র পরিমাণ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-text-primary bangla">মাসিক কিস্তি (প্রতি সদস্য)</label>
              <input
                type="number"
                step={100}
                value={formData.installment_amount}
                onChange={(e) => setFormData({ ...formData, installment_amount: Number(e.target.value) })}
                className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-[14px] font-bold bangla outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-text-primary bangla">মোট ড্র পরিমাণ</label>
              <div className="w-full bg-slate-100 border border-border rounded-xl px-3 py-2.5 text-[14px] font-bold text-primary bangla">
                ৳ {potAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* শুরুর তারিখ & শেষ তারিখ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-text-primary bangla">শুরুর তারিখ</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2 text-[13px] bangla outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-text-primary bangla">শেষ তারিখ</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full bg-bg-soft border border-border rounded-xl px-3 py-2 text-[13px] bangla outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Toggle: স্বয়ংক্রিয় পরবর্তী চক্র তৈরি */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <span className="text-[13px] font-bold text-text-primary bangla block">
                স্বয়ংক্রিয় পরবর্তী চক্র তৈরি
              </span>
              <span className="text-[11px] text-text-secondary bangla block mt-0.5">
                চক্র সমাপ্ত হলে নতুন চক্র তৈরি হবে
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, auto_next_cycle: !formData.auto_next_cycle })}
              className="text-primary p-1"
            >
              {formData.auto_next_cycle ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold bangla text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>সংরক্ষণ করুন</span>
        </button>
      </form>
    </MobileLayout>
  );
}
