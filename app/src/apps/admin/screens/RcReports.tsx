/* RAM-12 · ROSCA রিপোর্ট — তহবিল দায়, সংগ্রহ এজিং, ডিফল্ট ও নিয়ন্ত্রক সারাংশ */

import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_STATUS, RC_STEP, RC_STEP_ORDER, rcCircleById, rcCollected, rcDone, rcFilled, rcPerDraw,
  rcSchemeById, rcSeats, rcShortfall, type DefaultStep,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { Accordion, KV } from './parts';
import { Bar, PoolRow, RcHero, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];

export default function RcReports() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminRo();
  const rows = state.circles.map((c) => {
    const sc = rcSchemeById(state.schemes, c.scheme);
    const done = rcDone(state.draws, c.id);
    return {
      c, sc, done, filled: rcFilled(state.seats, c.id),
      collected: rcCollected(c, sc, state.seats, state.draws, state.missed, mems),
      shortfall: rcShortfall(c, sc, state.seats, state.draws, state.missed, mems),
      paidOut: done.reduce((s, d) => s + d.amount, 0),
      seats: rcSeats(c, sc, state.seats, state.draws, state.missed, mems),
    };
  });
  const collected = rows.reduce((s, r) => s + r.collected, 0);
  const paidOut = rows.reduce((s, r) => s + r.paidOut, 0);
  const short = rows.reduce((s, r) => s + r.shortfall, 0);
  const exec = state.draws.filter((d) => d.status === 'executed');
  const seatCount = rows.reduce((s, r) => s + r.seats.filter((x) => x.memberId).length, 0);
  const onTime = rows.reduce((s, r) => s + r.seats.filter((x) => x.memberId && !x.missed).length, 0);
  const oneDue = rows.reduce((s, r) => s + r.seats.filter((x) => x.missed === 1).length, 0);
  const multiDue = rows.reduce((s, r) => s + r.seats.filter((x) => x.missed >= 2).length, 0);

  const exportCsv = () => {
    const data = [['চক্র', 'স্কিম', 'সংগৃহীত', 'পেআউট', 'ঘাটতি', 'ড্র', 'সিট']]
      .concat(rows.map((r) => [r.c.code, r.sc.code, String(r.collected), String(r.paidOut), String(r.shortfall), String(r.done.length), String(r.filled)]));
    try {
      const url = URL.createObjectURL(new Blob([data.map((x) => x.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'rosca-report.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch { /* ব্লকড */ }
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <RcHero label="ROSCA তহবিলের দায় ব্যালেন্স" amount={tk(Math.max(0, collected - paidOut))}
        sub={`সংগৃহীত ${tk(collected)} − পেআউট ${tk(paidOut)} · পৃথক দায় খাত (D-38)`} />

      <KpiGrid>
        <Kpi label="চক্র" value={bn(state.circles.length)} note={`সমাপ্ত ${bn(state.circles.filter((c) => c.status === 'completed').length)}`} />
        <Kpi label="অংশগ্রহণ" value={`${bn(seatCount)} সিট`} note={`${bn(state.circles.length)} চক্রে`} />
        <Kpi label="আদায় হার" value={`${bn(Math.round((collected / Math.max(1, collected + short)) * 100))}%`} tone="ok" note="সংগৃহীত / (সংগৃহীত + ঘাটতি)" />
        <Kpi label="ঘাটতি" value={tk(short)} tone={short ? 'warn' : 'ok'} note="D-38" />
      </KpiGrid>

      <SectionHead title="চক্রভিত্তিক সারাংশ" sub={`${bn(rows.length)}টি চক্র`} />
      <div className="space-y-2">
        {rows.map((r) => (
          <button key={r.c.id} type="button" onClick={() => navigate(`/a/rc/circles/${r.c.id}${qs}`)}
            className="min-h-tap w-full text-left rounded-r-md bg-card border border-line px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <b className="text-sm">{r.c.code}</b>
              <Badge tone={RC_STATUS[r.c.status].tone}>{RC_STATUS[r.c.status].t}</Badge>
            </div>
            <div className="text-xs text-mut num">{r.sc.code} · ড্র {bn(r.done.length)}/{bn(r.sc.seats)} · সিট {bn(r.filled)}/{bn(r.sc.seats)}</div>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="num">{tk(r.collected)} − {tk(r.paidOut)}</span>
              <span className="ml-auto">{r.shortfall ? <Badge tone="danger">ঘাটতি {tk(r.shortfall)}</Badge> : <Badge tone="ok">ঘাটতি নেই</Badge>}</span>
            </div>
          </button>
        ))}
      </div>

      <Accordion title={`ড্র রেজিস্টার সারাংশ (${bn(exec.length)}টি)`} sub="মাধ্যমভিত্তিক বিতরণ">
        <Card>
          {state.draws.filter((d) => d.status === 'executed').length ? (
            <div className="space-y-2">
              {['cash_office', 'bkash', 'bank'].map((ch) => {
                const list = exec.filter((d) => d.channel === ch);
                const sum = list.reduce((s, d) => s + d.amount, 0);
                return (
                  <div key={ch}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{ch === 'cash_office' ? 'অফিস কাউন্টার (নগদ)' : ch === 'bkash' ? 'বিকাশ / ওয়ালেট' : 'ব্যাংক ট্রান্সফার'}</span>
                      <b className="num">{bn(list.length)}টি · {tk(sum)}</b>
                    </div>
                    <Bar pct={Math.round((list.length / Math.max(1, exec.length)) * 100)} />
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="mt-3">
            <KV k="maker ≠ checker" v={`${bn(exec.filter((d) => d.by !== d.appr).length)}/${bn(exec.length)} ✓`} />
            <KV k="রসিদ অনন্য" v={`${bn(new Set(exec.map((d) => d.receipt)).size)}/${bn(exec.length)} ✓`} />
          </div>
        </Card>
      </Accordion>

      <Accordion title="সংগ্রহ হার ও বকেয়া এজিং" sub={onTime + oneDue + multiDue > 0 ? `${bn(onTime + oneDue + multiDue)} সিট` : 'কোনো সিট নেই'}>
        <Card>
          <PoolRow label="সময়ে আদায় (০ দিন বকেয়া)" value={`${bn(onTime)} সিট`} tone="ok" />
          <div className="mt-2"><PoolRow label="১ কিস্তি বকেয়া" value={`${bn(oneDue)} সিট`} tone="warn" /></div>
          <div className="mt-2"><PoolRow label="২+ কিস্তি বকেয়া" value={`${bn(multiDue)} সিট`} tone="bad" /></div>
          <div className="mt-2"><PoolRow label="সামগ্রিক আদায় হার" value={`${bn(Math.round((collected / Math.max(1, collected + short)) * 100))}%`} /></div>
        </Card>
      </Accordion>

      <Accordion title="ডিফল্ট সারাংশ" sub="D-41 / D-46">
        <Card>
          {RC_STEP_ORDER.map((k: DefaultStep) => {
            const l = state.defaults.filter((x) => x.step === k);
            return <div key={k} className="mt-2 first:mt-0"><PoolRow label={RC_STEP[k]} value={`${bn(l.length)}টি · ${tk(l.reduce((s, x) => s + x.amount, 0))}`} /></div>;
          })}
          <KV k="প্রতিস্থাপন সম্পন্ন" v={`${bn(state.defaults.filter((d) => d.status === 'resolved' && d.step === 'replace').length)}টি`} />
        </Card>
      </Accordion>

      <Accordion title="নিয়ন্ত্রক সারাংশ" sub="D-29 অমীমাংসিত">
        <Card>
          <KV k="চক্রের সংখ্যা" v={`${bn(state.circles.length)}টি (সমাপ্ত ${bn(state.circles.filter((c) => c.status === 'completed').length)})`} />
          <KV k="অংশগ্রহণকারী সিট" v={`${bn(seatCount)}টি`} />
          <KV k="মোট লেনদেন" v={tk(collected + paidOut)} />
          <KV k="সময়ভিত্তিক আয়" v="৳০ — এই মডিউলে কোনো অতিরিক্ত চার্জ বা আয় নেই (BR-13)" />
          <p className="text-xs text-warn-ink mt-2">নিবন্ধকের রিটার্নে চক্রভিত্তিক পুল আলাদা ছকে যাবে কি না D-29 অমীমাংসিত।</p>
          <Button size="sm" variant="ghost" className="mt-2" icon={<FileText size={14} />} onClick={() => navigate(`/a/finance${qs}`)}>রিটার্ন কেন্দ্র</Button>
        </Card>
      </Accordion>

      <Button block variant="secondary" icon={<Download size={15} />} onClick={exportCsv}>রিপোর্ট CSV এক্সপোর্ট</Button>
      <p className="text-xs text-mut">সব সংখ্যা রেকর্ড থেকে গণনা — ডেমো ডেটা; কোনো হাতে লেখা সংখ্যা নেই।</p>
    </div>
  );
}
