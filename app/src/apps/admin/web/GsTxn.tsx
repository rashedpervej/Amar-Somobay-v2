/* A-26 · লেনদেন বিবরণ (ফরেনসিক) ও অডিট ট্রেইল */
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL } from '../../../domain/admin';
import { Chips, Note, Page } from './webParts';
import { gsAccount, gsMemberName } from './gsParts';

export default function GsTxn() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const { txnId } = useParams();
  const [qs] = useSearchParams();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const rows = state.txns.filter((t) => (type === 'all' || t.type === type)
    && (q.trim() === '' || `${t.no} ${t.reference} ${gsMemberName(state.members, t.memberId)}`.includes(q.trim())));
  const sel = state.txns.find((t) => t.id === txnId || t.no === qs.get('txn')) ?? rows[0] ?? state.txns[0];

  return (
    <Page title="লেনদেন ও অডিট" sub="প্রতিটি এন্ট্রি অপরিবর্তনীয় · কে, কখন, কোথা থেকে · ডেমো" back="/w/ledger"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/ledger')}>খতিয়ান</Button>}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="TXN / রসিদ / সদস্য" className={`${inputCls} mt-1`} /></label>
        <div><span className="text-xs font-bold text-mut block mb-1">ধরন</span>
          <Chips value={type} onChange={setType} items={[['all', 'সব'], ['deposit', 'জমা'], ['withdrawal', 'উত্তোলন'], ['fee', 'ফি'], ['adjust', 'সমন্বয়']]} /></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card title="লেনদেন তালিকা" sub={`${bn(rows.length)}টি এন্ট্রি`}>
          <DataTable
            columns={[
              { key: 'no', head: 'নম্বর', render: (t) => <b className="num">{t.no}</b> },
              { key: 'date', head: 'তারিখ', render: (t) => t.date },
              { key: 'member', head: 'সদস্য', render: (t) => gsMemberName(state.members, t.memberId) },
              { key: 'type', head: 'ধরন', render: (t) => t.type === 'deposit' ? 'জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type === 'fee' ? 'ফি' : 'সমন্বয়' },
              { key: 'amt', head: 'অঙ্ক', align: 'right', render: (t) => <b className="num">৳{bn(t.amount)}</b> },
              { key: 'st', head: 'অবস্থা', render: (t) => <Badge tone={t.status === 'posted' ? 'ok' : t.status === 'reversed' ? 'danger' : 'warn'}>{t.status === 'posted' ? 'পোস্টেড' : t.status === 'reversed' ? 'রিভার্সড' : 'অপেক্ষমাণ'}</Badge> },
              { key: 'act', head: '', align: 'right', render: (t) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/txn/${t.id}`)}>ফরেনসিক</Button> },
            ]}
            rows={rows}
            empty="কোনো লেনদেন নেই"
          />
        </Card>

        {sel && (
          <div className="space-y-3">
            <Card title={sel.no} sub={`${sel.date} · ${gsMemberName(state.members, sel.memberId)} · ডেমো`}
              right={<Badge tone={sel.status === 'posted' ? 'ok' : sel.status === 'reversed' ? 'danger' : 'warn'}>{sel.status === 'posted' ? 'পোস্টেড' : sel.status === 'reversed' ? 'রিভার্সড' : 'অপেক্ষমাণ'}</Badge>}>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p>হিসাব: <b className="num">{gsAccount(state.accounts, sel.accId)?.no ?? sel.accId}</b></p>
                <p>মাধ্যম: <b>{CHANNEL_LABEL[sel.channel]}</b></p>
                <p>অঙ্ক: <b className="num">৳{bn(sel.amount)}</b></p>
                <p>পোস্টের পরে ব্যালেন্স: <b className="num">৳{bn(sel.balanceAfter)}</b></p>
                <p>রেফারেন্স: <b className="num">{sel.reference}</b></p>
                <p>পোস্ট করেছেন: <b>{sel.postedBy}</b></p>
                <p>ডিভাইস: <b>{sel.device}</b></p>
                <p>IP: <b className="num">{sel.ip}</b></p>
                <p className="sm:col-span-2">GPS: <b className="num">{sel.gps}</b></p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => nav(`/w/accounts/${sel.accId}`)}>হিসাব দেখুন</Button>
                <Button size="sm" variant="secondary" onClick={() => nav(`/w/reversal?txn=${sel.id}`)} disabled={sel.status === 'reversed'}>রিভার্সাল</Button>
                <Button size="sm" variant="secondary" onClick={() => nav(`/w/members/${sel.memberId}`)}>সদস্য ৩৬০°</Button>
              </div>
            </Card>
            <Card title="অডিট ট্রেইল" sub="প্রতিটি ধাপ — কে, কখন, কী">
              <ol className="space-y-2">
                {sel.audit.map((a, i) => (
                  <li key={`${a.at}-${i}`} className="border-l-2 border-green-700 pl-3">
                    <div className="text-sm font-bold">{a.what}</div>
                    <div className="text-xs text-mut">{a.at} · {a.by}</div>
                  </li>
                ))}
              </ol>
            </Card>
            <Note tone="warn">মূল এন্ট্রি কখনো মুছে ফেলা হয় না; সংশোধন শুধু উল্টো এন্ট্রি দিয়ে (R-02)।</Note>
          </div>
        )}
      </div>
    </Page>
  );
}
