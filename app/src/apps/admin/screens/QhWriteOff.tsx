/* QAM-16 · Write-off ব্যবস্থাপনা — কমিটি রেফারেন্স, ORG_ADMIN অনুমোদন ও নিরীক্ষক অ্যালার্ট (BR-23) */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileWarning, ShieldAlert, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { Accordion, KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import { qhArrearsOf, qhDate, qhDaysLate, qhOutstanding, qhPortfolio, qhProductById } from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

export default function QhWriteOff() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, proposeWriteOff, approveWriteOff } = useAdminQh();
  const [loanId, setLoanId] = useState(state.loans.find((l) => l.status === 'arrears')?.id ?? state.loans[0].id);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [committee, setCommittee] = useState('CM-2610-08');
  const [approver, setApprover] = useState('কামরুল হাসান (সমিতি প্রশাসক)');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const loan = state.loans.find((l) => l.id === loanId) ?? state.loans[0];
  const member = SEED_MEMBERS.find((m) => m.id === loan.memberId);
  const out = qhOutstanding(loan, state.repayments, state.writeoffs);
  const pf = qhPortfolio(state.loans, state.repayments, state.writeoffs);
  const proposed = state.writeoffs.filter((w) => w.status === 'proposed');
  const done = state.writeoffs.filter((w) => w.status === 'done');

  const submit = () => {
    setErr(''); setOk('');
    const res = proposeWriteOff(loan.id, Number(amount) || 0, reason, committee.trim().toUpperCase());
    if (!res.ok) setErr(res.message); else { setOk(res.message); setReason(''); setAmount(''); }
  };

  const approve = (id: string) => {
    setErr(''); setOk('');
    const res = approveWriteOff(id, approver);
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="rounded-r-sm border border-danger-bd bg-danger-bg px-3 py-2.5 text-sm text-danger-ink">
        <b className="inline-flex items-center gap-1"><FileWarning size={15} /> Write-off = ক্ষতি, দায় মেটেনি</b>
        <p className="text-xs mt-0.5">কমিটি রেফারেন্স, ORG_ADMIN অনুমোদন ও নিরীক্ষক অ্যালার্ট বাধ্যতামূলক (BR-23 · D-44)। কোনো সুদ বা চার্জ এখানে নেই।</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-mut">
        <button type="button" onClick={() => navigate(`/a/qh/arrears${qs}`)} className="min-h-tap inline-flex items-center gap-1 font-bold text-green-800"><ArrowLeft size={14} /> বকেয়া</button>
        <Badge tone="warn">{bn(proposed.length)}টি বিচারাধীন</Badge>
        <QhZero />
      </div>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="সংরক্ষিত">{ok}</SuccessBanner> : null}

      <KpiGrid>
        <Kpi label="বিচারাধীন প্রস্তাব" value={bn(proposed.length)} unit="টি" tone="warn" note="ORG_ADMIN অনুমোদন বাকি" />
        <Kpi label="সম্পন্ন write-off" value={bn(done.length)} unit="টি" tone="danger" note="নিরীক্ষায় আলাদা" />
        <Kpi label="মোট ক্ষতি" value={`৳${bn(pf.writeOff)}`} tone="danger" note="দায় মেটেনি" />
        <Kpi label="বকেয়া ঋণ" value={bn(state.loans.filter((l) => l.status === 'arrears').length)} unit="টি" note="আগে পুনর্গঠন দেখুন" />
      </KpiGrid>

      <SectionHead title="বিচারাধীন প্রস্তাব" sub={`${bn(proposed.length)}টি · maker ≠ checker অনুমোদন`} />
      {proposed.length === 0 ? <Card><p className="text-sm text-mut">কোনো write-off প্রস্তাব বিচারাধীন নেই।</p></Card> : proposed.map((w) => {
        const l = state.loans.find((x) => x.id === w.loan);
        const m = SEED_MEMBERS.find((x) => x.id === l?.memberId);
        return (
          <Card key={w.id} title={`${w.no} · ${m?.name ?? '—'}`} sub={`${l?.no ?? ''} · বাকি ${tk(l ? qhOutstanding(l, state.repayments, state.writeoffs) : 0)}`}
            right={<Badge tone="warn"><AlertTriangle size={11} /> অনুমোদন বাকি</Badge>}>
            <KV k="প্রস্তাবিত অঙ্ক" v={tk(w.amount)} />
            <KV k="কারণ" v={w.reason} />
            <KV k="কমিটি" v={w.committee} />
            <KV k="প্রস্তাবকারী (maker)" v={w.by} />
            <div className="mt-2">
              <label className="block text-sm font-bold mb-1" htmlFor={`wo-appr-${w.id}`}>অনুমোদনকারী (checker)</label>
              <input id={`wo-appr-${w.id}`} className={inputClass()} value={approver} onChange={(e) => setApprover(e.target.value)} />
            </div>
            <Button className="mt-2" block icon={<CheckCircle2 size={15} />} onClick={() => approve(w.id)}>অনুমোদন ও নিরীক্ষক অ্যালার্ট</Button>
            <div className="mt-2"><Note tone="warn">বিকল্প: পুনর্গঠন — কিস্তি ছোট করে আদায়ের চেষ্টা আগে (D-44)।</Note></div>
          </Card>
        );
      })}

      <SectionHead title="নতুন write-off প্রস্তাব" sub="শুধু আদায়ের সব পথ ব্যর্থ হলে" />
      <Card>
        <label className="block text-sm font-bold mb-1" htmlFor="wo-loan">ঋণ</label>
        <select id="wo-loan" className={inputClass()} value={loanId} onChange={(e) => { setLoanId(e.target.value); setAmount(''); }}>
          {state.loans.filter((l) => l.status === 'arrears' || l.status === 'active').map((l) => {
            const m = SEED_MEMBERS.find((x) => x.id === l.memberId);
            return <option key={l.id} value={l.id}>{l.no} · {m?.name} · বাকি {tk(qhOutstanding(l, state.repayments, state.writeoffs))}</option>;
          })}
        </select>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5"><i className="not-italic text-mut block">বাকি মূলধন</i><b className="num">{tk(out)}</b></div>
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5"><i className="not-italic text-mut block">বিলম্ব / বকেয়া</i><b className="num">{bn(qhDaysLate(loan, state.repayments))} দিন · {tk(qhArrearsOf(loan, state.repayments))}</b></div>
        </div>

        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="wo-amt">প্রস্তাবিত অঙ্ক (৳)</label>
        <input id="wo-amt" className={inputClass()} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(out)} />
        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="wo-reason">কারণ (কমপক্ষে ১০ অক্ষর)</label>
        <textarea id="wo-reason" className={inputClass()} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="আদায়ের সব চেষ্টা, সম্পদ ও আয়ের উৎস পাওয়া যায়নি — কমিটির লিখিত সিদ্ধান্ত" />
        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="wo-cm">কমিটি রেফারেন্স</label>
        <input id="wo-cm" className={inputClass()} value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="CM-YYMM-##" />
        <Button className="mt-3" block variant="secondary" icon={<ShieldAlert size={15} />} onClick={submit}>প্রস্তাব সংরক্ষণ</Button>
        <p className="text-xs text-mut mt-2">প্রস্তাবকারী নিজে অনুমোদন করতে পারবেন না (BR-22)। অঙ্ক বাকি মূলধনের বেশি হতে পারবে না।</p>
      </Card>

      <SectionHead title="সম্পন্ন write-off" sub={`${bn(done.length)}টি · নিরীক্ষা রিপোর্টে আলাদাভাবে দৃশ্যমান`} />
      {done.map((w) => {
        const l = state.loans.find((x) => x.id === w.loan);
        const m = SEED_MEMBERS.find((x) => x.id === l?.memberId);
        return (
          <Card key={w.id} title={`${w.no} · ${m?.name ?? '—'}`} sub={`${l?.no ?? ''} · ${qhDate(w.decidedAt)}`} right={<Badge tone="neutral"><Trash2 size={11} /> ছেড়ে দেওয়া</Badge>}>
            <KV k="অঙ্ক" v={tk(w.amount)} />
            <KV k="কমিটি" v={w.committee} />
            <KV k="প্রস্তাবকারী" v={w.by} />
            <KV k="অনুমোদনকারী" v={w.approvedBy ?? '—'} />
            <p className="text-xs text-mut mt-1">{w.note}</p>
          </Card>
        );
      })}

      <Accordion title="নীতি ও সীমা (BR-23 · D-44)" sub="write-off মানে ঋণ মাফ নয় — দায় মেটেনি">
        <KV k="কার অনুমোদন" v="ORG_ADMIN (checker) — প্রস্তাবকারী নয়" />
        <KV k="কমিটি" v="লিখিত সিদ্ধান্ত + রফারেন্স CM-YYMM-##" />
        <KV k="নিরীক্ষক" v="স্বয়ংক্রিয় অ্যালার্ট ও রিপোর্টে আলাদা লাইন" />
        <KV k="খাতা" v="ক্ষতি ডেবিট — আদায়যোগ্য থেকে বাদ" />
        <KV k="পুনর্গঠন আগে" v="কিস্তি কাঠামো বদলে আদায়ের সুযোগ আগে দেখতে হবে" />
        <div className="mt-2"><Note tone="danger">write-off-এ কোনো সুদ বা জরিমানা যোগ হয় না — এটি সম্পূর্ণ মূলধনের ক্ষতি (BR-20)।</Note></div>
      </Accordion>

      <Card title="সংক্ষিপ্ত" sub="পণ্য অনুযায়ী বাকি">
        {state.products.map((p) => (
          <KV key={p.id} k={`${p.code} · ${p.name}`} v={`${bn(state.loans.filter((l) => l.product === p.id && l.status === 'arrears').length)}টি বকেয়া · ${tk(state.loans.filter((l) => l.product === p.id && l.status === 'arrears').reduce((s, l) => s + qhOutstanding(l, state.repayments, state.writeoffs), 0))}`} />
        ))}
      </Card>
      <p className="text-xs text-mut">সর্বশেষ প্রস্তাবকারী: মোঃ আব্দুল্লাহ (ব্যবস্থাপক) · {qhProductById(state.products, loan.product)?.code} · {member?.no}</p>
    </div>
  );
}
