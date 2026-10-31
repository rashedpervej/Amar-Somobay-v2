import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { RC_DRAW_ST, rcSchemeById } from '../../../domain/adminRosca';
import { Chips, Note, Page, StatBar } from './webParts';

export default function RcDrawHistory() {
  const s = useAdminRo();
  const nav = useNavigate();
  const [st, setSt] = useState('all');
  const rows = s.state.draws.filter((d) => st === 'all' || d.status === st);
  const done = s.state.draws.filter((d) => d.status === 'executed');
  const total = done.reduce((n, d) => n + d.amount, 0);
  const short = done.reduce((n, d) => n + d.shortfall, 0);

  return (
    <Page title="ড্র ইতিহাস ও রেজিস্টার" sub="সম্পন্ন ড্র অপরিবর্তনীয় · রসিদ · হ্যাশ · অনুমোদনকারী"
      back="/w/rc/draws"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/rc/reports')}>রিপোর্ট</Button>}>
      <StatBar items={[
        { k: 'সম্পন্ন ড্র', v: bn(done.length), tone: 'ok' },
        { k: 'মোট বিতরণ', v: `৳${bn(total)}` },
        { k: 'ঘাটতি', v: `৳${bn(short)}`, tone: short ? 'warn' : 'ok' },
        { k: 'মোট ড্র রেকর্ড', v: bn(s.state.draws.length) },
      ]} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Chips value={st} onChange={setSt} items={[['all', 'সব'], ['executed', 'সম্পন্ন'], ['approval', 'অনুমোদন বাকি'], ['scheduled', 'নির্ধারিত']]} />
        <span className="text-sm text-mut">AUDITOR শুধু পড়তে পারেন</span>
      </div>
      <Note>রসিদ ও হ্যাশ একবার তৈরি হলে বদলানো যায় না (BR-08); ভুল হলে বিপরীত এন্ট্রি (R-02)। ডেমো রেজিস্টার — নিরীক্ষক শুধু পড়েন।</Note>
      <Card title="ড্র রেজিস্টার" sub="সব চক্র · তারিখ অনুযায়ী">
        <DataTable
          columns={[
            { key: 'id', head: 'ড্র', render: (r) => <b className="num">#{bn(r.no)}</b> },
            { key: 'circle', head: 'চক্র', render: (r) => s.state.circles.find((c) => c.id === r.circle)?.code ?? r.circle },
            { key: 'scheme', head: 'স্কিম', render: (r) => rcSchemeById(s.state.schemes, s.state.circles.find((c) => c.id === r.circle)?.scheme).name },
            { key: 'date', head: 'সম্পন্ন / নির্ধারিত', render: (r) => r.executed ?? r.scheduled },
            { key: 'win', head: 'সিট', align: 'center', render: (r) => (r.winnerSeat ? bn(r.winnerSeat) : '—') },
            { key: 'amt', head: 'পুল', align: 'right', render: (r) => `৳${bn(r.amount)}` },
            { key: 'short', head: 'ঘাটতি', align: 'right', render: (r) => r.shortfall ? `৳${bn(r.shortfall)}` : '—' },
            { key: 'receipt', head: 'রসিদ', render: (r) => r.receipt ?? '—' },
            { key: 'hash', head: 'হ্যাশ', render: (r) => r.hash ? <code className="text-xs">{r.hash}</code> : '—' },
            { key: 'appr', head: 'অনুমোদনকারী', render: (r) => r.appr ?? '—' },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={RC_DRAW_ST[r.status].tone}>{RC_DRAW_ST[r.status].t}</Badge> },
          ]}
          rows={rows}
        />
      </Card>
    </Page>
  );
}
