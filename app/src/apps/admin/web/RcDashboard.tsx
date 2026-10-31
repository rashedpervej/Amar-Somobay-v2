import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CircleDollarSign, TriangleAlert, Users } from 'lucide-react';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { rcMembers } from '../../../store/adminRoscaStore';
import {
  RC_STATUS, rcCollected, rcFilled, rcNext, rcPerDraw, rcSchemeById, rcSeats, rcShortfall, rcTotalPool,
} from '../../../domain/adminRosca';
import { Desk, Go, Money, Note, Page, Rail, StatBar } from './webParts';

export default function RcDashboard() {
  const s = useAdminRo();
  const nav = useNavigate();
  const active = s.state.circles.filter((c) => c.status === 'active' || c.status === 'risk');
  const pool = s.state.circles.reduce((n, c) => {
    const sc = rcSchemeById(s.state.schemes, c.scheme);
    return n + rcTotalPool(sc);
  }, 0);
  const collected = s.state.circles.reduce((n, c) => {
    const sc = rcSchemeById(s.state.schemes, c.scheme);
    return n + rcCollected(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
  }, 0);
  const arrears = s.state.circles.reduce((n, c) => {
    const sc = rcSchemeById(s.state.schemes, c.scheme);
    return n + rcShortfall(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
  }, 0);
  const pendingDraws = s.state.draws.filter((d) => d.status !== 'executed');
  const openCases = s.state.defaults.filter((d) => d.status !== 'resolved');

  return (
    <Page
      title="ROSCA ড্যাশবোর্ড"
      sub="সক্রিয় চক্র · পুল দায় · আদায় ও বকেয়া — সব সংখ্যা ডেমো সিড থেকে"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/rc/collect')}>কিস্তি সংগ্রহ</Button><Button size="sm" onClick={() => nav('/w/rc/schemes/new')}>নতুন স্কিম</Button></>}
    >
      <KpiGrid cols={4}>
        <Kpi label="সক্রিয় চক্র" value={bn(active.length)} unit="টি" note={`মোট ${bn(s.state.circles.length)}টি`} />
        <Kpi label="পুল দায় (D-38)" value={`৳${bn(pool)}`} note="আলাদা দায় খাত" tone="purple" />
        <Kpi label="আদায়" value={`৳${bn(collected)}`} note="ডেমো" tone="ok" />
        <Kpi label="ঘাটতি / বকেয়া" value={`৳${bn(arrears)}`} note="বিলম্ব ফি আলাদা" tone={arrears ? 'warn' : 'neutral'} />
      </KpiGrid>

      <Note>ড্র পুল সদস্যের সাধারণ সঞ্চয় নয় — এটি চক্রের দায় (D-38)। সুদ শূন্য · মুনাফা শূন্য; বিলম্ব ফি শুধু নীতিমালা অনুযায়ী আলাদা খাতে (D-41)।</Note>

      <Desk>
        <div className="space-y-4">
          <Card title="সক্রিয় সার্কেল" sub="সিট পূর্ণতা ও পরবর্তী ড্র" right={<Go to="/w/rc/circles">সব সার্কেল</Go>}>
            <DataTable
              caption="প্রতিটি চক্র = একটি স্কিমের নির্দিষ্ট সংখ্যক সিট"
              columns={[
                {
                  key: 'code', head: 'চক্র', render: (r) => (
                    <button type="button" onClick={() => nav(`/w/rc/circles/${r.id}`)} className="min-h-10 font-bold text-green-800 hover:underline">{r.code}</button>
                  ),
                },
                { key: 'scheme', head: 'স্কিম', render: (r) => rcSchemeById(s.state.schemes, r.scheme).name },
                {
                  key: 'seats', head: 'সিট', align: 'center', render: (r) => {
                    const sc = rcSchemeById(s.state.schemes, r.scheme);
                    return <span className="num">{bn(rcFilled(s.state.seats, r.id))}/{bn(sc.seats)}</span>;
                  },
                },
                { key: 'next', head: 'পরবর্তী ড্র', render: (r) => r.nextDate ?? '—' },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={RC_STATUS[r.status].tone}>{RC_STATUS[r.status].t}</Badge> },
              ]}
              rows={s.state.circles.map((c) => ({ ...c, id: c.id }))}
            />
            <div className="pt-3 flex flex-wrap gap-2">
              <Go to="/w/rc/circles">সার্কেল হাব</Go>
              <Go to="/w/rc/draws">ড্র ক্যালেন্ডার</Go>
              <Go to="/w/rc/defaults">ডিফল্ট ও প্রতিস্থাপন</Go>
            </div>
          </Card>

          <StatBar items={[
            { k: 'ড্র বাকি', v: bn(pendingDraws.length), tone: pendingDraws.length ? 'warn' : 'ok' },
            { k: 'খোলা ডিফল্ট কেস', v: bn(openCases.length), tone: openCases.length ? 'danger' : 'ok' },
            { k: 'প্রতি ড্র পুল', v: `৳${bn(rcPerDraw(rcSchemeById(s.state.schemes, active[0]?.scheme)))}` },
            { k: 'মোট সদস্য', v: bn(rcMembers.length) },
          ]} />
        </div>

        <Rail title="আজকের অগ্রাধিকার">
          {pendingDraws.slice(0, 3).map((d) => (
            <div key={d.id} className="rounded-r-sm border border-line p-3">
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-warn-ink" />
                <b className="text-sm grow">ড্র {bn(d.no)} · {d.scheduled}</b>
                <Badge tone="warn">বাকি</Badge>
              </div>
              <p className="text-xs text-mut mt-1">অনুমোদনকারী আলাদা হতে হবে (BR-04)</p>
              <Button size="sm" className="mt-2" block onClick={() => nav(`/w/rc/draws/${d.id}/run`)}>ড্র চালান</Button>
            </div>
          ))}
          {openCases.slice(0, 2).map((d) => (
            <div key={d.id} className="rounded-r-sm border border-line p-3">
              <div className="flex items-center gap-2">
                <TriangleAlert size={16} className="text-danger-ink" />
                <b className="text-sm grow">সিট {bn(d.seatNo)} · <Money v={d.amount} /></b>
              </div>
              <p className="text-xs text-mut mt-1">{d.note}</p>
              <Button size="sm" variant="secondary" className="mt-2" block onClick={() => nav('/w/rc/defaults')}>কেস খুলুন</Button>
            </div>
          ))}
          <div className="rounded-r-sm border border-line p-3">
            <div className="flex items-center gap-2"><Users size={16} /><b className="text-sm">সংগ্রহক রুট</b></div>
            <p className="text-xs text-mut mt-1">কিস্তি আদায় অফলাইন-ফার্স্ট (BR-03)।</p>
            <Button size="sm" variant="secondary" className="mt-2" block onClick={() => nav('/w/rc/collect')}>সংগ্রহ কিউ</Button>
          </div>
          <div className="rounded-r-sm border border-line p-3">
            <div className="flex items-center gap-2"><CircleDollarSign size={16} /><b className="text-sm">রিপোর্ট</b></div>
            <Button size="sm" variant="ghost" className="mt-2" block onClick={() => nav('/w/rc/reports')}>ROSCA রিপোর্ট</Button>
          </div>
        </Rail>
      </Desk>

      <SectionHead title="চক্রভিত্তিক সংক্ষেপ" sub="আদায় · ঘাটতি · পরবর্তী ড্র" />
      <DataTable
        columns={[
          { key: 'code', head: 'চক্র' },
          { key: 'seats', head: 'পূর্ণ সিট', align: 'center', render: (r) => bn(rcFilled(s.state.seats, r.id)) },
          { key: 'col', head: 'আদায়', align: 'right', render: (r) => <Money v={rcCollected(r, rcSchemeById(s.state.schemes, r.scheme), s.state.seats, s.state.draws, s.state.missed, rcMembers)} /> },
          { key: 'gap', head: 'ঘাটতি', align: 'right', render: (r) => <Money v={rcShortfall(r, rcSchemeById(s.state.schemes, r.scheme), s.state.seats, s.state.draws, s.state.missed, rcMembers)} /> },
          { key: 'nx', head: 'পরবর্তী ড্র', render: (r) => rcNext(s.state.draws, r.id)?.scheduled ?? '—' },
        ]}
        rows={s.state.circles}
      />
    </Page>
  );
}
