/**
 * Somobay Design System Tokens (Phase 1 Foundation)
 * 
 * Centralized token definitions mirroring CSS custom properties in `src/index.css`.
 * Provides type-safe constants for runtime JS/TS usage (charts, canvas, inline styles, etc.).
 */

export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: 'var(--primary, #087F5B)',
      primaryDark: 'var(--secondary, #065F46)',
      primaryLight: 'var(--primary-light, #E8F7F1)',
      primarySubtle: '#F0FBF6',
    },
    surfaces: {
      page: 'var(--bg-soft, #F8FAFC)',
      card: 'var(--card-bg, #FFFFFF)',
      muted: '#F1F5F9',
      savings: '#F0FBF6',
      rosca: '#F0F5FF',
      goal: '#FFF8E9',
      qard: '#FAF5FF',
    },
    text: {
      primary: 'var(--text-primary, #17202A)',
      secondary: 'var(--text-secondary, #64748B)',
      subtle: '#94A3B8',
    },
    borders: {
      subtle: 'var(--border, #E2E8F0)',
      strong: '#CBD5E1',
    },
    status: {
      success: '#16A34A',
      successLight: '#F0FDF4',
      warning: '#D97706',
      warningLight: '#FFFBEB',
      error: '#DC2626',
      errorLight: '#FEF2F2',
      info: '#2563EB',
      infoLight: '#EFF6FF',
    },
    schemes: {
      savings: 'var(--primary, #087F5B)',
      rosca: '#2563EB',
      goal: '#D97706',
      qard: '#7C3AED',
    },
  },
  radii: {
    card: '16px',
    small: '12px',
    button: '12px',
    input: '12px',
    badge: '9999px',
    sheet: '24px',
  },
  shadows: {
    card: '0 2px 8px rgba(0, 0, 0, 0.04)',
    cardSubtle: '0 2px 6px rgba(0, 0, 0, 0.02)',
    nav: '0 -2px 10px rgba(0, 0, 0, 0.03)',
  },
  spacing: {
    header: '56px',
    nav: '64px',
    navSafe: '84px',
    containerMaxW: '430px',
  },
  motion: {
    // 1. লিস্ট আইটেম বা কার্ডের মিষ্টি এন্ট্রি (MemberList এর প্রমাণিত ফর্মুলা)
    itemCascade: (index: number = 0) => ({
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: Math.min(index * 0.02, 0.2), duration: 0.2, ease: 'easeOut' }
    }),
    // 2. মডাল ও বটম শিট এন্ট্রি/এক্সিট
    modalSheet: {
      initial: { opacity: 0, y: '100%' },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: '100%' },
      transition: { type: 'spring', damping: 28, stiffness: 300 }
    },
    // 3. ডায়ালগ পপআপ
    dialog: {
      initial: { opacity: 0, scale: 0.95, y: 12 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 12 },
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    }
  }
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
