import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminRo, rcMembers } from '../../../store/adminRoscaStore';
import {
  RC_DRAW_ST, RC_STATUS, rcCollected, rcDone, rcFilled, rcNext, rcPerDraw, rcSchemeById, rcSeats, rcShortfall,
} from '../../../domain/adminRosca';
import { Desk, Go, Money, Note, Page, Rail, StatBar } from './webParts';

export default function RcCircleDetail() {
  const { circleId } = useParams();
  const s = useAdminRo();
  const nav = useNavigate();
  const c = s.state.circles.find((x) => x.id === circleId) ?? s.state.circles[0];
  const sc = rcSchemeById(s.state.schemes, c.scheme);
  const seats = rcSeats(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
  const filled = rcFilled(s.state.seats, c.id);
  const col = rcCollected(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
  const gap = rcShortfall(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
  const draws = s.state.draws.filter((d) => d.circle === c.id);
  const cases = s.state.defaults.filter((d) => d.circle === c.id && d.status !== 'resolved');

  return (
    <Page title={`${c.code} · সার্কেল হাব`} sub={`${sc.name} · ${c.branch} · ব্যবস্থাপক ${c.manager}`} back="/w/rc/circles"
      right={<><Button size="sm" variant="secondary" onClick={() => nav(`/w/rc/circles/${c.id}/seats`)}>সিট বরাদ্দ</Button><Button size="sm" onClick={() => nav('/w/rc/collect')}>কিস্তি সংগ্রহ</Button></>}>
      <div className="flex items-center gap-2">
        <Badge tone={RC_STATUS[c.status].tone}>{RC_STATUS[c.status].t}</Badge>
        <span className="text-sm text-mut">{c.start} → {c.end} · সাক্ষী: {c.witnesses.join(', ')}</span>
      </div>

      <KpiGrid cols={4}>
        <Kpi label="সিট পূর্ণ" value={`${bn(filled)}/${bn(sc.seats)}`} note={filled < sc.seats ? 'খালি সিট আছে' : 'পূর্ণ'} tone={filled < sc.seats ? 'warn' : 'ok'} />
        <Kpi label="আদায়" value={`৳${bn(col)}`} note={`${bn(rcDone(s.state.draws, c.id).length)} ড্র সম্পন্ন`} />
        <Kpi label="ঘাটতি" value={`৳${bn(gap)}`} note="পুল দায়" tone={gap ? 'danger' : 'ok'} />
        <Kpi label="প্রতি ড্র" value={`৳${bn(rcPerDraw(sc))}`} note={`নেট পুল ৳${bn(rcPerDraw(sc))}`} />
      </KpiGrid>

      <Desk>
        <div className="space-y-4">
          <Card title="সিট গ্রিড" sub="প্রাপক · বকেয়া · রসিদ" right={<Go to={`/w/rc/circles/${c.id}/seats`}>বরাদ্দ</Go>}>
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-1.5">
              {seats.map((x) => (
                <button key={x.no} type="button" onClick={() => nav(`/w/rc/circles/${c.id}/seats`)}
                  className={`min-h-10 min-h-14 rounded-r-sm border p-1 text-center ${x.status === 'won' ? 'bg-ok-bg border-ok-bd' : x.missed ? 'bg-danger-bg border-danger-bd' : x.status === 'vacant' ? 'bg-card-2 border-dashed border-line-3' : 'bg-card border-line'}`}>
                  <span className="num block text-xs font-bold">{bn(x.no)}</span>
                  <span className="block text-[10px] leading-tight truncate">{x.memberId ? x.name.split(' ')[0] : 'খালি'}</span>
                  {x.missed ? <span className="block text-[10px] text-danger-ink font-bold">{bn(x.missed)} বকেয়া</span> : null}
                </button>
              ))}
            </div>
          </Card>

          <Card title="ড্র অগ্রগতি" sub="সম্পন্ন ড্র অপরিবর্তনীয় (BR-08)" right={<Go to="/w/rc/draws">ক্যালেন্ডার</Go>}>
            <DataTable
              columns={[
                { key: 'no', head: 'ড্র', align: 'center', render: (r) => `#${bn(r.no)}` },
                { key: 'sch', head: 'তারিখ', render: (r) => r.scheduled },
                { key: 'win', head: 'সিট', align: 'center', render: (r) => (r.winnerSeat ? bn(r.winnerSeat) : '—') },
                { key: 'amt', head: 'অঙ্ক', align: 'right', render: (r) => <Money v={r.amount} /> },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={RC_DRAW_ST[r.status].tone}>{RC_DRAW_ST[r.status].t}</Badge> },
                {
                  key: 'act', head: '', align: 'right', render: (r) => (
                    r.status === 'executed'
                      ? <Button size="sm" variant="ghost" onClick={() => nav('/w/rc/draws/history')}>রেজিস্টার</Button>
                      : <Button size="sm" onClick={() => nav(`/w/rc/draws/${r.id}/run`)}>চালান</Button>
                  ),
                },
              ]}
              rows={draws}
            />
          </Card>
        </div>

        <div className="space-y-3">
          <StatBar items={[
            { k: 'পরবর্তী ড্র', v: rcNext(s.state.draws, c.id)?.scheduled ?? '—' },
            { k: 'খোলা কেস', v: bn(cases.length), tone: cases.length ? 'danger' : 'ok' },
          ]} />
          <Rail title="দ্রুত লিংক">
            <Go to={`/w/rc/circles/${c.id}/seats`}>সিট বরাদ্দ / অপেক্ষমাণ</Go>
            <Go to="/w/rc/collect">কিস্তি ও বকেয়া</Go>
            <Go to="/w/rc/defaults">ডিফল্ট ও প্রতিস্থাপন</Go>
            <Go to="/w/rc/draws/history">ড্র ইতিহাস</Go>
          </Rail>
          <Note tone="warn">সিট প্রতিস্থাপন বা বাতিল হলে জমার নিষ্পত্তি D-46 অনুযায়ী কমিটির সিদ্ধান্তে — সরাসরি ডিলিট নয়।</Note>
        </div>
      </Desk>
    </Page>
  );
}
