/* ============================================================
   src/demo/data.ts — ফেজ ৩-এর পর্দার জন্য **ডেমো ডেটা**
   ⚠️ এটি বাস্তব ডেটা নয়। কোনো API/ডেটাবেস সংযোগ এখনো নেই (ফেজ ৬)।
   নিয়ম:
     • কোনো সুদ/মুনাফা/শতাংশ ফিল্ড নেই (নীতি D-01) — d06 টেস্ট যাচাই করে
     • সব অঙ্ক বাংলা অঙ্কে দেখানো হয় (lib/bn)
     • UI-তে সর্বদা "ডেমো" ব্যাজ থাকে, যাতে কেউ বাস্তব তথ্য ভাবতে না পারে
   ============================================================ */

export type DemoTxn = {
  id: string;
  date: string;
  title: string;
  /** 'deposit' | 'withdraw' | 'fine' | 'adjustment' */
  kind: 'deposit' | 'withdraw' | 'fine' | 'adjustment';
  amount: number;
  mode: 'নগদ' | 'বিকাশ' | 'ব্যাংক';
  receipt: string;
};

export type DemoApproval = {
  id: string;
  member: string;
  kind: 'জমা' | 'উত্তোলন' | 'সদস্য ভর্তি' | 'সংশোধন';
  amount: number | null;
  submitted: string;
  by: string;
};

export const DEMO_WATERMARK = 'ডেমো ডেটা — বাস্তব নয়';

export const member = {
  name: 'রহিমা বেগম',
  memberNo: 'M-০০১২৩',
  phone: '০১৭১২-৩৪৫৬৭৮',
  org: 'শাপলা সমবায় সমিতি',
  since: 'জুন ২০২৪',
  status: 'সক্রিয়' as const,
};

export const savingsAccount = {
  planName: 'মাসিক সঞ্চয় স্কিম',
  balance: 24500,
  installment: 1000,
  paid: 8,
  total: 12,
  nextDue: '৫ নভেম্বর',
  frequency: 'মাসিক',
};

export const transactions: DemoTxn[] = [
  { id: 't1', date: '০৫ অক্টো ২০২৬', title: 'অক্টোবর কিস্তি', kind: 'deposit', amount: 1000, mode: 'নগদ', receipt: 'RCP-১০২৪' },
  { id: 't2', date: '০৫ সেপ্টে ২০২৬', title: 'সেপ্টেম্বর কিস্তি', kind: 'deposit', amount: 1000, mode: 'বিকাশ', receipt: 'RCP-১০১১' },
  { id: 't3', date: '১২ আগস্ট ২০২৬', title: 'আংশিক উত্তোলন', kind: 'withdraw', amount: 2000, mode: 'ব্যাংক', receipt: 'RCP-৯৯৪' },
  { id: 't4', date: '০৫ আগস্ট ২০২৬', title: 'আগস্ট কিস্তি', kind: 'deposit', amount: 1000, mode: 'নগদ', receipt: 'RCP-৯৮৭' },
  { id: 't5', date: '১০ জুলাই ২০২৬', title: 'বিলম্ব ফি', kind: 'fine', amount: 50, mode: 'নগদ', receipt: 'RCP-৯৭১' },
  { id: 't6', date: '০৫ জুলাই ২০২৬', title: 'জুলাই কিস্তি', kind: 'deposit', amount: 1000, mode: 'নগদ', receipt: 'RCP-৯৬৫' },
];

export const approvals: DemoApproval[] = [
  { id: 'a1', member: 'সাবিনা আক্তার', kind: 'জমা', amount: 3000, submitted: 'আজ ১০:২৪', by: 'সংগ্রহক · করিম' },
  { id: 'a2', member: 'মোঃ জসিম উদ্দিন', kind: 'উত্তোলন', amount: 5000, submitted: 'আজ ০৯:৪১', by: 'সদস্য অ্যাপ' },
  { id: 'a3', member: 'নাসরিন সুলতানা', kind: 'সদস্য ভর্তি', amount: null, submitted: 'গতকাল ১৬:০৫', by: 'শাখা · খুলনা' },
  { id: 'a4', member: 'আব্দুল হালিম', kind: 'সংশোধন', amount: 500, submitted: 'গতকাল ১১:১২', by: 'হিসাবরক্ষক' },
];

export const adminKpis = {
  members: 428,
  todayCollection: 46500,
  pendingApprovals: 4,
  cashInHand: 128400,
};

export const recentCollections = [
  { id: 'c1', member: 'সাবিনা আক্তার', amount: 3000, mode: 'নগদ', time: '১০:২৪', collector: 'করিম' },
  { id: 'c2', member: 'রহিমা বেগম', amount: 1000, mode: 'বিকাশ', time: '১০:০২', collector: 'করিম' },
  { id: 'c3', member: 'জসিম উদ্দিন', amount: 2000, mode: 'নগদ', time: '০৯:৪৮', collector: 'সুমন' },
  { id: 'c4', member: 'নাসরিন সুলতানা', amount: 1500, mode: 'নগদ', time: '০৯:৩০', collector: 'সুমন' },
];
