/* ============================================================
   web/qhParts.tsx — অ্যাডমিন ওয়েবের কর্জে হাসানা উপকরণ (ডেস্কটপ)
   কর্জে হাসানা সবুজ+সোনালি · সুদ শূন্য · ৪-স্তরের নিয়ম।
   ============================================================ */

import type { ReactNode } from 'react';
import { Check, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { SEED_MEMBERS } from '../../../domain/admin';
import { QH_SEV, type SevKey } from '../../../domain/adminQard';

export const memName = (id: string) => SEED_MEMBERS.find((m) => m.id === id)?.name ?? id;

export function QhHero({ label, amount, sub, children }: { label: ReactNode; amount: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-r-md bg-gradient-to-br from-green-800 to-green-700 text-white px-5 py-4 shadow-sh-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-green-100">{label}</div>
          <div className="num text-[32px] font-extrabold leading-tight mt-0.5">{amount}</div>
          {sub ? <div className="text-xs text-green-100">{sub}</div> : null}
        </div>
        <span className="inline-flex items-center gap-1 rounded-r-pill border border-qh-gold-hi/70 bg-qh-gold/20 px-2.5 py-1 text-[11px] font-bold text-qh-gold-soft shrink-0">
          <ShieldCheck size={12} /> সুদ শূন্য · ফি নেই
        </span>
      </div>
      {children}
    </div>
  );
}

export function QhZero({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-r-pill border px-2.5 py-1 text-[11px] font-extrabold ${
      dark ? 'border-qh-gold-hi/60 bg-white/10 text-qh-gold-soft' : 'border-qh-gold-bd bg-qh-gold-soft text-qh-gold-ink'
    }`}>
      <ShieldCheck size={11} /> সুদ শূন্য · ফি নেই
    </span>
  );
}

export function QhLayerRow({ no, title, sub, value, note }: {
  no: number; title: ReactNode; sub?: ReactNode; value: SevKey; note?: ReactNode;
}) {
  const icon = value === 'pass' ? <Check size={14} /> : value === 'block' ? <Lock size={14} /> : <TriangleAlert size={14} />;
  const pt = value === 'pass' ? 'bg-ok-bg text-ok-ink' : value === 'block' ? 'bg-danger-bg text-danger-ink' : 'bg-warn-bg text-warn-ink';
  return (
    <div className="flex items-start gap-3 rounded-r-sm border border-line bg-card px-4 py-3">
      <span className={`shrink-0 size-7 rounded-r-pill grid place-items-center text-xs font-extrabold ${pt}`}>{no}</span>
      <div className="grow min-w-0">
        <div className="text-sm font-extrabold leading-snug">{title}</div>
        {sub ? <div className="text-xs text-mut mt-0.5">{sub}</div> : null}
        {note ? <div className="text-xs text-mut mt-1 leading-relaxed">{note}</div> : null}
      </div>
      <Badge tone={value === 'pass' ? 'ok' : value === 'block' ? 'danger' : 'warn'}>{icon} {QH_SEV[value].t}</Badge>
    </div>
  );
}

export function QhCallout({ title, children, tone = 'warn' }: { title: ReactNode; children?: ReactNode; tone?: 'warn' | 'danger' | 'ok' | 'info' }) {
  const cls = {
    warn: 'bg-warn-bg border-warn-bd text-warn-ink',
    danger: 'bg-danger-bg border-danger-bd text-danger-ink',
    ok: 'bg-ok-bg border-ok-bd text-ok-ink',
    info: 'bg-info-bg border-info-bd text-info-ink',
  }[tone];
  return (
    <div className={`rounded-r-sm border px-4 py-3 ${cls}`}>
      <div className="text-sm font-bold">{title}</div>
      {children ? <div className="text-xs mt-1 leading-relaxed opacity-90">{children}</div> : null}
    </div>
  );
}
