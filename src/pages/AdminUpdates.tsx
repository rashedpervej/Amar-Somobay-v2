import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { usePromotionStore, Promotion, PromoRightWidget, PromoCtaType, ViewerRecord, AttendeeRecord, getMeetingStatusInfo } from '../store/usePromotionStore';
import { PromotionalCard } from '../components/PromotionalCard';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Eye, 
  Sparkles, 
  Edit3, 
  CheckCircle2, 
  Tag, 
  Phone, 
  MessageSquare, 
  MessageCircle, 
  TrendingUp, 
  Target, 
  Trophy, 
  PiggyBank, 
  Megaphone, 
  Gift, 
  X, 
  FileText, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle,
  Check,
  Copy,
  LayoutGrid,
  Send,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Preset 3D Icons for quick selection
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

// Available Pre-configured Templates
const TEMPLATE_PRESETS = [
  {
    id: 'target_promo',
    categoryName: 'লক্ষ্য',
    dropdownLabel: 'লক্ষ্য (Target Promo)',
    badgeLabel: 'সঞ্চয় লক্ষ্য কার্ড',
    icon: Target,
    title: 'ছোট সঞ্চয়, বড় স্বপ্ন ✨',
    subtitle: 'নিয়মিত সঞ্চয় করুন, ভবিষ্যৎ হবে সুরক্ষিত।',
    show_as_card: true,
    show_in_notices: false,
    show_in_meetings: false,
    right_widget_type: 'progress' as PromoRightWidget,
    target_text: 'লক্ষ্য: ৳১৫,০০০',
    progress_percent: 75,
    button_text: 'বিস্তারিত দেখুন',
    badge_text: 'বিশেষ লক্ষ্য',
    image_url: PRESET_ICONS[0].url,
    details_content: `### সঞ্চয়ের লক্ষ্য পূরণ ও ভবিষ্যৎ সুরক্ষা\n\nপ্রতি মাসে নির্দিষ্ট পরিমাণ সঞ্চয় করার অভ্যাস আপনার আর্থিক অবস্থানকে দৃঢ় করে। আমাদের সমবায়ের নিয়মিত সঞ্চয় স্কিমে অংশ নিয়ে নিজের ও পরিবারের ভবিষ্যৎ সুরক্ষিত করুন।`,
    cta_type: 'somobay' as PromoCtaType,
    cta_text: 'আমার সঞ্চয় হিসাব দেখুন',
    cta_link: '/savings'
  },
  {
    id: 'notice',
    categoryName: 'নোটিশ',
    dropdownLabel: 'নোটিশ (Notice)',
    badgeLabel: 'সাধারণ সার্কুলার / নোটিশ',
    icon: FileText,
    title: 'জরুরি নোটিশ: অফিস বন্ধ ও কিস্তি পরিশোধ',
    subtitle: 'ছুটি উপলক্ষে সমিতির প্রধান কার্যালয় বন্ধ থাকার বিষয়ে বিজ্ঞপ্তি।',
    show_as_card: true,
    show_in_notices: true,
    show_in_meetings: false,
    right_widget_type: 'none' as PromoRightWidget,
    target_text: '',
    progress_percent: 0,
    button_text: 'নোটিশ পড়ুন',
    badge_text: 'জরুরি নোটিশ',
    image_url: PRESET_ICONS[3].url,
    details_content: `### অফিস বন্ধ সংক্রান্ত জরুরি সার্কুলার\n\nসকল সম্মানিত সদস্যদের অবগতির জন্য জানানো যাচ্ছে যে, আসন্ন ছুটি উপলক্ষে আগামী ১৬ই তারিখ থেকে ১৮ই তারিখ পর্যন্ত প্রধান কার্যালয় বন্ধ থাকবে।\n\nতবে অ্যাপের মাধ্যমে অনলাইন কিস্তি জমা ও হিসাব পর্যালোচনা স্বাভাবিক থাকবে।`,
    cta_type: 'custom' as PromoCtaType,
    cta_text: 'অনলাইন কিস্তি জমা দিন',
    cta_link: '/savings/deposit'
  },
  {
    id: 'meeting',
    categoryName: 'মিটিং',
    dropdownLabel: 'মিটিং (Meeting)',
    badgeLabel: 'সাধারণ সভা ও মিটিং (AGM)',
    icon: Users,
    title: 'সমিতির বার্ষিক সাধারণ সভা (AGM) ও বাজেট অধিবেশন',
    subtitle: 'সকল সম্মানিত সদস্যবৃন্দকে উপস্থিত থাকার জন্য বিনীত অনুরোধ করা হচ্ছে।',
    show_as_card: true,
    show_in_notices: true,
    show_in_meetings: true,
    meeting_date: '',
    meeting_time: '',
    meeting_location: '',
    right_widget_type: 'button' as PromoRightWidget,
    button_text: 'উপস্থিত থাকুন',
    badge_text: 'সাধারণ সভা',
    image_url: PRESET_ICONS[2].url,
    details_content: `### বার্ষিক সাধারণ সভা (AGM) কার্যসূচি\n\n১. বিগত অর্থবছরের আয়-ব্যয় ও অডিট অনুমোদন।\n২. সদস্য সঞ্চয়ের লভ্যাংশ ঘোষণা ও মুনাফা বণ্টন।\n৩. নতুন প্রকল্প ও ঋণ নীতিমালার ওপর উন্মুক্ত আলোচনা।\n\n*সম্মানিত সদস্যদের উপস্থিতি কাম্য।*`,
    cta_type: 'call' as PromoCtaType,
    cta_phone: '',
    cta_text: 'অফিস হেল্পলাইনে কল করুন',
    cta_link: ''
  },
  {
    id: 'offer',
    categoryName: 'অফার',
    dropdownLabel: 'অফার (Offer)',
    badgeLabel: 'বিশেষ স্কিম ও বোনাস অফার',
    icon: Gift,
    title: 'নতুন পালাক্রমিক (ROSCA) লটারি স্কিম চালু!',
    subtitle: '১২ জন সদস্য • প্রতি মাসে ১২,০০০ টাকা ড্র!',
    show_as_card: true,
    show_in_notices: false,
    show_in_meetings: false,
    right_widget_type: 'button' as PromoRightWidget,
    button_text: 'অংশ নিন',
    badge_text: 'সীমিত আসন',
    image_url: PRESET_ICONS[1].url,
    details_content: `### রোটেশনাল সঞ্চয় ও লটারি সমিতি স্কিম\n\nস্বল্পমেয়াদে এককালীন নগদ টাকার প্রয়োজন মেটাতে আজই নতুন ১২ মাসের চক্রাকার স্কিমে অংশ নিন। প্রতিটি সদস্য প্রতি মাসে একবার ড্র পাবেন।`,
    cta_type: 'whatsapp' as PromoCtaType,
    cta_phone: '',
    cta_text: 'WhatsApp-এ যোগাযোগ করুন',
    cta_link: ''
  },
  {
    id: 'news',
    categoryName: 'সংবাদ',
    dropdownLabel: 'সংবাদ (News)',
    badgeLabel: 'সমবায় সংবাদ ও অর্জন',
    icon: TrendingUp,
    title: 'আমাদের সমবায় সমিতির নতুন মাইলফলক অর্জন 🎉',
    subtitle: 'মোট সংরক্ষিত তহবিল ৫০ লক্ষ টাকা অতিক্রম করেছে।',
    show_as_card: true,
    show_in_notices: true,
    show_in_meetings: false,
    right_widget_type: 'badge' as PromoRightWidget,
    badge_text: 'মাইলফলক',
    image_url: PRESET_ICONS[1].url,
    details_content: `### সফলতার নতুন চূড়ায় আমাদের সমবায়\n\nসকল সম্মানিত সদস্যদের আন্তরিক সহযোগিতা ও শৃঙ্খলাপূর্ণ কিস্তি পরিশোধের ফলে সমিতি আজ এই বিশাল অর্জন অর্জন করেছে। সবাইকে আন্তরিক ধন্যবাদ ও অভিনন্দন!`,
    cta_type: 'somobay' as PromoCtaType,
    cta_text: 'আমার সমবায় ড্যাশবোর্ড',
    cta_link: '/dashboard'
  },
  {
    id: 'promotion',
    categoryName: 'প্রমোশন',
    dropdownLabel: 'প্রমোশন (Promotion)',
    badgeLabel: 'সাধারণ প্রমোশন ব্যানার',
    icon: Megaphone,
    title: 'যৌথ লক্ষ্য উন্নয়ন ফান্ডে অংশ নিন',
    subtitle: 'একটি মহৎ সামাজিক ও ব্যবসায়িক উদ্দেশ্যের জন্য কমন ফান্ড।',
    show_as_card: true,
    show_in_notices: false,
    show_in_meetings: false,
    right_widget_type: 'badge' as PromoRightWidget,
    badge_text: 'কমন ফান্ড',
    image_url: PRESET_ICONS[2].url,
    details_content: `ব্যক্তিগত সঞ্চয়ের পাশাপাশি আমাদের সমবায় সমিতি একটি সম্মিলিত তহবিল গঠনের উদ্যোগ নিয়েছে।`,
    cta_type: 'savings' as PromoCtaType,
    cta_text: 'এখনই কিস্তি জমা দিন',
    cta_link: '/savings'
  }
];

// SS1: 3 Admin Tabs
type AdminTab = 'updates' | 'notices' | 'meetings';

export default function AdminUpdates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: updates | notices | meetings
  const tabFromUrl = searchParams.get('tab') || '';
  const initialTab: AdminTab = 
    tabFromUrl === 'notices' || tabFromUrl === 'notice' ? 'notices' :
    tabFromUrl === 'meetings' || tabFromUrl === 'meeting' ? 'meetings' : 'updates';

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const activeOrganizationId = useAuthStore(state => state.activeOrganizationId);
  const { promotions, fetchPromotions, createPromotion, updatePromotion, deletePromotion, loading } = usePromotionStore();

  // Full page creation/editing state (NOT a popup modal!)
  const [isFullPageForm, setIsFullPageForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('target_promo');

  // Modals for Analytics & Records
  const [viewersModalItem, setViewersModalItem] = useState<Promotion | null>(null);
  const [attendeesModalItem, setAttendeesModalItem] = useState<Promotion | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'লক্ষ্য',
    template_type: 'target_promo',
    scope: 'cooperative' as 'cooperative' | 'platform',
    show_as_card: true,
    show_in_notices: false,
    show_in_meetings: false,
    show_as_popup: false,
    image_url: PRESET_ICONS[0].url,
    right_widget_type: 'progress' as PromoRightWidget,
    target_text: 'লক্ষ্য: ৳১২,০০০',
    progress_percent: 80,
    button_text: 'বিস্তারিত দেখুন',
    badge_text: 'বিশেষ অফার',
    details_image_url: '',
    details_content: '',
    cta_type: 'somobay' as PromoCtaType,
    cta_phone: '',
    cta_text: 'আমার সমিতি দেখুন',
    meeting_date: '',
    meeting_time: '',
    meeting_location: '',
    meeting_status: 'upcoming' as 'upcoming' | 'completed' | 'cancelled'
  });

  useEffect(() => {
    fetchPromotions(activeOrganizationId);
  }, [fetchPromotions, activeOrganizationId]);

  // Sync tab with URL
  useEffect(() => {
    const qTab = searchParams.get('tab') as AdminTab;
    if (qTab && ['updates', 'notices', 'meetings'].includes(qTab)) {
      setActiveTab(qTab);
    }
    const editId = searchParams.get('edit');
    if (editId && promotions.length > 0) {
      const target = promotions.find(p => p.id === editId);
      if (target) {
        startEditing(target);
      }
    }
  }, [searchParams, promotions]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Grouped Lists
  const updatesList = useMemo(() => {
    return promotions.filter(p => p.show_as_card || !p.show_in_notices);
  }, [promotions]);

  const noticesList = useMemo(() => {
    return promotions.filter(p => p.show_in_notices || (p.category || '').includes('নোটিশ') || (p.category || '').includes('বিজ্ঞপ্তি'));
  }, [promotions]);

  const meetingsList = useMemo(() => {
    return promotions.filter(p => p.show_in_meetings || (p.category || '').includes('মিটিং') || (p.category || '').includes('সভা'));
  }, [promotions]);

  // Start creating fresh with a chosen template
  const startCreating = (templateId: string = 'target_promo') => {
    setEditingId(null);
    applyTemplate(templateId);
    setIsFullPageForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply a template to populate the form
  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = TEMPLATE_PRESETS.find(t => t.id === templateId) || TEMPLATE_PRESETS[0];

    setFormData(prev => ({
      ...prev,
      title: tmpl.title,
      subtitle: tmpl.subtitle,
      category: tmpl.categoryName,
      template_type: tmpl.id,
      show_as_card: tmpl.show_as_card,
      show_in_notices: tmpl.show_in_notices,
      show_in_meetings: tmpl.show_in_meetings,
      image_url: tmpl.image_url,
      right_widget_type: tmpl.right_widget_type,
      target_text: tmpl.target_text || '',
      progress_percent: tmpl.progress_percent || 0,
      button_text: tmpl.button_text || 'বিস্তারিত দেখুন',
      badge_text: tmpl.badge_text || '',
      details_content: tmpl.details_content,
      cta_type: tmpl.cta_type,
      cta_text: tmpl.cta_text,
      cta_link: tmpl.cta_link,
      cta_phone: tmpl.cta_phone || '',
      meeting_date: tmpl.meeting_date || prev.meeting_date,
      meeting_time: tmpl.meeting_time || prev.meeting_time,
      meeting_location: tmpl.meeting_location || prev.meeting_location
    }));
  };

  // Edit an existing publication
  const startEditing = (p: Promotion) => {
    setEditingId(p.id);
    const matchedTmpl = TEMPLATE_PRESETS.find(t => t.categoryName === p.category) || TEMPLATE_PRESETS[0];
    setSelectedTemplateId(p.template_type || matchedTmpl.id);

    setFormData({
      title: p.title || '',
      subtitle: p.subtitle || '',
      category: p.category || 'লক্ষ্য',
      template_type: p.template_type || 'target_promo',
      show_as_card: p.show_as_card ?? true,
      show_in_notices: p.show_in_notices ?? false,
      show_in_meetings: p.show_in_meetings ?? false,
      show_as_popup: p.show_as_popup ?? false,
      image_url: p.image_url || PRESET_ICONS[0].url,
      right_widget_type: p.right_widget_type || 'progress',
      target_text: p.target_text || '',
      progress_percent: p.progress_percent ?? 70,
      button_text: p.button_text || 'বিস্তারিত দেখুন',
      badge_text: p.badge_text || '',
      details_image_url: p.details_image_url || '',
      details_content: p.details_content || '',
      cta_type: p.cta_type || 'somobay',
      cta_phone: p.cta_phone || '',
      cta_text: p.cta_text || 'আমার সমিতি দেখুন',
      meeting_date: p.meeting_date || '',
      meeting_time: p.meeting_time || '',
      meeting_location: p.meeting_location || '',
      meeting_status: (p.meeting_status || 'upcoming') as 'upcoming' | 'completed' | 'cancelled'
    });
    setIsFullPageForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('অনুগ্রহ করে শিরোনাম লিখুন');
      return;
    }

    if (!formData.show_as_card && !formData.show_in_notices && !formData.show_in_meetings) {
      alert('কমপক্ষে একটি স্থানে দেখানোর টিকচিহ্ন (কার্ড, নোটিশ বা মিটিং) নির্বাচন করুন।');
      return;
    }

    const targetOrgId = activeOrganizationId || null;
    const payload = {
      ...formData,
      organization_id: targetOrgId,
      scope: targetOrgId ? 'cooperative' : 'platform',
      is_active: true
    };

    if (editingId) {
      await updatePromotion(editingId, payload);
    } else {
      await createPromotion(payload);
    }

    // Auto-dispatch in-app notification to members of the specific organization
    if (targetOrgId && (formData.show_in_notices || formData.show_in_meetings)) {
      try {
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', targetOrgId)
          .eq('status', 'active');

        if (members && members.length > 0) {
          const isCancelled = formData.meeting_status === 'cancelled';
          const notifTitle = formData.show_in_meetings
            ? (isCancelled ? 'মিটিং স্থগিত সংক্রান্ত বিজ্ঞপ্তি' : 'নতুন সভা/মিটিং আহ্বান')
            : 'সমিতির নতুন নোটিশ';

          const notifs = members.map(m => ({
            user_id: m.user_id,
            organization_id: targetOrgId,
            title: notifTitle,
            message: `${formData.title}${formData.subtitle ? ': ' + formData.subtitle : ''}`,
            type: isCancelled ? 'warning' : 'info',
            source_module: 'plan'
          }));
          await supabase.from('notifications').insert(notifs);
        }
      } catch (notifErr) {
        console.error('Failed to notify organization members:', notifErr);
      }
    }

    setIsFullPageForm(false);
    setEditingId(null);
    searchParams.delete('edit');
    setSearchParams(searchParams);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত এই প্রকাশনাটি মুছে ফেলতে চান?')) {
      await deletePromotion(id);
    }
  };

  const handleToggleActive = async (p: Promotion) => {
    await updatePromotion(p.id, { is_active: !p.is_active });
  };

  // Construct Live Preview Card
  const previewItem: Promotion = {
    id: editingId || 'preview-card',
    ...formData,
    views_count: 0,
    viewers: [],
    attendees: [],
    is_active: true,
    created_at: new Date().toISOString()
  };

  // =========================================================================
  // RENDER VIEW A: FULL PAGE CREATION / EDITING FORM (Not Popup!)
  // =========================================================================
  if (isFullPageForm) {
    return (
      <MobileLayout
        headerTitle={editingId ? 'প্রকাশনা সম্পাদনা' : 'নতুন প্রকাশনা তৈরি'}
        headerSubtitle="টেমপ্লেট নির্বাচন করুন এবং প্রকাশ করুন"
        showBack={true}
        onBack={() => {
          setIsFullPageForm(false);
          setEditingId(null);
        }}
      >
        <form onSubmit={handleSave} className="space-y-5 pb-20 pt-1">

          {/* 1. TOP SECTION: TEMPLATE SELECTION (Matching SS2 dropdown & visual cards) */}
          <div className="bg-white p-4.5 rounded-[22px] border border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-bold text-slate-800 bangla flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <span>ধরণ / ক্যাটাগরি (টেমপ্লেট নির্বাচন)</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                SS2 টেমপ্লেট
              </span>
            </div>

            {/* SS2 Style Select Dropdown */}
            <select
              value={selectedTemplateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full bg-bg-soft border-2 border-emerald-600 rounded-2xl py-3 px-3.5 text-[14px] font-bold bangla text-slate-800 focus:outline-none shadow-xs"
            >
              {TEMPLATE_PRESETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.dropdownLabel}
                </option>
              ))}
            </select>

            {/* Quick Visual Template Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {TEMPLATE_PRESETS.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-emerald-50/80 border-primary text-primary shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-[11.5px] font-bold bangla leading-tight">
                      {t.badgeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DISPLAY TARGET CHECKMARKS (Requested: card and/or notice checkmarks) */}
          <div className="bg-white p-4.5 rounded-[22px] border border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
            <h3 className="text-[14px] font-bold text-slate-800 bangla flex items-center gap-1.5">
              <LayoutGrid size={16} className="text-primary" />
              <span>কোথায় কোথায় প্রদর্শিত হবে? (চেকমার্ক নির্বাচন)</span>
            </h3>
            <p className="text-[11.5px] text-slate-500 bangla">
              একই সাথে কার্ড ও নোটিশ বোর্ড অথবা যেকোনো একটি নির্বাচন করতে পারেন।
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Checkmark 1: User Side Card / Banner */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-bg-soft cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.show_as_card}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_as_card: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-primary focus:ring-primary accent-[#087F5B]"
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 bangla">
                    ইউজার সাইড কার্ড ও ব্যানার (Home & Updates Carousel)
                  </span>
                  <span className="text-[11px] text-slate-500 bangla">
                    ড্যাশবোর্ড ও আপডেটস পেজের শীর্ষে প্রমোশন কার্ড হিসেবে ভাসবে
                  </span>
                </div>
              </label>

              {/* Checkmark 2: Notice Board */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-bg-soft cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.show_in_notices}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_in_notices: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-primary focus:ring-primary accent-[#087F5B]"
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 bangla">
                    নোটিশ বোর্ড (Notice Board)
                  </span>
                  <span className="text-[11px] text-slate-500 bangla">
                    ইউজার সাইডের 'নোটিশ' ট্যাবে অফিসিয়াল সার্কুলার হিসেবে দেখাবে
                  </span>
                </div>
              </label>

              {/* Checkmark 3: Meeting Board */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-bg-soft cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.show_in_meetings}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_in_meetings: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-primary focus:ring-primary accent-[#087F5B]"
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 bangla">
                    মিটিং ও সভা বোর্ড (Meeting / AGM Board)
                  </span>
                  <span className="text-[11px] text-slate-500 bangla">
                    'মিটিং/সভা' ট্যাবে তারিখ, সময় ও উপস্থিতি নিশ্চিতকরণ বাটনসহ শো করবে
                  </span>
                </div>
              </label>

              {/* Checkmark 4: Instant Popup Banner */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-bg-soft cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.show_as_popup}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_as_popup: e.target.checked }))}
                  className="w-5 h-5 rounded-md text-primary focus:ring-primary accent-[#087F5B]"
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 bangla">
                    ইউজারদের স্ক্রিনে পপআপ ব্যানার দেখান (Instant Popup Banner)
                  </span>
                  <span className="text-[11px] text-slate-500 bangla">
                    সদস্যরা অ্যাপে প্রবেশ করা মাত্রই এই নোটিশটি পপআপ ডায়ালগ হিসেবে ভেসে উঠবে
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. MEETING SPECIFIC INPUTS (Shown if Meeting is checked or selected) */}
          {(formData.show_in_meetings || formData.template_type === 'meeting') && (
            <div className="bg-purple-50/50 p-4.5 rounded-[22px] border border-purple-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-[14px] bangla">
                <Users size={17} />
                <span>মিটিং ও সভার বিবরণ (উপস্থিতি ট্র্যাকিং সক্রিয়)</span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                      সভার তারিখ (Date)
                    </label>
                    <input
                      type="text"
                      value={formData.meeting_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                      placeholder="যেমন: ১৫ নভেম্বর, ২০২৬ (রবিবার)"
                      className="w-full bg-white border border-purple-200 rounded-xl py-2.5 px-3 text-[13px] bangla text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                      সভার অবস্থা (Status)
                    </label>
                    <select
                      value={formData.meeting_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_status: e.target.value as any }))}
                      className="w-full bg-white border border-purple-200 rounded-xl py-2.5 px-3 text-[13px] bangla text-slate-800 focus:outline-none focus:border-purple-600"
                    >
                      <option value="upcoming">আসন্ন সভা (Upcoming)</option>
                      <option value="completed">সম্পন্ন সভা (Completed / Past)</option>
                      <option value="cancelled">স্থগিত সভা (Cancelled)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                      সময় (Time)
                    </label>
                    <input
                      type="text"
                      value={formData.meeting_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_time: e.target.value }))}
                      placeholder="সকাল ১০:০০ টা - দুপুর ০১:০০ টা"
                      className="w-full bg-white border border-purple-200 rounded-xl py-2.5 px-3 text-[13px] bangla text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                      স্থান (Location)
                    </label>
                    <input
                      type="text"
                      value={formData.meeting_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_location: e.target.value }))}
                      placeholder="সমিতি কার্যালয় (সম্মেলন কক্ষ)"
                      className="w-full bg-white border border-purple-200 rounded-xl py-2.5 px-3 text-[13px] bangla text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. MAIN CONTENT & TEXTS */}
          <div className="bg-white p-4.5 rounded-[22px] border border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3.5">
            <h3 className="text-[14px] font-bold text-slate-800 bangla flex items-center gap-1.5">
              <FileText size={16} className="text-primary" />
              <span>শিরোনাম ও মূল বিবরণ</span>
            </h3>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                শিরোনাম (Title) *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="যেমন: ছোট সঞ্চয়, বড় স্বপ্ন ✨"
                className="w-full bg-bg-soft border border-border rounded-xl py-2.5 px-3.5 text-[14px] font-bold bangla text-slate-800 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                উপ-শিরোনাম / সংক্ষিপ্ত বার্তা (Subtitle)
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="যেমন: নিয়মিত সঞ্চয় করুন, ভবিষ্যৎ হবে সুরক্ষিত।"
                className="w-full bg-bg-soft border border-border rounded-xl py-2.5 px-3.5 text-[13px] bangla text-slate-700 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                বিস্তারিত বিবরণ (নোটিশ বা পেজ কন্টেন্ট)
              </label>
              <textarea
                rows={5}
                value={formData.details_content}
                onChange={(e) => setFormData(prev => ({ ...prev, details_content: e.target.value }))}
                placeholder="নোটিশের পূর্ণাঙ্গ বিবরণ বা স্কিমের নিয়মাবলি লিখুন..."
                className="w-full bg-bg-soft border border-border rounded-xl py-2.5 px-3.5 text-[13px] bangla text-slate-800 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* 5. CARD WIDGET & 3D ICON CONFIGURATION (If card checkmark is selected) */}
          {formData.show_as_card && (
            <div className="bg-white p-4.5 rounded-[22px] border border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3.5">
              <h3 className="text-[14px] font-bold text-slate-800 bangla flex items-center gap-1.5">
                <Target size={16} className="text-amber-500" />
                <span>কার্ডের উইজেট ও ৩ডি আইকন</span>
              </h3>

              {/* 3D Icon Selector */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1.5">
                  বাম পাশের ৩ডি আইকন নির্বাচন
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_ICONS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: preset.url }))}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                        formData.image_url === preset.url
                          ? 'border-primary bg-primary-light/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain" />
                      <span className="text-[10.5px] font-semibold text-slate-700 bangla leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Widget Style */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                  ডান পাশের উইজেটের ধরণ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'progress', label: 'প্রোগ্রেস বার' },
                    { id: 'button', label: 'অ্যাকশন বাটন' },
                    { id: 'none', label: 'সাধারণ টেক্সট' }
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, right_widget_type: w.id as PromoRightWidget }))}
                      className={`py-2 px-2 rounded-xl text-[12px] font-bold bangla border transition-all ${
                        formData.right_widget_type === w.id
                          ? 'bg-primary text-white border-primary'
                          : 'bg-bg-soft border-slate-200 text-slate-600'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target & Progress inputs */}
              {formData.right_widget_type === 'progress' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                      টার্গেট লেখা
                    </label>
                    <input
                      type="text"
                      value={formData.target_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_text: e.target.value }))}
                      placeholder="লক্ষ্য: ৳১২,০০০"
                      className="w-full bg-bg-soft border border-border rounded-xl py-2 px-3 text-[13px] bangla text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[12px] font-semibold text-slate-700 bangla">
                        অগ্রগতি / প্রোগ্রেস
                      </label>
                      <span className="text-[12px] font-bold text-primary bangla">
                        {formData.progress_percent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progress_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, progress_percent: Number(e.target.value) }))}
                      className="w-full accent-[#087F5B]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. ACTION & CTA BUTTON */}
          <div className="bg-white p-4.5 rounded-[22px] border border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3.5">
            <h3 className="text-[14px] font-bold text-slate-800 bangla flex items-center gap-1.5">
              <Send size={16} className="text-primary" />
              <span>কল টু অ্যাকশন (বাটন লিংক ও যোগাযোগ)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'somobay', label: 'অ্যাপ লিংক', icon: ExternalLink },
                { type: 'call', label: 'কল করুন', icon: Phone },
                { type: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                { type: 'savings', label: 'সঞ্চয় জমা', icon: PiggyBank }
              ].map((cta) => {
                const Icon = cta.icon;
                return (
                  <button
                    key={cta.type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, cta_type: cta.type as PromoCtaType }))}
                    className={`py-2 px-2 rounded-xl text-[12px] font-bold bangla border flex items-center justify-center gap-1.5 transition-all ${
                      formData.cta_type === cta.type
                        ? 'bg-primary text-white border-primary'
                        : 'bg-bg-soft border-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{cta.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                  বাটন টেক্সট
                </label>
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                  placeholder="যেমন: যোগাযোগ করুন"
                  className="w-full bg-bg-soft border border-border rounded-xl py-2 px-3 text-[13px] bangla text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-700 bangla block mb-1">
                  ফোন নম্বর বা লিংক
                </label>
                <input
                  type="text"
                  value={formData.cta_phone || formData.cta_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, cta_phone: e.target.value, cta_link: e.target.value }))}
                  placeholder="01700000000 বা /savings"
                  className="w-full bg-bg-soft border border-border rounded-xl py-2 px-3 text-[13px] bangla text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 7. LIVE MOBILE PREVIEW */}
          {formData.show_as_card && (
            <div className="space-y-2 pt-2">
              <span className="text-[13px] font-bold text-slate-700 bangla px-1 flex items-center gap-1.5">
                <Eye size={15} className="text-primary" />
                <span>লাইভ প্রিভিউ (ইউজাররা যেভাবে কার্ডটি দেখবে):</span>
              </span>
              <PromotionalCard
                promo={previewItem}
                totalCards={1}
                currentIndex={0}
                onNext={() => {}}
                onPrev={() => {}}
                onClick={() => {}}
              />
            </div>
          )}

          {/* 8. SUBMIT / SAVE BUTTONS */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsFullPageForm(false);
                setEditingId(null);
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 font-bold text-[14px] bangla text-slate-700 hover:bg-slate-100 transition-all active:scale-98"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark font-bold text-[14px] bangla text-white shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>{editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'এখনই প্রকাশ করুন'}</span>
            </button>
          </div>

        </form>
      </MobileLayout>
    );
  }

  // =========================================================================
  // RENDER VIEW B: MAIN ADMIN 3-TAB MANAGEMENT DASHBOARD (SS1)
  // =========================================================================
  return (
    <MobileLayout
      headerTitle="আপডেটস ও প্রমোশন কন্ট্রোল"
      headerSubtitle="ব্যানার, নোটিশ ও সভার প্রকাশনা ব্যবস্থাপনা"
      backTo="/admin/more"
      headerRight={
        <button
          onClick={() => startCreating('target_promo')}
          className="h-10 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold bangla flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>নতুন প্রকাশনা</span>
        </button>
      }
    >
      <div className="space-y-4 pb-16">

        {/* SS1: EXACT 3 TABS (আপডেটস, নোটিশ, মিটিং) */}
        <div className="grid grid-cols-3 gap-1 bg-[#E2E8F0]/70 p-1 rounded-2xl">
          <button
            onClick={() => handleTabChange('updates')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[13px] font-bold bangla transition-all ${
              activeTab === 'updates'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'updates' ? 'text-primary' : 'text-slate-400'} />
            <span>আপডেটস ({updatesList.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('notices')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[13px] font-bold bangla transition-all ${
              activeTab === 'notices'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} className={activeTab === 'notices' ? 'text-primary' : 'text-slate-400'} />
            <span>নোটিশ ({noticesList.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('meetings')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[13px] font-bold bangla transition-all ${
              activeTab === 'meetings'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} className={activeTab === 'meetings' ? 'text-primary' : 'text-slate-400'} />
            <span>মিটিং ({meetingsList.length})</span>
          </button>
        </div>

        {/* Quick Template Launch Bar */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[12px] font-bold text-slate-600 bangla shrink-0 flex items-center gap-1">
            <Sparkles size={13} className="text-amber-500" />
            <span>দ্রুত তৈরি:</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => startCreating('target_promo')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-primary text-[11px] font-bold bangla border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              + লক্ষ্য কার্ড
            </button>
            <button
              onClick={() => startCreating('notice')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold bangla border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              + নোটিশ
            </button>
            <button
              onClick={() => startCreating('meeting')}
              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-bold bangla border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              + মিটিং (AGM)
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: আপডেটস (All Cards, Banners, Offers, Publications) */}
        {/* ============================================================== */}
        {activeTab === 'updates' && (
          <div className="space-y-3">
            {updatesList.length > 0 ? (
              updatesList.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-white rounded-2xl p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {promo.image_url ? (
                        <img src={promo.image_url} alt="" className="w-12 h-12 object-contain shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                          <Sparkles size={20} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold bangla px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {promo.category || 'আপডেট'}
                          </span>
                          {promo.show_as_card && (
                            <span className="text-[10px] font-semibold bangla px-2 py-0.5 rounded-full bg-emerald-50 text-primary border border-emerald-200">
                              ✓ কার্ডে
                            </span>
                          )}
                          {promo.show_in_notices && (
                            <span className="text-[10px] font-semibold bangla px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              ✓ নোটিশে
                            </span>
                          )}
                        </div>
                        <h4 className="text-[15px] font-bold text-slate-800 bangla mt-1 leading-snug">
                          {promo.title}
                        </h4>
                        <p className="text-[12px] text-slate-500 bangla line-clamp-1 mt-0.5">
                          {promo.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditing(promo)}
                        className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                        title="সম্পাদনা"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="মুছুন"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Analytics & Views Bar (User Requested: কার্ড কতবার দেখা হয়েছে রেকর্ড) */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[12px] bangla text-slate-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <Eye size={14} className="text-primary" />
                        <span>দেখা হয়েছে: {promo.views_count.toLocaleString('bn-BD')} বার</span>
                      </span>
                      {promo.viewers && promo.viewers.length > 0 && (
                        <button
                          onClick={() => setViewersModalItem(promo)}
                          className="text-primary font-bold hover:underline"
                        >
                          পাঠক তালিকা ({promo.viewers.length} জন)
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleActive(promo)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        promo.is_active
                          ? 'bg-emerald-100 text-primary'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {promo.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <Sparkles size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-500 bangla">কোনো আপডেট বা ব্যানার পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: নোটিশ (Notices with View Count & Readers List) */}
        {/* ============================================================== */}
        {activeTab === 'notices' && (
          <div className="space-y-3">
            {noticesList.length > 0 ? (
              noticesList.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-white rounded-2xl p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold bangla px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {notice.category || 'নোটিশ'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(notice.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-[15px] font-bold text-slate-800 bangla mt-1.5 leading-snug">
                        {notice.title}
                      </h4>
                      <p className="text-[12px] text-slate-500 bangla line-clamp-2 mt-1">
                        {notice.details_content || notice.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditing(notice)}
                        className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notice Record: How many viewed & who viewed (User Requested!) */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[12px] bangla">
                    <div className="flex items-center gap-2">
                      <Eye size={14} className="text-blue-600" />
                      <span className="text-slate-600">
                        পড়েছেন: <strong>{notice.views_count.toLocaleString('bn-BD')} জন সদস্য</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => setViewersModalItem(notice)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] bangla transition-colors"
                    >
                      কে কে পড়েছেন দেখুন ({notice.viewers ? notice.viewers.length : 0})
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <FileText size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-500 bangla">কোনো নোটিশ প্রকাশনা নেই</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: মিটিং (Meetings with Attendance RSVP List & Records) */}
        {/* ============================================================== */}
        {activeTab === 'meetings' && (
          <div className="space-y-3">
            {meetingsList.length > 0 ? (
              meetingsList.map((meeting) => {
                const attendeesCount = meeting.attendees ? meeting.attendees.length : 0;
                const statusInfo = getMeetingStatusInfo(meeting);
                return (
                  <div
                    key={meeting.id}
                    className="bg-white rounded-2xl p-4.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold bangla px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {meeting.category || 'সাধারণ সভা (AGM)'}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h4 className="text-[16px] font-bold text-slate-800 bangla mt-1.5 leading-snug">
                          {meeting.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditing(meeting)}
                          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(meeting.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Meeting Schedule Box */}
                    <div className="p-3 bg-bg-soft rounded-xl flex flex-col gap-1.5 border border-slate-200/60 text-[12px] bangla text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary" />
                        <span>তারিখ: <strong>{meeting.meeting_date || '১৫ মে, ২০২৪ (বুধবার)'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-600" />
                        <span>সময়: <strong>{meeting.meeting_time || 'সকাল ১০:০০ টা - দুপুর ০১:০০ টা'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-600" />
                        <span>স্থান: <strong>{meeting.meeting_location || 'সমিতি সম্মেলন কক্ষ'}</strong></span>
                      </div>
                    </div>

                    {/* ATTENDANCE RECORDS (User Requested: কে কে মিটিং এ attend er jonno aggred koreche) */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-[12px] bangla">
                        <span className="font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                          উপস্থিতি নিশ্চিত: {attendeesCount.toLocaleString('bn-BD')} জন
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          (মোট ভিউ: {meeting.views_count} বার)
                        </span>
                      </div>

                      <button
                        onClick={() => setAttendeesModalItem(meeting)}
                        className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-dark font-bold text-[12px] bangla shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Users size={14} />
                        <span>উপস্থিত সদস্যদের তালিকা ({attendeesCount})</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <Users size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-500 bangla">কোনো মিটিং বা সভা শিডিউল নেই</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEWERS LIST (কারা কারা নোটিশ/কার্ড দেখেছেন) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewersModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 bangla">পাঠক তালিকা (ভিউয়ার্স রেকর্ড)</h3>
                  <p className="text-[11px] text-slate-500 bangla truncate max-w-[280px]">
                    {viewersModalItem.title}
                  </p>
                </div>
                <button
                  onClick={() => setViewersModalItem(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {viewersModalItem.viewers && viewersModalItem.viewers.length > 0 ? (
                  viewersModalItem.viewers.map((viewer, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-[12px] bangla"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-primary font-bold flex items-center justify-center text-[12px]">
                          {viewer.user_name ? viewer.user_name.charAt(0) : 'স'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{viewer.user_name || 'সদস্য'}</p>
                          {viewer.user_phone && (
                            <p className="text-[11px] text-slate-500">{viewer.user_phone}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10.5px] text-slate-400">
                        {new Date(viewer.viewed_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-[13px] text-slate-400 bangla">
                    এখনও কোনো সদস্যের ভিউ রেকর্ড সংরক্ষিত হয়নি।
                  </p>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setViewersModalItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-[12px] font-bold bangla text-slate-700"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMED ATTENDEES LIST (কারা কারা মিটিং এ উপস্থিত থাকবেন) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {attendeesModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
                <div>
                  <h3 className="text-[15px] font-bold text-purple-950 bangla flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>উপস্থিতি সম্মতি প্রাপ্ত সদস্য তালিকা</span>
                  </h3>
                  <p className="text-[11px] text-purple-700 bangla">
                    মোট: {attendeesModalItem.attendees?.length || 0} জন উপস্থিত থাকবেন
                  </p>
                </div>
                <button
                  onClick={() => setAttendeesModalItem(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {attendeesModalItem.attendees && attendeesModalItem.attendees.length > 0 ? (
                  attendeesModalItem.attendees.map((attendee, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-purple-50/30 border border-purple-200/60 flex items-center justify-between text-[12px] bangla"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-[12px]">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{attendee.user_name}</p>
                          <p className="text-[11px] text-slate-500">{attendee.user_phone || 'মোবাইল: সংরক্ষিত'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-primary">
                          <Check size={11} strokeWidth={3} />
                          <span>উপস্থিতি নিশ্চিত</span>
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(attendee.confirmed_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-[13px] text-slate-400 bangla">
                    এখনও কোনো সদস্য উপস্থিতি নিশ্চিত করেননি।
                  </p>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => {
                    const text = attendeesModalItem.attendees
                      ?.map((a, i) => `${i + 1}. ${a.user_name} (${a.user_phone || ''})`)
                      .join('\n');
                    if (text) {
                      navigator.clipboard.writeText(text);
                      alert('উপস্থিত সদস্যদের তালিকা কপি করা হয়েছে!');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[12px] bangla flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>তালিকা কপি করুন</span>
                </button>

                <button
                  onClick={() => setAttendeesModalItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-[12px] font-bold bangla text-slate-700"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </MobileLayout>
  );
}
