import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import { JG_LIMIT, JG_STATUS, jgCollected, jgDaysLeft, jgMilestonesOf, jgPctOf } from '../../../domain/adminJoint';
import { Go, Note, Page, StatBar } from './webParts';

export default function JgMilestones() {
  const s = useAdminJg();
  const nav = useNavigate();
  const goals = s.state.goals;
  const reached = goals.reduce((n, g) => n + jgMilestonesOf(g, s.state.contribs).filter((m) => m.reachedAt).length, 0);

  return (
    <Page title="মাইলস্টোন ও অগ্রগতি" sub="২৫ · ৫০ · ৭৫ · ১০০% — লিডারবোর্ড নেই (D-68), শুধু সমষ্টিগত অগ্রগতি"
      back="/w/jg"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/jg/reports')}>রিপোর্ট</Button>}>
      <StatBar items={[
        { k: 'লক্ষ্য', v: bn(goals.length) },
        { k: 'মাইলস্টোন অর্জিত', v: `${bn(reached)}/${bn(goals.length * 4)}`, tone: 'ok' },
        { k: 'সক্রিয় সীমা', v: `${bn(goals.filter((g) => g.status !== 'closed').length)}/${bn(JG_LIMIT)}` },
        { k: 'মোট সংগৃহীত', v: `৳${bn(goals.reduce((n, g) => n + jgCollected(s.state.contribs, g.id), 0))}` },
      ]} />
      <Note>অগ্রগতি ব্যক্তিগত র‍্যাংকিং নয় — লক্ষ্যভিত্তিক সমষ্টি। কোনো সদস্যের নাম লিডারবোর্ডে দেখানো হয় না (D-68)।</Note>

      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((g) => {
          const pct = Math.min(100, jgPctOf(s.state.contribs, g));
          const ms = jgMilestonesOf(g, s.state.contribs);
          return (
            <Card key={g.id} title={g.name} sub={`${g.code} · মেয়াদ ${g.targetDate} · ${bn(jgDaysLeft(g))} দিন`}
              right={<Badge tone={JG_STATUS[g.status].tone}>{JG_STATUS[g.status].t}</Badge>}>
              <div className="flex items-end justify-between mb-1">
                <span className="text-sm text-mut">সংগৃহীত ৳{bn(jgCollected(s.state.contribs, g.id))} / ৳{bn(g.target)}</span>
                <b className="num text-h3">{bn(pct)}%</b>
              </div>
              <div className="h-3 rounded-r-pill bg-line-2 overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${pct}%` }} /></div>
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {ms.map((m) => (
                  <div key={m.pct} className={`rounded-r-sm border p-2 text-center ${m.reachedAt ? 'bg-ok-bg border-ok-bd' : 'bg-card-2 border-line'}`}>
                    <b className="num block text-sm">{bn(m.pct)}%</b>
                    <span className="text-[10px] text-mut block">{m.reachedAt ?? 'বাকি'}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => nav(`/w/jg/goals/${g.id}`)}>বিস্তারিত</Button>
                <Go to="/w/jg/collect">অবদান</Go>
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
