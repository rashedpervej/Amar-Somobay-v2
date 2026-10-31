/* ============================================================
   src/apps/admin/screens/LedgerAdmin.tsx — AM-17 লেনদেন ব্যবস্থাপনা / সাধারণ লেজার
   ফিল্টার (ধরন/মাধ্যম/অবস্থা), ডেবিট-ক্রেডিট মিল, সারি → ফরেনসিক,
   এক্সপোর্ট (ডেমো ডাউনলোড)।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, Download, FileText, Filter, Search } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, Row, SectionHead } from '../../../components/ui';
import { inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountById, CHANNEL_LABEL, memberById, type Channel } from '../../../domain/admin';
import { Note } from './parts';

const KINDS = [
  { k: 'all', t: 'সব' }, { k: 'deposit', t: 'জমা' }, { k: 'withdrawal', t: 'উত্তোলন' },
  { k: 'fee', t: 'ফি' }, { k: 'adjust', t: 'সংশোধন' },
] as const;

export default function LedgerAdmin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAdmin();
  const [kind, setKind] = useState<(typeof KINDS)[number]['k']>('all');
  const [channel, setChannel] = useState<Channel | 'all'>('all');
  const [q, setQ] = useState('');
  const [onlyPosted, setOnlyPosted] = useState(false);
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.txns.filter((t) => {
      if (kind !== 'all' && t.type !== kind) return false;
      if (channel !== 'all' && t.channel !== channel) return false;
      if (onlyPosted && t.status !== 'posted') return false;
      if (!needle) return true;
      const m = memberById(state.members, t.memberId);
      return [t.no, t.reference, m?.name ?? '', m?.no ?? ''].some((v) => v.toLowerCase().includes(needle));
    });
  }, [state.txns, state.members, kind, channel, onlyPosted, q]);

  const debit = rows.filter((t) => t.type === 'withdrawal' || t.type === 'fee' || (t.type === 'adjust' && t.amount < 0)).reduce((s, t) => s + Math.abs(t.amount), 0);
  const credit = rows.filter((t) => t.type === 'deposit' || (t.type === 'adjust' && t.amount > 0)).reduce((s, t) => s + Math.abs(t.amount), 0);

  function exportDemo() {
    const text = ['নম্বর,তারিখ,সদস্য,ধরন,অঙ্ক,মাধ্যম,অবস্থা',
      ...rows.map((t) => [t.no, t.date, memberById(state.members, t.memberId)?.name ?? '', t.type, t.amount, t.channel, t.status].join(','))].join('\n');
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'somobay-ledger-demo.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-2">
        <div className="grow">
          <h2 className="text-h2 text-txt">সাধারণ লেজার</h2>
          <p className="text-sm text-mut">{bn(state.txns.length)}টি এন্ট্রি · অক্টোবর ২০২৬</p>
        </div>
        <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={exportDemo}>এক্সপোর্ট</Button>
      </div>

      <KpiGrid>
        <Kpi label="মোট জমা (ক্রেডিট)" value={`৳${bn(credit)}`} tone="ok" />
        <Kpi label="মোট উত্তোলন (ডেবিট)" value={`৳${bn(debit)}`} tone="danger" />
        <Kpi label="দেখানো হচ্ছে" value={bn(rows.length)} unit="টি" />
        <Kpi label="পার্থক্য" value={`৳${bn(Math.abs(credit - debit))}`} note="ডেবিট = ক্রেডিট নিয়ন্ত্রণ" />
      </KpiGrid>

      <Card>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নম্বর, রেফারেন্স বা সদস্য" className={inputClass() + ' grow'} />
          <Button size="sm" icon={<Search size={15} />} onClick={() => setQ(q.trim())}>খুঁজুন</Button>
        </div>
        <Chipset>
          {KINDS.map((k) => <Chip key={k.k} active={kind === k.k} onClick={() => setKind(k.k)}>{k.t}</Chip>)}
          <Chip active={onlyPosted} onClick={() => setOnlyPosted((v) => !v)}>শুধু পোস্টেড</Chip>
        </Chipset>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(['all', 'cash', 'bkash', 'nagad', 'bank'] as const).map((c) => (
            <button key={c} type="button" onClick={() => setChannel(c)}
              className={`min-h-tap px-2.5 rounded-r-pill border text-xs font-bold ${channel === c ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>
              {c === 'all' ? 'সব মাধ্যম' : CHANNEL_LABEL[c]}
            </button>
          ))}
        </div>
      </Card>

      <SectionHead title="এন্ট্রি" sub={`${bn(rows.length)}টি · ট্যাপ করলে ফরেনসিক`}
        right={<Button size="sm" variant="ghost" icon={<Filter size={14} />} onClick={() => { setKind('all'); setChannel('all'); setOnlyPosted(false); setQ(''); }}>রিসেট</Button>} />

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {rows.length === 0 ? <div className="px-4 py-10 text-center text-sm text-mut">কোনো এন্ট্রি মেলে না</div> : null}
        {rows.map((t) => {
          const m = memberById(state.members, t.memberId);
          const acc = accountById(state.accounts, t.accId);
          const creditTxn = t.type === 'deposit' || (t.type === 'adjust' && t.amount > 0);
          return (
            <Row key={t.id} icon={creditTxn ? <Banknote size={16} /> : <FileText size={16} />}
              title={`${m?.name ?? '—'} · ${acc?.no ?? ''}`}
              sub={`${t.no} · ${t.date} · ${CHANNEL_LABEL[t.channel]} · ${t.status === 'posted' ? 'পোস্টেড' : t.status === 'reversed' ? 'রিভার্সড' : 'ঝুলন্ত'}`}
              right={<span className={`num font-bold ${creditTxn ? 'text-ok' : 'text-danger-ink'}`}>{creditTxn ? '+' : '−'}৳{bn(Math.abs(t.amount))}</span>}
              onClick={() => navigate(`/a/txn/${t.id}${roleQS}`)} />
          );
        })}
      </div>

      <Note tone="info"><b>প্রতিটি সারি ফরেনসিক বিবরণে যায়</b> — কে, কখন, কোন ডিভাইস/IP/GPS থেকে এন্ট্রি করেছেন তা সংরক্ষিত।</Note>
      <Note tone="warn"><b>বড় এক্সপোর্ট ব্যাকগ্রাউন্ডে</b> — ডেমো ফাইলে শুধু বর্তমান ফিল্টারের সারি যায়; প্রোডাকশনে জব কিউ ব্যবহৃত হবে।</Note>

      <div className="flex gap-2">
        <Button className="grow" variant="secondary" icon={<Download size={15} />} onClick={exportDemo}>CSV ডাউনলোড</Button>
        <Button className="grow" onClick={() => navigate(`/a/cashbook${roleQS}`)}>দিনশেষ ক্যাশ</Button>
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-mut"><Badge tone="neutral">ডেমো</Badge> ডেবিট = ক্রেডিট (BR-12) · লকড পিরিয়ডে এন্ট্রি বদলানো যায় না</div>
    </div>
  );
}
