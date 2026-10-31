/* ============================================================
   src/apps/admin/screens/qhParts.tsx — QAM পর্দার ছোট উপকরণ
   কর্জে হাসানা সবুজ+সোনালি · সুদ শূন্য ব্যাজ · ৪ স্তরের নিয়ম · কারণ-কার্ড।
   ============================================================ */

import type { ReactNode } from 'react';
import { Check, Heart, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { QH_SEV, type SevKey, type Tone } from '../../../domain/adminQard';

export function QhHero({ label, amount, sub, children }: {
  label: ReactNode; amount: ReactNode; sub?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="rounded-r-md bg-gradient-to-br from-green-800 to-green-700 text-white px-4 py-4 shadow-sh-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-green-100">{label}</div>
        <span className="inline-flex items-center gap-1 rounded-r-pill border border-qh-gold-hi/70 bg-qh-gold/20 px-2 py-0.5 text-[11px] font-bold text-qh-gold-soft">
          <Heart size={11} /> সুদমুক্ত
        </span>
      </div>
      <div className="num text-[30px] font-extrabold leading-tight mt-0.5">{amount}</div>
      {sub ? <div className="text-xs text-green-100">{sub}</div> : null}
      {children}
    </div>
  );
}

export function QhZero({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-r-pill border px-2 py-0.5 text-[11px] font-extrabold ${
      dark ? 'border-qh-gold-hi/60 bg-white/10 text-qh-gold-soft' : 'border-qh-gold-bd bg-qh-gold-soft text-qh-gold-ink'
    }`}>
      <ShieldCheck size={11} /> সুদ শূন্য · ফি নেই
    </span>
  );
}

/** ৪ স্তরের নিয়মের সারি — পাস/সতর্কতা/ব্লক */
export function QhLayer({ no, title, sub, value, note }: {
  no: number; title: ReactNode; sub?: ReactNode; value: SevKey; note?: ReactNode;
}) {
  const icon = value === 'pass' ? <Check size={14} /> : value === 'block' ? <Lock size={14} /> : <TriangleAlert size={14} />;
  const pt = value === 'pass' ? 'bg-ok-bg text-ok-ink' : value === 'block' ? 'bg-danger-bg text-danger-ink' : 'bg-warn-bg text-warn-ink';
  return (
    <div className="flex items-start gap-2.5 rounded-r-sm border border-line bg-card px-3 py-2.5">
      <span className={`shrink-0 size-7 rounded-r-pill grid place-items-center text-xs font-extrabold ${pt}`}>{no}</span>
      <div className="grow min-w-0">
        <div className="text-sm font-extrabold leading-snug">{title}</div>
        {sub ? <div className="text-xs text-mut mt-0.5">{sub}</div> : null}
        {note ? <div className="text-xs text-mut mt-1 leading-relaxed">{note}</div> : null}
      </div>
      <Badge tone={QH_SEV[value].tone as Tone}>{icon} {QH_SEV[value].t}</Badge>
    </div>
  );
}

export function QhReason({ code, title, warn, fix }: { code: string; title: ReactNode; warn?: boolean; fix?: ReactNode }) {
  return (
    <div className={`rounded-r-sm border px-3 py-2.5 ${warn ? 'bg-warn-bg border-warn-bd' : 'bg-danger-bg border-danger-bd'}`}>
      <div className={`text-sm font-bold ${warn ? 'text-warn-ink' : 'text-danger-ink'}`}>
        {title} <code className="text-[11px] font-bold opacity-80">{code}</code>
      </div>
      {fix ? <div className="text-xs text-mut mt-1 leading-relaxed">{fix}</div> : null}
    </div>
  );
}

export function QhAmount({ value, sub, tone = '' }: { value: string; sub?: ReactNode; tone?: '' | 'ok' | 'warn' | 'bad' }) {
  const c = tone === 'bad' ? 'text-danger-ink' : tone === 'warn' ? 'text-warn-ink' : tone === 'ok' ? 'text-ok-ink' : 'text-txt';
  return (
    <div className="text-right shrink-0">
      <div className={`num text-body font-extrabold ${c}`}>{value}</div>
      {sub ? <div className="text-[11px] text-mut">{sub}</div> : null}
    </div>
  );
}

export const qhTone = (kind: 'ok' | 'warn' | 'danger' | 'info' | 'neutral'): Tone => kind;
