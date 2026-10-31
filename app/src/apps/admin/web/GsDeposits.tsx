import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL } from '../../../domain/admin';
import { Chips, Note, Page, StatBar } from './webParts';
import { gsAccount, gsMemberName } from './gsParts';

export default function GsDeposits() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [ch, setCh] = useState('all');
  const rows = state.txns.filter((t) => t.type === 'deposit' && (ch === 'all' || t.channel === ch)
    && (q.trim() === '' || `${t.no} ${gsMemberName(state.members, t.memberId)} ${t.reference}`.includes(q.trim())));
  const total = rows.reduce((n, t) => n + t.amount, 0);

  return (
    <Page title="জমা রেকর্ড" sub="সব জমা এন্ট্রি · প্রমাণ ও রেফারেন্স · কোনো সুদ নেই" back="/w/dashboard"
      right={<Button icon={<Plus size={15} />} onClick={() => nav('/w/deposits/new')}>নতুন জমা</Button>}>
      <StatBar items={[
        { k: 'দেখানো জমা', v: bn(rows.length) },
        { k: 'মোট অঙ্ক', v: `৳${bn(total)}` },
        { k: 'অনুমোদন বাকি', v: bn(state.approvals.filter((a) => a.kind === 'deposit').length), tone: 'warn' },
        { k: 'আজকের জমা', v: `৳${bn(state.cashDays[0].channels.cash + state.cashDays[0].channels.bkash + state.cashDays[0].channels.nagad + state.cashDays[0].channels.bank)}` },
      ]} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="রেফারেন্স / সদস্য" className={`${inputCls} mt-1`} /></label>
        <div><span className="text-xs font-bold text-mut block mb-1">মাধ্যম</span>
          <Chips value={ch} onChange={setCh} items={[['all', 'সব'], ...Object.entries(CHANNEL_LABEL).map(([k, v]) => [k, v] as [string, string])]} /></div>
      </div>
      <Card title="জমা তালিকা" sub={`${bn(rows.length)}টি`}>
        <DataTable
          columns={[
            { key: 'no', head: 'লেনদেন', render: (t) => <b className="num">{t.no}</b> },
            { key: 'date', head: 'তারিখ', render: (t) => t.date },
            { key: 'member', head: 'সদস্য', render: (t) => gsMemberName(state.members, t.memberId) },
            { key: 'acc', head: 'হিসাব', render: (t) => gsAccount(state.accounts, t.accId)?.no ?? '—' },
            { key: 'amount', head: 'অঙ্ক', align: 'right', render: (t) => <b className="num">৳{bn(t.amount)}</b> },
            { key: 'ch', head: 'মাধ্যম', render: (t) => CHANNEL_LABEL[t.channel] },
            { key: 'ref', head: 'রেফারেন্স', render: (t) => <span className="num text-xs">{t.reference}</span> },
            { key: 'st', head: 'অবস্থা', render: (t) => <Badge tone={t.status === 'posted' ? 'ok' : t.status === 'reversed' ? 'danger' : 'warn'}>{t.status === 'posted' ? 'পোস্টেড' : t.status === 'reversed' ? 'রিভার্সড' : 'অপেক্ষমাণ'}</Badge> },
            { key: 'act', head: '', align: 'right', render: (t) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/ledger?txn=${t.id}`)}>বিস্তারিত</Button> },
          ]}
          rows={rows}
          empty="কোনো জমা নেই"
        />
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Note>জমা পোস্ট হলে রসিদ তৈরি হয়; রসিদ নম্বর ছাড়া নগদ গ্রহণ নয়।</Note>
        <Note tone="warn">ফি/বিলম্ব চার্জ আলাদা খাতে; কোনো সুদ বা মুনাফা যোগ হয় না (D-01)।</Note>
      </div>
    </Page>
  );
}
