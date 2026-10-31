/* QAM-12 · পরিশোধ ছক ও কিস্তি তালিকা — রিং, গ্রিড, তারিখভিত্তিক তালিকা ও ৭ দিনের সংগ্রহ কিউ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, CalendarClock, Check, CheckCircle2, Clock, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { Accordion, KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_CLASS, QH_LOAN_ST, QH_TODAY, qhArrearsOf, qhClassOf, qhDate, qhDaysBetween, qhDaysLate, qhInsts,
  qhNextInst, qhOutstanding, qhPaidPct, qhPerInst, qhProductById, qhRepaid,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

export default function QhLoanDetail() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { loanId } = useParams();
  const { state, restructure, closeLoan } = useAdminQh();
  const loan = state.loans.find((l) => l.id === loanId) ?? state.loans[0];
  const [addMonths, setAddMonths] = useState('3');
  const [committee, setCommittee] = useState('CM-2610-08');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const member = SEED_MEMBERS.find((m) => m.id === loan.memberId);
  const product = qhProductById(state.products, loan.product)!;
  const insts = qhInsts(loan, state.repayments);
  const pct = qhPaidPct(loan, state.repayments);
  const out = qhOutstanding(loan, state.repayments, state.writeoffs);
  const nx = qhNextInst(loan, state.repayments);
  const paid = qhRepaid(loan, state.repayments);
  const due7 = insts.filter((i) => (i.status === 'overdue' || i.status === 'upcoming') && Math.abs(qhDaysBetween(QH_TODAY, i.due)) <= 7);

  const doRestructure = () => {
    setErr(''); setOk('');
    const res = restructure(loan.id, Number(addMonths) || 0, committee.trim().toUpperCase());
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };
  const doClose = () => {
    setErr(''); setOk('');
    const res = closeLoan(loan.id);
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };

  const R = 30;
  const C = 2 * Math.PI * R;

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex items-center gap-2 text-xs text-mut">
        <button type="button" onClick={() => navigate(`/a/qh/loans${qs}`)} className="min-h-tap inline-flex items-center gap-1 font-bold text-green-800"><ArrowLeft size={14} /> ঋণ হাব</button>
        <span className="num">{loan.no}</span>
        <Badge tone={QH_LOAN_ST[loan.status].tone}>{QH_LOAN_ST[loan.status].t}</Badge>
        <QhZero />
      </div>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="সফল">{ok}</SuccessBanner> : null}

      <Card>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 size-[76px]">
            <svg viewBox="0 0 76 76" className="size-full -rotate-90">
              <circle cx="38" cy="38" r={R} fill="none" stroke="currentColor" strokeWidth="7" className="text-line-2" />
              <circle cx="38" cy="38" r={R} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
                className={loan.status === 'arrears' ? 'text-danger' : 'text-green-700'}
                strokeDasharray={C} strokeDashoffset={C - (C * Math.min(100, pct)) / 100} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center"><div className="num text-lg font-extrabold leading-none">{bn(pct)}%</div><div className="text-[10px] text-mut">পরিশোধিত</div></div>
            </div>
          </div>
          <div className="grow min-w-0">
            <div className="text-body font-extrabold truncate">{member?.name}</div>
            <div className="text-xs text-mut num">{member?.no} · {product.code} · {member?.mobile}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone={QH_CLASS[qhClassOf(loan, state.repayments)].tone}>{QH_CLASS[qhClassOf(loan, state.repayments)].t}</Badge>
              <Badge tone="neutral">{bn(qhDaysLate(loan, state.repayments))} দিন বিলম্ব</Badge>
            </div>
          </div>
        </div>
        <div className="mt-2">
          <KV k="মূলধন" v={tk(loan.principal)} />
          <KV k="আদায়" v={`${tk(paid)} · ${bn(pct)}%`} />
          <KV k="বাকি" v={<b>{tk(out)}</b>} strong />
          <KV k="কিস্তি" v={`${tk(qhPerInst(loan))} × ${bn(loan.tenure)} · সুদ ৳০`} />
          <KV k="বিতরণ" v={`${qhDate(loan.disbursedAt)} · ${loan.channel === 'bank' ? 'ব্যাংক' : loan.channel === 'wallet' ? 'ওয়ালেট' : loan.channel === 'gs' ? 'GS স্থানান্তর' : 'নগদ'}`} />
          <KV k="প্রথম কিস্তি" v={qhDate(loan.firstDue)} />
          <KV k="কমিটি" v={loan.committee} />
          {loan.cert ? <KV k="সনদ" v={`${loan.cert} · ${qhDate(loan.closedAt)}`} /> : null}
        </div>
        {loan.status === 'arrears' ? <div className="mt-2"><Note tone="danger">বকেয়া {tk(qhArrearsOf(loan, state.repayments))} — কোনো বিলম্ব ফি নেই (D-41)। সমাধান: পরিশোধ, পুনর্গঠন বা কমিটি রেফার।</Note></div> : null}
        {loan.status === 'pending' ? <div className="mt-2"><Button block onClick={() => navigate(`/a/qh/disburse/${loan.id}${qs}`)}>বিতরণ (OTP)</Button></div> : null}
      </Card>

      <SectionHead title="কিস্তির গ্রিড" sub={`${bn(insts.filter((i) => i.status === 'paid').length)}/${bn(insts.length)} পরিশোধিত · সবগুলোতেই মূলধন`} />
      <div className="grid grid-cols-6 gap-1.5">
        {insts.map((i) => {
          const cls = i.status === 'paid' ? 'bg-ok-bg border-ok-bd text-ok-ink' : i.status === 'overdue' ? 'bg-danger-bg border-danger-bd text-danger-ink' : i.status === 'waived' ? 'bg-neutral-bg border-neutral-bd text-neutral-ink' : 'bg-card border-line text-mut';
          return (
            <div key={i.no} className={`rounded-r-sm border px-1 py-1.5 text-center ${cls}`}>
              <div className="num text-[11px] font-extrabold">{bn(i.no)}</div>
              <div className="text-[9px]">{i.status === 'paid' ? <Check size={11} className="mx-auto" /> : i.status === 'overdue' ? <X size={11} className="mx-auto" /> : i.status === 'waived' ? '—' : <Clock size={11} className="mx-auto" />}</div>
            </div>
          );
        })}
      </div>
      {insts.length === 0 ? <p className="text-sm text-mut">বিতরণের পর কিস্তি ছক তৈরি হবে।</p> : null}

      <SectionHead title="কিস্তি তালিকা" sub="তারিখভিত্তিক · প্রতিটি কিস্তির অঙ্ক = মূলধন ÷ মেয়াদ" />
      <Card>
        {insts.map((i) => (
          <div key={i.no} className="flex items-center gap-2 border-b border-line-2 last:border-b-0 py-2">
            <span className={`shrink-0 size-7 rounded-r-pill grid place-items-center text-[11px] font-extrabold ${i.status === 'paid' ? 'bg-ok-bg text-ok-ink' : i.status === 'overdue' ? 'bg-danger-bg text-danger-ink' : 'bg-card-2 text-mut'}`}>{bn(i.no)}</span>
            <div className="grow min-w-0">
              <div className="text-sm font-bold num">{qhDate(i.due)}</div>
              <div className="text-xs text-mut">{i.status === 'paid' ? `পরিশোধিত · রসিদ ${i.receipt}` : i.status === 'overdue' ? `বকেয়া · ${bn(qhDaysBetween(i.due))} দিন আগে` : i.status === 'waived' ? 'ছেড়ে দেওয়া (write-off)' : 'আসন্ন'}</div>
            </div>
            <div className="text-right"><div className="num text-sm font-extrabold">{tk(i.amount)}</div>
              {i.status !== 'paid' && i.status !== 'waived' ? <button type="button" onClick={() => navigate(`/a/qh/loans/${loan.id}/repay?inst=${i.no}${qs ? `&${qs.slice(1)}` : ''}`)} className="text-[11px] font-bold text-green-800">পরিশোধ</button> : null}
            </div>
          </div>
        ))}
      </Card>

      <SectionHead title="আগামী ৭ দিনের সংগ্রহ কিউ" sub={`${bn(due7.length)}টি কিস্তি · কোনো বিলম্ব ফি নেই`} />
      <Card>
        {due7.length ? due7.map((i) => (
          <button key={i.no} type="button" onClick={() => navigate(`/a/qh/loans/${loan.id}/repay?inst=${i.no}${qs ? `&${qs.slice(1)}` : ''}`)} className="min-h-tap w-full text-left border-b border-line-2 last:border-b-0 py-2 flex items-center gap-2">
            <CalendarClock size={15} className="text-warn-ink" />
            <span className="grow text-sm">কিস্তি {bn(i.no)} · {qhDate(i.due)} <span className="text-xs text-mut">({i.status === 'overdue' ? 'বকেয়া' : 'আসন্ন'})</span></span>
            <b className="num text-sm">{tk(i.amount)}</b>
          </button>
        )) : <p className="text-sm text-mut">আগামী ৭ দিনে কোনো কিস্তি নেই।</p>}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Banknote size={15} />} onClick={() => navigate(`/a/qh/loans/${loan.id}/repay${qs}`)} disabled={loan.status !== 'active' && loan.status !== 'arrears'}>পরিশোধ এন্ট্রি</Button>
        <Button variant="secondary" icon={<CheckCircle2 size={15} />} onClick={doClose} disabled={out > 0}>সমাপ্তি ও সনদ</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/arrears${qs}`)}>বকেয়া</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/writeoff${qs}`)}>Write-off</Button>
      </div>

      <Accordion title="আগাম পরিশোধ ও পুনর্গঠন — তিন বিকল্প" sub="সবগুলোতে মোট = মূলধন, সুদ যোগ হয় না (D-53)">
        <KV k="১ · স্বাভাবিক" v={`${tk(qhPerInst(loan))} × ${bn(loan.tenure)} = ${tk(loan.principal)}`} />
        <KV k="২ · পুনর্গঠন (মেয়াদ বাড়ানো)" v="কিস্তি ছোট হবে — মোট ফেরত একই মূলধন" />
        <KV k="৩ · আগাম পরিশোধ" v="যেকোনো সময় — কোনো অতিরিক্ত চার্জ নেই" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-sm font-bold mb-1" htmlFor="qh-rs-months">মাস যোগ</label>
            <input id="qh-rs-months" className={inputClass()} inputMode="numeric" value={addMonths} onChange={(e) => setAddMonths(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" htmlFor="qh-rs-cm">কমিটি</label>
            <input id="qh-rs-cm" className={inputClass()} value={committee} onChange={(e) => setCommittee(e.target.value)} />
          </div>
        </div>
        <Button className="mt-2" block variant="secondary" icon={<RefreshCw size={15} />} onClick={doRestructure}>পুনর্গঠন সংরক্ষণ</Button>
        <p className="text-xs text-mut mt-2"><TriangleAlert size={12} className="inline mr-1" />পুনর্গঠনে কমিটি রেফারেন্স বাধ্যতামূলক (D-44) · সদস্যের সম্মতি নিতে হবে।</p>
      </Accordion>
    </div>
  );
}
