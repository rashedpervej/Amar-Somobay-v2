/* QAM-17 · QH রিপোর্ট — পোর্টফোলিও, শ্রেণিকরণ, উদ্দেশ্য-বণ্টন, পুল ও নিরীক্ষা ব্যতিক্রম (D-69) */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, HeartHandshake, Landmark, Printer, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { Accordion, KV, Note, Progress } from './parts';
import { QhHero, QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_CLASS, qhClassOf, qhDate, qhLoanById, qhOutstanding, qhPoolState, qhPortfolio, qhPurposeStats,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

export default function QhReports() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminQh();
  const [period, setPeriod] = useState<'all' | 'oct'>('all');
  const [msg, setMsg] = useState('');

  const pf = qhPortfolio(state.loans, state.repayments, state.writeoffs);
  const pool = qhPoolState(state.window, state.loans, state.apps);
  const active = state.loans.filter((l) => l.status !== 'pending');
  const age = ['regular', 'watch', 'late', 'doubt', 'loss'].map((k) => ({
    k, n: active.filter((l) => qhClassOf(l, state.repayments) === k).length,
    amt: active.filter((l) => qhClassOf(l, state.repayments) === k).reduce((s, l) => s + qhOutstanding(l, state.repayments, state.writeoffs), 0),
  }));
  const overCap = state.apps.filter((a) => a.decision?.amount && a.decision.amount > a.snapshot.maxAmount);
  const purposeStats = qhPurposeStats(state.loans, state.apps, state.writeoffs);
  const families = new Set(state.loans.filter((l) => l.status !== 'pending').map((l) => l.memberId)).size;

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand"><TrendingUp size={12} /> QH রিপোর্ট</Badge>
        <Badge tone="neutral">৩১ অক্টো ২০২৬</Badge>
        <QhZero />
      </div>

      <Chipset>
        <Chip active={period === 'all'} onClick={() => setPeriod('all')}>সব সময়</Chip>
        <Chip active={period === 'oct'} onClick={() => setPeriod('oct')}>অক্টোবর ২০২৬</Chip>
      </Chipset>
      {msg ? <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-sm">{msg}</div> : null}

      <QhHero label="মোট বিতরণ (মূলধন)" amount={tk(pf.disbursed)}
        sub={`আদায় ${tk(pf.repaid)} · বাকি ${tk(pf.outstanding)} · সুদ ৳০`}>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">আদায়ের হার</i><b className="num">{bn(pf.collectionRate)}%</b></div>
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">পরিবার</i><b className="num">{bn(families)}</b></div>
          <div className="rounded-r-sm bg-qh-gold/25 border border-qh-gold-hi/60 px-2 py-1.5"><i className="not-italic text-qh-gold-soft block">সুদ আয়</i><b className="num">৳০</b></div>
        </div>
      </QhHero>

      <KpiGrid>
        <Kpi label="ঋণ" value={bn(pf.loans)} unit="টি" note={`চলমান ${bn(pf.active + pf.arrearsLoans)} · সমাপ্ত ${bn(pf.closed)}`} />
        <Kpi label="ছেড়ে দেওয়া" value={`৳${bn(pf.writeOff)}`} tone="danger" note="নিরীক্ষায় আলাদা (BR-23)" />
        <Kpi label="বকেয়া" value={`৳${bn(pf.arrears)}`} tone="warn" note={`${bn(pf.arrearsLoans)}টি ঋণ`} />
        <Kpi label="পুলে মুক্ত" value={`৳${bn(pool.available)}`} tone="ok" note={`বরাদ্দ ৳${bn(pool.allocated)} (D-40)`} />
      </KpiGrid>

      <SectionHead title="শ্রেণিকরণ ও বয়স" sub="বিলম্বের দিন থেকে স্বয়ংক্রিয় — কোনো চার্জ নেই (D-44)" />
      <Card>
        {age.map((a) => (
          <div key={a.k} className="py-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5"><Badge tone={QH_CLASS[a.k].tone}>{QH_CLASS[a.k].t}</Badge></span>
              <span className="num text-mut">{bn(a.n)}টি · {tk(a.amt)}</span>
            </div>
            <div className="mt-1"><Progress pct={pf.loans ? Math.round((a.n / Math.max(1, active.length)) * 100) : 0} tone={a.k === 'regular' ? 'ok' : a.k === 'watch' || a.k === 'late' ? 'warn' : 'danger'} /></div>
          </div>
        ))}
      </Card>

      <SectionHead title="উদ্দেশ্য-বণ্টন (D-69)" sub="কোন প্রয়োজনে কত মূলধন গেছে" />
      <Card>
        <div className="space-y-2">
          {purposeStats.map((p) => (
            <div key={p.k} className="flex items-center gap-2 text-xs">
              <span className="w-[38%] shrink-0 text-mut truncate">{p.t}</span>
              <span className="grow h-2.5 rounded-r-pill bg-line-2 overflow-hidden">
                <span className="block h-full rounded-r-pill bg-green-700" style={{ width: `${pf.disbursed ? Math.round((p.amount / pf.disbursed) * 100) : 0}%` }} />
              </span>
              <b className="num w-7 text-right">{bn(p.loans)}</b>
              <b className="num w-[34%] text-right">{tk(p.amount)}</b>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-mut">পরিবার {bn(families)}টি · মোট {tk(pf.disbursed)} · সবই মূলধন, কোনো সুদ নয়।</div>
      </Card>

      <SectionHead title="পুল ও আদায়" sub="D-40 · D-51" />
      <Card>
        <KV k="পুল বরাদ্দ" v={tk(pool.allocated)} />
        <KV k="হল্ড" v={tk(pool.held)} />
        <KV k="প্রতিশ্রুতি" v={tk(pool.committed)} />
        <KV k="মুক্ত" v={<b className="text-ok-ink">{tk(pool.available)}</b>} strong />
        <KV k="উৎস" v={pool.source} />
        <KV k="কোটা" v={`${bn(state.window.used)}/${bn(state.window.quota)} · ওয়েটলিস্ট ${bn(state.window.waitlist)}`} />
        <div className="mt-2"><Note tone="info">মুক্ত = বরাদ্দ − হল্ড − প্রতিশ্রুতি; সদস্যের সঞ্চয় থেকে আলাদা সাব-খাত (§৪.২)।</Note></div>
      </Card>

      <SectionHead title="নিরীক্ষা ব্যতিক্রম" sub={`${bn(overCap.length)}টি · সীমার বাইরে অনুমোদন`} right={<Badge tone="warn"><ShieldAlert size={11} /> D-45</Badge>} />
      <Card>
        {overCap.length ? overCap.map((a) => {
          const m = SEED_MEMBERS.find((x) => x.id === a.memberId);
          return (
            <button key={a.id} type="button" onClick={() => navigate(`/a/qh/applications/${a.id}${qs}`)} className="min-h-tap w-full text-left border-b border-line-2 last:border-b-0 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold num">{a.no}</span>
                <span className="text-xs num">{tk(a.decision?.amount ?? 0)} / সীমা {tk(a.snapshot.maxAmount)}</span>
              </div>
              <div className="text-xs text-mut">{m?.name} · {a.decision?.committee} · {a.decision?.note?.slice(0, 70) ?? 'কারণ লেখা নেই'}</div>
            </button>
          );
        }) : <p className="text-sm text-mut">কোনো সীমা-বহির্ভূত অনুমোদন নেই।</p>}
        <div className="mt-2 text-xs text-mut">প্রতিটি ব্যতিক্রমে কমিটি রেফারেন্স ও লিখিত কারণ আবশ্যক (D-45 · D-59)।</div>
      </Card>

      <SectionHead title="সম্পন্ন write-off" sub={`${bn(state.writeoffs.filter((w) => w.status === 'done').length)}টি`} />
      <Card>
        {state.writeoffs.filter((w) => w.status === 'done').map((w) => {
          const l = qhLoanById(state.loans, w.loan);
          return (
            <div key={w.id} className="border-b border-line-2 last:border-b-0 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold num">{w.no}</span>
                <span className="text-sm num">{tk(w.amount)}</span>
              </div>
              <div className="text-xs text-mut">{SEED_MEMBERS.find((m) => m.id === l?.memberId)?.name} · {qhDate(w.decidedAt)} · {w.committee}</div>
            </div>
          );
        })}
      </Card>

      <Accordion title="রিপোর্টের নিয়ম" sub="সব অঙ্ক derived — হার্ডকোড নয়">
        <KV k="মোট বিতরণ" v="সব অ-বিচারাধীন ঋণের মূলধন" />
        <KV k="আদায়" v="সব রসিদের যোগফল (অপরিবর্তনীয়)" />
        <KV k="বাকি" v="মূলধন − আদায় − write-off" />
        <KV k="সুদ" v="সবসময় ৳০ — কোনো আয় খাত নেই (BR-20)" />
        <div className="mt-2 flex items-center gap-1 text-xs text-mut"><HeartHandshake size={13} /> সামাজিক প্রভাব উদ্দেশ্য-ক্যাটাগরি থেকে গণনা (D-69) — হার্ডকোড নয়।</div>
      </Accordion>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Download size={15} />} onClick={() => setMsg(`QH রিপোর্ট প্রস্তুত (${period === 'all' ? 'সব সময়' : 'অক্টোবর ২০২৬'}) — ডেমোতে CSV জেনারেট হয়েছে; ডাউনলোড ইন-অ্যাপ প্রিভিউতে সীমিত`)}>CSV</Button>
        <Button variant="ghost" icon={<Printer size={15} />} onClick={() => setMsg('রিপোর্ট প্রিন্ট কিউতে পাঠানো হয়েছে (ডেমো)')}>প্রিন্ট</Button>
        <Button variant="ghost" icon={<Landmark size={15} />} onClick={() => navigate(`/a/qh/window${qs}`)}>পুল ও জানালা</Button>
        <Button variant="ghost" icon={<Users size={15} />} onClick={() => navigate(`/a/qh/eligible${qs}`)}>যোগ্য তালিকা</Button>
      </div>
      <p className="text-xs text-mut"><Eye size={12} className="inline mr-1" />সব সংখ্যা {bn(state.loans.length)}টি ঋণ ও {bn(state.repayments.length)}টি রসিদ থেকে গণনা — কোথাও সুদ বা ফি নেই।</p>
      <div className="rounded-r-sm border border-line bg-card-2 px-3 py-2 text-xs text-mut">
        <QhZero /> · পণ্য: {state.products.map((p) => p.code).join(', ')} · সময়কাল {period === 'all' ? 'সব' : 'অক্টো ২০২৬'}
      </div>
    </div>
  );
}
