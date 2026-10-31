/* ============================================================
   src/store/adminJointStore.tsx — JAM-01…JAM-10 স্টেট (যৌথ লক্ষ্য · অ্যাডমিন)
   নিয়ম: যোগদানে Admin অনুমোদন (D-49) · প্রমাণ ছাড়া বিতরণ নয় (D-50) ·
   maker ≠ checker (BR-04) · ব্যক্তিগত উত্তোলন নেই (BR-19)।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SEED_JCONTRIBS, SEED_JDISB, SEED_JGOALS, SEED_JPARTS, TODAY_ISO, jgActive, jgGoalById, jgLimitLeft,
  type JDisb, type JGoal, type JPart, type JContrib,
} from '../domain/adminJoint';

type Res = { ok: boolean; message: string };
export type JgEvent = { id: string; at: string; what: string; ref: string; tone: string };
export type GoalInput = { name: string; desc: string; target: number; targetDate: string; crule: 'fixed' | 'flexible'; monthly: number; maxParts: number; join: 'invited' | 'open' };
export type DisbInput = { purpose: string; payee: string; amount: number; channel: 'cash_office' | 'bkash' | 'bank'; evidence: string };

export type JgCtx = {
  state: {
    goals: JGoal[]; parts: JPart[]; contribs: JContrib[]; disbs: JDisb[]; events: JgEvent[];
  };
  approveJoin: (goalId: string, memberId: string) => Res;
  rejectJoin: (goalId: string, memberId: string) => Res;
  recordContrib: (goalId: string, memberId: string, amount: number, channel: JContrib['channel']) => Res;
  requestDisb: (goalId: string, input: DisbInput) => Res;
  approveDisb: (id: string, approver: string) => Res;
  rejectDisb: (id: string) => Res;
  createGoal: (input: GoalInput) => Res;
  extendGoal: (goalId: string) => Res;
  settleApprove: (goalId: string, approver: string) => Res;
  advancePart: (goalId: string, memberId: string) => Res;
  reset: () => void;
};

type JgState = {
  goals: JGoal[]; parts: JPart[]; contribs: JContrib[]; disbs: JDisb[]; events: JgEvent[];
};

const INITIAL: JgState = {
  goals: SEED_JGOALS,
  parts: SEED_JPARTS,
  contribs: SEED_JCONTRIBS,
  disbs: SEED_JDISB,
  events: [
    { id: 'je1', at: '২০২৬-১০-১২', what: 'এককালীন অবদান অনুমোদিত (D-49)', ref: 'jg02 · m2', tone: 'info' as const },
    { id: 'je2', at: '২০২৬-১০-০৫', what: 'লক্ষ্য পূরণ — ১০০% মাইলস্টোন', ref: 'jg02', tone: 'ok' as const },
    { id: 'je3', at: '২০২৬-১০-০২', what: '৮ জনকে আমন্ত্রণ পাঠানো হয়েছে', ref: 'jg04', tone: 'info' as const },
  ],
};

const JgAdminCtx = createContext<JgCtx | null>(null);
const SEQ = { n: 0 };
const nextId = (p: string) => { SEQ.n += 1; return `${p}${SEQ.n}`; };
const todayBn = () => '২০২৬-১০-৩১';

export function AdminJointProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(INITIAL);

  const approveJoin: JgCtx['approveJoin'] = useCallback((goalId, memberId) => {
    const g = jgGoalById(state.goals, goalId);
    if (!g) return { ok: false, message: 'লক্ষ্য পাওয়া যায়নি' };
    const p = state.parts.find((x) => x.goal === goalId && x.memberId === memberId);
    if (!p) return { ok: false, message: 'অংশগ্রহণের আবেদন পাওয়া যায়নি' };
    if (p.status !== 'pending' && p.status !== 'invited') return { ok: false, message: 'এই আবেদন অনুমোদনের অপেক্ষায় নেই' };
    const count = state.parts.filter((x) => x.goal === goalId && x.status !== 'removed' && x.status !== 'invited').length;
    if (count >= g.maxParts) return { ok: false, message: 'অংশগ্রহণকারীর সর্বোচ্চ সীমা পূর্ণ' };
    if (p.status === 'pending' && p.pledged <= 0) return { ok: false, message: 'প্রতিশ্রুতির অঙ্ক নেই — সদস্যের সঙ্গে নিশ্চিত করুন' };
    setState((s) => ({
      ...s,
      parts: s.parts.map((x) => (x.goal === goalId && x.memberId === memberId
        ? { ...x, status: 'active' as const, approvedBy: 'আপনি (MANAGER)', joinedAt: TODAY_ISO } : x)),
      events: [{ id: nextId('je'), at: todayBn(), what: 'যোগদান অনুমোদিত (D-49)', ref: `${g.code} · ${memberId}`, tone: 'ok' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: 'যোগদান অনুমোদিত — অংশগ্রহণকারী এখন সক্রিয়; সদস্যকে SMS যাবে (ডেমো)' };
  }, [state.goals, state.parts]);

  const rejectJoin: JgCtx['rejectJoin'] = useCallback((goalId, memberId) => {
    const g = jgGoalById(state.goals, goalId);
    if (!g) return { ok: false, message: 'লক্ষ্য পাওয়া যায়নি' };
    setState((s) => ({
      ...s,
      parts: s.parts.map((x) => (x.goal === goalId && x.memberId === memberId ? { ...x, status: 'removed' as const } : x)),
      events: [{ id: nextId('je'), at: todayBn(), what: 'যোগদান প্রত্যাখ্যাত (কারণসহ)', ref: `${g.code} · ${memberId}`, tone: 'warn' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: 'আবেদন প্রত্যাখ্যাত — কারণ লিপিবদ্ধ হয়েছে, সদস্যকে জানানো হবে (ডেমো)' };
  }, [state.goals]);

  const recordContrib: JgCtx['recordContrib'] = useCallback((goalId, memberId, amount, channel) => {
    const g = jgGoalById(state.goals, goalId);
    if (!g) return { ok: false, message: 'লক্ষ্য পাওয়া যায়নি' };
    if (g.status === 'closed' || g.status === 'settling') return { ok: false, message: 'এই লক্ষ্যে নতুন অবদান নেওয়া বন্ধ' };
    if (!Number.isInteger(amount) || amount < 1) return { ok: false, message: 'অবদানের অঙ্ক সঠিকভাবে লিখুন' };
    if (amount > 100000) return { ok: false, message: 'একবারে সর্বোচ্চ ৳১,০০,০০০ — বড় অঙ্কে অনুমোদন লাগবে' };
    const p = state.parts.find((x) => x.goal === goalId && x.memberId === memberId);
    if (!p || (p.status !== 'active' && p.status !== 'behind')) return { ok: false, message: 'সদস্য এই লক্ষ্যে সক্রিয় অংশগ্রহণকারী নন' };
    const ym = '2610';
    const receipt = `JC-${ym}-${String(state.contribs.filter((c) => c.at.startsWith('2026-10')).length + 1).padStart(4, '0')}`;
    setState((s) => {
      const paid = p.paid + amount;
      const gap = Math.max(0, (p.pledged || 0) - paid);
      return {
        ...s,
        contribs: [...s.contribs, { goal: goalId, memberId, amount, at: TODAY_ISO, receipt, channel, by: 'কাউন্টার-২ · সুমি রানী দাস', txn: `TXN-${ym}-${receipt.slice(-4)}` }],
        parts: s.parts.map((x) => (x.goal === goalId && x.memberId === memberId ? { ...x, paid, status: gap ? (x.status as 'behind' | 'active') : 'active' as const } : x)),
        events: [{ id: nextId('je'), at: todayBn(), what: `অবদান ${amount} টাকা · ${receipt}`, ref: `${g.code} · ${memberId}`, tone: 'ok' }, ...s.events].slice(0, 40),
      };
    });
    return { ok: true, message: `অবদান রেকর্ড হয়েছে — রসিদ ${receipt}; লক্ষ্য-নির্দিষ্ট তহবিলে জমা (BR-19)` };
  }, [state.goals, state.parts, state.contribs]);

  const requestDisb: JgCtx['requestDisb'] = useCallback((goalId, input) => {
    const g = jgGoalById(state.goals, goalId);
    if (!g) return { ok: false, message: 'লক্ষ্য পাওয়া যায়নি' };
    if (g.status !== 'achieved' && g.status !== 'settling') return { ok: false, message: 'লক্ষ্য পূরণের আগে বিতরণ ভাউচার তৈরি হয় না (BR-19)' };
    if (input.purpose.trim().length < 5) return { ok: false, message: 'কাজের বিবরণ লিখুন (কমপক্ষে ৫ অক্ষর)' };
    if (input.payee.trim().length < 3) return { ok: false, message: 'প্রাপকের নাম লিখুন' };
    if (!Number.isInteger(input.amount) || input.amount < 100) return { ok: false, message: 'ভাউচারের অঙ্ক কমপক্ষে ৳১০০' };
    if (input.evidence.trim().length < 3) return { ok: false, message: 'প্রমাণের রেফারেন্স ছাড়া ভাউচার তৈরি হবে না (D-50)' };
    const n = state.disbs.length + 1;
    const disb: JDisb = {
      id: `jd9${n}`, goal: goalId, no: `JD-2610-${String(n).padStart(4, '0')}`, purpose: input.purpose.trim(),
      payee: input.payee.trim(), amount: input.amount, at: TODAY_ISO, status: 'approval', channel: input.channel,
      committee: g.committee, decision: 'কমিটির লিখিত সিদ্ধান্ত (D-50)', by: 'আপনি (MANAGER)', appr: null,
      evidence: input.evidence.split(/[,،]/).map((x) => x.trim()).filter(Boolean), note: 'maker ≠ checker (BR-04) — অনুমোদনকারী আলাদা হতে হবে',
    };
    setState((s) => ({ ...s, disbs: [disb, ...s.disbs], events: [{ id: nextId('je'), at: todayBn(), what: `বিতরণ ভাউচার ${disb.no}`, ref: g.code, tone: 'info' }, ...s.events].slice(0, 40) }));
    return { ok: true, message: `${disb.no} অনুমোদনের জন্য পাঠানো হয়েছে — প্রমাণ ${disb.evidence.length}টি সংযুক্ত` };
  }, [state.goals, state.disbs]);

  const approveDisb: JgCtx['approveDisb'] = useCallback((id, approver) => {
    const d = state.disbs.find((x) => x.id === id);
    if (!d) return { ok: false, message: 'ভাউচার পাওয়া যায়নি' };
    if (d.status === 'paid') return { ok: false, message: 'ইতিমধ্যে পরিশোধিত' };
    if (d.status !== 'approval') return { ok: false, message: 'এই ভাউচার অনুমোদনের অপেক্ষায় নেই' };
    if (!approver) return { ok: false, message: 'অনুমোদনকারী বাছাই করুন' };
    if (approver === (d.by ?? '')) return { ok: false, message: 'নিজে প্রস্তুত করে নিজে অনুমোদন করা যাবে না (BR-04)' };
    setState((s) => ({
      ...s,
      disbs: s.disbs.map((x) => (x.id === id ? { ...x, status: 'paid' as const, appr: approver, at: TODAY_ISO, hash: `0x${(SEQ.n + 991).toString(16)}a2` } : x)),
      events: [{ id: nextId('je'), at: todayBn(), what: `ভাউচার ${d.no} পরিশোধিত`, ref: d.goal.toUpperCase(), tone: 'ok' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `${d.no} অনুমোদিত ও পরিশোধিত — হ্যাশ ও অনুমোদনকারী নথিভুক্ত (ডেমো)` };
  }, [state.disbs]);

  const rejectDisb: JgCtx['rejectDisb'] = useCallback((id) => {
    const d = state.disbs.find((x) => x.id === id);
    if (!d) return { ok: false, message: 'ভাউচার পাওয়া যায়নি' };
    if (d.status === 'paid') return { ok: false, message: 'পরিশোধিত ভাউচার ফেরানো যাবে না — রিভার্সাল লাগবে' };
    setState((s) => ({ ...s, disbs: s.disbs.map((x) => (x.id === id ? { ...x, status: 'blocked' as const, note: 'প্রমাণ অপর্যাপ্ত — আটকে রাখা হয়েছে (D-50)' } : x)) }));
    return { ok: true, message: `${d.no} আটকে রাখা হয়েছে — প্রমাণ অপর্যাপ্ত; অর্থ মুক্তি পায়নি` };
  }, [state.disbs]);

  const createGoal: JgCtx['createGoal'] = useCallback((input) => {
    if (jgLimitLeft(state.goals) <= 0) return { ok: false, message: 'সক্রিয় লক্ষ্যের সীমা (৫) পূর্ণ — প্ল্যান আপগ্রেড বা পুরোনো লক্ষ্য বন্ধ করুন (D-43)' };
    if (input.name.trim().length < 4) return { ok: false, message: 'লক্ষ্যের নাম লিখুন (কমপক্ষে ৪ অক্ষর)' };
    if (input.desc.trim().length < 10) return { ok: false, message: 'উদ্দেশ্যের বিবরণ লিখুন (কমপক্ষে ১০ অক্ষর)' };
    if (!Number.isInteger(input.target) || input.target < 1000) return { ok: false, message: 'লক্ষ্য অঙ্ক কমপক্ষে ৳১,০০০' };
    if (input.targetDate <= TODAY_ISO) return { ok: false, message: 'মেয়াদ আগামীকাল বা তার পরে হতে হবে' };
    if (input.maxParts < 3 || input.maxParts > 50) return { ok: false, message: 'অংশগ্রহণকারী সীমা ৩–৫০' };
    if (input.crule === 'fixed' && (!Number.isInteger(input.monthly) || input.monthly < 10)) return { ok: false, message: 'মাসিক অবদানের অঙ্ক লিখুন' };
    if (input.crule === 'flexible' && input.monthly > input.target) return { ok: false, message: 'ন্যূনতম অবদান লক্ষ্য অঙ্কের চেয়ে বড় হতে পারে না' };
    const n = state.goals.length + 1;
    const goal: JGoal = {
      id: `jg9${n}`, code: `JG-2611-0${n}`, name: input.name.trim(), desc: input.desc.trim(),
      target: input.target, targetDate: input.targetDate, start: TODAY_ISO, payDay: 5,
      crule: input.crule, min: input.crule === 'flexible' ? input.monthly : null, max: null,
      monthly: input.crule === 'fixed' ? input.monthly : null, monthlyMin: input.monthly,
      join: input.join, maxParts: input.maxParts, needApproval: true, ownership: 'earmarked',
      deadlinePolicy: ['extend', 'refund'], use: ['vendor', 'committee'], status: 'forming', version: 1,
      createdBy: 'আপনি (MANAGER)', createdAt: TODAY_ISO, owner: 'আপনি (MANAGER)', branch: 'কেশবপুর শাখা',
      committee: 'নতুন — কমিটির সিদ্ধান্ত যোগ করতে হবে', publish: true,
      note: 'নতুন লক্ষ্য — কমিটির সিদ্ধান্ত নম্বর পরে যোগ করতে হবে',
    };
    setState((s) => ({ ...s, goals: [...s.goals, goal], events: [{ id: nextId('je'), at: todayBn(), what: 'নতুন যৌথ লক্ষ্য তৈরি', ref: goal.code, tone: 'info' }, ...s.events].slice(0, 40) }));
    return { ok: true, message: `${goal.code} তৈরি হয়েছে — যোগদানে Admin অনুমোদন বাধ্যতামূলক (D-49)` };
  }, [state.goals]);

  const extendGoal: JgCtx['extendGoal'] = useCallback((goalId) => {
    const g = jgGoalById(state.goals, goalId);
    if (!g) return { ok: false, message: 'লক্ষ্য পাওয়া যায়নি' };
    if (g.status !== 'expired' && g.status !== 'active' && g.status !== 'forming') return { ok: false, message: 'এই অবস্থায় মেয়াদ বাড়ানো যায় না' };
    if (g.deadlinePolicy.indexOf('extend') < 0) return { ok: false, message: 'এই লক্ষ্যের নীতিতে মেয়াদ বাড়ানোর সুযোগ নেই (D-39)' };
    const d = new Date(`${g.targetDate}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + 6);
    const next = d.toISOString().slice(0, 10);
    setState((s) => ({
      ...s,
      goals: s.goals.map((x) => (x.id === goalId ? { ...x, targetDate: next, status: x.status === 'expired' ? 'active' as const : x.status, note: `${x.note} · মেয়াদ একবার বাড়ানো হয়েছে (${next})` } : x)),
      events: [{ id: nextId('je'), at: todayBn(), what: `মেয়াদ বাড়ানো — ${next} (D-39)`, ref: g.code, tone: 'warn' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `মেয়াদ ছয় মাস বাড়ানো হয়েছে (${next}) — একবারই, নোটিশ যাবে (ডেমো)` };
  }, [state.goals]);

  const settleApprove: JgCtx['settleApprove'] = useCallback((goalId, approver) => {
    const g = jgGoalById(state.goals, goalId);
    if (!g) return { ok: false, message: 'লক্ষ্য পাওয়া যায়নি' };
    if (g.status !== 'settling') return { ok: false, message: 'নিষ্পত্তির অপেক্ষায় নেই' };
    if (!approver) return { ok: false, message: 'অনুমোদনকারী বাছাই করুন' };
    if (approver === (g.settleBy ?? '')) return { ok: false, message: 'প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না (BR-04)' };
    setState((s) => ({
      ...s,
      goals: s.goals.map((x) => (x.id === goalId ? { ...x, status: 'closed' as const, settleAppr: approver, settledOn: TODAY_ISO } : x)),
      events: [{ id: nextId('je'), at: todayBn(), what: 'নিষ্পত্তি অনুমোদিত · রসিদ তৈরি', ref: g.code, tone: 'ok' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `${g.code} নিষ্পত্তি সম্পন্ন — সদস্যভিত্তিক ফেরতের রসিদ তৈরি (ডেমো)` };
  }, [state.goals]);

  const advancePart: JgCtx['advancePart'] = useCallback((goalId, memberId) => {
    const g = jgGoalById(state.goals, goalId);
    const p = state.parts.find((x) => x.goal === goalId && x.memberId === memberId);
    if (!g || !p) return { ok: false, message: 'অংশগ্রহণকারী পাওয়া যায়নি' };
    if (p.status !== 'behind') return { ok: false, message: 'শুধু পেছনে থাকা অংশগ্রহণকারীর প্রতিকার ধাপ বাড়ানো যায়' };
    const order: ('notice' | 'committee' | 'remove')[] = ['notice', 'committee', 'remove'];
    const idx = order.indexOf(p.step ?? 'notice');
    const next = order[Math.min(2, idx + 1)];
    if (next === p.step) return { ok: false, message: 'শেষ ধাপে আছে — কমিটির সিদ্ধান্ত লাগবে (D-49)' };
    setState((s) => ({
      ...s,
      parts: s.parts.map((x) => (x.goal === goalId && x.memberId === memberId ? { ...x, step: next, noticeSent: TODAY_ISO } : x)),
      events: [{ id: nextId('je'), at: todayBn(), what: `প্রতিকার ধাপ · ${next}`, ref: `${g.code} · ${memberId}`, tone: 'warn' }, ...s.events].slice(0, 40),
    }));
    return { ok: true, message: `প্রতিকার ধাপ বাড়ানো হয়েছে (${next}) — কোনো বিলম্ব ফি নেই (D-49)` };
  }, [state.goals, state.parts]);

  const reset = useCallback(() => setState(INITIAL), []);
  const value = useMemo<JgCtx>(() => ({ state, approveJoin, rejectJoin, recordContrib, requestDisb, approveDisb, rejectDisb, createGoal, extendGoal, settleApprove, advancePart, reset }),
    [state, approveJoin, rejectJoin, recordContrib, requestDisb, approveDisb, rejectDisb, createGoal, extendGoal, settleApprove, advancePart, reset]);

  return <JgAdminCtx.Provider value={value}>{children}</JgAdminCtx.Provider>;
}

export function useAdminJg() {
  const ctx = useContext(JgAdminCtx);
  if (!ctx) throw new Error('useAdminJg — AdminJointProvider-এর বাইরে');
  return ctx;
}

export const jgActiveCount = jgActive;
