/* ============================================================
   src/store/memberStore.tsx — সদস্য অ্যাপের ডেমো স্টোর (React Context)
   ------------------------------------------------------------
   • সব অ্যাকশন **async** — ফেজ ৬-এ শুধু ভেতরের বডি fetch() হবে,
     স্ক্রিনের কোড বদলাতে হবে না (await + loading state আগেই আছে)
   • কোনো টাকা/সুদ হিসাব এখানে উদ্ভাবন করা হয় না — টাইপ ও নিয়ম domain/member.ts-এ
   • ডেটা মেমোরিতে থাকে (রিফ্রেশে সিড-এ ফিরে যায়) — এটি ডেমো, বাস্তব নয়
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SEED,
  computeBalance,
  dueInstallments,
  nextReceiptNo,
  nextRef,
  payableAmount,
  type Account,
  type CloseRequest,
  type Deposit,
  type DepositMode,
  type MemberNotification,
  type MemberState,
  type Nominee,
  type Profile,
  type Settings,
  type Ticket,
  type Withdrawal,
} from '../domain/member';

type EnrollInput = {
  schemeId: string;
  installment: number;
  frequency: 'মাসিক' | 'সাপ্তাহিক';
  nomineeId: string;
  accepted: boolean;
};

type WithdrawInput = {
  amount: number;
  mode: DepositMode;
  reason: string;
  accountName: string;
  accountNo: string;
};

type MemberContextValue = {
  state: MemberState;
  balance: number;
  dues: ReturnType<typeof dueInstallments>;
  payable: number;
  account: Account;
  accountById: (id?: string) => Account | undefined;
  depositById: (id?: string) => Deposit | undefined;
  withdrawalById: (id?: string) => Withdrawal | undefined;
  unreadCount: number;
  addDeposit: (input: { amount: number; mode: DepositMode; note?: string }) => Promise<Deposit>;
  enroll: (input: EnrollInput) => Promise<Account>;
  requestWithdrawal: (input: WithdrawInput) => Promise<Withdrawal>;
  cancelWithdrawal: (id: string) => Promise<void>;
  saveProfile: (patch: Partial<Profile>) => Promise<void>;
  addNominee: (input: Omit<Nominee, 'id'>) => Promise<void>;
  updateNominee: (id: string, patch: Partial<Nominee>) => Promise<void>;
  removeNominee: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  createTicket: (input: { subject: string; body: string }) => Promise<Ticket>;
  requestClose: (input: { reason: string; settlementMode: DepositMode; accountName: string; accountNo: string }) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
};

const MemberContext = createContext<MemberContextValue | null>(null);

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const today = () => '৩১ অক্টোবর ২০২৬';
const later = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

export function MemberProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MemberState>(SEED);

  const account = state.accounts[0];
  const balance = useMemo(() => computeBalance(state), [state]);
  const dues = useMemo(() => dueInstallments(state), [state]);
  const payable = useMemo(() => payableAmount(state), [state]);
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const accountById = useCallback((id?: string) => state.accounts.find((a) => a.id === id), [state.accounts]);
  const depositById = useCallback((id?: string) => state.deposits.find((d) => d.id === id), [state.deposits]);
  const withdrawalById = useCallback((id?: string) => state.withdrawals.find((w) => w.id === id), [state.withdrawals]);

  const addDeposit = useCallback(async ({ amount, mode, note }: { amount: number; mode: DepositMode; note?: string }) => {
    let created: Deposit | null = null;
    setState((s) => {
      const acc = s.accounts[0];
      const dep: Deposit = {
        id: uid('dep'),
        accountId: acc.id,
        amount,
        mode,
        date: today(),
        receipt: nextReceiptNo(s.deposits),
        status: 'approved',
        note,
      };
      created = dep;
      // যে কিস্তি বাকি আছে সেটি পরিশোধ হিসেবে চিহ্নিত হয় (যদি অঙ্ক মেলে)
      const installments = [...s.installments];
      const idx = installments.findIndex((i) => i.status === 'overdue');
      const fallback = installments.findIndex((i) => i.status === 'due');
      const target = idx >= 0 ? idx : fallback;
      if (target >= 0 && amount >= installments[target].amount) {
        installments[target] = { ...installments[target], status: 'paid', paidOn: today() };
      }
      const ntf: MemberNotification = {
        id: uid('ntf'),
        title: 'জমা গৃহীত হয়েছে',
        body: `৳${amount} জমা নিশ্চিত হয়েছে। রসিদ ${dep.receipt}।`,
        at: today(),
        read: false,
        route: `/m/deposit/receipt/${dep.id}`,
      };
      return { ...s, deposits: [dep, ...s.deposits], installments, notifications: [ntf, ...s.notifications] };
    });
    return later(created as unknown as Deposit);
  }, []);

  const enroll = useCallback(async (input: EnrollInput) => {
    let created: Account | null = null;
    setState((s) => {
      const scheme = s.schemes.find((x) => x.id === input.schemeId) ?? s.schemes[0];
      const acc: Account = {
        id: uid('acc'),
        schemeId: scheme.id,
        schemeName: scheme.name,
        number: `A-০০${460 + s.accounts.length}`,
        openedOn: today(),
        openingBalance: 0,
        installment: input.installment,
        frequency: input.frequency,
        totalInstallments: scheme.durationMonths,
        status: 'active',
      };
      created = acc;
      const ntf: MemberNotification = {
        id: uid('ntf'),
        title: 'নতুন স্কিমে নামভর্তি সম্পন্ন',
        body: `${scheme.name}-এ আপনার অ্যাকাউন্ট ${acc.number} চালু হয়েছে।`,
        at: today(),
        read: false,
        route: '/m/savings',
      };
      return { ...s, accounts: [...s.accounts, acc], notifications: [ntf, ...s.notifications] };
    });
    return later(created as unknown as Account);
  }, []);

  const requestWithdrawal = useCallback(async (input: WithdrawInput) => {
    let created: Withdrawal | null = null;
    setState((s) => {
      const wd: Withdrawal = {
        id: uid('wd'),
        ...input,
        date: today(),
        status: 'pending',
        reference: nextRef('WDR', s.withdrawals),
        timeline: [
          { label: 'আবেদন জমা', at: today(), done: true },
          { label: 'যাচাই', at: '—', done: false },
          { label: 'অনুমোদন', at: '—', done: false },
          { label: 'বিতরণ', at: '—', done: false },
        ],
      };
      created = wd;
      const ntf: MemberNotification = {
        id: uid('ntf'),
        title: 'উত্তোলনের আবেদন জমা হয়েছে',
        body: `৳${input.amount} উত্তোলনের আবেদন ${wd.reference} নম্বরে জমা হয়েছে।`,
        at: today(),
        read: false,
        route: `/m/withdrawals/${wd.id}`,
      };
      return { ...s, withdrawals: [wd, ...s.withdrawals], notifications: [ntf, ...s.notifications] };
    });
    return later(created as unknown as Withdrawal);
  }, []);

  const cancelWithdrawal = useCallback(async (id: string) => {
    setState((s) => ({
      ...s,
      withdrawals: s.withdrawals.map((w) =>
        w.id === id && w.status === 'pending'
          ? {
              ...w,
              status: 'rejected',
              timeline: [
                ...w.timeline.map((t, i) => (i === 0 ? t : t)),
                { label: 'সদস্য কর্তৃক বাতিল', at: today(), done: true },
              ],
            }
          : w,
      ),
    }));
  }, []);

  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const addNominee = useCallback(async (input: Omit<Nominee, 'id'>) => {
    setState((s) => ({ ...s, nominees: [...s.nominees, { ...input, id: uid('nom') }] }));
  }, []);

  const updateNominee = useCallback(async (id: string, patch: Partial<Nominee>) => {
    setState((s) => ({ ...s, nominees: s.nominees.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }, []);

  const removeNominee = useCallback(async (id: string) => {
    setState((s) => ({ ...s, nominees: s.nominees.filter((n) => n.id !== id) }));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  }, []);

  const createTicket = useCallback(async (input: { subject: string; body: string }) => {
    const tk: Ticket = { id: uid('tk'), subject: input.subject, body: input.body, at: today(), status: 'open' };
    setState((s) => ({ ...s, tickets: [tk, ...s.tickets] }));
    return later(tk);
  }, []);

  const requestClose = useCallback(
    async (input: { reason: string; settlementMode: DepositMode; accountName: string; accountNo: string }) => {
      const cr: CloseRequest = { id: uid('cl'), ...input, at: today(), status: 'submitted' };
      setState((s) => ({
        ...s,
        closeRequest: cr,
        accounts: s.accounts.map((a, i) => (i === 0 ? { ...a, status: 'closed-requested' } : a)),
        notifications: [
          {
            id: uid('ntf'),
            title: 'অ্যাকাউন্ট বন্ধের আবেদন জমা',
            body: 'কমিটি যাচাই করে চূড়ান্ত নিষ্পত্তি করবে (৩০ কার্যদিবসের মধ্যে)।',
            at: today(),
            read: false,
            route: '/m/close-request',
          },
          ...s.notifications,
        ],
      }));
    },
    [],
  );

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const value: MemberContextValue = {
    state,
    balance,
    dues,
    payable,
    account,
    accountById,
    depositById,
    withdrawalById,
    unreadCount,
    addDeposit,
    enroll,
    requestWithdrawal,
    cancelWithdrawal,
    saveProfile,
    addNominee,
    updateNominee,
    removeNominee,
    markNotificationRead,
    markAllNotificationsRead,
    createTicket,
    requestClose,
    updateSettings,
  };

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMember(): MemberContextValue {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error('useMember শুধু <MemberProvider> ভেতরে ব্যবহার করুন');
  return ctx;
}
