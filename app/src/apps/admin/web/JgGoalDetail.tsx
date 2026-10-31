import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import { rcMembers } from '../../../store/adminRoscaStore';
import {
  JG_CRULE, JG_OWN, JG_PART_ST, JG_STATUS, jgCollected, jgDaysLeft, jgDisbOf, jgGoalById, jgLabel, jgMilestonesOf,
  jgPartsOf, jgPaidOut, jgPctOf, jgPledgeTotal, jgTotalMonths,
} from '../../../domain/adminJoint';
import { Desk, Go, Money, Note, Page, Rail, StatBar } from './webParts';

const mem = (id: string) => rcMembers.find((m) => m.id === id)?.name ?? id;

export default function JgGoalDetail() {
  const { goalId } = useParams();
  const s = useAdminJg();
  const nav = useNavigate();
  const g = jgGoalById(s.state.goals, goalId);
  const parts = jgPartsOf(s.state.parts, g.id);
  const cs = s.state.contribs.filter((c) => c.goal === g.id);
  const disbs = jgDisbOf(s.state.disbs, g.id);
  const pct = Math.min(100, jgPctOf(s.state.contribs, g));
  const ms = jgMilestonesOf(g, s.state.contribs);

  return (
    <Page title={g.name} sub={`${g.code} · ${jgLabel(JG_OWN, g.ownership)} · মালিক ${g.owner}`} back="/w/jg/goals"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/jg/collect')}>অবদান নিন</Button><Button size="sm" onClick={() => nav('/w/jg/spend')}>বিতরণ</Button></>}>
      <div className="flex items-center gap-2">
        <Badge tone={JG_STATUS[g.status].tone}>{JG_STATUS[g.status].t}</Badge>
        <span className="text-sm text-mut">{JG_CRULE[g.crule]} · {bn(g.maxParts)} জন · কমিটি {g.committee}</span>
      </div>

      <KpiGrid cols={4}>
        <Kpi label="লক্ষ্য" value={`৳${bn(g.target)}`} note={`${bn(pct)}% অর্জিত`} tone="purple" />
        <Kpi label="সংগৃহীত" value={`৳${bn(jgCollected(s.state.contribs, g.id))}`} note={`${bn(cs.length)} রসিদ`} tone="ok" />
        <Kpi label="প্রতিশ্রুতি" value={`৳${bn(jgPledgeTotal(s.state.parts, g.id))}`} note={`${bn(parts.length)} জন`} />
        <Kpi label="বিতরণ" value={`৳${bn(jgPaidOut(s.state.disbs, g.id))}`} note={`${bn(disbs.length)} ভাউচার`} />
      </KpiGrid>

      <div className="h-3 rounded-r-pill bg-line-2 overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${pct}%` }} /></div>

      <Desk>
        <div className="space-y-4">
          <Card title="লক্ষ্য ও নিয়ম" sub={`মেয়াদ ${g.targetDate} · ${bn(jgDaysLeft(g))} দিন বাকি · ${bn(jgTotalMonths(g))} মাস`}>
            <p className="text-sm text-txt-2">{g.desc}</p>
            <div className="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-mut block text-xs">অবদান</span><b>{JG_CRULE[g.crule]}</b></div>
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-mut block text-xs">অঙ্ক</span><b className="num">৳{bn(g.monthly ?? g.monthlyMin)}</b></div>
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-mut block text-xs">যোগদান</span><b>{g.join === 'open' ? 'খোলা' : 'আমন্ত্রণ'}</b></div>
            </div>
            <p className="text-xs text-mut mt-2">{g.note}</p>
          </Card>

          <Card title="অংশগ্রহণকারী" sub="প্রতিশ্রুতি · জমা · অবস্থা" right={<Go to="/w/jg/join">যোগদান</Go>}>
            <DataTable
              columns={[
                { key: 'name', head: 'সদস্য', render: (r) => <b>{mem(r.memberId)}</b> },
                { key: 'pledged', head: 'প্রতিশ্রুতি', align: 'right', render: (r) => `৳${bn(r.pledged)}` },
                { key: 'paid', head: 'জমা', align: 'right', render: (r) => `৳${bn(r.paid)}` },
                {
                  key: 'gap', head: 'ঘাটতি', align: 'right', render: (r) => {
                    const p = cs.filter((c) => c.memberId === r.memberId).reduce((n, c) => n + c.amount, 0);
                    const exp = Math.min(r.pledged, g.crule === 'fixed' ? jgTotalMonths(g) * (g.monthly ?? 0) : r.pledged);
                    const gap = Math.max(0, exp - p);
                    return <span className={gap ? 'text-danger-ink font-bold' : ''}>৳{bn(gap)}</span>;
                  },
                },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={JG_PART_ST[r.status].tone}>{JG_PART_ST[r.status].t}</Badge> },
                { key: 'by', head: 'অনুমোদন', render: (r) => r.approvedBy ?? '—' },
              ]}
              rows={parts}
            />
          </Card>

          <Card title="বিতরণ ভাউচার" sub="প্রমাণ ছাড়া কোনো অর্থ নয় (BR-19 · D-50)">
            <DataTable
              columns={[
                { key: 'no', head: 'ভাউচার', render: (r) => r.no },
                { key: 'purpose', head: 'কাজ' },
                { key: 'payee', head: 'প্রাপক' },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => <Money v={r.amount} /> },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'paid' ? 'ok' : r.status === 'approval' ? 'warn' : 'neutral'}>{r.status === 'paid' ? 'পরিশোধিত' : r.status === 'approval' ? 'অনুমোদন বাকি' : r.status === 'blocked' ? 'আটকানো' : 'পরিকল্পিত'}</Badge> },
                { key: 'appr', head: 'অনুমোদনকারী', render: (r) => r.appr ?? '—' },
              ]}
              rows={disbs}
              empty="এখনো কোনো বিতরণ ভাউচার নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="মাইলস্টোন" sub="২৫ · ৫০ · ৭৫ · ১০০%">
            {ms.map((m) => (
              <div key={m.pct} className="flex items-center gap-2 py-1.5 border-b border-line-2 last:border-0">
                <span className={`size-5 grid place-items-center rounded-r-pill text-[10px] font-bold ${m.reachedAt ? 'bg-ok-bg text-ok-ink' : 'bg-line-2 text-mut'}`}>{m.reachedAt ? '✓' : '·'}</span>
                <span className="text-sm grow">{bn(m.pct)}%</span>
                <span className="text-xs text-mut">{m.reachedAt ?? 'বাকি'}</span>
              </div>
            ))}
            <div className="pt-2"><Go to="/w/jg/milestones">সব লক্ষ্যের অগ্রগতি</Go></div>
          </Card>
          <StatBar items={[
            { k: 'দিন বাকি', v: bn(jgDaysLeft(g)) },
            { k: 'অর্জিত', v: `${bn(pct)}%`, tone: pct >= 100 ? 'ok' : 'neutral' },
          ]} />
          <Rail title="দ্রুত কাজ">
            <Go to="/w/jg/collect">অবদান সংগ্রহ</Go>
            <Go to="/w/jg/milestones">মাইলস্টোন</Go>
            <Go to="/w/jg/spend">অর্থ ব্যবহার</Go>
            <Go to="/w/jg/close">মেয়াদ ও নিষ্পত্তি</Go>
            <Go to="/w/jg/reports">রিপোর্ট</Go>
          </Rail>
          <Note>ব্যক্তিগত সদস্য এই অর্থ তুলতে পারেন না — শুধু অনুমোদিত ভেন্ডর/কমিটি/সদস্য-হস্তে বিতরণ (BR-19)।</Note>
        </div>
      </Desk>
    </Page>
  );
}
