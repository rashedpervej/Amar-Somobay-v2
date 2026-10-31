import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminRo, rcMembers } from '../../../store/adminRoscaStore';
import { RC_DRAW_ST, RC_METHOD, rcSchemeById, rcSeats } from '../../../domain/adminRosca';
import { Chips, Go, Note, Page, StatBar } from './webParts';

export default function RcDraws() {
  const s = useAdminRo();
  const nav = useNavigate();
  const [circle, setCircle] = useState(s.state.circles[0]?.id ?? '');
  const [st, setSt] = useState('all');
  const c = s.state.circles.find((x) => x.id === circle) ?? s.state.circles[0];
  const sc = rcSchemeById(s.state.schemes, c?.scheme);
  const rows = s.state.draws.filter((d) => d.circle === circle && (st === 'all' || d.status === st));
  const pending = s.state.draws.filter((d) => d.circle === circle && d.status !== 'executed');
  const seats = c ? rcSeats(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers) : [];

  return (
    <Page title="ড্র ক্যালেন্ডার ও ক্রম" sub="পূর্বনির্ধারিত তারিখ · লটারি বা নির্দিষ্ট ক্রম · সাক্ষী ও হ্যাশ"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/rc/draws/history')}>ড্র ইতিহাস</Button><Button size="sm" disabled={!pending[0]} onClick={() => pending[0] && nav(`/w/rc/draws/${pending[0].id}/run`)}>পরবর্তী ড্র চালান</Button></>}>
      <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)] items-start">
        <Card title="চক্র" sub="একটি চক্রের সব ড্র">
          <select value={circle} onChange={(e) => setCircle(e.target.value)} className="w-full min-h-tap rounded-r-sm border border-line-3 bg-card px-3">
            {s.state.circles.map((x) => <option key={x.id} value={x.id}>{x.code}</option>)}
          </select>
          <div className="mt-3 space-y-1 text-sm">
            <p><b>স্কিম:</b> {sc.name}</p>
            <p><b>পদ্ধতি:</b> {RC_METHOD[sc.drawMethod]}</p>
            <p><b>সিট:</b> {bn(sc.seats)} · <b>কিস্তি:</b> ৳{bn(sc.contrib)}</p>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <Go to={`/w/rc/circles/${c?.id}`}>সার্কেল হাব</Go>
            <Go to={`/w/rc/circles/${c?.id}/seats`}>সিট গ্রিড</Go>
          </div>
        </Card>

        <div className="space-y-3">
          <StatBar items={[
            { k: 'মোট ড্র', v: bn(s.state.draws.filter((d) => d.circle === circle).length) },
            { k: 'সম্পন্ন', v: bn(s.state.draws.filter((d) => d.circle === circle && d.status === 'executed').length), tone: 'ok' },
            { k: 'বাকি', v: bn(pending.length), tone: pending.length ? 'warn' : 'ok' },
            { k: 'যোগ্য সিট', v: bn(seats.filter((x) => x.memberId && x.status !== 'won').length) },
          ]} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Chips value={st} onChange={setSt} items={[['all', 'সব'], ['scheduled', 'নির্ধারিত'], ['approval', 'অনুমোদন বাকি'], ['executed', 'সম্পন্ন']]} />
            <span className="text-sm text-mut">তারিখ অনুযায়ী ক্রম</span>
          </div>
          {pending.length > 0 && <Note tone="warn">পরবর্তী ড্র {pending[0].scheduled} — প্রস্তুতকারী ও অনুমোদনকারী অবশ্যই আলাদা (BR-04)।</Note>}
          <Card title="ড্র তালিকা" sub="সিট প্রাপক একবারই — পুনরায় ড্র নয়">
            <DataTable
              columns={[
                { key: 'no', head: 'ড্র', align: 'center', render: (r) => `#${bn(r.no)}` },
                { key: 'scheduled', head: 'নির্ধারিত', render: (r) => r.scheduled },
                { key: 'executed', head: 'সম্পন্ন', render: (r) => r.executed ?? '—' },
                { key: 'winner', head: 'প্রাপক সিট', align: 'center', render: (r) => (r.winnerSeat ? bn(r.winnerSeat) : '—') },
                { key: 'amount', head: 'পুল', align: 'right', render: (r) => `৳${bn(r.amount)}` },
                { key: 'col', head: 'সংগৃহীত', align: 'right', render: (r) => `৳${bn(r.collected)}` },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={RC_DRAW_ST[r.status].tone}>{RC_DRAW_ST[r.status].t}</Badge> },
                {
                  key: 'act', head: '', align: 'right', render: (r) => (
                    r.status === 'executed'
                      ? <Button size="sm" variant="ghost" onClick={() => nav('/w/rc/draws/history')}>রসিদ</Button>
                      : <Button size="sm" onClick={() => nav(`/w/rc/draws/${r.id}/run`)}>চালান</Button>
                  ),
                },
              ]}
              rows={rows}
            />
          </Card>
        </div>
      </div>
    </Page>
  );
}
