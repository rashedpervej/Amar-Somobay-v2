import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import {
  JG_CRULE, JG_STATUS, jgCollected, jgDaysLeft, jgPctOf, jgPledgeTotal,
} from '../../../domain/adminJoint';
import { Chips, Note, Page, StatBar } from './webParts';

export default function JgGoals() {
  const s = useAdminJg();
  const nav = useNavigate();
  const [st, setSt] = useState('all');
  const rows = s.state.goals.filter((g) => st === 'all' || g.status === st);
  const active = s.state.goals.filter((g) => g.status !== 'closed');

  return (
    <Page title="লক্ষ্য তালিকা ও পরিকল্পনা সীমা" sub="সক্রিয় সর্বোচ্চ ৫ · লক্ষ্য অঙ্ক কমানো যায় না · যোগদানে Admin অনুমোদন"
      right={<Button size="sm" onClick={() => nav('/w/jg/goals/new')}>নতুন লক্ষ্য</Button>}>
      <Chips value={st} onChange={setSt} items={[['all', 'সব'], ...Object.entries(JG_STATUS).map(([k, v]) => [k, v.t] as [string, string])]} />
      <StatBar items={[
        { k: 'মোট লক্ষ্য', v: bn(s.state.goals.length) },
        { k: 'সক্রিয়', v: `${bn(active.length)}/৫`, tone: active.length >= 5 ? 'warn' : 'ok' },
        { k: 'মোট লক্ষ্য অঙ্ক', v: `৳${bn(s.state.goals.reduce((n, g) => n + g.target, 0))}` },
        { k: 'সংগৃহীত', v: `৳${bn(s.state.goals.reduce((n, g) => n + jgCollected(s.state.contribs, g.id), 0))}`, tone: 'ok' },
      ]} />
      <Note tone="warn">সক্রিয় লক্ষ্যের সীমা ৫ (D-43)। অঙ্ক কমাতে হলে লক্ষ্য বাতিল ও নতুন সংস্করণ লাগবে — চলমান প্রতিশ্রুতি লঙ্ঘন করে কমানো যাবে না (D-49)।</Note>

      <Card title="লক্ষ্য" sub="মালিকানা · নিয়ম · অগ্রগতি">
        <DataTable
          columns={[
            {
              key: 'name', head: 'লক্ষ্য', render: (r) => (
                <button type="button" onClick={() => nav(`/w/jg/goals/${r.id}`)} className="min-h-10 text-left">
                  <b className="text-green-800 hover:underline block">{r.name}</b>
                  <span className="text-xs text-mut">{r.code} · {r.desc.slice(0, 48)}…</span>
                </button>
              ),
            },
            { key: 'rule', head: 'অবদান নিয়ম', render: (r) => <><b>{JG_CRULE[r.crule]}</b><span className="block text-xs text-mut">{r.crule === 'fixed' ? `৳${bn(r.monthly ?? 0)}/মাস` : `ন্যূনতম ৳${bn(r.monthlyMin)}`}</span></> },
            { key: 'target', head: 'লক্ষ্য', align: 'right', render: (r) => `৳${bn(r.target)}` },
            { key: 'pledge', head: 'প্রতিশ্রুতি', align: 'right', render: (r) => `৳${bn(jgPledgeTotal(s.state.parts, r.id))}` },
            { key: 'pct', head: 'অগ্রগতি', align: 'center', render: (r) => `${bn(Math.min(100, jgPctOf(s.state.contribs, r)))}%` },
            { key: 'date', head: 'মেয়াদ', render: (r) => <>{r.targetDate}<span className="block text-xs text-mut">{bn(jgDaysLeft(r))} দিন</span></> },
            { key: 'owner', head: 'মালিক' },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={JG_STATUS[r.status].tone}>{JG_STATUS[r.status].t}</Badge> },
            { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/jg/goals/${r.id}`)}>খুলুন</Button> },
          ]}
          rows={rows}
        />
      </Card>
    </Page>
  );
}
