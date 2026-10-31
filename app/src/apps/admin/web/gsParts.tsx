/* ============================================================
   web/gsParts.tsx — অ্যাডমিন ওয়েবের সাধারণ সঞ্চয় উপকরণ
   মোবাইল ব্যাচ ৪–৫-এর একই স্টোর/নিয়ম; শুধু ডেস্কটপ উপস্থাপনা।
   ============================================================ */

import type { ReactNode } from 'react';
import { Badge } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import type { AmAccount, AmMember, Channel, MemStatus } from '../../../domain/admin';
import { CHANNEL_LABEL } from '../../../domain/admin';

export const gsMember = (members: AmMember[], id?: string) => members.find((m) => m.id === id);
export const gsMemberName = (members: AmMember[], id?: string) => gsMember(members, id)?.name ?? id ?? '—';
export const gsAccount = (accounts: AmAccount[], id?: string) => accounts.find((a) => a.id === id);
export const gsAccountsOf = (accounts: AmAccount[], memberId?: string) => accounts.filter((a) => a.memberId === memberId);
export const gsDuesOf = <T extends { accId: string }>(dues: T[], accId: string) => dues.filter((d) => d.accId === accId);
export const gsDueLeft = (dues: { amount: number; paid: number }[]) => dues.reduce((n, d) => n + Math.max(0, d.amount - d.paid), 0);
export const gsChannel = (c: Channel | 'cash_office' | 'none') => c === 'cash_office' ? 'অফিস নগদ' : c === 'none' ? '—' : CHANNEL_LABEL[c];

export const MEMBER_STATUS: Record<MemStatus, { t: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' | 'info' }> = {
  active: { t: 'সক্রিয়', tone: 'ok' },
  dormant: { t: 'নিষ্ক্রিয়', tone: 'warn' },
  suspended: { t: 'বহিষ্কৃত', tone: 'danger' },
  exited: { t: 'প্রস্থান', tone: 'neutral' },
};

export function MemberStatus({ s }: { s: MemStatus }) {
  return <Badge tone={MEMBER_STATUS[s].tone}>{MEMBER_STATUS[s].t}</Badge>;
}

export function GsKpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'ok' | 'warn' | 'danger' }) {
  return (
    <div className="bg-card border border-line rounded-r-md px-4 py-3 shadow-sh-1">
      <div className="text-xs font-bold text-mut">{label}</div>
      <div className={`num text-h2 font-extrabold mt-1 ${tone === 'warn' ? 'text-warn-ink' : tone === 'danger' ? 'text-danger-ink' : tone === 'ok' ? 'text-ok-ink' : 'text-txt'}`}>{value}</div>
      {sub && <div className="text-xs text-mut mt-0.5">{sub}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-txt">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="block text-xs text-mut mt-1">{hint}</span>}
    </label>
  );
}

export function MemberSelect({
  members, value, onChange, label = 'সদস্য',
}: { members: AmMember[]; value: string; onChange: (id: string) => void; label?: string }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-tap rounded-r-sm border border-line-3 bg-card px-3 text-sm">
        <option value="">— বাছাই করুন —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name} · {m.no} · {m.mobile}</option>
        ))}
      </select>
    </Field>
  );
}

export function AccountSelect({
  accounts, members, value, onChange, label = 'অ্যাকাউন্ট',
}: { accounts: AmAccount[]; members: AmMember[]; value: string; onChange: (id: string) => void; label?: string }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-tap rounded-r-sm border border-line-3 bg-card px-3 text-sm">
        <option value="">— বাছাই করুন —</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.no} · {gsMemberName(members, a.memberId)} · {a.scheme}</option>
        ))}
      </select>
    </Field>
  );
}

export function Amount({ v, className = '' }: { v: number; className?: string }) {
  return <span className={`num font-bold ${className}`}>৳{bn(v)}</span>;
}

export function ProgressBar({ pct, tone = 'ok' }: { pct: number; tone?: 'ok' | 'warn' | 'danger' }) {
  const color = tone === 'danger' ? 'bg-danger' : tone === 'warn' ? 'bg-warn' : 'bg-green-600';
  return (
    <div className="h-1.5 rounded-r-pill bg-line-2 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export const todayISO = '2026-10-31';
