/* ============================================================
   src/apps/member/screens/Transactions.tsx — M-08 লেনদেনের ইতিহাস (+ M-09 বিবরণ)
   ফিল্টার → তালিকা → নির্বাচিত লেনদেনের বিবরণ/রসিদ।
   ============================================================ */

import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Receipt, SlidersHorizontal } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { transactions, type DemoTxn } from '../../../demo/data';

const FILTERS = [
  { id: 'all', label: 'সব' },
  { id: 'deposit', label: 'জমা' },
  { id: 'withdraw', label: 'উত্তোলন' },
  { id: 'fine', label: 'ফি' },
] as const;

export default function Transactions() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [selected, setSelected] = useState<DemoTxn | null>(null);

  const rows = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((t) => t.kind === filter)),
    [filter],
  );

  const totalIn = transactions.filter((t) => t.kind === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.kind === 'withdraw').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-r-md bg-card border border-line p-3 shadow-sh-1">
          <div className="text-xs text-mut">মোট জমা</div>
          <div className="num text-h2 font-extrabold text-ok mt-0.5">৳{bn(totalIn)}</div>
        </div>
        <div className="rounded-r-md bg-card border border-line p-3 shadow-sh-1">
          <div className="text-xs text-mut">মোট উত্তোলন</div>
          <div className="num text-h2 font-extrabold text-danger mt-0.5">৳{bn(totalOut)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-mut shrink-0" />
        <div className="overflow-x-auto">
          <Chipset>
            {FILTERS.map((f) => (
              <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </Chip>
            ))}
          </Chipset>
        </div>
      </div>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
        {rows.map((t) => {
          const out = t.kind === 'withdraw';
          const Icon = out ? ArrowUpFromLine : ArrowDownToLine;
          const on = selected?.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(on ? null : t)}
              aria-expanded={on}
              className={`w-full min-h-tap flex items-center gap-3 px-4 py-3 text-left transition ${
                on ? 'bg-green-050' : 'hover:bg-green-050/60'
              }`}
            >
              <span
                className={`w-9 h-9 shrink-0 grid place-items-center rounded-r-pill ${
                  out ? 'bg-danger-bg text-danger-ink' : t.kind === 'fine' ? 'bg-warn-bg text-warn-ink' : 'bg-ok-bg text-ok-ink'
                }`}
              >
                <Icon size={17} />
              </span>
              <span className="grow min-w-0">
                <span className="block font-bold text-sm text-txt truncate">{t.title}</span>
                <span className="block text-xs text-mut">
                  {t.date} · {t.mode}
                </span>
              </span>
              <span className={`num font-bold text-sm ${out || t.kind === 'fine' ? 'text-danger' : 'text-ok'}`}>
                {out || t.kind === 'fine' ? '−' : '+'}৳{bn(t.amount)}
              </span>
            </button>
          );
        })}
        {rows.length === 0 ? <div className="px-4 py-8 text-center text-mut text-sm">এই ফিল্টারে কিছু নেই</div> : null}
      </div>

      {selected ? (
        <Card
          title="লেনদেনের বিবরণ"
          sub={`রসিদ ${selected.receipt}`}
          right={<Badge tone={selected.kind === 'withdraw' ? 'danger' : 'ok'}>{selected.kind === 'withdraw' ? 'উত্তোলন' : 'জমা'}</Badge>}
        >
          <dl className="text-sm divide-y divide-line-2">
            {[
              ['তারিখ', selected.date],
              ['বিবরণ', selected.title],
              ['অঙ্ক', `৳${bn(selected.amount)}`],
              ['মাধ্যম', selected.mode],
              ['রসিদ নম্বর', selected.receipt],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2">
                <dt className="text-mut">{k}</dt>
                <dd className="font-bold text-txt">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3">
            <Button variant="secondary" icon={<Receipt size={16} />} onClick={() => window.print()}>
              রসিদ দেখুন / প্রিন্ট
            </Button>
          </div>
        </Card>
      ) : (
        <p className="text-xs text-mut text-center">যেকোনো লেনদেনে চাপ দিলে রসিদ ও বিবরণ দেখাবে</p>
      )}
    </div>
  );
}
