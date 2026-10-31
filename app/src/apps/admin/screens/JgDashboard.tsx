/* JAM-01 · যৌথ লক্ষ্য ড্যাশবোর্ড — তহবিল দায়, এই মাসের সংগ্রহ, অনুমোদন ও বকেয়া */

import { useNavigate } from 'react-router-dom';
import { CheckCheck, Clock, Target, TrendingDown, Users } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, JG_CRULE, JG_DEADLINE, JG_LIMIT, JG_STATUS, jgActive, jgAllArrears, jgCollected, jgDisbOf,
  jgExpectedMonth, jgGotThisMonth, jgLimitLeft, jgPaidOut, jgPartsOf, jgPctOf, jgPendingAll, jgPendingDisb,
  jgPendingJoins, jgPendingSettle, jgSpend, jgDaysLeft, jgGoalById,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { Accordion, KV } from './parts';
import { Bar, JrHero, SplitRow, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name })), ...DEMO_EXTRA.map((m) => ({ id: m.id, name: m.name }))];

export default function JgDashboard() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const go = (p: string) => navigate(`${p}${qs}`);
  const { state } = useAdminJg();
  const act = jgActive(state.goals);
  const col = state.goals.reduce((s, g) => s + jgCollected(state.contribs, g.id), 0);
  const tgt = state.goals.reduce((s, g) => s + g.target, 0);
  const spend = jgSpend(state.disbs);
  const expMonth = jgExpectedMonth(state.goals, state.parts);
  const gotMonth = jgGotThisMonth(state.contribs);
  const ar = jgAllArrears(state.goals, state.parts, state.contribs);
  const pend = jgPendingAll(state.parts, state.disbs, state.goals);

  return (
    <div className="p-4 space-y-3 pb-8">
      <KpiGrid>
        <Kpi label="চলমান লক্ষ্য" value={`${bn(act.length)}টি`} note={`সীমা ${bn(JG_LIMIT)}টি (D-43) · বাকি ${bn(jgLimitLeft(state.goals))}`} />
        <Kpi label="এই মাসের সংগ্রহ" value={`${bn(expMonth ? Math.round((gotMonth / expMonth) * 100) : 0)}%`} tone="ok" note={`${tk(gotMonth)} / ${tk(expMonth)}`} />
        <Kpi label="অনুমোদন বাকি" value={`${bn(pend)}টি`} tone="warn" note={`বিতরণ ${bn(jgPendingDisb(state.disbs).length)} · যোগদান ${bn(jgPendingJoins(state.parts).length)}`} />
        <Kpi label="বকেয়া সদস্য" value={`${bn(ar.length)} জন`} tone="warn" note={`${tk(ar.reduce((s, x) => s + x.gap, 0))} বাকি`} />
      </KpiGrid>

      <JrHero label="মোট নির্দিষ্ট লক্ষ্য তহবিল (দায়) · D-39" amount={tk(col)}
        sub={`লক্ষ্য ${tk(tgt)} · সংগ্রহ ${bn(Math.round((col / Math.max(1, tgt)) * 100))}% · ব্যয়িত ${tk(spend)}`}>
        <div className="mt-3 space-y-1">
          <SplitRow k="অব্যয়িত ব্যালেন্স" v={tk(Math.max(0, col - spend))} />
          <SplitRow k="অনুমোদনাধীন ভাউচার" v={tk(state.disbs.filter((d) => d.status === 'approval').reduce((s, d) => s + d.amount, 0))} />
          <SplitRow k="ব্যক্তিগত উত্তোলন (BR-19)" v="৳০ · নিষিদ্ধ" />
        </div>
      </JrHero>

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Clock size={15} />} onClick={() => go('/a/jg/goals')}>সব লক্ষ্য</Button>
        <Button variant="secondary" icon={<CheckCheck size={15} />} onClick={() => go('/a/jg/arrears')}>বকেয়া সংগ্রহ</Button>
      </div>

      <SectionHead title="লক্ষ্যসমূহ" sub={`${bn(state.goals.length)}টি · অগ্রগতি অনুযায়ী`}
        right={<button type="button" className="min-h-tap px-1 text-sm font-bold text-green-800" onClick={() => go('/a/jg/goals')}>সব</button>} />
      <div className="space-y-2">
        {state.goals.slice(0, 4).map((g) => {
          const pct = jgPctOf(state.contribs, g);
          const dl = jgDaysLeft(g);
          return (
            <button key={g.id} type="button" onClick={() => go(`/a/jg/goals/${g.id}`)}
              className="min-h-tap w-full text-left rounded-r-md bg-card border border-line px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-body font-extrabold truncate">{g.name}</div>
                  <div className="text-xs text-mut num">{g.code} · {JG_CRULE[g.crule]}{g.crule === 'fixed' ? ` · ${tk(g.monthly ?? 0)}/মাস` : ''}</div>
                </div>
                <Badge tone={JG_STATUS[g.status].tone}>{JG_STATUS[g.status].t}</Badge>
              </div>
              <div className="mt-2"><Bar pct={pct} tone={pct >= 100 ? 'ok' : pct < 50 ? 'warn' : 'ok'} /></div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <span className="num font-bold">{tk(jgCollected(state.contribs, g.id))} · {bn(pct)}%</span>
                <span className={`num ${dl < 0 ? 'text-danger-ink font-bold' : 'text-mut'}`}>{dl >= 0 ? `${bn(dl)} দিন বাকি` : 'মেয়াদ শেষ'}</span>
              </div>
            </button>
          );
        })}
      </div>

      <SectionHead title="অনুমোদনের অপেক্ষায়" sub={`${bn(pend)}টি কাজ · maker ≠ checker`} />
      <Card>
        {jgPendingDisb(state.disbs).map((d) => (
          <button key={d.id} type="button" onClick={() => go(`/a/jg/goals/${d.goal}/disbursements`)}
            className="min-h-tap w-full text-left border-b border-line-2 py-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-sm">বিতরণ · {jgGoalById(state.goals, d.goal).code}</b>
              <Badge tone="warn"><Clock size={12} /> {tk(d.amount)}</Badge>
            </div>
            <div className="text-xs text-mut">{d.no} · {d.purpose}</div>
          </button>
        ))}
        {jgPendingJoins(state.parts).map((p) => {
          const g = jgGoalById(state.goals, p.goal);
          return (
            <button key={`${p.goal}-${p.memberId}`} type="button" onClick={() => go(`/a/jg/goals/${p.goal}/parts`)}
              className="min-h-tap w-full text-left border-b border-line-2 py-2">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm">যোগদান · {g.code}</b>
                <Badge tone="warn"><Users size={12} /> {mems.find((m) => m.id === p.memberId)?.name ?? p.memberId}</Badge>
              </div>
              <div className="text-xs text-mut num">প্রতিশ্রুতি {tk(p.pledged)} · {p.joinedAt ?? '—'} থেকে অপেক্ষমাণ</div>
            </button>
          );
        })}
        {jgPendingDisb(state.disbs).length + jgPendingJoins(state.parts).length === 0 ? <p className="text-sm text-mut">কোনো অনুমোদন বাকি নেই।</p> : null}
        <p className="text-xs text-mut mt-2">একই ব্যক্তি প্রস্তাব ও অনুমোদন করতে পারবেন না (BR-04)।</p>
      </Card>

      <SectionHead title="বকেয়া সদস্য" sub={`${bn(ar.length)} জন · D-49`}
        right={<button type="button" className="min-h-tap px-1 text-sm font-bold text-green-800" onClick={() => go('/a/jg/arrears')}>সব</button>} />
      <Card>
        {ar.slice(0, 4).map((x) => (
          <div key={`${x.goal.id}-${x.part.memberId}`} className="flex items-center justify-between gap-2 border-b border-line-2 last:border-b-0 py-2">
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{mems.find((m) => m.id === x.part.memberId)?.name ?? x.part.memberId}</div>
              <div className="text-xs text-mut num">{x.goal.code} · প্রত্যাশিত {tk(x.expected)} · জমা {tk(x.paid)}</div>
            </div>
            <Badge tone="warn">{tk(x.gap)}</Badge>
          </div>
        ))}
        {ar.length === 0 ? <p className="text-sm text-ok-ink font-bold">সবাই সময়মতো অবদান দিয়েছেন।</p> : null}
      </Card>

      <Accordion title="নিয়ম, খাত ও সিদ্ধান্ত" sub="D-37/39/43/49/50/68">
        <Card>
          <KV k="মালিকানা মডেল" v={`${JG_DEADLINE.length ? 'সমিতির নির্দিষ্ট-উদ্দেশ্য তহবিল' : ''} (D-39)`} />
          <KV k="ব্যক্তিগত উত্তোলন" v="নিষিদ্ধ · কমিটির সিদ্ধান্ত + প্রমাণ বাধ্যতামূলক (BR-19)" />
          <KV k="মোট সঞ্চয়ে যোগ হয়?" v="না — আলাদা কার্ড (D-37)" />
          <KV k="সক্রিয় লক্ষ্যের সীমা" v={`${bn(JG_LIMIT)}টি (D-43)`} />
          <KV k="যোগদান" v="Admin অনুমোদন বাধ্যতামূলক (D-49)" />
          <KV k="মাইলস্টোন / লিডারবোর্ড" v="মাইলস্টোন আছে · লিডারবোর্ড নেই (D-68)" />
          <p className="text-xs text-mut mt-2 flex items-start gap-1"><Target size={13} className="mt-0.5" /> এই ড্যাশবোর্ডের প্রতিটি সংখ্যা রেকর্ড থেকে গণনা — ওয়েব JA-01 এর সঙ্গে একই নিয়ম।</p>
        </Card>
      </Accordion>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<TrendingDown size={15} />} onClick={() => go('/a/jg/reports')}>রিপোর্ট</Button>
        <Button variant="ghost" onClick={() => go('/a/jg/new')}>নতুন লক্ষ্য</Button>
      </div>
    </div>
  );
}
