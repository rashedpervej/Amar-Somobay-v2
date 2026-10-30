import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { usePromotionStore } from '../store/usePromotionStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowLeft, 
  ChevronRight, 
  Share2, 
  CheckCircle2, 
  Edit3, 
  Sparkles,
  Phone, 
  MessageSquare, 
  MessageCircle, 
  TrendingUp, 
  HandCoins, 
  ExternalLink 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function PromotionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { getPromotionById, fetchPromotions, recordView } = usePromotionStore();
  const recordedRef = React.useRef<string | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    if (id && recordedRef.current !== id) {
      recordedRef.current = id;
      recordView(id, profile);
    }
  }, [id, profile, recordView]);

  const promo = id ? getPromotionById(id) : undefined;

  if (!promo) {
    return (
      <MobileLayout>
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={22} className="text-slate-400" />
          </button>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla">বিবরণ</h1>
        </div>
        <div className="py-20 text-center text-slate-400 bangla">
          <p>এই প্রমোশন বা কার্ডটি পাওয়া যায়নি।</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold bangla"
          >
            হোমে ফিরে যান
          </button>
        </div>
      </MobileLayout>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: promo.title,
        text: `${promo.title} - ${promo.subtitle}\nআমার সমবায় অ্যাপে দেখুন।`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('লিঙ্ক কপি করা হয়েছে!');
    }
  };

  const handleCtaClick = () => {
    if (!promo.cta_link) {
      navigate('/somobay');
      return;
    }

    if (promo.cta_type === 'call' || promo.cta_link.startsWith('tel:')) {
      window.location.href = promo.cta_link.startsWith('tel:') ? promo.cta_link : `tel:${promo.cta_link}`;
    } else if (promo.cta_type === 'whatsapp' || promo.cta_link.includes('wa.me')) {
      window.open(promo.cta_link, '_blank');
    } else if (promo.cta_type === 'sms' || promo.cta_link.startsWith('sms:')) {
      window.location.href = promo.cta_link.startsWith('sms:') ? promo.cta_link : `sms:${promo.cta_link}`;
    } else if (promo.cta_link.startsWith('http://') || promo.cta_link.startsWith('https://')) {
      window.open(promo.cta_link, '_blank');
    } else {
      navigate(promo.cta_link);
    }
  };

  return (
    <MobileLayout
      headerTitle={promo.title}
      showBack={true}
      headerRight={
        <div className="flex items-center gap-0.5">
          {profile?.role === 'admin' && (
            <button 
              onClick={() => navigate(`/promotions/manage?edit=${promo.id}`)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
              title="কার্ড সম্পাদনা করুন"
              aria-label="কার্ড সম্পাদনা করুন"
            >
              <Edit3 size={21} strokeWidth={2.2} />
            </button>
          )}

          <button 
            onClick={handleShare}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title="শেয়ার করুন"
            aria-label="শেয়ার করুন"
          >
            <Share2 size={21} strokeWidth={2.2} />
          </button>
        </div>
      }
    >

      {/* RESTORED BRIEF / SUMMARY HERO CARD (As requested by user) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] bg-gradient-to-br from-[#110d29] via-[#1a1438] to-[#0d0a21] text-white p-5 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden mb-4"
      >
        {/* Glow lights */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bangla bg-white/10 backdrop-blur-md text-amber-300 border border-white/10 flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>{promo.category || 'বিশেষ স্কিম'}</span>
            </span>

            {promo.target_text ? (
              <span className="text-[12px] text-slate-200 font-bold bangla bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                {promo.target_text}
              </span>
            ) : promo.badge_text ? (
              <span className="text-[12px] text-amber-300 font-bold bangla bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-lg">
                {promo.badge_text}
              </span>
            ) : null}
          </div>

          <h2 className="text-[20px] sm:text-[23px] font-black bangla text-white leading-tight mt-1">
            {promo.title}
          </h2>
          <p className="text-[13px] sm:text-[13.5px] text-slate-300/90 bangla mt-1.5 leading-relaxed whitespace-pre-line">
            {promo.subtitle}
          </p>

          {promo.right_widget_type === 'progress' && promo.progress_percent !== undefined && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold bangla text-slate-300">
                <span>{promo.target_text ? promo.target_text : 'অগ্রগতি / লক্ষ্য পূরণ'}</span>
                <span className="text-emerald-400 font-black">{promo.progress_percent}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  style={{ width: `${promo.progress_percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Details Attached Image (promotional poster / voucher) */}
      {promo.details_image_url && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-[24px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm bg-slate-100 dark:bg-slate-800/50"
        >
          <img 
            src={promo.details_image_url} 
            alt="Promotion Details" 
            className="w-full max-h-[280px] object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </motion.div>
      )}

      {/* Main Detailed Content Body */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="dark-card p-5 sm:p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-white/5"
      >
        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 bangla leading-relaxed space-y-3.5 text-[14px]">
          {promo.details_content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-[17px] font-bold text-slate-900 dark:text-slate-100 bangla pt-2 border-b border-slate-100 dark:border-white/5 pb-1">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('#### ')) {
              return (
                <h4 key={idx} className="text-[15px] font-bold text-slate-800 dark:text-slate-200 bangla pt-1">
                  {paragraph.replace('#### ', '')}
                </h4>
              );
            }
            if (paragraph.startsWith('> ')) {
              return (
                <blockquote key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 rounded-r-xl text-amber-800 dark:text-amber-200 text-[12px] bangla italic">
                  {paragraph.replace('> ', '').replace(/\*/g, '')}
                </blockquote>
              );
            }
            if (paragraph.includes('- ') || paragraph.includes('১. ')) {
              const lines = paragraph.split('\n');
              return (
                <ul key={idx} className="space-y-2 pl-1">
                  {lines.map((line, lIdx) => (
                    <li key={lIdx} className="flex items-start gap-2 text-[13px] bangla">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{line.replace(/^[-*]|\d+\.\s*/, '').replace(/\*\*/g, '')}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="text-slate-600 dark:text-slate-300 text-[13.5px] leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Action Button (Based on selected template: Call, WhatsApp, SMS, Somobay, Savings, or Custom) */}
        {promo.cta_text && (
          <div className="mt-7 pt-5 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={handleCtaClick}
              className={`w-full py-4 rounded-2xl font-bold bangla text-[15px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2.5 ${
                promo.cta_type === 'whatsapp' 
                  ? 'bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-emerald-500/20'
                  : promo.cta_type === 'call'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    : promo.cta_type === 'sms'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                      : 'bg-primary hover:bg-emerald-600 text-white shadow-primary/20'
              }`}
            >
              {promo.cta_type === 'call' && <Phone size={18} />}
              {promo.cta_type === 'whatsapp' && <MessageSquare size={18} />}
              {promo.cta_type === 'sms' && <MessageCircle size={18} />}
              {promo.cta_type === 'savings' && <HandCoins size={18} />}
              {promo.cta_type === 'somobay' && <TrendingUp size={18} />}
              {promo.cta_type === 'custom' && <ExternalLink size={18} />}

              <span>{promo.cta_text}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </motion.div>

      {/* Admin Quick Action Button */}
      {profile?.role === 'admin' && (
        <div className="text-center pt-3 pb-8">
          <button 
            onClick={() => navigate(`/promotions/manage?edit=${promo.id}`)}
            className="text-[12px] text-slate-400 hover:text-primary bangla font-bold inline-flex items-center gap-1.5 underline"
          >
            <Edit3 size={13} />
            <span>অ্যাডমিন: এই কার্ডটি পরিবর্তন বা সম্পাদনা করুন</span>
          </button>
        </div>
      )}
    </MobileLayout>
  );
}
