import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { SomobayPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Settings, 
  Save, 
  Trash2, 
  Award, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Target, 
  FileText,
  DollarSign,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GoalSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [memberLimit, setMemberLimit] = useState<number | ''>(12);
  const [status, setStatus] = useState<'active' | 'completed' | 'paused'>('active');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const g = await jointGoalService.getGoalById(id);
        if (!g) {
          navigate('/joint-goals');
          return;
        }
        setGoal(g);
        setName(g.name);
        setDescription(g.description || '');
        setTargetAmount(g.target_amount || 0);
        setMemberLimit(g.total_members_limit || 12);
        setStatus((g.status as any) || 'active');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;

    setSaving(true);
    try {
      await jointGoalService.updateGoal(id, {
        name: name.trim(),
        description: description.trim(),
        target_amount: Number(targetAmount) || 0,
        total_members_limit: Number(memberLimit) || 12,
        status: status as any
      });

      alert('লক্ষ্যের তথ্য সফলভাবে আপডেট হয়েছে!');
      navigate(`/joint-goals/${id}`);
    } catch (err: any) {
      alert('আপডেট করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!id) return;
    const confirm = window.confirm('আপনি কি এই লক্ষ্যটিকে আনুষ্ঠানিকভাবে সফল ও সম্পন্ন ঘোষণা করতে চান?');
    if (!confirm) return;

    setSaving(true);
    try {
      await jointGoalService.updateGoal(id, { status: 'completed' });
      navigate(`/joint-goals/${id}/completed`);
    } catch (err: any) {
      alert('স্ট্যাটাস পরিবর্তনে সমস্যা: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!id) return;
    const confirm = window.confirm('সতর্কতা: আপনি কি নিশ্চিত যে এই লক্ষ্যটি এবং এর সকল সংশ্লিষ্ট ডাটা মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না!');
    if (!confirm) return;

    setDeleting(true);
    try {
      await jointGoalService.deleteGoal(id);
      alert('যৌথ সঞ্চয় লক্ষ্য সফলভাবে মুছে ফেলা হয়েছে।');
      navigate('/joint-goals');
    } catch (err: any) {
      alert('লক্ষ্য মুছে ফেলতে সমস্যা: ' + (err.message || ''));
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !goal) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">সেটিংস লোড হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      headerTitle="লক্ষ্য সেটিংস ও পরিচালনা"
      headerSubtitle={goal.name}
      backTo={`/joint-goals/${id}`}
      showBack={true}
    >

      <div className="p-4 space-y-5 pb-28">
        {/* Edit Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border p-4.5 space-y-4 shadow-sm">
          <h3 className="text-[14px] font-bold text-slate-800 bangla border-b border-slate-100 pb-2">
            মূল তথ্য সম্পাদনা
          </h3>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <Target size={14} className="text-primary" />
              <span>লক্ষ্যের শিরোনাম *</span>
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <FileText size={14} className="text-primary" />
              <span>বিবরণ ও উদ্দেশ্য</span>
            </label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1.5">
                <DollarSign size={14} className="text-primary" />
                <span>টার্গেট পরিমাণ (৳)</span>
              </label>
              <input 
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1.5">
                <Users size={14} className="text-primary" />
                <span>সদস্য সীমা</span>
              </label>
              <input 
                type="number"
                value={memberLimit}
                onChange={(e) => setMemberLimit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700 bangla">স্ট্যাটাস</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary"
            >
              <option value="active">সক্রিয় (চলমান)</option>
              <option value="paused">সাময়িক স্থগিত (Paused)</option>
              <option value="completed">সম্পন্ন (Completed)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>তথ্য সংরক্ষণ করুন</span>
          </button>
        </form>

        {/* Milestone Complete Action */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-amber-900 bangla leading-tight">
                লক্ষ্য সম্পন্ন ঘোষণা করুন
              </h4>
              <p className="text-[11px] text-amber-700 bangla">
                লক্ষ্য অর্জিত হলে এটি সম্পন্ন হিসেবে চিহ্নিত করুন
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkCompleted}
            disabled={saving}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-600 text-white font-bold text-[13px] bangla flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-amber-700 shadow-sm"
          >
            <CheckCircle2 size={16} />
            <span>সম্পন্ন ঘোষণা করুন ও উদ্যাপন পেজে যান</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-[14px] bangla">
            <AlertTriangle size={18} />
            <span>বিপজ্জনক এলাকা (Danger Zone)</span>
          </div>

          <p className="text-[12px] text-rose-600 bangla">
            এই যৌথ সঞ্চয় লক্ষ্যটি মুছে ফেললে এর সকল সদস্য অন্তর্ভুক্তি ও খরচের ডাটা স্থায়ীভাবে মুছে যাবে।
          </p>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDeleteGoal}
            className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-[13px] bangla flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-rose-700 shadow-sm disabled:opacity-50"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span>যৌথ সঞ্চয় লক্ষ্য মুছে ফেলুন</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
