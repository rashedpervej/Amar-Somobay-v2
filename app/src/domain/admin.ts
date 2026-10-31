/* ============================================================
   src/domain/admin.ts — অ্যাডমিন মোবাইল (AM-01…AM-20) ডোমেইন
   একই ডেটা ও নিয়ম ডেস্কটপ A-সিরিজের সাথে ভাগ করা (এক API, দুই লেআউট)।
   সব সংখ্যা ডেমো — bn() দিয়ে বাংলা অঙ্কে দেখানো হয়। কোনো সুদ/মুনাফা নেই (D-01)।
   ============================================================ */

export type MemStatus = 'active' | 'dormant' | 'suspended' | 'exited';
export type KycState = 'verified' | 'pending' | 'blur';
export type ApprovalKind = 'withdrawal' | 'deposit' | 'member' | 'correction';
export type Channel = 'cash' | 'bkash' | 'nagad' | 'bank';

export const MEM_STATUS: Record<MemStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }> = {
  active: { t: 'সক্রিয়', tone: 'ok' },
  dormant: { t: 'নিষ্ক্রিয়', tone: 'warn' },
  suspended: { t: 'স্থগিত', tone: 'danger' },
  exited: { t: 'প্রস্থান', tone: 'neutral' },
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  cash: 'নগদ (কাউন্টার)', bkash: 'বিকাশ', nagad: 'নগদ (ওয়ালেট)', bank: 'ব্যাংক',
};

export type AmMember = {
  id: string; no: string; name: string; father: string; mobile: string; nid: string;
  village: string; union: string; upazila: string; district: string; occupation: string;
  joined: string; status: MemStatus; kyc: KycState; route: string; photo: string;
};

export type AmAccount = {
  id: string; no: string; memberId: string; scheme: string; installment: number; paid: number;
  tenure: number | null; status: 'active' | 'frozen' | 'closed'; posted: number; hold: number;
  pending: number; minBal: number; locked: number; nextDue: string; missed: number;
  totalIn: number; totalOut: number; opened: string; day: number; lockIn: number;
  noticeDays: number; maxPerMonth: number; maxAmount: number;
};

export type AmDue = {
  id: string; memberId: string; accId: string; instNo: number; due: string;
  amount: number; paid: number; lateFee: number; band: string; age: number;
};

export type AmApproval = {
  id: string; kind: ApprovalKind; memberId: string; member: string; amount: number;
  by: string; submitted: string; hoursAgo: number; ref: string; evidence: boolean;
  note: string; reason: string; method: Channel | 'cash_office'; nominee: string;
  avail: number; posted: number; hold: number; min: number; locked: number;
  inLimit: boolean; matched: 'auto' | 'partial' | 'none';
};

export type AuditStep = { at: string; by: string; what: string };

export type AmTxn = {
  id: string; no: string; date: string; memberId: string; accId: string;
  type: 'deposit' | 'withdrawal' | 'fee' | 'adjust'; amount: number; channel: Channel;
  status: 'posted' | 'pending' | 'reversed'; balanceAfter: number; postedBy: string;
  device: string; ip: string; gps: string; reference: string;
  audit: AuditStep[];
};

export type AmCorrection = {
  id: string; no: string; kind: string; txnNo: string; by: string; at: string;
  status: 'pending' | 'approved' | 'applied' | 'rejected'; reason: string;
  impact: { balance: number; reports: string };
};

export type AmPayout = {
  id: string; no: string; memberId: string; member: string; amount: number;
  approvedBy: string; method: Channel | 'none'; status: 'approved' | 'paid' | 'unknown';
  voucher: string;
};

export type AmCashDay = {
  date: string; declared: number; counted: number; closed: boolean; approvedBy: string;
  channels: { cash: number; bkash: number; nagad: number; bank: number };
  note: string;
};

export type AmClaim = {
  id: string; memberId: string; member: string; accNo: string; deathAt: string;
  nominee: string; relation: string; sharePct: number; amount: number;
  docs: { t: string; ok: boolean }[]; disputed: boolean; status: 'verify' | 'committee' | 'paid';
  committeeNo: string;
};

export type AmTransfer = {
  id: string; no: string; from: string; to: string; amount: number; fee: number;
  by: string; at: string; status: 'pending' | 'done' | 'unknown'; approvedBy: string;
};

export type AmOrgAccount = { id: string; name: string; kind: string; no: string; balance: number };

/* ---------------- সদস্য ---------------- */
export const SEED_MEMBERS: AmMember[] = [
  { id: 'm1', no: 'RSS-001', name: 'রহিমা বেগম', father: 'মোঃ আব্দুল করিম', mobile: '01711223344', nid: '1990563214785', village: 'শাপলা', union: 'শাপলা ইউনিয়ন', upazila: 'সদর', district: 'খুলনা', occupation: 'গৃহিণী', joined: '2024-02-11', status: 'active', kyc: 'verified', route: 'R1', photo: 'র' },
  { id: 'm2', no: 'RSS-002', name: 'করিম উদ্দিন', father: 'মোঃ ইসমাইল হোসেন', mobile: '01812345678', nid: '1985441223344', village: 'দক্ষিণপাড়া', union: 'শাপলা ইউনিয়ন', upazila: 'সদর', district: 'খুলনা', occupation: 'কৃষক', joined: '2023-08-04', status: 'active', kyc: 'verified', route: 'R1', photo: 'ক' },
  { id: 'm3', no: 'RSS-003', name: 'সাবিনা ইয়াসমিন', father: 'মোঃ শফিকুল ইসলাম', mobile: '01913456789', nid: '1992778456123', village: 'উত্তরপাড়া', union: 'শাপলা ইউনিয়ন', upazila: 'সদর', district: 'খুলনা', occupation: 'শিক্ষক', joined: '2025-01-19', status: 'active', kyc: 'verified', route: 'R2', photo: 'স' },
  { id: 'm4', no: 'RSS-004', name: 'আব্দুল্লাহ আল মামুন', father: 'মোঃ নুরুল হক', mobile: '01617894562', nid: '1990223344556', village: 'পূর্বপাড়া', union: 'শাপলা ইউনিয়ন', upazila: 'সদর', district: 'খুলনা', occupation: 'ব্যবসায়ী', joined: '2022-11-02', status: 'active', kyc: 'pending', route: 'R2', photo: 'আ' },
  { id: 'm5', no: 'RSS-005', name: 'ফাতেমা খাতুন', father: 'মোঃ জসিম উদ্দিন', mobile: '01511223399', nid: '1988332211445', village: 'শাপলা', union: 'শাপলা ইউনিয়ন', upazila: 'সদর', district: 'খুলনা', occupation: 'দর্জি', joined: '2021-06-21', status: 'dormant', kyc: 'verified', route: 'R3', photo: 'ফ' },
  { id: 'm6', no: 'RSS-006', name: 'নাসির হোসেন', father: 'মোঃ আক্তার হোসেন', mobile: '01733445566', nid: '1996665544332', village: 'মধ্যপাড়া', union: 'শাপলা ইউনিয়ন', upazila: 'সদর', district: 'খুলনা', occupation: 'রিকশাচালক', joined: '2025-08-30', status: 'active', kyc: 'blur', route: 'R3', photo: 'ন' },
];

/* ---------------- অ্যাকাউন্ট ---------------- */
export const SEED_ACCOUNTS: AmAccount[] = [
  { id: 'a1', no: 'SAV-001-01', memberId: 'm1', scheme: 'মাসিক সঞ্চয়', installment: 1000, paid: 5, tenure: 60, status: 'active', posted: 23500, hold: 0, pending: 1000, minBal: 500, locked: 0, nextDue: '2026-10-05', missed: 1, totalIn: 24500, totalOut: 1000, opened: '2024-02-11', day: 993, lockIn: 6, noticeDays: 7, maxPerMonth: 2, maxAmount: 50000 },
  { id: 'a2', no: 'SAV-001-02', memberId: 'm1', scheme: 'দীর্ঘমেয়াদি সঞ্চয়', installment: 2000, paid: 3, tenure: 120, status: 'active', posted: 34000, hold: 5000, pending: 0, minBal: 1000, locked: 0, nextDue: '2026-11-10', missed: 0, totalIn: 34000, totalOut: 0, opened: '2025-06-01', day: 518, lockIn: 12, noticeDays: 15, maxPerMonth: 1, maxAmount: 100000 },
  { id: 'a3', no: 'SAV-002-01', memberId: 'm2', scheme: 'মাসিক সঞ্চয়', installment: 500, paid: 12, tenure: 60, status: 'active', posted: 18600, hold: 0, pending: 0, minBal: 500, locked: 0, nextDue: '2026-11-05', missed: 0, totalIn: 18600, totalOut: 0, opened: '2023-08-04', day: 1185, lockIn: 6, noticeDays: 7, maxPerMonth: 2, maxAmount: 50000 },
  { id: 'a4', no: 'SAV-003-01', memberId: 'm3', scheme: 'মাসিক সঞ্চয়', installment: 1500, paid: 9, tenure: 60, status: 'active', posted: 27500, hold: 0, pending: 0, minBal: 500, locked: 0, nextDue: '2026-11-07', missed: 0, totalIn: 27500, totalOut: 0, opened: '2025-01-19', day: 651, lockIn: 6, noticeDays: 7, maxPerMonth: 2, maxAmount: 50000 },
  { id: 'a5', no: 'SAV-004-01', memberId: 'm4', scheme: 'নমনীয় সঞ্চয়', installment: 300, paid: 6, tenure: null, status: 'active', posted: 12800, hold: 2000, pending: 0, minBal: 500, locked: 0, nextDue: '2026-11-01', missed: 0, totalIn: 12800, totalOut: 0, opened: '2022-11-02', day: 1459, lockIn: 0, noticeDays: 7, maxPerMonth: 3, maxAmount: 50000 },
  { id: 'a6', no: 'SAV-005-01', memberId: 'm5', scheme: 'মাসিক সঞ্চয়', installment: 500, paid: 14, tenure: 60, status: 'frozen', posted: 15200, hold: 0, pending: 0, minBal: 500, locked: 3000, nextDue: '2026-06-05', missed: 4, totalIn: 15200, totalOut: 0, opened: '2021-06-21', day: 1959, lockIn: 6, noticeDays: 7, maxPerMonth: 2, maxAmount: 50000 },
  { id: 'a7', no: 'SAV-006-01', memberId: 'm6', scheme: 'মাসিক সঞ্চয়', installment: 700, paid: 2, tenure: 60, status: 'active', posted: 2100, hold: 0, pending: 0, minBal: 500, locked: 0, nextDue: '2026-11-03', missed: 0, totalIn: 2100, totalOut: 0, opened: '2025-08-30', day: 428, lockIn: 6, noticeDays: 7, maxPerMonth: 2, maxAmount: 50000 },
  { id: 'a8', no: 'SAV-002-02', memberId: 'm2', scheme: 'দীর্ঘমেয়াদি সঞ্চয়', installment: 1000, paid: 22, tenure: 120, status: 'active', posted: 25400, hold: 0, pending: 0, minBal: 1000, locked: 0, nextDue: '2026-11-12', missed: 0, totalIn: 25400, totalOut: 0, opened: '2024-01-07', day: 1027, lockIn: 12, noticeDays: 15, maxPerMonth: 1, maxAmount: 100000 },
];

/* ---------------- বকেয়া ---------------- */
export const SEED_DUES: AmDue[] = [
  { id: 'd1', memberId: 'm1', accId: 'a1', instNo: 24, due: '2026-10-05', amount: 1000, paid: 0, lateFee: 20, band: '৮–৩০ দিন', age: 26 },
  { id: 'd2', memberId: 'm2', accId: 'a3', instNo: 39, due: '2026-09-05', amount: 500, paid: 0, lateFee: 20, band: '৩১–৯০ দিন', age: 56 },
  { id: 'd3', memberId: 'm2', accId: 'a3', instNo: 40, due: '2026-10-05', amount: 500, paid: 200, lateFee: 20, band: '৮–৩০ দিন', age: 26 },
  { id: 'd4', memberId: 'm5', accId: 'a6', instNo: 15, due: '2026-06-05', amount: 500, paid: 0, lateFee: 20, band: '৯০+ দিন', age: 148 },
  { id: 'd5', memberId: 'm5', accId: 'a6', instNo: 16, due: '2026-07-05', amount: 500, paid: 0, lateFee: 20, band: '৯০+ দিন', age: 118 },
  { id: 'd6', memberId: 'm5', accId: 'a6', instNo: 17, due: '2026-08-05', amount: 500, paid: 0, lateFee: 20, band: '৬১–৯০ দিন', age: 87 },
  { id: 'd7', memberId: 'm4', accId: 'a5', instNo: 8, due: '2026-09-01', amount: 300, paid: 0, lateFee: 20, band: '৩১–৯০ দিন', age: 60 },
  { id: 'd8', memberId: 'm1', accId: 'a2', instNo: 4, due: '2026-10-10', amount: 2000, paid: 0, lateFee: 20, band: '৮–৩০ দিন', age: 21 },
];

/* ---------------- অনুমোদন কিউ ---------------- */
export const SEED_APPROVALS: AmApproval[] = [
  { id: 'ap1', kind: 'withdrawal', memberId: 'm1', member: 'রহিমা বেগম', amount: 5000, by: 'রহিমা বেগম', submitted: '৩১ অক্টো, ৯:২০', hoursAgo: 28, ref: 'WR-2627-0212', evidence: true, note: '', reason: 'চিকিৎসা', method: 'cash_office', nominee: 'মোঃ করিম (স্বামী) ৬০% · রাবেয়া ৪০%', avail: 18500, posted: 23500, hold: 5000, min: 500, locked: 0, inLimit: true, matched: 'auto' },
  { id: 'ap2', kind: 'withdrawal', memberId: 'm4', member: 'আব্দুল্লাহ আল মামুন', amount: 62000, by: 'আব্দুল্লাহ আল মামুন', submitted: '৩০ অক্টো, ১৬:০৫', hoursAgo: 45, ref: 'WR-2627-0208', evidence: true, note: '', reason: 'ব্যবসার পুঁজি', method: 'bkash', nominee: 'মোঃ নুরুল হক (পিতা) ১০০%', avail: 10300, posted: 12800, hold: 2000, min: 500, locked: 0, inLimit: false, matched: 'auto' },
  { id: 'ap3', kind: 'deposit', memberId: 'm3', member: 'সাবিনা ইয়াসমিন', amount: 1500, by: 'রাজু আহমেদ (সংগ্রহক)', submitted: '৩১ অক্টো, ১১:০৮', hoursAgo: 2, ref: 'RCP-১০২৫', evidence: true, note: 'বিকাশ রেফারেন্স মিলেছে', reason: '', method: 'bkash', nominee: '', avail: 0, posted: 0, hold: 0, min: 0, locked: 0, inLimit: true, matched: 'auto' },
  { id: 'ap4', kind: 'member', memberId: 'm6', member: 'নাসির হোসেন', amount: 700, by: 'রাজু আহমেদ (সংগ্রহক)', submitted: '৩১ অক্টো, ১০:১৫', hoursAgo: 3, ref: 'APP-2627-0044', evidence: false, note: 'NID-এর পিছনের ছবি অস্পষ্ট', reason: '', method: 'cash_office', nominee: ' Rokeya (স্ত্রী) ১০০%', avail: 0, posted: 0, hold: 0, min: 0, locked: 0, inLimit: true, matched: 'partial' },
  { id: 'ap5', kind: 'correction', memberId: 'm2', member: 'করিম উদ্দিন', amount: 500, by: 'হিসাবরক্ষক শাহানা', submitted: '৩০ অক্টো, ১৮:৪০', hoursAgo: 20, ref: 'CR-0018', evidence: true, note: 'ভুল রসিদে দ্বিগুণ জমা', reason: '', method: 'cash_office', nominee: '', avail: 0, posted: 0, hold: 0, min: 0, locked: 0, inLimit: true, matched: 'auto' },
];

/* ---------------- লেনদেন ---------------- */
export const SEED_TXNS: AmTxn[] = [
  { id: 't1', no: 'TXN-2627-1188', date: '2026-10-31', memberId: 'm1', accId: 'a1', type: 'deposit', amount: 1000, channel: 'cash', status: 'posted', balanceAfter: 23500, postedBy: 'রাজু আহমেদ', device: 'Symphony D80', ip: '103.12.44.18', gps: '22.8456, 89.5403', reference: 'RCP-১০২৫', audit: [{ at: '৩১ অক্টো, ০৯:১২', by: 'রাজু আহমেদ', what: 'জমা এন্ট্রি তৈরি' }, { at: '৩১ অক্টো, ১০:০২', by: 'মোঃ আব্দুল্লাহ', what: 'অনুমোদিত ও পোস্টেড' }] },
  { id: 't2', no: 'TXN-2627-1187', date: '2026-10-30', memberId: 'm2', accId: 'a3', type: 'deposit', amount: 500, channel: 'bkash', status: 'posted', balanceAfter: 18600, postedBy: 'রাজু আহমেদ', device: 'Symphony D80', ip: '103.12.44.18', gps: '22.8456, 89.5403', reference: 'RCP-১০২৪', audit: [{ at: '৩০ অক্টো, ১৭:২০', by: 'রাজু আহমেদ', what: 'জমা এন্ট্রি তৈরি' }, { at: '৩০ অক্টো, ১৮:০৫', by: 'হিসাবরক্ষক শাহানা', what: 'পোস্টেড' }] },
  { id: 't3', no: 'TXN-2627-1184', date: '2026-10-28', memberId: 'm1', accId: 'a1', type: 'withdrawal', amount: 1000, channel: 'cash', status: 'posted', balanceAfter: 22500, postedBy: 'হিসাবরক্ষক শাহানা', device: 'Office Desktop', ip: '103.12.44.10', gps: '—', reference: 'WR-2627-0181', audit: [{ at: '২৮ অক্টো, ১২:৩০', by: 'হিসাবরক্ষক শাহানা', what: 'উত্তোলন নিষ্পত্তি' }] },
  { id: 't4', no: 'TXN-2627-1180', date: '2026-10-25', memberId: 'm6', accId: 'a7', type: 'deposit', amount: 700, channel: 'cash', status: 'posted', balanceAfter: 2100, postedBy: 'রাজু আহমেদ', device: 'Symphony D80', ip: '103.12.44.18', gps: '22.8456, 89.5403', reference: 'RCP-১০১৯', audit: [{ at: '২৫ অক্টো, ১১:০০', by: 'রাজু আহমেদ', what: 'এন্ট্রি' }, { at: '২৫ অক্টো, ১১:৪০', by: 'মোঃ আব্দুল্লাহ', what: 'পোস্টেড' }] },
  { id: 't5', no: 'TXN-2627-1175', date: '2026-10-22', memberId: 'm3', accId: 'a4', type: 'fee', amount: 20, channel: 'cash', status: 'posted', balanceAfter: 27500, postedBy: 'সিস্টেম', device: 'Server', ip: '—', gps: '—', reference: 'FEE-০০৭২', audit: [{ at: '২২ অক্টো, ০০:০৫', by: 'সিস্টেম', what: 'বিলম্ব ফি (নির্ধারিত, সুদ নয়)' }] },
  { id: 't6', no: 'TXN-2627-1170', date: '2026-10-18', memberId: 'm2', accId: 'a8', type: 'deposit', amount: 1000, channel: 'bank', status: 'posted', balanceAfter: 25400, postedBy: 'হিসাবরক্ষক শাহানা', device: 'Office Desktop', ip: '103.12.44.10', gps: '—', reference: 'BNK-৯৯২১', audit: [{ at: '১৮ অক্টো, ১৪:১০', by: 'হিসাবরক্ষক শাহানা', what: 'ব্যাংক এন্ট্রি' }] },
];

/* ---------------- সংশোধন ---------------- */
export const SEED_CORRECTIONS: AmCorrection[] = [
  { id: 'c1', no: 'CR-0018', kind: 'দ্বিগুণ জমা রিভার্সাল', txnNo: 'TXN-2627-1170', by: 'হিসাবরক্ষক শাহানা', at: '2026-10-30', status: 'pending', reason: 'একই রসিদ দুইবার পোস্ট হয়েছে', impact: { balance: -1000, reports: 'সঞ্চয় ও ক্যাশ বুক' } },
  { id: 'c2', no: 'CR-0019', kind: 'ভুল অ্যাকাউন্টে জমা', txnNo: 'TXN-2627-1180', by: 'রাজু আহমেদ', at: '2026-10-30', status: 'pending', reason: 'একই নামের অন্য সদস্যের অ্যাকাউন্টে গেছে', impact: { balance: 0, reports: 'দুই অ্যাকাউন্টের ব্যালেন্স' } },
  { id: 'c3', no: 'CR-0016', kind: 'ফি মওকুফ', txnNo: 'FEE-০০৭২', by: 'মোঃ আব্দুল্লাহ', at: '2026-10-27', status: 'approved', reason: 'কমিটি সিদ্ধান্ত ০৫/২০২৬', impact: { balance: 20, reports: 'ফি আয়' } },
  { id: 'c4', no: 'CR-0011', kind: 'ঠিকানা সংশোধন', txnNo: '—', by: 'হিসাবরক্ষক শাহানা', at: '2026-10-12', status: 'applied', reason: 'NID অনুযায়ী', impact: { balance: 0, reports: 'KYC' } },
];

/* ---------------- নিষ্পত্তি / পেমেন্ট ---------------- */
export const SEED_PAYOUTS: AmPayout[] = [
  { id: 'p1', no: 'WR-2627-0199', memberId: 'm2', member: 'করিম উদ্দিন', amount: 4000, approvedBy: 'মোঃ আব্দুল্লাহ (MANAGER)', method: 'none', status: 'approved', voucher: '' },
  { id: 'p2', no: 'WR-2627-0195', memberId: 'm3', member: 'সাবিনা ইয়াসমিন', amount: 2500, approvedBy: 'মোঃ আব্দুল্লাহ (MANAGER)', method: 'none', status: 'approved', voucher: '' },
  { id: 'p3', no: 'WR-2627-0190', memberId: 'm6', member: 'নাসির হোসেন', amount: 1200, approvedBy: 'হিসাবরক্ষক শাহানা (ACTING)', method: 'cash', status: 'unknown', voucher: 'V-১০২১' },
];

/* ---------------- ক্যাশ বই ---------------- */
export const SEED_CASH_DAYS: AmCashDay[] = [
  { date: '2026-10-31', declared: 2845000, counted: 2843000, closed: false, approvedBy: '', channels: { cash: 1845000, bkash: 700000, nagad: 200000, bank: 100000 }, note: '' },
  { date: '2026-10-30', declared: 2612000, counted: 2612000, closed: true, approvedBy: 'মোঃ আব্দুল্লাহ (MANAGER)', channels: { cash: 1712000, bkash: 600000, nagad: 200000, bank: 100000 }, note: 'মিলেছে' },
  { date: '2026-10-29', declared: 2378000, counted: 2377500, closed: true, approvedBy: 'মোঃ আব্দুল্লাহ (MANAGER)', channels: { cash: 1577500, bkash: 500000, nagad: 200000, bank: 100000 }, note: 'ঘাটতি ৳৫০ — ভাংতি' },
];

/* ---------------- মৃত্যু দাবি ---------------- */
export const SEED_CLAIMS: AmClaim[] = [
  { id: 'cl1', memberId: 'm5', member: 'ফাতেমা খাতুন', accNo: 'SAV-005-01', deathAt: '2026-10-12', nominee: 'রাবেয়া খাতুন', relation: 'কন্যা', sharePct: 100, amount: 15200, disputed: false, status: 'verify', committeeNo: '', docs: [{ t: 'মৃত্যু সনদ', ok: true }, { t: 'নমিনির NID', ok: true }, { t: 'ওয়ারিশ তালিকা', ok: false }, { t: 'ব্যাংক তথ্য', ok: false }] },
  { id: 'cl2', memberId: 'm6', member: 'নাসির হোসেন', accNo: 'SAV-006-01', deathAt: '2026-09-28', nominee: 'রোকেয়া বেগম', relation: 'স্ত্রী', sharePct: 100, amount: 2100, disputed: true, status: 'committee', committeeNo: '০৯/২০২৬', docs: [{ t: 'মৃত্যু সনদ', ok: true }, { t: 'নমিনির NID', ok: true }, { t: 'ওয়ারিশ তালিকা', ok: true }, { t: 'ব্যাংক তথ্য', ok: true }] },
];

/* ---------------- তহবিল ---------------- */
export const SEED_ORG_ACCOUNTS: AmOrgAccount[] = [
  { id: 'oa1', name: 'সমিতির প্রধান হিসাব', kind: 'সঞ্চয় তহবিল', no: 'AC-001', balance: 4820000 },
  { id: 'oa2', name: 'কর্জে হাসানা তহবিল', kind: 'শুধু মূলধন', no: 'AC-002', balance: 1250000 },
  { id: 'oa3', name: 'সাধারণ খরচ', kind: 'পরিচালন', no: 'AC-003', balance: 380000 },
  { id: 'oa4', name: 'চ্যারিটি ফান্ড', kind: 'অনুদান', no: 'AC-004', balance: 65000 },
];

export const SEED_TRANSFERS: AmTransfer[] = [
  { id: 'tr1', no: 'FT-0011', from: 'oa1', to: 'oa2', amount: 200000, fee: 0, by: 'হিসাবরক্ষক শাহানা', at: '2026-10-30', status: 'pending', approvedBy: '' },
  { id: 'tr2', no: 'FT-0010', from: 'oa1', to: 'oa3', amount: 50000, fee: 10, by: 'হিসাবরক্ষক শাহানা', at: '2026-10-28', status: 'done', approvedBy: 'মোঃ আব্দুল্লাহ (MANAGER)' },
];

/* ---------------- helper ---------------- */
export const memberById = (list: AmMember[], id?: string) => list.find((m) => m.id === id);
export const accountsOf = (list: AmAccount[], memberId?: string) => list.filter((a) => a.memberId === memberId);
export const accountById = (list: AmAccount[], id?: string) => list.find((a) => a.id === id);
export const duesOfMember = (list: AmDue[], memberId: string) => list.filter((d) => d.memberId === memberId);
export const dueTotal = (list: AmDue[], memberId: string) =>
  list.filter((d) => d.memberId === memberId).reduce((s, d) => s + (d.amount - d.paid), 0);
export const availOf = (a: AmAccount) => Math.max(0, a.posted - a.hold - a.minBal - a.locked);
export const cashDiff = (d: AmCashDay) => d.counted - d.declared;
export const claimMissing = (c: AmClaim) => c.docs.filter((d) => !d.ok);
export const transferTotal = (t: AmTransfer) => t.amount + t.fee;
export const approvedWithdrawals = (list: AmApproval[]) => list.filter((a) => a.kind === 'withdrawal' && a.inLimit);
export const approvalsOf = (list: AmApproval[], kind: ApprovalKind | 'all') =>
  kind === 'all' ? list : list.filter((a) => a.kind === kind);
