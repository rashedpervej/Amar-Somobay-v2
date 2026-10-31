/* JAM-10 · যৌথ লক্ষ্য রিপোর্ট — তহবিল, সংগ্রহ, ব্যয় ও নিয়ন্ত্রক সারাংশ */

import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import {
  JG_STATUS, jgAllArrears, jgChannelLabel, jgCollected, jgDisbOf, jgGoalById, jgPaidOut, jgPartsOf, jgPctOf, jgSpend,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { Accordion, KV } from './parts';
import { Bar, JrHero, PoolRow, tk, useRoleQS } from './rcParts';

export default function JgReports() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminJg();
  const col = state.goals.reduce((s, g) => s + jgCollected(state.contribs, g.id), 0);
  const tgt = state.goals.reduce((s, g) => s + g.target, 0);
  const spend = jgSpend(state.disbs);
  const ar = jgAllArrears(state.goals, state.parts, state.contribs);
  const byChannel = (['cash_office', 'bkash', 'bank'] as const).map((k) => ({
    k, sum: state.contribs.filter((c) => c.channel === k).reduce((s, c) => s + c.amount, 0),
    n: state.contribs.filter((c) => c.channel === k).length,
  }));

  const exportCsv = () => {
    const rows = [['লক্ষ্য', 'কোড', 'লক্ষ্য অঙ্ক', 'সংগৃহীত', 'ব্যয়িত', 'অংশগ্রহণকারী', 'শতাংশ']]
      .concat(state.goals.map((g) => [
        g.name, g.code, String(g.target), String(jgCollected(state.contribs, g.id)),
        String(jgPaidOut(state.disbs, g.id)),
        String(jgPartsOf(state.parts, g.id).filter((p) => p.status !== 'removed').length),
        String(jgPctOf(state.contribs, g)),
      ]));
    try {
      const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'joint-goals-report.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch { /* ব্লকড */ }
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <JrHero label="লক্ষ্য তহবিলের দায় (D-39)" amount={tk(col)}
        sub={`লক্ষ্য ${tk(tgt)} · ব্যয়িত ${tk(spend)} · অবশিষ্ট ${tk(Math.max(0, col - spend))}`} />

      <KpiGrid>
        <Kpi label="লক্ষ্য" value={bn(state.goals.length)} note={`সক্রিয় ${bn(state.goals.filter((g) => g.status !== 'closed').length)}`} />
        <Kpi label="অংশগ্রহণ" value={bn(state.parts.filter((p) => p.status === 'active' || p.status === 'behind').length)} note="সক্রিয় অংশগ্রহণকারী" />
        <Kpi label="সংগ্রহ হার" value={`${bn(Math.round((col / Math.max(1, tgt)) * 100))}%`} tone="ok" note={`${bn(state.contribs.length)} রসিদ`} />
        <Kpi label="বকেয়া" value={tk(ar.reduce((s, x) => s + x.gap, 0))} tone="warn" note={`${bn(ar.length)} জন`} />
      </KpiGrid>

      <SectionHead title="লক্ষ্যভিত্তিক" sub={`${bn(state.goals.length)}টি · অগ্রগতি অনুযায়ী`} />
      <div className="space-y-2">
        {state.goals.map((g) => {
          const pct = jgPctOf(state.contribs, g);
          return (
            <button key={g.id} type="button" onClick={() => navigate(`/a/jg/goals/${g.id}${qs}`)}
              className="min-h-tap w-full text-left rounded-r-md bg-card border border-line px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm truncate">{g.name}</b>
                <Badge tone={JG_STATUS[g.status].tone}>{bn(pct)}%</Badge>
              </div>
              <div className="text-xs text-mut num">{g.code} · {tk(jgCollected(state.contribs, g.id))} / {tk(g.target)} · ব্যয় {tk(jgPaidOut(state.disbs, g.id))}</div>
              <div className="mt-1.5"><Bar pct={pct} tone={pct >= 100 ? 'ok' : 'ok'} /></div>
            </button>
          );
        })}
      </div>

      <Accordion title="মাধ্যমভিত্তিক সংগ্রহ" sub={`${bn(state.contribs.length)} রসিদ`}>
        <Card>
          {byChannel.map((c) => (
            <div key={c.k} className="mb-2 last:mb-0">
              <div className="flex justify-between text-xs mb-1"><span>{jgChannelLabel(c.k)}</span><b className="num">{bn(c.n)}টি · {tk(c.sum)}</b></div>
              <Bar pct={Math.round((c.sum / Math.max(1, col)) * 100)} />
            </div>
          ))}
        </Card>
      </Accordion>

      <Accordion title="ব্যয় ও প্রমাণ" sub="D-50 · ভেন্ডর পেমেন্ট">
        <Card>
          <PoolRow label="পরিশোধিত" value={tk(spend)} tone="ok" />
          <div className="mt-2"><PoolRow label="অনুমোদনাধীন" value={tk(state.disbs.filter((d) => d.status === 'approval').reduce((s, d) => s + d.amount, 0))} tone="warn" /></div>
          <div className="mt-2"><PoolRow label="প্রমাণ ছাড়া আটকে" value={`${bn(state.disbs.filter((d) => d.status === 'blocked').length)}টি`} tone="bad" /></div>
          {state.disbs.filter((d) => d.status === 'paid').map((d) => (
            <KV key={d.id} k={`${d.no} · ${jgGoalById(state.goals, d.goal).code}`} v={`${tk(d.amount)} · ${d.evidence.length} প্রমাণ`} />
          ))}
        </Card>
      </Accordion>

      <Accordion title="নিয়ন্ত্রক সারাংশ" sub="D-37 / D-39 / D-68">
        <Card>
          <KV k="মোট দায়" v={tk(col)} />
          <KV k="মোট সঞ্চয়ে যোগ" v="না — আলাদা দায় খাত (D-37)" />
          <KV k="ব্যক্তিগত উত্তোলন" v="৳০ · নিষিদ্ধ (BR-19)" />
          <KV k="মাইলস্টোন" v="২৫/৫০/৭৫/১০০% · লিডারবোর্ড নেই (D-68)" />
          <p className="text-xs text-warn-ink mt-2">নিবন্ধকের রিটার্নে লক্ষ্য তহবিল আলাদা ছকে দেখানোর ফরম্যাট D-29 অমীমাংসিত — নিশ্চিত হলে ঠিক হবে।</p>
          <Button size="sm" variant="ghost" className="mt-2" icon={<FileText size={14} />} onClick={() => navigate(`/a/finance${qs}`)}>আর্থিক বিবরণ</Button>
        </Card>
      </Accordion>

      <Button block variant="secondary" icon={<Download size={15} />} onClick={exportCsv}>রিপোর্ট CSV এক্সপোর্ট</Button>
      <p className="text-xs text-mut">ডেমো ডেটা — সব সংখ্যা রেকর্ড থেকে গণনা; কোনো হাতে লেখা সংখ্যা নেই।</p>
    </div>
  );
}
