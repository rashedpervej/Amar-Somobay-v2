/* ============================================================
   src/domain/rosca.ts — ROSCA (চক্রভিত্তিক সঞ্চয়) মডিউল
   নিয়ম: প্রতি ড্র-তে পুলের টাকা একজন পান · ফল অপরিবর্তনীয় · কোনো সুদ/মুনাফা নেই
   ডেটা ডেমো, কিন্তু সব হিসাব ফাংশনে গণনা হয় (UI-তে হার্ডকোড নয়)।
   ============================================================ */

export type DrawStatus = 'done' | 'scheduled';
export type SeatStatus = 'won' | 'pending' | 'due';

export type RcDraw = {
  id: string;
  no: number;
  scheduled: string;
  executed?: string;
  amount: number;
  receipt: string;
  hash: string;
  winnerSeat?: number;
  channel: 'cash' | 'bank' | 'bkash';
  status: DrawStatus;
  method: 'lottery' | 'fixed';
};

export type RcSeat = {
  no: number;
  name: string;
  status: SeatStatus;
  contributed: number;
  paidCount: number;
  missed: number;
  receivedAmt: number;
  receivedAt?: string;
  isMe?: boolean;
};

export type RcCircle = {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'completed' | 'forming' | 'risk';
  seatNo: number | null;
  contrib: number;
  seats: number;
  route: string;
  method: 'lottery' | 'fixed';
  start: string;
  end: string;
  nextDate: string;
  witnesses: string[];
  collected: number;
  shortfall: number;
  waitlistPos?: number;
  draws: RcDraw[];
  seatList: RcSeat[];
};

const hash = (s: string) => `0x${s.length.toString(16)}${s.split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(16)}`;

const seatList = (mine: number, wonSeats: number[], names: string[]): RcSeat[] =>
  names.map((name, i) => {
    const no = i + 1;
    const won = wonSeats.includes(no);
    return {
      no,
      name,
      status: won ? 'won' : no === mine ? 'pending' : no % 7 === 0 ? 'due' : 'pending',
      contributed: won ? 6000 : 0,
      paidCount: won ? 6 : 0,
      missed: no % 7 === 0 ? 1 : 0,
      receivedAmt: won ? 12000 : 0,
      receivedAt: won ? '০৫ আগস্ট ২০২৬' : undefined,
      isMe: no === mine,
    };
  });

export const SEED_CIRCLES: RcCircle[] = [
  {
    id: 'rc01',
    code: 'RSS-চক্র-১১',
    name: 'সমবায় চক্র সঞ্চয়',
    status: 'active',
    seatNo: 7,
    contrib: 1000,
    seats: 12,
    route: 'কেশবপুর',
    method: 'lottery',
    start: '০৫ মে ২০২৬',
    end: '০৫ এপ্রিল ২০২৭',
    nextDate: '০৫ নভেম্বর ২০২৬',
    witnesses: ['কাজী নুরুন্নবী', 'রাজু আহমেদ'],
    collected: 33000,
    shortfall: 0,
    draws: [
      { id: 'dr-11-1', no: 1, scheduled: '০৫ মে ২০২৬', executed: '০৫ মে ২০২৬', amount: 12000, receipt: 'RSS-1411-7Q2X', hash: hash('dr-11-1'), winnerSeat: 4, channel: 'cash', status: 'done', method: 'lottery' },
      { id: 'dr-11-2', no: 2, scheduled: '০৫ জুন ২০২৬', executed: '০৫ জুন ২০২৬', amount: 12000, receipt: 'RSS-1412-3K9M', hash: hash('dr-11-2'), winnerSeat: 9, channel: 'bank', status: 'done', method: 'lottery' },
      { id: 'dr-11-3', no: 3, scheduled: '০৫ জুলাই ২০২৬', executed: '০৬ জুলাই ২০২৬', amount: 12000, receipt: 'RSS-1413-8B4T', hash: hash('dr-11-3'), winnerSeat: 2, channel: 'bkash', status: 'done', method: 'lottery' },
      { id: 'dr-11-4', no: 4, scheduled: '০৫ আগস্ট ২০২৬', executed: '০৫ আগস্ট ২০২৬', amount: 12000, receipt: 'RSS-1414-6N1P', hash: hash('dr-11-4'), winnerSeat: 4, channel: 'cash', status: 'done', method: 'lottery' },
      { id: 'dr-11-5', no: 5, scheduled: '০৫ নভেম্বর ২০২৬', amount: 12000, receipt: '—', hash: '—', channel: 'cash', status: 'scheduled', method: 'lottery' },
    ],
    seatList: seatList(7, [4, 9, 2], ['সাবিনা ইয়াসমিন', 'মিলন হোসেন', 'রাশেদা খাতুন', 'নাজমুল হক', 'সালমা বেগম', 'তানভীর আহমেদ', 'রফিকুল ইসলাম', 'শাহিদা পারভীন', 'হাবিবুর রহমান', 'মর্জিনা বেগম', 'আব্দুল করিম', 'ফরিদা আক্তার']),
  },
  {
    id: 'rc02',
    code: 'RSS-চক্র-০৭',
    name: 'সমবায় চক্র সঞ্চয়',
    status: 'completed',
    seatNo: 3,
    contrib: 1000,
    seats: 10,
    route: 'কেশবপুর',
    method: 'fixed',
    start: '০৫ জানু ২০২৫',
    end: '০৫ অক্টোবর ২০২৫',
    nextDate: '—',
    witnesses: ['সভাপতি', 'সচিব'],
    collected: 10000,
    shortfall: 0,
    draws: [
      { id: 'dr-07-3', no: 3, scheduled: '০৫ মার্চ ২০২৫', executed: '০৫ মার্চ ২০২৫', amount: 10000, receipt: 'RSS-1303-5R8W', hash: hash('dr-07-3'), winnerSeat: 3, channel: 'bank', status: 'done', method: 'fixed' },
    ],
    seatList: seatList(3, [3], ['সাবিনা ইয়াসমিন', 'মিলন হোসেন', 'সালমা বেগম', 'নাজমুল হক', 'রাশেদা খাতুন', 'তানভীর আহমেদ', 'রফিকুল ইসলাম', 'শাহিদা পারভীন', 'হাবিবুর রহমান', 'মর্জিনা বেগম']),
  },
  {
    id: 'rc03',
    code: 'RSS-চক্র-১৪',
    name: 'নতুন চক্র (গঠনধীন)',
    status: 'forming',
    seatNo: null,
    contrib: 1500,
    seats: 12,
    route: 'কেশবপুর',
    method: 'fixed',
    start: '০১ ডিসেম্বর ২০২৬',
    end: '০১ নভেম্বর ২০২৭',
    nextDate: '০১ ডিসেম্বর ২০২৬',
    witnesses: ['কমিটি-৩'],
    collected: 0,
    shortfall: 0,
    waitlistPos: 4,
    draws: [],
    seatList: seatList(0, [], ['—', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—']),
  },
];

/* ------------------------- গণনা ------------------------- */

export const perDraw = (c: RcCircle) => c.contrib * c.seats;
export const totalPool = (c: RcCircle) => perDraw(c) * c.seats;
export const doneDraws = (c: RcCircle) => c.draws.filter((d) => d.status === 'done');
export const nextDraw = (c: RcCircle) => c.draws.find((d) => d.status === 'scheduled');
export const candidates = (c: RcCircle) => c.seatList.filter((s) => s.status !== 'won').length;
export const mySeat = (c: RcCircle) => c.seatList.find((s) => s.isMe);
export const myDraws = (c: RcCircle) => doneDraws(c).filter((d) => d.winnerSeat === c.seatNo);
export const drawById = (c: RcCircle, id?: string) => c.draws.find((d) => d.id === id);
export const myContributed = (c: RcCircle) => mySeat(c)?.contributed ?? 0;
export const myReceived = (c: RcCircle) => myDraws(c).reduce((s, d) => s + d.amount, 0);
export const circleProgress = (c: RcCircle) => Math.round((doneDraws(c).length / c.seats) * 100);
export const myArrears = (c: RcCircle) => {
  const s = mySeat(c);
  return s ? s.missed * c.contrib : 0;
};
/** আগামী ড্র-তে আমার সম্ভাবনা: বাকি সদস্যদের মধ্যে সমান */
export const myChance = (c: RcCircle) => {
  const left = candidates(c);
  return left === 0 ? 0 : Math.round(100 / left);
};
export const channelLabel = (ch: RcDraw['channel']) =>
  ch === 'cash' ? 'মাঠ সংগ্রহ (নগদ)' : ch === 'bank' ? 'ব্যাংক' : 'বিকাশ';
