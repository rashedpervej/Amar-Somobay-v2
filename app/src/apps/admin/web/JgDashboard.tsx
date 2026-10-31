import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import { rcMembers } from '../../../store/adminRoscaStore';
import {
  JG_LIMIT, JG_STATUS, jgActive, jgAllArrears, jgCollected, jgDaysLeft, jgGotThisMonth, jgLimitLeft,
  jgPartsOf, jgPctOf, jgPendingDisb, jgPendingJoins, jgPendingSettle, jgSpend,
} from '../../../domain/adminJoint';
import { Desk, Go, Money, Note, Page, Rail, StatBar } from './webParts';

const mem = (id: string) => rcMembers.find((m) => m.id === id)?.name ?? id;

export default function JgDashboard() {
  const s = useAdminJg();
  const nav = useNavigate();
  const active = jgActive(s.state.goals);
  const col = s.state.goals.reduce((n, g) => n + jgCollected(s.state.contribs, g.id), 0);
  const arrears = jgAllArrears(s.state.goals, s.state.parts, s.state.contribs);
  const pendingJ = jgPendingJoins(s.state.parts);
  const pendingD = jgPendingDisb(s.state.disbs);
  const pendingS = jgPendingSettle(s.state.goals);

  return (
    <Page title="Joint Goal ড্যাশবোর্ড" sub="লক্ষ্য · অবদান · মাইলস্টোন · বিতরণ — ব্যক্তিগত উত্তোলন নেই (BR-19)"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/jg/join')}>যোগদান অনুমোদন</Button><Button size="sm" onClick={() => nav('/w/jg/goals/new')}>নতুন লক্ষ্য</Button></>}>
      <KpiGrid cols={4}>
        <Kpi label="সক্রিয় লক্ষ্য" value={`${bn(active.length)}/${bn(JG_LIMIT)}`} note={`বাকি ${bn(jgLimitLeft(s.state.goals))}টি (D-43)`} tone={jgLimitLeft(s.state.goals) ? 'neutral' : 'warn'} />
        <Kpi label="মোট অবদান" value={`৳${bn(col)}`} note={`এই মাসে ৳${bn(jgGotThisMonth(s.state.contribs))}`} tone="ok" />
        <Kpi label="বকেয়া" value={`৳${bn(arrears.reduce((n, x) => n + x.gap, 0))}`} note={`${bn(arrears.length)} জন`} tone={arrears.length ? 'warn' : 'ok'} />
        <Kpi label="বিতরণ (পরিশোধিত)" value={`৳${bn(jgSpend(s.state.disbs))}`} note={`${bn(pendingD.length)} ভাউচার অপেক্ষমাণ`} />
      </KpiGrid>

      <Note>লক্ষ্যের অর্থ নির্ধারিত (earmarked) — সাধারণ সঞ্চয় বা QH পুলের সাথে মেশানো যায় না (D-39)। লক্ষ্য অঙ্ক কমানো যায় না (D-49)।</Note>

      <Desk>
        <div className="space-y-4">
          <Card title="লক্ষ্য তালিকা" sub="অগ্রগতি ও মেয়াদ" right={<Go to="/w/jg/goals">সব লক্ষ্য</Go>}>
            <DataTable
              columns={[
                {
                  key: 'name', head: 'লক্ষ্য', render: (r) => (
                    <button type="button" onClick={() => nav(`/w/jg/goals/${r.id}`)} className="min-h-10 text-left">
                      <b className="text-green-800 hover:underline block">{r.name}</b>
                      <span className="text-xs text-mut">{r.code} · {r.owner}</span>
                    </button>
                  ),
                },
                { key: 'target', head: 'লক্ষ্য', align: 'right', render: (r) => <Money v={r.target} /> },
                { key: 'got', head: 'সংগৃহীত', align: 'right', render: (r) => <Money v={jgCollected(s.state.contribs, r.id)} /> },
                {
                  key: 'pct', head: 'অগ্রগতি', render: (r) => {
                    const p = Math.min(100, jgPctOf(s.state.contribs, r));
                    return <div className="w-28"><div className="h-2 rounded-r-pill bg-line-2 overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${p}%` }} /></div><span className="text-xs text-mut num">{bn(p)}%</span></div>;
                  },
                },
                { key: 'days', head: 'দিন বাকি', align: 'right', render: (r) => bn(jgDaysLeft(r)) },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={JG_STATUS[r.status].tone}>{JG_STATUS[r.status].t}</Badge> },
              ]}
              rows={s.state.goals}
            />
          </Card>

          <StatBar items={[
            { k: 'অংশগ্রহণকারী', v: bn(s.state.parts.filter((p) => p.status !== 'removed').length) },
            { k: 'যোগদান বাকি', v: bn(pendingJ.length), tone: pendingJ.length ? 'warn' : 'ok' },
            { k: 'ভাউচার বাকি', v: bn(pendingD.length), tone: pendingD.length ? 'warn' : 'ok' },
            { k: 'নিষ্পত্তি বাকি', v: bn(pendingS.length), tone: pendingS.length ? 'danger' : 'ok' },
          ]} />
        </div>

        <Rail title="অনুমোদনের অপেক্ষায়">
          {pendingJ.slice(0, 3).map((p) => (
            <div key={`${p.goal}-${p.memberId}`} className="rounded-r-sm border border-line p-3">
              <div className="flex items-center gap-2"><b className="text-sm grow">{mem(p.memberId)}</b><Badge tone="warn">যোগদান</Badge></div>
              <p className="text-xs text-mut mt-1">{s.state.goals.find((g) => g.id === p.goal)?.code} · pledged ৳{bn(p.pledged)}</p>
              <Button size="sm" variant="secondary" block className="mt-2" onClick={() => nav('/w/jg/join')}>পর্যালোচনা</Button>
            </div>
          ))}
          {pendingD.slice(0, 2).map((d) => (
            <div key={d.id} className="rounded-r-sm border border-line p-3">
              <div className="flex items-center gap-2"><b className="text-sm grow">{d.no}</b><Badge tone="warn">ভাউচার</Badge></div>
              <p className="text-xs text-mut mt-1">{d.purpose} · ৳{bn(d.amount)}</p>
              <Button size="sm" block className="mt-2" onClick={() => nav('/w/jg/spend')}>অনুমোদন</Button>
            </div>
          ))}
          {pendingS.map((g) => (
            <div key={g.id} className="rounded-r-sm border border-line p-3">
              <div className="flex items-center gap-2"><b className="text-sm grow">{g.code}</b><Badge tone="danger">নিষ্পত্তি</Badge></div>
              <Button size="sm" variant="secondary" block className="mt-2" onClick={() => nav('/w/jg/close')}>সিদ্ধান্ত</Button>
            </div>
          ))}
          {!pendingJ.length && !pendingD.length && !pendingS.length && <p className="text-sm text-mut">সব অনুমোদন সম্পন্ন ✅</p>}
        </Rail>
      </Desk>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="মেয়াদ ও মাইলস্টোন" sub="লক্ষ্য অর্জিত হলে বিতরণ শুরু">
          <DataTable
            columns={[
              { key: 'code', head: 'লক্ষ্য' },
              { key: 'date', head: 'মেয়াদ', render: (r) => r.targetDate },
              { key: 'days', head: 'দিন', align: 'right', render: (r) => bn(jgDaysLeft(r)) },
              { key: 'parts', head: 'জন', align: 'center', render: (r) => bn(jgPartsOf(s.state.parts, r.id).length) },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={JG_STATUS[r.status].tone}>{JG_STATUS[r.status].t}</Badge> },
            ]}
            rows={active}
          />
        </Card>
        <Card title="সাম্প্রতিক অডিট" sub="ডেমো ইভেন্ট">
          <div className="space-y-2">
            {s.state.events.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-sm border-b border-line-2 last:border-0 pb-2">
                <span className={`mt-1.5 size-2 rounded-r-pill ${e.tone === 'ok' ? 'bg-ok' : e.tone === 'warn' ? 'bg-warn' : 'bg-info'}`} />
                <div className="grow"><b>{e.what}</b><div className="text-xs text-mut">{e.at} · {e.ref}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}
