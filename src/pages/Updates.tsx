import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { usePromotionStore, Promotion, getMeetingStatusInfo } from '../store/usePromotionStore';
import { useAuthStore } from '../store/useAuthStore';
import { PromotionalCard } from '../components/PromotionalCard';
import { 
  Sparkles, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin,
  Check, 
  ChevronRight, 
  Search, 
  SlidersHorizontal,
  Users,
  Megaphone,
  Gift,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type MainTab = 'all' | 'notices' | 'meetings';

export default function Updates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial tab from URL params ('tab' or 'type')
  const qTab = searchParams.get('tab') || searchParams.get('type');
  const initialTab: MainTab = 
    qTab === 'meetings' || qTab === 'meeting' ? 'meetings' :
    qTab === 'notices' || qTab === 'notice' ? 'notices' : 'all';

  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  // Persistent attendance tracking for meetings
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('meeting_attendance');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const { profile, activeOrganizationId } = useAuthStore();
  const { promotions, fetchPromotions } = usePromotionStore();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchPromotions(activeOrganizationId);
  }, [fetchPromotions, activeOrganizationId]);

  // Sync tab change with URL
  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      searchParams.delete('tab');
      searchParams.delete('type');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab });
    }
  };

  const toggleAttendance = async (meetingId: string) => {
    const isAttending = await usePromotionStore.getState().toggleAttendance(meetingId, profile);
    setAttendanceMap(prev => {
      const updated = { ...prev, [meetingId]: isAttending };
      try {
        localStorage.setItem('meeting_attendance', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Helper to categorize promotions / notices
  const getCategoryGroup = (item: Promotion): 'notice' | 'meeting' | 'promo' => {
    const cat = (item.category || '').toLowerCase();
    if (item.show_in_meetings || cat.includes('মিটিং') || cat.includes('meeting') || cat.includes('সভা')) return 'meeting';
    if (item.show_in_notices || cat.includes('নোটিশ') || cat.includes('notice') || cat.includes('বিজ্ঞপ্তি')) return 'notice';
    return 'promo';
  };

  // Active items from store
  const activeItems = useMemo(() => {
    return promotions.filter(p => p.is_active);
  }, [promotions]);

  // Featured promo banners for carousel (items with show_as_card: true)
  const promoBanners = useMemo(() => {
    return activeItems.filter(p => p.show_as_card);
  }, [activeItems]);

  // Notices list (items with show_in_notices: true)
  const noticesList = useMemo(() => {
    return activeItems.filter(p => p.show_in_notices || (p.category || '').includes('নোটিশ') || (p.category || '').includes('বিজ্ঞপ্তি'));
  }, [activeItems]);

  // Dynamic meetings from store (items with show_in_meetings: true)
  const dynamicMeetings = useMemo(() => {
    return activeItems.filter(p => p.show_in_meetings || (p.category || '').includes('মিটিং') || (p.category || '').includes('সভা'));
  }, [activeItems]);


  // Filtered updates for 'all' tab
  const allFilteredUpdates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeItems;
    return activeItems.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.subtitle.toLowerCase().includes(q) || 
      (item.category && item.category.toLowerCase().includes(q))
    );
  }, [activeItems, searchQuery]);

  return (
    <MobileLayout
      headerTitle="আপডেটস ও নোটিশ"
      headerSubtitle="সমিতির সর্বশেষ নোটিশ, অফার ও সভার তথ্য"
      showBack={false}
      headerRight={
        isAdmin ? (
          <button 
            onClick={() => navigate('/admin/updates')}
            className="h-10 px-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11.5px] font-bold bangla flex items-center gap-1 active:scale-95 transition-all shadow-xs"
            title="আপডেট কন্ট্রোল প্যানেল"
          >
            <SlidersHorizontal size={14} />
            <span>কন্ট্রোল প্যানেল</span>
          </button>
        ) : null
      }
    >
      <div className="space-y-4 pb-16">
        
        {/* 3 Main Segmented Tabs Requested by User */}
        <div className="grid grid-cols-3 gap-1 bg-[#E2E8F0]/70 p-1 rounded-2xl">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[13px] font-bold bangla transition-all active:scale-[0.98] ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'all' ? 'text-white' : 'text-slate-400'} />
            <span>সব আপডেট</span>
          </button>

          <button
            onClick={() => handleTabChange('notices')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[13px] font-bold bangla transition-all active:scale-[0.98] ${
              activeTab === 'notices'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileText size={14} className={activeTab === 'notices' ? 'text-white' : 'text-slate-400'} />
            <span>নোটিশ</span>
          </button>

          <button
            onClick={() => handleTabChange('meetings')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[13px] font-bold bangla transition-all active:scale-[0.98] ${
              activeTab === 'meetings'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users size={14} className={activeTab === 'meetings' ? 'text-white' : 'text-slate-400'} />
            <span>মিটিং/সভা</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: সব আপডেট (All Updates: Search + Carousel + All Feed) */}
        {/* ============================================================== */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="নোটিশ, অফার বা ঘোষণা খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-border rounded-2xl py-2.5 pl-10 pr-4 text-[13px] bangla text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus:outline-none focus:border-primary"
              />
            </div>

            {/* Featured Promo Banner Slider */}
            {!searchQuery && promoBanners.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[12px] font-bold text-slate-600 bangla flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>বিশেষ অফার ও লক্ষ্য ব্যানার</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 bangla">
                    {activePromoIndex + 1}/{promoBanners.length}
                  </span>
                </div>

                <PromotionalCard
                  promo={promoBanners[activePromoIndex % promoBanners.length]}
                  totalCards={promoBanners.length}
                  currentIndex={activePromoIndex % promoBanners.length}
                  onNext={() => setActivePromoIndex((prev) => (prev + 1) % promoBanners.length)}
                  onPrev={() => setActivePromoIndex((prev) => (prev - 1 + promoBanners.length) % promoBanners.length)}
                  onClick={() => navigate(`/updates/${promoBanners[activePromoIndex % promoBanners.length].id}`)}
                />
              </div>
            )}

            {/* All Updates Feed */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <h2 className="text-[14px] font-bold text-slate-800 bangla">সকল সাম্প্রতিক আপডেট</h2>
                <span className="text-[11px] font-medium text-slate-400 bangla">
                  মোট: {allFilteredUpdates.length.toLocaleString('bn-BD')}টি
                </span>
              </div>

              {allFilteredUpdates.length > 0 ? (
                allFilteredUpdates.map((item, idx) => {
                  const grp = getCategoryGroup(item);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.12), duration: 0.18 }}
                      onClick={() => navigate(`/updates/${item.id}`)}
                      className="bg-white rounded-2xl p-4 border border-border shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex flex-col gap-2.5 cursor-pointer active:scale-[0.99] hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bangla border bg-emerald-50 text-primary border-emerald-200">
                          {grp === 'meeting' ? <Users size={11} /> :
                           grp === 'notice' ? <FileText size={11} /> : <Sparkles size={11} />}
                          <span>{item.category || 'সাধারণ আপডেট'}</span>
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : 'আজ'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-[15px] font-bold text-slate-800 bangla leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-[12px] text-slate-500 bangla mt-1 line-clamp-2 leading-relaxed">
                          {item.subtitle}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[12px] text-primary font-semibold bangla">
                        <span>বিস্তারিত দেখুন</span>
                        <ChevronRight size={14} />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-12 bg-white rounded-2xl border border-dashed border-border text-center p-6 flex flex-col items-center justify-center gap-2">
                  <Megaphone size={30} className="text-slate-300" />
                  <p className="text-[13px] font-medium text-slate-500 bangla">
                    বর্তমানে কোনো আপডেট পাওয়া যায়নি
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: নোটিশ বোর্ড (Official Circulars & Society Notices) */}
        {/* ============================================================== */}
        {activeTab === 'notices' && (
          <div className="flex flex-col gap-3">
            {noticesList.length > 0 ? (
              noticesList.map((promo, idx) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => navigate(`/updates/${promo.id}`)}
                  className="bg-white rounded-2xl p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-2.5 cursor-pointer active:scale-[0.99] transition-all hover:border-primary/30"
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
              <div className="py-12 bg-white rounded-2xl border border-dashed border-border text-center p-6 flex flex-col items-center justify-center gap-2">
                <FileText size={30} className="text-slate-300" />
                <p className="text-[13px] font-medium text-slate-500 bangla">
                  বর্তমানে কোনো নোটিশ নেই
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: মিটিং/সভা (Rich format with dynamic status & Attendance) */}
        {/* ============================================================== */}
        {activeTab === 'meetings' && (
          <div className="flex flex-col gap-4">
            
            {/* Dynamic Meetings from DB */}
            {dynamicMeetings.length > 0 ? (
              dynamicMeetings.map((meeting, idx) => {
                const isAttending = !!attendanceMap[meeting.id] || (meeting.attendees?.some(a => a.user_id === profile?.id) ?? false);
                const statusInfo = getMeetingStatusInfo(meeting);

                return (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.12), duration: 0.18 }}
                    className="bg-white rounded-[20px] p-4.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-light text-primary border border-emerald-200">
                        {meeting.category || 'সাধারণ সভা'}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-[17px] font-bold text-slate-800 bangla leading-snug">
                        {meeting.title}
                      </h2>
                      <p className="text-[12px] text-slate-500 bangla mt-1 leading-relaxed">
                        {meeting.subtitle}
                      </p>
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

                    {/* Attendance Confirmation CTA Button (Only active if meeting is upcoming) */}
                    {statusInfo.isUpcoming ? (
                      <button
                        onClick={() => toggleAttendance(meeting.id)}
                        className={`w-full py-3 px-4 rounded-[14px] font-semibold text-[14px] bangla flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                          isAttending
                            ? 'bg-primary-light text-primary border border-primary'
                            : 'bg-primary hover:bg-primary-dark text-white shadow-sm'
                        }`}
                      >
                        <Check size={18} strokeWidth={2.5} />
                        <span>{isAttending ? 'উপস্থিতি নিশ্চিত করা হয়েছে' : 'আমি উপস্থিত থাকবো'}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-4 rounded-[14px] bg-slate-100 text-slate-500 font-semibold text-[13px] bangla text-center border border-slate-200">
                        এই সভাটি সম্পন্ন হয়েছে
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="py-12 bg-white rounded-2xl border border-dashed border-border text-center p-6 flex flex-col items-center justify-center gap-2">
                <Users size={30} className="text-slate-300" />
                <p className="text-[13px] font-medium text-slate-500 bangla">
                  বর্তমানে কোনো নির্ধারিত সভা নেই
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </MobileLayout>
  );
}
