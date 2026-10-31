/* ============================================================
   src/nav/adminMobile.ts — অ্যাডমিন মোবাইল শেল (মোবাইল-প্রথম · সর্বোচ্চ অগ্রাধিকার)
   উৎস: prototype/assets/app.js → ADMIN_SHELLS (৬টি শেল · প্রতিটি ঠিক ৫ স্লট)।
   একই ANAV/API/নিয়ম, শুধু ৩৯০px-এর UI (D-35)।
   ============================================================ */

import { AlertTriangle, Banknote, BarChart3, Bell, CheckCheck, ClipboardList, FileText, Home, LayoutGrid, Plus, Route, Shield, Users } from 'lucide-react';
import type { AdminRole, AdminShell, NavSlot } from './types';

export const ADMIN_SHELLS: Record<string, AdminShell> = {
  COLLECTOR: {
    code: 'Shell-A', role: 'COLLECTOR' as AdminRole, nameBn: 'মাঠ', roleBn: 'মাঠ সংগ্রহক',
    fab: { key: 'entry', label: 'জমা এন্ট্রি', icon: Plus, to: '#am06', fab: true },
    nav: [
    { key: 'today', label: 'আজকের রুট', icon: Route, to: '#am04' },
    { key: 'dues', label: 'বকেয়া', icon: AlertTriangle, to: '#am12' },
    { key: 'dayclose', label: 'দিনশেষ', icon: Banknote, to: '#am15' },
    { key: 'more', label: 'আরও', icon: LayoutGrid, to: '#s03' },
    ],
  },
  ACCOUNTANT: {
    code: 'Shell-B', role: 'ACCOUNTANT' as AdminRole, nameBn: 'হিসাব', roleBn: 'হিসাবরক্ষক',
    fab: { key: 'entry', label: 'এন্ট্রি', icon: Plus, to: '#am06', fab: true },
    nav: [
    { key: 'home', label: 'হোম', icon: Home, to: '#am01' },
    { key: 'queue', label: 'কিউ', icon: CheckCheck, to: '#am02', badge: 10 },
    { key: 'cash', label: 'ক্যাশ', icon: Banknote, to: '#am15' },
    { key: 'more', label: 'আরও', icon: LayoutGrid, to: '#s03' },
    ],
  },
  MANAGER: {
    code: 'Shell-C', role: 'MANAGER' as AdminRole, nameBn: 'অনুমোদন', roleBn: 'ব্যবস্থাপক',
    fab: { key: 'entry', label: 'দ্রুত এন্ট্রি', icon: Plus, to: '#am06', fab: true },
    nav: [
    { key: 'home', label: 'হোম', icon: Home, to: '#am01' },
    { key: 'approve', label: 'অনুমোদন', icon: CheckCheck, to: '#am02', badge: 10 },
    { key: 'alert', label: 'অ্যালার্ট', icon: Bell, to: '#m16', badge: 3 },
    { key: 'more', label: 'আরও', icon: LayoutGrid, to: '#s03' },
    ],
  },
  APPROVER: {
    code: 'Shell-C', role: 'APPROVER' as AdminRole, nameBn: 'অনুমোদন', roleBn: 'অনুমোদনকারী কর্তৃপক্ষ',
    nav: [
    { key: 'home', label: 'হোম', icon: Home, to: '#am01' },
    { key: 'approve', label: 'অনুমোদন', icon: CheckCheck, to: '#am02', badge: 4 },
    { key: 'member', label: 'সদস্য', icon: Users, to: '#am04' },
    { key: 'alert', label: 'অ্যালার্ট', icon: Bell, to: '#m16', badge: 3 },
    { key: 'more', label: 'আরও', icon: LayoutGrid, to: '#s03' },
    ],
  },
  ORG_ADMIN: {
    code: 'Shell-D', role: 'ORG_ADMIN' as AdminRole, nameBn: 'প্রশাসন', roleBn: 'সমিতি প্রশাসক',
    nav: [
    { key: 'home', label: 'হোম', icon: Home, to: '#am01' },
    { key: 'approve', label: 'অনুমোদন', icon: CheckCheck, to: '#am02', badge: 10 },
    { key: 'control', label: 'নিয়ন্ত্রণ', icon: Shield, to: '#am21', badge: 4 },
    { key: 'staff', label: 'স্টাফ', icon: Users, to: '#am34' },
    { key: 'more', label: 'আরও', icon: LayoutGrid, to: '#s03' },
    ],
  },
  AUDITOR: {
    code: 'Shell-E', role: 'AUDITOR' as AdminRole, nameBn: 'পর্যবেক্ষণ', roleBn: 'নিরীক্ষক (শুধু পঠন)',
    readOnly: true,
    nav: [
    { key: 'summary', label: 'সারাংশ', icon: BarChart3, to: '#am24' },
    { key: 'reports', label: 'রিপোর্ট', icon: FileText, to: '#am25' },
    { key: 'audit', label: 'অডিট লগ', icon: ClipboardList, to: '#am35' },
    { key: 'alert', label: 'অ্যালার্ট', icon: Bell, to: '#m16', badge: 3 },
    { key: 'more', label: 'আরও', icon: LayoutGrid, to: '#s03' },
    ],
  },
};

/* ভূমিকা-এলিয়াস — প্রোটোটাইপে যেভাবে ছিল (পাঠযোগ্য/বাহ্যিক নিরীক্ষক দুজনেই AUDITOR শেল) */
ADMIN_SHELLS.EXTERNAL_AUDITOR = ADMIN_SHELLS.AUDITOR;
ADMIN_SHELLS.VIEWER = ADMIN_SHELLS.AUDITOR;

export const ADMIN_ROLES: AdminRole[] = ['COLLECTOR', 'ACCOUNTANT', 'MANAGER', 'APPROVER', 'ORG_ADMIN', 'AUDITOR'];

/** অজানা/অনুপস্থিত ভূমিকা ⇒ MANAGER শেল (নীরব ডিফল্ট, অনুমান নয়)। */
export function resolveAdminShell(role?: string | null): AdminShell {
  return (role && ADMIN_SHELLS[role]) || ADMIN_SHELLS.MANAGER;
}

/** বটম নেভের ঠিক ৫টি স্লট — FAB থাকলে মাঝের অবস্থানে (৩য় স্লট)। */
export function bottomSlots(shell: AdminShell): NavSlot[] {
  const nav = shell.nav.slice(0, 5);
  if (!shell.fab) return nav;
  return [nav[0], nav[1], shell.fab, ...nav.slice(2)].slice(0, 5);
}
