export type BanglaFontType = 'system_default' | 'solaimanlipi' | 'noto_sans_bengali' | 'hind_siliguri';

export interface FontFamilyDefinition {
  appFontBangla: string;
  appFontFamily: string;
}

export function getFontFamilyDefinitions(font: BanglaFontType = 'solaimanlipi'): FontFamilyDefinition {
  if (font === 'solaimanlipi') {
    return {
      appFontBangla: "'SolaimanLipi', sans-serif",
      appFontFamily: "'Inter', 'SolaimanLipi', sans-serif",
    };
  }
  if (font === 'noto_sans_bengali') {
    return {
      appFontBangla: "'Noto Sans Bengali', sans-serif",
      appFontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
    };
  }
  if (font === 'hind_siliguri') {
    return {
      appFontBangla: "'Hind Siliguri', sans-serif",
      appFontFamily: "'Inter', 'Hind Siliguri', sans-serif",
    };
  }
  return {
    appFontBangla: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    appFontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };
}

export function resolveCurrentBanglaFont(): BanglaFontType {
  if (typeof window === 'undefined') return 'solaimanlipi';
  try {
    const saved = localStorage.getItem('app_bangla_font') as BanglaFontType | null;
    if (saved && (saved === 'solaimanlipi' || saved === 'noto_sans_bengali' || saved === 'hind_siliguri' || saved === 'system_default')) {
      return saved;
    }
    const serverFont = (window as any).__SERVER_BANGLA_FONT__ as BanglaFontType | undefined;
    if (serverFont && (serverFont === 'solaimanlipi' || serverFont === 'noto_sans_bengali' || serverFont === 'hind_siliguri' || serverFont === 'system_default')) {
      return serverFont;
    }
  } catch {
    // ignore
  }
  return 'solaimanlipi';
}

export function applyFontToDOM(font: BanglaFontType): void {
  if (typeof document === 'undefined') return;
  const { appFontBangla, appFontFamily } = getFontFamilyDefinitions(font);
  const root = document.documentElement;

  root.style.setProperty('--app-font-bangla', appFontBangla);
  root.style.setProperty('--app-font-family', appFontFamily);
  root.setAttribute('data-app-font', font);

  if (font === 'solaimanlipi' && !document.querySelector('link[rel="preload"][href*="solaimanlipi-regular"]')) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = '/fonts/solaimanlipi-regular.woff2';
    document.head.appendChild(link);
  }
}
