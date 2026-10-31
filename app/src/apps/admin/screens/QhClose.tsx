/* QAM-15 · সমাপ্তি ও সনদ — বাকি মূলধন ৳০ হলে সনদ ইস্যু (BR-20) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Check, CheckCircle2, Copy, Download, Printer, QrCode } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner } from '../../../components/form';
import { KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import { qhDate, qhOutstanding, qhPaidPct, qhPerInst, qhProductById, qhRepaid } from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

export default function QhClose() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { loanId } = useParams();
  const { state, closeLoan } = useAdminQh();
  const [pick, setPick] = useState(loanId ?? state.loans.find((l) => l.status === 'closed')?.id ?? state.loans[0].id);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [msg, setMsg] = useState('');

  const loan = state.loans.find((l) => l.id === pick) ?? state.loans[0];
  const member = SEED_MEMBERS.find((m) => m.id === loan.memberId);
  const product = qhProductById(state.products, loan.product)!;
  const out = qhOutstanding(loan, state.repayments, state.writeoffs);
  const closed = loan.status === 'closed';
  const pct = qhPaidPct(loan, state.repayments);

  const issue = () => {
    setErr(''); setOk('');
    const res = closeLoan(loan.id);
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex items-center gap-2 text-xs text-mut">
        <button type="button" onClick={() => navigate(`/a/qh/loans/${loan.id}${qs}`)} className="min-h-tap inline-flex items-center gap-1 font-bold text-green-800"><ArrowLeft size={14} /> ঋণ</button>
        <span className="num">{loan.no}</span>
        <Badge tone={closed ? 'ok' : 'warn'}>{closed ? 'সম্পূর্ণ পরিশোধিত' : `বাকি ${tk(out)}`}</Badge>
        <QhZero />
      </div>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="সনদ ইস্যু">{ok}</SuccessBanner> : null}
      {msg ? <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-sm">{msg}</div> : null}

      <Card title="ঋণ বাছাই" sub="সমাপ্ত ও চলমান — সনদ শুধু বাকি ৳০ হলে">
        <select className="w-full min-h-tap rounded-r-sm border border-line bg-card px-3 text-sm" value={pick} onChange={(e) => { setPick(e.target.value); setMsg(''); }}>
          {state.loans.map((l) => (
            <option key={l.id} value={l.id}>{l.no} · {SEED_MEMBERS.find((m) => m.id === l.memberId)?.name} · {l.status === 'closed' ? 'সমাপ্ত' : l.status === 'arrears' ? 'বকেয়া' : l.status === 'writeoff' ? 'ছেড়ে দেওয়া' : 'চলমান'}</option>
          ))}
        </select>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <span className="shrink-0 size-11 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold text-lg">{member?.photo ?? 'স'}</span>
          <div className="grow min-w-0">
            <b className="text-body font-extrabold">{member?.name}</b>
            <div className="text-xs text-mut num">{member?.no} · {product.code} · {member?.mobile}</div>
          </div>
          <div className="text-right"><div className="num font-extrabold">{bn(pct)}%</div><div className="text-[11px] text-mut">পরিশোধিত</div></div>
        </div>
        <div className="mt-2">
          <KV k="মূলধন" v={tk(loan.principal)} />
          <KV k="আদায়" v={tk(qhRepaid(loan, state.repayments))} />
          <KV k="বাকি" v={<b>{tk(out)}</b>} strong />
          <KV k="কিস্তি" v={`${tk(qhPerInst(loan))} × ${bn(loan.tenure)} · সুদ ৳০`} />
          <KV k="বিতরণ" v={qhDate(loan.disbursedAt)} />
          <KV k="সমাপ্তি" v={qhDate(loan.closedAt)} />
        </div>
        {out > 0 ? <div className="mt-2"><Note tone="warn">বাকি {tk(out)} — সম্পূর্ণ পরিশোধ ছাড়া সনদ ইস্যু হবে না।<br />
          <button type="button" className="min-h-tap mt-1 text-sm font-bold text-green-800" onClick={() => navigate(`/a/qh/loans/${loan.id}/repay${qs}`)}>পরিশোধ এন্ট্রি করুন →</button>
        </Note></div> : null}
      </Card>

      {closed ? (
        <>
          <SectionHead title="সমাপ্তি সনদ" sub={`${loan.cert ?? '—'} · হ্যাশ ${loan.hash || '—'}`} right={<Badge tone="ok"><Award size={11} /> ইস্যুকৃত</Badge>} />
          <div className="rounded-r-md bg-gradient-to-br from-green-800 to-green-700 text-white px-5 py-5 shadow-sh-2 text-center">
            <div className="inline-flex items-center gap-1 rounded-r-pill border border-qh-gold-hi/70 bg-qh-gold/20 px-2.5 py-0.5 text-[11px] font-bold text-qh-gold-soft"><Award size={12} /> কর্জে হাসানা · সমাপ্তি সনদ</div>
            <div className="text-sm mt-3 text-green-100">সমিতির সদস্য</div>
            <div className="text-lg font-extrabold">{member?.name}</div>
            <div className="text-xs text-green-100 num">{member?.no} · {member?.village} · {member?.district}</div>
            <div className="mt-3 text-2xl font-extrabold num">{tk(loan.principal)}</div>
            <div className="text-xs text-green-100">শুধু মূলধন সম্পূর্ণ পরিশোধিত · সুদ ৳০ · কোনো ফি নেই</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-left">
              <div className="rounded-r-sm bg-white/12 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">সনদ নম্বর</i><b className="num">{loan.cert ?? '—'}</b></div>
              <div className="rounded-r-sm bg-white/12 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">হ্যাশ</i><b className="num">{loan.hash || '—'}</b></div>
              <div className="rounded-r-sm bg-white/12 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">বিতরণ</i><b>{qhDate(loan.disbursedAt)}</b></div>
              <div className="rounded-r-sm bg-white/12 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">সমাপ্তি</i><b>{qhDate(loan.closedAt)}</b></div>
            </div>
            <div className="inline-flex items-center gap-1 mt-3 rounded-r-sm bg-white/15 border border-white/30 px-3 py-1.5 text-xs"><QrCode size={14} /> যাচাই কোড · {loan.no}</div>
            <div className="text-[10px] text-green-100 mt-2">কমিটি {loan.committee} · অনুমোদনকারী {loan.appr}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={<Copy size={15} />} onClick={() => { try { navigator.clipboard?.writeText(`${loan.cert} · ${member?.name} · ${tk(loan.principal)} · হ্যাশ ${loan.hash}`); setMsg('সনদের তথ্য কপি হয়েছে'); } catch { setMsg('কপি করা যায়নি — ম্যানুয়ালি লিখে নিন'); } }}>কপি</Button>
            <Button variant="ghost" icon={<Download size={15} />} onClick={() => setMsg('সনদ PDF প্রস্তুত (ডেমো) — ইন-অ্যাপ প্রিভিউতে ডাউনলোড সীমিত')}>PDF</Button>
            <Button variant="ghost" icon={<Printer size={15} />} onClick={() => setMsg('সনদ প্রিন্ট কিউতে পাঠানো হয়েছে (ডেমো)')}>প্রিন্ট</Button>
            <Button variant="ghost" icon={<CheckCircle2 size={15} />} onClick={() => navigate(`/a/qh/reports${qs}`)}>রিপোর্ট</Button>
          </div>
        </>
      ) : (
        <Card title="সনদ এখনো ইস্যু হয়নি" sub="শর্ত: বাকি মূলধন ৳০">
          <div className="space-y-2">
            {[
              ['সব কিস্তি পরিশোধিত', out === 0],
              ['মূলধন = আদায় + ছেড়ে দেওয়া', out === 0],
              ['রসিদ নম্বর অপরিবর্তনীয় (BR-08)', true],
              ['সুদ / ফি ৳০ (BR-20)', true],
            ].map(([t, on]) => (
              <div key={String(t)} className="flex items-center gap-2 text-sm">
                <span className={`size-5 rounded-r-sm grid place-items-center ${on ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink'}`}>{on ? <Check size={12} /> : '—'}</span>
                <span className={on ? 'font-bold' : 'text-mut'}>{t}</span>
              </div>
            ))}
          </div>
          <Button className="mt-3" block icon={<Award size={15} />} onClick={issue} disabled={out > 0}>সমাপ্তি সনদ ইস্যু করুন</Button>
          <p className="text-xs text-mut mt-2">সনদ নম্বর ও হ্যাশ অপরিবর্তনীয় — ইস্যুর পর সংশোধন শুধু বিপরীত এন্ট্রি দিয়ে (R-02)।</p>
        </Card>
      )}

      <Card title="সনদের নিয়ম" sub="BR-20 · BR-22 · BR-23">
        <KV k="শর্ত" v="বাকি মূলধন ৳০" />
        <KV k="যা প্রমাণ করে" v="শুধু মূলধন ফেরত — কোনো সুদ/চার্জ নয়" />
        <KV k="ইস্যুকারী" v="ACCOUNTANT · MANAGER · APPROVER (maker ≠ checker)" />
        <KV k="write-off হলে" v="সনদ নয় — ক্ষতি হিসেবে আলাদা রেকর্ড (BR-23)" />
      </Card>
    </div>
  );
}
