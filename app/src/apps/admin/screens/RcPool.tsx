/* RAM-08 · পুল ও ঘাটতি নিষ্পত্তি — কোন উৎস থেকে ঘাটতি মেটানো হবে (D-38) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Info, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, rcCircleById, rcCollected, rcDone, rcPerDraw, rcSchemeById, rcSeats, rcShortfall, rcNext,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { HeroChip } from './parts';
import { Bar, PoolRow, RcHero, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];
const COVER = [
  ['advance', 'ড্র এগিয়ে নিন', 'ঘাটতি পরের কিস্তিতে আদায় হবে; ক্ষতিপূরণ খাতে দেখানো হবে (D-38)'],
  ['defer', 'ড্র পিছিয়ে দিন', 'নতুন তারিখ দিতে হবে এবং সব সদস্যকে SMS যাবে'],
  ['reserve', 'রিজার্ভ থেকে ঘাটতি মেটান', 'D-38 অমীমাংসিত — সমিতির নিজের তহবিল থেকে দেওয়ার নিয়ম ঠিক হয়নি'],
];

export default function RcPool() {
  const { circleId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, executeDraw } = useAdminRo();
  const circle = rcCircleById(state.circles, circleId);
  const scheme = rcSchemeById(state.schemes, circle.scheme);
  const collected = rcCollected(circle, scheme, state.seats, state.draws, state.missed, mems);
  const shortfall = rcShortfall(circle, scheme, state.seats, state.draws, state.missed, mems);
  const done = rcDone(state.draws, circle.id);
  const next = rcNext(state.draws, circle.id);
  const seats = rcSeats(circle, scheme, state.seats, state.draws, state.missed, mems);
  const [cover, setCover] = useState('advance');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const sendForApproval = () => {
    setErr(''); setMsg('');
    if (!next) { setErr('এই চক্রে আর কোনো ড্র বাকি নেই'); return; }
    const r = executeDraw(next.id, {
      winnerSeat: next.candidates[0] ?? 1,
      approver: 'নাসরিন আক্তার',
      channel: 'cash_office',
      note: `ঘাটতি নিষ্পত্তি: ${COVER.find((c) => c[0] === cover)?.[1]} — সিদ্ধান্ত নথিভুক্ত (D-38)`,
      collected,
    });
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/rc/circles/${circle.id}${qs}`)}>চক্রে ফিরুন</Button>

      <RcHero label={`${circle.code} · পুল`} amount={tk(done.length * rcPerDraw(scheme))}
        sub={`সংগৃহীত ${tk(collected)} · ঘাটতি ${tk(shortfall)}`}>
        <div className="mt-3 flex items-center gap-2">
          <HeroChip>{bn(done.length)}/{bn(scheme.seats)} ড্র</HeroChip>
          <HeroChip>{bn(seats.filter((s) => s.memberId).length)} সিট</HeroChip>
        </div>
      </RcHero>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Card title="সিট-ভিত্তিক আদায়" sub="প্রতি ড্রের স্ন্যাপশট থেকে গণনা">
        <Bar pct={Math.round((collected / Math.max(1, done.length * rcPerDraw(scheme))) * 100)} tone={shortfall ? 'warn' : 'ok'} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {seats.filter((s) => s.memberId).map((s) => (
            <Badge key={s.no} tone={s.missed ? 'danger' : s.status === 'won' ? 'neutral' : 'ok'}>
              {bn(s.no)}{s.missed ? ` · ${bn(s.missed)} বকেয়া` : ' ✓'}
            </Badge>
          ))}
        </div>
      </Card>

      <SectionHead title="ঘাটতির সিদ্ধান্ত" sub="D-38 · কমিটির নথিভুক্ত সিদ্ধান্ত লাগবে" />
      <div className="space-y-2">
        {COVER.map(([k, t, d]) => (
          <button key={k} type="button" onClick={() => setCover(k)}
            className={`min-h-tap w-full text-left rounded-r-md border px-3.5 py-3 ${cover === k ? 'border-green-600 bg-green-050' : 'border-line bg-card'}`}>
            <div className="flex items-center justify-between gap-2">
              <b className="text-sm">{t}</b>
              {cover === k ? <Badge tone="ok">নির্বাচিত</Badge> : null}
            </div>
            <p className="text-xs text-mut mt-1">{d}</p>
          </button>
        ))}
      </div>

      <Card title="সব ড্রের পুল">
        {state.draws.filter((d) => d.circle === circle.id).map((d) => (
          <div key={d.id} className="border-b border-line-2 last:border-b-0 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">ড্র {bn(d.no)}</span>
              <span className="text-xs num text-mut">{tk(d.collected)} / {tk(d.amount)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Bar pct={Math.round((d.collected / Math.max(1, d.amount)) * 100)} tone={d.shortfall ? 'warn' : 'ok'} />
              <span className={`text-xs num ${d.shortfall ? 'text-warn-ink font-bold' : 'text-mut'}`}>{d.shortfall ? tk(d.shortfall) : '✓'}</span>
            </div>
            {d.cover ? <p className="text-xs text-mut mt-1">{d.cover}</p> : null}
          </div>
        ))}
      </Card>

      <Card title="সতর্কতা">
        <PoolRow label="ঘাটতি মেটানোর নিয়ম" value="D-38 অমীমাংসিত" tone="warn" />
        <div className="mt-2"><PoolRow label="রিজার্ভ থেকে পূরণ" value="নিষিদ্ধ নয়, তবে নীতি নির্ধারিত হয়নি" tone="warn" /></div>
        <p className="text-xs text-mut mt-2 flex items-start gap-1"><Info size={13} className="mt-0.5" /> এই সিদ্ধান্ত শুধু নথিভুক্ত হয়; কোনো টাকা স্থানান্তর বা DB পরিবর্তন হয় না (ডেমো)।</p>
      </Card>

      <Button block icon={<RefreshCw size={16} />} onClick={sendForApproval} disabled={!next}>
        {next ? `সিদ্ধান্তসহ ড্র ${bn(next.no)} অনুমোদনে পাঠান` : 'সব ড্র সম্পন্ন'}
      </Button>
    </div>
  );
}
