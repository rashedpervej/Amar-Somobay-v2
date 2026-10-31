/* QAM-11 · ঋণ হাব — অবস্থাভিত্তিক গ্রুপ, বাকি মূলধন ও সুদ ৳০ নিশ্চয়তা */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Banknote, ChevronRight, Search, TriangleAlert, Users } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { Accordion, KV, Progress } from './parts';
import { QhHero, QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_CLASS, QH_LOAN_ST, qhArrearsOf, qhClassOf, qhInsts, qhNextInst, qhOutstanding, qhPaidPct, qhPortfolio,
  qhProductById, type QhLoan,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

const GROUPS: { k: QhLoan['status'] | 'all'; t: string }[] = [
  { k: 'all', t: 'সব' },
  { k: 'pending', t: 'বিতরণ বাকি' },
  { k: 'active', t: 'চলমান' },
  { k: 'arrears', t: 'বকেয়া' },
  { k: 'closed', t: 'সমাপ্ত' },
  { k: 'writeoff', t: 'ছেড়ে দেওয়া' },
];

export default function QhLoans() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminQh();
  const [group, setGroup] = useState<QhLoan['status'] | 'all'>('all');
  const [product, setProduct] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState(false);

  const pf = qhPortfolio(state.loans, state.repayments, state.writeoffs);
  const list = state.loans
    .filter((l) => group === 'all' || l.status === group)
    .filter((l) => product === 'all' || l.product === product)
    .filter((l) => {
      if (!q.trim()) return true;
      const m = SEED_MEMBERS.find((x) => x.id === l.memberId);
      return `${l.no} ${m?.name} ${m?.no}`.toLowerCase().includes(q.toLowerCase());
    });

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand"><Banknote size={12} /> {bn(pf.loans)}টি ঋণ</Badge>
        <Badge tone="neutral">বিতরণ {tk(pf.disbursed)}</Badge>
        <QhZero />
      </div>

      <QhHero label="বাকি মূলধন (সম্পদ)" amount={tk(pf.outstanding)}
        sub={`বিতরণ ${tk(pf.disbursed)} · আদায় ${tk(pf.repaid)} · ছেড়ে দেওয়া ${tk(pf.writeOff)}`}>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">আদায়ের হার</i><b className="num">{bn(pf.collectionRate)}%</b></div>
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2 py-1.5"><i className="not-italic text-green-100 block">চলমান</i><b className="num">{bn(pf.active + pf.arrearsLoans)}টি</b></div>
          <div className="rounded-r-sm bg-qh-gold/25 border border-qh-gold-hi/60 px-2 py-1.5"><i className="not-italic text-qh-gold-soft block">সুদ</i><b className="num">৳০</b></div>
        </div>
      </QhHero>

      <KpiGrid>
        <Kpi label="বিতরণ বাকি" value={bn(pf.pendingDisb)} unit="টি" tone="warn" note="OTP গেট (BR-22)" />
        <Kpi label="বকেয়া" value={bn(pf.arrearsLoans)} unit="টি" tone="warn" note={`৳${bn(pf.arrears)} বকেয়া`} />
        <Kpi label="সমাপ্ত" value={bn(pf.closed)} unit="টি" tone="ok" note="সনদ ইস্যু" />
        <Kpi label="ছেড়ে দেওয়া" value={`৳${bn(pf.writeOff)}`} tone="danger" note="নিরীক্ষায় আলাদা (BR-23)" />
      </KpiGrid>

      <Chipset>
        {GROUPS.map((g) => (
          <Chip key={g.k} active={group === g.k} onClick={() => setGroup(g.k)}>
            {g.t} ({bn(g.k === 'all' ? state.loans.length : state.loans.filter((l) => l.status === g.k).length)})
          </Chip>
        ))}
      </Chipset>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={product === 'all'} onClick={() => setProduct('all')}>সব পণ্য</Chip>
        {state.products.map((p) => <Chip key={p.id} active={product === p.id} onClick={() => setProduct(p.id)}>{p.code}</Chip>)}
        <button type="button" onClick={() => setSearch((v) => !v)} className="min-h-tap px-2 text-xs font-bold text-green-800 inline-flex items-center gap-1"><Search size={14} /> খুঁজুন</button>
      </div>
      {search ? (
        <input className="w-full min-h-tap rounded-r-sm border border-line bg-card px-3 text-sm" placeholder="ঋণ নম্বর বা সদস্যের নাম" value={q} onChange={(e) => setQ(e.target.value)} />
      ) : null}

      <SectionHead title="ঋণ তালিকা" sub={`${bn(list.length)}টি · সদস্যভিত্তিক`} />
      {list.length === 0 ? <Card><p className="text-sm text-mut">এই ফিল্টারে কোনো ঋণ নেই।</p></Card> : list.map((l) => {
        const m = SEED_MEMBERS.find((x) => x.id === l.memberId);
        const pct = qhPaidPct(l, state.repayments);
        const nx = qhNextInst(l, state.repayments);
        const p = qhProductById(state.products, l.product);
        return (
          <button key={l.id} type="button" onClick={() => navigate(`/a/qh/loans/${l.id}${qs}`)}
            className="min-h-tap w-full text-left rounded-r-md bg-card border border-line shadow-sh-1 px-3.5 py-3">
            <div className="flex items-start gap-2">
              <span className="shrink-0 size-9 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold">{m?.photo ?? 'স'}</span>
              <div className="grow min-w-0">
                <div className="text-body font-extrabold truncate">{m?.name}</div>
                <div className="text-xs text-mut num">{l.no} · {p?.code} · কিস্তি {bn(qhInsts(l, state.repayments).filter((i) => i.status === 'paid').length)}/{bn(l.tenure)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="num text-body font-extrabold">{tk(qhOutstanding(l, state.repayments, state.writeoffs))}</div>
                <div className="text-[11px] text-mut">বাকি</div>
              </div>
            </div>
            <div className="mt-2"><Progress pct={pct} tone={l.status === 'arrears' ? 'danger' : pct >= 60 ? 'ok' : 'warn'} /></div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge tone={QH_LOAN_ST[l.status].tone}>{QH_LOAN_ST[l.status].t}</Badge>
              <Badge tone={QH_CLASS[qhClassOf(l, state.repayments)].tone}>{QH_CLASS[qhClassOf(l, state.repayments)].t}</Badge>
              {nx ? <Badge tone="neutral">পরবর্তী কিস্তি {bn(nx.no)} · {tk(nx.amount)}</Badge> : null}
              {l.status === 'pending' ? <Badge tone="danger"><TriangleAlert size={11} /> OTP বাকি</Badge> : null}
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-mut">{tk(l.principal)} · {l.status === 'arrears' ? `${tk(qhArrearsOf(l, state.repayments))} বকেয়া` : l.status === 'closed' ? `সনদ ${l.cert ?? '—'}` : 'সুদ ৳০'}</span>
              <ChevronRight size={15} className="text-mut" />
            </div>
          </button>
        );
      })}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Users size={15} />} onClick={() => navigate(`/a/qh/arrears${qs}`)}>বকেয়া রেজিস্টার</Button>
        <Button icon={<Banknote size={15} />} onClick={() => navigate('/a/qh/disburse' + qs)}>বিতরণ (OTP)</Button>
        <Button variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate(`/a/qh/reports${qs}`)}>রিপোর্ট</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/writeoff${qs}`)}>Write-off</Button>
      </div>

      <Accordion title="খাত ও BR-20…BR-23 সারাংশ" sub="শুধু মূলধন — কোনো সুদ আয় নেই">
        <KV k="সুদ আয়" v={<b className="text-ok-ink">৳০ (খাতা নেই)</b>} />
        <KV k="বিলম্ব ফি" v="৳০ · সুদ-সমতুল্য বিবেচিত (D-41)" />
        <KV k="শ্রেণিকরণ" v="বকেয়ার দিন থেকে স্বয়ংক্রিয় (D-44) — কোনো চার্জ যোগ হয় না" />
        <KV k="write-off" v="কমিটি রেফারেন্স + ORG_ADMIN + নিরীক্ষক অ্যালার্ট (BR-23)" />
        <KV k="ডাবল-এন্ট্রি" v="প্রতিটি বিতরণে ডেবিট আদায়যোগ্য / ক্রেডিট পুল (R-01)" />
        <div className="mt-2 text-xs text-mut">বাকি মূলধন = মূলধন − আদায় − ছেড়ে দেওয়া। যোগফল সবসময় মূলধনেই ফেরে, কখনো বেশি নয়।</div>
      </Accordion>
    </div>
  );
}
