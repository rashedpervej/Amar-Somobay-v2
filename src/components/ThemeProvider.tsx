import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore, ThemeMode } from '../store/useThemeStore';
import { applyFontToDOM, resolveCurrentBanglaFont, BanglaFontType } from '../lib/fontConfig';

interface Theme {
  mode: 'light' | 'dark';
  themeMode: ThemeMode;
  primary: string;
  secondary: string;
  bgSoft: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  toggleMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const EXACT_THEME = {
  bgSoft: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#17202A',
  textSecondary: '#64748B',
  primary: '#087F5B',
  secondary: '#065F46',
  primaryLight: '#E8F7F1',
  border: '#E2E8F0',
};

const ThemeContext = createContext<Theme>({
  mode: 'light',
  themeMode: 'light',
  primary: EXACT_THEME.primary,
  secondary: EXACT_THEME.secondary,
  bgSoft: EXACT_THEME.bgSoft,
  card: EXACT_THEME.card,
  textPrimary: EXACT_THEME.textPrimary,
  textSecondary: EXACT_THEME.textSecondary,
  toggleMode: () => {},
  setThemeMode: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const settings = useSettingsStore(state => state.settings);
  const { setThemeMode } = useThemeStore();

  const banglaFont: BanglaFontType = (settings?.bangla_font as BanglaFontType) || resolveCurrentBanglaFont();
  const primaryColor = settings?.primary_color || EXACT_THEME.primary;
  // Automatically derive darker tone for hover/active/gradient and lighter tone for tints
  const primaryDark = `color-mix(in srgb, ${primaryColor} 82%, black)`;
  const primaryLight = `color-mix(in srgb, ${primaryColor} 12%, white)`;
  const primarySubtle = `color-mix(in srgb, ${primaryColor} 5%, white)`;

  // Synchronous DOM setup prior to paint
  if (typeof window !== 'undefined') {
    applyFontToDOM(banglaFont);
  }

  useEffect(() => {
    // Strictly enforce light mode only — no dark mode as per prompt requirements
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
    
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-dark', primaryDark);
    root.style.setProperty('--secondary', primaryDark); // Keep for backwards compatibility
    root.style.setProperty('--primary-light', primaryLight);
    root.style.setProperty('--primary-subtle', primarySubtle);
    root.style.setProperty('--bg-soft', EXACT_THEME.bgSoft);
    root.style.setProperty('--card-bg', EXACT_THEME.card);
    root.style.setProperty('--text-primary', EXACT_THEME.textPrimary);
    root.style.setProperty('--text-secondary', EXACT_THEME.textSecondary);
    root.style.setProperty('--border', EXACT_THEME.border);

    // Apply font variables reactively
    applyFontToDOM(banglaFont);

    // Comprehensive Mobile Status Bar & PWA Color Synchronization
    try {
      // 1. All theme-color meta tags (standard, light media, dark media)
      const metaTags = [
        { name: 'theme-color', media: null },
        { name: 'theme-color', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)' },
        { name: 'msapplication-navbutton-color', media: null },
        { name: 'msapplication-TileColor', media: null }
      ];

      metaTags.forEach(({ name, media }) => {
        let selector = media ? `meta[name="${name}"][media="${media}"]` : `meta[name="${name}"]:not([media])`;
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('name', name);
          if (media) el.setAttribute('media', media);
          document.head.appendChild(el);
        }
        el.setAttribute('content', primaryColor);
      });
    } catch (e) {
      console.warn('PWA Statusbar sync notice:', e);
    }
  }, [primaryColor, primaryDark, primaryLight, primarySubtle, banglaFont]);

  const theme = useMemo(() => {
    return {
      mode: 'light' as const,
      themeMode: 'light' as ThemeMode,
      primary: primaryColor,
      secondary: primaryDark,
      ...EXACT_THEME,
      toggleMode: () => {},
      setThemeMode
    };
  }, [primaryColor, primaryDark, setThemeMode]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
