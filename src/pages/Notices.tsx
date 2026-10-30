import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { usePromotionStore, Promotion } from '../store/usePromotionStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Bell, 
  Info,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Notices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'meetings' ? 'meetings' : 'notices';
  const [activeTab, setActiveTab] = useState<'notices' | 'meetings'>(initialTab);
  const [attendingMeeting, setAttendingMeeting] = useState<boolean>(false);
  const { profile, activeOrganizationId } = useAuthStore();
  const { promotions, fetchPromotions } = usePromotionStore();

  useEffect(() => {
    fetchPromotions(activeOrganizationId);
  }, [fetchPromotions, activeOrganizationId]);

  // Filter notice type promotions for active organization
  const noticePromos = promotions.filter(p => 
    p.is_active && 
    (!p.organization_id || p.organization_id === activeOrganizationId) && 
    (p.show_in_notices || (p.category || '').includes('নোটিশ') || (p.category || '').includes('বিজ্ঞপ্তি'))
  );

  const meetingPromos = promotions.filter(p => 
    p.is_active && 
    (!p.organization_id || p.organization_id === activeOrganizationId) && 
    (p.show_in_meetings || (p.category || '').includes('মিটিং') || (p.category || '').includes('সভা'))
  );

  return (
    <MobileLayout
      headerTitle="নোটিশ ও সভা বোর্ড"
      headerRight={
        profile?.role === 'admin' ? (
          <button 
            onClick={() => navigate('/promotions/manage')}
            className="h-11 min-h-[44px] px-2 flex items-center gap-1 text-white text-[13px] font-bold bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
            title="নতুন নোটিশ"
          >
            <Sparkles size={16} strokeWidth={2.4} />
            <span>নতুন নোটিশ</span>
          </button>
        ) : null
      }
    >

      {/* Segmented Top Tabs */}
      <div className="bg-[#E2E8F0]/50 p-1 rounded-xl flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('notices')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold bangla transition-all ${
            activeTab === 'notices'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          নোটিশ বোর্ড
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold bangla transition-all ${
            activeTab === 'meetings'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          আসন্ন সভা ও মিটিং
        </button>
      </div>

      {/* TAB 1: নোটিশ বোর্ড (Official Circulars & Society Notices) */}
      {activeTab === 'notices' && (
        <div className="flex flex-col gap-3 pb-20">
          {/* Official Notices Stream */}
          {noticePromos.length > 0 ? (
            noticePromos.map((promo, idx) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.12), duration: 0.18 }}
                onClick={() => navigate(`/updates/${promo.id}`)}
                className="bg-white rounded-[18px] p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-2.5 cursor-pointer active:scale-[0.99] transition-all hover:border-primary/30"
              >
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-light text-primary border border-emerald-200">
                    {promo.category || 'অফিসিয়াল নোটিশ'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(promo.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 bangla leading-snug">
                    {promo.title}
                  </h3>
                  <p className="text-[12px] text-slate-500 bangla mt-1 line-clamp-2 leading-relaxed">
                    {promo.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[12px] text-primary font-semibold bangla">
                  <span>সম্পূর্ণ নোটিশ পড়ুন</span>
                  <ChevronRight size={14} />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-16 bg-white rounded-2xl border border-dashed border-border text-center p-6 flex flex-col items-center justify-center gap-2">
              <FileText size={32} className="text-slate-300" />
              <p className="text-[13px] font-medium text-slate-500 bangla">
                বর্তমানে কোনো নোটিশ পাওয়া যায়নি
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: আসন্ন সভা ও মিটিং (Meetings & AGM) */}
      {activeTab === 'meetings' && (
        <div className="flex flex-col gap-3.5 pb-20">
          {meetingPromos.length > 0 ? (
            meetingPromos.map((meeting, idx) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.12), duration: 0.18 }}
                onClick={() => navigate(`/updates/${meeting.id}`)}
                className="bg-white rounded-[20px] p-4.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-3 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-light text-primary border border-emerald-200">
                    {meeting.category || 'সাধারণ সভা'}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {meeting.meeting_status === 'completed' ? 'সম্পন্ন' : meeting.meeting_status === 'cancelled' ? 'স্থগিত' : 'আসন্ন'}
                  </span>
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-slate-800 bangla leading-snug">
                    {meeting.title}
                  </h2>
                  {meeting.subtitle && (
                    <p className="text-[12px] text-slate-500 bangla mt-1 leading-relaxed">
                      {meeting.subtitle}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-bg-soft rounded-xl flex flex-col gap-2 border border-border/60 text-[12px] bangla text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-primary shrink-0" />
                    <span>তারিখ: <strong>{meeting.meeting_date || 'তারিখ নির্ধারিত হয়নি'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-amber-600 shrink-0" />
                    <span>সময়: <strong>{meeting.meeting_time || 'সময় নির্ধারিত হয়নি'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-blue-600 shrink-0" />
                    <span>স্থান: <strong>{meeting.meeting_location || 'স্থান নির্ধারিত হয়নি'}</strong></span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-16 bg-white rounded-2xl border border-dashed border-border text-center p-6 flex flex-col items-center justify-center gap-2">
              <Users size={32} className="text-slate-300" />
              <p className="text-[13px] font-medium text-slate-500 bangla">
                বর্তমানে কোনো নির্ধারিত সভা নেই
              </p>
            </div>
          )}
        </div>
      )}
    </MobileLayout>
  );
}
