/* ============================================================
   src/store/sessionStore.tsx — শেয়ার্ড সেশন (S-01…S-08)
   লগইন/OTP · সমিতি নির্বাচন · পছন্দ · অফলাইন কিউ — সব ডেমো, কিন্তু
   প্রতিটি কাজ আসল অবস্থা বদলায় (লগইন, সমিতি বদল, কিউ sync)।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Org = {
  id: string;
  name: string;
  reg: string;
  area: string;
  role: string;
  saving: number;
  lastUsed: string;
};

export type Prefs = {
  push: boolean;
  sms: boolean;
  email: boolean;
  quiet: boolean;
  digest: 'দৈনিক' | 'সাপ্তাহিক' | 'কখনো নয়';
  language: 'বাংলা' | 'English';
};

export type SyncItem = {
  id: string;
  kind: string;
  detail: string;
  amount: number;
  at: string;
  status: 'pending' | 'sending' | 'failed';
};

export const ORGS: Org[] = [
  { id: 'org1', name: 'কেশবপুর সমবায় সমিতি', reg: 'RSS-২৬২৭', area: 'কেশবপুর, খুলনা', role: 'MEMBER', saving: 84500, lastUsed: 'আজ' },
  { id: 'org2', name: 'দিগলিয়া কৃষক সমবায়', reg: 'RSS-২৭১৪', area: 'দিগলিয়া, খুলনা', role: 'MEMBER', saving: 21400, lastUsed: '১২ অক্টো' },
];

export const SEED_QUEUE: SyncItem[] = [
  { id: 'q1', kind: 'জমা', detail: 'RCP-১০২৫ · নগদ সংগ্রহ', amount: 1000, at: '৪২ মিনিট আগে', status: 'pending' },
  { id: 'q2', kind: 'জমা', detail: 'RCP-১০২৬ · নগদ সংগ্রহ', amount: 500, at: '২ ঘণ্টা আগে', status: 'pending' },
  { id: 'q3', kind: 'ROSCA কিস্তি', detail: 'RSS-চক্র-১১ · কিস্তি ৬', amount: 1000, at: '৫ ঘণ্টা আগে', status: 'failed' },
];

type SessionContextValue = {
  phone: string;
  otpSent: boolean;
  loggedIn: boolean;
  orgs: Org[];
  org: Org;
  inviteCode: string;
  inviteSent: boolean;
  prefs: Prefs;
  queue: SyncItem[];
  lastSync: string;
  sendOtp: (phone: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchOrg: (id: string) => void;
  updatePrefs: (patch: Partial<Prefs>) => void;
  sendInvite: (code: string) => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  clearFailed: () => void;
  syncAll: () => Promise<void>;
};

const Ctx = createContext<SessionContextValue | null>(null);
const later = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export function SessionProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState('১৭১১৪৫৬৭৮৯');
  const [otpSent, setOtpSent] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [orgId, setOrgId] = useState(ORGS[0].id);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ push: true, sms: true, email: false, quiet: true, digest: 'দৈনিক', language: 'বাংলা' });
  const [queue, setQueue] = useState<SyncItem[]>(SEED_QUEUE);
  const [lastSync, setLastSync] = useState('আজ সকাল ৯:৪২');

  const org = ORGS.find((o) => o.id === orgId) ?? ORGS[0];

  const sendOtp = useCallback(async (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 11) return { ok: false, error: 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)' };
    setPhone(value);
    setOtpSent(true);
    return later({ ok: true });
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return { ok: false, error: '৬ সংখ্যার OTP দিন' };
    if (/^0{6}$/.test(digits)) return { ok: false, error: 'OTP মেলেনি — আবার চেষ্টা করুন' };
    setLoggedIn(true);
    return later({ ok: true });
  }, []);

  const logout = useCallback(() => {
    setLoggedIn(false);
    setOtpSent(false);
  }, []);

  const switchOrg = useCallback((id: string) => setOrgId(id), []);
  const updatePrefs = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), []);

  const sendInvite = useCallback(async (code: string) => {
    setInviteCode(code);
    setInviteSent(true);
    await later(true);
  }, []);

  const retryItem = useCallback(async (id: string) => {
    setQueue((q) => q.map((i) => (i.id === id ? { ...i, status: 'sending' } : i)));
    await later(true, 400);
    setQueue((q) => q.filter((i) => i.id !== id));
    setLastSync('এইমাত্র');
  }, []);

  const clearFailed = useCallback(() => setQueue((q) => q.filter((i) => i.status !== 'failed')), []);

  const syncAll = useCallback(async () => {
    setQueue((q) => q.map((i) => ({ ...i, status: 'sending' })));
    await later(true, 500);
    setQueue([]);
    setLastSync('এইমাত্র');
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      phone, otpSent, loggedIn, orgs: ORGS, org, inviteCode, inviteSent, prefs, queue, lastSync,
      sendOtp, verifyOtp, logout, switchOrg, updatePrefs, sendInvite, retryItem, clearFailed, syncAll,
    }),
    [phone, otpSent, loggedIn, org, inviteCode, inviteSent, prefs, queue, lastSync, sendOtp, verifyOtp, logout, switchOrg, updatePrefs, sendInvite, retryItem, clearFailed, syncAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession শুধু <SessionProvider> ভেতরে ব্যবহার করুন');
  return ctx;
}
