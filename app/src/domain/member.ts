/* ============================================================
   src/domain/member.ts — সদস্য অ্যাপের ডোমেইন মডেল + ডেমো সিড
   ------------------------------------------------------------
   • এখানে কোনো UI নেই, কোনো সুদ/মুনাফা/শতাংশ ফিল্ড নেই (নীতি D-01)
   • প্রতিটি টাইপ ভবিষ্যৎ API-র contractual shape — ফেজ ৬-এ সার্ভার
     একই ফিল্ড ফেরত দিলে UI অপরিবর্তিত থাকবে
   • সব অঙ্ক `number` (টাকায়), দেখানোর সময় bn() দিয়ে বাংলা অঙ্কে
   ============================================================ */

export type DepositMode = 'নগদ' | 'বিকাশ' | 'ব্যাংক';
export type AccountStatus = 'active' | 'closed-requested' | 'closed';
export type InstallmentStatus = 'paid' | 'due' | 'overdue';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export type Scheme = {
  id: string;
  name: string;
  summary: string;
  installment: number;
  frequency: 'মাসিক' | 'সাপ্তাহিক';
  durationMonths: number;
  minDeposit: number;
  features: string[];
  rules: string[];
};

export type Account = {
  id: string;
  schemeId: string;
  schemeName: string;
  number: string;
  openedOn: string;
  openingBalance: number;
  installment: number;
  frequency: 'মাসিক' | 'সাপ্তাহিক';
  totalInstallments: number;
  status: AccountStatus;
};

export type Installment = {
  id: string;
  accountId: string;
  serial: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidOn?: string;
};

export type Deposit = {
  id: string;
  accountId: string;
  amount: number;
  mode: DepositMode;
  date: string;
  receipt: string;
  status: 'approved';
  note?: string;
};

export type Withdrawal = {
  id: string;
  amount: number;
  mode: DepositMode;
  reason: string;
  accountName: string;
  accountNo: string;
  date: string;
  status: WithdrawalStatus;
  reference: string;
  timeline: { label: string; at: string; done: boolean }[];
};

export type Nominee = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  nid: string;
  share: number;
};

export type MemberNotification = {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  route?: string;
};

export type Notice = { id: string; title: string; body: string; at: string; pinned?: boolean };

export type Ticket = { id: string; subject: string; body: string; at: string; status: 'open' | 'answered' };

export type Profile = {
  name: string;
  nameEn: string;
  phone: string;
  email: string;
  nid: string;
  dob: string;
  address: string;
  occupation: string;
  fatherName: string;
  motherName: string;
  kycStatus: 'verified' | 'pending' | 'rejected';
  memberNo: string;
  org: string;
  since: string;
};

export type CloseRequest = {
  id: string;
  reason: string;
  settlementMode: DepositMode;
  accountName: string;
  accountNo: string;
  at: string;
  status: 'submitted';
};

export type Settings = {
  notifications: boolean;
  sms: boolean;
  language: 'বাংলা' | 'English';
  pinSet: boolean;
};

export type MemberState = {
  profile: Profile;
  schemes: Scheme[];
  accounts: Account[];
  installments: Installment[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  nominees: Nominee[];
  notifications: MemberNotification[];
  notices: Notice[];
  tickets: Ticket[];
  closeRequest: CloseRequest | null;
  settings: Settings;
};

/* ------------------------- সিড ডেটা (ডেমো) ------------------------- */

export const SEED: MemberState = {
  profile: {
    name: 'রহিমা বেগম',
    nameEn: 'Rahima Begum',
    phone: '01712-345678',
    email: 'rahima@example.com',
    nid: '1992 4471 8820',
    dob: '১২ মার্চ ১৯৯২',
    address: 'গ্রাম: শাপলা, ডাক: দৌলতপুর, উপজেলা: দৌলতপুর, জেলা: খুলনা',
    occupation: 'গৃহিণী ও ক্ষুদ্র ব্যবসা',
    fatherName: 'আব্দুল করিম',
    motherName: 'ফাতেমা খাতুন',
    kycStatus: 'verified',
    memberNo: 'M-০০১২৩',
    org: 'শাপলা সমবায় সমিতি',
    since: 'জুন ২০২৪',
  },
  schemes: [
    {
      id: 'sch-monthly',
      name: 'মাসিক সঞ্চয় স্কিম',
      summary: 'প্রতি মাসে নির্দিষ্ট কিস্তি জমা রেখে ১২ মাসে জমা গড়ুন।',
      installment: 1000,
      frequency: 'মাসিক',
      durationMonths: 12,
      minDeposit: 100,
      features: ['মাসিক কিস্তি ৳১,০০০', 'যেকোনো সময় অতিরিক্ত জমা', 'মধ্য-মেয়াদে উত্তোলনের সুযোগ', 'কোনো সুদ বা মুনাফার দাবি নেই'],
      rules: ['কিস্তি প্রতি মাসের ৫ তারিখের মধ্যে', 'বিলম্বে জরিমানা প্রযোজ্য হতে পারে', 'উত্তোলনের আবেদনে কমিটির অনুমোদন লাগবে'],
    },
    {
      id: 'sch-weekly',
      name: 'সাপ্তাহিক সঞ্চয় স্কিম',
      summary: 'সাপ্তাহিক কিস্তিতে ছোট অঙ্কে জমা — মাঠ সংগ্রহকের মাধ্যমে।',
      installment: 250,
      frequency: 'সাপ্তাহিক',
      durationMonths: 12,
      minDeposit: 50,
      features: ['সাপ্তাহিক কিস্তি ৳২৫০', 'সংগ্রহক বাড়িতে আসেন', 'রসিদ সাথে সাথে', 'কোনো সুদ বা মুনাফার দাবি নেই'],
      rules: ['সপ্তাহের নির্দিষ্ট দিনে সংগ্রহ', 'এক সপ্তাহ বাদ দিলে জমা বাকি থাকবে'],
    },
    {
      id: 'sch-long',
      name: 'দীর্ঘমেয়াদি সঞ্চয় স্কিম',
      summary: '২৪ মাসে বড় লক্ষ্যের জন্য জমা — সঞ্চয়ের ধারাবাহিকতা বজায় রাখতে।',
      installment: 2000,
      frequency: 'মাসিক',
      durationMonths: 24,
      minDeposit: 500,
      features: ['মাসিক কিস্তি ৳২,০০০', '২৪ মাসের পরিকল্পনা', 'স্টেটমেন্ট ও রসিদ কেন্দ্র', 'কোনো সুদ বা মুনাফার দাবি নেই'],
      rules: ['কিস্তি প্রতি মাসের ১০ তারিখের মধ্যে', 'অ্যাকাউন্ট বন্ধে ৩০ দিনের নোটিশ'],
    },
  ],
  accounts: [
    {
      id: 'acc-1',
      schemeId: 'sch-monthly',
      schemeName: 'মাসিক সঞ্চয় স্কিম',
      number: 'A-০০৪৫৭',
      openedOn: '০৫ জুন ২০২৪',
      openingBalance: 20500,
      installment: 1000,
      frequency: 'মাসিক',
      totalInstallments: 12,
      status: 'active',
    },
  ],
  installments: [
    { id: 'ins-1', accountId: 'acc-1', serial: 1, dueDate: '০৫ জুন ২০২৪', amount: 1000, status: 'paid', paidOn: '০৫ জুন ২০২৪' },
    { id: 'ins-2', accountId: 'acc-1', serial: 2, dueDate: '০৫ জুলাই ২০২৪', amount: 1000, status: 'paid', paidOn: '০৫ জুলাই ২০২৪' },
    { id: 'ins-3', accountId: 'acc-1', serial: 3, dueDate: '০৫ আগস্ট ২০২৪', amount: 1000, status: 'paid', paidOn: '০৬ আগস্ট ২০২৪' },
    { id: 'ins-4', accountId: 'acc-1', serial: 4, dueDate: '০৫ সেপ্টেম্বর ২০২৪', amount: 1000, status: 'paid', paidOn: '০৫ সেপ্টেম্বর ২০২৪' },
    { id: 'ins-5', accountId: 'acc-1', serial: 5, dueDate: '০৫ অক্টোবর ২০২৪', amount: 1000, status: 'paid', paidOn: '০৫ অক্টোবর ২০২৪' },
    { id: 'ins-6', accountId: 'acc-1', serial: 9, dueDate: '০৫ অক্টোবর ২০২৬', amount: 1000, status: 'overdue' },
    { id: 'ins-7', accountId: 'acc-1', serial: 10, dueDate: '০৫ নভেম্বর ২০২৬', amount: 1000, status: 'due' },
    { id: 'ins-8', accountId: 'acc-1', serial: 11, dueDate: '০৫ ডিসেম্বর ২০২৬', amount: 1000, status: 'due' },
    { id: 'ins-9', accountId: 'acc-1', serial: 12, dueDate: '০৫ জানুয়ারি ২০২৭', amount: 1000, status: 'due' },
  ],
  deposits: [
    { id: 'dep-1', accountId: 'acc-1', amount: 1000, mode: 'নগদ', date: '০৫ অক্টোবর ২০২৪', receipt: 'RCP-১০২৪', status: 'approved' },
    { id: 'dep-2', accountId: 'acc-1', amount: 1000, mode: 'বিকাশ', date: '০৫ সেপ্টেম্বর ২০২৪', receipt: 'RCP-১০১১', status: 'approved' },
    { id: 'dep-3', accountId: 'acc-1', amount: 1000, mode: 'নগদ', date: '০৫ আগস্ট ২০২৪', receipt: 'RCP-৯৯৮', status: 'approved' },
    { id: 'dep-4', accountId: 'acc-1', amount: 1000, mode: 'নগদ', date: '০৫ জুলাই ২০২৪', receipt: 'RCP-৯৮৭', status: 'approved' },
    { id: 'dep-5', accountId: 'acc-1', amount: 1000, mode: 'ব্যাংক', date: '০৫ জুন ২০২৪', receipt: 'RCP-৯৭৫', status: 'approved' },
  ],
  withdrawals: [
    {
      id: 'wd-1',
      amount: 2000,
      mode: 'ব্যাংক',
      reason: 'চিকিৎসা খরচ',
      accountName: 'রহিমা বেগম',
      accountNo: '0123456789012',
      date: '১২ আগস্ট ২০২৪',
      status: 'paid',
      reference: 'WDR-৩৩১',
      timeline: [
        { label: 'আবেদন জমা', at: '১২ আগস্ট ২০২৪', done: true },
        { label: 'যাচাই সম্পন্ন', at: '১৩ আগস্ট ২০২৪', done: true },
        { label: 'অনুমোদিত', at: '১৪ আগস্ট ২০২৪', done: true },
        { label: 'বিতরণ সম্পন্ন', at: '১৫ আগস্ট ২০২৪', done: true },
      ],
    },
    {
      id: 'wd-2',
      amount: 1500,
      mode: 'বিকাশ',
      reason: 'সন্তানের স্কুল ফি',
      accountName: 'রহিমা বেগম',
      accountNo: '01712345678',
      date: '২৮ অক্টোবর ২০২৬',
      status: 'pending',
      reference: 'WDR-৪১২',
      timeline: [
        { label: 'আবেদন জমা', at: '২৮ অক্টোবর ২০২৬', done: true },
        { label: 'যাচাই', at: '—', done: false },
        { label: 'অনুমোদন', at: '—', done: false },
        { label: 'বিতরণ', at: '—', done: false },
      ],
    },
    {
      id: 'wd-3',
      amount: 500,
      mode: 'নগদ',
      reason: 'ব্যক্তিগত প্রয়োজনে',
      accountName: 'রহিমা বেগম',
      accountNo: '—',
      date: '০৩ সেপ্টেম্বর ২০২৬',
      status: 'rejected',
      reference: 'WDR-৪০১',
      timeline: [
        { label: 'আবেদন জমা', at: '০৩ সেপ্টেম্বর ২০২৬', done: true },
        { label: 'প্রত্যাখ্যান — নমিনি তথ্য অসম্পূর্ণ', at: '০৪ সেপ্টেম্বর ২০২৬', done: true },
      ],
    },
  ],
  nominees: [
    { id: 'nom-1', name: 'মোঃ রফিকুল ইসলাম', relation: 'স্বামী', phone: '01812345678', nid: '1988 5541 2200', share: 60 },
    { id: 'nom-2', name: 'সাদিয়া ইসলাম', relation: 'কন্যা', phone: '01912345678', nid: '2014 8890 1122', share: 40 },
  ],
  notifications: [
    { id: 'ntf-1', title: 'অক্টোবরের কিস্তি বাকি', body: '৳১,০০০ কিস্তি ৫ অক্টোবরের পর বাকি আছে। এখনই জমা দিন।', at: '০৬ অক্টোবর ২০২৬', read: false, route: '/m/dues' },
    { id: 'ntf-2', title: 'উত্তোলনের আবেদন গৃহীত', body: '৳১,৫০০ উত্তোলনের আবেদন জমা হয়েছে — যাচাই চলছে।', at: '২৮ অক্টোবর ২০২৬', read: false, route: '/m/withdrawals' },
    { id: 'ntf-3', title: 'নমিনি তথ্য হালনাগাদ করুন', body: 'বার্ষিক যাচাইয়ের জন্য নমিনির তথ্য একবার দেখে নিন।', at: '২০ সেপ্টেম্বর ২০২৬', read: true, route: '/m/nominees' },
  ],
  notices: [
    { id: 'not-1', title: 'বার্ষিক সাধারণ সভা — ১৫ নভেম্বর', body: 'সকল সদস্যকে ১৫ নভেম্বর সকাল ১০টায় সমিতির বার্ষিক সাধারণ সভায় উপস্থিত থাকার অনুরোধ করা হলো। আলোচ্যসূচি: বার্ষিক হিসাব, বাজেট ও কমিটি নির্বাচন।', at: '২৫ অক্টোবর ২০২৬', pinned: true },
    { id: 'not-2', title: 'ঈদ উপলক্ষে সংগ্রহ সময়সূচি', body: 'ঈদের সপ্তাহে কিস্তি সংগ্রহ ৩ দিন বন্ধ থাকবে। পরবর্তী সপ্তাহে বাকি কিস্তি নেওয়া হবে — কোনো অতিরিক্ত চার্জ নেই।', at: '১৮ অক্টোবর ২০২৬' },
    { id: 'not-3', title: 'KYC হালনাগাদ Campaign', body: 'যাদের NID হালনাগাদ নেই তারা ৩০ নভেম্বরের মধ্যে প্রোফাইল পর্দা থেকে আপডেট করুন।', at: '১০ অক্টোবর ২০২৬' },
  ],
  tickets: [
    { id: 'tk-1', subject: 'রসিদ নম্বর যাচাই', body: 'আগের মাসের রসিদ RCP-১০১১ যাচাই করতে চাই।', at: '২০ সেপ্টেম্বর ২০২৬', status: 'answered' },
  ],
  closeRequest: null,
  settings: { notifications: true, sms: true, language: 'বাংলা', pinSet: true },
};

/* ------------------------- হিসাব ও সহায়ক ------------------------- */

/** ব্যালান্স = প্রারম্ভিক + অনুমোদিত জমা − পরিশোধিত উত্তোলন (সুদ/মুনাফা নেই) */
export function computeBalance(state: MemberState, accountId?: string): number {
  const acc = accountId ? state.accounts.find((a) => a.id === accountId) : state.accounts[0];
  if (!acc) return 0;
  const inSum = state.deposits.filter((d) => d.accountId === acc.id).reduce((s, d) => s + d.amount, 0);
  const outSum = state.withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amount, 0);
  return acc.openingBalance + inSum - outSum;
}

export function dueInstallments(state: MemberState) {
  return state.installments.filter((i) => i.status === 'overdue' || i.status === 'due');
}

export function payableAmount(state: MemberState) {
  return dueInstallments(state).reduce((s, i) => s + i.amount, 0);
}

export function nextReceiptNo(existing: Deposit[]): string {
  const max = existing.reduce((m, d) => {
    const n = Number(String(d.receipt).replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1030);
  return `RCP-${max + 1}`;
}

export function nextRef(prefix: string, existing: { reference?: string; id: string }[]): string {
  return `${prefix}-${400 + existing.length + 1}`;
}

/** রসিদ যাচাইয়ের সংকেত — রসিদ নম্বর + অঙ্ক মিললে সত্য */
export function verifyReceipt(state: MemberState, code: string): Deposit | null {
  const norm = code.trim().toUpperCase().replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  return state.deposits.find((d) => String(d.receipt).toUpperCase() === norm) ?? null;
}
