import React from 'react';
import { Coins, Users, Target, HeartHandshake } from 'lucide-react';

export type SavingsCategoryId = 'savings' | 'rosca' | 'joint_goal' | 'qard';

export interface SavingsCategoryTheme {
  id: SavingsCategoryId;
  title: string;
  subtitle: string;
  badgeLabel: string;
  
  // Backgrounds & Surfaces
  containerBg: string;        // Subtle tinted container (outer shell)
  cardBg: string;             // Inner card surface
  cardBorder: string;         // Card border styling
  cardHoverBorder: string;    // Hover border

  // Accent & Text colors
  accentHex: string;          // Hex code for dynamic styles
  accentText: string;         // Tailwind class for text
  accentBg: string;           // Tailwind class for soft accent pill

  // Category Icon Circle
  iconBg: string;
  iconColor: string;
  iconComponent: React.ComponentType<{ size?: number; className?: string }>;

  // Category Badge (e.g. "১টি প্ল্যান" or Category Identifier)
  categoryBadgeBg: string;
  categoryBadgeText: string;

  // Status Badge
  statusActiveBg: string;
  statusActiveText: string;

  // Progress Bar
  progressTrack: string;
  progressBar: string;
  progressText: string;

  // Details Action Button / Bottom Bar
  actionBorder: string;
  actionText: string;
  actionBg: string;
  actionHoverBg: string;

  // Stat Boxes (for ROSCA / multi-stat views)
  statBoxBg1: string;
  statBoxText1: string;
  statBoxBg2: string;
  statBoxText2: string;
  statBoxBg3: string;
  statBoxText3: string;

  // Notice Pill
  noticeBg: string;
  noticeBorder: string;
  noticeText: string;
}

export const SAVINGS_CATEGORY_THEMES: Record<SavingsCategoryId, SavingsCategoryTheme> = {
  // 1. General Cooperative: Soft green background, green accents and icons
  savings: {
    id: 'savings',
    title: 'সাধারণ সমবায় সমিতি',
    subtitle: 'নিয়মিত সঞ্চয়, কিস্তি, ঋণ ও সদস্যভিত্তিক হিসাব',
    badgeLabel: 'সাধারণ সমবায়',

    containerBg: 'bg-[#F0FBF6]',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-100/90',
    cardHoverBorder: 'hover:border-emerald-300',

    accentHex: '#087F5B',
    accentText: 'text-primary',
    accentBg: 'bg-primary-light',

    iconBg: 'bg-[#D1F2E2]',
    iconColor: 'text-primary',
    iconComponent: Coins,

    categoryBadgeBg: 'bg-[#D1F2E2]',
    categoryBadgeText: 'text-primary',

    statusActiveBg: 'bg-primary-light',
    statusActiveText: 'text-primary',

    progressTrack: 'bg-slate-100',
    progressBar: 'bg-primary',
    progressText: 'text-primary',

    actionBorder: 'border-primary',
    actionText: 'text-primary',
    actionBg: 'bg-white',
    actionHoverBg: 'hover:bg-emerald-50',

    statBoxBg1: 'bg-[#F0FBF6]',
    statBoxText1: 'text-primary',
    statBoxBg2: 'bg-[#F0FDF4]',
    statBoxText2: 'text-primary',
    statBoxBg3: 'bg-[#ECFDF5]',
    statBoxText3: 'text-[#047857]',

    noticeBg: 'bg-[#FEF2F2]',
    noticeBorder: 'border-red-100',
    noticeText: 'text-[#DC2626]'
  },

  // 2. Term / ROSCA Savings: Soft blue background, blue accents and icons
  rosca: {
    id: 'rosca',
    title: 'মেয়াদি / রোটেশনাল সঞ্চয় (ROSCA)',
    subtitle: 'নিয়মিত জমা এবং প্রতি মাসে একজন সদস্যকে প্রদান',
    badgeLabel: 'রোটেশনাল সঞ্চয়',

    containerBg: 'bg-[#F0F5FF]',
    cardBg: 'bg-white',
    cardBorder: 'border-blue-100/90',
    cardHoverBorder: 'hover:border-blue-300',

    accentHex: '#2563EB',
    accentText: 'text-[#2563EB]',
    accentBg: 'bg-[#E0EAFF]',

    iconBg: 'bg-[#E0EAFF]',
    iconColor: 'text-[#2563EB]',
    iconComponent: Users,

    categoryBadgeBg: 'bg-[#E0EAFF]',
    categoryBadgeText: 'text-[#2563EB]',

    statusActiveBg: 'bg-primary-light',
    statusActiveText: 'text-primary',

    progressTrack: 'bg-slate-100',
    progressBar: 'bg-[#2563EB]',
    progressText: 'text-primary',

    actionBorder: 'border-[#2563EB]',
    actionText: 'text-[#2563EB]',
    actionBg: 'bg-white',
    actionHoverBg: 'hover:bg-blue-50',

    statBoxBg1: 'bg-[#F0F5FF]',
    statBoxText1: 'text-[#2563EB]',
    statBoxBg2: 'bg-[#F0FDF4]',
    statBoxText2: 'text-primary',
    statBoxBg3: 'bg-[#FFFBEB]',
    statBoxText3: 'text-[#D97706]',

    noticeBg: 'bg-[#FFFBEB]',
    noticeBorder: 'border-amber-200/80',
    noticeText: 'text-[#B45309]'
  },

  // 3. Joint Goal Savings: Soft amber background, amber accents and icons
  joint_goal: {
    id: 'joint_goal',
    title: 'যৌথ সঞ্চয় (Joint Goal)',
    subtitle: 'একটি সাধারণ উদ্দেশ্যে সম্মিলিত সঞ্চয়',
    badgeLabel: 'যৌথ সঞ্চয়',

    containerBg: 'bg-[#FFF8E9]',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-100/90',
    cardHoverBorder: 'hover:border-amber-300',

    accentHex: '#D97706',
    accentText: 'text-[#D97706]',
    accentBg: 'bg-[#FEF3C7]',

    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    iconComponent: Target,

    categoryBadgeBg: 'bg-[#FEF3C7]',
    categoryBadgeText: 'text-[#D97706]',

    statusActiveBg: 'bg-primary-light',
    statusActiveText: 'text-primary',

    progressTrack: 'bg-slate-100',
    progressBar: 'bg-primary', // Matches reference screen green progress fill
    progressText: 'text-primary',

    actionBorder: 'border-primary',
    actionText: 'text-primary',
    actionBg: 'bg-white',
    actionHoverBg: 'hover:bg-emerald-50',

    statBoxBg1: 'bg-[#FFFBEB]',
    statBoxText1: 'text-[#D97706]',
    statBoxBg2: 'bg-[#F0FDF4]',
    statBoxText2: 'text-primary',
    statBoxBg3: 'bg-[#FEF2F2]',
    statBoxText3: 'text-[#DC2626]',

    noticeBg: 'bg-[#FFFDF7]',
    noticeBorder: 'border-amber-200/60',
    noticeText: 'text-[#B45309]'
  },

  // 4. Qard Hasanah: Soft purple background, purple accents and icons
  qard: {
    id: 'qard',
    title: 'কর্জে হাসানা (সুদমুক্ত ঋণ)',
    subtitle: 'জরুরি প্রয়োজন ও ব্যবসায় সম্পূর্ণ সুদমুক্ত সহায়তা',
    badgeLabel: 'কর্জে হাসানা',

    containerBg: 'bg-[#FAF5FF]',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-100/90',
    cardHoverBorder: 'hover:border-purple-300',

    accentHex: '#7C3AED',
    accentText: 'text-[#7C3AED]',
    accentBg: 'bg-[#F3E8FF]',

    iconBg: 'bg-[#F3E8FF]',
    iconColor: 'text-[#7C3AED]',
    iconComponent: HeartHandshake,

    categoryBadgeBg: 'bg-[#F3E8FF]',
    categoryBadgeText: 'text-[#7C3AED]',

    statusActiveBg: 'bg-primary-light',
    statusActiveText: 'text-primary',

    progressTrack: 'bg-slate-100',
    progressBar: 'bg-[#7C3AED]',
    progressText: 'text-[#7C3AED]',

    actionBorder: 'border-[#7C3AED]',
    actionText: 'text-[#7C3AED]',
    actionBg: 'bg-white',
    actionHoverBg: 'hover:bg-purple-50',

    statBoxBg1: 'bg-[#FAF5FF]',
    statBoxText1: 'text-[#7C3AED]',
    statBoxBg2: 'bg-[#F0FDF4]',
    statBoxText2: 'text-primary',
    statBoxBg3: 'bg-[#F3E8FF]',
    statBoxText3: 'text-[#6B21A8]',

    noticeBg: 'bg-[#FAF5FF]',
    noticeBorder: 'border-purple-200/80',
    noticeText: 'text-[#6B21A8]'
  }
};

export const ORDERED_CATEGORY_IDS: SavingsCategoryId[] = [
  'savings',
  'rosca',
  'joint_goal',
  'qard'
];

/**
 * Determine if a plan is actively running.
 * Business logic: plan.status === 'active' AND plan.is_active !== false.
 * Inactive / completed / paused plans must not affect the grouping count.
 */
export const isPlanActive = (plan: { is_active?: boolean; status?: string }): boolean => {
  return Boolean(plan.is_active !== false && plan.status === 'active');
};
