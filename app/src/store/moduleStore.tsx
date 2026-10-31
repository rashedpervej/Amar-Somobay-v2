/* ============================================================
   src/store/moduleStore.tsx — ROSCA · যৌথ লক্ষ্য · কর্জে হাসানা স্টোর
   প্রতিটি অ্যাকশন আসল অবস্থা বদলায় (কিস্তি, অবদান, পরিশোধ) এবং
   নতুন রসিদ/এন্ট্রি ফেরত দেয়। কোনো সুদ/মুনাফা কোথাও যোগ হয় না।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SEED_CIRCLES, mySeat, myDraws, type RcCircle, type RcDraw,
} from '../domain/rosca';
import {
  SEED_GOALS, SEED_PARTS, SEED_CONTRIBS, SEED_DISB, JG_ME,
  type JgGoal, type JgPart, type JgContrib, type JgDisb,
} from '../domain/joint';
import {
  SEED_PRODUCTS, SEED_APPS, SEED_LOANS, SEED_REPAYMENTS,
  type QhProduct, type QhApp, type QhLoan, type QhRepayment,
  outstanding, perInstallment,
} from '../domain/qard';

type Money = { receipt: string; amount: number; at: string };

type ModuleContextValue = {
  circles: RcCircle[];
  goals: JgGoal[];
  parts: JgPart[];
  contribs: JgContrib[];
  disbursements: JgDisb[];
  products: QhProduct[];
  applications: QhApp[];
  loans: QhLoan[];
  repayments: QhRepayment[];

  circleById: (id?: string) => RcCircle | undefined;
  goalById: (id?: string) => JgGoal | undefined;
  loanById: (id?: string) => QhLoan | undefined;
  drawById: (circleId: string, drawId?: string) => RcDraw | undefined;
  payCircle: (circleId: string, amount: number, channel: RcDraw['channel']) => Promise<Money>;
  joinGoal: (goalId: string, pledged: number) => Promise<void>;
  contributeGoal: (goalId: string, amount: number, channel: JgContrib['channel']) => Promise<Money>;
  applyQard: (input: { amount: number; purpose: string; productId: string; tenure: number }) => Promise<QhApp>;
  repayQard: (loanId: string, amount: number, channel: QhRepayment['channel']) => Promise<Money>;
};

const Ctx = createContext<ModuleContextValue | null>(null);

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;
const later = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));
const TODAY = '৩১ অক্টোবর ২০২৬';
const BN = (n: number) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
const nextNo = (prefix: string, count: number) => `${prefix}-${BN(6000 + count + 1)}`;

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [circles, setCircles] = useState<RcCircle[]>(SEED_CIRCLES);
  const [goals, setGoals] = useState<JgGoal[]>(SEED_GOALS);
  const [parts, setParts] = useState<JgPart[]>(SEED_PARTS);
  const [contribs, setContribs] = useState<JgContrib[]>(SEED_CONTRIBS);
  const [disbursements] = useState<JgDisb[]>(SEED_DISB);
  const [applications, setApplications] = useState<QhApp[]>(SEED_APPS);
  const [loans, setLoans] = useState<QhLoan[]>(SEED_LOANS);
  const [repayments, setRepayments] = useState<QhRepayment[]>(SEED_REPAYMENTS);

  const circleById = useCallback((id?: string) => circles.find((c) => c.id === id), [circles]);
  const goalById = useCallback((id?: string) => goals.find((g) => g.id === id), [goals]);
  const loanById = useCallback((id?: string) => loans.find((l) => l.id === id), [loans]);
  const drawById = useCallback(
    (circleId: string, drawId?: string) => circles.find((c) => c.id === circleId)?.draws.find((d) => d.id === drawId),
    [circles],
  );

  const payCircle = useCallback(async (circleId: string, amount: number, channel: RcDraw['channel']) => {
    const receipt = nextNo('RCR', 0);
    setCircles((list) =>
      list.map((c) =>
        c.id !== circleId
          ? c
          : {
              ...c,
              collected: c.collected + amount,
              seatList: c.seatList.map((s) =>
                s.isMe ? { ...s, contributed: s.contributed + amount, paidCount: s.paidCount + 1, missed: Math.max(0, s.missed - (amount >= c.contrib ? 1 : 0)) } : s,
              ),
            },
      ),
    );
    return later<Money>({ receipt, amount, at: TODAY });
  }, []);

  const joinGoal = useCallback(async (goalId: string, pledged: number) => {
    setParts((list) => {
      const exists = list.find((p) => p.goalId === goalId && p.memberId === JG_ME);
      if (exists) return list.map((p) => (p === exists ? { ...p, pledged, status: 'active' } : p));
      return [...list, { goalId, memberId: JG_ME, name: 'সাবিনা ইয়াসমিন', pledged, status: 'active', isMe: true }];
    });
    setGoals((list) => list.map((g) => (g.id === goalId && g.status === 'forming' ? { ...g, status: 'active' } : g)));
    await later(true);
  }, []);

  const contributeGoal = useCallback(async (goalId: string, amount: number, channel: JgContrib['channel']) => {
    const receipt = nextNo('JGR', contribs.length);
    const entry: JgContrib = {
      id: uid('jgc'),
      goalId,
      memberId: JG_ME,
      amount,
      at: TODAY,
      channel,
      receipt,
      txn: `TXN-${receipt}`,
      by: channel === 'collector' ? 'রাজু আহমেদ' : channel === 'office' ? 'কাউন্টার-২' : 'স্বয়ংক্রিয় যাচাই',
    };
    setContribs((list) => [entry, ...list]);
    return later<Money>({ receipt, amount, at: TODAY });
  }, [contribs.length]);

  const applyQard = useCallback(async (input: { amount: number; purpose: string; productId: string; tenure: number }) => {
    const app: QhApp = {
      id: uid('qa'),
      no: nextNo('QH-AP', applications.length),
      amount: input.amount,
      purpose: input.purpose,
      productId: input.productId,
      status: 'pending',
      submittedAt: TODAY,
    };
    setApplications((list) => [app, ...list]);
    return later(app);
  }, [applications.length]);

  const repayQard = useCallback(async (loanId: string, amount: number, channel: QhRepayment['channel']) => {
    const receipt = nextNo('QR', repayments.length);
    const loan = loans.find((l) => l.id === loanId);
    const before = outstanding(loans, repayments, loanId);
    const left = Math.max(0, before - amount);
    const entry: QhRepayment = {
      id: uid('qr'),
      loanId,
      receipt,
      at: TODAY,
      amount: Math.min(amount, before),
      inst: loan ? Math.min(loan.tenure, repayments.filter((r) => r.loanId === loanId).length + 1) : 1,
      channel,
    };
    setRepayments((list) => [...list, entry]);
    setLoans((list) =>
      list.map((l) =>
        l.id !== loanId
          ? l
          : left === 0
            ? { ...l, status: 'closed', closedAt: TODAY, certNo: `QH-CERT-${BN(l.principal)}`, certHash: '0x5d82af', nextDue: undefined }
            : { ...l, status: 'active', nextDue: '০৫ ডিসেম্বর ২০২৬' },
      ),
    );
    return later<Money>({ receipt, amount: entry.amount, at: TODAY });
  }, [loans, repayments]);

  const value = useMemo<ModuleContextValue>(
    () => ({
      circles, goals, parts, contribs, disbursements, products: SEED_PRODUCTS, applications, loans, repayments,
      circleById, goalById, loanById, drawById, payCircle, joinGoal, contributeGoal, applyQard, repayQard,
    }),
    [circles, goals, parts, contribs, disbursements, applications, loans, repayments, circleById, goalById, loanById, drawById, payCircle, joinGoal, contributeGoal, applyQard, repayQard],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useModules(): ModuleContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useModules শুধু <ModuleProvider> ভেতরে ব্যবহার করুন');
  return ctx;
}

/* পর্দার জন্য ছোট ডেরাইভেড হেল্পার */
export function useModuleStats() {
  const m = useModules();
  return useMemo(() => {
    const myCircles = m.circles.filter((c) => c.seatNo !== null || c.waitlistPos);
    const activeCircle = m.circles.find((c) => c.status === 'active');
    return {
      myCircles,
      activeCircle,
      circleContributed: myCircles.reduce((s, c) => s + (mySeat(c)?.contributed ?? 0), 0),
      circleReceived: myCircles.reduce((s, c) => s + myDraws(c).reduce((a, d) => a + d.amount, 0), 0),
      myGoals: m.goals.filter((g) => m.parts.some((p) => p.goalId === g.id && p.isMe)),
    };
  }, [m]);
}

export const perInst = perInstallment;
