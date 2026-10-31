import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { QH_CHANNEL, qhInsts, qhOutstanding } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, QhZero, memName } from './qhParts';

export default function QhWebRepay() {
  const { loanId } = useParams();
  const { state, recordRepay } = useAdminQh();
  const nav = useNavigate();
  const loan = state.loans.find((l) => l.id === loanId) ?? state.loans.find((l) => l.status === 'active') ?? state.loans[0];
  const insts = qhInsts(loan, state.repayments);
  const firstDue = insts.find((i) => i.status !== 'paid');
  const [instNo, setInstNo] = useState(String(firstDue?.no ?? 1));
  const [amount, setAmount] = useState(String(firstDue?.amount ?? 0));
  const [channel, setChannel] = useState<'cash' | 'bank' | 'wallet' | 'gs'>('cash');
  const [by, setBy] = useState('রাজু আহমেদ (সংগ্রহক)');
  const [attested, setAttested] = useState(false);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const inst = insts.find((i) => i.no === Number(instNo));

  const submit = () => {
    if (channel === 'cash' && !attested) { setErr('নগদ গণনা যাচাই ও স্বাক্ষর ছাড়া গ্রহণ করা যাবে না (D-50)'); setMsg(''); return; }
    const r = recordRepay(loan.id, Number(instNo), Number(amount), channel, by);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="পরিশোধ এন্ট্রি ও রসিদ" sub={`${loan.no} · ${memName(loan.memberId)} · ${bn(loan.tenure)} কিস্তি · সুদ শূন্য`}
      back={`/w/qh/loans/${loan.id}`}
      right={<Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/loans/${loan.id}`)}>ঋণ হাব</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <StatBar items={[
        { k: 'বাকি মূলধন', v: `৳${bn(qhOutstanding(loan, state.repayments, state.writeoffs))}` },
        { k: 'বকেয়া', v: `৳${bn(insts.filter((i) => i.status === 'overdue').reduce((n, i) => n + i.amount, 0))}`, tone: 'danger' },
        { k: 'এই কিস্তি', v: inst ? `৳${bn(inst.amount)}` : '—' },
        { k: 'সুদ', v: '৳০', tone: 'ok' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="কিস্তি বাছুন" sub="এক কিস্তি একবার — দ্বিতীয়বার গ্রহণ নয় (BR-08)">
            <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {insts.map((i) => (
                <button key={i.no} type="button" disabled={i.status === 'paid'}
                  onClick={() => { setInstNo(String(i.no)); setAmount(String(i.amount)); }}
                  className={`min-h-tap rounded-r-sm border px-2 py-1.5 text-left text-xs disabled:opacity-50 ${Number(instNo) === i.no ? 'border-green-600 bg-green-050' : i.status === 'overdue' ? 'border-danger-bd bg-danger-bg' : 'border-line-3 bg-card'}`}>
                  <b className="num block">কিস্তি {bn(i.no)}</b>
                  <span className="block">{i.due}</span>
                  <span className="block num font-bold">৳{bn(i.amount)}</span>
                  <span className="block">{i.status === 'paid' ? 'পরিশোধিত' : i.status === 'overdue' ? 'বকেয়া' : 'আসন্ন'}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="রসিদ তথ্য" sub="মাধ্যম অনুযায়ী প্রমাণ">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block"><span className="text-sm font-bold">কিস্তি</span>
                <input value={instNo} readOnly className={`${inputCls} mt-1 num bg-card-2`} />
              </label>
              <label className="block"><span className="text-sm font-bold">অঙ্ক (৳)</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} mt-1 num`} />
              </label>
              <div className="sm:col-span-2">
                <span className="text-sm font-bold">মাধ্যম</span>
                <div className="grid sm:grid-cols-3 gap-2 mt-1">
                  {QH_CHANNEL.map((c) => (
                    <button key={c.k} type="button" onClick={() => setChannel(c.k)}
                      className={`min-h-10 rounded-r-sm border px-2 text-sm ${channel === c.k ? 'border-green-600 bg-green-050 font-bold' : 'border-line-3 bg-card'}`}>
                      {c.t}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block sm:col-span-2"><span className="text-sm font-bold">গ্রহণকারী</span>
                <select value={by} onChange={(e) => setBy(e.target.value)} className={`${inputCls} mt-1`}>
                  {['রাজু আহমেদ (সংগ্রহক)', 'সুমি রানী দাস (হিসাবরক্ষক)', 'নাসরিন আক্তার (অনুমোদনকারী)'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </label>
            </div>
            {channel === 'cash' && (
              <button type="button" onClick={() => setAttested(!attested)}
                className={`mt-3 min-h-tap w-full flex items-center gap-2 rounded-r-sm border px-3 text-left text-sm ${attested ? 'border-ok-bd bg-ok-bg' : 'border-line-3 bg-card'}`}>
                <span className={`size-5 rounded-r-sm border-2 grid place-items-center text-[10px] ${attested ? 'bg-green-700 border-green-700 text-white' : 'border-line-3'}`}>{attested ? '✓' : ''}</span>
                নগদ গণনা যাচাই ও সদস্যের স্বাক্ষর নিয়েছি (D-50)
              </button>
            )}
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="গ্রহণ নিশ্চিত" sub="রসিদ তৈরি হলে অপরিবর্তনীয়">
            <div className="text-sm space-y-1 mb-3">
              <div className="flex justify-between"><span className="text-mut">ঋণ</span><b>{loan.no}</b></div>
              <div className="flex justify-between"><span className="text-mut">কিস্তি</span><b>{bn(Number(instNo))}</b></div>
              <div className="flex justify-between"><span className="text-mut">অঙ্ক</span><b className="num">৳{bn(Number(amount) || 0)}</b></div>
              <div className="flex justify-between"><span className="text-mut">মাধ্যম</span><b>{QH_CHANNEL.find((c) => c.k === channel)?.t}</b></div>
              <div className="flex justify-between"><span className="text-mut">সুদ</span><b className="text-ok-ink">৳০</b></div>
            </div>
            <Button block onClick={submit}>গ্রহণ ও রসিদ ইস্যু</Button>
            <p className="text-xs text-mut mt-2">রসিদ নম্বর QR-2610-#### · গ্রহণকারী ও সময় অডিটে যাবে।</p>
          </Card>
          <QhCallout title="কোনো অতিরিক্ত চার্জ নেই" tone="ok">কিস্তির অঙ্ক = মূলধন ÷ মেয়াদ। অগ্রিম/বিলম্ব ফি বা সুদ যোগ হবে না (BR-20 · D-41)।</QhCallout>
          <div className="flex justify-center"><QhZero /></div>
          <Note>মেয়াদ শেষে বাকি থাকলে পুনর্গঠন বা কমিটি সিদ্ধান্ত; নিজে থেকে write-off নয়।</Note>
        </div>
      </div>
    </Page>
  );
}
