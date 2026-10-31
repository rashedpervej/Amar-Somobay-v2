import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL, type Channel } from '../../../domain/admin';
import { Note, Page } from './webParts';
import { AccountSelect, Field, gsAccount, gsMemberName } from './gsParts';

export default function GsDepositNew() {
  const { state, addDeposit } = useAdmin();
  const nav = useNavigate();
  const [qs] = useSearchParams();
  const preselect = qs.get('account') ?? state.accounts.find((a) => a.memberId === qs.get('member'))?.id ?? '';
  const [accountId, setAccountId] = useState(preselect);
  const [amount, setAmount] = useState('500');
  const [channel, setChannel] = useState<Channel>('cash');
  const [reference, setReference] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [receipt, setReceipt] = useState('');
  const acc = gsAccount(state.accounts, accountId);
  const submit = () => {
    const r = addDeposit({ accountId, amount: Number(amount), channel, reference: reference || 'ডেমো রেফারেন্স' });
    if (!r.ok) { setErr(r.message); setMsg(''); setReceipt(''); } else { setErr(''); setMsg(r.message); setReceipt(r.receipt); }
  };

  return (
    <Page title="দ্রুত জমা এন্ট্রি" sub="জমা পোস্ট · রসিদ · ক্যাশ বুক হালনাগাদ" back="/w/deposits"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/deposits')}>জমা রেকর্ড</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg} {receipt && <b className="num">রসিদ: {receipt}</b>}</Note>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card title="জমার তথ্য" sub="সদস্য/হিসাব বাছাই করে অঙ্ক ও মাধ্যম দিন">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><AccountSelect accounts={state.accounts} members={state.members} value={accountId} onChange={setAccountId} /></div>
            {acc && (
              <div className="sm:col-span-2 rounded-r-sm border border-line bg-card-2 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><span>সদস্য: <b>{gsMemberName(state.members, acc.memberId)}</b></span><span>বর্তমান স্থিতি: <b className="num">৳{bn(acc.posted)}</b></span><span>কিস্তি: <b className="num">৳{bn(acc.installment)}</b></span></div>
              </div>
            )}
            <Field label="অঙ্ক (৳)"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} num`} /></Field>
            <Field label="মাধ্যম">
              <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className={inputCls}>
                {Object.entries(CHANNEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2"><Field label="রেফারেন্স / রসিদ নম্বর" hint="ব্যাংক/বিকাশ রেফারেন্স"><input value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} placeholder="RCP-১০২৫ / BNK-৯৯২১" /></Field></div>
          </div>
          <Button className="mt-3" onClick={submit}>জমা পোস্ট করুন</Button>
        </Card>
        <div className="space-y-3">
          <Card title="পোস্টের নিয়ম">
            <ul className="text-sm text-mut space-y-2 leading-relaxed">
              <li>• বন্ধ/ফ্রিজ অ্যাকাউন্টে জমা নয়।</li>
              <li>• অঙ্ক ০-এর বেশি হতে হবে।</li>
              <li>• নগদ হলে রসিদ নম্বর বাধ্যতামূলক।</li>
              <li>• সুদ শূন্য / মুনাফা নেই — শুধু আসল জমা।</li>
            </ul>
          </Card>
          <Card title="সাম্প্রতিক জমা">
            {state.txns.filter((t) => t.type === 'deposit').slice(0, 4).map((t) => (
              <div key={t.id} className="flex justify-between gap-2 py-1.5 border-b border-line-2 last:border-0 text-sm"><span className="truncate">{gsMemberName(state.members, t.memberId)}</span><b className="num">৳{bn(t.amount)}</b></div>
            ))}
          </Card>
        </div>
      </div>
    </Page>
  );
}
