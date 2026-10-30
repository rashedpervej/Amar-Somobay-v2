import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePromotionStore, Promotion } from '../store/usePromotionStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  X, 
  Megaphone, 
  ChevronRight, 
  FileText, 
  Bell, 
  ExternalLink,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function NoticePopupBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { promotions, recordView } = usePromotionStore();
  const { profile, activeOrganizationId } = useAuthStore();
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Do not show popup on login, register, admin management pages or on the detail page itself
  const isExcludedPage = 
    !profile ||
    location.pathname === '/login' || 
    location.pathname === '/register' ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/promotions/manage') ||
    location.pathname.startsWith('/updates/') ||
    location.pathname.startsWith('/promotions/');

  // Find the latest active notice that has not been dismissed yet
  const latestNotice = useMemo(() => {
    if (isExcludedPage) return null;

    const activeNotices = promotions.filter(p => 
      p.is_active && 
      (!p.organization_id || p.organization_id === activeOrganizationId) &&
      (
        p.show_as_popup || 
        p.show_in_notices || 
        (p.category || '').includes('নোটিশ') || 
        (p.category || '').includes('বিজ্ঞপ্তি')
      )
    );

    if (activeNotices.length === 0) return null;

    // Pick the most recent notice
    const sorted = [...activeNotices].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const candidate = sorted[0];
    if (!candidate) return null;

    // Check localStorage dismissal
    const isDismissed = localStorage.getItem(`dismissed_notice_popup_${candidate.id}`);
    if (isDismissed || candidate.id === dismissedId) return null;

    return candidate;
  }, [promotions, isExcludedPage, dismissedId]);

  // Record view on show (At most once per session)
  useEffect(() => {
    if (latestNotice && profile) {
      const sessKey = `popup_view_recorded_${latestNotice.id}`;
      if (!sessionStorage.getItem(sessKey)) {
        sessionStorage.setItem(sessKey, 'true');
        recordView(latestNotice.id, profile);
      }
    }
  }, [latestNotice?.id, profile?.id]);

  if (!latestNotice) return null;

  const handleDismiss = () => {
    setDismissedId(latestNotice.id);
    try {
      localStorage.setItem(`dismissed_notice_popup_${latestNotice.id}`, 'true');
    } catch (e) {}
  };

  const handleReadDetails = () => {
    handleDismiss();
    navigate(`/updates/${latestNotice.id}`);
  };

  const handleActionClick = () => {
    handleDismiss();
    if (latestNotice.cta_link) {
      if (latestNotice.cta_link.startsWith('http')) {
        window.open(latestNotice.cta_link, '_blank');
      } else if (latestNotice.cta_link.startsWith('tel:') || latestNotice.cta_link.startsWith('sms:')) {
        window.location.href = latestNotice.cta_link;
      } else {
        navigate(latestNotice.cta_link);
      }
    } else {
      navigate('/updates');
    }
  };

  const rawContent = latestNotice.details_content || latestNotice.subtitle || '';
  // Notice is considered "long" if text is longer than 150 characters or contains bullet points/markdown headers
  const isLongNotice = rawContent.length > 150 || rawContent.includes('###') || rawContent.includes('\n-');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-auto flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[2px]">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm sm:max-w-md bg-white rounded-[26px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-border overflow-hidden"
        >
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#087F5B]" />

          {/* Top Bar: Badge & Close Icon */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bangla bg-rose-50 text-rose-600 border border-rose-200">
                <Megaphone size={12} className="animate-pulse" />
                <span>{latestNotice.badge_text || latestNotice.category || 'জরুরি নোটিশ'}</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 bangla">
                {new Date(latestNotice.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Right Top Close Icon (X) */}
            <button
              onClick={handleDismiss}
              aria-label="নোটিশ বন্ধ করুন"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors active:scale-90"
            >
              <X size={17} strokeWidth={2.4} />
            </button>
          </div>

          {/* Notice Title */}
          <h3 className="text-[16px] font-bold text-slate-800 bangla leading-snug">
            {latestNotice.title}
          </h3>

          {/* Notice Body */}
          <div className="mt-2 text-[13px] text-slate-600 bangla leading-relaxed">
            {isLongNotice ? (
              <p className="line-clamp-3">
                {latestNotice.subtitle || rawContent.replace(/###/g, '').replace(/\n/g, ' ')}
              </p>
            ) : (
              <p className="whitespace-pre-line">
                {rawContent}
              </p>
            )}
          </div>

          {/* Action Button Section */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
            {isLongNotice ? (
              // Long Notice: "বিস্তারিত দেখুন" button (navigates to full notice)
              <button
                onClick={handleReadDetails}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-[13px] bangla flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
              >
                <span>সম্পূর্ণ নোটিশ পড়ুন</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              // Short Notice fitting card: configured CTA button or acknowledge button
              <button
                onClick={handleActionClick}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-[13px] bangla flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
              >
                <span>{latestNotice.cta_text || 'ঠিক আছে, বুঝেছি'}</span>
                <CheckCircle2 size={15} />
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
