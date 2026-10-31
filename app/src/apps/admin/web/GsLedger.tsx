import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL } from '../../../domain/admin';
import { Chips, Note, Page, StatBar } from './webParts';
import { gsAccount, gsMemberName } from './gsParts';

export default function GsLedger() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const [qs] = useSearchParams();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const rows = state.txns.filter((t) => (type === 'all' || t.type === type)
    && (q.trim() === '' || `${t.no} ${gsMemberName(state.members, t.memberId)} ${t.reference}`.includes(q.trim())));
  const sel = state.txns.find((t) => t.id === qs.get('txn')) ?? rows[0];

  return (
    <Page title="লেনদেন / সাধারণ খতিয়ান" sub="সব জমা-উত্তোলন-ফি-সমন্বয় · অপরিবর্তনীয় এন্ট্রি · ডেমো" back="/w/dashboard"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/txn')}>ফরেনসিক ভিউ</Button><Button size="sm" variant="secondary" onClick={() => nav('/w/reversal')}>রিভার্সাল</Button></>}>
      <StatBar items={[
        { k: 'মোট এন্ট্রি', v: bn(state.txns.length) },
        { k: 'জমা', v: `৳${bn(state.txns.filter((t) => t.type === 'deposit').reduce((n, t) => n + t.amount, 0))}`, tone: 'ok' },
        { k: 'উত্তোলন', v: `৳${bn(state.txns.filter((t) => t.type === 'withdrawal').reduce((n, t) => n + t.amount, 0))}` },
        { k: 'রিভার্সড', v: bn(state.txns.filter((t) => t.status === 'reversed').length), tone: 'danger' },
      ]} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="লেনদেন নম্বর / সদস্য / রেফারেন্স" className={`${inputCls} mt-1`} /></label>
        <div><span className="text-xs font-bold text-mut block mb-1">ধরন</span>
          <Chips value={type} onChange={setType} items={[['all', 'সব'], ['deposit', 'জমা'], ['withdrawal', 'উত্তোলন'], ['fee', 'ফি'], ['adjust', 'সমন্বয়']]} /></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="খতিয়ান" sub={`${bn(rows.length)}টি এন্ট্রি`}>
          <DataTable
            columns={[
              { key: 'no', head: 'লেনদেন', render: (t) => <button type="button" onClick={() => nav(`/w/ledger?txn=${t.id}`)} className="min-h-10 text-left"><b className="num text-green-800 hover:underline">{t.no}</b><span className="block text-xs text-mut">{t.date}</span></button> },
              { key: 'member', head: 'সদস্য', render: (t) => gsMemberName(state.members, t.memberId) },
              { key: 'acc', head: 'হিসাব', render: (t) => gsAccount(state.accounts, t.accId)?.no ?? '—' },
              { key: 'type', head: 'ধরন', render: (t) => t.type === 'deposit' ? 'জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type === 'fee' ? 'ফি' : 'সমন্বয়' },
              { key: 'amount', head: 'অঙ্ক', align: 'right', render: (t) => <span className={`num ${t.type === 'withdrawal' ? 'text-danger-ink' : 'text-ok-ink'}`}>{t.type === 'withdrawal' ? '−' : '+'}৳{bn(Math.abs(t.amount))}</span> },
              { key: 'ch', head: 'মাধ্যম', render: (t) => CHANNEL_LABEL[t.channel] },
              { key: 'st', head: 'অবস্থা', render: (t) => <Badge tone={t.status === 'posted' ? 'ok' : t.status === 'reversed' ? 'danger' : 'warn'}>{t.status === 'posted' ? 'পোস্টেড' : t.status === 'reversed' ? 'রিভার্সড' : 'অপেক্ষমাণ'}</Badge> },
            ]}
            rows={rows}
          />
        </Card>
        <div className="space-y-3">
          {sel && (
            <Card title={sel.no} sub={`${sel.date} · ${CHANNEL_LABEL[sel.channel]}`}>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-mut">সদস্য</span><b>{gsMemberName(state.members, sel.memberId)}</b></div>
                <div className="flex justify-between"><span className="text-mut">হিসাব</span><b>{gsAccount(state.accounts, sel.accId)?.no}</b></div>
                <div className="flex justify-between"><span className="text-mut">অঙ্ক</span><b className="num">৳{bn(sel.amount)}</b></div>
                <div className="flex justify-between"><span className="text-mut">ব্যালেন্স পরে</span><b className="num">৳{bn(sel.balanceAfter)}</b></div>
                <div className="flex justify-between"><span className="text-mut">পোস্ট করেছেন</span><b>{sel.postedBy}</b></div>
                <div className="flex justify-between"><span className="text-mut">ডিভাইস</span><b className="text-xs">{sel.device}</b></div>
                <div className="flex justify-between"><span className="text-mut">রেফারেন্স</span><b className="num">{sel.reference}</b></div>
              </div>
              <div className="mt-3 border-t border-line pt-2">
                <b className="text-xs text-mut">অডিট</b>
                {sel.audit.map((x, i) => <p key={i} className="text-xs mt-1">{x.at} · {x.by}: {x.what}</p>)}
              </div>
              <Button size="sm" variant="secondary" block className="mt-3" onClick={() => nav('/w/reversal')}>রিভার্সাল প্রস্তাব</Button>
            </Card>
          )}
          <Note>এন্ট্রি কখনো ডিলিট হয় না; ভুল হলে রিভার্সাল জার্নাল হবে — মূল এন্ট্রি ইতিহাসে থাকবে।</Note>
        </div>
      </div>
    </Page>
  );
}
