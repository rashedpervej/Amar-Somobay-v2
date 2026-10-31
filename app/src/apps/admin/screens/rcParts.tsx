/* ============================================================
   src/apps/admin/screens/rcParts.tsx — RAM / JAM পর্দার ছোট উপকরণ
   ROSCA সবুজ হিরো · যৌথ লক্ষ্য বেগুনি হিরো · অ্যামাউন্ট/সিট চিপ।
   ============================================================ */

import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bn } from '../../../lib/bn';

/** টাকার অঙ্ক — বাংলা অঙ্কে, সহস্র বিভাজন ছাড়া (প্রোটোটাইপের tk()) */
export const tk = (n: number) => `৳${bn(n)}`;

export const useRoleQS = () => {
  const [params] = useSearchParams();
  const role = params.get('role');
  return role ? `?role=${role}` : '';
};

export function RcHero({ label, amount, sub, children }: {
  label: ReactNode; amount: ReactNode; sub?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="rounded-r-md bg-gradient-to-br from-green-800 to-green-700 text-white px-4 py-4 shadow-sh-2">
      <div className="text-xs text-green-100">{label}</div>
      <div className="num text-[30px] font-extrabold leading-tight mt-0.5">{amount}</div>
      {sub ? <div className="text-xs text-green-100">{sub}</div> : null}
      {children}
    </div>
  );
}

export function JrHero({ label, amount, sub, children }: {
  label: ReactNode; amount: ReactNode; sub?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="rounded-r-md bg-gradient-to-br from-purple-ink to-purple text-white px-4 py-4 shadow-sh-2">
      <div className="text-xs text-purple-bd">{label}</div>
      <div className="num text-[30px] font-extrabold leading-tight mt-0.5">{amount}</div>
      {sub ? <div className="text-xs text-purple-bd">{sub}</div> : null}
      {children}
    </div>
  );
}

export function SplitRow({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-2 last:border-b-0 py-1.5">
      <span className="text-xs text-green-100">{k}</span>
      <span className="text-sm font-extrabold num">{v}</span>
    </div>
  );
}

export function PoolRow({ label, value, tone = '' }: { label: ReactNode; value: ReactNode; tone?: '' | 'ok' | 'bad' | 'warn' }) {
  const cls = tone === 'ok' ? 'bg-ok-bg border-ok-bd text-ok-ink'
    : tone === 'bad' ? 'bg-danger-bg border-danger-bd text-danger-ink'
      : tone === 'warn' ? 'bg-warn-bg border-warn-bd text-warn-ink' : 'bg-card-2 border-line text-txt';
  return (
    <div className={`flex items-center justify-between gap-3 rounded-r-sm border ${cls} px-3 py-2`}>
      <span className="text-xs font-bold">{label}</span>
      <b className="text-sm num">{value}</b>
    </div>
  );
}

export function Bar({ pct, tone = 'ok' }: { pct: number; tone?: 'ok' | 'warn' | 'danger' }) {
  const fill = tone === 'warn' ? 'bg-warn' : tone === 'danger' ? 'bg-danger' : 'bg-green-600';
  return (
    <div className="h-2 rounded-r-pill bg-line-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function Ladder({ steps, active }: { steps: { key: string; label: string; note?: string }[]; active: string }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const on = s.key === active;
        const idx = steps.findIndex((x) => x.key === active);
        const done = i < idx;
        return (
          <li key={s.key} className={`flex items-start gap-2.5 rounded-r-sm border px-3 py-2 ${on ? 'border-warn-bd bg-warn-bg' : done ? 'border-ok-bd bg-ok-bg' : 'border-line bg-card'}`}>
            <span className={`w-6 h-6 shrink-0 grid place-items-center rounded-r-pill text-xs font-extrabold num ${on ? 'bg-warn text-white' : done ? 'bg-ok text-white' : 'bg-line-2 text-mut'}`}>{i + 1}</span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-txt">{s.label}</div>
              {s.note ? <div className="text-xs text-mut">{s.note}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
