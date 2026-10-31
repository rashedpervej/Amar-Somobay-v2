import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL, type Channel } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';
import { Field, gsChannel } from './gsParts';

export default function GsPayouts() {
  const { state, payPayout } = useAdmin();
  const [sel, setSel] = useState(state.payouts.find((p) => p.status !== 'paid')?.id ?? '');
  const [method, setMethod] = useState<Channel>('cash');
  const [voucher, setVoucher] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const p = state.payouts.find((x) => x.id === sel);
  const pay = () => {
    const r = payPayout(sel, method, voucher);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setVoucher(''); }
  };
  const approved = state.payouts.filter((x) => x.status === 'approved');

  return (
    <Page title="নিষ্পত্তি ও পেমেন্ট" sub="অনুমোদিত উত্তোলন/প্রস্থানের প্রদান ও ভাউচার" back="/w/dashboard"
      right={<Button size="sm" variant="secondary" onClick={() => window.print()}>ভাউচার প্রিন্ট (ডেমো)</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'প্রদান বাকি', v: bn(approved.length), tone: approved.length ? 'warn' : 'ok' },
        { k: 'মোট প্রদেয়', v: `৳${bn(approved.reduce((n, x) => n + x.amount, 0))}` },
        { k: 'প্রদত্ত', v: bn(state.payouts.filter((x) => x.status === 'paid').length) },
        { k: 'মোট প্রদত্ত', v: `৳${bn(state.payouts.filter((x) => x.status === 'paid').reduce((n, x) => n + x.amount, 0))}` },
      ]} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card title="প্রদান তালিকা" sub="প্রতিটি প্রদানে ভাউচার বাধ্যতামূলক">
          <DataTable
            columns={[
              { key: 'no', head: 'রেফ', render: (x) => <b className="num">{x.no}</b> },
              { key: 'member', head: 'সদস্য', render: (x) => x.member },
              { key: 'amount', head: 'অঙ্ক', align: 'right', render: (x) => <b className="num">৳{bn(x.amount)}</b> },
              { key: 'appr', head: 'অনুমোদন', render: (x) => <span className="text-xs">{x.approvedBy}</span> },
              { key: 'method', head: 'মাধ্যম', render: (x) => gsChannel(x.method) },
              { key: 'voucher', head: 'ভাউচার', render: (x) => <span className="num text-xs">{x.voucher || '—'}</span> },
              { key: 'st', head: 'অবস্থা', render: (x) => <Badge tone={x.status === 'paid' ? 'ok' : 'warn'}>{x.status === 'paid' ? 'প্রদত্ত' : 'প্রদান বাকি'}</Badge> },
              { key: 'act', head: '', align: 'right', render: (x) => <Button size="sm" variant="secondary" disabled={x.status === 'paid'} onClick={() => setSel(x.id)}>বাছাই</Button> },
            ]}
            rows={state.payouts}
            empty="কোনো পেমেন্ট নেই"
          />
        </Card>
        <div className="space-y-3">
          <Card title="প্রদান নিশ্চিত" sub={p ? `${p.member} · ৳${bn(p.amount)}` : 'একটি পেমেন্ট বাছুন'}>
            {p && (
              <>
                <Field label="মাধ্যম"><select value={method} onChange={(e) => setMethod(e.target.value as Channel)} className={inputCls}>{Object.entries(CHANNEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                <div className="mt-2"><Field label="ভাউচার নম্বর"><input value={voucher} onChange={(e) => setVoucher(e.target.value)} className={inputCls} placeholder="V-2610-001" /></Field></div>
                <Button block className="mt-3" onClick={pay} disabled={p.status === 'paid'}>প্রদান সম্পন্ন</Button>
              </>
            )}
            {!p && <p className="text-sm text-mut">তালিকা থেকে “বাছাই” চাপুন।</p>}
          </Card>
          <Note>প্রদান = অনুমোদিত উত্তোলন/প্রস্থানের টাকা; সুদ নেই, কোনো বোনাসও নেই।</Note>
          <Note tone="warn">ভাউচার ছাড়া প্রদান হবে না; মোবাইল ওয়ালেটে রেফারেন্স সংরক্ষণ করুন।</Note>
        </div>
      </div>
    </Page>
  );
}
