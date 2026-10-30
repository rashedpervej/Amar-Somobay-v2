import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { supabase } from '../../lib/supabase';
import { getTodayLocalDate } from '../../lib/dateUtils';
import { 
  ArrowLeft, 
  Target, 
  DollarSign, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Search,
  Check,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

export default function CreateGoal() {
  const navigate = useNavigate();

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(getTodayLocalDate());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  // Member selection
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  
  // Status & loading
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, avatar_url')
          .order('full_name');

        if (!error && data) {
          setAllMembers(data);
          // By default, select all active members
          setSelectedMemberIds(data.map(m => m.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedMemberIds.length === allMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(allMembers.map(m => m.id));
    }
  };

  const [existingGoalCount, setExistingGoalCount] = useState<number>(0);
  const [firstGoalId, setFirstGoalId] = useState<string | null>(null);

  useEffect(() => {
    jointGoalService.getGoals().then(goals => {
      const active = goals.filter(g => g.status !== 'completed');
      setExistingGoalCount(active.length);
      if (active.length > 0) setFirstGoalId(active[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (existingGoalCount >= 1) {
      setErrorMsg('আপনার সমিতিতে ইতোমধ্যে ১টি সক্রিয় জয়েন্ট গোল রয়েছে। প্রতি সমিতিতে সর্বোচ্চ ১টি জয়েন্ট গোল সমবায় অনুমোদিত।');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('লক্ষ্যের শিরোনাম অবশ্যই প্রদান করতে হবে');
      return;
    }

    if (!targetAmount || Number(targetAmount) <= 0) {
      setErrorMsg('টার্গেট পরিমাণ অবশ্যই ০-এর বেশি হতে হবে');
      return;
    }

    setSubmitting(true);
    try {
      const created = await jointGoalService.createGoal({
        name: name.trim(),
        description: description.trim(),
        target_amount: Number(targetAmount),
        start_date: startDate,
        end_date: endDate,
        member_ids: selectedMemberIds
      });

      alert('নতুন যৌথ সঞ্চয় লক্ষ্য সফলভাবে তৈরি করা হয়েছে!');
      navigate(`/joint-goals/${created.id}`);
    } catch (err: any) {
      setErrorMsg('লক্ষ্য তৈরি করতে ব্যর্থ: ' + (err.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = allMembers.filter(m => 
    (m.full_name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.phone || '').includes(memberSearch)
  );

  const perMemberShare = selectedMemberIds.length > 0 && targetAmount 
    ? Math.round(Number(targetAmount) / selectedMemberIds.length) 
    : 0;

  return (
    <MobileLayout
      headerTitle="নতুন যৌথ সঞ্চয় লক্ষ্য"
      headerSubtitle="সম্মিলিত তহবিল গঠন ফরম"
      backTo="/joint-goals"
      showBack={true}
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Target size={22} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-teal-950 bangla">যৌথ সঞ্চয় বা প্রজেক্ট ফান্ড</h3>
            <p className="text-[12px] text-teal-800 bangla">
              সদস্যদের সম্মিলিত তহবিল জমা করে নির্ধারিত লক্ষ্য অর্জন করুন।
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-[13px] bangla">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {existingGoalCount >= 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-[13px] bangla">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <span>১টি যৌথ সঞ্চয় সমবায় সীমা পূর্ণ হয়েছে</span>
            </div>
            <p className="text-[12px] text-amber-700 bangla">
              আপনার সমিতিতে ইতোমধ্যে ১টি সক্রিয় যৌথ সঞ্চয় সমবায় রয়েছে। সমবায় প্রতি সর্বোচ্চ ১টি প্ল্যান অনুমোদিত।
            </p>
            {firstGoalId && (
              <button
                type="button"
                onClick={() => navigate(`/joint-goals/${firstGoalId}`)}
                className="w-full py-2 bg-amber-600 text-white rounded-xl text-[12px] font-bold bangla hover:bg-amber-700 transition-colors"
              >
                বিদ্যমান জয়েন্ট গোল ড্যাশবোর্ডে যান
              </button>
            )}
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-4.5 space-y-4 shadow-sm">
          {/* Goal Name */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <Target size={15} className="text-primary" />
              <span>লক্ষ্যের শিরোনাম / নাম *</span>
            </label>
            <input 
              type="text"
              placeholder="যেমন: জমি ক্রয় ফান্ড, বার্ষিক বনভোজন, জরুরি তহবিল"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <FileText size={15} className="text-primary" />
              <span>উদ্দেশ্য বা বিবরণ</span>
            </label>
            <textarea 
              rows={2}
              placeholder="এই তহবিলের উদ্দেশ্য বা নিয়মাবলি উল্লেখ করুন..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white"
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
              <DollarSign size={15} className="text-primary" />
              <span>মোট টার্গেট পরিমাণ (৳) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[16px] bangla">৳</span>
              <input 
                type="number"
                placeholder="যেমন: ১,০০,০০০"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[16px] font-bold text-slate-800 bangla outline-none focus:border-primary focus:bg-white"
                required
              />
            </div>
            {perMemberShare > 0 && (
              <p className="text-[11px] text-emerald-700 bangla pt-0.5">
                * নির্বাচিত {selectedMemberIds.length} জন সদস্যের জন্য গড় লক্ষ্য: <strong>৳{perMemberShare.toLocaleString()}</strong> / সদস্য
              </p>
            )}
          </div>

          {/* Date Range: Start Date & End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1">
                <Calendar size={13} className="text-primary" />
                <span>শুরুর তারিখ *</span>
              </label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700 bangla flex items-center gap-1">
                <Calendar size={13} className="text-primary" />
                <span>শেষ তারিখ *</span>
              </label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Member Selection Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-slate-700 bangla flex items-center gap-1.5">
                <Users size={15} className="text-primary" />
                <span>অংশগ্রহণকারী সদস্য ({selectedMemberIds.length}/{allMembers.length})</span>
              </label>

              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-bold text-primary hover:underline bangla"
              >
                {selectedMemberIds.length === allMembers.length ? 'সব বাদ দিন' : 'সব নির্বাচন'}
              </button>
            </div>

            {/* Member search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="সদস্য খুঁজুন..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] bangla text-slate-800 outline-none focus:border-primary"
              />
            </div>

            {/* Member Checklist Box */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-1">
              {loadingMembers ? (
                <div className="py-6 text-center text-slate-400 bangla text-[12px]">সদস্য তালিকা লোড হচ্ছে...</div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  const isChecked = selectedMemberIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMember(m.id)}
                      className="p-2 flex items-center justify-between cursor-pointer hover:bg-white rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[13px] font-semibold text-slate-800 bangla block truncate">
                            {m.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400 bangla truncate block">
                            {m.phone || 'ফোন নেই'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-slate-400 bangla text-[12px]">কোন সদস্য মেলেনি</div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || existingGoalCount >= 1}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-[14px] bangla flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-95 transition-all hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>যৌথ সঞ্চয় লক্ষ্য তৈরি সম্পন্ন করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
