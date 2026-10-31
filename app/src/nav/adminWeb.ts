/* ============================================================
   src/nav/adminWeb.ts — অ্যাডমিন ওয়েব (আলাদা ডেস্কটপ অভিজ্ঞতা)
   উৎস: prototype/assets/app.js → ANAV (৯ গ্রুপ · ৪৯ আইটেম)।
   D-35: সাইডবারে **সবসময় সম্পূর্ণ ANAV** — ভূমিকা অনুযায়ী ফিল্টার নয়।
   ============================================================ */

import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Banknote, BarChart3, Book, BookOpen, Calendar, CheckCheck, ClipboardList, FileText, Flag, Heart, History, LayoutGrid, Pencil, RefreshCw, Route, Scale, Send, Settings, Shield, Target, Users } from 'lucide-react';
import type { NavGroup } from './types';

export const ADMIN_WEB_NAV: NavGroup[] = [
  {
    group: 'ওভারভিউ',
    items: [
      { key: 'dash', label: 'ড্যাশবোর্ড', icon: LayoutGrid, to: '#a01' },
    ],
  },
  {
    group: 'সঞ্চয় পরিচালনা',
    items: [
      { key: 'scheme', label: 'স্কিম', icon: BookOpen, to: '#a03' },
      { key: 'member', label: 'সদস্য', icon: Users, to: '#a07', badge: 3 },
      { key: 'deposit', label: 'জমা রেকর্ড', icon: ArrowDownToLine, to: '#a17' },
      { key: 'depappr', label: 'জমা অনুমোদন', icon: CheckCheck, to: '#a20', badge: 4 },
      { key: 'wdappr', label: 'উত্তোলন অনুমোদন', icon: ArrowUpFromLine, to: '#a22', badge: 6 },
      { key: 'ledger', label: 'লেনদেন / খতিয়ান', icon: Book, to: '#a25' },
    ],
  },
  {
    group: 'ROSCA চক্র',
    items: [
      { key: 'rcdash', label: 'ROSCA ড্যাশবোর্ড', icon: History, to: '#a39' },
      { key: 'rcscheme', label: 'চক্র স্কিম', icon: BookOpen, to: '#a40' },
      { key: 'rccircle', label: 'সক্রিয় চক্র', icon: Users, to: '#a42', badge: 4 },
      { key: 'rcdraw', label: 'ড্র ক্যালেন্ডার ও ক্রম', icon: Calendar, to: '#a45' },
      { key: 'rccollect', label: 'কিস্তি সংগ্রহ ও বকেয়া', icon: ArrowDownToLine, to: '#a48', badge: 2 },
      { key: 'rcdefault', label: 'ডিফল্ট ও প্রতিস্থাপন', icon: AlertTriangle, to: '#a49', badge: 2, soft: true },
      { key: 'rcreport', label: 'ROSCA রিপোর্ট', icon: BarChart3, to: '#a50' },
    ],
  },
  {
    group: 'যৌথ লক্ষ্য',
    items: [
      { key: 'jgdash', label: 'Joint Goal ড্যাশবোর্ড', icon: Target, to: '#a51' },
      { key: 'jggoal', label: 'লক্ষ্য তালিকা', icon: Flag, to: '#a52', badge: 4 },
      { key: 'jgjoin', label: 'অংশগ্রহণ ও যোগদান', icon: Users, to: '#a55', badge: 3 },
      { key: 'jgcollect', label: 'অবদান সংগ্রহ ও বকেয়া', icon: ArrowDownToLine, to: '#a56', badge: 4, soft: true },
      { key: 'jgmile', label: 'মাইলস্টোন ও অগ্রগতি', icon: BarChart3, to: '#a57' },
      { key: 'jgspend', label: 'অর্থ ব্যবহার ও নিষ্পত্তি', icon: Banknote, to: '#a58', badge: 2 },
      { key: 'jgreport', label: 'Joint Goal রিপোর্ট', icon: Book, to: '#a60' },
    ],
  },
  {
    group: 'কর্জে হাসানা',
    items: [
      { key: 'qhdash', label: 'QH ড্যাশবোর্ড', icon: Heart, to: '#a61' },
      { key: 'qhproduct', label: 'পণ্য ও যোগ্যতা নিয়ম', icon: BookOpen, to: '#a62' },
      { key: 'qhsim', label: 'নিয়ম Simulation ⚠️D-57', icon: BarChart3, to: '#a64' },
      { key: 'qhelig', label: 'যোগ্য সদস্য তালিকা', icon: Users, to: '#a65', badge: 4 },
      { key: 'qhwindow', label: 'জানালা ও কোটা ⚠️D-51', icon: Calendar, to: '#a66' },
      { key: 'qhqueue', label: 'আবেদন কিউ ও সিদ্ধান্ত', icon: FileText, to: '#a67', badge: 3 },
      { key: 'qhdisb', label: 'বিতরণ (maker ≠ checker)', icon: Banknote, to: '#a70', badge: 1 },
      { key: 'qhloan', label: 'ঋণ, ছক ও পরিশোধ', icon: Scale, to: '#a72', badge: 5 },
      { key: 'qharrears', label: 'বকেয়া ও write-off', icon: AlertTriangle, to: '#a74', badge: 2, soft: true },
      { key: 'qhreport', label: 'QH রিপোর্ট ও সমাপ্তি', icon: Book, to: '#a77' },
    ],
  },
  {
    group: 'মাঠ সংগ্রহ',
    items: [
      { key: 'route', label: 'আজকের রুট (সংগ্রহক)', icon: Route, to: '#a02' },
      { key: 'plan', label: 'সংগ্রহ পরিকল্পনা', icon: Target, to: '#a32' },
      { key: 'batch', label: 'বাল্ক জমা ও ইমপোর্ট', icon: LayoutGrid, to: '#a18' },
    ],
  },
  {
    group: 'নিয়ন্ত্রণ',
    items: [
      { key: 'dues', label: 'বকেয়া রেজিস্টার', icon: AlertTriangle, to: '#a31', badge: 23, soft: true },
      { key: 'cash', label: 'ক্যাশ বুক ও দিন সমাপ্তি', icon: Banknote, to: '#a28', badge: 1, soft: true },
      { key: 'transfer', label: 'তহবিল স্থানান্তর', icon: RefreshCw, to: '#a29' },
      { key: 'recon', label: 'রিকনসিলিয়েশন', icon: Scale, to: '#a30', badge: 4, soft: true },
      { key: 'txn', label: 'লেনদেন বিবরণ / অডিট', icon: ClipboardList, to: '#a26' },
      { key: 'corr', label: 'সংশোধন ও রিভার্সাল', icon: Pencil, to: '#a27', badge: 1, soft: true },
    ],
  },
  {
    group: 'সদস্য ও দাবি',
    items: [
      { key: 'status', label: 'অবস্থা পরিবর্তন', icon: Flag, to: '#a12' },
      { key: 'claim', label: 'নমিনি ও মৃত্যু দাবি', icon: Heart, to: '#a14', badge: 2, soft: true },
      { key: 'mv', label: 'সদস্য স্থানান্তর', icon: Route, to: '#a16' },
      { key: 'remind', label: 'রিমাইন্ডার শিডিউল', icon: Send, to: '#a33' },
    ],
  },
  {
    group: 'ব্যবস্থাপনা',
    items: [
      { key: 'reports', label: 'রিপোর্ট কেন্দ্র', icon: BarChart3, to: '#a34' },
      { key: 'fin', label: 'আর্থিক বিবরণ ও রিটার্ন', icon: Book, to: '#a35' },
      { key: 'staff', label: 'স্টাফ ও পারমিশন', icon: Shield, to: '#a37', badge: 2, soft: true },
      { key: 'settings', label: 'সেটিংস', icon: Settings, to: '#a36' },
      { key: 'audit', label: 'অডিট লগ', icon: ClipboardList, to: '#a38' },
    ],
  },
];

export const ADMIN_WEB_ITEM_COUNT = ADMIN_WEB_NAV.reduce((n, g) => n + g.items.length, 0);
