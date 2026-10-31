import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountsOf, duesOfMember, type Channel } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';
import { Field, gsDueLeft } from './gsParts';

export default function GsMemberExit() {
  const { memberId } = useParams();
  const { state, closeAccount } = useAdmin();
  const nav = useNavigate();
  const m = state.members.find((x) => x.id === memberId) ?? state.members[0];
  const accs = accountsOf(state.accounts, m.id);
  const [accId, setAccId] = useState(accs[0]?.id ?? '');
  const acc = accs.find((a) => a.id === accId);
  const dues = acc ? state.dues.filter((d) => d.accId === acc.id) : [];
  const due = gsDueLeft(dues);
  const [waiverNo, setWaiverNo] = useState('');
  const [method, setMethod] = useState<Channel>('cash');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [payable, setPayable] = useState<number | null>(null);
  const submit = () => {
    if (!acc) return setErr('হিসাব বাছাই করুন');
    const r = closeAccount({ accountId: acc.id, waiverNo, method });
    if (!r.ok) { setErr(r.message); setMsg(''); setPayable(null); } else { setErr(''); setMsg(r.message); setPayable(r.payable); }
  };

  return (
    <Page title="সদস্য প্রস্থান ও চূড়ান্ত নিষ্পত্তি" sub={`${m.name} · ${m.no} · হিসাব বন্ধ ও প্রদেয় হিসাব`} back={`/w/members/${m.id}`}
      right={<Button size="sm" variant="secondary" onClick={() => nav(`/w/members/${m.id}`)}>সদস্য ৩৬০°</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg} {payable !== null && <b className="num">প্রদেয় ৳{bn(payable)}</b>}</Note>}
      <StatBar items={[
        { k: 'মোট হিসাব', v: bn(accs.length) },
        { k: 'মোট স্থিতি', v: `৳${bn(accs.reduce((n, a) => n + a.posted, 0))}` },
        { k: 'বকেয়া', v: `৳${bn(due)}`, tone: due ? 'danger' : 'ok' },
        { k: 'অবস্থা', v: m.status === 'exited' ? 'প্রস্থান' : 'সক্রিয়' },
      ]} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card title="নিষ্পত্তি হিসাব" sub="বকেয়া থাকলে কমিটির মওকুফ নম্বর ছাড়া নয় (D-09)">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="হিসাব">
              <select value={accId} onChange={(e) => setAccId(e.target.value)} className={inputCls}>
                {accs.map((a) => <option key={a.id} value={a.id}>{a.no} · {a.scheme} · ৳{bn(a.posted)}</option>)}
              </select>
            </Field>
            <Field label="প্রদানের মাধ্যম">
              <select value={method} onChange={(e) => setMethod(e.target.value as Channel)} className={inputCls}>
                <option value="cash">নগদ</option><option value="bkash">বিকাশ</option><option value="nagad">নগদ (Nagad)</option><option value="bank">ব্যাংক</option>
              </select>
            </Field>
            <Field label="মওকুফ / কমিটি নম্বর" hint={due ? 'বকেয়া আছে — বাধ্যতামূলক' : 'প্রযোজ্য নয়'}>
              <input value={waiverNo} onChange={(e) => setWaiverNo(e.target.value)} placeholder="CM-2610-09" className={inputCls} />
            </Field>
            <div className="rounded-r-sm border border-line bg-card-2 p-3 text-sm">
              <div className="flex justify-between"><span className="text-mut">স্থিতি</span><b className="num">৳{bn(acc?.posted ?? 0)}</b></div>
              <div className="flex justify-between"><span className="text-mut">বকেয়া</span><b className="num text-danger-ink">৳{bn(due)}</b></div>
              <div className="flex justify-between border-t border-line mt-1 pt-1"><span className="font-bold">প্রদেয়</span><b className="num">৳{bn(Math.max(0, (acc?.posted ?? 0) - due))}</b></div>
            </div>
          </div>
          <Button className="mt-3" onClick={submit}>নিষ্পত্তি নিশ্চিত করুন</Button>
          <p className="text-xs text-mut mt-2">নিষ্পত্তির পর হিসাব বন্ধ হবে, সদস্য “প্রস্থান” অবস্থায় যাবে; লেনদেনের ইতিহাস মুছবে না।</p>
        </Card>
        <div className="space-y-3">
          <Card title="বকেয়া কিস্তি">
            {dues.length ? dues.map((d) => (
              <div key={d.id} className="flex justify-between py-1.5 border-b border-line-2 last:border-0 text-sm"><span>#{bn(d.instNo)} · {d.due}</span><b className="num">৳{bn(d.amount - d.paid)}</b></div>
            )) : <p className="text-sm text-mut">কোনো বকেয়া নেই ✅</p>}
          </Card>
          <Note tone="warn">মওকুফ শুধু কমিটির সিদ্ধান্তে; নিজে থেকে বকেয়া মাফ করা যাবে না। কোনো সুদ মাফের প্রশ্ন নেই — সুদ নেই।</Note>
        </div>
      </div>
    </Page>
  );
}
