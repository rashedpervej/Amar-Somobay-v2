/* ============================================================
   src/nav/types.ts — নেভিগেশন চুক্তি (Phase 2)
   মান প্রোটোটাইপ থেকেই নেওয়া: prototype/assets/app.js (MNAV · ANAV · ADMIN_SHELLS)।
   কোনো লেবেল এখানে নতুন বানানো হয় না — সব প্রোটোটাইপের হুবহু অনুলিপি (d05 টেস্ট যাচাই করে)।
   ============================================================ */

import type { LucideIcon } from 'lucide-react';

/** বটম নেভ / সাইডবারের একটি স্লট */
export type NavSlot = {
  /** প্রোটোটাইপের কী (MNAV-এর k) */
  key: string;
  label: string;
  icon: LucideIcon;
  /** প্রোটোটাইপের গন্তব্য (#m01 …) — Phase 3-এ রুটে রূপান্তরিত হবে */
  to: string;
  /** কেন্দ্রীয় FAB স্লট (৫ স্লটের মাঝেরটি) */
  fab?: boolean;
  /** সাইডবারের ব্যাজ সংখ্যা */
  badge?: number;
  /** হালকা (সতর্ক) ব্যাজ */
  soft?: boolean;
};

export type NavGroup = { group: string; items: NavSlot[] };

export type AdminRole = 'COLLECTOR' | 'ACCOUNTANT' | 'MANAGER' | 'APPROVER' | 'ORG_ADMIN' | 'AUDITOR' | 'EXTERNAL_AUDITOR' | 'VIEWER';

export type AdminShell = {
  code: string;
  role: AdminRole;
  nameBn: string;
  roleBn: string;
  readOnly?: boolean;
  fab?: NavSlot;
  nav: NavSlot[];
};
