/* ============================================================
   src/domain/qard.ts — কর্জে হাসানা (সুদমুক্ত সহায়তা) মডিউল
   কঠোর নিয়ম: শুধু মূলধন ফেরত · কোনো সুদ/মুনাফা/শতাংশ নেই · বিলম্ব ফি ৳০
   আলাদা মডিউল ও আলাদা খাত — সাধারণ সঞ্চয় বা ROSCA-র সাথে মেশানো হয় না।
   ============================================================ */

export type QhProduct = {
  id: string;
  name: string;
  max: number;
  tenureMin: number;
  tenureMax: number;
  grace: number;
  desc: string;
  security: string[];
};

export type QhAppStatus = 'pending' | 'approved' | 'rejected' | 'disbursed';
export type QhApp = {
  id: string;
  no: string;
  amount: number;
  purpose: string;
  productId: string;
  status: QhAppStatus;
  submittedAt: string;
  decidedAt?: string;
  reason?: string;
  committee?: string;
};

export type QhRepayment = {
  id: string;
  loanId: string;
  receipt: string;
  at: string;
  amount: number;
  inst: number;
  channel: 'cash' | 'bank' | 'bkash';
};

export type QhLoan = {
  id: string;
  no: string;
  appId: string;
  productId: string;
  principal: number;
  tenure: number;
  disbursedAt: string;
  status: 'active' | 'arrears' | 'closed' | 'pending';
  dueDay: string;
  committee: string;
  certNo?: string;
  certHash?: string;
  closedAt?: string;
  nextDue?: string;
};

export const SEED_PRODUCTS: QhProduct[] = [
  { id: 'qhp1', name: 'চিকিৎসা সহায়তা', max: 50000, tenureMin: 6, tenureMax: 18, grace: 7, desc: 'হাসপাতাল, ডাক্তার ও ওষুধের ব্যয়ে সুদমুক্ত সহায়তা।', security: ['সদস্যপদ ৬ মাস+', 'KYC যাচাই', 'বকেয়া শূন্য'] },
  { id: 'qhp2', name: 'কৃষি উপকরণ', max: 40000, tenureMin: 6, tenureMax: 12, grace: 10, desc: 'বীজ, সার ও সেচের জন্য মৌসুমি সহায়তা — ফসল তোলার পর কিস্তি।', security: ['জমির তথ্য', 'সদস্যপদ ৬ মাস+'] },
  { id: 'qhp3', name: 'শিক্ষা সহায়তা', max: 30000, tenureMin: 4, tenureMax: 10, grace: 7, desc: 'সন্তানের ভর্তি ফি ও পরীক্ষার খরচে সহায়তা।', security: ['প্রতিষ্ঠানের কাগজ', 'KYC যাচাই'] },
];

export const SEED_APPS: QhApp[] = [
  { id: 'qa1', no: 'QH-AP-১৪০২', amount: 30000, purpose: 'চিকিৎসা', productId: 'qhp1', status: 'disbursed', submittedAt: '০২ আগস্ট ২০২৬', decidedAt: '০৬ আগস্ট ২০২৬', committee: 'কমিটি-৩' },
  { id: 'qa2', no: 'QH-AP-১৪২৫', amount: 20000, purpose: 'কৃষি উপকরণ', productId: 'qhp2', status: 'pending', submittedAt: '২৪ অক্টোবর ২০২৬' },
  { id: 'qa3', no: 'QH-AP-১২৯০', amount: 20000, purpose: 'শিক্ষা', productId: 'qhp3', status: 'disbursed', submittedAt: '১০ জানুয়ারি ২০২৫', decidedAt: '১৫ জানুয়ারি ২০২৫', committee: 'কমিটি-২' },
];

export const SEED_LOANS: QhLoan[] = [
  { id: 'ql1', no: 'QH-LN-১৪০২', appId: 'qa1', productId: 'qhp1', principal: 30000, tenure: 12, disbursedAt: '০৭ আগস্ট ২০২৬', status: 'active', dueDay: '০৫ তারিখ', committee: 'কমিটি-৩', nextDue: '০৫ নভেম্বর ২০২৬' },
  { id: 'ql2', no: 'QH-LN-১২৯০', appId: 'qa3', productId: 'qhp3', principal: 20000, tenure: 10, disbursedAt: '২০ জানুয়ারি ২০২৫', status: 'closed', dueDay: '২০ তারিখ', committee: 'কমিটি-২', certNo: 'QH-CERT-১২৯০', certHash: '0x7c31e9', closedAt: '২০ নভেম্বর ২০২৫' },
];

export const SEED_REPAYMENTS: QhRepayment[] = [
  { id: 'qr1', loanId: 'ql1', receipt: 'QR-2610-0005', at: '০৫ অক্টোবর ২০২৬', amount: 2500, inst: 3, channel: 'cash' },
  { id: 'qr2', loanId: 'ql1', receipt: 'QR-2609-0004', at: '০৫ সেপ্টেম্বর ২০২৬', amount: 2500, inst: 2, channel: 'bkash' },
  { id: 'qr3', loanId: 'ql1', receipt: 'QR-2608-0003', at: '০৫ আগস্ট ২০২৬', amount: 2500, inst: 1, channel: 'cash' },
  { id: 'qr4', loanId: 'ql2', receipt: 'QR-2511-0199', at: '২০ নভেম্বর ২০২৫', amount: 2000, inst: 10, channel: 'bank' },
  { id: 'qr5', loanId: 'ql2', receipt: 'QR-2510-0188', at: '২০ অক্টোবর ২০২৫', amount: 2000, inst: 9, channel: 'bank' },
];

export const QH_CHANNEL: { k: 'cash' | 'bank' | 'bkash'; t: string }[] = [
  { k: 'cash', t: 'নগদ (অফিস/সংগ্রহক)' },
  { k: 'bank', t: 'ব্যাংক' },
  { k: 'bkash', t: 'বিকাশ' },
];

/* ------------------------- গণনা ------------------------- */

export const loanById = (loans: QhLoan[], id?: string) => loans.find((l) => l.id === id);
export const appById = (apps: QhApp[], id?: string) => apps.find((a) => a.id === id);
export const productById = (p: QhProduct[], id?: string) => p.find((x) => x.id === id);
export const repaymentsOf = (r: QhRepayment[], loanId?: string) => r.filter((x) => x.loanId === loanId);
export const repaid = (loans: QhLoan[], r: QhRepayment[], loanId?: string) =>
  repaymentsOf(r, loanId).reduce((s, x) => s + x.amount, 0);
export const outstanding = (loans: QhLoan[], r: QhRepayment[], loanId?: string) => {
  const l = loanById(loans, loanId);
  return l ? Math.max(0, l.principal - repaid(loans, r, loanId)) : 0;
};
export const perInstallment = (l: QhLoan) => Math.round(l.principal / l.tenure);
export const paidPct = (loans: QhLoan[], r: QhRepayment[], loanId?: string) => {
  const l = loanById(loans, loanId);
  return l ? Math.round((repaid(loans, r, loanId) / l.principal) * 100) : 0;
};
export const installmentsLeft = (loans: QhLoan[], r: QhRepayment[], loanId?: string) => {
  const l = loanById(loans, loanId);
  return l ? Math.max(0, l.tenure - repaymentsOf(r, loanId).length) : 0;
};
/** পরবর্তী কিস্তি — সমাপ্ত ঋণে কিছু নেই */
export const nextDue = (l: QhLoan, paidCount = 0) =>
  l.status === 'closed' ? null : { no: Math.min(l.tenure, paidCount + 1), amount: perInstallment(l), date: l.nextDue ?? '—' };

export const schedule = (l: QhLoan, r: QhRepayment[]) => {
  const per = perInstallment(l);
  const paid = repaymentsOf(r, l.id).length;
  return Array.from({ length: l.tenure }, (_, i) => ({
    no: i + 1,
    amount: per,
    status: i < paid ? ('paid' as const) : i === paid ? ('next' as const) : ('due' as const),
  }));
};

export type QhReason = { code: string; title: string; detail: string; ok: boolean };
export type QhEligibility = { state: 'eligible' | 'conditional' | 'blocked'; max: number; reasons: QhReason[] };

/** যোগ্যতা: সদস্যপদ, KYC, বকেয়া ও চলমান ঋণ — সব পাস হলে eligible */
export function eligibility(input: { kycVerified: boolean; memberMonths: number; duesTotal: number; hasActive: boolean }, max = 40000): QhEligibility {
  const reasons: QhReason[] = [
    { code: 'MEMBERSHIP', title: 'সদস্যপদ ৬ মাস+', detail: `${input.memberMonths} মাস সম্পূর্ণ`, ok: input.memberMonths >= 6 },
    { code: 'KYC', title: 'KYC যাচাই সম্পন্ন', detail: input.kycVerified ? 'NID যাচাইকৃত' : 'প্রোফাইল থেকে KYC সম্পন্ন করুন', ok: input.kycVerified },
    { code: 'ARREARS', title: 'সব মডিউলের বকেয়া শূন্য', detail: input.duesTotal === 0 ? 'বকেয়া নেই' : `৳${input.duesTotal} বকেয়া আছে`, ok: input.duesTotal === 0 },
    { code: 'ACTIVE_LOAN', title: 'চলমান সহায়তা নেই', detail: input.hasActive ? 'একটি ঋণ চলমান — আগে পরিশোধ করুন' : 'কোনো সক্রিয় ঋণ নেই', ok: !input.hasActive },
  ];
  const failed = reasons.filter((r) => !r.ok);
  const state = failed.length === 0 ? 'eligible' : failed.length <= 2 ? 'conditional' : 'blocked';
  return { state, max: failed.length === 0 ? max : Math.round(max * 0.5), reasons };
}
