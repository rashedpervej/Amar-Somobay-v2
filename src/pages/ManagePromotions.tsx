import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { usePromotionStore, Promotion, PromoRightWidget, PromoCtaType } from '../store/usePromotionStore';
import { PromotionalCard } from '../components/PromotionalCard';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  Edit3, 
  Layers, 
  CheckCircle2, 
  BarChart3, 
  MousePointerClick, 
  Tag, 
  CircleSlash,
  Image as ImageIcon,
  Phone,
  MessageSquare,
  MessageCircle,
  TrendingUp,
  HandCoins,
  Link as LinkIcon,
  RefreshCw,
  Target,
  Trophy,
  PiggyBank,
  Megaphone,
  Gift,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Preset 3D Icons for non-technical admins
const PRESET_ICONS = [
  {
    name: 'টার্গেট ও কয়েন (মূল কার্ড)',
    url: 'https://cdn3d.iconscout.com/3d/premium/thumb/finance-target-3d-icon-png-download-13750580.png',
    icon: Target
  },
  {
    name: 'গোল্ডেন ট্রফি (লটারি ড্র)',
    url: 'https://cdn3d.iconscout.com/3d/premium/thumb/trophy-cup-3d-icon-png-download-5231649.png',
    icon: Trophy
  },
  {
    name: 'যৌথ ফান্ড ও সেভিংস',
    url: 'https://cdn3d.iconscout.com/3d/premium/thumb/community-care-3d-icon-png-download-6395982.png',
    icon: PiggyBank
  },
  {
    name: 'ঘোষণা ও মেগাফোন',
    url: 'https://cdn3d.iconscout.com/3d/premium/thumb/megaphone-announcement-3d-icon-png-download-5706037.png',
    icon: Megaphone
  }
];

export default function ManagePromotions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdFromUrl = searchParams.get('edit');

  const { promotions, fetchPromotions, createPromotion, updatePromotion, deletePromotion, loading } = usePromotionStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    subtitle: string;
    category: string;
    image_url: string;
    right_widget_type: PromoRightWidget;
    target_text: string;
    progress_percent: number;
    button_text: string;
    badge_text: string;
    details_image_url: string;
    details_content: string;
    cta_type: PromoCtaType;
    cta_phone: string;
    cta_text: string;
    cta_link: string;
  }>({
    title: '',
    subtitle: '',
    category: 'লক্ষ্য',
    image_url: PRESET_ICONS[0].url,
    right_widget_type: 'progress',
    target_text: 'লক্ষ্য: ৳১২,০০০',
    progress_percent: 80,
    button_text: 'বিস্তারিত দেখুন',
    badge_text: 'বিশেষ অফার',
    details_image_url: '',
    details_content: '',
    cta_type: 'somobay',
    cta_phone: '',
    cta_text: 'আমার সমিতি দেখুন',
    cta_link: '/somobay'
  });

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Handle edit query from URL
  useEffect(() => {
    if (editIdFromUrl && promotions.length > 0) {
      const target = promotions.find(p => p.id === editIdFromUrl);
      if (target) {
        startEditing(target);
      }
    }
  }, [editIdFromUrl, promotions]);

  const startCreating = () => {
    setEditingId(null);
    setFormData({
      title: '',
      subtitle: '',
      category: 'লক্ষ্য',
      image_url: PRESET_ICONS[0].url,
      right_widget_type: 'progress',
      target_text: 'লক্ষ্য: ৳১২,০০০',
      progress_percent: 80,
      button_text: 'বিস্তারিত দেখুন',
      badge_text: 'বিশেষ অফার',
      details_image_url: '',
      details_content: '',
      cta_type: 'somobay',
      cta_phone: '',
      cta_text: 'আমার সমিতি দেখুন',
      cta_link: '/somobay'
    });
    setShowModal(true);
  };

  const startEditing = (promo: Promotion) => {
    setEditingId(promo.id);
    setFormData({
      title: promo.title,
      subtitle: promo.subtitle,
      category: promo.category || 'লক্ষ্য',
      image_url: promo.image_url || PRESET_ICONS[0].url,
      right_widget_type: promo.right_widget_type || 'progress',
      target_text: promo.target_text || 'লক্ষ্য: ৳১২,০০০',
      progress_percent: promo.progress_percent ?? 80,
      button_text: promo.button_text || 'বিস্তারিত দেখুন',
      badge_text: promo.badge_text || 'বিশেষ অফার',
      details_image_url: promo.details_image_url || '',
      details_content: promo.details_content,
      cta_type: promo.cta_type || 'somobay',
      cta_phone: promo.cta_phone || '',
      cta_text: promo.cta_text || 'আমার সমিতি দেখুন',
      cta_link: promo.cta_link || '/somobay'
    });
    setShowModal(true);
  };

  // Quick Action Button Template Handler (Call, WhatsApp, SMS, Savings, Somobay, Custom)
  const applyCtaTemplate = (type: PromoCtaType, phone?: string) => {
    const curPhone = phone !== undefined ? phone : (formData.cta_phone || '');
    if (type === 'call') {
      setFormData(prev => ({
        ...prev,
        cta_type: 'call',
        cta_phone: curPhone,
        cta_text: curPhone ? `কল করুন (${curPhone})` : 'সরাসরি কল করুন',
        cta_link: curPhone ? `tel:${curPhone}` : ''
      }));
    } else if (type === 'whatsapp') {
      const cleanNum = curPhone.replace(/^0/, '');
      setFormData(prev => ({
        ...prev,
        cta_type: 'whatsapp',
        cta_phone: curPhone,
        cta_text: 'WhatsApp এ যোগাযোগ করুন',
        cta_link: `https://wa.me/880${cleanNum}`
      }));
    } else if (type === 'sms') {
      setFormData(prev => ({
        ...prev,
        cta_type: 'sms',
        cta_phone: curPhone,
        cta_text: curPhone ? `SMS পাঠান (${curPhone})` : 'SMS পাঠান',
        cta_link: `sms:${curPhone}`
      }));
    } else if (type === 'savings') {
      setFormData(prev => ({
        ...prev,
        cta_type: 'savings',
        cta_text: 'এখনই কিস্তি জমা দিন',
        cta_link: '/savings'
      }));
    } else if (type === 'somobay') {
      setFormData(prev => ({
        ...prev,
        cta_type: 'somobay',
        cta_text: 'আমার সমিতি দেখুন',
        cta_link: '/somobay'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cta_type: 'custom',
        cta_text: 'বিস্তারিত দেখুন',
        cta_link: '/dashboard'
      }));
    }
  };

  // Ready-to-use Card Template Presets
  const applyCardTemplate = (type: 'target_goal' | 'cashback_button' | 'rosca_badge' | 'simple_notice') => {
    if (type === 'target_goal') {
      setFormData({
        title: 'ছোট সঞ্চয়, বড় স্বপ্ন',
        subtitle: 'নিয়মিত সঞ্চয় করুন,\nভবিষ্যৎ হবে সুরক্ষিত।',
        category: 'লক্ষ্য',
        image_url: PRESET_ICONS[0].url,
        right_widget_type: 'progress',
        target_text: 'লক্ষ্য: ৳১২,০০০',
        progress_percent: 80,
        button_text: 'বিস্তারিত দেখুন',
        badge_text: '',
        details_image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80',
        details_content: `### নিয়মিত সঞ্চয়ের গুরুত্ব ও ভবিষ্যৎ পরিকল্পনা

একটি সফল সমবায় সমিতির মূল ভিত্তি হলো শৃঙ্খলা ও সময়ানুবর্তিতা। আপনি যখন প্রতি সপ্তাহে বা মাসে নির্দিষ্ট কিস্তির টাকা জমা করেন, তখন শুধু আপনার সঞ্চয়ই বাড়ে না—বরং সমবায়ের তহবিল শক্তিশালী হয়।

#### আমাদের সঞ্চয় স্কিমের সুবিধাসমূহ:
- **১০০% সুরক্ষিত তহবিল:** আপনার প্রতিটি কিস্তির ডিজিটাল ট্র্যাকিং ও তাৎক্ষণিক রসিদ।
- **জরুরি প্রয়োজনে সহায়তা:** মেয়াদের মাঝেও বিশেষ প্রয়োজনে ঋণ বা যৌথ সহায়তা পাওয়ার সুযোগ।
- **মেয়াদান্তে নিশ্চিত প্রবৃদ্ধি:** সঞ্চয়ের লক্ষ্য পূরণ হলে এককালীন মূলধন ও প্রফিট বিতরণ।`,
        cta_type: 'somobay',
        cta_phone: '',
        cta_text: 'আমার সমিতি দেখুন',
        cta_link: '/somobay'
      });
    } else if (type === 'cashback_button') {
      setFormData({
        title: 'ঈদ সঞ্চয় বিশেষ ক্যাশব্যাক',
        subtitle: 'চলতি সপ্তাহে কিস্তি পরিশোধ করলেই ২০০ টাকা বোনাস!',
        category: 'অফার',
        image_url: PRESET_ICONS[1].url,
        right_widget_type: 'button',
        target_text: '',
        progress_percent: 100,
        button_text: 'অংশ নিন',
        badge_text: '',
        details_image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
        details_content: `### বিশেষ বোনাস ও ক্যাশব্যাক অফার

সমিতির সকল সক্রিয় সদস্যদের জন্য এই বিশেষ ক্যাশব্যাক অফারটি চালু করা হয়েছে।

#### শর্তাবলি:
- চলতি সপ্তাহের মধ্যে বকেয়া সকল কিস্তি পরিশোধ করতে হবে।
- টাকা জমা দেওয়ার সাথে সাথে স্বয়ংক্রিয়ভাবে ২০০ টাকা ওয়ালেট ব্যালেন্সে ক্রেডিট হবে।`,
        cta_type: 'savings',
        cta_phone: '',
        cta_text: 'এখনই কিস্তি জমা দিন',
        cta_link: '/savings'
      });
    } else if (type === 'rosca_badge') {
      setFormData({
        title: '১২ মাসের মেয়াদি লটারি ড্র',
        subtitle: '১২ জন সদস্য • প্রতি মাসে ১২,০০০ টাকা ড্র!',
        category: 'অফার',
        image_url: PRESET_ICONS[1].url,
        right_widget_type: 'badge',
        target_text: '',
        progress_percent: 50,
        button_text: 'ড্র দেখুন',
        badge_text: 'ড্র ২০ তারিখ',
        details_image_url: '',
        details_content: `### পালাক্রমিক সঞ্চয় ও লটারি সমিতি (ROSCA)

প্রতি মাসের ২০ তারিখে উন্মুক্ত ডিজিটাল ড্র অনুষ্ঠিত হবে। বিজয়ী সদস্য পাবেন এককালীন ১২,০০০ টাকা! অংশ নিতে অ্যাডমিনের সাথে যোগাযোগ করুন।`,
        cta_type: 'whatsapp',
        cta_phone: '',
        cta_text: 'WhatsApp এ যোগাযোগ করুন',
        cta_link: ''
      });
    } else if (type === 'simple_notice') {
      setFormData({
        title: 'মাসিক সাধারণ সভা নোটিশ',
        subtitle: 'আগামী শুক্রবার বিকাল ৪টায় সমিতির কার্যালয়ে মিটিং।',
        category: 'নোটিশ',
        image_url: PRESET_ICONS[3].url,
        right_widget_type: 'none',
        target_text: '',
        progress_percent: 0,
        button_text: '',
        badge_text: '',
        details_image_url: '',
        details_content: `### সমিতির সকল সদস্যের অবগতির জন্য

আগামী শুক্রবার বিকাল ৪টায় আমাদের সমবায় সমিতির ত্রৈমাসিক হিসাব-নিকাশ ও ভবিষ্যৎ পরিকল্পনা নিয়ে সাধারণ সভা অনুষ্ঠিত হবে। সকল সদস্যের উপস্থিতি বাধ্যতামূলক।`,
        cta_type: 'call',
        cta_phone: '',
        cta_text: 'অফিসে যোগাযোগ করুন',
        cta_link: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('কার্ডের শিরোনাম দিন।');
      return;
    }

    if (editingId) {
      await updatePromotion(editingId, {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        category: formData.category,
        image_url: formData.image_url,
        right_widget_type: formData.right_widget_type,
        target_text: formData.target_text.trim() || undefined,
        progress_percent: Number(formData.progress_percent),
        button_text: formData.button_text.trim() || undefined,
        badge_text: formData.badge_text.trim() || undefined,
        details_image_url: formData.details_image_url.trim() || undefined,
        details_content: formData.details_content.trim() || formData.subtitle.trim(),
        cta_type: formData.cta_type,
        cta_phone: formData.cta_phone.trim() || undefined,
        cta_text: formData.cta_text.trim() || undefined,
        cta_link: formData.cta_link.trim() || undefined
      });
      alert('কার্ডটি সফলভাবে হালনাগাদ (Edit) ও সিঙ্ক করা হয়েছে!');
    } else {
      await createPromotion({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        category: formData.category,
        image_url: formData.image_url,
        right_widget_type: formData.right_widget_type,
        target_text: formData.target_text.trim() || undefined,
        progress_percent: Number(formData.progress_percent),
        button_text: formData.button_text.trim() || undefined,
        badge_text: formData.badge_text.trim() || undefined,
        details_image_url: formData.details_image_url.trim() || undefined,
        details_content: formData.details_content.trim() || formData.subtitle.trim(),
        cta_type: formData.cta_type,
        cta_phone: formData.cta_phone.trim() || undefined,
        cta_text: formData.cta_text.trim() || undefined,
        cta_link: formData.cta_link.trim() || undefined,
        is_active: true
      });
      alert('নতুন কার্ড সফলভাবে প্রকাশ ও সিঙ্ক করা হয়েছে!');
    }

    setShowModal(false);
  };

  // Preview promotion object to show live card rendering
  const livePreviewPromo: Promotion = {
    id: editingId || 'preview',
    title: formData.title || 'ছোট সঞ্চয়, বড় স্বপ্ন',
    subtitle: formData.subtitle || 'নিয়মিত সঞ্চয় করুন,\nভবিষ্যৎ হবে সুরক্ষিত।',
    category: formData.category,
    image_url: formData.image_url,
    right_widget_type: formData.right_widget_type,
    target_text: formData.target_text,
    progress_percent: formData.progress_percent,
    button_text: formData.button_text,
    badge_text: formData.badge_text,
    details_content: formData.details_content,
    cta_type: formData.cta_type,
    cta_phone: formData.cta_phone,
    cta_text: formData.cta_text,
    cta_link: formData.cta_link,
    is_active: true,
    created_at: new Date().toISOString()
  };

  return (
    <MobileLayout
      headerTitle="ব্যানার ও কার্ড নিয়ন্ত্রণ"
      headerSubtitle="হোম স্ক্রিনের কার্ড ডিজাইন ও পরিচালনা"
      backTo="/dashboard"
      showBack={true}
      headerRight={
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => fetchPromotions()}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title="রিফ্রেশ ও সিঙ্ক"
            aria-label="রিফ্রেশ ও সিঙ্ক"
          >
            <RefreshCw size={21} strokeWidth={2.2} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={startCreating}
            className="h-11 min-h-[44px] px-2 flex items-center gap-1 text-white text-[13px] font-bold bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
            title="নতুন কার্ড"
          >
            <Plus size={18} strokeWidth={2.6} />
            <span>নতুন</span>
          </button>
        </div>
      }
    >

      {/* Sync Status Badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl mb-4 text-[11px] bangla text-emerald-800 dark:text-emerald-300">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>রিয়েল-টাইম কেন্দ্রীয় সিঙ্ক সক্রিয়</span>
        </span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
          ডেস্কটপ ও মোবাইল একযোগে আপডেট হয়
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-4 pb-28">
        {promotions.map((promo) => (
          <div 
            key={promo.id}
            className={`dark-card p-3.5 sm:p-4 rounded-[26px] border transition-all ${
              promo.is_active ? 'border-slate-100 dark:border-white/5 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-800 opacity-60'
            }`}
          >
            {/* Live card view representation */}
            <div className="mb-3">
              <PromotionalCard promo={promo} previewMode={true} />
            </div>

            {/* Admin control bar underneath each card */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 bangla font-medium">
                  স্টাইল:
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bangla px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200">
                  {promo.right_widget_type === 'progress' && <BarChart3 size={12} className="text-emerald-500" />}
                  {promo.right_widget_type === 'button' && <MousePointerClick size={12} className="text-blue-500" />}
                  {promo.right_widget_type === 'badge' && <Tag size={12} className="text-amber-500" />}
                  {promo.right_widget_type === 'none' && <CircleSlash size={12} className="text-slate-400" />}
                  <span>
                    {promo.right_widget_type === 'progress' ? 'প্রগ্রেস বার' :
                     promo.right_widget_type === 'button' ? 'বাটন' :
                     promo.right_widget_type === 'badge' ? 'ব্যাজ' : 'ক্লিন'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Active Toggle */}
                <button
                  onClick={() => updatePromotion(promo.id, { is_active: !promo.is_active })}
                  className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                  title={promo.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                >
                  {promo.is_active ? (
                    <ToggleRight size={26} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={26} className="text-slate-400" />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => startEditing(promo)}
                  className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all"
                  title="সম্পাদনা করুন"
                >
                  <Edit3 size={15} />
                </button>

                {/* View Details Landing Page */}
                <button
                  onClick={() => navigate(`/promotions/${promo.id}`)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-primary active:scale-95 transition-all"
                  title="ল্যান্ডিং পেজ দেখুন"
                >
                  <Eye size={15} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    if (confirm('আপনি কি এই কার্ডটি মুছে ফেলতে চান?')) {
                      deletePromotion(promo.id);
                    }
                  }}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100 active:scale-95 transition-all"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-[460px] bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 relative z-10 max-h-[92vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-[17px] sm:text-[18px] font-black text-slate-800 dark:text-slate-100 bangla">
                    {editingId ? 'কার্ড সম্পাদনা করুন' : 'নতুন কার্ড তৈরি করুন'}
                  </h3>
                  <p className="text-[11px] text-slate-400 bangla">
                    পরিবর্তন সরাসরি মোবাইল ও ডেস্কটপে সিঙ্ক হবে
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Ready-to-use Template Presets Buttons */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-400 bangla flex items-center gap-1 mb-2">
                  <Layers size={13} className="text-primary" />
                  <span>রেডিমেড কার্ড টেমপ্লেট (১-ক্লিক):</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyCardTemplate('target_goal')}
                    className="p-2 text-left bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 border border-purple-200 dark:border-purple-900/40 rounded-xl transition-all"
                  >
                    <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 bangla flex items-center gap-1 leading-tight">
                      <Target size={12} className="shrink-0 text-purple-700 dark:text-purple-300" />
                      <span>সঞ্চয় লক্ষ্য (বার সহ)</span>
                    </span>
                    <span className="text-[9.5px] text-purple-600 dark:text-purple-400 bangla">
                      আসল ছোট সঞ্চয় কার্ড
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyCardTemplate('cashback_button')}
                    className="p-2 text-left bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/40 rounded-xl transition-all"
                  >
                    <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 bangla flex items-center gap-1 leading-tight">
                      <Gift size={12} className="shrink-0 text-emerald-700 dark:text-emerald-300" />
                      <span>অফার (বাটন সহ)</span>
                    </span>
                    <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 bangla">
                      ক্যাশব্যাক বা অংশ নিন
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyCardTemplate('rosca_badge')}
                    className="p-2 text-left bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/40 rounded-xl transition-all"
                  >
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bangla flex items-center gap-1 leading-tight">
                      <Trophy size={12} className="shrink-0 text-amber-700 dark:text-amber-300" />
                      <span>লটারি ড্র (ব্যাজ সহ)</span>
                    </span>
                    <span className="text-[9.5px] text-amber-600 dark:text-amber-400 bangla">
                      ১২ মাসের ড্র স্কিম
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyCardTemplate('simple_notice')}
                    className="p-2 text-left bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/40 rounded-xl transition-all"
                  >
                    <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 bangla flex items-center gap-1 leading-tight">
                      <Megaphone size={12} className="shrink-0 text-blue-700 dark:text-blue-300" />
                      <span>সাধারণ নোটিশ</span>
                    </span>
                    <span className="text-[9.5px] text-blue-600 dark:text-blue-400 bangla">
                      ক্লিন টেক্সট
                    </span>
                  </button>
                </div>
              </div>

              {/* REAL-TIME LIVE PREVIEW OF THE CARD */}
              <div className="mb-5 bg-slate-950 p-2.5 rounded-[24px] border border-white/10 shadow-inner">
                <div className="flex items-center justify-between px-2 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 bangla flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" />
                    <span>লাইভ প্রিভিউ (হোম স্ক্রিনে যেমন দেখাবে):</span>
                  </span>
                </div>
                <PromotionalCard promo={livePreviewPromo} previewMode={true} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Title */}
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">
                    কার্ড শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমনঃ ছোট সঞ্চয়, বড় স্বপ্ন"
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[14px] text-slate-800 dark:text-slate-100"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* 2. Subtitle */}
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">
                    সাবটাইটেল / বার্তা *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="যেমনঃ নিয়মিত সঞ্চয় করুন,\nভবিষ্যৎ হবে সুরক্ষিত।"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[13px] text-slate-800 dark:text-slate-100"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                {/* 3. Right Side Widget Selector */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1 block">
                    হোম স্ক্রিন কার্ডের ডানপাশে কী প্রদর্শন করবেন?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, right_widget_type: 'progress' })}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        formData.right_widget_type === 'progress'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <BarChart3 size={18} />
                      <div className="leading-tight">
                        <span className="text-[12px] block bangla">প্রগ্রেস বার</span>
                        <span className="text-[10px] text-slate-400 bangla font-normal">লক্ষ্য ও শতকরা হার</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, right_widget_type: 'button' })}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        formData.right_widget_type === 'button'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <MousePointerClick size={18} />
                      <div className="leading-tight">
                        <span className="text-[12px] block bangla">অ্যাকশন বাটন</span>
                        <span className="text-[10px] text-slate-400 bangla font-normal">ক্লিক বাটন</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, right_widget_type: 'badge' })}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        formData.right_widget_type === 'badge'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Tag size={18} />
                      <div className="leading-tight">
                        <span className="text-[12px] block bangla">হাইলাইট ব্যাজ</span>
                        <span className="text-[10px] text-slate-400 bangla font-normal">অফার বা তারিখ</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, right_widget_type: 'none' })}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        formData.right_widget_type === 'none'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CircleSlash size={18} />
                      <div className="leading-tight">
                        <span className="text-[12px] block bangla">কিছুই না</span>
                        <span className="text-[10px] text-slate-400 bangla font-normal">শুধু টেক্সট</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields based on Right Widget Type */}
                {formData.right_widget_type === 'progress' && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bangla">
                        লক্ষ্য টেক্সট (যেমন: লক্ষ্য: ৳১২,০০০)
                      </label>
                      <input
                        type="text"
                        placeholder="লক্ষ্য: ৳১২,০০০"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[13px]"
                        value={formData.target_text}
                        onChange={(e) => setFormData({ ...formData, target_text: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold bangla text-slate-500">
                        <span>প্রগ্রেস শতকরা হার:</span>
                        <span className="text-emerald-500 font-bold">{formData.progress_percent}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        className="w-full accent-emerald-500 cursor-pointer"
                        value={formData.progress_percent}
                        onChange={(e) => setFormData({ ...formData, progress_percent: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {formData.right_widget_type === 'button' && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bangla">
                      কার্ডের বাটন টেক্সট
                    </label>
                    <input
                      type="text"
                      placeholder="যেমনঃ অংশ নিন বা বিস্তারিত দেখুন"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[13px]"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    />
                  </div>
                )}

                {formData.right_widget_type === 'badge' && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bangla">
                      ব্যাজ টেক্সট
                    </label>
                    <input
                      type="text"
                      placeholder="যেমনঃ বোনাস ৳৫০০ বা ড্র ২০ তারিখ"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[13px]"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    />
                  </div>
                )}

                {/* 4. Left 3D Icon Picker */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">
                    কার্ডের আইকন (বামপাশের ৩ডি গ্রাফিক)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_ICONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: preset.url })}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          formData.image_url === preset.url
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                          <preset.icon size={16} />
                        </div>
                        <span className="text-[11px] bangla line-clamp-1">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Detail Page Attached Image URL */}
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-slate-400" />
                    <span>ডিটেইলস পেজে ছবি যোগ করুন (ঐচ্ছিক ইমেজ লিঙ্ক)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... বা যেকোনো ছবির লিংক"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[12px]"
                    value={formData.details_image_url}
                    onChange={(e) => setFormData({ ...formData, details_image_url: e.target.value })}
                  />
                </div>

                {/* 6. Landing Page Content */}
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">
                    কার্ডে ক্লিক করলে বিস্তারিত বিবরণ (ল্যান্ডিং পেজ)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="নিয়মাবলি বা পূর্ণ বিবরণ লিখুন..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[13px] text-slate-800 dark:text-slate-100"
                    value={formData.details_content}
                    onChange={(e) => setFormData({ ...formData, details_content: e.target.value })}
                  />
                </div>

                {/* 7. LANDING PAGE BUTTON ACTION TEMPLATES (As requested by user) */}
                <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-white/5">
                  <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 bangla ml-1 block">
                    ল্যান্ডিং পেজের বাটন অ্যাকশন টেমপ্লেট
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => applyCtaTemplate('call')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        formData.cta_type === 'call'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Phone size={18} className="text-blue-500" />
                      <span className="text-[11px] bangla">কল করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyCtaTemplate('whatsapp')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        formData.cta_type === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <MessageSquare size={18} className="text-emerald-500" />
                      <span className="text-[11px] bangla">WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyCtaTemplate('sms')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        formData.cta_type === 'sms'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <MessageCircle size={18} className="text-purple-500" />
                      <span className="text-[11px] bangla">SMS করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyCtaTemplate('savings')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        formData.cta_type === 'savings'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <HandCoins size={18} className="text-amber-500" />
                      <span className="text-[11px] bangla">কিস্তি জমা</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyCtaTemplate('somobay')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        formData.cta_type === 'somobay'
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <TrendingUp size={18} className="text-primary" />
                      <span className="text-[11px] bangla">সমিতি দেখুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyCtaTemplate('custom')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        formData.cta_type === 'custom'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <LinkIcon size={18} className="text-indigo-500" />
                      <span className="text-[11px] bangla">কাস্টম লিংক</span>
                    </button>
                  </div>

                  {/* Phone input for Call/WhatsApp/SMS */}
                  {(formData.cta_type === 'call' || formData.cta_type === 'whatsapp' || formData.cta_type === 'sms') && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bangla flex items-center gap-1">
                        <Phone size={13} className="text-primary" />
                        <span>যোগাযোগের ফোন নম্বর (সদস্য সরাসরি এতে কল/মেসেজ দেবে):</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="01700000000"
                        className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-[13px] font-bold"
                        value={formData.cta_phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, cta_phone: val }));
                          applyCtaTemplate(formData.cta_type, val);
                        }}
                      />
                    </div>
                  )}

                  {/* Button text & link preview / override */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">
                        বাটনে যা লেখা থাকবে
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none bangla text-[12px]"
                        value={formData.cta_text}
                        onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">
                        বাটনের লিঙ্ক / পাথ
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-[12px]"
                        value={formData.cta_link}
                        onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-4 bg-primary hover:bg-emerald-600 text-white rounded-2xl font-bold bangla text-[15px] shadow-lg shadow-primary/20 active:scale-95 transition-all mt-4"
                >
                  {editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'কার্ড প্রকাশ করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
