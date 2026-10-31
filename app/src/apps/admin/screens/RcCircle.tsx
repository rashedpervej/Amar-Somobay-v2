/* RAM-04 · চক্রের হাব — সারাংশ, সিট, ড্র ও ডিফল্ট এক জায়গায় */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Users, Wallet } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_DEF_ST, RC_DRAW_ST, RC_METHOD, RC_STATUS, rcCircleById, rcCollected, rcDone, rcFilled,
  rcNext, rcPayoutLabel, rcPerDraw, rcSchemeById, rcSeats, rcShortfall, type SeatRow,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { Bar, PoolRow, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];
type Tab = 'overview' | 'seats' | 'draws' | 'defaults';

export default function RcCircle() {
  const { circleId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const go = (p: string) => navigate(`${p}${qs}`);
  const { state } = useAdminRo();
  const [tab, setTab] = useState<Tab>('overview');
  const circle = rcCircleById(state.circles, circleId);
  const scheme = rcSchemeById(state.schemes, circle.scheme);
  const seats = rcSeats(circle, scheme, state.seats, state.draws, state.missed, mems);
  const done = rcDone(state.draws, circle.id);
  const next = rcNext(state.draws, circle.id);
  const collected = rcCollected(circle, scheme, state.seats, state.draws, state.missed, mems);
  const shortfall = rcShortfall(circle, scheme, state.seats, state.draws, state.missed, mems);
  const defs = state.defaults.filter((d) => d.circle === circle.id);
  const paidSeats = seats.filter((s) => s.status !== 'vacant');

  const SeatLine = ({ s }: { s: SeatRow }) => (
    <div className="flex items-center gap-2 border-b border-line-2 last:border-b-0 py-2">
      <span className={`w-8 h-8 shrink-0 grid place-items-center rounded-r-pill text-xs font-extrabold num ${s.status === 'vacant' ? 'bg-line-2 text-mut' : s.status === 'won' ? 'bg-ok-bg text-ok-ink' : s.status === 'due' ? 'bg-danger-bg text-danger-ink' : 'bg-card-2 text-txt'}`}>{bn(s.no)}</span>
      <div className="grow min-w-0">
        <div className="text-sm font-bold truncate">{s.name}</div>
        <div className="text-xs text-mut num">{s.memberId ? `${s.paidCount} কিস্তি · ৳${bn(s.contributed)}` : 'বরাদ্দ হয়নি'}{s.missed ? ` · বকেয়া ${bn(s.missed)}` : ''}</div>
      </div>
      {s.status === 'won' ? <Badge tone="ok">পেয়ে গেছে</Badge> : s.status === 'due' ? <Badge tone="danger">বকেয়া</Badge> : s.status === 'vacant' ? <Badge tone="neutral">খালি</Badge> : <Badge tone="info">চলমান</Badge>}
    </div>
  );

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => go('/a/rc/circles')}>চক্র তালিকা</Button>

      <Card>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-h2 font-extrabold">{circle.code}</div>
            <div className="text-xs text-mut num">{scheme.code} · {circle.route} · {circle.start} → {circle.end}</div>
          </div>
          <Badge tone={RC_STATUS[circle.status].tone}>{RC_STATUS[circle.status].t}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" icon={<Wallet size={14} />} onClick={() => go(`/a/rc/circles/${circle.id}/draw`)} disabled={!next}>
            {next ? `ড্র ${bn(next.no)} চালান` : 'সব ড্র সম্পন্ন'}
          </Button>
          <Button size="sm" variant="secondary" icon={<Users size={14} />} onClick={() => go(`/a/rc/circles/${circle.id}/seats`)}>সিট বরাদ্দ</Button>
        </div>
      </Card>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {([['overview', 'সারাংশ'], ['seats', 'সিট'], ['draws', 'ড্র'], ['defaults', 'ডিফল্ট']] as [Tab, string][]).map(([k, t]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{t}</Chip>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <KpiGrid>
            <Kpi label="সংগৃহীত" value={`৳${bn(collected)}`} tone="ok" note={`প্রতি ড্র ৳${bn(rcPerDraw(scheme))}`} />
            <Kpi label="ঘাটতি" value={`৳${bn(shortfall)}`} tone={shortfall ? 'warn' : 'ok'} note="D-38" />
            <Kpi label="সিট পূর্ণ" value={`${bn(rcFilled(state.seats, circle.id))}/${bn(scheme.seats)}`} note="বরাদ্দ" />
            <Kpi label="ড্র সম্পন্ন" value={`${bn(done.length)}/${bn(scheme.seats)}`} note="অপরিবর্তনীয়" />
          </KpiGrid>

          <Card title="চক্রের তথ্য">
            <PoolRow label="শাখা" value={circle.branch} />
            <div className="mt-2"><PoolRow label="ব্যবস্থাপক" value={circle.manager} /></div>
            <div className="mt-2"><PoolRow label="পরবর্তী ড্র" value={next ? `${next.scheduled} · ${RC_METHOD[next.method]}` : '—'} /></div>
            <div className="mt-2"><PoolRow label="পুল সংগ্রহ" value={`৳${bn(collected)}`} tone={shortfall ? 'warn' : 'ok'} /></div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1"><span className="text-mut">সংগ্রহ অগ্রগতি</span><b className="num">{bn(Math.round(collected / Math.max(1, done.length * rcPerDraw(scheme)) * 100))}%</b></div>
              <Bar pct={Math.round(collected / Math.max(1, done.length * rcPerDraw(scheme)) * 100)} tone={shortfall ? 'warn' : 'ok'} />
            </div>
            <p className="text-xs text-mut mt-3">সাক্ষী: {circle.witnesses.join(' · ')}</p>
          </Card>

          <Card title="ডিফল্ট সারাংশ" right={<Badge tone={defs.filter((d) => d.status !== 'resolved').length ? 'warn' : 'ok'}>{bn(defs.filter((d) => d.status !== 'resolved').length)} খোলা</Badge>}>
            {defs.length === 0 ? <p className="text-sm text-mut">এই চক্রে কোনো ডিফল্ট কেস নেই।</p> : defs.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 border-b border-line-2 last:border-b-0 py-2">
                <span className="text-sm font-bold">সিট {bn(d.seatNo)} · ৳{bn(d.amount)}</span>
                <Badge tone={RC_DEF_ST[d.status].tone}>{RC_DEF_ST[d.status].t}</Badge>
              </div>
            ))}
          </Card>
        </>
      ) : null}

      {tab === 'seats' ? (
        <>
          <SectionHead title="সিট ও সদস্য" sub={`${bn(paidSeats.length)} বরাদ্দ · ${bn(seats.length - paidSeats.length)} খালি`}
            right={<Button size="sm" variant="secondary" onClick={() => go(`/a/rc/circles/${circle.id}/seats`)}>বরাদ্দ করুন</Button>} />
          <Card>{seats.map((s) => <SeatLine key={s.no} s={s} />)}</Card>
        </>
      ) : null}

      {tab === 'draws' ? (
        <>
          <SectionHead title="ড্র তালিকা" sub={`${bn(done.length)} সম্পন্ন · ${bn(state.draws.filter((d) => d.circle === circle.id && d.status !== 'executed').length)} বাকি`}
            right={<Button size="sm" variant="ghost" onClick={() => go('/a/rc/register')}>রেজিস্টার</Button>} />
          <div className="space-y-2">
            {state.draws.filter((d) => d.circle === circle.id).map((d) => (
              <button key={d.id} type="button" onClick={() => go(`/a/rc/draws/${d.id}`)}
                className="min-h-tap w-full text-left rounded-r-md bg-card border border-line px-3.5 py-3">
                <div className="flex justify-between gap-2 items-start">
                  <div>
                    <div className="text-sm font-extrabold">ড্র {bn(d.no)} · ৳{bn(d.amount)}</div>
                    <div className="text-xs text-mut num">{d.executed ?? d.scheduled} · {RC_METHOD[d.method]} · {rcPayoutLabel(d.channel)}</div>
                  </div>
                  <Badge tone={RC_DRAW_ST[d.status].tone}>{RC_DRAW_ST[d.status].t}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-xs">
                  <span className="text-mut">{d.winnerSeat ? `প্রাপক সিট ${bn(d.winnerSeat)}` : 'প্রাপক নির্ধারিত নয়'}</span>
                  <ChevronRight size={16} className="text-mut" />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {tab === 'defaults' ? (
        <>
          <SectionHead title="ডিফল্ট কেস" sub={`${bn(defs.length)}টি · D-41 / D-46`}
            right={<Button size="sm" variant="ghost" onClick={() => go('/a/rc/defaults')}>সব কেস</Button>} />
          {defs.length === 0 ? <Card><p className="text-sm text-mut">কোনো কেস নেই।</p></Card> : defs.map((d) => (
            <Card key={d.id} title={`সিট ${bn(d.seatNo)} · ৳${bn(d.amount)}`} right={<Badge tone={RC_DEF_ST[d.status].tone}>{RC_DEF_ST[d.status].t}</Badge>}>
              <p className="text-sm text-txt-2">{d.note}</p>
              <p className="text-xs text-mut mt-1 num">নোটিশ {d.noticeSent} · কমিটি {d.committee ?? '—'}</p>
            </Card>
          ))}
        </>
      ) : null}
    </div>
  );
}
