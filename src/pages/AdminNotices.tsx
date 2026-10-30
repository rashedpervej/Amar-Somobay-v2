import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { usePromotionStore } from '../store/usePromotionStore';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Megaphone, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminNotices() {
  const navigate = useNavigate();
  const { promotions, fetchPromotions } = usePromotionStore();
  const [activeTab, setActiveTab] = useState<'notices' | 'meetings'>('notices');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('নোটিশ');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('promotions').insert([
        {
          title: title.trim(),
          subtitle: subtitle.trim(),
          category: activeTab === 'meetings' ? 'মিটিং' : category,
          is_active: true,
          button_text: 'বিস্তারিত দেখুন',
          button_link: '/notices'
        }
      ]);

      if (error) throw error;
      alert('সফলভাবে প্রকাশিত হয়েছে!');
      setShowAddModal(false);
      setTitle('');
      setSubtitle('');
      fetchPromotions();
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'Error creating notice'));
    } finally {
      setSubmitting(false);
    }
  };

  const noticesList = promotions.filter(p => p.category !== 'মিটিং');
  const meetingsList = promotions.filter(p => p.category === 'মিটিং');
  const currentList = activeTab === 'notices' ? noticesList : meetingsList;

  return (
    <MobileLayout>
      {/* Segmented Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-[14px] text-[12px] font-semibold bangla">
        {[
          { id: 'notices', label: `নোটিশ বোর্ড (${noticesList.length})` },
          { id: 'meetings', label: `সভা ও মিটিং (${meetingsList.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 rounded-[10px] transition-all text-center ${
              activeTab === tab.id
                ? 'bg-white text-primary font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2.5 pb-20">
        {currentList.length > 0 ? (
          currentList.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-[18px] border border-border shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col gap-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bangla bg-primary-light text-primary border border-emerald-200">
                    {item.category || 'ঘোষণা'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.created_at || Date.now()).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  প্রকাশিত
                </span>
              </div>

              <h3 className="text-[15px] font-bold text-slate-800 bangla leading-tight">{item.title}</h3>
              {item.subtitle && (
                <p className="text-[12px] text-slate-500 bangla leading-relaxed">{item.subtitle}</p>
              )}
            </div>
          ))
        ) : (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Megaphone size={32} className="text-slate-300" />
            <p className="text-[14px] font-medium text-slate-400 bangla">কোন নোটিশ প্রকাশিত নেই</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Button: + নতুন প্রকাশনা */}
      <div className="fixed bottom-[74px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pointer-events-none z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="pointer-events-auto ml-auto flex items-center gap-1.5 px-5 py-3 rounded-full bg-primary text-white font-bold text-[13px] bangla shadow-lg shadow-emerald-700/25 active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>{activeTab === 'meetings' ? 'নতুন সভা আহ্বান' : 'নতুন নোটিশ প্রকাশ'}</span>
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddModal(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 100, opacity: 0 }} 
              className="w-full max-w-[420px] bg-white rounded-[28px] p-6 relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[18px] font-bold text-slate-800 bangla">
                  {activeTab === 'meetings' ? 'নতুন সভা নোটিশ প্রকাশ' : 'নতুন সাধারণ নোটিশ'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div>
                  <label className="text-[12px] font-semibold text-slate-500 bangla block mb-1">শিরোনাম</label>
                  <input
                    type="text"
                    placeholder="যেমনঃ বার্ষিক সাধারণ সভা ও অডিট বিজ্ঞপ্তি"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 border border-border rounded-[14px] text-[13px] bangla outline-none"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-slate-500 bangla block mb-1">বিবরণ / সারসংক্ষেপ</label>
                  <textarea
                    rows={4}
                    placeholder="নোটিশের বিস্তারিত বিবরণ লিখুন..."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 border border-border rounded-[14px] text-[13px] bangla outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-primary text-white font-bold text-[14px] bangla rounded-[14px] shadow-lg shadow-emerald-700/25 active:scale-95 transition-all"
                >
                  {submitting ? 'প্রকাশ হচ্ছে...' : 'নোটিশ প্রকাশ করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
