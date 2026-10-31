/* ============================================================
   src/apps/member/screens/Withdrawals.tsx — M-11 আমার উত্তোলন আবেদনের তালিকা
   সব আবেদন, অবস্থা-ভিত্তিক ফিল্টার, প্রতিটি সারি → M-12 বিস্তারিত।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { EmptyState, StatusChip } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

const FILTERS = [
  { id: 'all', label: 'সব' },
  { id: 'pending', label: 'অপেক্ষমাণ' },
  { id: 'paid', label: 'পরিশোধিত' },
  { id: 'rejected', label: 'প্রত্যাখ্যাত' },
] as const;

export default function Withdrawals() {
  const { state, balance } = useMember();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const list = useMemo(
    () => (filter === 'all' ? state.withdrawals : state.withdrawals.filter((w) => w.status === filter)),
    [filter, state.withdrawals],
  );

  const pendingTotal = state.withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-r-md bg-card border border-line p-4 shadow-sh-1 flex items-center gap-3">
        <div className="grow">
          <div className="text-xs text-mut">উপলব্ধ ব্যালান্স</div>
          <div className="num text-h2 font-extrabold text-txt">৳{bn(balance)}</div>
          {pendingTotal > 0 ? (
            <div className="text-xs text-warn-ink mt-1">অপেক্ষমাণ আবেদন ৳{bn(pendingTotal)}</div>
          ) : null}
        </div>
        <Button size="sm" icon={<Plus size={15} />} onClick={() => navigate('/m/withdrawals/new')}>
          নতুন
        </Button>
      </div>

      <Chipset>
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </Chipset>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
        {list.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => navigate(`/m/withdrawals/${w.id}`)}
            className="w-full min-h-tap px-4 py-3 flex items-center gap-3 text-left hover:bg-green-050/60 transition"
          >
            <div className="grow min-w-0">
              <div className="font-bold text-sm text-txt truncate">{w.reason}</div>
              <div className="text-xs text-mut">
                {w.date} · {w.reference} · {w.mode}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="num font-bold text-sm text-danger">৳{bn(w.amount)}</div>
              <StatusChip status={w.status === 'approved' ? 'approved' : w.status} />
            </div>
          </button>
        ))}
        {list.length === 0 ? (
          <EmptyState
            title="কোনো আবেদন নেই"
            sub="নতুন উত্তোলনের আবেদন দিলে এখানে দেখা যাবে"
            action={<Button size="sm" onClick={() => navigate('/m/withdrawals/new')}>আবেদন করুন</Button>}
          />
        ) : null}
      </div>

      <Card title="প্রক্রিয়া কীভাবে চলে" right={<Badge tone="info">৪ ধাপ</Badge>}>
        <ol className="pl-5 text-sm text-txt-2 space-y-1">
          <li>আবেদন জমা</li>
          <li>যাচাই (তথ্য ও ব্যালান্স)</li>
          <li>অনুমোদন (কমিটি)</li>
          <li>বিতরণ (ব্যাংক/বিকাশ/নগদ)</li>
        </ol>
      </Card>
    </div>
  );
}
