/* ============================================================
   src/domain/adminJoint.ts — যৌথ লক্ষ্য (মডিউল ৩) · অ্যাডমিন মোবাইল
   JAM-01…JAM-10 · ডেস্কটপ JA-01…JA-10 এর সমতুল্য।
   নিয়ম: ব্যক্তিগত উত্তোলন নেই (BR-19) · প্রমাণ ছাড়া বিতরণ নয় (D-50) ·
   মালিকানা = নির্দিষ্ট-উদ্দেশ্য দায় (D-39) · লক্ষ্য-সীমা ৫ (D-43)।
   সব অঙ্ক টাকায় (ডেমো)।
   ============================================================ */

export { DEMO_EXTRA } from './adminRosca';

export type JStatus = 'forming' | 'active' | 'achieved' | 'expired' | 'settling' | 'closed';
export type JCrule = 'fixed' | 'flexible';
export type JPartStatus = 'invited' | 'pending' | 'active' | 'behind' | 'removed';
export type JDisbStatus = 'planned' | 'approval' | 'paid' | 'blocked';
export type JDecision = 'extend' | 'refund' | 'to_gs' | 'cancel';

export type JGoal = {
  id: string; code: string; name: string; desc: string; target: number; targetDate: string; start: string;
  payDay: number; crule: JCrule; min: number | null; max: number | null; monthly: number | null; monthlyMin: number;
  join: 'invited' | 'open'; maxParts: number; needApproval: boolean; ownership: 'earmarked' | 'joint' | 'trust';
  deadlinePolicy: JDecision[]; use: ('vendor' | 'committee' | 'member_hand' | 'assembly')[];
  status: JStatus; version: number; createdBy: string; createdAt: string; owner: string; branch: string;
  committee: string; publish: boolean; note: string;
  settleDecision?: JDecision; settleBy?: string; settleAppr?: string | null; settledOn?: string;
};
export type JPart = {
  goal: string; memberId: string; pledged: number; paid: number; install: number;
  joinedAt: string | null; status: JPartStatus; approvedBy: string | null;
  step?: 'notice' | 'committee' | 'remove'; noticeSent?: string; extra?: { at: string; amt: number; note?: string }[];
  invitedAt?: string; channel?: 'sms' | 'call';
};
export type JContrib = {
  goal: string; memberId: string; amount: number; at: string; receipt: string;
  channel: 'cash_office' | 'bkash' | 'bank'; by: string; txn: string; note?: string;
};
export type JDisb = {
  id: string; goal: string; no: string; purpose: string; payee: string; amount: number; at: string;
  status: JDisbStatus; channel: 'cash_office' | 'bkash' | 'bank'; committee: string; decision: string;
  by: string | null; appr: string | null; evidence: string[]; hash?: string; note: string;
};

export const JG_LIMIT = 5;
export const JG_MS = [25, 50, 75, 100];
export const TODAY_ISO = '2026-10-31';

export const JG_STATUS: Record<JStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'purple' }> = {
  forming: { t: 'যোগদান চলছে', tone: 'info' },
  active: { t: 'চলমান', tone: 'purple' },
  achieved: { t: 'লক্ষ্য পূরণ', tone: 'ok' },
  expired: { t: 'মেয়াদোত্তীর্ণ (D-39)', tone: 'danger' },
  settling: { t: 'নিষ্পত্তি চলছে', tone: 'warn' },
  closed: { t: 'সমাপ্ত ও নিষ্পত্তি', tone: 'neutral' },
};
export const JG_CRULE: Record<JCrule, string> = { fixed: 'নির্দিষ্ট অঙ্ক (মাসিক)', flexible: 'নমনীয় (সীমার ভেতরে)' };
export const JG_PART_ST: Record<JPartStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  invited: { t: 'আমন্ত্রিত · উত্তরের অপেক্ষায়', tone: 'neutral' },
  pending: { t: 'যোগদান অনুমোদনের অপেক্ষায় (D-49)', tone: 'warn' },
  active: { t: 'সক্রিয় অংশগ্রহণ', tone: 'ok' },
  behind: { t: 'অবদানে পেছনে', tone: 'warn' },
  removed: { t: 'বাদ দেওয়া (কারণসহ)', tone: 'danger' },
};
export const JG_DISB_ST: Record<JDisbStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }> = {
  planned: { t: 'পরিকল্পিত', tone: 'neutral' },
  approval: { t: 'অনুমোদনের অপেক্ষায়', tone: 'warn' },
  paid: { t: 'পরিশোধিত · প্রমাণসহ', tone: 'ok' },
  blocked: { t: 'প্রমাণ ছাড়াই আটকে', tone: 'danger' },
};
export const JG_OWN: [JGoal['ownership'], string][] = [
  ['earmarked', 'সমিতির নির্দিষ্ট-উদ্দেশ্য তহবিল (ডিফল্ট)'],
  ['joint', 'সদস্যদের যৌথ দাবি — অবিভাজ্য'],
  ['trust', 'আস্থারত তহবিল (ট্রাস্ট-সদৃশ খাত)'],
];
export const JG_DEADLINE: [JDecision, string][] = [
  ['extend', 'মেয়াদ একবার বাড়ানো (ডিফল্ট)'],
  ['refund', 'আনুপাতিক ফেরত (অবদান অনুযায়ী)'],
  ['to_gs', 'সাধারণ সঞ্চয় অ্যাকাউন্টে রূপান্তর'],
  ['cancel', 'বাতিল — কমিটির লিখিত সিদ্ধান্তসহ'],
];
export const JG_USE: ['vendor' | 'committee' | 'member_hand' | 'assembly', string][] = [
  ['vendor', 'ভেন্ডর পেমেন্ট (অগ্রাধিকার)'],
  ['committee', 'কমিটির লিখিত সিদ্ধান্ত অনুযায়ী খরচ'],
  ['member_hand', 'দায়িত্বপ্রাপ্ত সদস্যের হাতে — প্রমাণ বাধ্যতামূলক'],
  ['assembly', 'সাধারণ সভার অনুমোদনসহ'],
];
export const JG_STEP: ['notice' | 'committee' | 'remove', string][] = [
  ['notice', 'ধাপ ১ · অনুস্মারক নোটিশ (SMS/কাগজ)'],
  ['committee', 'ধাপ ২ · কমিটির কাছে প্রতিবেদন'],
  ['remove', 'ধাপ ৩ · অংশগ্রহণ বাতিল (কারণ লিপিবদ্ধ)'],
];
export const JG_SETTLE: string[] = [
  'ধাপ ১ · অগ্রগতি পর্যালোচনা',
  'ধাপ ২ · কমিটির লিখিত সিদ্ধান্ত (D-39)',
  'ধাপ ৩ · অনুমোদন (maker ≠ checker)',
  'ধাপ ৪ · ফেরত/রূপান্তর সম্পাদন + রসিদ',
];
export const jgLabel = <T extends string>(arr: [T, string][], k?: T | null) => (k ? arr.find((x) => x[0] === k)?.[1] ?? k : '—');
export const jgStepLabel = (k?: string) => jgLabel(JG_STEP, k as 'notice');

export const SEED_JGOALS: JGoal[] = [
  { id: 'jg01', code: 'JG-2605-01', name: 'মসজিদ সংস্কার ও ছাদ মেরামত',
    desc: 'কেশবপুর কেন্দ্রীয় জামে মসজিদের ছাদ, ওজুখানা ও বৈদ্যুতিক লাইন সংস্কার। খরচ ভেন্ডরের মাধ্যমে সরাসরি পরিশোধ হবে।',
    target: 200000, targetDate: '2026-12-31', start: '2026-05-05', payDay: 5,
    crule: 'flexible', min: 500, max: 10000, monthly: null, monthlyMin: 1000, join: 'invited', maxParts: 10,
    needApproval: true, ownership: 'earmarked', deadlinePolicy: ['extend', 'refund'], use: ['vendor', 'committee'],
    status: 'active', version: 2, createdBy: 'মোঃ আব্দুল্লাহ', createdAt: '2026-04-28', owner: 'মোঃ আব্দুল্লাহ',
    branch: 'কেশবপুর শাখা', committee: 'CM-2604-06', publish: true,
    note: 'লক্ষ্য অঙ্ক কমানো যাবে না; বাড়ানো হলে নতুন সংস্করণ ও কমিটির সিদ্ধান্ত লাগবে (D-49)' },
  { id: 'jg02', code: 'JG-2606-02', name: 'গভীর নলকূপ ও পানি সরবরাহ',
    desc: 'সুফলাকাটি গ্রামে ২টি গভীর নলকূপ স্থাপন ও পানির লাইন সংযোগ — নিরাপদ পানির সুবিধা সবার জন্য।',
    target: 80000, targetDate: '2026-11-30', start: '2026-06-05', payDay: 5,
    crule: 'fixed', min: null, max: null, monthly: 2000, monthlyMin: 2000, join: 'open', maxParts: 12,
    needApproval: true, ownership: 'earmarked', deadlinePolicy: ['extend', 'refund'], use: ['vendor'],
    status: 'achieved', version: 1, createdBy: 'নাসরিন আক্তার', createdAt: '2026-05-20', owner: 'নাসরিন আক্তার',
    branch: 'কেশবপুর শাখা', committee: 'CM-2605-02', publish: true,
    note: 'লক্ষ্য পূরণ হয়েছে; বিতরণ চলছে — প্রমাণ ছাড়া কোনো খরচ হবে না (BR-19)' },
  { id: 'jg03', code: 'JG-2602-03', name: 'ঈদ সামগ্রী ও ইফতার বিতরণ',
    desc: 'ঈদ-উল-ফিতর উপলক্ষে ৪০টি পরিবারের জন্য পণ্য ক্রয় ও ইফতার আয়োজন। মেয়াদ শেষে অর্জিত হয়নি।',
    target: 60000, targetDate: '2026-06-15', start: '2026-02-05', payDay: 5,
    crule: 'fixed', min: null, max: null, monthly: 1000, monthlyMin: 1000, join: 'invited', maxParts: 10,
    needApproval: true, ownership: 'joint', deadlinePolicy: ['refund'], use: ['vendor', 'member_hand'],
    status: 'settling', version: 1, createdBy: 'মোঃ আব্দুল্লাহ', createdAt: '2026-01-22', owner: 'মোঃ আব্দুল্লাহ',
    branch: 'কেশবপুর শাখা', committee: 'CM-2607-02', settleDecision: 'refund', settleBy: 'সুমি রানী দাস',
    settleAppr: null, publish: true,
    note: 'মেয়াদোত্তীর্ণ: কমিটি আনুপাতিক ফেরতের সিদ্ধান্ত দিয়েছে (CM-2607-02) — অনুমোদনের অপেক্ষায়' },
  { id: 'jg04', code: 'JG-2610-04', name: 'সদস্য মিলনায়তন নির্মাণ',
    desc: 'সমিতির নিজস্ব জমিতে একতলা মিলনায়তন — সভা, প্রশিক্ষণ ও বিপদের সময় আশ্রয়কেন্দ্র হিসেবে ব্যবহার হবে।',
    target: 500000, targetDate: '2027-06-30', start: '2026-10-05', payDay: 5,
    crule: 'flexible', min: 1000, max: 20000, monthly: null, monthlyMin: 1000, join: 'invited', maxParts: 20,
    needApproval: true, ownership: 'earmarked', deadlinePolicy: ['extend', 'to_gs', 'refund'], use: ['vendor', 'assembly'],
    status: 'forming', version: 1, createdBy: 'কামরুল হাসান', createdAt: '2026-09-30', owner: 'কামরুল হাসান',
    branch: 'কেশবপুর শাখা', committee: 'CM-2609-01', publish: true,
    note: 'আমন্ত্রণ পাঠানো হয়েছে; যোগদানে Admin অনুমোদন বাধ্যতামূলক (D-49)' },
  { id: 'jg05', code: 'JG-2511-05', name: 'শিক্ষা কেন্দ্রের কম্পিউটার ক্রয়',
    desc: 'সদস্যদের সন্তানদের জন্য ৫টি কম্পিউটার ও ইন্টারনেট সংযোগ — বিদ্যানন্দকাঠি শিক্ষা কেন্দ্রে স্থাপিত।',
    target: 50000, targetDate: '2026-03-31', start: '2025-11-05', payDay: 5,
    crule: 'fixed', min: null, max: null, monthly: 1000, monthlyMin: 1000, join: 'open', maxParts: 10,
    needApproval: true, ownership: 'earmarked', deadlinePolicy: ['extend', 'refund'], use: ['vendor'],
    status: 'closed', version: 1, createdBy: 'মোঃ আব্দুল্লাহ', createdAt: '2025-10-18', owner: 'মোঃ আব্দুল্লাহ',
    branch: 'কেশবপুর শাখা', committee: 'CM-2602-01', settledOn: '2026-03-15', publish: true,
    note: 'লক্ষ্য পূরণ ও সম্পূর্ণ বিতরণ নিষ্পত্তি হয়েছে — রেকর্ড অপরিবর্তনীয়ভাবে সংরক্ষিত' },
];

export const SEED_JPARTS: JPart[] = [
  { goal: 'jg01', memberId: 'm1', pledged: 6000, paid: 4500, install: 1500, joinedAt: '2026-05-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg01', memberId: 'm2', pledged: 30000, paid: 27000, install: 5000, joinedAt: '2026-05-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg01', memberId: 'm3', pledged: 25000, paid: 25000, install: 5000, joinedAt: '2026-05-06', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg01', memberId: 'm4', pledged: 40000, paid: 32000, install: 8000, joinedAt: '2026-05-06', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg01', memberId: 'm5', pledged: 20000, paid: 20000, install: 5000, joinedAt: '2026-05-08', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg01', memberId: 'm6', pledged: 35000, paid: 18000, install: 3000, joinedAt: '2026-05-08', status: 'behind', approvedBy: 'মোঃ আব্দুল্লাহ', step: 'notice', noticeSent: '2026-10-06' },
  { goal: 'jg01', memberId: 'm7', pledged: 24000, paid: 9500, install: 2500, joinedAt: '2026-05-10', status: 'behind', approvedBy: 'মোঃ আব্দুল্লাহ', step: 'committee', noticeSent: '2026-09-05' },
  { goal: 'jg01', memberId: 'm8', pledged: 20000, paid: 0, install: 2500, joinedAt: '2026-05-12', status: 'behind', approvedBy: 'নাসরিন আক্তার', step: 'notice', noticeSent: '2026-10-06' },

  { goal: 'jg02', memberId: 'm1', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-02', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm2', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-02', status: 'active', approvedBy: 'নাসরিন আক্তার', extra: [{ at: '2026-10-12', amt: 1000, note: 'এককালীন অনুমতি (D-49)' }] },
  { goal: 'jg02', memberId: 'm3', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-03', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm4', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-03', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm5', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-04', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm6', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-04', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm7', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-05', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm8', pledged: 10000, paid: 10000, install: 2000, joinedAt: '2026-06-05', status: 'active', approvedBy: 'নাসরিন আক্তার' },

  { goal: 'jg03', memberId: 'm1', pledged: 5000, paid: 4000, install: 1000, joinedAt: '2026-02-05', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg03', memberId: 'm2', pledged: 5000, paid: 4000, install: 1000, joinedAt: '2026-02-05', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg03', memberId: 'm3', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2026-02-06', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg03', memberId: 'm4', pledged: 5000, paid: 4000, install: 1000, joinedAt: '2026-02-06', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg03', memberId: 'm5', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2026-02-07', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg03', memberId: 'm6', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2026-02-07', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg03', memberId: 'm7', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2026-02-08', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg03', memberId: 'm8', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2026-02-08', status: 'active', approvedBy: 'নাসরিন আক্তার' },

  { goal: 'jg04', memberId: 'm1', pledged: 20000, paid: 0, install: 1000, joinedAt: '2026-10-05', status: 'pending', approvedBy: null },
  { goal: 'jg04', memberId: 'm2', pledged: 10000, paid: 0, install: 1000, joinedAt: '2026-10-08', status: 'pending', approvedBy: null },
  { goal: 'jg04', memberId: 'm4', pledged: 60000, paid: 0, install: 1000, joinedAt: '2026-10-11', status: 'pending', approvedBy: null },
  { goal: 'jg04', memberId: 'm6', pledged: 0, paid: 0, install: 0, joinedAt: null, status: 'invited', approvedBy: null, invitedAt: '2026-10-02', channel: 'sms' },
  { goal: 'jg04', memberId: 'm7', pledged: 0, paid: 0, install: 0, joinedAt: null, status: 'invited', approvedBy: null, invitedAt: '2026-10-02', channel: 'sms' },
  { goal: 'jg04', memberId: 'm8', pledged: 0, paid: 0, install: 0, joinedAt: null, status: 'invited', approvedBy: null, invitedAt: '2026-10-02', channel: 'call' },

  { goal: 'jg05', memberId: 'm1', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-03', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg05', memberId: 'm2', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-03', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-02-20', amt: 5000, note: 'লক্ষ্য পূরণে এককালীন অবদান (D-49)' }] },
  { goal: 'jg05', memberId: 'm3', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-02-25', amt: 3000, note: 'এককালীন অনুমতি (D-49)' }] },
  { goal: 'jg05', memberId: 'm4', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-04', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg05', memberId: 'm5', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-05', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg05', memberId: 'm6', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-05', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-03-02', amt: 2000, note: 'এককালীন অনুমতি (D-49)' }] },
  { goal: 'jg05', memberId: 'm7', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-06', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg05', memberId: 'm8', pledged: 5000, paid: 5000, install: 1000, joinedAt: '2025-11-06', status: 'active', approvedBy: 'নাসরিন আক্তার' },
];

export const SEED_JDISB: JDisb[] = [
  { id: 'jd01', goal: 'jg02', no: 'JD-2611-0001', purpose: '২টি গভীর নলকূপ স্থাপন ও মেশিন ক্রয়',
    payee: 'মেসার্স খুলনা ড্রিলিং এন্টারপ্রাইজ', amount: 78000, at: '2026-11-08', status: 'approval', channel: 'bank',
    committee: 'CM-2611-03', decision: 'ভেন্ডর পেমেন্ট অগ্রাধিকার (D-50)', by: 'সুমি রানী দাস', appr: null,
    evidence: ['চালান · inv-KDE-2291', 'কমিটির সিদ্ধান্ত · CM-2611-03', 'দরপত্র তুলনা · ৩টি'],
    note: 'maker ≠ checker (BR-04) · অনুমোদন সীমা D-22 · প্রমাণ ছাড়া অর্থ ছাড়া হবে না' },
  { id: 'jd02', goal: 'jg02', no: 'JD-2611-0002', purpose: 'পরিবহন, সেটআপ ও প্রথম বছরের রক্ষণাবেক্ষণ',
    payee: 'স্থানীয় পরিবহন ও মিস্ত্রি খরচ', amount: 4500, at: '2026-11-20', status: 'planned', channel: 'cash_office',
    committee: 'CM-2611-03', decision: 'দায়িত্বপ্রাপ্ত সদস্যের হাতে — প্রমাণ ও সাক্ষী বাধ্যতামূলক (D-50)', by: null, appr: null,
    evidence: [], note: 'প্রথম ভাউচার সম্পন্ন হলে প্রস্তুত হবে' },
  { id: 'jd03', goal: 'jg03', no: 'JD-2607-0001', purpose: 'আনুপাতিক ফেরত — ৮ জন অংশগ্রহণকারীকে তাদের অবদান ফেরত',
    payee: 'অংশগ্রহণকারী (আনুপাতিক হারে)', amount: 42000, at: '2026-11-10', status: 'approval', channel: 'bkash',
    committee: 'CM-2607-02', decision: 'মেয়াদোত্তীর্ণ লক্ষ্যে আনুপাতিক ফেরত (D-39)', by: 'সুমি রানী দাস', appr: null,
    evidence: ['কমিটির সিদ্ধান্ত · CM-2607-02', 'ফেরত ছক (সদস্যভিত্তিক)', 'নোটিশ প্রমাণ · ৮টি'],
    note: 'ব্যক্তিগত উত্তোলন নয় — লক্ষ্য ব্যর্থ হওয়ায় নিষ্পত্তির অংশ (BR-19)' },
  { id: 'jd04', goal: 'jg05', no: 'JD-2603-0001', purpose: '৫টি কম্পিউটার ও মনিটর ক্রয়',
    payee: 'মেসার্স কম্পিউটার সেন্টার, খুলনা', amount: 45000, at: '2026-03-08', status: 'paid', channel: 'bank',
    committee: 'CM-2602-01', decision: 'ভেন্ডর পেমেন্ট (D-50)', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার',
    evidence: ['চালান · inv-CS-8821', 'স্থাপনার ছবি · ৪টি', 'কমিটির সিদ্ধান্ত · CM-2602-01'], hash: 'b71e04c9',
    note: 'প্রমাণসহ পরিশোধিত' },
  { id: 'jd05', goal: 'jg05', no: 'JD-2603-0002', purpose: 'পরিবহন, ইন্টারনেট সংযোগ ও সেটআপ',
    payee: 'স্থানীয় সরবরাহকারী ও সংযোগকারী', amount: 5000, at: '2026-03-11', status: 'paid', channel: 'cash_office',
    committee: 'CM-2602-01', decision: 'ভেন্ডর পেমেন্ট (D-50)', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার',
    evidence: ['রসিদ · ৩টি', 'সেটআপ সনদ'], hash: 'c09a5e17', note: 'প্রমাণসহ পরিশোধিত' },
];

/* ---------------- অবদান (goal_contributions) তৈরি ---------------- */
const monthDates = (g: JGoal) => {
  const start = new Date(`${g.start}T00:00:00Z`);
  const limit = g.targetDate < TODAY_ISO ? g.targetDate : TODAY_ISO;
  const out: string[] = [];
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  for (let i = 0; i < 60; i += 1) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(g.payDay).padStart(2, '0')}`;
    if (ds > limit) break;
    out.push(ds);
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return out;
};

export const jgTotalMonths = (g: JGoal) => {
  const a = new Date(`${g.start}T00:00:00Z`);
  const b = new Date(`${g.targetDate}T00:00:00Z`);
  return Math.max(1, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) + 1);
};
export const jgElapsedMonths = (g: JGoal) => monthDates(g).length;

function buildContribs(goals: JGoal[], parts: JPart[]): JContrib[] {
  const rows: JContrib[] = [];
  const seq: Record<string, number> = {};
  goals.forEach((g) => {
    const dates = monthDates(g);
    parts.filter((p) => p.goal === g.id).forEach((p) => {
      const items: { at: string; amt: number; note?: string }[] = [];
      let left = p.paid;
      for (let i = 0; i < dates.length && left > 0; i += 1) {
        const amt = Math.min(p.install || left, left);
        items.push({ at: dates[i], amt });
        left -= amt;
      }
      if (left > 0 && items.length) items[items.length - 1].amt += left;
      (p.extra ?? []).forEach((x) => items.push(x));
      items.forEach((it) => {
        const ym = `${it.at.slice(2, 4)}${it.at.slice(5, 7)}`;
        seq[ym] = (seq[ym] ?? 0) + 1;
        rows.push({
          goal: g.id, memberId: p.memberId, amount: it.amt, at: it.at,
          receipt: `JC-${ym}-${String(seq[ym]).padStart(4, '0')}`,
          channel: it.at.slice(5, 7) === '06' ? 'bkash' : ['m2', 'm5'].includes(p.memberId) ? 'cash_office' : 'bank',
          by: g.join === 'open' ? 'রাজু আহমেদ' : 'অফিস কাউন্টার · সুমি রানী দাস',
          txn: `TXN-${ym}-${String(seq[ym]).padStart(4, '0')}`,
          note: it.note,
        });
      });
    });
  });
  return rows.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.receipt < b.receipt ? -1 : 1));
}

export const SEED_JCONTRIBS = buildContribs(SEED_JGOALS, SEED_JPARTS);

/* ---------------- গণনা ---------------- */
export const jgGoalById = (goals: JGoal[], id?: string | null) => goals.find((g) => g.id === id) ?? goals[0];
export const jgPartsOf = (parts: JPart[], goalId: string) => parts.filter((p) => p.goal === goalId);
export const jgContribsOf = (cs: JContrib[], goalId: string, memberId?: string) =>
  cs.filter((c) => c.goal === goalId && (!memberId || c.memberId === memberId));
export const jgCollected = (cs: JContrib[], goalId: string) => jgContribsOf(cs, goalId).reduce((s, c) => s + c.amount, 0);
export const jgPctOf = (cs: JContrib[], g: JGoal) => Math.round((jgCollected(cs, g.id) / g.target) * 100);
export const jgPledgeTotal = (parts: JPart[], goalId: string) =>
  jgPartsOf(parts, goalId).filter((p) => p.status !== 'invited').reduce((s, p) => s + p.pledged, 0);
export const jgExpectedNow = (g: JGoal, p: JPart) => {
  if (!p.pledged) return 0;
  if (g.crule === 'fixed') return Math.min(p.pledged, jgElapsedMonths(g) * (g.monthly ?? 0));
  return Math.min(p.pledged, Math.round((p.pledged * jgElapsedMonths(g)) / jgTotalMonths(g)));
};
export const jgArrearsOf = (goals: JGoal[], parts: JPart[], cs: JContrib[], goalId: string) => {
  const g = jgGoalById(goals, goalId);
  return jgPartsOf(parts, goalId)
    .filter((p) => p.status === 'active' || p.status === 'behind')
    .map((p) => {
      const paid = jgContribsOf(cs, goalId, p.memberId).reduce((s, c) => s + c.amount, 0);
      const expected = jgExpectedNow(g, p);
      return { part: p, expected, paid, gap: Math.max(0, expected - paid) };
    })
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap);
};
export const jgAllArrears = (goals: JGoal[], parts: JPart[], cs: JContrib[]) =>
  goals
    .filter((g) => g.status === 'active' || g.status === 'expired' || g.status === 'forming')
    .flatMap((g) => jgArrearsOf(goals, parts, cs, g.id).map((x) => ({ ...x, goal: g })));

export const jgMilestonesOf = (g: JGoal, cs: JContrib[]) => {
  const list = jgContribsOf(cs, g.id).slice().sort((a, b) => (a.at < b.at ? -1 : 1));
  let cum = 0;
  const hit: Record<number, string | null> = {};
  list.forEach((c) => {
    cum += c.amount;
    const pct = (cum / g.target) * 100;
    JG_MS.forEach((m) => { if (!hit[m] && pct >= m) hit[m] = c.at; });
  });
  return JG_MS.map((m) => ({ pct: m, reachedAt: hit[m] ?? null }));
};
export const jgDaysLeft = (g: JGoal) =>
  Math.round((new Date(`${g.targetDate}T00:00:00Z`).getTime() - new Date(`${TODAY_ISO}T00:00:00Z`).getTime()) / 86400000);
export const jgDisbOf = (disbs: JDisb[], goalId: string) => disbs.filter((d) => d.goal === goalId);
export const jgPaidOut = (disbs: JDisb[], goalId: string) =>
  jgDisbOf(disbs, goalId).filter((d) => d.status === 'paid').reduce((s, d) => s + d.amount, 0);
export const jgActive = (goals: JGoal[]) => goals.filter((g) => g.status !== 'closed');
export const jgLimitLeft = (goals: JGoal[]) => Math.max(0, JG_LIMIT - jgActive(goals).length);
export const jgSpend = (disbs: JDisb[]) => disbs.filter((d) => d.status === 'paid').reduce((s, d) => s + d.amount, 0);
export const jgPendingDisb = (disbs: JDisb[]) => disbs.filter((d) => d.status === 'approval');
export const jgPendingJoins = (parts: JPart[]) => parts.filter((p) => p.status === 'pending');
export const jgPendingSettle = (goals: JGoal[]) => goals.filter((g) => g.status === 'settling' && !g.settleAppr);
export const jgPendingAll = (parts: JPart[], disbs: JDisb[], goals: JGoal[]) => [
  ...jgPendingDisb(disbs),
  ...jgPendingJoins(parts),
  ...jgPendingSettle(goals),
].length;
export const jgExpectedMonth = (goals: JGoal[], parts: JPart[]) =>
  goals
    .filter((g) => g.status === 'active' || g.status === 'forming')
    .reduce((s, g) => s + jgPartsOf(parts, g.id)
      .filter((p) => p.status === 'active' || p.status === 'behind')
      .reduce((a, p) => a + (g.crule === 'fixed' ? (g.monthly ?? 0) : Math.round(p.pledged / jgTotalMonths(g))), 0), 0);
export const jgGotThisMonth = (cs: JContrib[]) => cs.filter((c) => c.at.startsWith('2026-10')).reduce((s, c) => s + c.amount, 0);
export const jgChannelLabel = (c: 'cash_office' | 'bkash' | 'bank') =>
  c === 'cash_office' ? 'অফিস কাউন্টার (নগদ)' : c === 'bkash' ? 'বিকাশ / ওয়ালেট' : 'ব্যাংক ট্রান্সফার';
