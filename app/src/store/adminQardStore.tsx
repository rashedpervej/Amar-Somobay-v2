/* ============================================================
   src/store/adminQardStore.tsx — QAM-01…QAM-17 স্টেট
   ডেমো: ইন-মেমরি; কোনো DB/নেটওয়ার্ক নেই।
   নিয়ম: সুদ ৳০ · বিলম্ব ফি ৳০ · maker ≠ checker · OTP গেট ·
   স্ন্যাপশট অপরিবর্তনীয় · রসিদ/ভাউচার অপরিবর্তনীয় (BR-08)।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  QH_MAX_ACTIVE_LOANS, QH_TODAY, SEED_QH_APPS, SEED_QH_ELIGIBLE, SEED_QH_LOANS, SEED_QH_PRODUCTS,
  SEED_QH_REPAYMENTS, SEED_QH_RULES, SEED_QH_VERSIONS, SEED_QH_WINDOW, SEED_QH_WRITEOFFS,
  qhArrearsOf, qhCertNo, qhInsts, qhMaxAmount, qhOutstanding, qhPerInst, qhPoolState, qhReceiptNo,
  qhSimulate, type QhApp, type QhEligible, type QhLoan, type QhProduct, type QhRepayment, type QhRuleVersion,
  type QhSimResult, type QhWindow, type QhWriteOff,
} from '../domain/adminQard';

export type QhEvent = { id: string; at: string; what: string; ref: string; tone: string };
type Res = { ok: boolean; message: string };

export type QhState = {
  products: QhProduct[]; rules: typeof SEED_QH_RULES; versions: QhRuleVersion[]; window: QhWindow;
  eligible: QhEligible[]; apps: QhApp[]; loans: QhLoan[]; repayments: QhRepayment[];
  writeoffs: QhWriteOff[]; sim: QhSimResult | null; events: QhEvent[];
};

type ProductInput = { id?: string; name: string; min: number; max: number; tenure: number; grace: number; purposes: string[]; repay?: QhProduct['repay'] };
type DecisionInput = {
  verdict: 'approve' | 'approve_reduced' | 'return' | 'reject' | 'refer';
  amount: number; committee: string; note: string; approver: string; reviewBy: string;
};
type DisbInput = { otp: string; approver: string; note: string; evidence?: string[] };

export type QhCtx = {
  state: QhState;
  saveProduct: (input: ProductInput) => Res;
  saveRuleVersion: (values: { minSavings: number; maxPct: number; minMonths: number }, approver: string) => Res;
  runSim: (values: { minSavings: number; maxPct: number; minMonths: number }) => Res;
  grantException: (memberId: string, committee: string, note: string) => Res;
  saveWindow: (input: { start: string; end: string; nextStart: string; nextEnd: string; quota: number }) => Res;
  decideApp: (appId: string, input: DecisionInput) => Res;
  disburse: (loanId: string, input: DisbInput) => Res;
  recordRepay: (loanId: string, instNo: number, amount: number, channel: QhRepayment['channel'], by: string) => Res;
  restructure: (loanId: string, addMonths: number, committee: string) => Res;
  proposeWriteOff: (loanId: string, amount: number, reason: string, committee: string) => Res;
  approveWriteOff: (id: string, approver: string) => Res;
  closeLoan: (loanId: string) => Res;
  reset: () => void;
};

const INITIAL: QhState = {
  products: SEED_QH_PRODUCTS,
  rules: SEED_QH_RULES,
  versions: SEED_QH_VERSIONS,
  window: SEED_QH_WINDOW,
  eligible: SEED_QH_ELIGIBLE,
  apps: SEED_QH_APPS,
  loans: SEED_QH_LOANS,
  repayments: SEED_QH_REPAYMENTS,
  writeoffs: SEED_QH_WRITEOFFS,
  sim: null,
  events: [
    { id: 'ev1', at: '২০২৬-১০-২৯', what: 'যোগ্যতা পুনর্মূল্যায়ন (v3) — ৯ জন', ref: 'QH-RULE-v3', tone: 'info' },
    { id: 'ev2', at: '২০২৬-১০-১৮', what: 'সিদ্ধান্ত: তথ্য চেয়ে ফেরত', ref: 'QHA-2610-0013', tone: 'warn' },
    { id: 'ev3', at: '২০২৬-১০-১১', what: 'অনুমোদন · কমিটি CM-2610-04', ref: 'QHA-2610-0010', tone: 'ok' },
  ],
};

const QhCtx = createContext<QhCtx | null>(null);
const SEQ = { n: 0 };
const nextId = (p: string) => { SEQ.n += 1; return `${p}${SEQ.n}`; };
const nowBn = () => '২০২৬-১০-৩১';
const CM_RE = /^CM-\d{4}-\d{2}$/;

export function AdminQardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(INITIAL);

  const log = (s: QhState, what: string, ref: string, tone: string): QhEvent[] =>
    [{ id: nextId('ev'), at: nowBn(), what, ref, tone }, ...s.events].slice(0, 60);

  const saveProduct: QhCtx['saveProduct'] = useCallback((input) => {
    if (!input.name.trim() || input.name.trim().length < 3) return { ok: false, message: 'পণ্যের নাম কমপক্ষে ৩ অক্ষর হতে হবে' };
    if (!(input.min > 0) || !(input.max > 0)) return { ok: false, message: 'সর্বনিম্ন ও সর্বোচ্চ অঙ্ক শূন্যের বেশি হতে হবে' };
    if (input.min >= input.max) return { ok: false, message: 'সর্বনিম্ন অঙ্ক সর্বোচ্চের চেয়ে কম হতে হবে' };
    if (!(input.tenure >= 1 && input.tenure <= 36)) return { ok: false, message: 'মেয়াদ ১–৩৬ মাসের মধ্যে হতে হবে' };
    if (!(input.grace >= 0 && input.grace <= 60)) return { ok: false, message: 'গ্রেস ০–৬০ দিনের মধ্যে হতে হবে' };
    if (!input.purposes.length) return { ok: false, message: 'কমপক্ষে একটি উদ্দেশ্য-ক্যাটাগরি বাছতে হবে' };
    setState((s) => {
      const cur = s.products.find((p) => p.id === (input.id ?? 'qhp1'));
      if (!cur) return s;
      const next: QhProduct = {
        ...cur, name: input.name.trim(), min: input.min, max: input.max, tenure: input.tenure,
        grace: input.grace, purposes: input.purposes as QhProduct['purposes'], repay: input.repay ?? cur.repay, version: cur.version + 1,
      };
      return {
        ...s, products: s.products.map((p) => (p.id === next.id ? next : p)),
        events: log(s, `পণ্য ${next.code} — নতুন সংস্করণ v${next.version} (আবেদনের স্ন্যাপশট অপরিবর্তিত)`, next.code, 'ok'),
      };
    });
    return { ok: true, message: 'নতুন সংস্করণ সংরক্ষিত ও প্রকাশিত — পুরোনো আবেদনের স্ন্যাপশট বদলাবে না (BR-21)' };
  }, []);

  const runSim: QhCtx['runSim'] = useCallback((values) => {
    if (!(values.minSavings >= 0) || !(values.maxPct > 0 && values.maxPct <= 100)) {
      return { ok: false, message: 'সঞ্চয়ের শতাংশ ১–১০০-এর মধ্যে হতে হবে' };
    }
    if (!(values.minMonths >= 0 && values.minMonths <= 60)) return { ok: false, message: 'সদস্যত্বকাল ০–৬০ মাসের মধ্যে হতে হবে' };
    const sim = qhSimulate(values, state.eligible.filter((e) => e.result === 'eligible').length);
    setState((s) => ({ ...s, sim, events: log(s, `Simulation চালানো — ${sim.eligible} জন যোগ্য (নমুনা ${sim.members})`, 'QH-SIM', 'info') }));
    return { ok: true, message: `Simulation সম্পন্ন — ${sim.eligible} জন যোগ্য, ${sim.blocked} জন অযোগ্য; কোনো ব্যক্তিগত তালিকা দেখানো হয়নি (D-57)` };
  }, [state.eligible]);

  const saveRuleVersion: QhCtx['saveRuleVersion'] = useCallback((values, approver) => {
    if (!state.sim) return { ok: false, message: 'Simulation ছাড়া নতুন সংস্করণ প্রকাশ আটকবে (D-57) — আগে Simulation চালান' };
    if (!approver.trim()) return { ok: false, message: 'প্রকাশকারীর নাম আবশ্যক' };
    setState((s) => {
      const no = Math.max(...s.versions.map((v) => v.no)) + 1;
      const v: QhRuleVersion = {
        id: `v${no}`, no, validFrom: QH_TODAY, by: approver, committee: 'CM-2610-08',
        changes: `সঞ্চয়ের সীমা ${values.maxPct}% · ন্যূনতম সঞ্চয় ৳${values.minSavings.toLocaleString('en-US')} · সদস্যত্বকাল ${values.minMonths} মাস`,
        sim: { eligible: s.sim?.eligible ?? 0, newlyBlocked: s.sim?.newlyBlocked ?? 0, newlyEligible: s.sim?.newlyEligible ?? 0, sample: s.sim?.members ?? 9 },
        note: 'Simulation ফলাফলসহ প্রকাশিত — পুরোনো আবেদনের স্ন্যাপশট অপরিবর্তিত (D-57 · BR-21)',
      };
      return {
        ...s, versions: [v, ...s.versions],
        rules: s.rules.map((r) => (r.key === 'max_pct_of_savings' ? { ...r, value: values.maxPct } : r.key === 'min_total_savings' ? { ...r, value: values.minSavings } : r.key === 'min_membership_months' ? { ...r, value: values.minMonths } : r)),
        events: log(s, `নিয়ম সংস্করণ v${no} প্রকাশ — কমিটি CM-2610-08`, `QH-RULE-v${no}`, 'ok'),
      };
    });
    return { ok: true, message: 'নতুন নিয়ম সংস্করণ প্রকাশিত — পুরোনো আবেদনের স্ন্যাপশট বদলাবে না (BR-21)' };
  }, [state.sim]);

  const grantException: QhCtx['grantException'] = useCallback((memberId, committee, note) => {
    if (!CM_RE.test(committee)) return { ok: false, message: 'কমিটি রেফারেন্স CM-YYMM-## ফরম্যাটে দিন' };
    if (note.trim().length < 8) return { ok: false, message: 'ম্যানুয়াল এক্সেপশনের কারণ কমপক্ষে ৮ অক্ষর লিখতে হবে' };
    setState((s) => ({
      ...s,
      eligible: s.eligible.map((e) => e.memberId === memberId
        ? { ...e, result: 'conditional', source: 'manual_exception', reasons: [...new Set([...e.reasons, 'QH-W-05'])], maxAmount: Math.max(e.maxAmount, 1000), validUntil: '2026-11-30', note: `ম্যানুয়াল এক্সেপশন — ${note} · কমিটি ${committee} (D-59)` }
        : e),
      events: log(s, `ম্যানুয়াল এক্সেপশন — ${committee}`, memberId, 'warn'),
    }));
    return { ok: true, message: 'এক্সেপশন রেকর্ড হয়েছে — ম্যানুয়াল অনুমোদন বাধ্যতামূলক (D-59)' };
  }, []);

  const saveWindow: QhCtx['saveWindow'] = useCallback((input) => {
    if (!input.start || !input.end || !input.nextStart || !input.nextEnd) return { ok: false, message: 'সব তারিখ দিতে হবে' };
    if (Date.parse(input.end) <= Date.parse(input.start)) return { ok: false, message: 'জানালার শেষ তারিখ শুরুর পরে হতে হবে' };
    if (Date.parse(input.nextStart) <= Date.parse(input.end)) return { ok: false, message: 'পরবর্তী জানালা চলমান জানালার পরে হতে হবে' };
    if (!(input.quota >= 1 && input.quota <= 100)) return { ok: false, message: 'মাসিক কোটা ১–১০০-এর মধ্যে হতে হবে' };
    setState((s) => ({
      ...s,
      window: { ...s.window, start: input.start, end: input.end, nextStart: input.nextStart, nextEnd: input.nextEnd, quota: input.quota },
      events: log(s, `জানালা প্রকাশ — ${input.nextStart} → ${input.nextEnd} · কোটা ${input.quota}`, 'QH-WINDOW', 'ok'),
    }));
    return { ok: true, message: 'জানালা ও কোটা সংরক্ষিত — কারণ QH-B-02 সদস্য অ্যাপে দেখানো হবে' };
  }, []);

  const decideApp: QhCtx['decideApp'] = useCallback((appId, input) => {
    const app = state.apps.find((a) => a.id === appId);
    if (!app) return { ok: false, message: 'আবেদন পাওয়া যায়নি' };
    if (app.status !== 'review' && app.status !== 'screening' && app.status !== 'returned') return { ok: false, message: 'এই আবেদনের সিদ্ধান্ত ইতিমধ্যে হয়ে গেছে' };
    if (input.approver.trim() === input.reviewBy.trim()) return { ok: false, message: 'maker ≠ checker লঙ্ঘন: প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না (BR-22)' };
    if (app.snapshot.result === 'blocked' && input.verdict !== 'return' && input.verdict !== 'reject' && input.verdict !== 'refer') {
      return { ok: false, message: 'স্ন্যাপশটে আটকেছে — অনুমোদন করা যাবে না; তথ্য চেয়ে ফেরত বা প্রত্যাখ্যান করুন (BR-21)' };
    }
    if (input.verdict === 'approve' || input.verdict === 'approve_reduced') {
      if (!CM_RE.test(input.committee)) return { ok: false, message: 'কমিটি রেফারেন্স CM-YYMM-## বাধ্যতামূলক (D-45)' };
      if (!(input.amount > 0)) return { ok: false, message: 'অনুমোদনের অঙ্ক শূন্যের বেশি হতে হবে' };
      if (input.amount > app.amount) return { ok: false, message: 'আবেদিত অঙ্কের বেশি অনুমোদন করা যাবে না' };
      if (input.amount > app.snapshot.maxAmount) return { ok: false, message: `যোগ্যতার সীমা ৳${app.snapshot.maxAmount} — কমিয়ে অনুমোদন করুন` };
      const active = state.loans.filter((l) => l.memberId === app.memberId && (l.status === 'active' || l.status === 'arrears')).length;
      if (active >= QH_MAX_ACTIVE_LOANS) return { ok: false, message: 'সদস্যের সক্রিয় ঋণ সীমা পূর্ণ (D-51) — নতুন বিতরণ আটকাবে' };
      if (input.verdict === 'approve' && input.amount !== app.amount) return { ok: false, message: 'আবেদিত অঙ্কে অনুমোদন নয় — “কমিয়ে অনুমোদন” বাছুন' };
    }
    if ((input.verdict === 'reject' || input.verdict === 'return') && input.note.trim().length < 5) {
      return { ok: false, message: 'প্রত্যাখ্যান/ফেরতের কারণ লিখতে হবে — সদস্যকে সম্মান রক্ষা করে জানানো হবে' };
    }
    setState((s) => {
      const verdict: NonNullable<QhApp['decision']>['verdict'] = input.verdict === 'approve_reduced' ? 'approve' : input.verdict === 'return' ? 'return' : input.verdict === 'reject' ? 'reject' : input.verdict === 'refer' ? 'refer' : 'approve';
      const amount = input.verdict === 'approve' || input.verdict === 'approve_reduced' ? input.amount : undefined;
      const decision: NonNullable<QhApp['decision']> = { verdict, amount, at: QH_TODAY, by: input.reviewBy, appr: input.approver, committee: input.committee, note: input.note };
      const status: QhApp['status'] = verdict === 'approve' ? 'approved' : verdict === 'reject' ? 'rejected' : 'returned';
      const apps = s.apps.map((a) => (a.id === appId ? { ...a, status, decision } : a));
      const newLoans: QhLoan[] = verdict === 'approve' && amount
        ? [{ id: nextId('qh'), no: `QH-2610-${String(9000 + SEQ.n).slice(-4)}`, app: appId, memberId: app.memberId, product: app.product, principal: amount, tenure: app.tenure, repay: 'equal', disbursedAt: null, firstDue: null, status: 'pending', channel: 'bank', committee: input.committee, by: input.reviewBy, appr: input.approver, otp: false, evidence: [], hash: '', note: 'অনুমোদিত — বিতরণ বাকি: maker ≠ checker ✓, OTP যাচাই বাকি (BR-22)' }, ...s.loans]
        : s.loans;
      return {
        ...s, apps, loans: newLoans,
        events: log(s, `সিদ্ধান্ত: ${verdict}${amount ? ` ৳${amount}` : ''} · ${input.committee || 'রেফার'}`, app.no, verdict === 'reject' ? 'danger' : 'ok'),
      };
    });
    return { ok: true, message: input.verdict === 'approve' || input.verdict === 'approve_reduced' ? 'অনুমোদিত — পুলে অঙ্ক হল্ড হয়েছে; বিতরণে OTP বাধ্যতামূলক (BR-22)' : 'সিদ্ধান্ত অডিট লগে অপরিবর্তনীয়ভাবে লেখা হয়েছে' };
  }, [state.apps, state.loans]);

  const disburse: QhCtx['disburse'] = useCallback((loanId, input) => {
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: 'ঋণ পাওয়া যায়নি' };
    if (loan.status !== 'pending') return { ok: false, message: 'এই বিতরণ ইতিমধ্যে সম্পন্ন' };
    if (loan.appr.trim() === loan.by.trim()) return { ok: false, message: 'maker ≠ checker লঙ্ঘন — প্রস্তুতকারী নিজে ছাড় করতে পারবেন না (BR-22)' };
    if (input.otp !== '123456') return { ok: false, message: 'OTP মেলেনি — টাকা ছাড়া হবে না (ডেমো OTP: 123456)' };
    const pool = qhPoolState(state.window, state.loans, state.apps);
    if (pool.available < loan.principal) return { ok: false, message: `পুলে যথেষ্ট মুক্ত অঙ্ক নেই (D-40) — মুক্ত ৳${pool.available}` };
    const evidence = [...loan.evidence, ...(input.evidence ?? [])];
    if (!evidence.length) return { ok: false, message: 'প্রমাণ সংযুক্তি বাধ্যতামূলক — রসিদ/স্বাক্ষর যুক্ত করুন (D-50)' };
    setState((s) => {
      const dash = String(s.loans.length + 1).padStart(4, '0');
      return {
        ...s,
        loans: s.loans.map((l) => (l.id === loanId ? { ...l, status: 'active', otp: true, disbursedAt: QH_TODAY, firstDue: '2026-11-30', hash: `qh${dash}a91c`, evidence: [...l.evidence, ...(input.evidence ?? []), `ভাউচার QHV-${l.no.slice(-7)}`], note: 'সুদ ৳০ · বিতরণ সম্পন্ন · হ্যাশ অপরিবর্তনীয় (BR-08)' } : l)),
        apps: s.apps.map((a) => (a.loan === loanId ? { ...a, status: 'disbursed' as const } : a)),
        events: log(s, `বিতরণ সম্পন্ন — OTP যাচাই ✓ · ভাউচার QHV-${loan.no.slice(-7)}`, loan.no, 'ok'),
      };
    });
    return { ok: true, message: `বিতরণ সম্পন্ন — ভাউচার QHV-${loan.no.slice(-7)} · হ্যাশ যুক্ত হয়েছে; কোনো সুদ নেই (BR-20)` };
  }, [state.loans, state.apps, state.window]);

  const recordRepay: QhCtx['recordRepay'] = useCallback((loanId, instNo, amount, channel, by) => {
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: 'ঋণ পাওয়া যায়নি' };
    if (loan.status !== 'active' && loan.status !== 'arrears') return { ok: false, message: 'এই ঋণে পরিশোধ গ্রহণ করা যাবে না' };
    const inst = qhInsts(loan, state.repayments).find((i) => i.no === instNo);
    if (!inst) return { ok: false, message: 'কিস্তি পাওয়া যায়নি' };
    if (inst.status === 'paid') return { ok: false, message: 'এই কিস্তি ইতিমধ্যে পরিশোধিত — রসিদ অপরিবর্তনীয় (BR-08)' };
    if (!(amount > 0)) return { ok: false, message: 'অঙ্ক শূন্যের বেশি হতে হবে' };
    if (amount > qhOutstanding(loan, state.repayments, state.writeoffs)) return { ok: false, message: 'বাকি মূলধনের বেশি গ্রহণ করা যাবে না' };
    if (!by.trim()) return { ok: false, message: 'গ্রহণকারীর নাম প্রয়োজন' };
    setState((s) => {
      const seq = s.repayments.length + 1;
      const reps: QhRepayment[] = [{ loan: loanId, inst: instNo, amount, at: QH_TODAY, receipt: qhReceiptNo(seq), channel, by }, ...s.repayments];
      const paidCount = reps.filter((r) => r.loan === loanId).length;
      const paidTotal = reps.filter((r) => r.loan === loanId).reduce((a, r) => a + r.amount, 0);
      const fully = paidTotal >= loan.principal;
      const remainingDue = qhInsts(loan, reps).some((i) => i.status === 'overdue');
      const loans = s.loans.map((l) => (l.id === loanId
        ? { ...l, status: fully ? 'closed' as const : remainingDue ? 'arrears' as const : 'active' as const, closedAt: fully ? QH_TODAY : l.closedAt, cert: fully ? qhCertNo(seq) : l.cert, note: fully ? 'সুদ ৳০ · সম্পূর্ণ পরিশোধিত · সমাপ্তি সনদ ইস্যু' : `সুদ ৳০ · ${paidCount}/${l.tenure} কিস্তি পরিশোধিত` }
        : l));
      return { ...s, repayments: reps, loans, events: log(s, `পরিশোধ ৳${amount} · রসিদ ${qhReceiptNo(seq)}${fully ? ' · সনদ ইস্যু' : ''}`, loan.no, 'ok') };
    });
    return { ok: true, message: `পরিশোধ গৃহীত — রসিদ QR-… · লেজার: ডেবিট নগদ / ক্রেডিট আদায়যোগ্য; কোনো সুদ যোগ হয়নি (BR-20)` };
  }, [state.loans, state.repayments, state.writeoffs]);

  const restructure: QhCtx['restructure'] = useCallback((loanId, addMonths, committee) => {
    if (!CM_RE.test(committee)) return { ok: false, message: 'পুনর্গঠনে কমিটি রেফারেন্স বাধ্যতামূলক (CM-YYMM-##)' };
    if (!(addMonths >= 1 && addMonths <= 12)) return { ok: false, message: 'পুনর্গঠনে ১–১২ মাস যোগ করা যায়' };
    setState((s) => ({
      ...s,
      loans: s.loans.map((l) => (l.id === loanId ? { ...l, tenure: l.tenure + addMonths, by: l.by, note: `পুনর্গঠন — মেয়াদ ${l.tenure + addMonths} মাস · মোট ফেরত = মূলধন · কোনো অতিরিক্ত চার্জ নেই (D-53)` } : l)),
      events: log(s, `পুনর্গঠন +${addMonths} মাস · ${committee} · সুদ ৳০`, loanId, 'warn'),
    }));
    return { ok: true, message: 'পুনর্গঠন সংরক্ষিত — মোট ফেরতযোগ্য = মূলধন, কোনো চার্জ যোগ হয়নি (D-53)' };
  }, []);

  const proposeWriteOff: QhCtx['proposeWriteOff'] = useCallback((loanId, amount, reason, committee) => {
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: 'ঋণ পাওয়া যায়নি' };
    const out = qhOutstanding(loan, state.repayments, state.writeoffs);
    if (!(amount > 0) || amount > out) return { ok: false, message: `অঙ্ক বাকি মূলধনের (৳${out}) মধ্যে হতে হবে` };
    if (!CM_RE.test(committee)) return { ok: false, message: 'কমিটি রেফারেন্স CM-YYMM-## বাধ্যতামূলক (BR-23)' };
    if (reason.trim().length < 10) return { ok: false, message: 'write-off কারণ কমপক্ষে ১০ অক্ষরে লিখতে হবে' };
    setState((s) => {
      const no = `QW-2610-${String(3 + s.writeoffs.length).padStart(4, '0')}`;
      return {
        ...s,
        writeoffs: [{ id: nextId('wo'), no, loan: loanId, amount, reason, committee, decidedAt: null, by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', approvedBy: null, status: 'proposed', note: 'প্রস্তাব বিচারাধীন — ORG_ADMIN অনুমোদন + নিরীক্ষক অ্যালার্ট বাধ্যতামূলক (BR-23)' }, ...s.writeoffs],
        events: log(s, `write-off প্রস্তাব ৳${amount}`, loan.no, 'warn'),
      };
    });
    return { ok: true, message: 'write-off প্রস্তাব সংরক্ষিত — ORG_ADMIN অনুমোদন ও নিরীক্ষক অ্যালার্ট বাধ্যতামূলক (BR-23)' };
  }, [state.loans, state.repayments, state.writeoffs]);

  const approveWriteOff: QhCtx['approveWriteOff'] = useCallback((id, approver) => {
    const wo = state.writeoffs.find((w) => w.id === id);
    if (!wo) return { ok: false, message: 'প্রস্তাব পাওয়া যায়নি' };
    if (wo.status !== 'proposed') return { ok: false, message: 'এই প্রস্তাব ইতিমধ্যে নিষ্পত্তি হয়েছে' };
    if (!approver.trim()) return { ok: false, message: 'অনুমোদনকারীর নাম প্রয়োজন' };
    if (approver.trim() === wo.by.trim()) return { ok: false, message: 'maker ≠ checker — প্রস্তাবকারী নিজে অনুমোদন করতে পারবেন না (BR-22)' };
    setState((s) => ({
      ...s,
      writeoffs: s.writeoffs.map((w) => (w.id === id ? { ...w, status: 'done' as const, decidedAt: QH_TODAY, approvedBy: approver, note: 'ক্ষতি — ডেবিট; দায় মেটেনি, নিরীক্ষা রিপোর্টে আলাদা (BR-23)' } : w)),
      loans: s.loans.map((l) => (l.id === wo.loan ? { ...l, status: 'writeoff' as const, closedAt: QH_TODAY, note: 'write-off সম্পন্ন — নিরীক্ষক অ্যালার্ট পাঠানো হয়েছে (BR-23)' } : l)),
      events: log(s, `write-off অনুমোদিত ৳${wo.amount} · নিরীক্ষক অ্যালার্ট`, wo.no, 'danger'),
    }));
    return { ok: true, message: 'write-off অনুমোদিত — নিরীক্ষক অ্যালার্ট পাঠানো হয়েছে; দায় মেটেনি (BR-23)' };
  }, [state.writeoffs]);

  const closeLoan: QhCtx['closeLoan'] = useCallback((loanId) => {
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: 'ঋণ পাওয়া যায়নি' };
    const out = qhOutstanding(loan, state.repayments, state.writeoffs);
    if (out > 0) return { ok: false, message: `বাকি ৳${out} — সম্পূর্ণ পরিশোধ ছাড়া সনদ ইস্যু হবে না` };
    setState((s) => {
      const seq = s.loans.filter((l) => l.cert).length + 3;
      return {
        ...s,
        loans: s.loans.map((l) => (l.id === loanId ? { ...l, status: 'closed' as const, closedAt: l.closedAt ?? QH_TODAY, cert: l.cert ?? qhCertNo(seq) } : l)),
        events: log(s, `সমাপ্তি সনদ ${loan.cert ?? qhCertNo(seq)} ইস্যু`, loan.no, 'ok'),
      };
    });
    return { ok: true, message: 'সমাপ্তি সনদ ইস্যু — সুদ ৳০, শুধু মূলধন সম্পূর্ণ ফেরত (BR-20)' };
  }, [state.loans, state.repayments, state.writeoffs]);

  const reset = useCallback(() => setState(INITIAL), []);

  const value = useMemo<QhCtx>(() => ({
    state, saveProduct, saveRuleVersion, runSim, grantException, saveWindow, decideApp, disburse,
    recordRepay, restructure, proposeWriteOff, approveWriteOff, closeLoan, reset,
  }), [state, saveProduct, saveRuleVersion, runSim, grantException, saveWindow, decideApp, disburse, recordRepay, restructure, proposeWriteOff, approveWriteOff, closeLoan, reset]);

  return <QhCtx.Provider value={value}>{children}</QhCtx.Provider>;
}

export function useAdminQh() {
  const ctx = useContext(QhCtx);
  if (!ctx) throw new Error('useAdminQh must be used within AdminQardProvider');
  return ctx;
}

export const qhLoanOut = (l: QhLoan, reps: QhRepayment[], wos: QhWriteOff[]) => qhOutstanding(l, reps, wos);
export const qhLoanArrears = (l: QhLoan, reps: QhRepayment[]) => qhArrearsOf(l, reps);
export const qhLoanPer = (l: QhLoan) => qhPerInst(l);
export const qhLoanMax = qhMaxAmount;
