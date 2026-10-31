import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminRo, rcMembers } from '../../../store/adminRoscaStore';
import { RC_STATUS, rcCollected, rcFilled, rcNext, rcSchemeById, rcShortfall } from '../../../domain/adminRosca';
import { Chips, Note, Page } from './webParts';

export default function RcCircles() {
  const s = useAdminRo();
  const nav = useNavigate();
  const [st, setSt] = useState('all');
  const rows = s.state.circles.filter((c) => st === 'all' || c.status === st);
  return (
    <Page title="সক্রিয় সার্কেল" sub="চক্রভিত্তিক সিট, আদায়, ঘাটতি ও পরবর্তী ড্র"
      right={<Button size="sm" onClick={() => nav('/w/rc/schemes')}>নতুন চক্রের স্কিম</Button>}>
      <div className="flex flex-wrap items-center gap-3">
        <Chips value={st} onChange={setSt} items={[['all', 'সব'], ...Object.entries(RC_STATUS).map(([k, v]) => [k, v.t] as [string, string])]} />
        <span className="text-sm text-mut">{bn(rows.length)}টি চক্র</span>
      </div>
      <Note>কোনো চক্রে সিট খালি থাকলে ড্র চালানো যাবে না — সিট বরাদ্দ পর্দা থেকে পূরণ করুন (RA-06 · D-42)। ডেমো ডেটা; পুল আলাদা দায় খাত (D-38)।</Note>
      <Card title="চক্র তালিকা" sub="সার্কেল খুললে সিট গ্রিড, ড্র ও বকেয়া এক জায়গায়">
        <DataTable
          columns={[
            {
              key: 'code', head: 'চক্র', render: (r) => (
                <button type="button" onClick={() => nav(`/w/rc/circles/${r.id}`)} className="min-h-10 text-left">
                  <b className="text-green-800 hover:underline block">{r.code}</b>
                  <span className="text-xs text-mut">{rcSchemeById(s.state.schemes, r.scheme).name}</span>
                </button>
              ),
            },
            { key: 'route', head: 'রুট / শাখা', render: (r) => <><div>{r.route}</div><div className="text-xs text-mut">{r.branch}</div></> },
            {
              key: 'seats', head: 'সিট', align: 'center', render: (r) => {
                const sc = rcSchemeById(s.state.schemes, r.scheme);
                return <span className="num font-bold">{bn(rcFilled(s.state.seats, r.id))}/{bn(sc.seats)}</span>;
              },
            },
            { key: 'col', head: 'আদায়', align: 'right', render: (r) => `৳${bn(rcCollected(r, rcSchemeById(s.state.schemes, r.scheme), s.state.seats, s.state.draws, s.state.missed, rcMembers))}` },
            { key: 'gap', head: 'ঘাটতি', align: 'right', render: (r) => <span className={rcShortfall(r, rcSchemeById(s.state.schemes, r.scheme), s.state.seats, s.state.draws, s.state.missed, rcMembers) ? 'text-danger-ink font-bold' : ''}>৳{bn(rcShortfall(r, rcSchemeById(s.state.schemes, r.scheme), s.state.seats, s.state.draws, s.state.missed, rcMembers))}</span> },
            { key: 'next', head: 'পরবর্তী ড্র', render: (r) => rcNext(s.state.draws, r.id)?.scheduled ?? '—' },
            { key: 'status', head: 'অবস্থা', render: (r) => <Badge tone={RC_STATUS[r.status].tone}>{RC_STATUS[r.status].t}</Badge> },
            { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/rc/circles/${r.id}`)}>খুলুন</Button> },
          ]}
          rows={rows}
        />
      </Card>
    </Page>
  );
}
