/* RAM-01 · ROSCA ড্যাশবোর্ড — চক্র, পুল দায়, অনুমোদন বাকি ড্র ও ডিফল্ট ঝুঁকি */

import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, RefreshCw, Users, Wallet } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_DEF_ST, RC_STATUS, rcCircleById, rcCollected, rcDone, rcFilled, rcNext, rcPerDraw,
  rcSchemeById, rcSeats, rcShortfall, type RcCircle,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { PoolRow, RcHero, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];

export default function RcDashboard() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminRo();
  const go = (p: string) => navigate(`${p}${qs}`);

  const rows = state.circles.map((c) => {
    const sc = rcSchemeById(state.schemes, c.scheme);
    const done = rcDone(state.draws, c.id);
    const collected = rcCollected(c, sc, state.seats, state.draws, state.missed, mems);
    const shortfall = rcShortfall(c, sc, state.seats, state.draws, state.missed, mems);
    return { c, sc, done, collected, shortfall, next: rcNext(state.draws, c.id), filled: rcFilled(state.seats, c.id) };
  });
  const live = rows.filter((r) => r.c.status === 'active' || r.c.status === 'risk' || r.c.status === 'forming');
  const totalCollected = rows.reduce((s, r) => s + r.collected, 0);
  const totalOut = state.draws.filter((d) => d.status === 'executed').reduce((s, d) => s + d.amount, 0);
  const totalShort = rows.reduce((s, r) => s + r.shortfall, 0);
  const pending = state.draws.filter((d) => d.status === 'approval');
  const openDef = state.defaults.filter((d) => d.status !== 'resolved');

  return (
    <div className="p-4 space-y-3 pb-8">
      <RcHero label="ROSCA তহবিলের দায় ব্যালেন্স"
        amount={`৳${bn(Math.max(0, totalCollected - totalOut))}`}
        sub={`সংগৃহীত ৳${bn(totalCollected)} − পেআউট ৳${bn(totalOut)} · পৃথক দায় খাত (D-38)`}>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2.5 py-2">
            <i className="not-italic text-green-100 block">চলমান চক্র</i><b className="text-base num">{bn(live.length)}টি</b>
          </div>
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2.5 py-2">
            <i className="not-italic text-green-100 block">পুল ঘাটতি</i><b className="text-base num">৳{bn(totalShort)}</b>
          </div>
        </div>
      </RcHero>

      <KpiGrid>
        <Kpi label="চক্র" value={bn(state.circles.length)} note={`লাইভ ${bn(live.length)}`} />
        <Kpi label="মোট সংগ্রহ" value={`৳${bn(totalCollected)}`} tone="ok" note="সিট-ভিত্তিক হিসাব" />
        <Kpi label="বিতরণ হয়েছে" value={`৳${bn(totalOut)}`} note="সম্পন্ন ড্র" />
        <Kpi label="ডিফল্ট কেস" value={bn(openDef.length)} tone={openDef.length ? 'warn' : 'ok'} note="প্রতিকার চলছে" />
      </KpiGrid>

      <Card title="অনুমোদনের অপেক্ষায় ড্র" right={<Badge tone="warn">{bn(pending.length)}টি</Badge>}>
        {pending.length === 0 ? (
          <p className="text-sm text-mut">কোনো ড্র অনুমোদনের অপেক্ষায় নেই — সব ড্র নিষ্পত্তি হয়েছে।</p>
        ) : pending.map((d) => {
          const c = rcCircleById(state.circles, d.circle);
          return (
            <div key={d.id} className="border-b border-line-2 last:border-b-0 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-extrabold">{c.code} · ড্র {bn(d.no)}</div>
                  <div className="text-xs text-mut num">পুল ৳{bn(d.collected)} / ৳{bn(d.amount)} · ঘাটতি ৳{bn(d.shortfall)}</div>
                </div>
                <Badge tone="warn"><Clock size={12} /> অনুমোদন</Badge>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="secondary" icon={<Users size={14} />} onClick={() => go(`/a/rc/circles/${c.id}/draw`)}>ড্র চালান</Button>
                <Button size="sm" variant="ghost" icon={<Wallet size={14} />} onClick={() => go(`/a/rc/circles/${c.id}/pool`)}>পুল</Button>
              </div>
            </div>
          );
        })}
      </Card>

      <SectionHead title="চক্রসমূহ" sub={`${bn(state.circles.length)}টি · অগ্রগতি অনুযায়ী`}
        right={<button type="button" className="min-h-tap px-1 text-sm font-bold text-green-800" onClick={() => go('/a/rc/circles')}>সব</button>} />
      <div className="space-y-2">
        {rows.map(({ c, sc, done, collected, shortfall, next, filled }) => (
          <button key={c.id} type="button" onClick={() => go(`/a/rc/circles/${c.id}`)}
            className="min-h-tap w-full text-left rounded-r-md bg-card border border-line shadow-sh-1 px-3.5 py-3 active:scale-[.995]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-body font-extrabold truncate">{c.code}</div>
                <div className="text-xs text-mut num">{sc.code} · সিট {bn(filled)}/{bn(sc.seats)} · ড্র {bn(done.length)}/{bn(sc.seats)}</div>
              </div>
              <Badge tone={RC_STATUS[c.status].tone}>{RC_STATUS[c.status].t}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-mut">সংগৃহীত</span>
              <b className="num">৳{bn(collected)}</b>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-mut">{c.route}</span>
              {shortfall > 0 ? <Badge tone="danger">ঘাটতি ৳{bn(shortfall)}</Badge> : <Badge tone="ok">ঘাটতি নেই</Badge>}
              {next ? <span className="text-mut ml-auto num">পরবর্তী ড্র {bn(next.no)} · {next.scheduled}</span> : null}
            </div>
          </button>
        ))}
      </div>

      <SectionHead title="ডিফল্ট ঝুঁকি" sub={`${bn(openDef.length)}টি খোলা কেস · D-41 / D-46`} />
      <Card>
        {openDef.map((d) => {
          const st = rcSeats(rcCircleById(state.circles, d.circle), rcSchemeById(state.schemes, rcCircleById(state.circles, d.circle).scheme), state.seats, state.draws, state.missed, mems).find((x) => x.no === d.seatNo);
          return (
            <button key={d.id} type="button" onClick={() => go('/a/rc/defaults')} className="min-h-tap w-full text-left border-b border-line-2 last:border-b-0 py-2">
              <div className="flex justify-between gap-2">
                <span className="text-sm font-bold">{d.circle.toUpperCase()} · সিট {bn(d.seatNo)} · {st?.name ?? '—'}</span>
                <Badge tone={RC_DEF_ST[d.status].tone}>{RC_DEF_ST[d.status].t}</Badge>
              </div>
              <div className="text-xs text-mut num">বকেয়া ৳{bn(d.amount)} · {d.missedDraws.map((n) => bn(n)).join(', ')} ড্র</div>
            </button>
          );
        })}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => go('/a/rc/collect')}>কিস্তি আদায়</Button>
        <Button variant="secondary" icon={<CheckCircle2 size={15} />} onClick={() => go('/a/rc/register')}>ড্র রেজিস্টার</Button>
      </div>

      <Card title="নিয়ম সংস্করণ ও সীমা">
        <PoolRow label="প্রতি ড্র পুল (RCS-01)" value={`৳${bn(rcPerDraw(rcSchemeById(state.schemes, 'rs01')))}`} />
        <div className="mt-2"><PoolRow label="ড্র অপরিবর্তনীয় (R-02)" value="✓ লক" tone="ok" /></div>
        <div className="mt-2"><PoolRow label="মেয়াদি আয় / সুদ" value="৳০ · নিষিদ্ধ (BR-13)" tone="ok" /></div>
        <p className="text-xs text-mut mt-2">এক সদস্য সর্বোচ্চ ৩টি চক্রে (D-48) · maker ≠ checker বাধ্যতামূলক (BR-04)।</p>
        <Button size="sm" variant="ghost" className="mt-2" icon={<ArrowRight size={14} />} onClick={() => go('/a/rc/reports')}>ROSCA রিপোর্ট</Button>
      </Card>
    </div>
  );
}
