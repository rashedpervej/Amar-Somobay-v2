/* QAM-01 · QH ড্যাশবোর্ড — পুল, অমীমাংসিত কাজ, বকেয়া ও জানালার অবস্থা */

import { useNavigate } from 'react-router-dom';
import { ArrowRight, Banknote, CalendarClock, ChevronRight, FileText, HandCoins, HeartHandshake, TriangleAlert, Users } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { Accordion, KV, Note, Progress } from './parts';
import { QhHero, QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_CLASS, QH_LOAN_ST, qhArrearsOf, qhClassOf, qhDaysLate, qhInsts, qhNextInst, qhPaidPct,
  qhPoolState, qhPortfolio, qhQueue, type QhLoan,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

const memName = (id: string) => SEED_MEMBERS.find((m) => m.id === id)?.name ?? id;

export default function QhDashboard() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminQh();
  const go = (p: string) => navigate(`${p}${qs}`);

  const pf = qhPortfolio(state.loans, state.repayments, state.writeoffs);
  const pool = qhPoolState(state.window, state.loans, state.apps);
  const queue = qhQueue(state.apps);
  const pendingLoans = state.loans.filter((l) => l.status === 'pending');
  const proposed = state.writeoffs.filter((w) => w.status === 'proposed');
  const bad = state.loans.filter((l) => l.status === 'arrears');
  const active = state.loans.filter((l) => l.status === 'active' || l.status === 'arrears');
  const todo = queue.length + pendingLoans.length + proposed.length;

  const todoRows = [
    ...pendingLoans.map((l) => ({ id: l.id, kind: 'বিতরণ · OTP বাকি', ref: `${l.no} · ${memName(l.memberId)}`, amt: l.principal, go: `/a/qh/disburse/${l.id}`, tone: 'warn' as const })),
    ...queue.filter((a) => a.status === 'review').map((a) => ({ id: a.id, kind: 'সিদ্ধান্ত বাকি', ref: `${a.no} · ${memName(a.memberId)}`, amt: a.amount, go: `/a/qh/applications/${a.id}/decision`, tone: 'warn' as const })),
    ...proposed.map((w) => ({ id: w.id, kind: 'write-off অনুমোদন', ref: `${w.no} · কমিটি ${w.committee}`, amt: w.amount, go: '/a/qh/writeoff', tone: 'danger' as const })),
  ];

  return (
    <div className="p-4 space-y-3 pb-8">
      <QhHero label="মোট বিতরণ (শুধু মূলধন)" amount={tk(pf.disbursed)}
        sub={`আদায় ${tk(pf.repaid)} (${bn(pf.collectionRate)}%) · বাকি ${tk(pf.outstanding)} · সুদ ৳০`}>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2 py-1.5">
            <i className="not-italic text-green-100 block">ছেড়ে দেওয়া</i><b className="num">{tk(pf.writeOff)}</b>
          </div>
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2 py-1.5">
            <i className="not-italic text-green-100 block">সমাপ্ত ঋণ</i><b className="num">{bn(pf.closed)}টি</b>
          </div>
          <div className="rounded-r-sm bg-qh-gold/25 border border-qh-gold-hi/60 px-2 py-1.5">
            <i className="not-italic text-qh-gold-soft block">সুদ / ফি আয়</i><b className="num">৳০ ✓</b>
          </div>
        </div>
      </QhHero>

      <KpiGrid>
        <Kpi label="পুলে মুক্ত অঙ্ক" value={`৳${bn(pool.available)}`} note={`বরাদ্দ ৳${bn(pool.allocated)} · হল্ড ৳${bn(pool.held)} (D-40)`} />
        <Kpi label="অমীমাংসিত" value={bn(todo)} unit="টি" tone="warn" note={`OTP ${bn(pendingLoans.length)} · পর্যালোচনা ${bn(queue.length)} · write-off ${bn(proposed.length)}`} />
        <Kpi label="বকেয়া ঋণ" value={bn(bad.length)} unit="টি" tone="warn" note={`${tk(pf.arrears)} বকেয়া · বিলম্ব ফি ৳০ (D-41)`} />
        <Kpi label="জানালা ও কোটা" value={state.window.open ? 'খোলা' : 'বন্ধ'} note={`কোটা ${bn(state.window.used)}/${bn(state.window.quota)} · পরবর্তী ১ নভে (D-51)`} />
      </KpiGrid>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Users size={16} />} onClick={() => go('/a/qh/applications')}>আবেদন কিউ {bn(queue.length)}টি</Button>
        <Button variant="secondary" icon={<TriangleAlert size={16} />} onClick={() => go('/a/qh/arrears')}>বকেয়া</Button>
        <Button variant="ghost" icon={<HeartHandshake size={16} />} onClick={() => go('/a/qh/products')}>পণ্য ও নিয়ম</Button>
        <Button variant="ghost" icon={<Banknote size={16} />} onClick={() => go('/a/qh/loans')}>ঋণ হাব</Button>
      </div>

      <SectionHead title="অমীমাংসিত কাজ" sub={`${bn(todo)}টি · দিনশেষ গেট (BR-25)`} />
      {todoRows.length === 0 ? (
        <Card><p className="text-sm text-mut">কোনো অমীমাংসিত কাজ নেই — সব নিষ্পত্তি হয়েছে।</p></Card>
      ) : todoRows.slice(0, 5).map((r) => (
        <button key={`${r.kind}-${r.id}`} type="button" onClick={() => go(r.go)}
          className="min-h-tap w-full text-left rounded-r-md bg-card border border-line shadow-sh-1 px-3.5 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-extrabold">{r.kind}</div>
              <div className="text-xs text-mut num mt-0.5">{r.ref}</div>
              <div className="flex gap-1.5 mt-1.5">
                <Badge tone="warn">maker ≠ checker</Badge>
                <Badge tone="neutral">সুদ ৳০</Badge>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="num text-body font-extrabold">{tk(r.amt)}</div>
              <ChevronRight size={16} className="text-mut ml-auto" />
            </div>
          </div>
        </button>
      ))}
      <Note tone="info">এই এন্ট্রিগুলো নিষ্পত্তি না হলে দিন/মাস সমাপ্তি আটকাবে (BR-25)। প্রতিটিতে maker ≠ checker যাচাই হবে।</Note>

      <SectionHead title="চলমান ঋণ" sub={`${bn(active.length)}টি · বাকি ৳${bn(pf.outstanding)}`}
        right={<button type="button" className="min-h-tap px-1 text-sm font-bold text-green-800" onClick={() => go('/a/qh/loans')}>হাব</button>} />
      {active.map((l: QhLoan) => {
        const nx = qhNextInst(l, state.repayments);
        const pct = qhPaidPct(l, state.repayments);
        return (
          <button key={l.id} type="button" onClick={() => go(`/a/qh/loans/${l.id}`)}
            className="min-h-tap w-full text-left rounded-r-md bg-card border border-line shadow-sh-1 px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-body font-extrabold truncate">{memName(l.memberId)}</div>
                <div className="text-xs text-mut num">{l.no} · কিস্তি {bn(qhInsts(l, state.repayments).filter((i) => i.status === 'paid').length)}/{bn(l.tenure)}</div>
              </div>
              <Badge tone={QH_LOAN_ST[l.status].tone}>{QH_LOAN_ST[l.status].t}</Badge>
            </div>
            <div className="mt-2"><Progress pct={pct} tone={pct >= 60 ? 'ok' : 'warn'} /></div>
            <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
              <span className="text-mut">আদায় ৳{bn(qhInsts(l, state.repayments).filter((i) => i.status === 'paid').length * Math.round(l.principal / l.tenure))} · {bn(qhDaysLate(l, state.repayments))} দিন বিলম্ব</span>
              <span className="font-bold">{tk(qhArrearsOf(l, state.repayments))} বকেয়া</span>
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <Badge tone={QH_CLASS[qhClassOf(l, state.repayments)].tone}>{QH_CLASS[qhClassOf(l, state.repayments)].t}</Badge>
              {nx ? <Badge tone="neutral"><CalendarClock size={11} /> কিস্তি {bn(nx.no)} · {tk(nx.amount)}</Badge> : null}
            </div>
          </button>
        );
      })}

      <Accordion title="নিয়ম, খাত ও সিদ্ধান্ত (D-40/41/44/51)" sub="মডিউলটি সঞ্চয় স্কিম নয় — শুধু সুদমুক্ত সহায়তা" defaultOpen>
        <KV k="সুদ / মুনাফা" v={<b className="text-ok-ink">৳০ · কোনো খাত নেই (BR-20)</b>} />
        <KV k="ফি / বিলম্ব ফি" v="নেই — নিষ্ক্রিয় (D-41)" />
        <KV k="ফান্ড পুলের উৎস" v={pool.source} />
        <KV k="সদস্যের সঞ্চয় থেকে?" v={pool.note} />
        <KV k="এক সদস্যের সক্রিয় ঋণ" v="১টি (D-51)" />
        <KV k="আবেদনকারী" v="শুধু Admin-অনুমোদিত যোগ্য সদস্য (BR-21)" />
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between rounded-r-sm bg-green-050 border border-line-2 px-2.5 py-1.5 text-xs">
            <span className="text-mut">ডেবিট · কর্জে হাসানা আদায়যোগ্য</span><b className="num">{tk(pf.outstanding)}</b>
          </div>
          <div className="flex items-center justify-between rounded-r-sm bg-green-050 border border-line-2 px-2.5 py-1.5 text-xs">
            <span className="text-mut">ক্রেডিট · QH ফান্ড পুল (ব্যাংক সাব-খাত)</span><b className="num">{tk(pf.outstanding)}</b>
          </div>
        </div>
        <div className="mt-3"><QhZero /></div>
        <p className="text-xs text-mut mt-2">এই ড্যাশবোর্ডের প্রতিটি সংখ্যা সদস্য অ্যাপের সাথে এক Backend ও এক নিয়ম থেকে আসে (§৬)।</p>
      </Accordion>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" icon={<FileText size={15} />} onClick={() => go('/a/qh/reports')}>QH রিপোর্ট</Button>
        <Button variant="ghost" icon={<HandCoins size={15} />} onClick={() => go('/a/qh/window')}>জানালা ও পুল <ArrowRight size={14} /></Button>
      </div>

      <button type="button" onClick={() => go('/a/qh/eligible')} className="min-h-tap w-full text-left rounded-r-md border border-line bg-card px-3.5 py-3">
        <div className="flex items-center justify-between gap-2 text-sm font-bold">
          <span><Users size={15} className="inline mr-1" /> যোগ্য সদস্য তালিকা</span>
          <span className="text-mut num">{bn(state.eligible.length)} জন</span>
        </div>
      </button>
    </div>
  );
}
