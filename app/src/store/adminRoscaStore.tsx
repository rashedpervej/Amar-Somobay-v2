/* ============================================================
   src/store/adminRoscaStore.tsx — RAM-01…RAM-12 স্টেট
   ডেমো: ইন-মেমরি; কোনো DB/নেটওয়ার্ক নেই। নিয়ম: ড্র অপরিবর্তনীয়,
   maker ≠ checker, রসিদ অনন্য, কোনো সুদ/মুনাফা নেই (BR-13)।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SEED_RC_CIRCLES, SEED_RC_DEFAULTS, SEED_RC_DRAWS, SEED_RC_MISSED, SEED_RC_SCHEMES, SEED_RC_SEATS,
  SEED_RC_WAITLIST, rcHash, rcSchemeById, type DefaultStep, type PayoutKey, type RcCircle, type RcDefault,
  type RcDraw, type RcScheme,
} from '../domain/adminRosca';
import { SEED_MEMBERS } from '../domain/admin';

export type RcEvent = { id: string; at: string; what: string; ref: string; tone: string };
type Res = { ok: boolean; message: string };
type DrawInput = { winnerSeat: number; approver: string; channel: PayoutKey; note: string; collected: number };
type SchemeInput = { code: string; name: string; seats: number; contrib: number; freq: string; drawMethod: 'lottery' | 'fixed' };

export type RoCtx = {
  state: {
    schemes: RcScheme[]; circles: RcCircle[]; draws: RcDraw[]; seats: Record<string, string[]>;
    waitlist: typeof SEED_RC_WAITLIST; missed: Record<string, Record<number, number>>;
    defaults: RcDefault[]; events: RcEvent[];
  };
  collect: (circleId: string, seatNo: number) => Res;
  executeDraw: (drawId: string, input: DrawInput) => Res;
  advanceDefault: (id: string) => Res;
  resolveDefault: (id: string, committee: string) => Res;
  replaceSeat: (defaultId: string, memberId: string) => Res;
  assignSeat: (circleId: string, seatNo: number, memberId: string) => Res;
  startCircle: (schemeId: string) => Res;
  saveScheme: (input: SchemeInput) => Res;
  archiveScheme: (id: string) => Res;
  reset: () => void;
};

type RoState = {
  schemes: RcScheme[]; circles: RcCircle[]; draws: RcDraw[]; seats: Record<string, string[]>;
  waitlist: typeof SEED_RC_WAITLIST; missed: Record<string, Record<number, number>>;
  defaults: RcDefault[]; events: RcEvent[];
};

const INITIAL: RoState = {
  schemes: SEED_RC_SCHEMES,
  circles: SEED_RC_CIRCLES,
  draws: SEED_RC_DRAWS,
  seats: SEED_RC_SEATS,
  waitlist: SEED_RC_WAITLIST,
  missed: SEED_RC_MISSED,
  defaults: SEED_RC_DEFAULTS,
  events: [
    { id: 'ev1', at: '২০২৬-১০-২২', what: 'সতর্কতা নোটিশ পাঠানো হয়েছে', ref: 'rd01 · RC-2606-01', tone: 'info' as const },
    { id: 'ev2', at: '২০২৬-১০-০৫', what: 'ড্র ৫ সম্পন্ন · রসিদ RP-2610-0002', ref: 'RC-2606-01', tone: 'ok' as const },
  ],
};

const AdminRoCtx = createContext<RoCtx | null>(null);
const SEQ = { n: 0 };
const nextId = (p: string) => { SEQ.n += 1; return `${p}${SEQ.n}`; };
const todayBn = () => '২০২৬-১০-৩১';

export function AdminRoscaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(INITIAL);

  const collect: RoCtx['collect'] = useCallback((circleId, seatNo) => {
    const circle = state.circles.find((c) => c.id === circleId);
    if (!circle) return { ok: false, message: 'চক্র পাওয়া যায়নি' };
    if (circle.status === 'completed') return { ok: false, message: 'সমাপ্ত চক্রে কিস্তি নেওয়া যায় না' };
    const due = state.missed[circleId]?.[seatNo] ?? 0;
    if (!due) return { ok: false, message: 'এই সিটে কোনো বকেয়া নেই — সাধারণ কিস্তি ইতিমধ্যে আদায় হয়েছে' };
    setState((s) => ({
      ...s,
      missed: { ...s.missed, [circleId]: { ...(s.missed[circleId] ?? {}), [seatNo]: due - 1 } },
      events: [{ id: nextId('ev'), at: todayBn(), what: `সিট ${seatNo} · ১ কিস্তি আদায়`, ref: circle.code, tone: 'ok' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `সিট ${seatNo} — ১ কিস্তি আদায় হয়েছে (ডেমো); বকেয়া ${due - 1}টি` };
  }, [state.circles, state.missed]);

  const executeDraw: RoCtx['executeDraw'] = useCallback((drawId, input) => {
    const d = state.draws.find((x) => x.id === drawId);
    if (!d) return { ok: false, message: 'ড্র পাওয়া যায়নি' };
    if (d.status === 'executed') return { ok: false, message: 'সম্পন্ন ড্র অপরিবর্তনীয় — সংশোধন লাগলে রিভার্সাল-জোড়া (R-02)' };
    if (input.winnerSeat === d.winnerSeat && d.status === 'approval' && !d.appr) { /* winner may be pre-set */ }
    if (!input.approver) return { ok: false, message: 'অনুমোদনকারী বাছাই করুন' };
    if (input.approver === d.by) return { ok: false, message: 'নিজে প্রস্তুত করে নিজে অনুমোদন করা যাবে না (BR-04)' };
    if (!input.winnerSeat) return { ok: false, message: 'প্রাপক সিট বাছাই করুন' };
    if (!input.note.trim() || input.note.trim().length < 5) return { ok: false, message: 'অনুমোদন মন্তব্য লিখুন (কমপক্ষে ৫ অক্ষর)' };
    const shortfall = Math.max(0, d.amount - input.collected);
    const receipt = `RP-2610-${String(100 + SEQ.n + 1).padStart(4, '0')}`;
    setState((s) => ({
      ...s,
      draws: s.draws.map((x) => (x.id === drawId ? {
        ...x, status: 'executed' as const, winnerSeat: input.winnerSeat, executed: todayBn(),
        receipt, hash: rcHash(`${d.id}-${input.winnerSeat}-${input.approver}`), channel: input.channel,
        collected: input.collected, shortfall, cover: shortfall ? 'ঘাটতি — সিদ্ধান্ত নথিভুক্ত (D-38)' : null,
        appr: input.approver,
      } : x)),
      events: [{ id: nextId('ev'), at: todayBn(), what: `ড্র ${d.no} সম্পন্ন · ${receipt}`, ref: d.circle.toUpperCase(), tone: 'ok' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `ড্র ${d.no} সম্পন্ন — রসিদ ${receipt}, হ্যাশ তৈরি; এখন অপরিবর্তনীয় (BR-08)` };
  }, [state.draws]);

  const advanceDefault: RoCtx['advanceDefault'] = useCallback((id) => {
    const d = state.defaults.find((x) => x.id === id);
    if (!d) return { ok: false, message: 'কেস পাওয়া যায়নি' };
    if (d.status === 'resolved') return { ok: false, message: 'নিষ্পত্তি হওয়া কেসে ধাপ বাড়ানো যায় না' };
    const idx = ['warn', 'late_fee', 'replace', 'forfeit'].indexOf(d.step);
    const next = (['warn', 'late_fee', 'replace', 'forfeit'] as DefaultStep[])[Math.min(3, idx + 1)];
    if (next === d.step) return { ok: false, message: 'শেষ ধাপে আছে — কমিটির সিদ্ধান্ত লাগবে (D-46)' };
    setState((s) => ({
      ...s,
      defaults: s.defaults.map((x) => (x.id === id ? { ...x, step: next, status: next === 'warn' ? 'open' as const : 'pending-committee' as const, noticeSent: todayBn() } : x)),
      events: [{ id: nextId('ev'), at: todayBn(), what: `প্রতিকার ধাপ বাড়ানো · ${next}`, ref: d.id, tone: 'warn' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `কেস ${d.id} — পরবর্তী ধাপে নেওয়া হয়েছে (${next}); নোটিশ তারিখ হালনাগাদ` };
  }, [state.defaults]);

  const resolveDefault: RoCtx['resolveDefault'] = useCallback((id, committee) => {
    if (committee.trim().length < 4) return { ok: false, message: 'কমিটির সিদ্ধান্ত নম্বর লিখুন (কমপক্ষে ৪ অক্ষর)' };
    const d = state.defaults.find((x) => x.id === id);
    if (!d) return { ok: false, message: 'কেস পাওয়া যায়নি' };
    if (d.status === 'resolved') return { ok: false, message: 'ইতিমধ্যে নিষ্পত্তি হয়েছে' };
    setState((s) => ({
      ...s,
      defaults: s.defaults.map((x) => (x.id === id ? { ...x, status: 'resolved' as const, committee: committee.trim(), decidedBy: 'আপনি (MANAGER)' } : x)),
      events: [{ id: nextId('ev'), at: todayBn(), what: 'ডিফল্ট কেস নিষ্পত্তি', ref: `${d.id} · ${committee.trim()}`, tone: 'ok' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: 'কেস নিষ্পত্তি হয়েছে — সিদ্ধান্ত ও সাক্ষী নথিভুক্ত (ডেমো)' };
  }, [state.defaults]);

  const replaceSeat: RoCtx['replaceSeat'] = useCallback((defaultId, memberId) => {
    const d = state.defaults.find((x) => x.id === defaultId);
    if (!d) return { ok: false, message: 'কেস পাওয়া যায়নি' };
    if (!memberId) return { ok: false, message: 'ওয়েটলিস্ট থেকে সদস্য বাছাই করুন' };
    const already = (state.seats[d.circle] ?? []).includes(memberId);
    if (already) return { ok: false, message: 'এই সদস্য ইতিমধ্যে চক্রে আছেন' };
    setState((s) => {
      const map = [...(s.seats[d.circle] ?? [])];
      map[d.seatNo - 1] = memberId;
      const missed = { ...(s.missed[d.circle] ?? {}) };
      delete missed[d.seatNo];
      return {
        ...s,
        seats: { ...s.seats, [d.circle]: map },
        missed: { ...s.missed, [d.circle]: missed },
        defaults: s.defaults.map((x) => (x.id === defaultId ? { ...x, status: 'resolved' as const, committee: x.committee ?? 'CM-2610-07', decidedBy: 'আপনি (MANAGER)' } : x)),
        events: [{ id: nextId('ev'), at: todayBn(), what: `সিট ${d.seatNo} প্রতিস্থাপন`, ref: `${d.circle.toUpperCase()} · ${memberId}`, tone: 'ok' }, ...s.events].slice(0, 40),
      };
    });
    return { ok: true, message: 'সিট প্রতিস্থাপন হয়েছে — বহির্গত সদস্যের জমার নিষ্পত্তি D-46 অনুযায়ী কমিটির সিদ্ধান্তে (ডেমো)' };
  }, [state.defaults, state.seats]);

  const assignSeat: RoCtx['assignSeat'] = useCallback((circleId, seatNo, memberId) => {
    if (!memberId) return { ok: false, message: 'সদস্য বাছাই করুন' };
    const map = state.seats[circleId] ?? [];
    if (map.includes(memberId)) return { ok: false, message: 'এই সদস্য ইতিমধ্যে চক্রে আছেন' };
    setState((s) => {
      const next = [...(s.seats[circleId] ?? [])];
      if (seatNo > next.length) next[seatNo - 1] = memberId;
      else next[seatNo - 1] = memberId;
      return {
        ...s,
        seats: { ...s.seats, [circleId]: next.filter(Boolean) },
        events: [{ id: nextId('ev'), at: todayBn(), what: `সিট ${seatNo} বরাদ্দ`, ref: `${circleId.toUpperCase()} · ${memberId}`, tone: 'info' }, ...s.events].slice(0, 40),
      };
    });
    return { ok: true, message: `সিট ${seatNo} বরাদ্দ হয়েছে (ডেমো)` };
  }, [state.seats]);

  const startCircle: RoCtx['startCircle'] = useCallback((schemeId) => {
    const sc = state.schemes.find((x) => x.id === schemeId);
    if (!sc) return { ok: false, message: 'স্কিম পাওয়া যায়নি' };
    if (sc.status === 'archived') return { ok: false, message: 'আর্কাইভড স্কিমে নতুন চক্র খোলা যায় না' };
    const n = state.circles.length + 1;
    const circle: RcCircle = {
      id: `rc9${n}`, code: `RC-2611-0${n}`, scheme: sc.id, start: '২০২৬-১২-০১', end: '২০২৭-০৮-০১',
      status: 'forming', route: 'R2 · গৌরীঘোনা', branch: 'কেশবপুর শাখা', manager: 'আপনি (MANAGER)',
      nextDate: '২০২৬-১২-০৫', witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ'],
    };
    setState((s) => ({
      ...s,
      circles: [...s.circles, circle],
      seats: { ...s.seats, [circle.id]: [] },
      events: [{ id: nextId('ev'), at: todayBn(), what: `নতুন চক্র ${circle.code}`, ref: sc.code, tone: 'info' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `${circle.code} তৈরি হয়েছে — সিট পূর্ণ হলে প্রথম ড্র সম্ভব (ডেমো)` };
  }, [state.circles, state.schemes]);

  const saveScheme: RoCtx['saveScheme'] = useCallback((input) => {
    if (!/^RCS-\d{2}$/.test(input.code.trim())) return { ok: false, message: 'কোডের ধারা RCS-01' };
    if (state.schemes.some((x) => x.code === input.code.trim())) return { ok: false, message: 'এই কোড আগেই ব্যবহৃত — কোড অপরিবর্তনীয় (BR-08)' };
    if (input.name.trim().length < 4) return { ok: false, message: 'স্কিমের নাম লিখুন' };
    if (!Number.isInteger(input.seats) || input.seats < 6 || input.seats > 20) return { ok: false, message: 'সিট সংখ্যা ৬–২০ এর মধ্যে হতে হবে' };
    if (!Number.isInteger(input.contrib) || input.contrib < 200 || input.contrib > 20000) return { ok: false, message: 'কিস্তি ৳২০০–৳২০,০০০ এর মধ্যে' };
    if (input.drawMethod === 'lottery' && input.seats < 8) return { ok: false, message: 'লটারি পদ্ধতিতে কমপক্ষে ৮ সিট লাগবে' };
    const sc: RcScheme = {
      id: `rs9${state.schemes.length + 1}`, code: input.code.trim(), name: input.name.trim(), seats: input.seats,
      contrib: input.contrib, freq: input.freq, joinFee: 0, drawMethod: input.drawMethod, minMembers: Math.min(input.seats, 6),
      maxCirclesPerMember: 3, lateFee: Math.round(input.contrib * 0.02), payout: ['cash_office', 'bkash', 'bank'],
      defaultPolicy: ['warn', 'late_fee', 'replace'], version: 1, status: 'active',
      note: 'নতুন স্কিম — কিস্তি ও সিট সংখ্যা চক্র শুরুর পর বদলানো যাবে না',
    };
    setState((s) => ({ ...s, schemes: [...s.schemes, sc], events: [{ id: nextId('ev'), at: todayBn(), what: 'নতুন স্কিম সংস্করণ', ref: sc.code, tone: 'info' }, ...s.events].slice(0, 40) }));
    return { ok: true, message: `${sc.code} তৈরি হয়েছে — নিয়ম সংস্করণ v1 (ডেমো)` };
  }, [state.schemes]);

  const archiveScheme: RoCtx['archiveScheme'] = useCallback((id) => {
    const sc = state.schemes.find((x) => x.id === id);
    if (!sc) return { ok: false, message: 'স্কিম পাওয়া যায়নি' };
    if (sc.status === 'archived') return { ok: false, message: 'ইতিমধ্যে আর্কাইভড' };
    if (state.circles.some((c) => c.scheme === id && (c.status === 'active' || c.status === 'risk'))) {
      return { ok: false, message: 'চলমান চক্র আছে — নতুন ভর্তি বন্ধ করুন, স্কিম মোছা যাবে না' };
    }
    setState((s) => ({ ...s, schemes: s.schemes.map((x) => (x.id === id ? { ...x, status: 'archived' as const } : x)) }));
    return { ok: true, message: `${sc.code} আর্কাইভ হয়েছে — পুরোনো চক্রের হিসাব অপরিবর্তিত` };
  }, [state.schemes, state.circles]);

  const reset = useCallback(() => setState(INITIAL), []);
  const value = useMemo<RoCtx>(() => ({ state, collect, executeDraw, advanceDefault, resolveDefault, replaceSeat, assignSeat, startCircle, saveScheme, archiveScheme, reset }),
    [state, collect, executeDraw, advanceDefault, resolveDefault, replaceSeat, assignSeat, startCircle, saveScheme, archiveScheme, reset]);

  return <AdminRoCtx.Provider value={value}>{children}</AdminRoCtx.Provider>;
}

export function useAdminRo() {
  const ctx = useContext(AdminRoCtx);
  if (!ctx) throw new Error('useAdminRo — AdminRoscaProvider-এর বাইরে');
  return ctx;
}

export const rcMembers = SEED_MEMBERS;
export const rcSchemeOf = rcSchemeById;
