import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminRo, rcMembers } from '../../../store/adminRoscaStore';
import { rcPerDraw, rcSchemeById, rcSeats, rcShortfall } from '../../../domain/adminRosca';
import { Note, Page, StatBar } from './webParts';

export default function RcCollect() {
  const s = useAdminRo();
  const nav = useNavigate();
  const [circle, setCircle] = useState(s.state.circles[0]?.id ?? '');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const c = s.state.circles.find((x) => x.id === circle) ?? s.state.circles[0];
  const sc = rcSchemeById(s.state.schemes, c?.scheme);
  const rows = c ? rcSeats(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers) : [];
  const filtered = rows.filter((r) => r.memberId && (q.trim() === '' || r.name.includes(q) || String(r.no) === q.trim()));
  const gap = c ? rcShortfall(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers) : 0;

  const collect = (seatNo: number) => {
    const r = s.collect(c.id, seatNo);
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
  };

  return (
    <Page title="কিস্তি সংগ্রহ ও বকেয়া" sub="অফলাইন-ফার্স্ট (BR-03) · নগদ প্রমাণ · বিলম্ব ফি আলাদা খাত (D-41)"
      back="/w/rc"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/rc/defaults')}>ডিফল্ট কেস</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-3 md:grid-cols-[280px_280px_minmax(0,1fr)]">
        <label className="block"><span className="text-sm font-bold">চক্র</span>
          <select value={circle} onChange={(e) => setCircle(e.target.value)} className={`${inputCls} mt-1`}>
            {s.state.circles.map((x) => <option key={x.id} value={x.id}>{x.code}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-sm font-bold">সদস্য / সিট খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা সিট" className={`${inputCls} mt-1`} />
        </label>
        <div className="flex items-end"><span className="text-sm text-mut">কিস্তি ৳{bn(sc.contrib)} · প্রতি ড্র পুল ৳{bn(rcPerDraw(sc))}</span></div>
      </div>

      <StatBar items={[
        { k: 'সিট', v: `${bn(rows.filter((x) => x.memberId).length)}/${bn(sc.seats)}` },
        { k: 'আদায়', v: `৳${bn(rows.reduce((n, x) => n + x.contributed, 0))}`, tone: 'ok' },
        { k: 'ঘাটতি', v: `৳${bn(gap)}`, tone: gap ? 'danger' : 'ok' },
        { k: 'বকেয়া সদস্য', v: bn(rows.filter((x) => x.missed > 0).length), tone: 'warn' },
      ]} />

      <Card title="কিস্তি তালিকা" sub="বকেয়া থাকলে আদায় করুন — এক সিটে এক কিস্তি">
        <DataTable
          columns={[
            { key: 'no', head: 'সিট', align: 'center', render: (r) => bn(r.no) },
            { key: 'name', head: 'সদস্য', render: (r) => <><b>{r.name}</b>{r.missed ? <span className="ml-2 text-xs text-danger-ink font-bold">{bn(r.missed)} বকেয়া</span> : null}</> },
            { key: 'paid', head: 'জমা কিস্তি', align: 'center', render: (r) => bn(r.paidCount) },
            { key: 'contributed', head: 'জমা', align: 'right', render: (r) => `৳${bn(r.contributed)}` },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'won' ? 'ok' : r.missed ? 'danger' : 'info'}>{r.status === 'won' ? 'প্রাপক' : r.missed ? 'বকেয়া' : 'সক্রিয়'}</Badge> },
            {
              key: 'act', head: '', align: 'right', render: (r) => (
                <Button size="sm" variant={r.missed ? 'primary' : 'secondary'} onClick={() => collect(r.no)} disabled={!r.memberId}>আদায়</Button>
              ),
            },
          ]}
          rows={filtered}
          empty="এই খোঁজে কোনো সদস্য নেই"
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="বকেয়া অগ্রাধিকার" sub="বেশি বকেয়া আগে">
          {rows.filter((x) => x.missed > 0).sort((a, b) => b.missed - a.missed).map((x) => (
            <div key={x.no} className="flex items-center gap-2 py-2 border-b border-line-2 last:border-0">
              <Badge tone="danger">সিট {bn(x.no)}</Badge>
              <b className="text-sm grow">{x.name}</b>
              <span className="num text-sm">{bn(x.missed)} × ৳{bn(sc.contrib)}</span>
              <Button size="sm" variant="secondary" onClick={() => collect(x.no)}>আদায়</Button>
            </div>
          ))}
          {!rows.some((x) => x.missed > 0) && <p className="text-sm text-mut">এই চক্রে বকেয়া নেই ✅</p>}
        </Card>
        <Note>বিলম্ব ফি স্বয়ংক্রিয়ভাবে কাটা হয় না — নীতিমালা ও কমিটির সিদ্ধান্তে আলাদা খাতে (D-41)। কোনো অতিরিক্ত চার্জ নেই — সুদ শূন্য।</Note>
      </div>
    </Page>
  );
}
