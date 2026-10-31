/* ============================================================
   src/nav/member.ts — সদস্য অ্যাপ (Member App — শুধু মোবাইল)
   উৎস: prototype/assets/app.js → MNAV (৫ স্লট · মাঝেরটি কেন্দ্রীয় FAB)।
   লেবেল/আইকন/গন্তব্য হুবহু প্রোটোটাইপের — d05 টেস্ট প্যারিটি যাচাই করে।
   ============================================================ */

import { History, Home, LayoutGrid, Plus, Wallet } from 'lucide-react';
import type { NavSlot } from './types';

/** নিয়ম: ঠিক ৫ স্লট · ঠিক একটি FAB · প্রতিটি ট্যাপ টার্গেট ≥ ৪৮px। */
export const MEMBER_NAV: NavSlot[] = [
  { key: 'home', label: 'হোম', icon: Home, to: '#m01' },
  { key: 'savings', label: 'সঞ্চয়', icon: Wallet, to: '#m04' },
  { key: 'deposit', label: 'জমা দিন', icon: Plus, to: '#m06', fab: true },
  { key: 'txn', label: 'লেনদেন', icon: History, to: '#m08' },
  { key: 'more', label: 'আরও', icon: LayoutGrid, to: '#m18' },
];

export const MEMBER_TAB_COUNT = 5;
