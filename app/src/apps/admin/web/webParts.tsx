/* ============================================================
   webParts.tsx — অ্যাডমিন ওয়েবের ডেস্কটপ উপাদান
   মোবাইলের রেসপন্সিভ কপি নয়: বাঁ-ডান দুই-কলাম, ঘন টেবিল, অ্যাকশন-রেল।
   ডিজাইন টোকেন হুবহু প্রোটোটাইপের (d03)।
   ============================================================ */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';

export function Page({
  title, sub, right, children, back,
}: { title: string; sub?: ReactNode; right?: ReactNode; children: ReactNode; back?: string }) {
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grow min-w-0">
          <div className="flex items-center gap-2">
            {back && (
              <button type="button" onClick={() => nav(back)} className="min-h-10 inline-flex items-center gap-1 text-sm font-bold text-mut hover:text-txt">
                <ArrowLeft size={15} /> ফিরে
              </button>
            )}
            <h1 className="text-h1 text-txt truncate">{title}</h1>
          </div>
          {sub && <p className="text-sm text-mut mt-1">{sub}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">{right}</div>
      </div>
      {children}
    </div>
  );
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'ok' }) {
  const toneCls = {
    info: 'border-info-bd bg-info-bg text-info-ink',
    warn: 'border-warn-bd bg-warn-bg text-warn-ink',
    ok: 'border-ok-bd bg-ok-bg text-ok-ink',
  }[tone];
  return (
    <div className={`flex items-start gap-2 rounded-r-sm border px-3 py-2.5 text-sm ${toneCls}`}>
      <Info size={16} className="shrink-0 mt-0.5" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Chips({ items, value, onChange }: { items: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map(([k, t]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={`min-h-10 px-3 rounded-r-pill border text-xs font-bold transition ${
            value === k ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3 hover:bg-green-050'
          }`}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function Go({ to, children, variant = 'secondary', icon }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'; icon?: ReactNode }) {
  const nav = useNavigate();
  return <Button size="sm" variant={variant} icon={icon ?? <ArrowRight size={14} />} onClick={() => nav(to)}>{children}</Button>;
}

export function Money({ v }: { v: number }) {
  return <span className="num font-bold">৳{bn(v)}</span>;
}

export function Rail({ children, title = 'দ্রুত কাজ' }: { children: ReactNode; title?: string }) {
  return (
    <Card title={title} sub="সরাসরি কার্যকরী" className="h-fit">
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

export function Desk({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">{children}</div>;
}

export function Box({ title, sub, right, children }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return <Card title={title} sub={sub} right={right}>{children}</Card>;
}

export function StatBar({ items }: { items: { k: string; v: ReactNode; tone?: 'ok' | 'warn' | 'danger' | 'neutral' }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded-r-md overflow-hidden">
      {items.map((it) => (
        <div key={it.k} className="bg-card px-4 py-3">
          <div className="text-xs font-bold text-mut">{it.k}</div>
          <div className={`num text-h2 mt-1 font-extrabold ${it.tone === 'warn' ? 'text-warn-ink' : it.tone === 'danger' ? 'text-danger-ink' : it.tone === 'ok' ? 'text-ok-ink' : 'text-txt'}`}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

export function Tone({ t, tone = 'neutral' }: { t: ReactNode; tone?: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'purple' }) {
  return <Badge tone={tone}>{t}</Badge>;
}

export const cardCls = 'bg-card border border-line rounded-r-md shadow-sh-2';
export const thCls = 'px-3 py-2.5 text-xs font-bold text-mut border-b border-line whitespace-nowrap';
export const tdCls = 'px-3 py-2.5 border-b border-line-2 text-sm';
