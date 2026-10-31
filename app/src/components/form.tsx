/* ============================================================
   src/components/form.tsx — ফর্মের সাধারণ উপকরণ (মোবাইল-প্রথম)
   সব মান টোকেন থেকে; কোনো কাঁচা hex নেই। ত্রুটি-বার্তা aria-সংযুক্ত।
   ============================================================ */

import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
}) {
  const id = `f-${label.replace(/[^ঀ-৿a-zA-Z0-9]/g, '').slice(0, 16)}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div className="s-field space-y-1.5">
      <label htmlFor={id} className="block text-txt-2">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      {children(id)}
      {hint && !error ? <p className="text-xs text-mut">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-danger font-bold flex items-center gap-1" role="alert">
          <AlertCircle size={13} /> {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputCls = 's-inp text-txt';

export function inputClass(error?: string) {
  return `${inputCls} ${error ? 'border-danger' : 'border-line-3'}`;
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-r-sm bg-danger-bg border border-danger-bd text-danger-ink px-3 py-2.5 text-sm font-bold flex items-start gap-2">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function SuccessBanner({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div role="status" className="rounded-r-md bg-ok-bg border border-ok-bd text-ok-ink px-4 py-3">
      <div className="font-bold flex items-center gap-2">
        <CheckCircle2 size={18} /> {title}
      </div>
      {children ? <div className="text-sm mt-1 opacity-90">{children}</div> : null}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
  sub,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line-2 last:border-b-0">
      <div className="grow min-w-0">
        <div className="font-bold text-sm text-txt">{label}</div>
        {(hint ?? sub) ? <div className="text-xs text-mut">{hint ?? sub}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-14 h-8 rounded-r-pill border-2 transition relative ${
          checked ? 'bg-green-700 border-green-800' : 'bg-line-2 border-line-3'
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-r-pill bg-white shadow-sh-1 transition-all ${
            checked ? 'left-7' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function StatusChip({
  status,
}: {
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'due' | 'overdue' | 'verified' | 'submitted' | 'open' | 'answered';
}) {
  const map = {
    pending: { t: 'অপেক্ষমাণ', c: 'bg-warn-bg text-warn-ink border-warn-bd' },
    approved: { t: 'অনুমোদিত', c: 'bg-ok-bg text-ok-ink border-ok-bd' },
    paid: { t: 'পরিশোধিত', c: 'bg-ok-bg text-ok-ink border-ok-bd' },
    rejected: { t: 'প্রত্যাখ্যাত', c: 'bg-danger-bg text-danger-ink border-danger-bd' },
    due: { t: 'নির্ধারিত', c: 'bg-info-bg text-info-ink border-info-bd' },
    overdue: { t: 'বকেয়া', c: 'bg-danger-bg text-danger-ink border-danger-bd' },
    verified: { t: 'যাচাইকৃত', c: 'bg-ok-bg text-ok-ink border-ok-bd' },
    submitted: { t: 'জমা হয়েছে', c: 'bg-info-bg text-info-ink border-info-bd' },
    open: { t: 'খোলা', c: 'bg-warn-bg text-warn-ink border-warn-bd' },
    answered: { t: 'উত্তর দেওয়া', c: 'bg-ok-bg text-ok-ink border-ok-bd' },
  }[status];
  return (
    <span className={`inline-flex items-center min-h-7 px-2.5 rounded-r-pill border text-xs font-bold ${map.c}`}>
      {map.t}
    </span>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-bold text-txt">{title}</p>
      {sub ? <p className="text-sm text-mut mt-1">{sub}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}
