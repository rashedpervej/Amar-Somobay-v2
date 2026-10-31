/* ============================================================
   src/store/adminStore.tsx — অ্যাডমিন মোবাইল অ্যাপের একক সত্য উৎস
   AM-01…AM-20 পর্দা এই স্টোরের state পড়ে এবং action ডাকে।
   ডেমো: সব কিছু ইন-মেমরি; কোনো ডেটাবেস বা নেটওয়ার্ক ছোঁয়া হয় না।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { FIN, ROLE_BY_NAME, financeTotals,
  IMPORT_MAP, SEED_AUDIT, SEED_BATCHES, SEED_DELIVERY, SEED_IMPORTS, SEED_MOVES, SEED_OPTOUT,
  SEED_RECON, SEED_RECON_EX, SEED_REPORT_RUNS, SEED_REPORTS, SEED_RETURNS, SEED_ROUTES, SEED_SCHEMES,
  SEED_SDIFF, SEED_SETTINGS, SEED_SETUP, SEED_SMS, SEED_STAFF, SEED_TEMPLATES, SEED_TOGGLES,
  SEED_UNASSIGNED, type AuditEntry, type Batch, type ImportFile, type MemberMove, type Recon,
  type ReconEx, type ReportRun, type RouteRow, type Scheme, type SchemeDiff, type SettingsGroup,
  type SetupCheck, type Staff, type Template, type UnassignedMember,
} from '../domain/adminOps';
import {
  SEED_ACCOUNTS, SEED_APPROVALS, SEED_CASH_DAYS, SEED_CLAIMS, SEED_CORRECTIONS, SEED_DUES,
  SEED_MEMBERS, SEED_ORG_ACCOUNTS, SEED_PAYOUTS, SEED_TRANSFERS, SEED_TXNS,
  type AmAccount, type AmApproval, type AmCashDay, type AmClaim, type AmCorrection, type AmDue,
  type AmMember, type AmOrgAccount, type AmPayout, type AmTransfer, type AmTxn, type Channel, type MemStatus,
} from '../domain/admin';

export type AdminState = {
  members: AmMember[];
  accounts: AmAccount[];
  dues: AmDue[];
  approvals: AmApproval[];
  txns: AmTxn[];
  corrections: AmCorrection[];
  payouts: AmPayout[];
  cashDays: AmCashDay[];
  claims: AmClaim[];
  transfers: AmTransfer[];
  orgAccounts: AmOrgAccount[];
  /* ব্যাচ ৫ */
  schemes: Scheme[];
  sdiff: SchemeDiff[];
  batches: Batch[];
  imports: ImportFile[];
  recon: Recon;
  reconEx: ReconEx[];
  routes: RouteRow[];
  unassigned: UnassignedMember[];
  templates: Template[];
  optOut: { name: string; why: string }[];
  sms: typeof SEED_SMS;
  delivery: typeof SEED_DELIVERY;
  staff: Staff[];
  settings: SettingsGroup[];
  setup: SetupCheck[];
  toggles: typeof SEED_TOGGLES;
  audit: AuditEntry[];
  reportRuns: ReportRun[];
  reports: typeof SEED_REPORTS;
  returns: typeof SEED_RETURNS;
  moves: MemberMove[];
  importsMap: typeof IMPORT_MAP;
  financeSignedOff: boolean;
};

type DepositInput = { accountId: string; amount: number; channel: Channel; reference: string };
type RegisterInput = {
  name: string; father: string; mobile: string; nid: string; village: string; union: string;
  occupation: string; scheme: string; firstDeposit: number;
};
type CloseInput = { accountId: string; waiverNo: string; method: Channel };

const INITIAL: AdminState = {
  members: SEED_MEMBERS,
  accounts: SEED_ACCOUNTS,
  dues: SEED_DUES,
  approvals: SEED_APPROVALS,
  txns: SEED_TXNS,
  corrections: SEED_CORRECTIONS,
  payouts: SEED_PAYOUTS,
  cashDays: SEED_CASH_DAYS,
  claims: SEED_CLAIMS,
  transfers: SEED_TRANSFERS,
  orgAccounts: SEED_ORG_ACCOUNTS,
  schemes: SEED_SCHEMES,
  sdiff: SEED_SDIFF,
  batches: SEED_BATCHES,
  imports: SEED_IMPORTS,
  recon: SEED_RECON,
  reconEx: SEED_RECON_EX,
  routes: SEED_ROUTES,
  unassigned: SEED_UNASSIGNED,
  templates: SEED_TEMPLATES,
  optOut: SEED_OPTOUT,
  sms: SEED_SMS,
  delivery: SEED_DELIVERY,
  staff: SEED_STAFF,
  settings: SEED_SETTINGS,
  setup: SEED_SETUP,
  toggles: SEED_TOGGLES,
  audit: SEED_AUDIT,
  reportRuns: SEED_REPORT_RUNS,
  reports: SEED_REPORTS,
  returns: SEED_RETURNS,
  moves: SEED_MOVES,
  importsMap: IMPORT_MAP,
  financeSignedOff: false,
};

type Res = { ok: boolean; message: string };
type Ctx = {
  state: AdminState;
  resolveException: (id: string, mode: 'resolve' | 'suspense', note: string) => Res;
  signOffRecon: () => Res;
  postBatch: (id: string) => Res;
  commitImport: (id: string) => Res;
  signOffFinance: () => Res;
  createScheme: (input: { code: string; name: string; typeBn: string; installment: number; tenure: number | null; minBalance: number }, decisionNo: string) => Res;
  proposeVersion: (id: string, decisionNo: string) => Res;
  requestMove: (memberId: string, to: string, reason: string, effAt: string) => Res;
  approveMove: (id: string, branchApprover: string) => Res;
  createRoute: (input: { name: string; area: string; collector: string; day: string; target: number }) => Res;
  assignAll: (routeId: string) => Res;
  toggleTemplate: (id: string) => Res;
  toggleSetting: (key: string) => Res;
  addStaff: (input: { name: string; role: string; mobile: string; scope: string }) => Res;
  suspendStaff: (id: string) => Res;
  runReport: (code: string, fmt: string) => Res;
  decide: (id: string, action: 'approve' | 'reject' | 'partial' | 'escalate', opts?: { amount?: number; reason?: string }) => { ok: boolean; message: string };
  addDeposit: (input: DepositInput) => { ok: boolean; message: string; receipt: string };
  registerMember: (input: RegisterInput) => { ok: boolean; message: string; appNo: string };
  reviewApplication: (id: string, action: 'approve' | 'reject' | 'info', comment: string) => { ok: boolean; message: string };
  saveMemberChange: (memberId: string, patch: Partial<AmMember>, reason: string, proof: string) => { ok: boolean; message: string };
  closeAccount: (input: CloseInput) => { ok: boolean; message: string; payable: number };
  reverseTxn: (txnId: string, reason: string) => { ok: boolean; message: string };
  closeCashDay: (counted: number, reason: string) => { ok: boolean; message: string; diff: number };
  payPayout: (id: string, method: Channel, voucher: string) => { ok: boolean; message: string };
  changeStatus: (memberId: string, to: MemStatus, reason: string, detail: string, committeeNo: string) => { ok: boolean; message: string };
  settleClaim: (id: string, approved: boolean) => { ok: boolean; message: string };
  transferFunds: (from: string, to: string, amount: number) => { ok: boolean; message: string };
  reset: () => void;
};

const AdminCtx = createContext<Ctx | null>(null);

let seq = 5000;
const nextNo = (prefix: string) => `${prefix}-${++seq}`;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(INITIAL);

  const decide: Ctx['decide'] = useCallback((id, action, opts) => {
    const item = state.approvals.find((a) => a.id === id);
    if (!item) return { ok: false, message: 'আবেদন পাওয়া যায়নি' };
    if ((action === 'approve' || action === 'partial') && !item.inLimit) {
      return { ok: false, message: 'অনুমোদন সীমা ছাড়িয়েছে — APPROVER-এ escalate করুন (D-22)' };
    }
    if (action === 'reject' && !(opts?.reason && opts.reason.trim().length >= 5)) {
      return { ok: false, message: 'প্রত্যাখ্যানের কারণ অন্তত ৫ অক্ষরে লিখুন' };
    }
    const amount = action === 'partial' ? opts?.amount ?? Math.floor(item.amount / 2) : item.amount;
    if (action === 'partial' && amount >= item.amount) {
      return { ok: false, message: 'আংশিক অনুমোদনে অঙ্ক কমাতে হবে (বাড়ানো যাবে না)' };
    }
    setState((s) => {
      const approvals = s.approvals.filter((a) => a.id !== id);
      if (item.kind !== 'withdrawal') return { ...s, approvals };
      const accounts = s.accounts.map((a) =>
        a.memberId === item.memberId && a.hold >= item.hold && item.hold > 0 ? { ...a, hold: Math.max(0, a.hold - item.hold) } : a,
      );
      const payouts = action === 'approve' || action === 'partial'
        ? [...s.payouts, { id: `p${seq}`, no: item.ref, memberId: item.memberId, member: item.member, amount, approvedBy: 'আপনি (MANAGER)', method: 'none' as const, status: 'approved' as const, voucher: '' }]
        : s.payouts;
      return { ...s, approvals, accounts, payouts };
    });
    const msg = action === 'approve' ? `অনুমোদিত — ৳${amount} নিষ্পত্তি কিউতে`
      : action === 'partial' ? `আংশিক অনুমোদিত — ৳${amount}`
        : action === 'reject' ? 'প্রত্যাখ্যাত — hold মুক্ত হয়েছে, সদস্যকে SMS যাবে (ডেমো)'
          : 'APPROVER-এ পাঠানো হয়েছে';
    return { ok: true, message: msg };
  }, [state.approvals]);

  const addDeposit: Ctx['addDeposit'] = useCallback((input) => {
    const acc = state.accounts.find((a) => a.id === input.accountId);
    if (!acc) return { ok: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি', receipt: '' };
    if (acc.status === 'closed') return { ok: false, message: 'বন্ধ অ্যাকাউন্টে জমা নেওয়া যাবে না', receipt: '' };
    if (!input.amount || input.amount < 1) return { ok: false, message: 'সঠিক অঙ্ক লিখুন', receipt: '' };
    const receipt = nextNo('RCP');
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.id === acc.id ? { ...a, posted: a.posted + input.amount, totalIn: a.totalIn + input.amount } : a)),
      txns: [{
        id: `t${seq}`, no: nextNo('TXN'), date: new Date().toISOString().slice(0, 10), memberId: acc.memberId, accId: acc.id,
        type: 'deposit', amount: input.amount, channel: input.channel, status: 'posted',
        balanceAfter: acc.posted + input.amount, postedBy: 'আপনি (স্টাফ)', device: 'Admin App (ডেমো)',
        ip: '—', gps: '—', reference: receipt,
        audit: [{ at: 'এখন', by: 'আপনি', what: 'দ্রুত জমা এন্ট্রি ও পোস্ট' }],
      }, ...s.txns],
      cashDays: s.cashDays.map((d, i) => i === 0 ? {
        ...d,
        declared: d.declared + input.amount,
        channels: { ...d.channels, cash: d.channels.cash + (input.channel === 'cash' ? input.amount : 0),
          bkash: d.channels.bkash + (input.channel === 'bkash' ? input.amount : 0),
          nagad: d.channels.nagad + (input.channel === 'nagad' ? input.amount : 0),
          bank: d.channels.bank + (input.channel === 'bank' ? input.amount : 0) },
      } : d),
    }));
    return { ok: true, message: 'জমা পোস্ট হয়েছে (ডেমো)', receipt };
  }, [state.accounts]);

  const registerMember: Ctx['registerMember'] = useCallback((input) => {
    const appNo = nextNo('APP');
    setState((s) => {
      const id = `m${seq}`;
      const member: AmMember = {
        id, no: 'RSS-NEW', name: input.name, father: input.father, mobile: input.mobile, nid: input.nid,
        village: input.village, union: 'শাপলা ইউনিয়ন', upazila: 'সদর', district: 'খুলনা',
        occupation: input.occupation, joined: new Date().toISOString().slice(0, 10),
        status: 'dormant', kyc: 'pending', route: 'R1', photo: input.name.slice(0, 1),
      };
      return {
        ...s,
        members: [...s.members, member],
        approvals: [{
          id: `ap${seq}`, kind: 'member', memberId: id, member: input.name, amount: input.firstDeposit,
          by: 'আপনি (স্টাফ)', submitted: 'এখন', hoursAgo: 0, ref: appNo, evidence: false, note: 'নতুন নিবন্ধন — যাচাই বাকি',
          reason: '', method: 'cash_office', nominee: '—', avail: 0, posted: 0, hold: 0, min: 0, locked: 0,
          inLimit: true, matched: 'partial',
        }, ...s.approvals],
      };
    });
    return { ok: true, message: 'নিবন্ধন জমা হয়েছে — অনুমোদনের অপেক্ষায় (AM-02)', appNo };
  }, []);

  const reviewApplication: Ctx['reviewApplication'] = useCallback((id, action, comment) => {
    if (action !== 'approve' && comment.trim().length < 5) {
      return { ok: false, message: 'কারণ/মন্তব্য অন্তত ৫ অক্ষরে লিখুন' };
    }
    setState((s) => ({
      ...s,
      approvals: s.approvals.filter((a) => a.id !== id),
      members: action === 'approve'
        ? s.members.map((m) => (m.id === s.approvals.find((a) => a.id === id)?.memberId ? { ...m, status: 'active', kyc: 'verified', no: m.no === 'RSS-NEW' ? `RSS-00${s.members.length + 1}` : m.no } : m))
        : s.members,
    }));
    return { ok: true, message: action === 'approve' ? 'আবেদন অনুমোদিত — সদস্য সক্রিয়' : action === 'reject' ? 'প্রত্যাখ্যাত — কারণ সংরক্ষিত (ডেমো)' : 'আরও তথ্যের অনুরোধ পাঠানো হয়েছে' };
  }, []);

  const saveMemberChange: Ctx['saveMemberChange'] = useCallback((memberId, patch, reason, proof) => {
    if (reason.trim().length < 5) return { ok: false, message: 'পরিবর্তনের কারণ অন্তত ৫ অক্ষরে লিখুন' };
    if (!proof.trim()) return { ok: false, message: 'প্রমাণ ছাড়া পরিবর্তন জমা হবে না' };
    setState((s) => ({ ...s, members: s.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)) }));
    return { ok: true, message: 'পরিবর্তন জমা হয়েছে — maker ≠ checker, অনুমোদন কিউতে গেছে (ডেমো)' };
  }, []);

  const closeAccount: Ctx['closeAccount'] = useCallback(({ accountId, waiverNo, method }) => {
    const acc = state.accounts.find((a) => a.id === accountId);
    if (!acc) return { ok: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি', payable: 0 };
    const memberDue = state.dues.filter((d) => d.accId === accountId).reduce((s, d) => s + (d.amount - d.paid), 0);
    if (memberDue > 0 && waiverNo.trim().length === 0) {
      return { ok: false, message: 'বকেয়া আছে — কমিটির মওকুফ নম্বর ছাড়া নিষ্পত্তি হবে না (D-09)', payable: 0 };
    }
    const payable = Math.max(0, acc.posted - memberDue);
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, status: 'closed', posted: 0, hold: 0 } : a)),
      members: s.members.map((m) => (m.id === acc.memberId ? { ...m, status: 'exited' } : m)),
      payouts: [...s.payouts, {
        id: `p${seq}`, no: `CL-${seq}`, memberId: acc.memberId, member: s.members.find((m) => m.id === acc.memberId)?.name ?? 'সদস্য',
        amount: payable, approvedBy: 'আপনি (MANAGER)', method, status: 'paid' as const, voucher: `V-${seq}`,
      }],
    }));
    return { ok: true, message: `নিষ্পত্তি সম্পন্ন — ৳${payable} প্রদেয় (ডেমো)`, payable };
  }, [state.accounts, state.dues]);

  const reverseTxn: Ctx['reverseTxn'] = useCallback((txnId, reason) => {
    if (reason.trim().length < 5) return { ok: false, message: 'রিভার্সালের কারণ অন্তত ৫ অক্ষরে লিখুন' };
    const txn = state.txns.find((t) => t.id === txnId);
    if (!txn) return { ok: false, message: 'লেনদেন পাওয়া যায়নি' };
    if (txn.status === 'reversed') return { ok: false, message: 'এই লেনদেন আগেই রিভার্স হয়েছে' };
    setState((s) => ({
      ...s,
      txns: [
        { ...txn, id: `${txn.id}-rev`, no: `${txn.no}-R`, type: 'adjust', amount: -txn.amount, status: 'posted', postedBy: 'আপনি (MANAGER)', reference: `${txn.reference}-REV`, audit: [{ at: 'এখন', by: 'আপনি', what: `রিভার্সাল — ${reason}` }] },
        ...s.txns.map((t) => (t.id === txnId ? { ...t, status: 'reversed' as const } : t)),
      ],
      accounts: s.accounts.map((a) => (a.id === txn.accId ? { ...a, posted: Math.max(0, a.posted - txn.amount) } : a)),
    }));
    return { ok: true, message: 'রিভার্সাল পোস্ট হয়েছে — মূল এন্ট্রি মুছেনি, ইতিহাস অক্ষত' };
  }, [state.txns]);

  const closeCashDay: Ctx['closeCashDay'] = useCallback((counted, reason) => {
    const day = state.cashDays[0];
    const diff = counted - day.declared;
    if (diff !== 0 && reason.trim().length < 4) {
      return { ok: false, message: 'পার্থক্যের কারণ লেখা বাধ্যতামূলক', diff };
    }
    setState((s) => ({ ...s, cashDays: s.cashDays.map((d, i) => i === 0 ? { ...d, counted, closed: true, approvedBy: 'আপনি (MANAGER)', note: reason || 'মিলেছে' } : d) }));
    return { ok: true, message: 'দিন বন্ধ হয়েছে — চূড়ান্ত অনুমোদনের অপেক্ষায় (ডেমো)', diff };
  }, [state.cashDays]);

  const payPayout: Ctx['payPayout'] = useCallback((id, method, voucher) => {
    if (!voucher.trim()) return { ok: false, message: 'ভাউচার নম্বর দিন' };
    setState((s) => ({ ...s, payouts: s.payouts.map((p) => (p.id === id ? { ...p, method, voucher, status: 'paid' as const } : p)) }));
    return { ok: true, message: 'প্রদান সম্পন্ন — ভাউচার সংরক্ষিত (ডেমো)' };
  }, []);

  const changeStatus: Ctx['changeStatus'] = useCallback((memberId, to, reason, detail, committeeNo) => {
    if (detail.trim().length < 5) return { ok: false, message: 'বিস্তারিত কারণ লিখুন' };
    if ((to === 'suspended' || to === 'exited') && !committeeNo.trim()) {
      return { ok: false, message: 'কমিটির সিদ্ধান্ত নম্বর ছাড়া এই অবস্থা বদলানো যাবে না' };
    }
    setState((s) => ({ ...s, members: s.members.map((m) => (m.id === memberId ? { ...m, status: to } : m)) }));
    return { ok: true, message: `${reason} — অবস্থা বদলানো হয়েছে (ডেমো, ইতিহাস অক্ষত)` };
  }, []);

  const settleClaim: Ctx['settleClaim'] = useCallback((id, approved) => {
    const claim = state.claims.find((c) => c.id === id);
    if (!claim) return { ok: false, message: 'দাবি পাওয়া যায়নি' };
    if (approved && claim.docs.some((d) => !d.ok)) {
      return { ok: false, message: 'সব প্রমাণ ছাড়া দাবি অনুমোদন করা যাবে না' };
    }
    setState((s) => ({ ...s, claims: s.claims.map((c) => (c.id === id ? { ...c, status: approved ? 'paid' as const : 'committee' } : c)) }));
    return { ok: true, message: approved ? 'দাবি অনুমোদিত ও প্রদান প্রস্তুত (ডেমো)' : 'কমিটিতে পাঠানো হয়েছে' };
  }, [state.claims]);

  const transferFunds: Ctx['transferFunds'] = useCallback((from, to, amount) => {
    if (from === to) return { ok: false, message: 'উৎস ও গন্তব্য আলাদা হতে হবে' };
    if (!amount || amount < 100) return { ok: false, message: 'সর্বনিম্ন ৳১০০' };
    const src = state.orgAccounts.find((a) => a.id === from);
    if (!src || amount > src.balance) return { ok: false, message: 'উৎস হিসাবে পর্যাপ্ত ব্যালেন্স নেই' };
    setState((s) => ({
      ...s,
      orgAccounts: s.orgAccounts.map((a) => a.id === from ? { ...a, balance: a.balance - amount } : a.id === to ? { ...a, balance: a.balance + amount } : a),
      transfers: [{ id: `tr${seq}`, no: nextNo('FT'), from, to, amount, fee: 0, by: 'আপনি (স্টাফ)', at: 'এখন', status: 'pending', approvedBy: '' }, ...s.transfers],
    }));
    return { ok: true, message: 'স্থানান্তর প্রস্তাব জমা — অনুমোদনের অপেক্ষায় (ডেমো)' };
  }, [state.orgAccounts]);


  /* ---------- ব্যাচ ৫ অ্যাকশন ---------- */
  const mkAudit = (e: Partial<AuditEntry>): AuditEntry => ({
    id: `au${++seq}`, at: '২০২৬-১০-৩১ · এখন', who: 'আপনি (স্টাফ)', role: 'MANAGER',
    action: 'update', actionBn: 'সম্পাদনা', entityBn: '—', ref: '—', refLabel: '—',
    before: '—', after: '—', dev: 'Android · App', ip: '—', result: 'success', ...e,
  });

  const resolveException: Ctx['resolveException'] = useCallback((id, mode, note) => {
    const ex = state.reconEx.find((x) => x.id === id);
    if (!ex) return { ok: false, message: 'ব্যতিক্রম পাওয়া যায়নি' };
    if (ex.status === 'resolved') return { ok: false, message: 'এটি আগেই নিষ্পত্তি হয়েছে' };
    if (note.trim().length < 5) return { ok: false, message: 'নিষ্পত্তির কারণ/লিখিত ব্যাখ্যা অন্তত ৫ অক্ষরে দিন' };
    setState((s) => ({
      ...s,
      reconEx: s.reconEx.map((x) => (x.id === id ? { ...x, status: mode === 'resolve' ? 'resolved' as const : 'suspense' as const, resolvedAt: 'এখন', by: 'আপনি (ACCOUNTANT)' } : x)),
      recon: {
        ...s.recon,
        unmatched: mode === 'resolve' ? Math.max(0, s.recon.unmatched - 1) : s.recon.unmatched,
        suspense: mode === 'suspense' ? s.recon.suspense + 1 : Math.max(0, s.recon.suspense - 1),
      },
      audit: [mkAudit({ action: 'update', actionBn: 'সম্পাদনা', entityBn: 'রিকনসিলিয়েশন ব্যতিক্রম', ref: ex.txn, refLabel: ex.kindBn, before: 'খোলা', after: mode === 'resolve' ? 'নিষ্পত্তি' : 'সাসপেন্স (H10)', note }), ...s.audit],
    }));
    return { ok: true, message: mode === 'resolve' ? 'ব্যতিক্রম নিষ্পত্তি হয়েছে — কারণ ও কে করলেন লগে গেছে (ডেমো)' : 'সাসপেন্স খাতায় (H10) রাখা হলো — তদন্ত চলবে' };
  }, [state.reconEx]);

  const signOffRecon: Ctx['signOffRecon'] = useCallback(() => {
    const open = state.reconEx.filter((x) => x.status === 'open').length;
    if (open > 0) return { ok: false, message: `${open}টি অমিল নিষ্পত্তি বাকি — সাইন-অফ আটকে আছে` };
    if (state.recon.signedOff) return { ok: false, message: 'এই পিরিয়ড আগেই সাইন-অফ হয়েছে' };
    setState((s) => ({
      ...s,
      recon: { ...s.recon, signedOff: true, status: 'signed_off' },
      audit: [mkAudit({ action: 'approve', actionBn: 'অনুমোদন', entityBn: 'রিকনসিলিয়েশন', ref: 'RECON-2610', refLabel: s.recon.period, before: 'চলছে', after: 'সাইন-অফ' }), ...s.audit],
    }));
    return { ok: true, message: 'পিরিয়ড রিকনসাইলড ও সাইন-অফ হয়েছে — মাস বন্ধ করা যাবে (ডেমো)' };
  }, [state.reconEx, state.recon]);

  const postBatch: Ctx['postBatch'] = useCallback((id) => {
    const b = state.batches.find((x) => x.id === id);
    if (!b) return { ok: false, message: 'ব্যাচ পাওয়া যায়নি' };
    if (b.status === 'posted') return { ok: false, message: 'এই ব্যাচ আগেই পোস্ট হয়েছে' };
    if (b.status === 'validating') return { ok: false, message: 'যাচাই শেষ হয়নি — এখন পোস্ট করা যাবে না' };
    if (b.valid === 0) return { ok: false, message: 'বৈধ সারি নেই' };
    const txn = nextNo('TXN');
    setState((s) => ({
      ...s,
      batches: s.batches.map((x) => (x.id === id ? { ...x, status: 'posted' as const, txn, progress: 100 } : x)),
      audit: [mkAudit({ action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'বাল্ক ব্যাচ', ref: b.no, refLabel: `${b.valid} সারি · ${b.route}`, before: '—', after: `৳${b.amount}`, note: 'অসম্পূর্ণ সারি পোস্ট হয়নি' }), ...s.audit],
    }));
    return { ok: true, message: `${b.valid}টি সারি পোস্ট হয়েছে — ${txn} (ডেমো)` };
  }, [state.batches]);

  const commitImport: Ctx['commitImport'] = useCallback((id) => {
    const im = state.imports.find((x) => x.id === id);
    if (!im) return { ok: false, message: 'ইমপোর্ট পাওয়া যায়নি' };
    if (im.status !== 'dry_run') return { ok: false, message: 'শুধু ড্রাই-রান ফাইল কমিট করা যায়' };
    setState((s) => ({
      ...s,
      imports: s.imports.map((x) => (x.id === id ? { ...x, status: 'committed' as const, effect: `${x.valid}টি কিস্তি পোস্ট হয়েছে (ডেমো)` } : x)),
      audit: [mkAudit({ action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'CSV ইমপোর্ট', ref: im.file, refLabel: `${im.valid} সারি`, before: 'ড্রাই-রান', after: 'কমিটেড' }), ...s.audit],
    }));
    return { ok: true, message: `${im.valid}টি সারি কমিট হয়েছে — পুরো ইমপোর্ট একটি ব্যাচ হিসেবে লগে আছে (ডেমো)` };
  }, [state.imports]);

  const signOffFinance: Ctx['signOffFinance'] = useCallback(() => {
    const fin = financeTotals();
    if (!fin.balanced) return { ok: false, message: 'উদ্বৃত্তপত্রের দুই পাশ মেলেনি — সাইন-অফ আটকে আছে (BR-12)' };
    if (!FIN.trialOk) return { ok: false, message: 'ট্রায়াল ব্যালান্সে পার্থক্য আছে' };
    if (state.financeSignedOff) return { ok: false, message: 'অর্থবছর আগেই সাইন-অফ হয়েছে' };
    setState((s) => ({
      ...s,
      financeSignedOff: true,
      audit: [mkAudit({ action: 'approve', actionBn: 'অনুমোদন', entityBn: 'আর্থিক বিবরণী', ref: 'FIN-2526', refLabel: FIN.fy, before: 'সাইন-অফ বাকি', after: 'সাইন-অফ' }), ...s.audit],
    }));
    return { ok: true, message: 'অর্থবছর সাইন-অফ হয়েছে — পরে খুললে অডিট লগে থাকবে (ডেমো)' };
  }, [state.financeSignedOff]);

  const createScheme: Ctx['createScheme'] = useCallback((input, decisionNo) => {
    if (decisionNo.trim().length < 4) return { ok: false, message: 'কমিটির সিদ্ধান্ত নম্বর ছাড়া স্কিম চালু হবে না (D-34)' };
    if (!/^[A-Z]{2}-\d{2}$/.test(input.code.trim())) return { ok: false, message: 'কোডের ছাঁচ: দুই বড় হাতের অক্ষর, হাইফেন, দুই অঙ্ক (যেমন MS-05)' };
    if (state.schemes.some((x) => x.code === input.code.trim())) return { ok: false, message: `‘${input.code}’ কোড আগেই ব্যবহৃত — রসিদ/অ্যাকাউন্টে সংঘর্ষ হবে` };
    if (input.name.trim().length < 3) return { ok: false, message: 'স্কিমের নাম লিখুন' };
    if (!input.installment || input.installment < 10) return { ok: false, message: 'কিস্তি সর্বনিম্ন ৳১০' };
    if (input.tenure !== null && (input.tenure < 3 || input.tenure > 60)) return { ok: false, message: 'মেয়াদ ৩–৬০ মাসের মধ্যে হতে হবে' };
    if (input.minBalance > 5000) return { ok: false, message: 'সর্বনিম্ন ব্যালেন্স ৳৫,০০০-এর বেশি হতে পারবে না — গ্রামীণ সদস্যের জন্য অসুবিধা' };
    setState((s) => ({
      ...s,
      schemes: [...s.schemes, {
        id: `sc${seq}`, code: input.code.trim(), name: input.name.trim(), type: input.tenure ? 'term' : 'monthly',
        typeBn: input.typeBn, version: 1, status: 'pending' as const, members: 0, total: 0,
        installment: input.installment, tenure: input.tenure, lockIn: 6, noticeDays: 15, maxPerMonth: 2,
        maxAmount: 50000, minBalance: input.minBalance, graceDays: 10, lateFee: 20, extra: false,
        desc: 'নতুন প্রস্তাবিত স্কিম — কমিটির অনুমোদনের অপেক্ষায় (D-34)।',
        fees: { admission: 100, annual: 50, withdrawal: 20 },
      }],
      audit: [mkAudit({ action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'স্কিম খসড়া', ref: input.code.trim(), refLabel: input.name, before: '—', after: 'অনুমোদনের অপেক্ষায়', note: `কমিটির সিদ্ধান্ত ${decisionNo}` }), ...s.audit],
    }));
    return { ok: true, message: 'স্কিম খসড়া তৈরি — অনুমোদনের অপেক্ষায়, সরাসরি চালু হয়নি (D-34)' };
  }, [state.schemes]);

  const proposeVersion: Ctx['proposeVersion'] = useCallback((id, decisionNo) => {
    if (decisionNo.trim().length < 4) return { ok: false, message: 'কমিটির সিদ্ধান্ত নম্বর ছাড়া নতুন সংস্করণ জমা হবে না (D-32)' };
    const sc = state.schemes.find((x) => x.id === id);
    if (!sc) return { ok: false, message: 'স্কিম পাওয়া যায়নি' };
    if (sc.status === 'pending') return { ok: false, message: 'আগের সংস্করণ এখনো অনুমোদনের অপেক্ষায়' };
    setState((s) => ({
      ...s,
      schemes: s.schemes.map((x) => (x.id === id ? { ...x, version: x.version + 1, status: 'pending' as const, lockIn: 6, noticeDays: 15, lateFee: 25 } : x)),
      audit: [mkAudit({ action: 'update', actionBn: 'সম্পাদনা', entityBn: 'স্কিম সংস্করণ', ref: sc.code, refLabel: `v${sc.version} → v${sc.version + 1}`, before: `লক-ইন ${sc.lockIn} · নোটিশ ${sc.noticeDays} · ফি ${sc.lateFee}`, after: 'লক-ইন ৬ · নোটিশ ১৫ · ফি ২৫', note: `কমিটির সিদ্ধান্ত ${decisionNo}` }), ...s.audit],
    }));
    return { ok: true, message: `নতুন সংস্করণ v${sc.version + 1} প্রস্তাবিত — পুরনো অ্যাকাউন্ট অপরিবর্তিত থাকবে (D-32)` };
  }, [state.schemes]);

  const requestMove: Ctx['requestMove'] = useCallback((memberId, to, reason, effAt) => {
    const m = state.members.find((x) => x.id === memberId);
    if (!m) return { ok: false, message: 'সদস্য পাওয়া যায়নি' };
    if (reason.trim().length < 5) return { ok: false, message: 'স্থানান্তরের কারণ অন্তত ৫ অক্ষরে লিখুন' };
    if (!effAt) return { ok: false, message: 'কার্যকর হওয়ার তারিখ দিন' };
    if (effAt <= '2026-10-31') return { ok: false, message: 'কার্যকর তারিখ ভবিষ্যতের হতে হবে — পেছনের তারিখে নয় (R-05)' };
    if (to === m.route) return { ok: false, message: 'সদস্য ইতিমধ্যে এই রুটেই আছেন' };
    const no = nextNo('MV');
    setState((s) => ({
      ...s,
      moves: [{
        id: `mv${seq}`, no, memberId, kind: 'route', kindBn: 'রুট পরিবর্তন', from: `${m.route} · বর্তমান রুট`, to,
        reason: reason.trim(), effAt, by: 'আপনি (MANAGER)', at: '২০২৬-১০-৩১', status: 'pending',
        impact: { collector: `${to}-এর সংগ্রহক`, report: 'রুটভিত্তিক রিপোর্ট বদলাবে', cash: 'আজকের ক্যাশে প্রভাব নেই', history: 'পুরনো লেনদেনের ইতিহাস বদলায় না' },
      }, ...s.moves],
      audit: [mkAudit({ action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'সদস্য স্থানান্তর', ref: no, refLabel: `${m.name} · ${m.route} → ${to}`, before: m.route, after: to, note: reason }), ...s.audit],
    }));
    return { ok: true, message: `স্থানান্তর অনুরোধ ${no} তৈরি — ${effAt} থেকে কার্যকর, অনুমোদনের অপেক্ষায়` };
  }, [state.members]);

  const approveMove: Ctx['approveMove'] = useCallback((id, branchApprover) => {
    const mv = state.moves.find((x) => x.id === id);
    if (!mv) return { ok: false, message: 'অনুরোধ পাওয়া যায়নি' };
    if (mv.status !== 'pending') return { ok: false, message: 'এই অনুরোধ আর অপেক্ষমাণ নেই' };
    if (mv.kind === 'branch' && branchApprover.trim().length < 3) {
      return { ok: false, message: 'শাখা স্থানান্তর শুধু ORG_ADMIN অনুমোদন করতে পারেন — নাম/সিদ্ধান্ত নম্বর দিন' };
    }
    setState((s) => ({
      ...s,
      moves: s.moves.map((x) => (x.id === id ? { ...x, status: 'approved' as const } : x)),
      audit: [mkAudit({ action: 'approve', actionBn: 'অনুমোদন', entityBn: 'সদস্য স্থানান্তর', ref: mv.no, refLabel: `${mv.from} → ${mv.to}`, before: 'অপেক্ষমাণ', after: mv.effAt + ' কার্যকর' }), ...s.audit],
    }));
    return { ok: true, message: `${mv.effAt} থেকে কার্যকর হবে — SMS ও নোটিফিকেশন যাবে (ডেমো)` };
  }, [state.moves]);

  const createRoute: Ctx['createRoute'] = useCallback((input) => {
    if (input.name.trim().length < 3) return { ok: false, message: 'রুটের নাম লিখুন' };
    if (input.collector.trim().length < 3) return { ok: false, message: 'সংগ্রহক বাছাই করুন' };
    if (!input.target || input.target < 1000) return { ok: false, message: 'লক্ষ্য সর্বনিম্ন ৳১,০০০' };
    const id = `R${state.routes.length + 1}`;
    setState((s) => ({
      ...s,
      routes: [...s.routes, {
        id, name: input.name.trim(), area: input.area || input.name.trim(), collector: input.collector.trim(),
        mobile: '01711000009', day: input.day || 'শনি · সোম · বুধ', members: 0, unassigned: 0,
        target: input.target, collected: 0, dues: 0, overdueAmt: 0, cashInHand: 0, load: 'ok' as const,
      }],
      audit: [mkAudit({ action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'সংগ্রহ রুট', ref: id, refLabel: input.name, before: '—', after: `লক্ষ্য ৳${input.target}` }), ...s.audit],
    }));
    return { ok: true, message: `নতুন রুট ${id} তৈরি হয়েছে — বরাদ্দহীন সদস্য যোগ করতে পারেন` };
  }, [state.routes]);

  const assignAll: Ctx['assignAll'] = useCallback((routeId) => {
    if (!state.unassigned.length) return { ok: false, message: 'কোনো বরাদ্দহীন সদস্য নেই' };
    const n = state.unassigned.length;
    setState((s) => ({
      ...s,
      routes: s.routes.map((r) => (r.id === routeId ? { ...r, members: r.members + n, unassigned: 0, target: r.target + n * 1000 } : r)),
      unassigned: [],
      audit: [mkAudit({ action: 'update', actionBn: 'সম্পাদনা', entityBn: 'রুট বরাদ্দ', ref: routeId, refLabel: `${n} জন সদস্য`, before: 'বরাদ্দহীন', after: `${routeId}-এ বরাদ্দ` }), ...s.audit],
    }));
    return { ok: true, message: `${n} জন সদস্য ${routeId}-এ বরাদ্দ হয়েছে — সংগ্রহকের চাপ দেখে নিন` };
  }, [state.unassigned]);

  const toggleTemplate: Ctx['toggleTemplate'] = useCallback((id) => {
    const t = state.templates.find((x) => x.id === id);
    if (!t) return { ok: false, message: 'টেমপ্লেট পাওয়া যায়নি' };
    setState((s) => ({
      ...s,
      templates: s.templates.map((x) => (x.id === id ? { ...x, on: !x.on } : x)),
      audit: [mkAudit({ action: 'update', actionBn: 'সম্পাদনা', entityBn: 'রিমাইন্ডার টেমপ্লেট', ref: t.code, refLabel: t.name, before: t.on ? 'চালু' : 'বন্ধ', after: t.on ? 'বন্ধ' : 'চালু' }), ...s.audit],
    }));
    return { ok: true, message: `${t.name} — ${t.on ? 'বন্ধ' : 'চালু'} করা হলো (ডেমো)` };
  }, [state.templates]);

  const toggleSetting: Ctx['toggleSetting'] = useCallback((key) => {
    const t = state.toggles.find((x) => x.key === key);
    if (!t) return { ok: false, message: 'সেটিং পাওয়া যায়নি' };
    setState((s) => ({
      ...s,
      toggles: s.toggles.map((x) => (x.key === key ? { ...x, on: !x.on } : x)),
      audit: [mkAudit({ action: 'update', actionBn: 'সম্পাদনা', entityBn: 'সেটিংস', ref: key, refLabel: t.t, before: t.on ? 'চালু' : 'বন্ধ', after: t.on ? 'বন্ধ' : 'চালু' }), ...s.audit],
    }));
    return { ok: true, message: `${t.t} — ${t.on ? 'বন্ধ' : 'চালু'} হলো (ডেমো)` };
  }, [state.toggles]);

  const addStaff: Ctx['addStaff'] = useCallback((input) => {
    if (input.name.trim().length < 3) return { ok: false, message: 'স্টাফের নাম লিখুন' };
    if (!/^01\d{9}$/.test(input.mobile)) return { ok: false, message: 'মোবাইল নম্বর ১১ অঙ্কের হতে হবে (01…)' };
    if (!ROLE_BY_NAME[input.role]) return { ok: false, message: 'ভূমিকা বাছাই করুন' };
    if (input.scope.trim().length < 2) return { ok: false, message: 'স্কোপ (শাখা/রুট) লিখুন' };
    const limit = input.role === 'COLLECTOR' ? 20000 : input.role === 'ACCOUNTANT' ? 50000 : input.role === 'MANAGER' ? 100000 : input.role === 'AUDITOR' ? 0 : null;
    setState((s) => ({
      ...s,
      staff: [...s.staff, {
        id: `u${seq}`, name: input.name.trim(), role: input.role, roleBn: ROLE_BY_NAME[input.role],
        mobile: input.mobile, scope: input.scope.trim(), status: 'invited' as const, invitedAt: '২০২৬-১০-৩১', limit,
      }],
      audit: [mkAudit({ action: 'entry', actionBn: 'এন্ট্রি', entityBn: 'স্টাফ আমন্ত্রণ', ref: input.role, refLabel: input.name, before: '—', after: 'আমন্ত্রিত' }), ...s.audit],
    }));
    return { ok: true, message: 'আমন্ত্রণ পাঠানো হয়েছে — ডিফল্টে কোনো পারমিশন আসেনি, প্রথম লগইনে সেট করতে হবে' };
  }, []);

  const suspendStaff: Ctx['suspendStaff'] = useCallback((id) => {
    const u = state.staff.find((x) => x.id === id);
    if (!u) return { ok: false, message: 'স্টাফ পাওয়া যায়নি' };
    if (u.role === 'ORG_ADMIN' && state.staff.filter((x) => x.role === 'ORG_ADMIN' && x.status === 'active').length <= 1) {
      return { ok: false, message: 'কমপক্ষে ১ জন সক্রিয় ORG_ADMIN থাকতে হবে' };
    }
    setState((s) => ({
      ...s,
      staff: s.staff.map((x) => (x.id === id ? { ...x, status: 'suspended' as const } : x)),
      audit: [mkAudit({ action: 'update', actionBn: 'সম্পাদনা', entityBn: 'স্টাফ', ref: u.role, refLabel: u.name, before: u.status, after: 'নিষ্ক্রিয়', alert: 'সেশন বাতিল · অফলাইন কিউ sync হবে না · ঝুলন্ত অনুমোদন ফিরবে' }), ...s.audit],
    }));
    return { ok: true, message: 'নিষ্ক্রিয় হয়েছে — সেশন বাতিল, ঝুলন্ত অনুমোদন ম্যানেজারের কিউতে ফিরেছে (ডেমো)' };
  }, [state.staff]);

  const runReport: Ctx['runReport'] = useCallback((code, fmt) => {
    const r = state.reports.find((x) => x.code === code);
    if (!r) return { ok: false, message: 'রিপোর্ট পাওয়া যায়নি' };
    setState((s) => ({
      ...s,
      reportRuns: [{
        id: `rr${seq}`, name: r.name, code: r.code, by: 'আপনি (স্টাফ)', fmt, size: fmt === 'CSV' ? '১২ KB' : '৯৪ KB',
        at: '২০২৬-১০-৩১ · এখন', status: 'ready' as const,
      }, ...s.reportRuns],
      audit: [mkAudit({ action: 'export', actionBn: 'এক্সপোর্ট', entityBn: 'রিপোর্ট', ref: r.code, refLabel: `${r.name} · ${fmt}`, before: '—', after: fmt }), ...s.audit],
    }));
    return { ok: true, message: `${r.name} (${fmt}) তৈরি হয়েছে — ডাউনলোড প্রস্তুত (ডেমো)` };
  }, [state.reports]);

  const reset = useCallback(() => setState(INITIAL), []);

  const value = useMemo<Ctx>(() => ({
    state, decide, addDeposit, registerMember, reviewApplication, saveMemberChange, closeAccount,
    reverseTxn, closeCashDay, payPayout, changeStatus, settleClaim, transferFunds,
    resolveException, signOffRecon, postBatch, commitImport, signOffFinance, createScheme, proposeVersion,
    requestMove, approveMove, createRoute, assignAll, toggleTemplate, toggleSetting, addStaff, suspendStaff, runReport, reset,
  }), [state, decide, addDeposit, registerMember, reviewApplication, saveMemberChange, closeAccount, reverseTxn, closeCashDay, payPayout, changeStatus, settleClaim, transferFunds,
    resolveException, signOffRecon, postBatch, commitImport, signOffFinance, createScheme, proposeVersion, requestMove, approveMove, createRoute, assignAll, toggleTemplate, toggleSetting, addStaff, suspendStaff, runReport, reset]);

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error('useAdmin — AdminProvider-এর বাইরে');
  return ctx;
}
