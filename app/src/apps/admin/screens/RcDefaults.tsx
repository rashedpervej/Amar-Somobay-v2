/* RAM-11 · ডিফল্ট ও প্রতিস্থাপন — প্রতিকার ল্যাডার, কমিটি সিদ্ধান্ত ও সিট প্রতিস্থাপন (D-41/D-46) */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Users } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_DEF_ST, RC_STEP, RC_STEP_ORDER, rcCircleById, rcSchemeById, rcSeats,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { Accordion, KV, StackedCard, StackHead } from './parts';
import { Ladder, PoolRow, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];
const STEPS = RC_STEP_ORDER.map((k) => ({ key: k, label: RC_STEP[k] }));

export default function RcDefaults() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, advanceDefault, resolveDefault, replaceSeat } = useAdminRo();
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const [act, setAct] = useState<string>('');
  const [committee, setCommittee] = useState('');
  const [pick, setPick] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const open = state.defaults.filter((d) => d.status !== 'resolved');
  const res = state.defaults.filter((d) => d.status === 'resolved');
  const list = tab === 'open' ? open : res;
  const wait = state.waitlist;

  const run = (fn: () => { ok: boolean; message: string }) => {
    setErr(''); setMsg('');
    const r = fn();
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
    setAct('');
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <KpiGrid>
        <Kpi label="খোলা কেস" value={bn(open.length)} tone="warn" note="প্রতিকার চলছে" />
        <Kpi label="মোট বকেয়া" value={tk(open.reduce((s, d) => s + d.amount, 0))} tone="warn" note="D-41" />
        <Kpi label="কমিটিতে" value={bn(open.filter((d) => d.status === 'pending-committee').length)} note="সিদ্ধান্তের অপেক্ষায়" />
        <Kpi label="নিষ্পত্তি" value={bn(res.length)} tone="ok" note="রেকর্ড সংরক্ষিত" />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <div className="flex gap-2">
        <Chip active={tab === 'open'} onClick={() => setTab('open')}>খোলা ({bn(open.length)})</Chip>
        <Chip active={tab === 'resolved'} onClick={() => setTab('resolved')}>নিষ্পত্তি ({bn(res.length)})</Chip>
      </div>

      <SectionHead title="ডিফল্ট কেস" sub={`${bn(state.defaults.length)}টি · কার্যক্রমের ধাপ অনুযায়ী`} />
      {list.map((d) => {
        const circle = rcCircleById(state.circles, d.circle);
        const scheme = rcSchemeById(state.schemes, circle.scheme);
        const seat = rcSeats(circle, scheme, state.seats, state.draws, state.missed, mems).find((s) => s.no === d.seatNo);
        const free = (state.seats[d.circle] ?? []).length < scheme.seats;
        return (
          <StackedCard key={d.id} tone={d.status === 'resolved' ? 'ok' : 'bad'}
            head={<StackHead title={`${circle.code} · সিট ${bn(d.seatNo)}`} sub={`${seat?.name ?? '—'} · ${circle.route}`}
              right={<Badge tone={RC_DEF_ST[d.status].tone}>{RC_DEF_ST[d.status].t}</Badge>} />}
            foot={d.status === 'resolved'
              ? <Button size="sm" variant="ghost" onClick={() => navigate(`/a/rc/register${qs}`)}>ড্র রেজিস্টার</Button>
              : (
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" icon={<ArrowUpRight size={14} />} onClick={() => run(() => advanceDefault(d.id))}>পরবর্তী ধাপ</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAct(act === d.id ? '' : d.id)}>নিষ্পত্তি</Button>
                </div>
              )}>
            <KV k="কেস" v={d.id.toUpperCase()} />
            <KV k="বকেয়া" v={`${tk(d.amount)} · ${d.missedDraws.map((n) => bn(n)).join(', ')} ড্র`} />
            <KV k="প্রতিকারের ধাপ" v={RC_STEP[d.step]} />
            <KV k="বিলম্ব ফি" v={d.lateFee ? `${tk(d.lateFee)} · D-41 অমীমাংসিত` : 'প্রযোজ্য নয়'} />
            <KV k="নোটিশ" v={d.noticeSent} />
            <KV k="কমিটি / সিদ্ধান্ত" v={d.committee ? `${d.committee} · ${d.decidedBy}` : 'কমিটিতে যায়নি'} />
            <KV k="নোট" v={d.note} />

            {act === d.id ? (
              <div className="mt-3 space-y-2 rounded-r-sm border border-line-3 bg-card-2 p-3">
                <label htmlFor={`cm-${d.id}`} className="block text-sm font-bold text-txt-2">কমিটির সিদ্ধান্ত নম্বর</label>
                <input id={`cm-${d.id}`} className={inputClass()} value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="যেমন: CM-2610-07" />
                <Button size="sm" block icon={<CheckCircle2 size={14} />} onClick={() => run(() => resolveDefault(d.id, committee))}>সিদ্ধান্তসহ নিষ্পত্তি</Button>
                <div className="border-t border-line-2 pt-2">
                  <div className="text-sm font-bold text-txt-2 mb-1">প্রতিস্থাপন (ওয়েটলিস্ট)</div>
                  <select className={inputClass()} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="প্রতিস্থাপনের সদস্য">
                    <option value="">— সদস্য বাছাই —</option>
                    {mems.filter((m) => !(state.seats[d.circle] ?? []).includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name} · {m.no}</option>)}
                  </select>
                  <Button size="sm" block className="mt-2" variant="secondary" icon={<Users size={14} />}
                    disabled={!pick} onClick={() => run(() => replaceSeat(d.id, pick))}>সিট প্রতিস্থাপন</Button>
                  <p className="text-xs text-mut mt-1">বহির্গত সদস্যের জমার নিষ্পত্তি D-46 অমীমাংসিত — কমিটির লিখিত সিদ্ধান্ত ছাড়া নয়। {free ? '' : 'চক্র পূর্ণ।'}</p>
                </div>
              </div>
            ) : null}
          </StackedCard>
        );
      })}
      {list.length === 0 ? <Card><p className="text-sm text-mut">এই তালিকায় কোনো কেস নেই।</p></Card> : null}

      <Accordion title="প্রতিকারের ল্যাডার" sub={`ধাপ ${bn(open.length ? RC_STEP_ORDER.indexOf(open[0].step) + 1 : 0)}/৪ · D-46`}>
        <Ladder steps={STEPS} active={open[0]?.step ?? 'resolved'} />
        <p className="text-xs text-mut mt-2">ধাপ ৩ (প্রতিস্থাপন) ও ধাপ ৪ (বাতিল) D-46 অমীমাংসিত — বহির্গত সদস্যের জমা কীভাবে নিষ্পত্তি হবে তা ঠিক হয়নি।</p>
      </Accordion>

      <Accordion title="প্রতিস্থাপনের কর্মপ্রবাহ (৬ ধাপ)" sub="ওয়েটলিস্ট → কমিটি → প্রথম কিস্তি">
        <Ladder steps={[
          { key: 'n', label: 'বকেয়া নোটিশ ও শেষ তারিখ' },
          { key: 'c', label: 'কমিটিতে প্রস্তাব ও রেফারেন্স', note: 'CM নম্বর বাধ্যতামূলক' },
          { key: 'w', label: 'ওয়েটলিস্ট থেকে প্রতিস্থাপন বাছাই', note: `${bn(Object.values(wait).flat().length)} জন অপেক্ষমাণ` },
          { key: 's', label: 'বহির্গত সদস্যের জমা নিষ্পত্তি (D-46)' },
          { key: 'p', label: 'পুল ঘাটতি মেটানো (D-38)' },
          { key: 'f', label: 'নতুন সদস্যকে জানানো ও প্রথম কিস্তি' },
        ]} active="c" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/a/rc/circles/rc02/seats${qs}`)}>বাছাই শুরু</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/a/claims${qs}`)}>দাবি নিষ্পত্তি</Button>
        </div>
      </Accordion>

      <Card title="নীতি">
        <PoolRow label="QH বিলম্ব ফি" value="৳০ · নিষিদ্ধ" tone="ok" />
        <div className="mt-2"><PoolRow label="ROSCA বিলম্ব ফি" value="D-41 — আইন/শরীয়াহ পর্যালোচনার অপেক্ষায়" tone="warn" /></div>
        <p className="text-xs text-mut mt-2">এই পর্দা কোনো নতুন ফি চালু করে না; শুধু বিদ্যমান নীতির অধীনে কেস পরিচালনা করে (ডেমো)।</p>
      </Card>
    </div>
  );
}
