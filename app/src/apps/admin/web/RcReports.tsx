import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminRo, rcMembers } from '../../../store/adminRoscaStore';
import {
  RC_STEP, rcArrears, rcCollected, rcDone, rcFilled, rcPerDraw, rcSchemeById, rcSeats, rcShortfall, rcTotalPool,
} from '../../../domain/adminRosca';
import { Note, Page, StatBar } from './webParts';

export default function RcReports() {
  const s = useAdminRo();
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const totals = s.state.circles.map((c) => {
    const sc = rcSchemeById(s.state.schemes, c.scheme);
    const seats = rcSeats(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
    return {
      c, sc, seats,
      col: rcCollected(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers),
      gap: rcShortfall(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers),
      done: rcDone(s.state.draws, c.id).length,
      pool: rcTotalPool(sc),
      arrears: rcArrears(seats, sc.contrib),
    };
  });
  const col = totals.reduce((n, x) => n + x.col, 0);
  const gap = totals.reduce((n, x) => n + x.gap, 0);
  const paid = s.state.draws.filter((d) => d.status === 'executed').reduce((n, d) => n + d.amount, 0);
  const short = s.state.draws.reduce((n, d) => n + d.shortfall, 0);

  return (
    <Page title="ROSCA রিপোর্ট" sub="চক্রভিত্তিক আদায়, ঘাটতি, ড্র ও ডিফল্ট — নিরীক্ষক-প্রস্তুত (D-29 ফরম্যাট)"
      back="/w/rc"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/rc/draws/history')}>ড্র রেজিস্টার</Button><Button size="sm" onClick={() => setMsg('রিপোর্ট প্রিন্ট/CSV ডেমো — প্রকৃত এক্সপোর্ট ব্যাকএন্ড সংযুক্তির পরে।')}>এক্সপোর্ট</Button></>}>
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মোট আদায়', v: `৳${bn(col)}`, tone: 'ok' },
        { k: 'মোট ঘাটতি', v: `৳${bn(gap)}`, tone: gap ? 'warn' : 'ok' },
        { k: 'বিতরণ (ড্র)', v: `৳${bn(paid)}` },
        { k: 'ড্র ঘাটতি', v: `৳${bn(short)}`, tone: short ? 'warn' : 'ok' },
      ]} />

      <Card title="চক্রভিত্তিক সারসংক্ষেপ" sub="ডেমো সিড · ট্রায়াল ব্যালেন্স নিয়ম প্রযোজ্য (BR-12)">
        <DataTable
          caption="পুল দায় = সিট × কিস্তি × সিট; আদায় ও ঘাটতি সিট-ভিত্তিক"
          columns={[
            { key: 'code', head: 'চক্র', render: (r) => <b>{r.c.code}</b> },
            { key: 'scheme', head: 'স্কিম', render: (r) => r.sc.name },
            { key: 'seats', head: 'পূর্ণ/মোট', align: 'center', render: (r) => `${bn(rcFilled(s.state.seats, r.c.id))}/${bn(r.sc.seats)}` },
            { key: 'per', head: 'প্রতি ড্র', align: 'right', render: (r) => `৳${bn(rcPerDraw(r.sc))}` },
            { key: 'pool', head: 'মোট পুল', align: 'right', render: (r) => `৳${bn(r.pool)}` },
            { key: 'done', head: 'ড্র সম্পন্ন', align: 'center', render: (r) => bn(r.done) },
            { key: 'col', head: 'আদায়', align: 'right', render: (r) => `৳${bn(r.col)}` },
            { key: 'gap', head: 'ঘাটতি', align: 'right', render: (r) => <span className={r.gap ? 'text-danger-ink font-bold' : ''}>৳{bn(r.gap)}</span> },
            { key: 'ar', head: 'বকেয়া সদস্য', align: 'center', render: (r) => bn(r.arrears.length) },
          ]}
          rows={totals}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="বকেয়া সদস্য" sub="চক্র · সিট · বকেয়া কিস্তি">
          <DataTable
            columns={[
              { key: 'circle', head: 'চক্র', render: (r) => r.circle },
              { key: 'seat', head: 'সিট', align: 'center', render: (r) => bn(r.seat) },
              { key: 'name', head: 'সদস্য' },
              { key: 'gap', head: 'বকেয়া', align: 'right', render: (r) => `৳${bn(r.gap)}` },
            ]}
            rows={totals.flatMap((x) => x.arrears.map((a) => ({ circle: x.c.code, seat: a.seat.no, name: a.seat.name, gap: a.gap })))}
            empty="কোনো বকেয়া নেই"
          />
        </Card>
        <Card title="ডিফল্ট সারসংক্ষেপ" sub="ধাপভিত্তিক কেস">
          <DataTable
            columns={[
              { key: 'circle', head: 'চক্র' },
              { key: 'seat', head: 'সিট', align: 'center', render: (r) => bn(r.seatNo) },
              { key: 'step', head: 'ধাপ', render: (r) => RC_STEP[r.step] },
              { key: 'amt', head: 'দাবি', align: 'right', render: (r) => `৳${bn(r.amount)}` },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'resolved' ? 'ok' : r.status === 'pending-committee' ? 'warn' : 'danger'}>{r.status === 'resolved' ? 'নিষ্পত্তি' : r.status === 'pending-committee' ? 'কমিটি' : 'খোলা'}</Badge> },
            ]}
            rows={s.state.defaults}
          />
        </Card>
      </div>
      <Note>এই রিপোর্ট ডেমো ডেটার; কোনো সংখ্যা প্রকৃত আর্থিক বিবরণী নয়। নিরীক্ষা ও নিয়ন্ত্রক ফরম্যাটে এক্সপোর্ট ব্যাকএন্ড কাজের অংশ।</Note>
    </Page>
  );
}
