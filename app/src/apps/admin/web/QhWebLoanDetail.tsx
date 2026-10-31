import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import {
  QH_CLASS, QH_LOAN_ST, qhArrearsOf, qhClassOf, qhDaysLate, qhInsts, qhNextInst, qhOutstanding, qhPaidPct, qhPerInst,
} from '../../../domain/adminQard';
import { Desk, Go, Note, Page, Rail, StatBar } from './webParts';
import { QhCallout, QhZero, memName } from './qhParts';

export default function QhWebLoanDetail() {
  const { loanId } = useParams();
  const { state, restructure } = useAdminQh();
  const nav = useNavigate();
  const loan = state.loans.find((l) => l.id === loanId) ?? state.loans[0];
  const insts = qhInsts(loan, state.repayments);
  const reps = state.repayments.filter((r) => r.loan === loan.id);
  const next = qhNextInst(loan, state.repayments);
  const paid = qhPaidPct(loan, state.repayments);
  const cls = qhClassOf(loan, state.repayments);
  const [months, setMonths] = useState('3');
  const [committee, setCommittee] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const rest = () => {
    const r = restructure(loan.id, Number(months), committee);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const active = loan.status === 'active' || loan.status === 'arrears';

  return (
    <Page title={`${loan.no} · ঋণ হাব`} sub={`${memName(loan.memberId)} · ৳${bn(loan.principal)} · ${bn(loan.tenure)} মাস · চ্যানেল ${loan.channel}`}
      back="/w/qh/loans"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/arrears')}>বকেয়া</Button><Button size="sm" disabled={!active} onClick={() => nav(`/w/qh/loans/${loan.id}/repay`)}>পরিশোধ নিন</Button><Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/loans/${loan.id}/close`)}>সমাপ্তি</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={QH_LOAN_ST[loan.status].tone}>{QH_LOAN_ST[loan.status].t}</Badge>
        <Badge tone={QH_CLASS[cls].tone}>{QH_CLASS[cls].t}</Badge>
        <QhZero />
        <span className="text-sm text-mut">কমিটি {loan.committee} · হ্যাশ {loan.hash || '—'}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card title="পরিশোধ অগ্রগতি" sub={`${bn(paid)}% মূলধন আদায়`}>
          <div className="relative size-40 mx-auto">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-line-2" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(Math.min(100, paid) / 100) * 314} 314`} className="text-green-600" />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center"><b className="num text-h1 block">{bn(Math.min(100, paid))}%</b><span className="text-xs text-mut">আদায়</span></div>
            </div>
          </div>
          <div className="text-sm space-y-1 mt-2">
            <div className="flex justify-between"><span className="text-mut">মূলধন</span><b className="num">৳{bn(loan.principal)}</b></div>
            <div className="flex justify-between"><span className="text-mut">বাকি</span><b className="num">৳{bn(qhOutstanding(loan, state.repayments, state.writeoffs))}</b></div>
            <div className="flex justify-between"><span className="text-mut">বকেয়া</span><b className="num text-danger-ink">৳{bn(qhArrearsOf(loan, state.repayments))}</b></div>
            <div className="flex justify-between"><span className="text-mut">বিলম্ব</span><b>{bn(qhDaysLate(loan, state.repayments))} দিন</b></div>
          </div>
        </Card>

        <div className="space-y-3">
          <StatBar items={[
            { k: 'কিস্তি', v: `৳${bn(qhPerInst(loan))}` },
            { k: 'পরিশোধিত', v: `${bn(insts.filter((i) => i.status === 'paid').length)}/${bn(loan.tenure)}` },
            { k: 'পরবর্তী', v: next ? next.due : '—' },
            { k: 'সুদ', v: '৳০', tone: 'ok' },
          ]} />
          <Card title="কিস্তি গ্রিড" sub="সব কিস্তি · বকেয়া লাল">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {insts.map((i) => (
                <button key={i.no} type="button" onClick={() => active && nav(`/w/qh/loans/${loan.id}/repay`)}
                  className={`min-h-10 rounded-r-sm border px-1 py-1.5 text-center ${i.status === 'paid' ? 'bg-ok-bg border-ok-bd' : i.status === 'overdue' ? 'bg-danger-bg border-danger-bd' : 'bg-card border-line'}`}>
                  <b className="num block text-xs">{bn(i.no)}</b>
                  <span className="block text-[10px] text-mut">{i.due.slice(5)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 text-xs text-mut mt-2"><span>🟩 পরিশোধিত</span><span>🟥 বকেয়া</span><span>⬜ আসন্ন</span></div>
          </Card>

          <Card title="পরিশোধ রসিদ" sub="অপরিবর্তনীয় (BR-08)" right={<Go to={`/w/qh/loans/${loan.id}/repay`}>নতুন পরিশোধ</Go>}>
            <DataTable
              columns={[
                { key: 'receipt', head: 'রসিদ', render: (r) => <b className="num">{r.receipt}</b> },
                { key: 'inst', head: 'কিস্তি', align: 'center', render: (r) => bn(r.inst) },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => `৳${bn(r.amount)}` },
                { key: 'at', head: 'তারিখ', render: (r) => r.at },
                { key: 'channel', head: 'মাধ্যম', render: (r) => r.channel === 'cash' ? 'নগদ' : r.channel === 'bank' ? 'ব্যাংক' : 'ওয়ালেট' },
                { key: 'by', head: 'গ্রহণকারী', render: (r) => r.by },
              ]}
              rows={reps}
              empty="এখনো কোনো পরিশোধ নেই"
            />
          </Card>
        </div>
      </div>

      <Desk>
        <div className="space-y-3">
          <Card title="পুনর্গঠন" sub="মেয়াদ বাড়িয়ে কিস্তি কমানো — মোট ফেরত = মূলধন (D-53)">
            <div className="flex flex-wrap gap-2 items-end">
              <label className="block"><span className="text-sm font-bold">অতিরিক্ত মাস</span>
                <input type="number" value={months} onChange={(e) => setMonths(e.target.value)} className={`${inputCls} mt-1 num max-w-28`} />
              </label>
              <label className="block grow max-w-xs"><span className="text-sm font-bold">কমিটি রেফারেন্স</span>
                <input value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="CM-YYMM-##" className={`${inputCls} mt-1`} />
              </label>
              <Button onClick={rest} disabled={!active}>পুনর্গঠন করুন</Button>
            </div>
            <p className="text-xs text-mut mt-2">পুনর্গঠনে নতুন চার্জ নেই; ভবিষ্যৎ কিস্তি কমে, মেয়াদ বাড়ে। প্রয়োজনে write-off আলাদা প্রক্রিয়া।</p>
          </Card>
          <Card title="বিতরণ তথ্য" sub="ভাউচার ও অনুমোদন">
            <div className="text-sm grid sm:grid-cols-2 gap-2">
              <p>বিতরণ: <b>{loan.disbursedAt ?? 'বাকি'}</b></p>
              <p>প্রথম কিস্তি: <b>{loan.firstDue ?? '—'}</b></p>
              <p>প্রস্তুতকারী: <b>{loan.by}</b></p>
              <p>অনুমোদনকারী: <b>{loan.appr}</b></p>
              <p className="sm:col-span-2">প্রমাণ: {loan.evidence.join(' · ') || '—'}</p>
              <p className="sm:col-span-2 text-xs text-mut">{loan.note}</p>
            </div>
          </Card>
        </div>
        <div className="space-y-3">
          <Rail title="সংযোগ">
            <Go to="/w/qh/loans">সব ঋণ</Go>
            <Go to={`/w/qh/loans/${loan.id}/repay`}>পরিশোধ এন্ট্রি</Go>
            <Go to={`/w/qh/loans/${loan.id}/close`}>সমাপ্তি ও সনদ</Go>
            <Go to="/w/qh/writeoff">write-off</Go>
          </Rail>
          <QhCallout title="সুদ শূন্য প্রতিশ্রুতি" tone="ok">এই ঋণের মোট ফেরত = ৳{bn(loan.principal)} — কোনো সুদ, ফি বা জরিমানা নেই।</QhCallout>
          {loan.status === 'arrears' && <QhCallout title="বকেয়া ব্যবস্থাপনা" tone="warn">বিলম্ব ফি নেই; প্রতিকার ধাপ (নোটিশ → কমিটি → প্রতিস্থাপন/আদায়) অনুসরণ করুন (D-44)।</QhCallout>}
        </div>
      </Desk>
    </Page>
  );
}
