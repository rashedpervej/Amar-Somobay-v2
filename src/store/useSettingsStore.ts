import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { resolveCurrentBanglaFont, applyFontToDOM, BanglaFontType } from '../lib/fontConfig';

export interface AppSettings {
  id: string;
  app_name: string;
  app_tagline: string;
  welcome_text: string;
  logo_url: string | null;
  icon_url?: string | null;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
  organization_name: string;
  contact_phone?: string;
  is_member_quick_actions_enabled: boolean;
  bangla_font?: BanglaFontType;
}

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  initialized: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: true,
  initialized: false,
  fetchSettings: async () => {
    try {
      // Sync font preference from cross-device server storage / localStorage
      let banglaFont: BanglaFontType = resolveCurrentBanglaFont();
      try {
        const fontRes = await fetch('/api/settings/font');
        if (fontRes.ok) {
          const fontData = await fontRes.json();
          if (fontData?.bangla_font) {
            banglaFont = fontData.bangla_font;
            if (typeof window !== 'undefined') {
              localStorage.setItem('app_bangla_font', banglaFont);
              applyFontToDOM(banglaFont);
            }
          }
        }
      } catch {
        // use fallback resolved earlier
      }

      // Sync icon_url from server branding endpoint
      let iconUrl: string = '/icon.svg';
      try {
        const brandRes = await fetch('/api/settings/branding');
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          if (brandData?.data?.icon_url) {
            iconUrl = brandData.data.icon_url;
            if (typeof document !== 'undefined') {
              const iconLinks = document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon']");
              iconLinks.forEach((el) => el.setAttribute('href', iconUrl));
            }
          }
        }
      } catch {
        // fallback to /icon.svg
      }

      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .maybeSingle(); // Use maybeSingle to handle empty table gracefully
      
      if (error) throw error;
      
      if (data) {
        set({
          settings: {
            ...data,
            logo_url: data.logo_url || '/somobay_logo.svg',
            icon_url: iconUrl,
            bangla_font: banglaFont
          },
          loading: false,
          initialized: true
        });
      } else {
        // Fallback defaults if no row exists yet
        set({ 
          settings: {
            id: '00000000-0000-0000-0000-000000000000',
            app_name: 'আমার সমবায়',
            app_tagline: 'সঞ্চয় ও ঋণের নির্ভরযোগ্য মাধ্যম',
            welcome_text: 'স্বাগতম জানাই আমাদের ডিজিটাল প্ল্যাটফর্মে',
            logo_url: '/somobay_logo.svg',
            icon_url: iconUrl,
            primary_color: '#10b981',
            secondary_color: '#059669',
            footer_text: 'সার্বিক সহযোগিতায়: গণপ্রজাতন্ত্রী বাংলাদেশ সমবায় অধিদপ্তর',
            organization_name: 'আমার সমবায় প্ল্যাটফর্ম',
            is_member_quick_actions_enabled: true,
            bangla_font: banglaFont
          },
          loading: false,
          initialized: true
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ loading: false, initialized: true });
    }
  },
  updateSettings: async (updates) => {
    const current = get().settings;
    if (!current) throw new Error('Settings not initialized');

    try {
      // If bangla_font is being updated, persist to server and localStorage
      if (updates.bangla_font) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('app_bangla_font', updates.bangla_font);
          applyFontToDOM(updates.bangla_font);
        }
        try {
          await fetch('/api/settings/font', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bangla_font: updates.bangla_font })
          });
        } catch (fontErr) {
          console.warn('Could not sync font to server:', fontErr);
        }
      }

      // Create a clean payload with only valid Supabase columns
      const payload: any = {
        id: current.id,
        app_name: updates.app_name ?? current.app_name,
        app_tagline: updates.app_tagline ?? current.app_tagline,
        welcome_text: updates.welcome_text ?? current.welcome_text,
        logo_url: updates.logo_url === undefined ? current.logo_url : updates.logo_url,
        footer_text: updates.footer_text ?? current.footer_text,
        organization_name: updates.organization_name ?? current.organization_name,
        primary_color: updates.primary_color ?? current.primary_color,
        secondary_color: updates.secondary_color ?? current.secondary_color,
        is_member_quick_actions_enabled: updates.is_member_quick_actions_enabled ?? (current.is_member_quick_actions_enabled ?? true),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // If it's a column missing error, try a fallback without the extra columns
        if (error.message?.includes('column')) {
          console.warn('Falling back to basic settings update due to schema mismatch');
          const fallbackPayload = { ...payload };
          
          // List of columns that might be missing in older schemas
          const potentialMissingColumns = ['primary_color', 'secondary_color'];
          
          potentialMissingColumns.forEach(col => {
            if (error.message?.includes(col)) {
              delete (fallbackPayload as any)[col];
            }
          });
          
          const { error: retryError } = await supabase
            .from('app_settings')
            .upsert(fallbackPayload, { onConflict: 'id' });
          
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      
      set({ settings: { ...current, ...updates } });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}));
