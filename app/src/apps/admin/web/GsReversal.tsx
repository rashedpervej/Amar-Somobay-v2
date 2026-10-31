/* A-27 · লেনদেন সংশোধন / রিভার্সাল — ডিলিট নয়, উল্টো এন্ট্রি */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Note, Page, StatBar } from './webParts';
import { Field, gsMemberName } from './gsParts';

export default function GsReversal() {
  const { state, reverseTxn } = useAdmin();
  const [qs] = useSearchParams();
  const posted = state.txns.filter((t) => t.status === 'posted');
  const [txnId, setTxnId] = useState(qs.get('txn') ?? posted[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const txn = state.txns.find((t) => t.id === txnId);

  const submit = () => {
    const r = reverseTxn(txnId, reason);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setReason(''); }
  };
  const pendingCorr = state.corrections.filter((c) => c.status === 'pending');

  return (
    <Page title="সংশোধন ও রিভার্সাল" sub="ভুল এন্ট্রি মুছি না — উল্টো এন্ট্রি দিয়ে সংশোধন · ডেমো" back="/w/txn">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'সংশোধন অপেক্ষমাণ', v: bn(pendingCorr.length), tone: 'warn' },
        { k: 'আজকের সংশোধন', v: bn(state.corrections.length) },
        { k: 'রিভার্সড লেনদেন', v: bn(state.txns.filter((t) => t.status === 'reversed').length), tone: 'danger' },
        { k: 'মোট লেনদেন', v: bn(state.txns.length) },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="রিভার্সাল তৈরি" sub="কারণ অন্তত ৫ অক্ষর — অডিটে অপরিবর্তনীয়">
            <Field label="মূল লেনদেন">
              <select value={txnId} onChange={(e) => setTxnId(e.target.value)} className={inputCls}>
                {posted.map((t) => (
                  <option key={t.id} value={t.id}>{t.no} · {gsMemberName(state.members, t.memberId)} · ৳{bn(t.amount)}</option>
                ))}
              </select>
            </Field>
            {txn && (
              <div className="grid sm:grid-cols-2 gap-2 text-sm mt-2">
                <p>অঙ্ক: <b className="num">৳{bn(txn.amount)}</b></p>
                <p>মাধ্যম: <b>{txn.channel}</b></p>
                <p>রেফারেন্স: <b className="num">{txn.reference}</b></p>
                <p>পোস্ট: <b>{txn.postedBy}</b></p>
              </div>
            )}
            <div className="mt-3">
              <Field label="রিভার্সালের কারণ">
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} py-2`} placeholder="যেমন: একই রসিদে দুইবার পোস্ট হয়েছে" />
              </Field>
            </div>
            <Button className="mt-3" onClick={submit} disabled={!txn || txn.status === 'reversed'}>রিভার্সাল করুন</Button>
          </Card>

          <Card title="সংশোধন তালিকা" sub="প্রস্তাব → অনুমোদন → প্রয়োগ">
            <DataTable
              columns={[
                { key: 'no', head: 'নম্বর', render: (c) => <b className="num">{c.no}</b> },
                { key: 'kind', head: 'ধরন', render: (c) => c.kind },
                { key: 'txn', head: 'লেনদেন', render: (c) => <span className="num text-xs">{c.txnNo}</span> },
                { key: 'by', head: 'প্রস্তাবক', render: (c) => c.by },
                { key: 'imp', head: 'প্রভাব', align: 'right', render: (c) => <span className="num">৳{bn(c.impact.balance)}</span> },
                { key: 'st', head: 'অবস্থা', render: (c) => <Badge tone={c.status === 'applied' ? 'ok' : c.status === 'rejected' ? 'danger' : 'warn'}>{c.status === 'applied' ? 'প্রয়োগ' : c.status === 'rejected' ? 'প্রত্যাখ্যাত' : c.status === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমাণ'}</Badge> },
              ]}
              rows={state.corrections}
              empty="কোনো সংশোধন নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="নিয়ম" sub="R-02 · BR-04">
            <ul className="text-sm text-mut space-y-2 leading-relaxed">
              <li>• কোনো ডেটা বা এন্ট্রি ডিলিট হয় না; শুধু উল্টো এন্ট্রি।</li>
              <li>• প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না (BR-04)।</li>
              <li>• রিভার্সালের পরে মূল ও নতুন — দুটোই অডিট লগে থাকে।</li>
              <li>• ব্যালেন্স ও রিপোর্ট স্বয়ংক্রিয়ভাবে সমন্বয় হয়; হাতে সম্পাদনা নয়।</li>
            </ul>
          </Card>
          {pendingCorr[0] && (
            <Card title="অপেক্ষমাণ সংশোধন" sub={pendingCorr[0].no}>
              <p className="text-sm"><b>{pendingCorr[0].kind}</b></p>
              <p className="text-sm text-mut mt-1">{pendingCorr[0].reason}</p>
              <p className="text-xs text-mut mt-2">প্রভাব: {pendingCorr[0].impact.reports}</p>
            </Card>
          )}
          <Note tone="warn">বিলম্ব ফি সংশোধন হলেও সুদ নেই — ফি নির্ধারিত (D-08)।</Note>
        </div>
      </div>
    </Page>
  );
}
