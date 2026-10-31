/* ============================================================
   src/domain/joint.ts — যৌথ লক্ষ্য (Joint Goal) মডিউল
   নিয়ম: অবদান লক্ষ্য-নির্দিষ্ট তহবিলে যায়, ব্যক্তিগত উত্তোলন নেই (BR-19);
   লক্ষ্য পূরণের পর কমিটির সিদ্ধান্ত + প্রমাণসহ ব্যবহার (D-50)।
   ব্যক্তিগত সঞ্চয়ের মোটে যোগ হয় না (D-37)।
   ============================================================ */

export type JgStatus = 'forming' | 'active' | 'achieved' | 'settling' | 'closed';
export type JgRule = 'fixed' | 'flexible';
export type JgChannel = 'collector' | 'office' | 'bkash' | 'cash' | 'bank';

export type JgGoal = {
  id: string;
  code: string;
  name: string;
  desc: string;
  status: JgStatus;
  target: number;
  monthly?: number;
  min?: number;
  max?: number;
  rule: JgRule;
  targetDate: string;
  join: 'open' | 'invite';
  maxParts: number;
  use: string[];
  deadlinePolicy: string[];
  committee: string;
  note?: string;
  settledOn?: string;
};

export type JgPart = {
  goalId: string;
  memberId: string;
  name: string;
  pledged: number;
  status: 'active' | 'invited' | 'behind';
  isMe?: boolean;
};

export type JgContrib = {
  id: string;
  goalId: string;
  memberId: string;
  amount: number;
  at: string;
  channel: JgChannel;
  receipt: string;
  txn: string;
  by: string;
  note?: string;
};

export type JgDisb = {
  id: string;
  goalId: string;
  no: string;
  at: string;
  purpose: string;
  payee: string;
  amount: number;
  channel: JgChannel;
  status: 'paid' | 'pending' | 'approved';
  evidence: string[];
  committee: string;
  decision: string;
  by: string;
  appr?: string;
  hash?: string;
  note?: string;
};

export const JG_ME = 'me';

export const SEED_GOALS: JgGoal[] = [
  {
    id: 'jg01',
    code: 'JG-2026-০১',
    name: 'সেচ পাম্প ও পাইপ',
    desc: 'কেশবপুর গ্রামের ৮ জন কৃষক মিলে একটি সেচ পাম্প ও পাইপ কিনবেন — বোরো মৌসুমের আগে।',
    status: 'active',
    target: 60000,
    monthly: 1500,
    rule: 'fixed',
    targetDate: '৩১ জানুয়ারি ২০২৭',
    join: 'invite',
    maxParts: 10,
    use: ['সেচ যন্ত্রপাতি', 'ইনস্টলেশন'],
    deadlinePolicy: ['মেয়াদ একবার বাড়ানো', 'আনুপাতিক ফেরত'],
    committee: 'কমিটি-৩ (কৃষি উপ-কমিটি)',
  },
  {
    id: 'jg02',
    code: 'JG-2026-০৪',
    name: 'বাজার ঘরের ছাদ মেরামত',
    desc: 'স্থানীয় বাজার ঘরের টিনের ছাদ বদলানোর যৌথ উদ্যোগ — যে কেউ যোগ দিতে পারেন।',
    status: 'forming',
    target: 120000,
    min: 500,
    max: 3000,
    rule: 'flexible',
    targetDate: '৩১ মার্চ ২০২৭',
    join: 'open',
    maxParts: 15,
    use: ['নির্মাণ সামগ্রী'],
    deadlinePolicy: ['মেয়াদ একবার বাড়ানো', 'আনুপাতিক ফেরত'],
    committee: 'কমিটি-১ (অবকাঠামো)',
  },
  {
    id: 'jg03',
    code: 'JG-2025-০৯',
    name: 'শীতবস্ত্র বিতরণ',
    desc: 'শীতকালে ১০০টি কম্বল বিতরণের লক্ষ্য — সফলভাবে সম্পন্ন ও ব্যবহারের প্রমাণসহ নিষ্পত্তি।',
    status: 'achieved',
    target: 48000,
    monthly: 800,
    rule: 'fixed',
    targetDate: '৩০ নভেম্বর ২০২৬',
    join: 'invite',
    maxParts: 10,
    use: ['সমাজসেবা'],
    deadlinePolicy: ['মেয়াদ একবার বাড়ানো', 'আনুপাতিক ফেরত'],
    committee: 'কমিটি-২ (সমাজকল্যাণ)',
    note: 'লক্ষ্য পূরণ হয়েছে — ভাউচার ও প্রমাণ সংরক্ষিত আছে।',
    settledOn: '২০ অক্টোবর ২০২৬',
  },
];

export const SEED_PARTS: JgPart[] = [
  { goalId: 'jg01', memberId: 'me', name: 'সাবিনা ইয়াসমিন', pledged: 1500, status: 'active', isMe: true },
  { goalId: 'jg01', memberId: 'm2', name: 'মিলন হোসেন', pledged: 1500, status: 'active' },
  { goalId: 'jg01', memberId: 'm3', name: 'নাজমুল হক', pledged: 1800, status: 'active' },
  { goalId: 'jg01', memberId: 'm4', name: 'রাশেদা খাতুন', pledged: 1200, status: 'behind' },
  { goalId: 'jg01', memberId: 'm5', name: 'তানভীর আহমেদ', pledged: 1500, status: 'active' },
  { goalId: 'jg01', memberId: 'm6', name: 'সালমা বেগম', pledged: 900, status: 'active' },
  { goalId: 'jg02', memberId: 'me', name: 'সাবিনা ইয়াসমিন', pledged: 0, status: 'invited', isMe: true },
  { goalId: 'jg02', memberId: 'm7', name: 'রফিকুল ইসলাম', pledged: 1500, status: 'active' },
  { goalId: 'jg03', memberId: 'me', name: 'সাবিনা ইয়াসমিন', pledged: 800, status: 'active', isMe: true },
  { goalId: 'jg03', memberId: 'm2', name: 'মিলন হোসেন', pledged: 800, status: 'active' },
  { goalId: 'jg03', memberId: 'm5', name: 'তানভীর আহমেদ', pledged: 1000, status: 'active' },
];

export const SEED_CONTRIBS: JgContrib[] = [
  { id: 'jg-c1', goalId: 'jg01', memberId: 'me', amount: 1500, at: '০৫ অক্টোবর ২০২৬', channel: 'collector', receipt: 'JGR-৫৫১২', txn: 'TXN-JG-৫৫১২', by: 'রাজু আহমেদ' },
  { id: 'jg-c2', goalId: 'jg01', memberId: 'me', amount: 1500, at: '০৫ সেপ্টেম্বর ২০২৬', channel: 'office', receipt: 'JGR-৫৪০১', txn: 'TXN-JG-৫৪০১', by: 'কাউন্টার-২' },
  { id: 'jg-c3', goalId: 'jg01', memberId: 'me', amount: 1500, at: '০৫ আগস্ট ২০২৬', channel: 'bkash', receipt: 'JGR-৫২৮৮', txn: 'TXN-JG-৫২৮৮', by: 'স্বয়ংক্রিয় যাচাই' },
  { id: 'jg-c4', goalId: 'jg01', memberId: 'me', amount: 1500, at: '০৫ জুলাই ২০২৬', channel: 'collector', receipt: 'JGR-৫১৭০', txn: 'TXN-JG-৫১৭০', by: 'রাজু আহমেদ' },
  { id: 'jg-c5', goalId: 'jg01', memberId: 'm2', amount: 1500, at: '০৫ অক্টোবর ২০২৬', channel: 'collector', receipt: 'JGR-৫৫১৩', txn: 'TXN-JG-৫৫১৩', by: 'রাজু আহমেদ' },
  { id: 'jg-c6', goalId: 'jg03', memberId: 'me', amount: 800, at: '০৫ সেপ্টেম্বর ২০২৬', channel: 'office', receipt: 'JGR-৪৯০৭', txn: 'TXN-JG-৪৯০৭', by: 'কাউন্টার-২' },
  { id: 'jg-c7', goalId: 'jg03', memberId: 'me', amount: 4800, at: '০৫ আগস্ট ২০২৬', channel: 'collector', receipt: 'JGR-৪৮১২', txn: 'TXN-JG-৪৮১২', by: 'রাজু আহমেদ', note: 'ছয় মাসের সমন্বিত অবদান' },
];

export const SEED_DISB: JgDisb[] = [
  {
    id: 'jg-d1',
    goalId: 'jg03',
    no: 'JGV-২০২৬-০১৭',
    at: '২০ অক্টোবর ২০২৬',
    purpose: '১০০টি কম্বল ক্রয়',
    payee: 'মেসার্স নিউ ট্রেডার্স, খুলনা',
    amount: 44000,
    channel: 'bank',
    status: 'paid',
    evidence: ['চালান-২০২৬-০১৭.pdf', 'কম্বল হস্তান্তর ছবি (৩টি)'],
    committee: 'কমিটি-২ (সমাজকল্যাণ)',
    decision: 'সভা-২০২৬/১০ — সর্বসম্মত',
    by: 'মিলন হোসেন',
    appr: 'কাজী নুরুন্নবী',
    hash: '0x9f4c2a',
  },
  {
    id: 'jg-d2',
    goalId: 'jg03',
    no: 'JGV-২০২৬-০১৮',
    at: '২২ অক্টোবর ২০২৬',
    purpose: 'পরিবহন ও বিতরণ খরচ',
    payee: 'স্থানীয় পরিবহন',
    amount: 1500,
    channel: 'cash',
    status: 'pending',
    evidence: [],
    committee: 'কমিটি-২ (সমাজকল্যাণ)',
    decision: 'সভা-২০২৬/১০ — অনুমোদনের অপেক্ষায়',
    by: 'সালমা বেগম',
    note: 'প্রমাণ (ভাড়ার রসিদ) সংযুক্ত হলেই অনুমোদন হবে — BR-19 / D-50।',
  },
];

/* ------------------------- গণনা ------------------------- */

export const goalById = (goals: JgGoal[], id?: string) => goals.find((g) => g.id === id);
export const partsOf = (parts: JgPart[], goalId: string) => parts.filter((p) => p.goalId === goalId);
export const myPart = (parts: JgPart[], goalId: string) => parts.find((p) => p.goalId === goalId && p.isMe);
export const contribsOf = (contribs: JgContrib[], goalId: string) => contribs.filter((c) => c.goalId === goalId);
export const myContribs = (contribs: JgContrib[], goalId: string) => contribs.filter((c) => c.goalId === goalId && c.memberId === JG_ME);
export const collected = (contribs: JgContrib[], goalId: string) => contribsOf(contribs, goalId).reduce((s, c) => s + c.amount, 0);
export const pct = (contribs: JgContrib[], g: JgGoal) => Math.min(100, Math.round((collected(contribs, g.id) / g.target) * 100));
export const pledgeTotal = (parts: JgPart[], goalId: string) => partsOf(parts, goalId).reduce((s, p) => s + p.pledged, 0);
export const myPaid = (contribs: JgContrib[], goalId: string) => myContribs(contribs, goalId).reduce((s, c) => s + c.amount, 0);
export const myGap = (parts: JgPart[], g: JgGoal) => {
  const p = myPart(parts, g.id);
  return p && p.pledged ? Math.max(0, p.pledged - myPaid(SEED_CONTRIBS, g.id)) : 0;
};
export const disbOf = (list: JgDisb[], goalId: string) => list.filter((d) => d.goalId === goalId);
export const paidOut = (list: JgDisb[], goalId: string) =>
  disbOf(list, goalId).filter((d) => d.status === 'paid').reduce((s, d) => s + d.amount, 0);
export const milestones = [{ pct: 25 }, { pct: 50 }, { pct: 75 }, { pct: 100 }];
export const channelLabel = (c: JgChannel) =>
  c === 'collector' ? 'মাঠ সংগ্রহ'
    : c === 'office' ? 'অফিস কাউন্টার'
    : c === 'bkash' ? 'বিকাশ / ওয়ালেট'
    : c === 'bank' ? 'ব্যাংক'
    : 'নগদ';
export const goalChannel = (c: JgChannel) => channelLabel(c);
