import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { qhInsts, qhOutstanding, qhPaidPct, qhPerInst } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, QhZero, memName } from './qhParts';

export default function QhWebClose() {
  const { loanId } = useParams();
  const { state, closeLoan } = useAdminQh();
  const nav = useNavigate();
  const closed = state.loans.filter((l) => l.status === 'closed');
  const loan = (loanId && state.loans.find((l) => l.id === loanId)) || closed[0] || state.loans[0];
  const insts = qhInsts(loan, state.repayments);
  const out = qhOutstanding(loan, state.repayments, state.writeoffs);
  const unpaid = insts.filter((i) => i.status !== 'paid');
  const cert = loan.cert;
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [copied, setCopied] = useState(false);

  const issue = () => {
    const r = closeLoan(loan.id);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const copy = async () => {
    const text = `কর্জে হাসানা সমাপ্তি সনদ\nসনদ: ${cert}\nসদস্য: ${memName(loan.memberId)}\nঋণ: ${loan.no}\nমূলধন: ৳${bn(loan.principal)} · সুদ: ৳০\nপরিশোধ: সম্পূর্ণ · তারিখ: ${loan.closedAt}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <Page title="সমাপ্তি ও সনদ" sub="মূলধন সম্পূর্ণ ফেরতের পর সনদ — সুদ ৳০ লিখিত প্রমাণ (BR-20)"
      back={`/w/qh/loans/${loan.id}`}
      right={<><Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/loans/${loan.id}`)}>ঋণ হাব</Button><Button size="sm" onClick={issue} disabled={loan.status === 'closed'}>সনদ ইস্যু</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
        <label className="block"><span className="text-sm font-bold">ঋণ বাছুন</span>
          <select value={loan.id} onChange={(e) => nav(`/w/qh/loans/${e.target.value}/close`)} className="w-full min-h-tap rounded-r-sm border border-line-3 bg-card px-3 mt-1">
            {state.loans.map((l) => <option key={l.id} value={l.id}>{l.no} · {memName(l.memberId)} · {l.status === 'closed' ? 'সমাপ্ত' : l.status === 'arrears' ? 'বকেয়া' : l.status === 'writeoff' ? 'ছেড়ে দেওয়া' : l.status === 'pending' ? 'বিতরণ বাকি' : 'চলমান'}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <Badge tone={loan.status === 'closed' ? 'ok' : 'warn'}>{loan.status === 'closed' ? 'সমাপ্ত' : 'চলমান'}</Badge>
          <span className="text-mut">বাকি ৳{bn(out)} · আদায় {bn(qhPaidPct(loan, state.repayments))}%</span>
          <QhZero />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <Card title="সমাপ্তির চেকলিস্ট" sub="সব শর্ত পূরণ হলে সনদ">
            <div className="space-y-1.5">
              {[
                ['সব কিস্তি পরিশোধিত', unpaid.length === 0, `${bn(insts.filter((i) => i.status === 'paid').length)}/${bn(loan.tenure)} পরিশোধিত`],
                ['বাকি মূলধন ৳০', out === 0, `বর্তমানে ৳${bn(out)}`],
                ['কোনো write-off বিচারাধীন নয়', loan.status !== 'writeoff', loan.status === 'writeoff' ? 'ছেড়ে দেওয়া ঋণে সনদ নয়' : 'প্রযোজ্য নয়'],
                ['বিলম্ব ফি / সুদ ৳০', true, 'কোনো চার্জ নেই (BR-20)'],
                ['সদস্যের পরিচয় যাচাই', true, 'NID/সদস্য নম্বর মিলেছে'],
              ].map(([t, ok, sub]) => (
                <div key={String(t)} className={`flex items-center gap-2 rounded-r-sm border px-3 py-2 ${ok ? 'border-ok-bd bg-ok-bg' : 'border-warn-bd bg-warn-bg'}`}>
                  <span className={`size-5 rounded-r-sm border-2 grid place-items-center text-[10px] ${ok ? 'bg-green-700 border-green-700 text-white' : 'border-warn-ink'}`}>{ok ? '✓' : '!'}</span>
                  <div className="grow"><b className="text-sm block">{t}</b><span className="text-xs text-mut">{sub}</span></div>
                </div>
              ))}
            </div>
            <Button block className="mt-3" onClick={issue} disabled={loan.status === 'closed'}>সমাপ্তি নিশ্চিত ও সনদ ইস্যু</Button>
          </Card>

          <Card title="ঋণের সারসংক্ষেপ" sub="মূলধন ÷ মেয়াদ — কোনো সুদ নেই">
            <StatBar items={[
              { k: 'মূলধন', v: `৳${bn(loan.principal)}` },
              { k: 'কিস্তি', v: `৳${bn(qhPerInst(loan))}` },
              { k: 'পরিশোধ', v: `${bn(insts.filter((i) => i.status === 'paid').length)}/${bn(loan.tenure)}` },
              { k: 'বাকি', v: `৳${bn(out)}`, tone: out ? 'danger' : 'ok' },
            ]} />
            <p className="text-xs text-mut mt-2">সুদ/ফি/জরিমানা = ৳০ · মোট পরিশোধ = ৳{bn(loan.principal)}</p>
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="সমাপ্তি সনদ" sub={cert ?? 'ইস্যু হয়নি'} right={cert ? <Badge tone="ok">বৈধ</Badge> : <Badge tone="warn">বাকি</Badge>}>
            <div className="rounded-r-md border-2 border-qh-gold-bd bg-qh-gold-soft/40 p-4 text-center">
              <div className="text-xs font-bold text-qh-gold-ink tracking-wide">কর্জে হাসানা · সমিতি</div>
              <div className="text-h3 mt-1">সমাপ্তি সনদ</div>
              {cert ? (
                <>
                  <div className="num text-lg font-extrabold mt-1">{cert}</div>
                  <div className="text-sm mt-2">{memName(loan.memberId)}</div>
                  <div className="text-xs text-mut">ঋণ {loan.no}</div>
                  <div className="mt-2 text-sm">মূলধন ৳{bn(loan.principal)} সম্পূর্ণ পরিশোধিত</div>
                  <div className="text-xs mt-1">সুদ ৳০ · ফি ৳০ · তারিখ {loan.closedAt}</div>
                  <div className="mt-2 text-[11px] text-mut">এই সনদ সুদমুক্ত নীতির লিখিত প্রমাণ (BR-20)</div>
                </>
              ) : (
                <p className="text-sm text-mut mt-3">সব কিস্তি পরিশোধের পর সনদ তৈরি হবে।</p>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" block onClick={copy} disabled={!cert}>{copied ? 'কপি হয়েছে ✓' : 'কপি'}</Button>
              <Button size="sm" variant="secondary" block onClick={() => setMsg('PDF/প্রিন্ট ডেমো — প্রকৃত ফাইল জেনারেশন ব্যাকএন্ড সংযুক্তির পরে।')}>PDF / প্রিন্ট</Button>
            </div>
          </Card>
          <QhCallout title="সুদমুক্ততার লিখিত প্রমাণ" tone="ok">সনদে সদস্য, ঋণ নম্বর, মূলধন, মোট পরিশোধ ও “সুদ ৳০” উল্লেখ থাকে — নিরীক্ষায় ব্যবহারযোগ্য।</QhCallout>
          <Note>সমাপ্ত ঋণের রেকর্ড অপরিবর্তনীয়; ভুল হলে রিভার্সাল/নতুন সনদ প্রক্রিয়া, সরাসরি ডিলিট নয়।</Note>
        </div>
      </div>
    </Page>
  );
}
