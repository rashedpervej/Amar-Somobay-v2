/* JAM-02 · লক্ষ্য তালিকা — ফিল্টার, সীমা (D-43), অংশগ্রহণ ও মেয়াদ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Search, Users } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import {
  JG_CRULE, JG_LIMIT, JG_STATUS, jgActive, jgCollected, jgDaysLeft, jgGoalById, jgLimitLeft, jgPartsOf, jgPctOf,
  type JStatus,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { Accordion } from './parts';
import { Bar, tk, useRoleQS } from './rcParts';

const TABS: (JStatus | 'all')[] = ['all', 'forming', 'active', 'achieved', 'settling', 'closed'];

export default function JgGoals() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const go = (p: string) => navigate(`${p}${qs}`);
  const { state } = useAdminJg();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<JStatus | 'all'>('all');
  const left = jgLimitLeft(state.goals);
  const list = state.goals.filter((g) => (tab === 'all' || g.status === tab)
    && (!q.trim() || g.name.includes(q.trim()) || g.code.includes(q.trim()) || g.committee.includes(q.trim())));

  const card = (id: string) => {
    const g = jgGoalById(state.goals, id);
    const pct = jgPctOf(state.contribs, g);
    const parts = jgPartsOf(state.parts, g.id).filter((p) => p.status !== 'removed');
    const dl = jgDaysLeft(g);
    return (
      <button key={g.id} type="button" onClick={() => go(`/a/jg/goals/${g.id}`)}
        className="min-h-tap w-full text-left rounded-r-md bg-card border border-line shadow-sh-1 px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-extrabold text-body truncate">{g.name}</div>
            <div className="text-xs text-mut num">{g.code} · {JG_STATUS[g.status].t} · v{bn(g.version)} · {g.owner}</div>
          </div>
          <Badge tone={JG_STATUS[g.status].tone}>{JG_CRULE[g.crule]}</Badge>
        </div>
        <div className="mt-2"><Bar pct={pct} tone={pct >= 100 ? 'ok' : pct < 50 ? 'warn' : 'ok'} /></div>
        <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
          <span className="inline-flex items-center gap-1 text-mut num"><Users size={12} /> {bn(parts.length)}/{bn(g.maxParts)} জন</span>
          <span className="inline-flex items-center gap-1 text-mut num"><Calendar size={12} /> {g.targetDate}</span>
          <span className={`inline-flex items-center gap-1 num ${dl <= 60 ? 'text-warn-ink font-bold' : 'text-mut'}`}><Clock size={12} /> {dl >= 0 ? `${bn(dl)} দিন` : 'মেয়াদ শেষ'}</span>
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <b className="num">{tk(jgCollected(state.contribs, g.id))} · {bn(pct)}%</b>
          <span className="text-mut num">লক্ষ্য {tk(g.target)}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Card>
        <label htmlFor="jg-q" className="block text-sm font-bold text-txt-2 mb-1.5">লক্ষ্য খুঁজুন</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <input id="jg-q" className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম / কোড (JG-…) / কমিটি" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {TABS.map((k) => (
            <Chip key={k} active={tab === k} onClick={() => setTab(k)}>
              {k === 'all' ? 'সব' : JG_STATUS[k].t.replace(' (D-39)', '')} ({bn(k === 'all' ? state.goals.length : state.goals.filter((g) => g.status === k).length)})
            </Chip>
          ))}
        </div>
      </Card>

      <KpiGrid>
        <Kpi label="মোট লক্ষ্য" value={bn(state.goals.length)} note={`সক্রিয় ${bn(jgActive(state.goals).length)}`} />
        <Kpi label="সীমা বাকি" value={bn(left)} note={`মোট ${bn(JG_LIMIT)}টি (D-43)`} tone={left ? 'ok' : 'warn'} />
        <Kpi label="অর্জিত" value={bn(state.goals.filter((g) => g.status === 'achieved').length)} tone="ok" note="বিতরণ চলছে" />
        <Kpi label="নিষ্পত্তি" value={bn(state.goals.filter((g) => g.status === 'settling').length)} tone="warn" note="D-39" />
      </KpiGrid>

      <div className="flex gap-2">
        <Button block icon={<Plus size={16} />} onClick={() => go('/a/jg/new')} disabled={!left}>নতুন লক্ষ্য</Button>
        <Button variant="secondary" onClick={() => go('/a/jg')}>ড্যাশবোর্ড</Button>
      </div>
      {!left ? <p className="text-xs text-warn-ink font-bold">সীমা পূর্ণ — নতুন লক্ষ্য তৈরি করতে পুরোনো লক্ষ্য বন্ধ করতে হবে (D-43)।</p> : null}

      <SectionHead title="চলমান ও গঠনধীন" sub={`${bn(state.goals.filter((g) => g.status === 'active' || g.status === 'forming').length)}টি`} />
      <div className="space-y-2">
        {list.filter((g) => g.status === 'active' || g.status === 'forming' || tab !== 'all').map((g) => card(g.id))}
        {list.filter((g) => g.status === 'active' || g.status === 'forming' || tab !== 'all').length === 0 ? <Card><p className="text-sm text-mut">কোনো লক্ষ্য নেই।</p></Card> : null}
      </div>

      {tab === 'all' ? (
        <>
          <SectionHead title="অর্জিত, নিষ্পত্তিধীন ও বন্ধ" sub={`${bn(state.goals.filter((g) => g.status !== 'active' && g.status !== 'forming').length)}টি`} />
          <div className="space-y-2">{state.goals.filter((g) => g.status !== 'active' && g.status !== 'forming').map((g) => card(g.id))}</div>
        </>
      ) : null}

      <Accordion title="তৈরির আগে যা জানা দরকার" sub="D-43 / D-49">
        <Card>
          <ul className="text-sm text-txt-2 space-y-1.5 list-disc pl-4">
            <li>{bn(JG_LIMIT)}টি সক্রিয় লক্ষ্যের সীমা (D-43) — সীমা পূর্ণ হলে নতুন নয়।</li>
            <li>লাইভ লক্ষ্যের অঙ্ক কমানো যাবে না (D-49); বাড়ালে নতুন সংস্করণ ও কমিটির সিদ্ধান্ত।</li>
            <li>ন্যূনতম অংশগ্রহণকারী লক্ষ্যভেদে সেট হয় (ডিফল্ট ৩ জন); যোগদানে Admin অনুমোদন।</li>
            <li>একসঙ্গে অনেক লক্ষ্য খুললে সংগ্রহ ভাগ হয়ে যায় — কমিটির সিদ্ধান্ত ছাড়া নয়।</li>
          </ul>
        </Card>
      </Accordion>
      <p className="text-xs text-mut">বন্ধ লক্ষ্যের হিসাবও পড়া যায় — রেকর্ড মুছে যায় না (অপরিবর্তনীয় অডিট ট্রেইল)।</p>
    </div>
  );
}
