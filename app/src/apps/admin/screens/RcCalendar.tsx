/* RAM-07 · ড্র ক্যালেন্ডার ও ক্রম — আসন্ন ড্র, তারিখ সংঘর্ষ, সম্পন্ন রেজিস্টার ও লটারি চেকলিস্ট */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Lock } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_DRAW_ST, RC_METHOD, rcCircleById, rcDone, rcPayoutLabel, rcSchemeById, rcSeats,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { Accordion, KV } from './parts';
import { Ladder, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];

const CHECKS = [
  'সাক্ষী উপস্থিতি নিশ্চিত করা',
  'পুল গণনা ও ঘাটতি যাচাই',
  'লটারির পদ্ধতি লিখিত সংরক্ষণ',
  'ফল প্রকাশের সাথে হ্যাশ ও স্বাক্ষর',
  'প্রাপক ও সব সদস্যকে নোটিফিকেশন',
  'পেআউট চ্যানেল ও রসিদ নির্ধারণ',
];

export default function RcCalendar() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const go = (p: string) => navigate(`${p}${qs}`);
  const { state } = useAdminRo();
  const [tab, setTab] = useState<'upcoming' | 'done'>('upcoming');
  const up = state.draws.filter((d) => d.status !== 'executed');
  const done = state.draws.filter((d) => d.status === 'executed');
  const dates: Record<string, number> = {};
  state.draws.forEach((d) => { dates[d.scheduled] = (dates[d.scheduled] ?? 0) + 1; });
  const clash = Object.keys(dates).filter((k) => dates[k] > 1);
  const list = tab === 'upcoming' ? up : done;

  return (
    <div className="p-4 space-y-3 pb-8">
      <KpiGrid>
        <Kpi label="আসন্ন ড্র" value={bn(up.length)} tone="warn" note="চক্র মিলিয়ে" />
        <Kpi label="সম্পন্ন" value={bn(done.length)} tone="ok" note="অপরিবর্তনীয়" />
        <Kpi label="তারিখ সংঘর্ষ" value={bn(clash.length)} tone={clash.length ? 'danger' : 'ok'} note="একই দিনে একাধিক ড্র" />
        <Kpi label="চলমান চক্র" value={bn(state.circles.filter((c) => c.status === 'active' || c.status === 'risk').length)} note="ড্র চলছে" />
      </KpiGrid>

      {clash.length ? (
        <div className="rounded-r-md bg-warn-bg border border-warn-bd text-warn-ink px-3 py-2 text-sm font-bold">
          {clash.join(' · ')} — একই দিনে একাধিক চক্রের ড্র; সাক্ষী ও সময় আলাদা রাখুন।
        </div>
      ) : <p className="text-sm text-ok-ink font-bold">কোনো তারিখ সংঘর্ষ নেই ✓</p>}

      <div className="flex gap-2">
        <Chip active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>আসন্ন ({bn(up.length)})</Chip>
        <Chip active={tab === 'done'} onClick={() => setTab('done')}>সম্পন্ন ({bn(done.length)})</Chip>
      </div>

      <SectionHead title={tab === 'upcoming' ? 'আসন্ন ড্র' : 'সম্পন্ন ড্র'} sub={`${bn(list.length)}টি · তারিখ অনুযায়ী`} />
      <div className="space-y-2">
        {list.map((d) => {
          const c = rcCircleById(state.circles, d.circle);
          const sc = rcSchemeById(state.schemes, c.scheme);
          const seat = d.winnerSeat ? rcSeats(c, sc, state.seats, state.draws, state.missed, mems).find((s) => s.no === d.winnerSeat) : null;
          return (
            <button key={d.id} type="button"
              onClick={() => go(d.status === 'executed' ? `/a/rc/draws/${d.id}` : `/a/rc/circles/${c.id}/draw`)}
              className="min-h-tap w-full text-left rounded-r-md bg-card border border-line px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">{c.code} · ড্র {bn(d.no)}{seat ? ` · ${seat.name}` : ''}</div>
                  <div className="text-xs text-mut num">{d.scheduled} · {RC_METHOD[d.method]} · {rcPayoutLabel(d.channel)}</div>
                </div>
                <Badge tone={RC_DRAW_ST[d.status].tone}>{RC_DRAW_ST[d.status].t}</Badge>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <span className="text-mut num">{tk(d.amount)} · সংগৃহীত {tk(d.collected)}</span>
                {d.shortfall ? <Badge tone="danger">ঘাটতি {tk(d.shortfall)}</Badge> : <Badge tone="ok">পুল পূর্ণ</Badge>}
              </div>
            </button>
          );
        })}
        {list.length === 0 ? <Card><p className="text-sm text-mut">এই তালিকায় কোনো ড্র নেই।</p></Card> : null}
      </div>

      <Accordion title="পূর্বনির্ধারিত ক্রম · RC-2504-03" sub="সম্পন্ন ক্রম লক (R-05)">
        <Card>
          {rcDone(state.draws, 'rc03').map((d) => {
            const c = rcCircleById(state.circles, 'rc03');
            const sc = rcSchemeById(state.schemes, c.scheme);
            const seat = rcSeats(c, sc, state.seats, state.draws, state.missed, mems).find((s) => s.no === d.winnerSeat);
            return (
              <div key={d.id} className="flex items-center gap-2 border-b border-line-2 last:border-b-0 py-2">
                <span className="w-8 h-8 shrink-0 grid place-items-center rounded-r-pill bg-ok-bg text-ok-ink text-xs font-extrabold num">{bn(d.no)}</span>
                <div className="grow min-w-0">
                  <div className="text-sm font-bold truncate">{seat?.name ?? '—'}</div>
                  <div className="text-xs text-mut num">{d.scheduled} · {d.receipt}</div>
                </div>
                <Lock size={14} className="text-mut" />
              </div>
            );
          })}
          <p className="text-xs text-mut mt-2">সম্পন্ন ড্রয়ের ক্রম অপরিবর্তনীয়; ভবিষ্যতের ক্রম বদলাতে সব সদস্যের লিখিত সম্মতি ও কমিটির সিদ্ধান্ত লাগে — অডিট লগে থাকবে।</p>
        </Card>
      </Accordion>

      <Accordion title="লটারির ড্র-দিবস চেকলিস্ট" sub="D-42 অমীমাংসিত">
        <Ladder steps={CHECKS.map((label, i) => ({ key: `c${i}`, label }))} active="c1" />
        <p className="text-xs text-warn-ink mt-2">লটারির সুনির্দিষ্ট পদ্ধতি ও সাক্ষীর সংখ্যা D-42 অমীমাংসিত — এখানে ২ জন সাক্ষী ও চিট-ভিত্তিক লটারি ধরা হয়েছে।</p>
      </Accordion>

      <Card title="ড্র ক্যালেন্ডার সারাংশ">
        <KV k="মাসিক ড্র" v={`${bn(state.draws.filter((d) => d.scheduled.startsWith('২০২৬-১১')).length)}টি নির্ধারিত (নভেম্বর)`} />
        <KV k="পদ্ধতি" v="লটারি · পূর্বনির্ধারিত ক্রম" />
        <KV k="সাক্ষী" v="২ জন (কমিটি সভাপতি + নিরীক্ষক)" />
        <div className="mt-2"><Button size="sm" variant="secondary" icon={<CalendarDays size={14} />} onClick={() => go('/a/rc/register')}>ড্র রেজিস্টার</Button></div>
      </Card>
    </div>
  );
}
