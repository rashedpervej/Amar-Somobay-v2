/* ============================================================
   src/apps/member/screens/Transactions.tsx — M-08 লেনদেনের ইতিহাস
   জমা (ক্রেডিট) ও উত্তোলন (ডেবিট) এক তালিকায়; ফিল্টার + সারাংশ;
   প্রতিটি সারি → M-09 স্বতন্ত্র বিবরণ/ডিজিটাল রসিদ।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from 'lucide-react';
import { Badge, Card, Chip, Chipset } from '../../../components/ui';
import { StatusChip } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

type Row = {
  id: string;
  kind: 'deposit' | 'withdraw';
  title: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'rejected';
  meta: string;
};

const FILTERS = [
  { id: 'all', label: 'সব' },
  { id: 'deposit', label: 'জমা' },
  { id: 'withdraw', label: 'উত্তোলন' },
  { id: 'pending', label: 'অপেক্ষমাণ' },
] as const;

export default function Transactions() {
  const { state } = useMember();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const rows = useMemo<Row[]>(() => {
    const deps: Row[] = state.deposits.map((d) => ({
      id: d.id,
      kind: 'deposit',
      title: `${d.mode} জমা`,
      date: d.date,
      amount: d.amount,
      status: 'paid',
      meta: d.receipt,
    }));
    const wds: Row[] = state.withdrawals.map((w) => ({
      id: w.id,
      kind: 'withdraw',
      title: w.reason,
      date: w.date,
      amount: w.amount,
      status: w.status === 'rejected' ? 'rejected' : w.status === 'pending' ? 'pending' : 'paid',
      meta: w.reference,
    }));
    const all = [...deps, ...wds];
    if (filter === 'deposit') return all.filter((r) => r.kind === 'deposit');
    if (filter === 'withdraw') return all.filter((r) => r.kind === 'withdraw');
    if (filter === 'pending') return all.filter((r) => r.status === 'pending');
    return all;
  }, [state.deposits, state.withdrawals, filter]);

  const totalIn = state.deposits.reduce((s, d) => s + d.amount, 0);
  const totalOut = state.withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amount, 0);

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
        {rows.map((r) => {
          const out = r.kind === 'withdraw';
          const Icon = out ? ArrowUpFromLine : ArrowDownToLine;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate(`/m/txn/${r.id}`)}
              className="w-full min-h-tap flex items-center gap-3 px-4 py-3 text-left hover:bg-green-050/60 transition"
            >
              <span
                className={`w-9 h-9 shrink-0 grid place-items-center rounded-r-pill ${
                  out ? 'bg-danger-bg text-danger-ink' : 'bg-ok-bg text-ok-ink'
                }`}
              >
                <Icon size={17} />
              </span>
              <span className="grow min-w-0">
                <span className="block font-bold text-sm text-txt truncate">{r.title}</span>
                <span className="block text-xs text-mut">
                  {r.date} · {r.meta}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className={`num block font-bold text-sm ${out ? 'text-danger' : 'text-ok'}`}>
                  {out ? '−' : '+'}৳{bn(r.amount)}
                </span>
                {r.status !== 'paid' ? <StatusChip status={r.status} /> : null}
              </span>
            </button>
          );
        })}
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-mut">এই ফিল্টারে কোনো লেনদেন নেই</div>
        ) : null}
      </div>

      <Card title="স্টেটমেন্ট ও রসিদ কেন্দ্র" sub="মাস অনুযায়ী ডাউনলোড ও রসিদ যাচাই" right={<Badge tone="brand">M-14</Badge>}>
        <button
          type="button"
          onClick={() => navigate('/m/statement')}
          className="w-full min-h-tap rounded-r-sm bg-green-050 border border-line-2 font-bold text-sm text-green-800"
        >
          স্টেটমেন্ট খুলুন
        </button>
      </Card>
    </div>
  );
}
