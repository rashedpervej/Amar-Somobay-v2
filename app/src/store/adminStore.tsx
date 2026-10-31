/* ============================================================
   src/store/adminStore.tsx — অ্যাডমিন মোবাইল অ্যাপের একক সত্য উৎস
   AM-01…AM-20 পর্দা এই স্টোরের state পড়ে এবং action ডাকে।
   ডেমো: সব কিছু ইন-মেমরি; কোনো ডেটাবেস বা নেটওয়ার্ক ছোঁয়া হয় না।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
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
};

type Ctx = {
  state: AdminState;
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

  const reset = useCallback(() => setState(INITIAL), []);

  const value = useMemo<Ctx>(() => ({
    state, decide, addDeposit, registerMember, reviewApplication, saveMemberChange, closeAccount,
    reverseTxn, closeCashDay, payPayout, changeStatus, settleClaim, transferFunds, reset,
  }), [state, decide, addDeposit, registerMember, reviewApplication, saveMemberChange, closeAccount, reverseTxn, closeCashDay, payPayout, changeStatus, settleClaim, transferFunds, reset]);

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error('useAdmin — AdminProvider-এর বাইরে');
  return ctx;
}
