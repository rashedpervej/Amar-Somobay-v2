/* ============================================================
   src/apps/admin/screens/parts.tsx — অ্যাডমিন মোবাইল পর্দার ছোট উপকরণ
   প্রোটোটাইপের .kv / .stp3 / গ্রেডিয়েন্ট হিরো-কার্ড / স্টিকি বার।
   ============================================================ */

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

export function KV({ k, v, strong }: { k: ReactNode; v: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2 border-b border-line-2 last:border-b-0 ${strong ? 'font-bold' : ''}`}>
      <span className="text-sm text-mut">{k}</span>
      <span className={`text-sm text-right ${strong ? 'font-extrabold text-txt' : 'font-bold text-txt'}`}>{v}</span>
    </div>
  );
}

export function Stepper({ steps, cur }: { steps: string[]; cur: number }) {
  return (
    <ol className="flex items-start gap-1.5">
      {steps.map((s, i) => (
        <li key={s} className="grow min-w-0">
          <div className={`h-1.5 rounded-r-pill ${i < cur ? 'bg-green-700' : i === cur ? 'bg-green-500' : 'bg-line-2'}`} />
          <div className={`mt-1.5 text-xs leading-tight ${i === cur ? 'font-extrabold text-green-800' : i < cur ? 'font-bold text-green-700' : 'text-mut'}`}>
            {i < cur ? <Check size={12} className="inline -mt-0.5 mr-0.5" /> : null}
            {s}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Hero({ label, amount, sub, chips, children }: {
  label: ReactNode; amount: ReactNode; sub?: ReactNode; chips?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="rounded-r-md bg-gradient-to-br from-green-800 to-green-700 text-white px-4 py-4 shadow-sh-2">
      <div className="text-xs text-green-100">{label}</div>
      <div className="num text-[32px] font-extrabold leading-tight mt-0.5">{amount}</div>
      {sub ? <div className="text-xs text-green-100">{sub}</div> : null}
      {chips ? <div className="flex flex-wrap gap-1.5 mt-3">{chips}</div> : null}
      {children}
    </div>
  );
}

export function HeroChip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center min-h-7 px-2.5 rounded-r-pill border border-white/30 bg-white/15 text-xs font-bold">{children}</span>;
}

export function SubCard({ children }: { children: ReactNode }) {
  return <div className="rounded-r-md border border-line bg-card shadow-sh-1 overflow-hidden">{children}</div>;
}

export function StackedCard({ tone = '', head, children, foot }: {
  tone?: '' | 'warn' | 'bad' | 'ok'; head?: ReactNode; children?: ReactNode; foot?: ReactNode;
}) {
  const border = tone === 'bad' ? 'border-danger-bd' : tone === 'warn' ? 'border-warn-bd' : tone === 'ok' ? 'border-ok-bd' : 'border-line';
  return (
    <div className={`rounded-r-md border ${border} bg-card shadow-sh-1 overflow-hidden mb-3`}>
      {head}
      {children ? <div className="px-4 py-2">{children}</div> : null}
      {foot ? <div className="px-4 py-2.5 bg-card-2 border-t border-line-2 flex gap-2">{foot}</div> : null}
    </div>
  );
}

export function StackHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 pt-3.5 pb-2.5">
      <div className="grow min-w-0">
        <div className="font-extrabold text-body text-txt">{title}</div>
        {sub ? <div className="text-xs text-mut mt-0.5">{sub}</div> : null}
        {right}
      </div>
    </div>
  );
}

export function Note({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger' | 'ok'; children: ReactNode }) {
  const cls = {
    info: 'bg-info-bg border-info-bd text-info-ink',
    warn: 'bg-warn-bg border-warn-bd text-warn-ink',
    danger: 'bg-danger-bg border-danger-bd text-danger-ink',
    ok: 'bg-ok-bg border-ok-bd text-ok-ink',
  }[tone];
  return <div className={`rounded-r-sm border px-3 py-2.5 text-sm leading-relaxed ${cls}`}>{children}</div>;
}
