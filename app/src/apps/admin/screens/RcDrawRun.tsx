/* RAM-06 · ড্র পরিচালনা (৫ ধাপ) — পুল স্ন্যাপশট · প্রাপক · maker≠checker · বিতরণ · রসিদ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_METHOD, RC_PAYOUT, rcCircleById, rcNext, rcPerDraw, rcSchemeById, rcSeats, type PayoutKey,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { Stepper } from './parts';
import { Bar, PoolRow, tk } from './rcParts';
import { useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];
const APPROVERS = ['নাসরিন আক্তার · APPROVER (৳২,০০,০০০)', 'মোঃ আব্দুল্লাহ · ORG_ADMIN (অসীম)'];

export default function RcDrawRun() {
  const { circleId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, executeDraw } = useAdminRo();
  const circle = rcCircleById(state.circles, circleId);
  const scheme = rcSchemeById(state.schemes, circle.scheme);
  const draw = rcNext(state.draws, circle.id) ?? state.draws.filter((d) => d.circle === circle.id).slice(-1)[0];
  const seats = rcSeats(circle, scheme, state.seats, state.draws, state.missed, mems);
  const cands = seats.filter((s) => s.memberId && s.status !== 'won');
  const [winner, setWinner] = useState('');
  const [approver, setApprover] = useState('');
  const [channel, setChannel] = useState<PayoutKey>('cash_office');
  const [collected, setCollected] = useState(String(draw.collected));
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const done = draw.status === 'executed';
  const shortfall = Math.max(0, draw.amount - Number(collected || 0));

  const submit = () => {
    setErr(''); setMsg('');
    const r = executeDraw(draw.id, {
      winnerSeat: Number(winner), approver: approver.split(' · ')[0], channel, note,
      collected: Number(collected),
    });
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/rc/circles/${circle.id}${qs}`)}>চক্রে ফিরুন</Button>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <b>{circle.code} · ড্র {bn(draw.no)}</b>
          <Badge tone={done ? 'ok' : draw.status === 'approval' ? 'warn' : 'info'}>{done ? 'সম্পন্ন' : draw.status === 'approval' ? 'ধাপ ৩/৫' : 'নির্ধারিত'}</Badge>
        </div>
        <div className="mt-3"><Stepper steps={['পুল', 'প্রাপক', 'অনুমোদন', 'বিতরণ', 'রসিদ']} cur={done ? 5 : 2} /></div>
      </Card>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <SectionHead title="ধাপ ১ · পুল গণনা" sub="স্বয়ংক্রিয় স্ন্যাপশট" />
      <Card>
        <div className="space-y-2">
          <PoolRow label={`সিট × কিস্তি (${bn(scheme.seats)} × ${tk(scheme.contrib)})`} value={tk(draw.amount)} />
          <PoolRow label="আদায় হয়েছে" value={tk(done ? draw.collected : Number(collected || 0))} tone={shortfall ? 'warn' : 'ok'} />
          <PoolRow label="ঘাটতি" value={tk(done ? draw.shortfall : shortfall)} tone={shortfall ? 'bad' : 'ok'} />
        </div>
        <div className="mt-3">
          <Bar pct={Math.round((Number(collected || 0) / Math.max(1, draw.amount)) * 100)} tone={shortfall ? 'warn' : 'ok'} />
          <div className="text-xs text-mut mt-1">সিট-ভিত্তিক আদায়: {seats.map((s) => `${bn(s.no)}${s.missed ? '✗' : '✓'}`).join(' ')}</div>
        </div>
        {!done ? (
          <Field label="এখন পর্যন্ত আদায় (৳)" hint="ঘাটতি থাকলে সিদ্ধান্ত নথিভুক্ত করুন — D-38">
            {(id) => <input id={id} type="number" className={inputClass()} value={collected} onChange={(e) => setCollected(e.target.value)} />}
          </Field>
        ) : null}
      </Card>

      <SectionHead title="ধাপ ২ · প্রাপক নির্ধারণ" sub={`${RC_METHOD[draw.method]} · ${bn(cands.length)} জন যোগ্য`} />
      {done ? (
        <Card><p className="text-sm font-bold">প্রাপক সিট {bn(draw.winnerSeat ?? 0)} · রসিদ {draw.receipt}</p></Card>
      ) : (
        <Card>
          <div className="space-y-2">
            {cands.map((s) => (
              <button key={s.no} type="button" onClick={() => setWinner(String(s.no))}
                className={`min-h-tap w-full text-left rounded-r-sm border px-3 py-2 ${winner === String(s.no) ? 'border-green-600 bg-green-050' : 'border-line bg-card'}`}>
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm">{s.name} · সিট {bn(s.no)}</b>
                  <Badge tone={s.missed ? 'warn' : 'ok'}>{s.missed ? 'বকেয়া' : 'যোগ্য'}</Badge>
                </div>
                <div className="text-xs text-mut num">জমা {tk(s.contributed)} · {bn(s.paidCount)} কিস্তি{s.missed ? ` · নীতি অনুযায়ী বাদ` : ''}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-mut mt-2">লটারি পদ্ধতিতে প্রাপক নির্বাচনের প্রমাণ সংরক্ষিত হয়; Admin-নির্ধারিত পদ্ধতি D-42 অমীমাংসিত।</p>
        </Card>
      )}

      <SectionHead title="ধাপ ৩ · অনুমোদন" sub="maker ≠ checker · BR-04" />
      <Card>
        <PoolRow label="প্রস্তুতকারী" value={`${draw.by} · MANAGER`} />
        {!done ? (
          <>
            <div className="mt-3">
              <label htmlFor="rc-appr" className="block text-sm font-bold text-txt-2 mb-1.5">অনুমোদনকারী</label>
              <select id="rc-appr" className={inputClass()} value={approver} onChange={(e) => setApprover(e.target.value)}>
                <option value="">— বাছাই করুন —</option>
                {APPROVERS.map((a) => <option key={a} value={a}>{a}</option>)}
                <option value={`${draw.by} · নিজে`}>{draw.by} — অনুমোদিত নয় ✗</option>
              </select>
            </div>
            <div className="mt-3">
              <label htmlFor="rc-note" className="block text-sm font-bold text-txt-2 mb-1.5">অনুমোদন মন্তব্য</label>
              <textarea id="rc-note" className={inputClass()} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ঘাটতির সিদ্ধান্ত, সাক্ষীর নাম, লটারির পদ্ধতি…" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-txt-2 mb-1.5">বিতরণের মাধ্যম</div>
              <div className="flex flex-wrap gap-2">
                {RC_PAYOUT.map((p) => (
                  <button key={p.k} type="button" disabled={!p.on} onClick={() => setChannel(p.k)}
                    className={`min-h-9 px-3 rounded-r-pill border text-sm font-bold ${channel === p.k ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3 text-txt-2'} disabled:opacity-40`}>
                    {p.on ? '' : <Lock size={12} className="inline mr-1" />}{p.t}
                  </button>
                ))}
              </div>
              <p className="text-xs text-mut mt-1">সঞ্চয় অ্যাকাউন্টে স্থানান্তর নিষ্ক্রিয় — D-12 পুনরায় খোলা।</p>
            </div>
            <div className="mt-3"><PoolRow label="পিরিয়ড অবস্থা" value="খোলা — সংশোধন সম্ভব" tone="ok" /></div>
            <div className="mt-2"><PoolRow label="দিন সমাপ্তি (BR-11)" value="আজকের দিন বন্ধ হয়নি" tone="warn" /></div>
            <Button block className="mt-3" icon={<CheckCircle2 size={16} />} onClick={submit}>ড্র সম্পন্ন করুন</Button>
            <p className="text-xs text-mut mt-2 flex items-start gap-1"><Lock size={13} className="mt-0.5" /> সম্পাদনের পর ড্র অপরিবর্তনীয় — ভুল হলে রিভার্সাল-জোড়া এন্ট্রি (R-02)।</p>
          </>
        ) : (
          <div className="mt-2 space-y-2">
            <PoolRow label="অনুমোদনকারী" value={draw.appr ?? '—'} tone="ok" />
            <PoolRow label="হ্যাশ" value={<span className="font-mono text-xs">{draw.hash}</span>} />
            <PoolRow label="সাক্ষী" value={circle.witnesses.join(' · ')} />
            <PoolRow label="রসিদ (একবারই ব্যবহারযোগ্য)" value={draw.receipt ?? '—'} tone="ok" />
            <Button block variant="secondary" onClick={() => navigate(`/a/rc/draws/${draw.id}${qs}`)}>রসিদ ও যাচাই দেখুন</Button>
          </div>
        )}
      </Card>

      <KpiGrid>
        <Kpi label="ড্র অঙ্ক" value={tk(draw.amount)} note="প্রতি ড্র পুল" />
        <Kpi label="প্রতি কিস্তি" value={tk(rcPerDraw(scheme))} note={`${bn(scheme.seats)} সিট`} />
      </KpiGrid>
    </div>
  );
}
