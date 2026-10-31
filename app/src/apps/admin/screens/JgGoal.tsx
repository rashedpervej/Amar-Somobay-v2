/* JAM-04 · লক্ষ্যের হাব — অগ্রগতি, অংশগ্রহণকারী, মাইলস্টোন, ব্যয় ও নিষ্পত্তি */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Target, Users, Wallet } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, JG_CRULE, JG_DEADLINE, JG_OWN, JG_STATUS, jgCollected, jgDaysLeft, jgDisbOf, jgGoalById, jgMilestonesOf,
  jgPaidOut, jgPartsOf, jgPctOf, jgPledgeTotal, jgPledgeTotal as _p, jgTotalMonths,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { Accordion, KV } from './parts';
import { Bar, JrHero, PoolRow, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name })), ...DEMO_EXTRA.map((m) => ({ id: m.id, name: m.name }))];

export default function JgGoal() {
  const { goalId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const go = (p: string) => navigate(`${p}${qs}`);
  const { state } = useAdminJg();
  const g = jgGoalById(state.goals, goalId);
  const pct = jgPctOf(state.contribs, g);
  const col = jgCollected(state.contribs, g.id);
  const disbs = jgDisbOf(state.disbs, g.id);
  const spend = jgPaidOut(state.disbs, g.id);
  const parts = jgPartsOf(state.parts, g.id).filter((p) => p.status !== 'removed');
  const activeParts = parts.filter((p) => p.status === 'active' || p.status === 'behind');
  const behind = parts.filter((p) => p.status === 'behind');
  const milestone = jgMilestonesOf(g, state.contribs);
  const dl = jgDaysLeft(g);

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => go('/a/jg/goals')}>লক্ষ্য তালিকা</Button>

      <JrHero label={`${g.code} · ${JG_STATUS[g.status].t}`} amount={`${tk(col)} / ${tk(g.target)}`}
        sub={`${bn(pct)}% · ${JG_CRULE[g.crule]} · মেয়াদ ${g.targetDate}`}>
        <div className="mt-3">
          <Bar pct={pct} tone={pct >= 100 ? 'ok' : 'ok'} />
          <div className="flex items-center justify-between mt-1 text-xs text-purple-bd num">
            <span>{bn(activeParts.length)} জন সক্রিয় · {bn(behind.length)} জন পেছনে</span>
            <span>{dl >= 0 ? `${bn(dl)} দিন বাকি` : 'মেয়াদ শেষ'}</span>
          </div>
        </div>
      </JrHero>

      <KpiGrid>
        <Kpi label="সংগৃহীত" value={tk(col)} tone="ok" note={`লক্ষ্য ${tk(g.target)}`} />
        <Kpi label="প্রতিশ্রুতি" value={tk(jgPledgeTotal(state.parts, g.id))} note={`${bn(activeParts.length)} জন`} />
        <Kpi label="ব্যয়িত" value={tk(spend)} note={`${bn(disbs.filter((d) => d.status === 'paid').length)} ভাউচার`} />
        <Kpi label="অব্যয়িত" value={tk(Math.max(0, col - spend))} tone={col - spend > 0 ? 'warn' : 'ok'} note="D-39 দায় খাত" />
      </KpiGrid>

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Users size={15} />} onClick={() => go(`/a/jg/goals/${g.id}/parts`)}>অংশগ্রহণকারী</Button>
        <Button variant="secondary" icon={<Wallet size={15} />} onClick={() => go(`/a/jg/goals/${g.id}/disbursements`)}>বিতরণ</Button>
      </div>

      <Card title="উদ্দেশ্য" sub={g.owner}>
        <p className="text-sm text-txt-2">{g.desc}</p>
        <p className="text-xs text-mut mt-2">{g.note}</p>
      </Card>

      <SectionHead title="মাইলস্টোন" sub="অবদান থেকে গণনা (D-68) · লিডারবোর্ড নেই"
        right={<button type="button" className="min-h-tap px-1 text-sm font-bold text-purple-ink" onClick={() => go(`/a/jg/goals/${g.id}/milestones`)}>বিস্তারিত</button>} />
      <Card>
        <div className="grid grid-cols-4 gap-2">
          {milestone.map((m) => (
            <div key={m.pct} className={`rounded-r-sm border px-2 py-2 text-center ${m.reachedAt ? 'border-ok-bd bg-ok-bg' : 'border-line bg-card-2'}`}>
              <div className="text-xs font-bold num">{bn(m.pct)}%</div>
              <div className={`text-[11px] num ${m.reachedAt ? 'text-ok-ink' : 'text-mut'}`}>{m.reachedAt ?? 'বাকি'}</div>
            </div>
          ))}
        </div>
      </Card>

      <SectionHead title="সাম্প্রতিক বিতরণ" sub={`${bn(disbs.length)}টি ভাউচার`}
        right={<button type="button" className="min-h-tap px-1 text-sm font-bold text-purple-ink" onClick={() => go(`/a/jg/goals/${g.id}/disbursements`)}>সব</button>} />
      <Card>
        {disbs.length === 0 ? <p className="text-sm text-mut">এখনো কোনো বিতরণ ভাউচার নেই — লক্ষ্য পূরণের পর তৈরি হবে (BR-19)।</p> : disbs.slice(0, 3).map((d) => (
          <div key={d.id} className="border-b border-line-2 last:border-b-0 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{d.no} · {d.purpose}</div>
              <div className="text-xs text-mut num">{d.payee} · {d.at}</div>
            </div>
            <Badge tone={d.status === 'paid' ? 'ok' : d.status === 'approval' ? 'warn' : d.status === 'blocked' ? 'danger' : 'neutral'}>{tk(d.amount)}</Badge>
          </div>
        ))}
      </Card>

      {g.status === 'settling' ? (
        <Button block variant="danger" icon={<Target size={16} />} onClick={() => go(`/a/jg/goals/${g.id}/settle`)}>নিষ্পত্তি সম্পন্ন করুন (D-39)</Button>
      ) : null}

      <Accordion title="নিয়ম ও মালিকানা" sub="D-37/39/49/50">
        <Card>
          <KV k="মালিকানা মডেল" v={JG_OWN.find((o) => o[0] === g.ownership)?.[1] ?? g.ownership} />
          <KV k="ব্যক্তিগত উত্তোলন" v="নিষিদ্ধ · কমিটি + প্রমাণ (BR-19)" />
          <KV k="মেয়াদে পূরণ না হলে" v={g.deadlinePolicy.map((d) => JG_DEADLINE.find((x) => x[0] === d)?.[1]).join(' · ')} />
          <KV k="মেয়াদ (মাস)" v={bn(jgTotalMonths(g))} />
          <KV k="কমিটি" v={g.committee} />
          <KV k="সংস্করণ" v={`v${bn(g.version)} · ${g.createdBy}`} />
        </Card>
      </Accordion>
      <p className="text-xs text-mut">একই সংখ্যা সদস্য অ্যাপ (JM) ও ওয়েব (JA) এ দেখা যায় — একই রেকর্ড, একই নিয়ম।</p>
    </div>
  );
}
