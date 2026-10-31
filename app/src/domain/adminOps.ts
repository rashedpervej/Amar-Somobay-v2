/* ============================================================
   src/domain/adminOps.ts — ব্যাচ ৫ (AM-21…AM-35) ডোমেইন
   রিকনসিলিয়েশন · বাল্ক ব্যাচ/ইমপোর্ট · আর্থিক বিবরণী · রিপোর্ট ·
   স্কিম · সদস্য স্থানান্তর · রুট · রিমাইন্ডার · সেটিংস · স্টাফ · অডিট।
   সব ডেমো ডেটা — কোনো বাস্তব ব্যক্তি/অর্থ নয়। কোনো সুদ/মুনাফা খাত নেই (D-01)।
   ============================================================ */

/* ---------------- স্কিম ---------------- */
export type SchemeStatus = 'active' | 'closed_new' | 'draft' | 'pending';
export type Scheme = {
  id: string; code: string; name: string; type: 'monthly' | 'daily' | 'term'; typeBn: string;
  version: number; status: SchemeStatus; members: number; total: number; installment: number;
  tenure: number | null; lockIn: number; noticeDays: number; maxPerMonth: number; maxAmount: number;
  minBalance: number; graceDays: number; lateFee: number; extra: boolean; desc: string;
  fees: { admission: number; annual: number; withdrawal: number };
  closedNewOn?: string; closedReason?: string;
};
export const SCH_STATUS: Record<SchemeStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' | 'info' }> = {
  active: { t: 'চালু', tone: 'ok' },
  closed_new: { t: 'নতুন নামভর্তি বন্ধ', tone: 'warn' },
  draft: { t: 'খসড়া', tone: 'neutral' },
  pending: { t: 'অনুমোদনের অপেক্ষায়', tone: 'info' },
};
export const SEED_SCHEMES: Scheme[] = [
  { id: 'sc1', code: 'MS-01', name: 'মাসিক সঞ্চয়', type: 'monthly', typeBn: 'মাসিক', version: 4, status: 'active',
    members: 118, total: 2840000, installment: 1000, tenure: null, lockIn: 6, noticeDays: 15, maxPerMonth: 2,
    maxAmount: 50000, minBalance: 5000, graceDays: 10, lateFee: 20, extra: true,
    desc: 'প্রতি মাসে নির্দিষ্ট কিস্তি; মেয়াদ নেই, তোলার আগে নোটিশ লাগে।',
    fees: { admission: 100, annual: 50, withdrawal: 20 } },
  { id: 'sc2', code: 'TS-03', name: 'মেয়াদি সঞ্চয় (৩ বছর)', type: 'term', typeBn: 'মেয়াদি', version: 2, status: 'active',
    members: 64, total: 1920000, installment: 1000, tenure: 36, lockIn: 6, noticeDays: 7, maxPerMonth: 1,
    maxAmount: 30000, minBalance: 6000, graceDays: 10, lateFee: 25, extra: false,
    desc: '৩৬ কিস্তির মেয়াদি স্কিম — মেয়াদ পূর্ণ হলে জমা ও উত্তোলন চলবে, বাধ্যতামূলক বন্ধ নয় (D-06)।',
    fees: { admission: 100, annual: 50, withdrawal: 20 } },
  { id: 'sc3', code: 'DS-02', name: 'দৈনিক সঞ্চয়', type: 'daily', typeBn: 'দৈনিক', version: 1, status: 'closed_new',
    members: 37, total: 410000, installment: 50, tenure: null, lockIn: 3, noticeDays: 7, maxPerMonth: 4,
    maxAmount: 10000, minBalance: 500, graceDays: 5, lateFee: 10, extra: false,
    desc: 'প্রতিদিনের ছোট সঞ্চয় — সংগ্রহক রুটে গিয়ে আদায় করেন।',
    fees: { admission: 50, annual: 30, withdrawal: 10 },
    closedNewOn: '2026-09-01', closedReason: 'নতুন রুটে সংগ্রহকের ঘাটতি — বিদ্যমান ৩৭ জনের কিস্তি চলবে' },
  { id: 'sc4', code: 'YS-01', name: 'যুব সঞ্চয়', type: 'monthly', typeBn: 'মাসিক', version: 1, status: 'draft',
    members: 0, total: 0, installment: 500, tenure: 24, lockIn: 3, noticeDays: 7, maxPerMonth: 1,
    maxAmount: 15000, minBalance: 1000, graceDays: 10, lateFee: 20, extra: false,
    desc: '১৮–৩৫ বছর বয়সী সদস্যের জন্য — কমিটির অনুমোদনের অপেক্ষায় (D-34)।',
    fees: { admission: 50, annual: 30, withdrawal: 10 } },
];
export const schemeById = (list: Scheme[], id?: string | null) => list.find((s) => s.id === id);

export type SchemeDiff = { f: string; old: string; neu: string; locked: boolean; impact: string };
export const SEED_SDIFF: SchemeDiff[] = [
  { f: 'লক-ইন (মাস)', old: '৩', neu: '৬', locked: false, impact: 'নতুন অ্যাকাউন্টে ৬ মাস প্রযোজ্য; বিদ্যমান অ্যাকাউন্ট অপরিবর্তিত' },
  { f: 'নোটিশ পিরিয়ড (দিন)', old: '৭', neu: '১৫', locked: false, impact: 'D-02 ডিফল্ট ৭ দিনের বেশি — কমিটির সিদ্ধান্ত বাধ্যতামূলক' },
  { f: 'বিলম্ব ফি (৳)', old: '২০', neu: '২৫', locked: false, impact: 'D-08 ডিফল্ট থেকে সরে যাওয়া; বার্ষিক সীমা ৳২০০ অটুট' },
  { f: 'কিস্তির পরিমাণ (৳)', old: '১০০০', neu: '১০০০', locked: true, impact: 'পরিবর্তন নেই — চালু স্কিমে লকড' },
  { f: 'স্কিম কোড', old: 'MS-01', neu: 'MS-01', locked: true, impact: 'পরিবর্তন নেই — রসিদ ও অ্যাকাউন্ট নম্বরে ব্যবহৃত' },
  { f: 'সুদের হার', old: 'নেই', neu: 'নেই', locked: true, impact: 'ক্ষেত্রটি ডেটা মডেলেই নেই (BR-13/D-01)' },
];

/* ---------------- ব্যাচ (AM-22) ---------------- */
export type BatchStatus = 'validating' | 'partial' | 'posted' | 'failed';
export const BATCH_STATUS: Record<BatchStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  validating: { t: 'যাচাই চলছে', tone: 'info' },
  partial: { t: 'আংশিক', tone: 'warn' },
  posted: { t: 'পোস্ট হয়েছে', tone: 'ok' },
  failed: { t: 'ব্যর্থ', tone: 'danger' },
};
export type Batch = {
  id: string; no: string; rows: number; valid: number; dup: number; amount: number; status: BatchStatus;
  by: string; route: string; at: string; progress: number; txn: string;
  errors: { r: number; why: string }[];
};
export const SEED_BATCHES: Batch[] = [
  { id: 'bt5', no: 'BATCH-2610-05', rows: 46, valid: 46, dup: 0, amount: 46000, status: 'validating', by: 'রাজু মিয়া', route: 'R1', at: 'আজ ৯:১২', progress: 62, txn: '', errors: [] },
  { id: 'bt4', no: 'BATCH-2610-04', rows: 38, valid: 35, dup: 2, amount: 35000, status: 'partial', by: 'সালমা খাতুন', route: 'R2', at: 'আজ ৮:৪০', progress: 100, txn: '',
    errors: [{ r: 7, why: 'সদস্য নম্বর পাওয়া যায়নি' }, { r: 19, why: 'অঙ্ক ০ — ফাঁকা ঘর' }, { r: 31, why: 'একই সদস্য, একই তারিখ, একই অঙ্ক (ডুপ্লিকেট)' }] },
  { id: 'bt3', no: 'BATCH-2610-03', rows: 52, valid: 52, dup: 0, amount: 52000, status: 'posted', by: 'হাবিবুর রহমান', route: 'R3', at: 'গতকাল ৯:০৫', progress: 100, txn: 'TXN-8841', errors: [] },
];
export const batchTotals = (list: Batch[]) => ({
  rows: list.reduce((s, b) => s + b.rows, 0),
  valid: list.reduce((s, b) => s + b.valid, 0),
  dup: list.reduce((s, b) => s + b.dup, 0),
  amount: list.reduce((s, b) => s + b.amount, 0),
});

/* ---------------- ইমপোর্ট (AM-23) ---------------- */
export type ImportStatus = 'dry_run' | 'committed' | 'parse_error' | 'rolled_back';
export const IMPORT_STATUS: Record<ImportStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  dry_run: { t: 'ড্রাই-রান', tone: 'warn' },
  committed: { t: 'কমিট হয়েছে', tone: 'ok' },
  parse_error: { t: 'ফাইল পড়া যায়নি', tone: 'danger' },
  rolled_back: { t: 'ফেরত নেওয়া', tone: 'neutral' },
};
export type ImportFile = {
  id: string; file: string; by: string; at: string; size: string; rows: number; valid: number;
  invalid: number; dup: number; amount: number; effect: string; mapping: string; status: ImportStatus; err?: string;
};
export const SEED_IMPORTS: ImportFile[] = [
  { id: 'im3', file: 'purano-khata-2024-oct.xlsx', by: 'নাসরিন আক্তার', at: 'আজ ১০:০২', size: '৩১০ KB', rows: 214, valid: 209,
    invalid: 5, dup: 3, amount: 209000, effect: '২০৯টি কিস্তি যোগ হবে (৳২,০৯,০০০)', mapping: '৯টি কলাম → ৯টি ফিল্ড', status: 'dry_run' },
  { id: 'im2', file: 'kisti-sep-2026.csv', by: 'রাজু মিয়া', at: '২৮ অক্টো', size: '৯৪ KB', rows: 176, valid: 176,
    invalid: 0, dup: 2, amount: 176000, effect: '১৭৪টি কিস্তি পোস্ট হয়েছে', mapping: '৭টি কলাম → ৭টি ফিল্ড', status: 'committed' },
  { id: 'im1', file: 'scan-old-book.xls', by: 'সালমা খাতুন', at: '২৫ অক্টো', size: '২.১ MB', rows: 0, valid: 0,
    invalid: 0, dup: 0, amount: 0, effect: '—', mapping: '—', status: 'parse_error', err: 'শিটের নাম পাওয়া যায়নি — ফাইলটি সম্ভবত স্ক্যান করা ছবি' },
];
export const IMPORT_MAP: [string, string][] = [
  ['সদস্য নাম', 'member_name'], ['মোবাইল', 'mobile'], ['কিস্তি নং', 'installment_no'],
  ['তারিখ', 'paid_on'], ['অঙ্ক (৳)', 'amount_paisa ×100'], ['রসিদ নং', 'receipt_no'],
  ['সংগ্রহক', 'collector_id'], ['স্কিম', 'scheme_code'], ['মন্তব্য', 'note'],
];

/* ---------------- রিকনসিলিয়েশন (AM-21) ---------------- */
export type ReconStatement = { src: string; file: string; uploadedAt: string; rows: number; matched: number; diff: number };
export type Recon = {
  period: string; source: string; sysTotal: number; extTotal: number; diff: number;
  matched: number; unmatched: number; suspense: number; signedOff: boolean;
  status: 'in_progress' | 'signed_off'; statements: ReconStatement[];
};
export const SEED_RECON: Recon = {
  period: 'অক্টোবর ২০২৬', source: 'বিকাশ স্টেটমেন্ট', sysTotal: 1284500, extTotal: 1282500, diff: 2000,
  matched: 412, unmatched: 6, suspense: 2, signedOff: false, status: 'in_progress',
  statements: [
    { src: 'বিকাশ', file: 'bkash-oct-2026.csv', uploadedAt: 'আজ ৮:১৫', rows: 340, matched: 336, diff: 2000 },
    { src: 'ব্যাংক', file: 'bank-oct-2026.csv', uploadedAt: 'আজ ৮:২০', rows: 78, matched: 76, diff: 0 },
  ],
};
export const reconPct = (r: Recon) => Math.round((r.matched / Math.max(1, r.matched + r.unmatched)) * 100);

export type ReconEx = {
  id: string; kind: 'amount_diff' | 'dup' | 'missing'; kindBn: string; txn: string; member: string;
  date: string; amount: number; cause: string; action: string;
  status: 'open' | 'suspense' | 'resolved'; resolvedAt?: string; by?: string;
};
export const RECON_KIND: Record<ReconEx['kind'], { t: string; tone: 'ok' | 'warn' | 'danger' }> = {
  amount_diff: { t: 'অঙ্কের পার্থক্য', tone: 'warn' },
  dup: { t: 'ডুপ্লিকেট', tone: 'danger' },
  missing: { t: 'স্টেটমেন্টে নেই', tone: 'warn' },
};
export const SEED_RECON_EX: ReconEx[] = [
  { id: 'ex1', kind: 'amount_diff', kindBn: 'অঙ্কের পার্থক্য', txn: 'TXN-8832', member: 'মর্জিনা বেগম', date: '২০২৬-১০-২৮', amount: 2000,
    cause: 'সিস্টেমে ৳৫,০০০, বিকাশ স্টেটমেন্টে ৳৩,০০০', action: 'সংশোধন প্রস্তাব → AM-14', status: 'open' },
  { id: 'ex2', kind: 'dup', kindBn: 'ডুপ্লিকেট এন্ট্রি', txn: 'TXN-8827', member: 'আব্দুল ওয়াদুদ', date: '২০২৬-১০-২৭', amount: 1000,
    cause: 'একই রসিদে দুইবার পোস্ট', action: 'উল্টো এন্ট্রি (reversal) — ডিলিট নয়', status: 'suspense' },
  { id: 'ex3', kind: 'missing', kindBn: 'স্টেটমেন্টে নেই', txn: 'TXN-8819', member: 'জাহাঙ্গীর হোসেন', date: '২০২৬-১০-২৫', amount: 1500,
    cause: 'স্টেটমেন্টে লেনদেন নেই, সিস্টেমে আছে', action: 'সাসপেন্স খাতায় (H10) রেখে তদন্ত', status: 'open' },
];
export const RECON_DEFAULT = { id: 'ex3', kind: 'amount_diff' as ReconEx['kind'], kindBn: 'অঙ্কের পার্থক্য', txn: 'TXN-8832', member: 'মর্জিনা বেগম', date: '২০২৬-১০-২৮', amount: 2000, cause: '', action: '', status: 'open' as ReconEx['status'] };

/* ---------------- আর্থিক বিবরণী (AM-24) ---------------- */
export type FinRow = { h: string; cur: number; prev: number };
export const FIN = { fy: '২০২৫–২৬', period: '১ জুলাই – ৩০ জুন', closed: false, trialOk: true, signedOff: false };
export const FIN_INCOME: FinRow[] = [
  { h: 'ভর্তি ফি', cur: 28000, prev: 21000 },
  { h: 'বার্ষিক চাঁদা', cur: 42000, prev: 36000 },
  { h: 'উত্তোলন ফি', cur: 18000, prev: 15000 },
  { h: 'বিলম্ব ফি (নির্ধারিত ফি, সুদ নয়)', cur: 26000, prev: 19000 },
  { h: 'ওয়ালেট কমিশন', cur: 9000, prev: 6000 },
];
export const FIN_EXPENSE: FinRow[] = [
  { h: 'স্টাফ বেতন', cur: 96000, prev: 84000 },
  { h: 'অফিস ভাড়া ও বিদ্যুৎ', cur: 24000, prev: 22000 },
  { h: 'SMS ও যোগাযোগ', cur: 12000, prev: 9000 },
  { h: 'স্টেশনারি ও ছাপা', cur: 7000, prev: 6000 },
  { h: 'ব্যাংক চার্জ', cur: 3000, prev: 2500 },
];
export const FIN_BS_ASSET: FinRow[] = [
  { h: 'ব্যাংক ও নগদ', cur: 1480000, prev: 1196000 },
  { h: 'সদস্য ঋণ (QH)', cur: 210000, prev: 150000 },
  { h: 'অগ্রিম ও অন্যান্য', cur: 34000, prev: 26000 },
];
export const FIN_BS_LIAB: FinRow[] = [
  { h: 'সদস্যের সঞ্চয়', cur: 1588000, prev: 1290000 },
  { h: 'সঞ্চিতি ও তহবিল', cur: 98000, prev: 70000 },
  { h: 'সমিতির মূলধন', cur: 38000, prev: 2000 },
];
export const FIN_CASHFLOW: FinRow[] = [
  { h: 'সদস্য জমা', cur: 520000, prev: 400000 },
  { h: 'সদস্য উত্তোলন', cur: -380000, prev: -300000 },
  { h: 'ফি ও চাঁদা', cur: 123000, prev: 97000 },
  { h: 'পরিচালন ব্যয়', cur: -142000, prev: -123500 },
];
export const FIN_SCHEME = [
  { s: 'sc1', members: 118, collected: 2840000, dues: 24000, bal: 2840000 },
  { s: 'sc2', members: 64, collected: 1920000, dues: 12000, bal: 1920000 },
  { s: 'sc3', members: 37, collected: 410000, dues: 5000, bal: 410000 },
];
export const FIN_MEMBERS = { total: 219, open: 219, joined: 24, dormant: 9, exited: 3, deceased: 1 };
export type ReturnRow = { code: string; name: string; fy: string; at?: string; by?: string; fmt: string; status: 'ready' | 'pending' | 'open' };
export const RETURN_STATUS: Record<ReturnRow['status'], { t: string; tone: 'ok' | 'warn' | 'info' }> = {
  ready: { t: 'প্রস্তুত', tone: 'ok' }, pending: { t: 'অসম্পূর্ণ', tone: 'warn' }, open: { t: 'খোলা সিদ্ধান্ত', tone: 'info' },
};
export const SEED_RETURNS: ReturnRow[] = [
  { code: 'R-01', name: 'বার্ষিক আয়-ব্যয় বিবরণী', fy: '২০২৫–২৬', at: '২০২৬-১০-২০', by: 'কামরুল হাসান', fmt: 'সমবায় অধিদপ্তর ছক ১', status: 'ready' },
  { code: 'R-02', name: 'উদ্বৃত্তপত্র ও সম্পদ-দায়', fy: '২০২৫–২৬', at: '২০২৬-১০-২০', by: 'কামরুল হাসান', fmt: 'ছক ২ (ফরম্যাট ⚠️)', status: 'pending' },
  { code: 'R-04', name: 'সদস্য ও সঞ্চয় পরিসংখ্যান', fy: '২০২৫–২৬', fmt: 'ছক ৪ — ফরম্যাট নিশ্চিত নয়', status: 'open' },
];
export const incomeTotal = (rows: FinRow[]) => rows.reduce((s, r) => s + r.cur, 0);
export const financeTotals = () => {
  const inc = incomeTotal(FIN_INCOME), exp = incomeTotal(FIN_EXPENSE);
  const asset = incomeTotal(FIN_BS_ASSET), liab = incomeTotal(FIN_BS_LIAB);
  return { inc, exp, surplus: inc - exp, asset, liab, balanced: asset === liab, incPrev: incomeTotal(FIN_INCOME.map((r) => ({ ...r, cur: r.prev }))), expPrev: incomeTotal(FIN_EXPENSE.map((r) => ({ ...r, cur: r.prev }))) };
};

/* ---------------- রিপোর্ট (AM-25) ---------------- */
export type Report = { g: string; code: string; name: string; params: string[]; time: string; fmt: string[]; roles: string };
export const SEED_REPORTS: Report[] = [
  { g: 'দৈনিক', code: 'DR-01', name: 'দিনশেষ ক্যাশ সামারি', params: ['তারিখ', 'রুট'], time: '৫ সেকেন্ড', fmt: ['PDF', 'Excel'], roles: 'COLLECTOR · ACCOUNTANT' },
  { g: 'দৈনিক', code: 'DR-02', name: 'আজকের আদায় ও বকেয়া', params: ['তারিখ'], time: '৮ সেকেন্ড', fmt: ['PDF'], roles: 'MANAGER · ACCOUNTANT' },
  { g: 'সদস্য', code: 'MR-01', name: 'সদস্য তালিকা ও KYC', params: ['রুট', 'অবস্থা'], time: '১২ সেকেন্ড', fmt: ['PDF', 'Excel'], roles: 'MANAGER · ORG_ADMIN' },
  { g: 'সদস্য', code: 'MR-03', name: 'নমিনি ও দাবি প্রস্তুতি', params: ['স্কিম'], time: '১০ সেকেন্ড', fmt: ['PDF'], roles: 'ORG_ADMIN' },
  { g: 'সঞ্চয়', code: 'SR-01', name: 'স্কিমভিত্তিক সঞ্চয় বিবরণী', params: ['স্কিম', 'মাস'], time: '১৫ সেকেন্ড', fmt: ['PDF', 'Excel'], roles: 'MANAGER · AUDITOR' },
  { g: 'সঞ্চয়', code: 'SR-04', name: 'কিস্তি পরিশোধের ইতিহাস', params: ['সদস্য', 'স্কিম'], time: '৯ সেকেন্ড', fmt: ['PDF'], roles: 'ACCOUNTANT · MANAGER' },
  { g: 'বকেয়া', code: 'AR-01', name: 'বকেয়া বয়স বিশ্লেষণ (ageing)', params: ['রুট', 'ব্যান্ড'], time: '২০ সেকেন্ড', fmt: ['PDF', 'Excel'], roles: 'MANAGER' },
  { g: 'বকেয়া', code: 'AR-02', name: 'বিলম্ব ফি ও মওকুফ তালিকা', params: ['মাস'], time: '১১ সেকেন্ড', fmt: ['PDF'], roles: 'MANAGER · AUDITOR' },
  { g: 'আর্থিক', code: 'FR-01', name: 'ট্রায়াল ব্যালেন্স', params: ['অর্থবছর', 'মাস'], time: '১৮ সেকেন্ড', fmt: ['PDF', 'Excel'], roles: 'ACCOUNTANT · AUDITOR' },
  { g: 'আর্থিক', code: 'FR-02', name: 'আয়-ব্যয় ও উদ্বৃত্তপত্র', params: ['অর্থবছর'], time: '২২ সেকেন্ড', fmt: ['PDF'], roles: 'ORG_ADMIN · AUDITOR' },
  { g: 'নিরীক্ষা', code: 'AU-01', name: 'অডিট লগ এক্সপোর্ট', params: ['সময়', 'ক্রিয়া'], time: '৩০ সেকেন্ড', fmt: ['CSV'], roles: 'AUDITOR · EXTERNAL_AUDITOR' },
  { g: 'নিরীক্ষা', code: 'AU-03', name: 'সংশোধন ও রিভার্সাল তালিকা', params: ['মাস'], time: '১৪ সেকেন্ড', fmt: ['PDF', 'CSV'], roles: 'AUDITOR' },
  { g: 'রেগুলেটরি', code: 'RG-01', name: 'সমবায় অধিদপ্তর রিটার্ন প্যাক', params: ['অর্থবছর'], time: '৪০ সেকেন্ড', fmt: ['PDF'], roles: 'ORG_ADMIN' },
];
export const reportGroups = (list: Report[]) => {
  const out: { g: string; items: Report[] }[] = [];
  list.forEach((r) => { let g = out.find((x) => x.g === r.g); if (!g) { g = { g: r.g, items: [] }; out.push(g); } g.items.push(r); });
  return out;
};
export type ReportRun = { id: string; name: string; code: string; by: string; fmt: string; size: string; at: string; status: 'ready' | 'running' | 'failed'; err?: string };
export const SEED_REPORT_RUNS: ReportRun[] = [
  { id: 'rr1', name: 'বকেয়া বয়স বিশ্লেষণ', code: 'AR-01', by: 'কামরুল হাসান', fmt: 'PDF', size: '—', at: 'আজ ১০:৩১', status: 'running' },
  { id: 'rr2', name: 'দিনশেষ ক্যাশ সামারি', code: 'DR-01', by: 'রাজু মিয়া', fmt: 'Excel', size: '৮৪ KB', at: 'আজ ৯:০৫', status: 'ready' },
  { id: 'rr3', name: 'ট্রায়াল ব্যালান্স', code: 'FR-01', by: 'নাসরিন আক্তার', fmt: 'PDF', size: '—', at: 'গতকাল ১৮:১২', status: 'failed', err: 'রেঞ্জ খুব বড় (২ বছর) — ছোট রেঞ্জে চেষ্টা করুন' },
];

/* ---------------- রুট (AM-31) ---------------- */
export type RouteRow = {
  id: string; name: string; area: string; collector: string; mobile: string; day: string;
  members: number; unassigned: number; target: number; collected: number; dues: number;
  overdueAmt: number; cashInHand: number; load: 'ok' | 'over';
};
export const SEED_ROUTES: RouteRow[] = [
  { id: 'R1', name: 'কেশবপুর সদর', area: 'কেশবপুর', collector: 'রাজু মিয়া', mobile: '01711000001', day: 'শনি · সোম · বুধ', members: 96, unassigned: 0, target: 96000, collected: 74200, dues: 11, overdueAmt: 11000, cashInHand: 18400, load: 'ok' },
  { id: 'R2', name: 'ঝিকরগাছা', area: 'ঝিকরগাছা', collector: 'সালমা খাতুন', mobile: '01711000002', day: 'রবি · মঙ্গল · বৃহস্পতি', members: 74, unassigned: 0, target: 74000, collected: 41000, dues: 14, overdueAmt: 14000, cashInHand: 9600, load: 'ok' },
  { id: 'R3', name: 'হরিণাকুণ্ডু', area: 'হরিণাকুণ্ডু', collector: 'হাবিবুর রহমান', mobile: '01711000003', day: 'রবি · মঙ্গল · বৃহস্পতি', members: 49, unassigned: 3, target: 49000, collected: 16400, dues: 9, overdueAmt: 9000, cashInHand: 4100, load: 'over' },
];
export const routeTotals = (list: RouteRow[]) => ({
  target: list.reduce((s, r) => s + r.target, 0),
  collected: list.reduce((s, r) => s + r.collected, 0),
  members: list.reduce((s, r) => s + r.members, 0),
  unassigned: list.reduce((s, r) => s + r.unassigned, 0),
  dues: list.reduce((s, r) => s + r.dues, 0),
  overdueAmt: list.reduce((s, r) => s + r.overdueAmt, 0),
});
export type UnassignedMember = { name: string; village: string; near: string; memberId: string };
export const SEED_UNASSIGNED: UnassignedMember[] = [
  { name: 'জাহাঙ্গীর হোসেন', village: 'হরিণাকুণ্ডু', near: 'R3', memberId: 'm2' },
  { name: 'মর্জিনা বেগম', village: 'চন্দ্রপুর', near: 'R3', memberId: 'm3' },
  { name: 'আব্দুল ওয়াদুদ', village: 'হরিণাকুণ্ডু', near: 'R3', memberId: 'm4' },
];

/* ---------------- রিমাইন্ডার (AM-32) ---------------- */
export type Template = { id: string; code: string; name: string; channel: string[]; trigger: string; body: string; on: boolean; sent: number; delivered: number; failed: number; cost: number };
export const SEED_TEMPLATES: Template[] = [
  { id: 'tp1', code: 'TPL-DUE-01', name: 'কিস্তি বকেয়া স্মারক', channel: ['SMS', 'Push'], trigger: 'গ্রেস ৩ দিন পরে', on: true, sent: 320, delivered: 314, failed: 6, cost: 640,
    body: 'প্রিয় {{name}}, {{month}} মাসের কিস্তি ৳{{amount}} বাকি আছে। অনুগ্রহ করে {{route}} রুটের সংগ্রহকের সাথে যোগাযোগ করুন।' },
  { id: 'tp2', code: 'TPL-RCPT-01', name: 'জমার রসিদ', channel: ['SMS'], trigger: 'জমা পোস্টের সঙ্গে সঙ্গে', on: true, sent: 1840, delivered: 1826, failed: 14, cost: 3680,
    body: '৳{{amount}} জমা পেয়েছি। রসিদ {{receipt}}। ধন্যবাদ — {{org}}।' },
  { id: 'tp3', code: 'TPL-WD-01', name: 'উত্তোলন অনুমোদন', channel: ['SMS', 'Push'], trigger: 'অনুমোদনের পরে', on: true, sent: 96, delivered: 95, failed: 1, cost: 192,
    body: 'আপনার ৳{{amount}} উত্তোলন অনুমোদিত। ভাউচার {{voucher}} নিয়ে {{branch}} শাখায় আসুন।' },
  { id: 'tp4', code: 'TPL-DUE-02', name: 'বিলম্ব ফি নোটিশ', channel: ['SMS'], trigger: 'গ্রেস শেষ, ফি বসানোর পরে', on: false, sent: 42, delivered: 40, failed: 2, cost: 84,
    body: '{{month}} মাসের কিস্তিতে ৳২০ বিলম্ব ফি (সুদ নয়) যোগ হয়েছে। মোট বাকি ৳{{amount}}।' },
  { id: 'tp5', code: 'TPL-AGM-01', name: 'সাধারণ সভার নোটিশ', channel: ['SMS', 'Push'], trigger: 'ম্যানুয়াল', on: false, sent: 0, delivered: 0, failed: 0, cost: 0,
    body: '{{org}}-এর সাধারণ সভা {{date}}, {{time}}-এ {{venue}}। উপস্থিত থাকার অনুরোধ রইল।' },
];
export const templateTotals = (list: Template[]) => ({
  sent: list.reduce((s, t) => s + t.sent, 0),
  failed: list.reduce((s, t) => s + t.failed, 0),
  cost: list.reduce((s, t) => s + t.cost, 0),
  on: list.filter((t) => t.on).length,
});
export const SEED_SMS = { balance: 486, perSms: 2, lowAt: 100, validNumbers: 214, invalidNumbers: 3 };
export type DeliveryLog = { tpl: string; at: string; by: string; sent: number; delivered: number; failed: number; failList?: string };
export const SEED_DELIVERY: DeliveryLog[] = [
  { tpl: 'TPL-RCPT-01', at: 'আজ ৯:০৪', by: 'সিস্টেম', sent: 46, delivered: 46, failed: 0 },
  { tpl: 'TPL-DUE-01', at: 'আজ ৮:০০', by: 'সিস্টেম', sent: 62, delivered: 59, failed: 3, failList: '৩টি নম্বরে পৌঁছায়নি — মর্জিনা বেগম · জাহাঙ্গীর হোসেন · সংখ্যা বন্ধ' },
];
export const SEED_OPTOUT = [{ name: 'আব্দুল ওয়াদুদ', why: 'বিপণন SMS বন্ধ' }];

/* ---------------- সেটিংস (AM-33) ---------------- */
export type SettingItem = { key: string; t: string; d: string; ok: boolean; v: string; locked?: boolean };
export type SettingsGroup = { g: string; icon: string; items: SettingItem[] };
export const SEED_SETTINGS: SettingsGroup[] = [
  { g: 'সংস্থা ও পরিচয়', icon: 'building', items: [
    { key: 'org.name', t: 'সমিতির নাম', d: 'রসিদ, রিপোর্ট ও নোটিশে যাবে', ok: true, v: 'কেশবপুর সমবায় সমিতি' },
    { key: 'org.reg', t: 'নিবন্ধন নম্বর', d: 'সমবায় অধিদপ্তরের নিবন্ধন', ok: true, v: 'খুলনা-২৩৪/২০১৯' },
    { key: 'org.fy', t: 'অর্থবছর শুরু', d: 'D-15 · ১ জুলাই – ৩০ জুন', ok: true, v: '১ জুলাই' },
  ] },
  { g: 'অনুমোদন ও সীমা', icon: 'shield', items: [
    { key: 'limit.collector', t: 'COLLECTOR সীমা', d: 'D-22 · এর বেশি হলে MANAGER', ok: true, v: '৳২০,০০০' },
    { key: 'limit.accountant', t: 'ACCOUNTANT সীমা', d: 'D-22', ok: true, v: '৳৫০,০০০' },
    { key: 'limit.manager', t: 'MANAGER সীমা', d: 'D-22', ok: true, v: '৳১,০০,০০০' },
    { key: 'makerchecker', t: 'maker ≠ checker', d: 'BR-04 · লকড নীতি', ok: true, v: 'সবসময় চালু', locked: true },
  ] },
  { g: 'ফি ও চার্জ', icon: 'file', items: [
    { key: 'fee.admission', t: 'ভর্তি ফি', d: 'D-05 · নতুন সদস্য', ok: true, v: '৳১০০' },
    { key: 'fee.annual', t: 'বার্ষিক চাঁদা', d: 'D-05', ok: true, v: '৳৫০' },
    { key: 'fee.withdrawal', t: 'উত্তোলন ফি', d: 'D-05 · ৳১০,০০০-এর বেশি হলে', ok: true, v: '৳২০' },
    { key: 'fee.late', t: 'বিলম্ব ফি', d: 'D-08 · সুদ নয় · বছরে সর্বোচ্চ ৳২০০', ok: true, v: '৳২০' },
    { key: 'fee.interest', t: 'সুদ / মুনাফা', d: 'D-01 · লকড — ক্ষেত্রই নেই', ok: true, v: 'নিষ্ক্রিয় (লকড)', locked: true },
  ] },
  { g: 'যোগাযোগ ও SMS', icon: 'bell', items: [
    { key: 'sms.balance', t: 'SMS ব্যালেন্স', d: 'নিচে পড়লে রিমাইন্ডার বন্ধ', ok: false, v: '৳৪৮৬ (কম)', locked: false },
    { key: 'sms.number', t: 'প্রেরকের নম্বর', d: 'মাস্কিং', ok: true, v: 'সমিতি-নাম' },
  ] },
  { g: 'নম্বর ও আর্কাইভ', icon: 'archive', items: [
    { key: 'no.pattern', t: 'সদস্য নম্বর', d: 'RSS-YYMM-####', ok: true, v: 'চালু' },
    { key: 'archive.years', t: 'আর্কাইভ মেয়াদ', d: 'D-30 · কমানোর UI নেই', ok: true, v: '৮ বছর', locked: true },
  ] },
];
export type SetupCheck = { t: string; ok: boolean };
export const SEED_SETUP: SetupCheck[] = [
  { t: 'সমিতির নাম ও নিবন্ধন নম্বর', ok: true },
  { t: 'অর্থবছর ও ছুটির ক্যালেন্ডার', ok: true },
  { t: 'অনুমোদন সীমা (D-22)', ok: true },
  { t: 'ফি ও বিলম্ব ফি (D-05/D-08)', ok: true },
  { t: 'SMS ব্যালেন্স ও প্রেরকের নম্বর', ok: false },
  { t: 'রেগুলেটরি রিটার্নের ছক নিশ্চিত (D-29)', ok: false },
];
export const settingsTotals = (groups: SettingsGroup[]) => ({
  items: groups.reduce((s, g) => s + g.items.length, 0),
  locked: groups.reduce((n, g) => n + g.items.filter((i) => i.locked).length, 0),
});
export const SEED_TOGGLES: { key: string; t: string; d: string; on: boolean }[] = [
  { key: 'open.admission', t: 'নতুন নামভর্তি খোলা', d: 'বন্ধ করলে M-03-এ আবেদন নেওয়া হবে না', on: true },
  { key: 'self.apply', t: 'সেলফ-সার্ভিস আবেদন (অ্যাপ)', d: 'D-18 · সদস্য নিজেই আবেদন করতে পারবেন', on: true },
  { key: 'offline.entry', t: 'অফলাইন এন্ট্রি (সংগ্রহক)', d: 'বন্ধ করলে সংযোগ ছাড়া কোনো এন্ট্রি হবে না', on: true },
  { key: 'quiet.hours', t: 'নিরব ঘণ্টা (রাত ৯টা – সকাল ৮টা)', d: 'শুধু নিরাপত্তা ও আইনি বার্তা যাবে', on: true },
  { key: 'auto.dormant', t: 'স্বয়ংক্রিয় dormant চিহ্নিতকরণ', d: '৯০ দিন বকেয়া হলে (D-07)', on: true },
  { key: 'feature.flag', t: 'পরীক্ষামূলক ফিচার (Feature flag)', d: 'দেখতে পাবেন শুধু ORG_ADMIN', on: false },
];

/* ---------------- স্টাফ (AM-34) ---------------- */
export type StaffStatus = 'active' | 'suspended' | 'invited' | 'timeboxed';
export const STAFF_STATUS: Record<StaffStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'info' }> = {
  active: { t: 'সক্রিয়', tone: 'ok' }, suspended: { t: 'নিষ্ক্রিয়', tone: 'danger' },
  invited: { t: 'আমন্ত্রিত', tone: 'warn' }, timeboxed: { t: 'মেয়াদি', tone: 'info' },
};
export type Staff = { id: string; name: string; role: string; roleBn: string; mobile: string; scope: string; status: StaffStatus; since?: string; invitedAt?: string; last?: string; note?: string; limit: number | null };
export const SEED_STAFF: Staff[] = [
  { id: 'u1', name: 'কামরুল হাসান', role: 'ORG_ADMIN', roleBn: 'সমিতি প্রশাসক', mobile: '01711000010', scope: 'সব শাখা', status: 'active', since: '২০২৪-০১-০৫', last: '২০২৬-১০-৩১ ১০:১২', limit: null },
  { id: 'u2', name: 'নাসরিন আক্তার', role: 'MANAGER', roleBn: 'ব্যবস্থাপক', mobile: '01711000011', scope: 'কেশবপুর + ঝিকরগাছা', status: 'active', since: '২০২৪-০৩-১১', last: '২০২৬-১০-৩১ ০৯:৪০', limit: 100000 },
  { id: 'u3', name: 'রাজু মিয়া', role: 'COLLECTOR', roleBn: 'মাঠ সংগ্রহক', mobile: '01711000001', scope: 'R1', status: 'active', since: '২০২৫-০২-০১', last: '২০২৬-১০-৩১ ০৮:৫৫', limit: 20000 },
  { id: 'u4', name: 'সালমা খাতুন', role: 'COLLECTOR', roleBn: 'মাঠ সংগ্রহক', mobile: '01711000002', scope: 'R2', status: 'timeboxed', since: '২০২৬-০৪-০১', last: '২০২৬-১০-৩১ ০৯:০২', note: '৬ মাসের চুক্তি — ডিসেম্বরে নবায়ন', limit: 20000 },
  { id: 'u5', name: 'হাবিবুর রহমান', role: 'AUDITOR', roleBn: 'অভ্যন্তরীণ নিরীক্ষক', mobile: '01711000012', scope: 'সব শাখা (শুধু পঠন)', status: 'suspended', since: '২০২৪-০৬-১৫', last: '২০২৬-১০-১২ ১৪:৩০', note: 'তদন্তাধীন — সেশন বাতিল হয়েছে', limit: 0 },
  { id: 'u6', name: 'মোঃ আব্দুল্লাহ', role: 'ACCOUNTANT', roleBn: 'হিসাবরক্ষক', mobile: '01711000013', scope: 'কেশবপুর', status: 'invited', invitedAt: '২০২৬-১০-২৯', limit: 50000 },
];
export const ROLE_BY_NAME: Record<string, string> = { ORG_ADMIN: 'সমিতি প্রশাসক', MANAGER: 'ব্যবস্থাপক', APPROVER: 'অনুমোদনকারী কর্তৃপক্ষ', ACCOUNTANT: 'হিসাবরক্ষক', COLLECTOR: 'মাঠ সংগ্রহক', AUDITOR: 'নিরীক্ষক' };
export const PERM_ROLES = ['ORG_ADMIN', 'MANAGER', 'ACCOUNTANT', 'COLLECTOR', 'AUDITOR', 'EXTERNAL_AUDITOR'];
/* CRUDA: C=তৈরি, R=পড়া, U=হালনাগাদ, D=soft-delete, A=অনুমোদন — ভূমিকা অনুযায়ী */
export const PERM_MATRIX = [
  { e: 'সদস্য ও KYC', c: ['CRUDA', 'CRUA', 'CRU', 'CR', 'R', 'R'] },
  { e: 'সঞ্চয় অ্যাকাউন্ট', c: ['CRUDA', 'CRUA', 'CRU', 'CR', 'R', 'R'] },
  { e: 'জমা ও কিস্তি', c: ['CRUDA', 'CRUA', 'CRUA', 'CR', 'R', '—'] },
  { e: 'উত্তোলন ও নিষ্পত্তি', c: ['CRUDA', 'CRUA', 'CRU', 'CR', 'R', 'R'] },
  { e: 'ক্যাশ ও দিনশেষ', c: ['CRUDA', 'CRUA', 'CRU', 'CRU', 'R', '—'] },
  { e: 'স্কিম নীতি', c: ['CRUDA', 'CRU', 'R', '—', 'R', 'R'] },
  { e: 'স্টাফ ও ভূমিকা', c: ['CRUDA', 'R', '—', '—', 'R', '—'] },
  { e: 'রিপোর্ট ও রিটার্ন', c: ['CRUDA', 'CRU', 'CR', 'R', 'R', 'R'] },
  { e: 'অডিট লগ', c: ['R', 'R', '—', '—', 'R', 'R'] },
];
export const LIMIT_MATRIX = [
  { r: 'COLLECTOR', amt: 20000, note: 'এর বেশি হলে MANAGER-এ escalate' },
  { r: 'ACCOUNTANT', amt: 50000, note: 'দৈনিক ক্যাশ এন্ট্রি' },
  { r: 'MANAGER', amt: 100000, note: 'D-22 ডিফল্ট' },
  { r: 'APPROVER', amt: 200000, note: 'এর বেশি ORG_ADMIN' },
  { r: 'ORG_ADMIN', amt: null, note: 'সীমা নেই — তবে একা সিদ্ধান্ত নয়' },
  { r: 'AUDITOR', amt: 0, note: 'শুধু পঠন' },
];
export type AccessLog = { who: string; what: string; at: string; role: string; dev: string; ip: string; ok: boolean; note?: string };
export const SEED_ACCESS: AccessLog[] = [
  { who: 'হাবিবুর রহমান', what: 'লগইন', at: '২০২৬-১০-৩১ ১০:২২', role: 'AUDITOR', dev: 'iPhone · Chrome', ip: '103.12.44.18', ok: false, note: 'সেশন বাতিল — স্টাফ নিষ্ক্রিয়' },
  { who: 'কামরুল হাসান', what: 'লগইন', at: '২০২৬-১০-৩১ ১০:১২', role: 'ORG_ADMIN', dev: 'Android · App', ip: '103.12.44.10', ok: true },
  { who: 'নাসরিন আক্তার', what: 'লগইন', at: '২০২৬-১০-৩১ ০৯:৪০', role: 'MANAGER', dev: 'Android · App', ip: '103.12.44.22', ok: true },
];

/* ---------------- অডিট লগ (AM-35) ---------------- */
export type AuditResult = 'success' | 'failed';
export type AuditEntry = {
  id: string; at: string; who: string; role: string; action: 'approve' | 'reject' | 'entry' | 'reverse' | 'update' | 'export' | 'login' | 'delete';
  actionBn: string; entityBn: string; ref: string; refLabel: string; before: string; after: string;
  dev: string; ip: string; result: AuditResult; tag?: string; note?: string; alert?: string;
};
export const AUDIT_ACTIONS: Record<AuditEntry['action'], { t: string; icon: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  approve: { t: 'অনুমোদন', icon: 'checkc', tone: 'ok' },
  reject: { t: 'প্রত্যাখ্যান', icon: 'xc', tone: 'danger' },
  entry: { t: 'এন্ট্রি', icon: 'plus', tone: 'info' },
  reverse: { t: 'রিভার্সাল', icon: 'refresh', tone: 'danger' },
  update: { t: 'সম্পাদনা', icon: 'edit', tone: 'warn' },
  export: { t: 'এক্সপোর্ট', icon: 'download', tone: 'neutral' },
  login: { t: 'লগইন', icon: 'lock', tone: 'neutral' },
  delete: { t: 'soft-delete', icon: 'trash', tone: 'danger' },
};
export const SEED_AUDIT: AuditEntry[] = [
  { id: 'au1', at: '২০২৬-১০-৩১ ১০:২৪', who: 'কামরুল হাসান', role: 'ORG_ADMIN', action: 'update', actionBn: 'সম্পাদনা', entityBn: 'সেটিংস — অনুমোদন সীমা', ref: 'CFG-22', refLabel: 'APPROVER ৳১,০০,০০০ → ৳২,০০,০০০', before: '৳১,০০,০০০', after: '৳২,০০,০০০', dev: 'Android · App', ip: '103.12.44.10', result: 'success', note: 'কমিটির সিদ্ধান্ত ২০২৬/১১ সংযুক্ত' },
  { id: 'au2', at: '২০২৬-১০-৩১ ১০:০৫', who: 'নাসরিন আক্তার', role: 'MANAGER', action: 'approve', actionBn: 'অনুমোদন', entityBn: 'উত্তোলন আবেদন', ref: 'WR-2291', refLabel: 'মর্জিনা বেগম · ৳৫,০০০', before: 'অপেক্ষমাণ', after: 'অনুমোদিত', dev: 'Android · App', ip: '103.12.44.22', result: 'success' },
  { id: 'au3', at: '২০২৬-১০-৩১ ০৯:৫৮', who: 'নাসরিন আক্তার', role: 'MANAGER', action: 'reject', actionBn: 'প্রত্যাখ্যান', entityBn: 'উত্তোলন আবেদন', ref: 'WR-2288', refLabel: 'আব্দুল ওয়াদুদ · ৳১২,০০০', before: 'অপেক্ষমাণ', after: 'প্রত্যাখ্যাত', dev: 'Android · App', ip: '103.12.44.22', result: 'success', note: 'কারণ: নোটিশ পিরিয়ড ৭ দিন বাকি' },
  { id: 'au4', at: '২০২৬-১০-৩১ ০৯:১২', who: 'রাজু মিয়া', role: 'COLLECTOR', action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'কিস্তি জমা', ref: 'RCP-8841', refLabel: 'জাহাঙ্গীর হোসেন · ৳১,০০০', before: '—', after: '৳১,০০০', dev: 'Android · App (offline)', ip: '—', result: 'success', tag: 'অফলাইন sync' },
  { id: 'au5', at: '২০২৬-১০-৩১ ০৮:৪০', who: 'সালমা খাতুন', role: 'COLLECTOR', action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'বাল্ক ব্যাচ', ref: 'BATCH-2610-04', refLabel: '৩৫ সারি পোস্ট', before: '—', after: '৳৩৫,০০০', dev: 'Android · App', ip: '103.12.44.31', result: 'failed', alert: '৩টি সারি বাদ পড়েছে — ডুপ্লিকেট/ফাঁকা অঙ্ক' },
  { id: 'au6', at: '২০২৬-১০-৩০ ১৭:২০', who: 'কামরুল হাসান', role: 'ORG_ADMIN', action: 'reverse', actionBn: 'রিভার্সাল', entityBn: 'লেনদেন', ref: 'TXN-8827-R', refLabel: 'আব্দুল ওয়াদুদ · ৳১,০০০', before: 'পোস্টেড', after: 'রিভার্সড', dev: 'Android · App', ip: '103.12.44.10', result: 'success', note: 'মূল এন্ট্রি মুছেনি (R-02)' },
  { id: 'au7', at: '২০২৬-১০-৩০ ১৬:০৪', who: 'অজ্ঞাত', role: 'SYSTEM', action: 'login', actionBn: 'লগইন', entityBn: 'ব্যবহারকারী', ref: 'AUTH-991', refLabel: 'ভুল OTP ৩ বার', before: '—', after: 'লক', dev: 'Unknown device', ip: '45.118.9.77', result: 'failed', alert: 'একই IP থেকে ৩টি ব্যর্থ লগইন' },
  { id: 'au8', at: '২০২৬-১০-৩০ ১৫:৪১', who: 'কামরুল হাসান', role: 'ORG_ADMIN', action: 'export', actionBn: 'এক্সপোর্ট', entityBn: 'অডিট লগ', ref: 'EXP-118', refLabel: 'CSV · ১,২৪০ এন্ট্রি', before: '—', after: 'CSV', dev: 'Android · App', ip: '103.12.44.10', result: 'success' },
  { id: 'au9', at: '২০২৬-১০-৩০ ১২:০৫', who: 'নাসরিন আক্তার', role: 'MANAGER', action: 'update', actionBn: 'সম্পাদনা', entityBn: 'সদস্য প্রোফাইল', ref: 'RSS-2406-014', refLabel: 'মোবাইল ০১৭১১ → ০১৮১১', before: '০১৭১১…', after: '০১৮১১…', dev: 'Android · App', ip: '103.12.44.22', result: 'success', note: 'প্রমাণ: NID-সামনে.jpg' },
  { id: 'au10', at: '২০২৬-১০-২৯ ১৯:৩৩', who: 'কামরুল হাসান', role: 'ORG_ADMIN', action: 'delete', actionBn: 'soft-delete', entityBn: 'স্কিম খসড়া', ref: 'YS-01', refLabel: 'খসড়া বাতিল (মুছে ফেলা নয়)', before: 'খসড়া', after: 'আর্কাইভ', dev: 'Android · App', ip: '103.12.44.10', result: 'success' },
];
export const SEED_AUDIT_META = { total: 1240, years: 8, oldest: '২০১৮-০৭-০১', note: 'সব এন্ট্রি অপরিবর্তনীয় — বদলানো বা মোছার API নেই (R-02)' };
export const auditStats = (list: AuditEntry[]) => ({
  failed: list.filter((l) => l.result !== 'success').length,
  offline: list.filter((l) => l.tag).length,
  alerts: list.filter((l) => l.alert).length,
  today: list.filter((l) => l.at.startsWith('২০২৬-১০-৩১')).length,
});

/* ---------------- সদস্য স্থানান্তর (AM-30) ---------------- */
export type MoveStatus = 'pending' | 'approved' | 'done' | 'cancelled';
export const MV_STATUS: Record<MoveStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  pending: { t: 'অপেক্ষমাণ', tone: 'warn' }, approved: { t: 'অনুমোদিত', tone: 'info' },
  done: { t: 'কার্যকর', tone: 'ok' }, cancelled: { t: 'বাতিল', tone: 'neutral' },
};
export type MemberMove = {
  id: string; no: string; memberId: string; kind: 'route' | 'branch'; kindBn: string;
  from: string; to: string; reason: string; effAt: string; by: string; at: string; status: MoveStatus;
  impact: { collector: string; report: string; cash: string; history: string };
};
export const SEED_MOVES: MemberMove[] = [
  { id: 'mv1', no: 'MV-2610-04', memberId: 'm1', kind: 'route', kindBn: 'রুট পরিবর্তন', from: 'R1 · কেশবপুর সদর', to: 'R2 · ঝিকরগাছা', reason: 'ঠিকানা বদলেছে — ঝিকরগাছায় শ্বশুরবাড়ি', effAt: '২০২৬-১১-০১', by: 'নাসরিন আক্তার', at: '২০২৬-১০-২৮', status: 'pending',
    impact: { collector: 'R2-এর সালমা খাতুন', report: 'R1-এ সদস্য ১ কমবে, R2-তে ১ বাড়বে', cash: 'আজকের ক্যাশে কোনো প্রভাব নেই', history: 'পুরনো ৪২টি লেনদেন R1-এর হিসাবেই থাকবে' } },
  { id: 'mv2', no: 'MV-2609-07', memberId: 'm3', kind: 'branch', kindBn: 'শাখা পরিবর্তন', from: 'কেশবপুর শাখা', to: 'ঝিকরগাছা শাখা', reason: 'শ্বশুরবাড়ি — স্থায়ী ঠিকানা', effAt: '২০২৬-১০-০৫', by: 'কামরুল হাসান', at: '২০২৬-০৯-২৮', status: 'approved',
    impact: { collector: 'R2-এর সালমা খাতুন', report: 'শাখা-ভিত্তিক রিপোর্ট বদলাবে', cash: 'দুই শাখার ক্যাশ সমন্বয় দরকার', history: 'ইতিহাস অপরিবর্তিত' } },
];
export const movePending = (list: MemberMove[]) => list.filter((m) => m.status === 'pending').length;
