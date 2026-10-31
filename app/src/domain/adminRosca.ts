/* ============================================================
   src/domain/adminRosca.ts — ROSCA (মডিউল ২) · অ্যাডমিন মোবাইল ডোমেইন
   RAM-01…RAM-12 · ডেস্কটপ RA-01…RA-12 এর সমতুল্য ডেটা ও নিয়ম।
   নিয়ম: ড্র অপরিবর্তনীয় (R-02/R-05) · maker ≠ checker (BR-04) ·
   রসিদ পুনর্ব্যবহার নয় (BR-08) · কোনো সুদ/মুনাফা নেই (BR-13)।
   সব অঙ্ক টাকায় (ডেমো)।
   ============================================================ */

export type RcStatus = 'forming' | 'active' | 'risk' | 'completed' | 'blocked';
export type RcScheme = {
  id: string; code: string; name: string; seats: number; contrib: number; freq: string;
  joinFee: number; drawMethod: 'lottery' | 'fixed'; minMembers: number; maxCirclesPerMember: number;
  lateFee: number; payout: PayoutKey[]; defaultPolicy: DefaultStep[]; version: number;
  status: 'active' | 'archived'; note: string;
};
export type PayoutKey = 'cash_office' | 'bkash' | 'bank' | 'savings';
export type DefaultStep = 'warn' | 'late_fee' | 'replace' | 'forfeit';
export type RcCircle = {
  id: string; code: string; scheme: string; start: string; end: string; status: RcStatus;
  route: string; branch: string; manager: string; nextDate: string | null;
  witnesses: string[]; settledOn?: string;
};
export type RcDraw = {
  id: string; circle: string; no: number; scheduled: string; executed: string | null;
  method: 'lottery' | 'fixed'; winnerSeat: number | null; amount: number;
  receipt: string | null; hash: string | null; channel: PayoutKey | null;
  status: 'executed' | 'approval' | 'scheduled'; collected: number; shortfall: number; cover: string | null;
  by: string; appr: string | null; candidates: number[];
};
export type RcSeat = { no: number; memberId: string | null; name: string; isMe?: boolean };
export type RcDefault = {
  id: string; circle: string; seatNo: number; missedDraws: number[]; amount: number; step: DefaultStep;
  lateFee: number; status: 'open' | 'pending-committee' | 'resolved'; noticeSent: string;
  committee: string | null; decidedBy: string | null; note: string;
};

export const RC_METHOD: Record<'lottery' | 'fixed', string> = { lottery: 'লটারি', fixed: 'পূর্বনির্ধারিত ক্রম' };
export const RC_STATUS: Record<RcStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  forming: { t: 'গঠন চলছে', tone: 'info' },
  active: { t: 'চলমান', tone: 'ok' },
  risk: { t: 'ডিফল্ট ঝুঁকি', tone: 'warn' },
  completed: { t: 'সমাপ্ত ও নিষ্পত্তি', tone: 'neutral' },
  blocked: { t: 'সমাপ্তি আটকে', tone: 'danger' },
};
export const RC_DRAW_ST: Record<RcDraw['status'], { t: string; tone: 'ok' | 'warn' | 'info' }> = {
  executed: { t: 'সম্পন্ন · অপরিবর্তনীয়', tone: 'ok' },
  approval: { t: 'অনুমোদনের অপেক্ষায়', tone: 'warn' },
  scheduled: { t: 'নির্ধারিত', tone: 'info' },
};
export const RC_STEP: Record<DefaultStep, string> = {
  warn: 'ধাপ ১ · সতর্কতা নোটিশ',
  late_fee: 'ধাপ ২ · বিলম্ব ফি (D-41)',
  replace: 'ধাপ ৩ · সিট প্রতিস্থাপন (D-46)',
  forfeit: 'ধাপ ৪ · বাতিল ও ঘাটতি নিষ্পত্তি (D-46)',
};
export const RC_STEP_ORDER: DefaultStep[] = ['warn', 'late_fee', 'replace', 'forfeit'];
export const RC_DEF_ST: Record<RcDefault['status'], { t: string; tone: 'warn' | 'info' | 'neutral' }> = {
  open: { t: 'খোলা', tone: 'warn' },
  'pending-committee': { t: 'কমিটিতে', tone: 'info' },
  resolved: { t: 'নিষ্পত্তি', tone: 'neutral' },
};
export const RC_PAYOUT: { k: PayoutKey; t: string; on: boolean; flag?: string }[] = [
  { k: 'cash_office', t: 'অফিস কাউন্টার (নগদ)', on: true },
  { k: 'bkash', t: 'বিকাশ / ওয়ালেট', on: true },
  { k: 'bank', t: 'ব্যাংক ট্রান্সফার', on: true },
  { k: 'savings', t: 'সঞ্চয় অ্যাকাউন্টে স্থানান্তর', on: false, flag: 'D-12 পুনরায় খোলা — এখন নিষ্ক্রিয়' },
];
export const rcPayoutLabel = (k: PayoutKey | null) => RC_PAYOUT.find((p) => p.k === k)?.t ?? '—';

export const SEED_RC_SCHEMES: RcScheme[] = [
  { id: 'rs01', code: 'RCS-01', name: 'মাসিক চক্র ৳৫,০০০ · ৮ সিট', seats: 8, contrib: 5000, freq: 'মাসিক',
    joinFee: 100, drawMethod: 'lottery', minMembers: 6, maxCirclesPerMember: 3, lateFee: 100,
    payout: ['cash_office', 'bkash', 'bank'], defaultPolicy: ['warn', 'late_fee', 'replace', 'forfeit'],
    version: 3, status: 'active', note: 'কিস্তির অঙ্ক ও সিট সংখ্যা অপরিবর্তনীয় — চক্র মাঝপথে বদলায় না (নিয়ম সংস্করণ ৩)' },
  { id: 'rs02', code: 'RCS-02', name: 'সাপ্তাহিক চক্র ৳২,০০০ · ১২ সিট', seats: 12, contrib: 2000, freq: 'সাপ্তাহিক',
    joinFee: 50, drawMethod: 'fixed', minMembers: 12, maxCirclesPerMember: 3, lateFee: 50,
    payout: ['cash_office', 'bkash'], defaultPolicy: ['warn', 'late_fee', 'replace'],
    version: 1, status: 'active', note: '১২ সিট পূর্ণ না হলে প্রথম ড্র হয় না' },
  { id: 'rs03', code: 'RCS-03', name: 'ঈদ চক্র ৳১০,০০০ · ৮ সিট', seats: 8, contrib: 10000, freq: 'মাসিক',
    joinFee: 0, drawMethod: 'fixed', minMembers: 8, maxCirclesPerMember: 2, lateFee: 200,
    payout: ['cash_office', 'bank'], defaultPolicy: ['warn', 'late_fee', 'forfeit'],
    version: 2, status: 'archived', note: '২০২৫–২৬ মৌসুম সম্পন্ন; নতুন চক্র খোলা বন্ধ' },
];

export const SEED_RC_CIRCLES: RcCircle[] = [
  { id: 'rc01', code: 'RC-2606-01', scheme: 'rs01', start: '২০২৬-০৬-০৫', end: '২০২৭-০১-০৫', status: 'active',
    route: 'R2 · গৌরীঘোনা', branch: 'কেশবপুর শাখা', manager: 'মোঃ আব্দুল্লাহ', nextDate: '২০২৬-১১-০৫',
    witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ', 'নিরীক্ষক · এস. এম. ফারুক'] },
  { id: 'rc02', code: 'RC-2610-02', scheme: 'rs02', start: '২০২৬-১১-১৫', end: '২০২৭-০১-৩১', status: 'forming',
    route: 'R3 · সুফলাকাটি', branch: 'কেশবপুর শাখা', manager: 'সুমি রানী দাস', nextDate: '২০২৬-১১-১৫',
    witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ'] },
  { id: 'rc03', code: 'RC-2504-03', scheme: 'rs03', start: '২০২৫-০৬-১০', end: '২০২৬-০১-১০', status: 'completed',
    route: 'R1 · কেশবপুর সদর', branch: 'কেশবপুর শাখা', manager: 'মোঃ আব্দুল্লাহ', nextDate: null,
    witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ', 'নিরীক্ষক · এস. এম. ফারুক'], settledOn: '২০২৬-০১-১২' },
  { id: 'rc04', code: 'RC-2608-04', scheme: 'rs01', start: '২০২৬-০৮-০৫', end: '২০২৭-০৩-০৫', status: 'risk',
    route: 'R2 · গৌরীঘোনা', branch: 'কেশবপুর শাখা', manager: 'নাসরিন আক্তার', nextDate: '২০২৬-১১-০৫',
    witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ'] },
];

export const DEMO_EXTRA = [
  { id: 'm7', name: 'রহিমা বেগম', no: 'RSS-2405-007' },
  { id: 'm8', name: 'শাহিদুল ইসলাম', no: 'RSS-2405-008' },
];

/* সিট বরাদ্দ (ডেমো) — m1…m6 admin সদস্য, m7/m8 demo নাম */
export const SEED_RC_SEATS: Record<string, string[]> = {
  rc01: ['m2', 'm3', 'm4', 'm1', 'm5', 'm6', 'm7', 'm8'],
  rc03: ['m2', 'm3', 'm4', 'm1', 'm5', 'm6', 'm7', 'm8'],
  rc04: ['m3', 'm4', 'm5', 'm6', 'm2', 'm8', 'm7', 'm1'],
  rc02: ['m2', 'm3', 'm5', 'm6', 'm7', 'm8'],
};
export const SEED_RC_WAITLIST: Record<string, { memberId: string; pos: number; applied: string }[]> = {
  rc02: [
    { memberId: 'm1', pos: 1, applied: '২০২৬-১০-১৮' },
    { memberId: 'm4', pos: 2, applied: '২০২৬-১০-২১' },
  ],
};
export const SEED_RC_MISSED: Record<string, Record<number, number>> = { rc01: { 6: 1 }, rc04: { 5: 2, 7: 1 } };

const draw = (
  circle: string, no: number, scheduled: string, executed: string | null, method: 'lottery' | 'fixed',
  winnerSeat: number | null, amount: number, receipt: string | null, hash: string | null,
  channel: PayoutKey | null, status: RcDraw['status'], collected: number, shortfall: number,
  cover: string | null, by: string, appr: string | null, candidates: number[] = [],
): RcDraw => ({ id: `${circle}-d${no}`, circle, no, scheduled, executed, method, winnerSeat, amount, receipt, hash, channel, status, collected, shortfall, cover, by, appr, candidates });

export const SEED_RC_DRAWS: RcDraw[] = [
  draw('rc01', 1, '২০২৬-০৬-০৫', '২০২৬-০৬-০৫', 'lottery', 7, 40000, 'RP-2606-0007', 'a3f9c17d', 'cash_office', 'executed', 40000, 0, null, 'সুমি রানী দাস', 'নাসরিন আক্তার'),
  draw('rc01', 2, '২০২৬-০৭-০৫', '২০২৬-০৭-০৫', 'lottery', 1, 40000, 'RP-2607-0001', 'b71e4402', 'bkash', 'executed', 40000, 0, null, 'সুমি রানী দাস', 'নাসরিন আক্তার'),
  draw('rc01', 3, '২০২৬-০৮-০৫', '২০২৬-০৮-০৫', 'lottery', 5, 40000, 'RP-2608-0005', 'c92d55aa', 'cash_office', 'executed', 40000, 0, null, 'রাজু আহমেদ', 'মোঃ আব্দুল্লাহ'),
  draw('rc01', 4, '২০২৬-০৯-০৫', '২০২৬-০৯-০৫', 'lottery', 8, 40000, 'RP-2609-0008', 'd40f8b31', 'bank', 'executed', 38000, 2000, 'বিলম্ব ফি থেকে পূরণ (D-41)', 'রাজু আহমেদ', 'মোঃ আব্দুল্লাহ'),
  draw('rc01', 5, '২০২৬-১০-০৫', '২০২৬-১০-০৫', 'lottery', 2, 40000, 'RP-2610-0002', 'e6a1c094', 'cash_office', 'executed', 40000, 0, null, 'সুমি রানী দাস', 'নাসরিন আক্তার'),
  draw('rc01', 6, '২০২৬-১১-০৫', null, 'lottery', null, 40000, null, null, null, 'approval', 35000, 5000, 'অপেক্ষমাণ — বকেয়া আদায় বা রিজার্ভ (D-38)', 'সুমি রানী দাস', null, [3, 4, 6]),
  draw('rc03', 1, '২০২৫-০৬-১০', '২০২৫-০৬-১০', 'fixed', 4, 80000, 'RP-2506-0004', '1f0c77b2', 'bank', 'executed', 80000, 0, null, 'সুমি রানী দাস', 'মোঃ আব্দুল্লাহ'),
  draw('rc03', 2, '২০২৫-০৭-১০', '২০২৫-০৭-১০', 'fixed', 7, 80000, 'RP-2507-0007', '2a8d31ef', 'cash_office', 'executed', 80000, 0, null, 'রাজু আহমেদ', 'মোঃ আব্দুল্লাহ'),
  draw('rc03', 3, '২০২৫-০৮-১০', '২০২৫-০৮-১০', 'fixed', 2, 80000, 'RP-2508-0002', '3c5b90d4', 'cash_office', 'executed', 80000, 0, null, 'রাজু আহমেদ', 'নাসরিন আক্তার'),
  draw('rc03', 4, '২০২৫-০৯-১০', '২০২৫-০৯-১০', 'fixed', 5, 80000, 'RP-2509-0005', '4d7e12aa', 'bank', 'executed', 80000, 0, null, 'সুমি রানী দাস', 'নাসরিন আক্তার'),
  draw('rc03', 5, '২০২৫-১০-১০', '২০২৫-১০-১০', 'fixed', 1, 80000, 'RP-2510-0001', '5e2f6b18', 'cash_office', 'executed', 80000, 0, null, 'রাজু আহমেদ', 'মোঃ আব্দুল্লাহ'),
  draw('rc03', 6, '২০২৫-১১-১০', '২০২৫-১১-১০', 'fixed', 8, 80000, 'RP-2511-0008', '6f4a8c27', 'bkash', 'executed', 80000, 0, null, 'সুমি রানী দাস', 'মোঃ আব্দুল্লাহ'),
  draw('rc03', 7, '২০২৫-১২-১০', '২০২৫-১২-১০', 'fixed', 3, 80000, 'RP-2512-0003', '7a9b2d35', 'cash_office', 'executed', 80000, 0, null, 'রাজু আহমেদ', 'নাসরিন আক্তার'),
  draw('rc03', 8, '২০২৬-০১-১০', '২০২৬-০১-১০', 'fixed', 6, 80000, 'RP-2601-0006', '8b1c4e46', 'bank', 'executed', 80000, 0, null, 'সুমি রানী দাস', 'মোঃ আব্দুল্লাহ'),
  draw('rc04', 1, '২০২৬-০৮-০৫', '২০২৬-০৮-০৫', 'lottery', 3, 40000, 'RP-2608-0013', '9c3d5f57', 'cash_office', 'executed', 40000, 0, null, 'রাজু আহমেদ', 'নাসরিন আক্তার'),
  draw('rc04', 2, '২০২৬-০৯-০৫', '২০২৬-০৯-০৫', 'lottery', 6, 40000, 'RP-2609-0016', 'ad5e7a68', 'bkash', 'executed', 35000, 5000, 'রিজার্ভ থেকে (D-38)', 'রাজু আহমেদ', 'নাসরিন আক্তার'),
  draw('rc04', 3, '২০২৬-১০-০৫', '২০২৬-১০-০৫', 'lottery', 1, 40000, 'RP-2610-0011', 'be7f9b79', 'cash_office', 'executed', 35000, 5000, 'রিজার্ভ থেকে (D-38)', 'সুমি রানী দাস', 'মোঃ আব্দুল্লাহ'),
  draw('rc04', 4, '২০২৬-১১-০৫', null, 'lottery', null, 40000, null, null, null, 'scheduled', 25000, 15000, 'ডিফল্ট নিষ্পত্তি ছাড়া ড্র হবে না', 'সুমি রানী দাস', null, [2, 4, 5, 7, 8]),
];

export const SEED_RC_DEFAULTS: RcDefault[] = [
  { id: 'rd01', circle: 'rc01', seatNo: 6, missedDraws: [6], amount: 5000, step: 'late_fee', lateFee: 100,
    status: 'open', decidedBy: null, committee: null, noticeSent: '২০২৬-১০-২২',
    note: 'ধাপ ১ সতর্কতা পাঠানো হয়েছে; ধাপ ২ বিলম্ব ফি ৳১০০ প্রযোজ্য (D-41 — চূড়ান্ত নয়)' },
  { id: 'rd02', circle: 'rc04', seatNo: 5, missedDraws: [2, 3], amount: 10000, step: 'replace', lateFee: 200,
    status: 'pending-committee', decidedBy: 'নাসরিন আক্তার', committee: 'CM-2610-02', noticeSent: '২০২৬-০৯-০৮',
    note: 'প্রতিস্থাপন প্রস্তাব কমিটিতে; ঘাটতি ৳১০,০০০ রিজার্ভ থেকে মেটানো হয়েছে (D-38)' },
  { id: 'rd03', circle: 'rc04', seatNo: 7, missedDraws: [3], amount: 5000, step: 'warn', lateFee: 0,
    status: 'open', decidedBy: null, committee: null, noticeSent: '২০২৬-১০-০৬',
    note: 'প্রথম বার; সতর্কতা নোটিশ দেওয়া হয়েছে' },
  { id: 'rd04', circle: 'rc03', seatNo: 3, missedDraws: [7], amount: 10000, step: 'forfeit', lateFee: 200,
    status: 'resolved', decidedBy: 'মোঃ আব্দুল্লাহ', committee: 'CM-2601-01', noticeSent: '২০২৫-১১-১২',
    note: 'সমাপ্ত চক্রে ঘাটতি ক্ষতিপূরণ খাত থেকে নিষ্পত্তি; ড্র ইতিহাস অপরিবর্তিত' },
];

/* ---------------- গণনা ---------------- */
export const rcSchemeById = (list: RcScheme[], id?: string | null) => list.find((s) => s.id === id) ?? list[0];
export const rcCircleById = (list: RcCircle[], id?: string | null) => list.find((c) => c.id === id) ?? list[0];
export const rcPerDraw = (s: RcScheme) => s.seats * s.contrib;
export const rcTotalPool = (s: RcScheme) => rcPerDraw(s) * s.seats;
export const rcDrawsOf = (draws: RcDraw[], circleId: string) => draws.filter((d) => d.circle === circleId).sort((a, b) => a.no - b.no);
export const rcDone = (draws: RcDraw[], circleId: string) => rcDrawsOf(draws, circleId).filter((d) => d.status === 'executed');
export const rcNext = (draws: RcDraw[], circleId: string) => rcDrawsOf(draws, circleId).find((d) => d.status !== 'executed');
export const rcFilled = (seats: Record<string, string[]>, circleId: string) => seats[circleId]?.length ?? 0;

export type SeatRow = RcSeat & {
  status: 'won' | 'due' | 'active' | 'vacant'; contributed: number; paidCount: number; missed: number;
  receivedAmt: number; receivedAt: string | null; receipt: string | null;
};

export function rcSeats(
  circle: RcCircle, scheme: RcScheme, seatMap: Record<string, string[]>, draws: RcDraw[],
  missedMap: Record<string, Record<number, number>>, members: { id: string; name: string; no: string }[],
): SeatRow[] {
  const map = seatMap[circle.id] ?? [];
  const done = rcDone(draws, circle.id);
  const rows: SeatRow[] = map.map((mid, i) => {
    const no = i + 1;
    const mem = members.find((m) => m.id === mid) ?? DEMO_EXTRA.find((m) => m.id === mid);
    const won = done.find((d) => d.winnerSeat === no);
    const missed = missedMap[circle.id]?.[no] ?? 0;
    const paid = Math.max(0, done.length - missed);
    return {
      no, memberId: mid, name: mem?.name ?? '—', isMe: mid === 'm1',
      status: won ? 'won' : missed ? 'due' : 'active',
      contributed: paid * scheme.contrib, paidCount: paid, missed,
      receivedAmt: won ? won.amount : 0, receivedAt: won?.executed ?? null, receipt: won?.receipt ?? null,
    };
  });
  for (let n = map.length + 1; n <= scheme.seats; n += 1) {
    rows.push({ no: n, memberId: null, name: 'খালি সিট', status: 'vacant', contributed: 0, paidCount: 0, missed: 0, receivedAmt: 0, receivedAt: null, receipt: null });
  }
  return rows;
}

export const rcCollected = (circle: RcCircle, scheme: RcScheme, seatMap: Record<string, string[]>, draws: RcDraw[], missedMap: Record<string, Record<number, number>>, members: { id: string; name: string; no: string }[]) =>
  rcSeats(circle, scheme, seatMap, draws, missedMap, members).reduce((s, x) => s + x.contributed, 0);

export const rcShortfall = (circle: RcCircle, scheme: RcScheme, seatMap: Record<string, string[]>, draws: RcDraw[], missedMap: Record<string, Record<number, number>>, members: { id: string; name: string; no: string }[]) =>
  Math.max(0, rcDone(draws, circle.id).length * rcPerDraw(scheme) - rcCollected(circle, scheme, seatMap, draws, missedMap, members));

export const rcCandidates = (rows: SeatRow[]) => rows.filter((s) => s.memberId && s.status !== 'won');
export const rcArrears = (rows: SeatRow[], contrib: number) =>
  rows.filter((s) => s.missed > 0).map((s) => ({ seat: s, gap: s.missed * contrib }));
export const rcHash = (seed: string) => {
  let h = 5381;
  for (let i = 0; i < seed.length; i += 1) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return `0x${h.toString(16).padStart(8, '0')}`;
};
export const rcStepIndex = (step: DefaultStep) => RC_STEP_ORDER.indexOf(step);
export const rcDefaultTotal = (list: RcDefault[]) => list.filter((d) => d.status !== 'resolved').reduce((s, d) => s + d.amount, 0);
