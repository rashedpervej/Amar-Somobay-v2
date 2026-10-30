import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type PromoRightWidget = 'progress' | 'button' | 'badge' | 'none';
export type PromoCtaType = 'call' | 'whatsapp' | 'sms' | 'savings' | 'somobay' | 'custom';

export interface ViewerRecord {
  user_id: string;
  user_name: string;
  user_phone?: string;
  viewed_at: string;
}

export interface AttendeeRecord {
  user_id: string;
  user_name: string;
  user_phone?: string;
  confirmed_at: string;
}

export interface Promotion {
  id: string;
  organization_id?: string | null;
  scope?: 'platform' | 'cooperative';
  title: string;
  subtitle: string;
  category?: string; // 'লক্ষ্য' | 'অফার' | 'নোটিশ' | 'মিটিং' | 'সংবাদ' | 'প্রমোশন' etc.
  template_type?: 'target_promo' | 'notice' | 'meeting' | 'offer' | 'news' | string;

  // Display Targets (Checkmarks)
  show_as_card?: boolean;       // User side card/banner on Home & Updates
  show_in_notices?: boolean;     // User side Notice Board
  show_in_meetings?: boolean;   // User side Meetings tab
  show_as_popup?: boolean;      // User side popup banner alert

  // Left 3D image / illustration
  image_url?: string;
  
  // Right side widget configuration (for card presentation)
  right_widget_type: PromoRightWidget;
  target_text?: string;       // e.g. "লক্ষ্য: ৳১২,০০০"
  progress_percent?: number;  // e.g. 80
  button_text?: string;       // e.g. "বিস্তারিত দেখুন"
  button_link?: string;
  badge_text?: string;        // e.g. "বিশেষ অফার"
  
  // Landing details
  details_image_url?: string;
  details_content: string;
  
  // Action Button Configuration
  cta_type?: PromoCtaType;
  cta_phone?: string;
  cta_text?: string;
  cta_link?: string;
  
  // Meeting Specific Details
  meeting_date?: string;     // e.g. "১৫ নভেম্বর, ২০২৬ (রবিবার)"
  meeting_time?: string;     // e.g. "সকাল ১০:০০ টা - দুপুর ০১:০০ টা"
  meeting_location?: string; // e.g. "সমিতি কার্যালয় (সম্মেলন কক্ষ)"
  meeting_status?: 'upcoming' | 'completed' | 'cancelled'; // 'upcoming' | 'completed' | 'cancelled'

  // Analytics & Tracking
  views_count?: number;
  viewers?: ViewerRecord[];
  attendees?: AttendeeRecord[];

  is_active: boolean;
  created_at: string;
}

export function getMeetingStatusInfo(p: Promotion) {
  if (p.meeting_status === 'completed') {
    return { label: 'সম্পন্ন সভা', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200', isUpcoming: false };
  }
  if (p.meeting_status === 'cancelled') {
    return { label: 'স্থগিত সভা', badgeClass: 'bg-rose-50 text-rose-600 border-rose-200', isUpcoming: false };
  }

  // Check date string for past year vs current
  const dateStr = p.meeting_date || '';
  const currentYear = new Date().getFullYear();
  const match = dateStr.match(/(\d{4})|([০-৯]{4})/);
  if (match) {
    let yearNum = 0;
    if (match[1]) yearNum = parseInt(match[1], 10);
    else if (match[2]) {
      const bnToEn = match[2].replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
      yearNum = parseInt(bnToEn, 10);
    }
    if (yearNum && yearNum < currentYear) {
      return { label: 'সম্পন্ন সভা', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200', isUpcoming: false };
    }
  }

  return { label: 'আসন্ন সভা', badgeClass: 'bg-emerald-50 text-primary border-emerald-200', isUpcoming: true };
}

export const DEFAULT_PROMOTIONS: Promotion[] = [];

// Helper to normalize promotions loaded from storage/API
function normalizePromotion(p: any): Promotion {
  const isMeeting = (p.category || '').includes('মিটিং') || (p.category || '').includes('সভা');
  const isNotice = (p.category || '').includes('নোটিশ') || (p.category || '').includes('বিজ্ঞপ্তি');

  return {
    ...p,
    show_as_card: p.show_as_card !== undefined ? p.show_as_card : (!isNotice || true),
    show_in_notices: p.show_in_notices !== undefined ? p.show_in_notices : (isNotice || isMeeting),
    show_in_meetings: p.show_in_meetings !== undefined ? p.show_in_meetings : isMeeting,
    views_count: typeof p.views_count === 'number' ? p.views_count : (p.viewers ? p.viewers.length : 0),
    viewers: Array.isArray(p.viewers) ? p.viewers : [],
    attendees: Array.isArray(p.attendees) ? p.attendees : [],
    right_widget_type: p.right_widget_type || 'none',
    details_content: p.details_content || p.subtitle || ''
  };
}

interface PromotionStore {
  promotions: Promotion[];
  loading: boolean;
  fetchPromotions: (orgId?: string | null) => Promise<void>;
  createPromotion: (promo: Omit<Promotion, 'id' | 'created_at'>) => Promise<Promotion>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  recordView: (id: string, userProfile?: any) => Promise<void>;
  toggleAttendance: (id: string, userProfile: any) => Promise<boolean>;
  getPromotionById: (id: string) => Promotion | undefined;
}

export const usePromotionStore = create<PromotionStore>((set, get) => ({
  promotions: [],
  loading: false,

  fetchPromotions: async (orgId?: string | null) => {
    try {
      set({ loading: true });
      const cacheKey = orgId ? `amar_somobay_promotions_v2_${orgId}` : 'amar_somobay_promotions_v2';

      // 1. Fetch from server sync endpoint
      try {
        const query = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';
        const res = await fetch(`/api/promotions${query}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const normalized = json.data.map(normalizePromotion);
            set({ promotions: normalized, loading: false });
            localStorage.setItem(cacheKey, JSON.stringify(normalized));
            return;
          }
        }
      } catch (serverErr) {}

      // 2. Try Supabase
      try {
        let q = supabase
          .from('promotions')
          .select('*');

        if (orgId) {
          q = q.or(`organization_id.eq.${orgId},organization_id.is.null`);
        }

        const { data, error } = await q.order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const normalized = data.map(normalizePromotion);
          set({ promotions: normalized, loading: false });
          localStorage.setItem(cacheKey, JSON.stringify(normalized));
          return;
        }
      } catch (supaErr) {}

      // 3. Fallback to localStorage or empty
      const local = localStorage.getItem(cacheKey);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = parsed.map(normalizePromotion);
            set({ promotions: normalized, loading: false });
            return;
          }
        } catch (e) {}
      }
      set({ promotions: [], loading: false });
    } catch (err) {
      set({ promotions: [], loading: false });
    }
  },

  createPromotion: async (promoData) => {
    const newPromo: Promotion = normalizePromotion({
      ...promoData,
      id: 'promo-' + Date.now(),
      organization_id: promoData.organization_id || null,
      scope: promoData.scope || (promoData.organization_id ? 'cooperative' : 'platform'),
      created_at: new Date().toISOString(),
      views_count: promoData.views_count || 0,
      viewers: promoData.viewers || [],
      attendees: promoData.attendees || []
    });

    // 1. Sync to server API
    try {
      await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromo)
      });
    } catch (e) {}

    // 2. Sync to Supabase
    try {
      await supabase.from('promotions').insert([newPromo]);
    } catch (e) {}

    // 3. Update store and localStorage
    const updated = [newPromo, ...get().promotions];
    set({ promotions: updated });
    const cacheKey = newPromo.organization_id ? `amar_somobay_promotions_v2_${newPromo.organization_id}` : 'amar_somobay_promotions_v2';
    localStorage.setItem(cacheKey, JSON.stringify(updated));
    return newPromo;
  },

  updatePromotion: async (id, updates) => {
    // 1. Sync to server API
    try {
      await fetch(`/api/promotions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {}

    // 2. Sync to Supabase
    try {
      await supabase.from('promotions').update(updates).eq('id', id);
    } catch (e) {}

    // 3. Update store and localStorage
    const updated = get().promotions.map(p => p.id === id ? normalizePromotion({ ...p, ...updates }) : p);
    set({ promotions: updated });
    localStorage.setItem('amar_somobay_promotions_v2', JSON.stringify(updated));
  },

  deletePromotion: async (id) => {
    try {
      await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
    } catch (e) {}

    try {
      await supabase.from('promotions').delete().eq('id', id);
    } catch (e) {}

    const updated = get().promotions.filter(p => p.id !== id);
    set({ promotions: updated });
    localStorage.setItem('amar_somobay_promotions_v2', JSON.stringify(updated));
  },

  recordView: async (id: string, userProfile?: any) => {
    const promo = get().promotions.find(p => p.id === id);
    if (!promo) return;

    const userId = userProfile?.id || 'guest-' + Date.now().toString().slice(-4);
    const userName = userProfile?.full_name || userProfile?.username || 'সদস্য';
    const userPhone = userProfile?.phone || '';

    // Check if user already viewed in local memory to avoid duplicate rapid increments
    const existingViewer = promo.viewers?.find(v => v.user_id === userId);
    const updatedViewers = existingViewer 
      ? promo.viewers.map(v => v.user_id === userId ? { ...v, viewed_at: new Date().toISOString() } : v)
      : [...(promo.viewers || []), { user_id: userId, user_name: userName, user_phone: userPhone, viewed_at: new Date().toISOString() }];

    const updatedViewsCount = (promo.views_count || 0) + 1;

    // Local update
    const updated = get().promotions.map(p => 
      p.id === id ? { ...p, views_count: updatedViewsCount, viewers: updatedViewers } : p
    );
    set({ promotions: updated });
    localStorage.setItem('amar_somobay_promotions_v2', JSON.stringify(updated));

    // Server sync
    try {
      await fetch(`/api/promotions/${id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName, user_phone: userPhone })
      });
    } catch (e) {}
  },

  toggleAttendance: async (id: string, userProfile: any) => {
    const promo = get().promotions.find(p => p.id === id);
    if (!promo) return false;

    const userId = userProfile?.id || 'user-' + (userProfile?.phone || 'unknown');
    const userName = userProfile?.full_name || userProfile?.username || 'সম্মানিত সদস্য';
    const userPhone = userProfile?.phone || '';

    const attendees = promo.attendees || [];
    const isAlreadyAttending = attendees.some(a => a.user_id === userId);

    const updatedAttendees = isAlreadyAttending
      ? attendees.filter(a => a.user_id !== userId)
      : [...attendees, { user_id: userId, user_name: userName, user_phone: userPhone, confirmed_at: new Date().toISOString() }];

    const updated = get().promotions.map(p => 
      p.id === id ? { ...p, attendees: updatedAttendees } : p
    );
    set({ promotions: updated });
    localStorage.setItem('amar_somobay_promotions_v2', JSON.stringify(updated));

    // Server sync
    try {
      const res = await fetch(`/api/promotions/${id}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName, user_phone: userPhone })
      });
      if (res.ok) {
        const json = await res.json();
        return json.isAttending;
      }
    } catch (e) {}

    return !isAlreadyAttending;
  },

  getPromotionById: (id: string) => {
    return get().promotions.find(p => p.id === id);
  }
}));
