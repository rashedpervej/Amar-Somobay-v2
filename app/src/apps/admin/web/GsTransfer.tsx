/* A-29 · তহবিল স্থানান্তর — সমিতির হিসাব থেকে হিসাবে, maker ≠ checker */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { transferTotal } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';
import { Field } from './gsParts';

export default function GsTransfer() {
  const { state, transferFunds } = useAdmin();
  const [from, setFrom] = useState(state.orgAccounts[0]?.id ?? '');
  const [to, setTo] = useState(state.orgAccounts[1]?.id ?? '');
  const [amount, setAmount] = useState('10000');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const accName = (id: string) => state.orgAccounts.find((a) => a.id === id)?.name ?? id;

  const submit = () => {
    const r = transferFunds(from, to, Number(amount));
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="তহবিল স্থানান্তর" sub="ক্যাশ ↔ ব্যাংক ↔ ওয়ালেট · দ্বৈত অনুমোদন · ডেমো" back="/w/dashboard">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={state.orgAccounts.map((a) => ({ k: a.name, v: `৳${bn(a.balance)}` }))} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="নতুন স্থানান্তর" sub="উৎস ও গন্তব্য আলাদা হতে হবে; সর্বনিম্ন ৳১০০">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="উৎস হিসাব">
                <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls}>
                  {state.orgAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} · ৳{bn(a.balance)}</option>)}
                </select>
              </Field>
              <Field label="গন্তব্য হিসাব">
                <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}>
                  {state.orgAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} · ৳{bn(a.balance)}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="অঙ্ক (৳)">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} num`} />
                </Field>
              </div>
            </div>
            <div className="rounded-r-sm border border-info-bd bg-info-bg text-info-ink px-3 py-2 text-xs mt-3">
              {accName(from)} → {accName(to)} · প্রস্তাব জমা হবে, দ্বিতীয় অনুমোদনের পরে কার্যকর (BR-04)।
            </div>
            <Button className="mt-3" onClick={submit}>স্থানান্তর প্রস্তাব</Button>
          </Card>

          <Card title="স্থানান্তরের তালিকা" sub="প্রস্তাব → অনুমোদন → সম্পন্ন">
            <DataTable
              columns={[
                { key: 'no', head: 'নম্বর', render: (t) => <b className="num">{t.no}</b> },
                { key: 'from', head: 'থেকে', render: (t) => accName(t.from) },
                { key: 'to', head: 'গন্তব্য', render: (t) => accName(t.to) },
                { key: 'amt', head: 'অঙ্ক', align: 'right', render: (t) => <b className="num">৳{bn(t.amount)}</b> },
                { key: 'fee', head: 'ফি', align: 'right', render: (t) => <span className="num">৳{bn(t.fee)}</span> },
                { key: 'st', head: 'অবস্থা', render: (t) => <Badge tone={t.status === 'done' ? 'ok' : t.status === 'pending' ? 'warn' : 'danger'}>{t.status === 'done' ? 'সম্পন্ন' : t.status === 'pending' ? 'অপেক্ষমাণ' : 'অজানা'}</Badge> },
                { key: 'by', head: 'প্রস্তাবক', render: (t) => <span className="text-xs">{t.by}</span> },
              ]}
              rows={state.transfers}
              empty="কোনো স্থানান্তর নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="হিসাবের ব্যালেন্স" sub="স্থানান্তর প্রস্তাবের পরে দেখানো হয় না — অনুমোদনে কার্যকর">
            {state.orgAccounts.map((a) => (
              <div key={a.id} className="flex justify-between py-1.5 border-b border-line-2 last:border-0 text-sm">
                <span>{a.name}<span className="block text-xs text-mut">{a.kind} · {a.no}</span></span>
                <b className="num">৳{bn(a.balance)}</b>
              </div>
            ))}
          </Card>
          <Card title="নিয়ম" sub="D-23 · BR-04">
            <ul className="text-sm text-mut space-y-1.5">
              <li>• একই ব্যক্তি প্রস্তাব ও অনুমোদন দুটোই করতে পারবেন না।</li>
              <li>• কর্জে হাসানা তহবিল শুধু মূলধন — অন্য খাতে ব্যবহার নয়।</li>
              <li>• প্রতিটি স্থানান্তরে ফি থাকলে আলাদা দেখানো হয়।</li>
              <li>• স্থানান্তরের ইতিহাস অপরিবর্তনীয় (R-02)।</li>
            </ul>
          </Card>
          {state.transfers[0] && (
            <Card title="সর্বশেষ প্রস্তাব" sub={state.transfers[0].no}>
              <p className="text-sm">{accName(state.transfers[0].from)} → {accName(state.transfers[0].to)}</p>
              <p className="num font-bold mt-1">৳{bn(transferTotal(state.transfers[0]))} (ফিসহ)</p>
              <p className="text-xs text-mut mt-1">প্রস্তাবক {state.transfers[0].by} · {state.transfers[0].at}</p>
            </Card>
          )}
          <Note tone="warn">ডেমো: কোনো বাস্তব ব্যাংক বা ওয়ালেটে টাকা যায় না; শুধু ইন-মেমরি স্থিতি।</Note>
        </div>
      </div>
    </Page>
  );
}
