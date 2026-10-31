/* JAM-07 · মাইলস্টোন ও অবদানের ধারা — ২৫/৫০/৭৫/১০০% কখন অতিক্রান্ত (D-68) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { jgChannelLabel, jgCollected, jgContribsOf, jgGoalById, jgMilestonesOf, jgPctOf } from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { KV } from './parts';
import { Bar, PoolRow, tk, useRoleQS } from './rcParts';

export default function JgMilestones() {
  const { goalId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminJg();
  const g = jgGoalById(state.goals, goalId);
  const ms = jgMilestonesOf(g, state.contribs);
  const cs = jgContribsOf(state.contribs, g.id);
  const pct = jgPctOf(state.contribs, g);
  const next = ms.find((m) => !m.reachedAt);
  const [filter, setFilter] = useState<'all' | 'cash_office' | 'bkash' | 'bank'>('all');
  const list = cs.filter((c) => filter === 'all' || c.channel === filter).slice().sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/jg/goals/${g.id}${qs}`)}>লক্ষ্যে ফিরুন</Button>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <b>{g.code} · অগ্রগতি</b>
          <Badge tone={pct >= 100 ? 'ok' : 'purple'}>{bn(pct)}%</Badge>
        </div>
        <div className="mt-2"><Bar pct={pct} tone={pct >= 100 ? 'ok' : 'ok'} /></div>
        <div className="flex justify-between text-xs text-mut mt-1 num">
          <span>{tk(jgCollected(state.contribs, g.id))}</span><span>লক্ষ্য {tk(g.target)}</span>
        </div>
        <div className="mt-3">
          <PoolRow label="পরবর্তী মাইলস্টোন" value={next ? `${bn(next.pct)}% · ${tk(Math.round((g.target * next.pct) / 100))}` : 'সব মাইলস্টোন অতিক্রান্ত ✓'} tone={next ? 'warn' : 'ok'} />
        </div>
      </Card>

      <KpiGrid>
        <Kpi label="অতিক্রান্ত" value={`${bn(ms.filter((m) => m.reachedAt).length)}/৪`} tone="ok" note="অবদান থেকে গণনা" />
        <Kpi label="রসিদ" value={bn(cs.length)} note={`${bn(new Set(cs.map((c) => c.memberId)).size)} জন`} />
        <Kpi label="গড় অবদান" value={tk(cs.length ? Math.round(cs.reduce((s, c) => s + c.amount, 0) / cs.length) : 0)} note="প্রতি রসিদ" />
        <Kpi label="লিডারবোর্ড" value="নেই" tone="neutral" note="D-68 — ইচ্ছাকৃত" />
      </KpiGrid>

      <SectionHead title="মাইলস্টোন" sub="অগ্রগতির ২৫/৫০/৭৫/১০০% — স্বয়ংক্রিয়" />
      <div className="space-y-2">
        {ms.map((m) => (
          <div key={m.pct} className={`rounded-r-md border px-3.5 py-3 flex items-center gap-3 ${m.reachedAt ? 'border-ok-bd bg-ok-bg' : 'border-line bg-card'}`}>
            <span className={`w-9 h-9 shrink-0 grid place-items-center rounded-r-pill ${m.reachedAt ? 'bg-ok text-white' : 'bg-line-2 text-mut'}`}>
              <Trophy size={16} />
            </span>
            <div className="grow min-w-0">
              <div className="text-sm font-extrabold num">{bn(m.pct)}% · {tk(Math.round((g.target * m.pct) / 100))}</div>
              <div className="text-xs text-mut num">{m.reachedAt ? `অতিক্রান্ত · ${m.reachedAt}` : 'এখনো পৌঁছায়নি'}</div>
            </div>
            {m.reachedAt ? <Badge tone="ok">✓</Badge> : <Badge tone="neutral">বাকি</Badge>}
          </div>
        ))}
      </div>

      <SectionHead title="অবদানের ধারা" sub={`${bn(list.length)}টি রসিদ`} />
      <div className="flex flex-wrap gap-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>সব</Chip>
        {(['cash_office', 'bkash', 'bank'] as const).map((k) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{jgChannelLabel(k)}</Chip>
        ))}
      </div>
      <Card>
        {list.slice(0, 12).map((c) => (
          <div key={c.receipt} className="border-b border-line-2 last:border-b-0 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold num">{c.receipt} · {c.memberId.toUpperCase()}</div>
              <div className="text-xs text-mut num">{c.at} · {jgChannelLabel(c.channel)} · {c.by}</div>
            </div>
            <b className="num text-sm">{tk(c.amount)}</b>
          </div>
        ))}
        {list.length > 12 ? <p className="text-xs text-mut mt-2">আরও {bn(list.length - 12)}টি রসিদ — রিপোর্টে সম্পূর্ণ তালিকা।</p> : null}
        {list.length === 0 ? <p className="text-sm text-mut">এই মাধ্যমে কোনো অবদান নেই।</p> : null}
      </Card>

      <Card title="নিয়ম">
        <KV k="মাইলস্টোনের উৎস" v="goal_contributions থেকে গণনা — হাতে লেখা নয় (D-68)" />
        <KV k="লিডারবোর্ড" v="নেই — তুলনা নয়, স্বচ্ছতা" />
        <KV k="প্রকাশ" v={g.publish ? 'সদস্যদের কাছে প্রকাশিত' : 'লুকানো'} />
      </Card>
    </div>
  );
}
