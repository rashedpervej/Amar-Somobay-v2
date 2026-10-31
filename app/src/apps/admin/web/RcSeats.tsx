import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminRo, rcMembers } from '../../../store/adminRoscaStore';
import { rcFilled, rcSchemeById, rcSeats } from '../../../domain/adminRosca';
import { Note, Page, StatBar } from './webParts';

export default function RcSeats() {
  const { circleId } = useParams();
  const s = useAdminRo();
  const c = s.state.circles.find((x) => x.id === circleId) ?? s.state.circles[0];
  const sc = rcSchemeById(s.state.schemes, c.scheme);
  const rows = rcSeats(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
  const empty = rows.find((x) => !x.memberId);
  const [seat, setSeat] = useState(String(empty?.no ?? 1));
  const [member, setMember] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const wait = s.state.waitlist[c.id] ?? [];

  const assign = () => {
    const r = s.assignSeat(c.id, Number(seat), member);
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message); setMember('');
  };
  const start = () => {
    const r = s.startCircle(sc.id);
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
  };

  return (
    <Page title="সিট বরাদ্দ ও সদস্য নির্বাচন" sub={`${c.code} · ${bn(rcFilled(s.state.seats, c.id))}/${bn(sc.seats)} সিট পূর্ণ`}
      back={`/w/rc/circles/${c.id}`}
      right={<Button size="sm" variant="secondary" onClick={start}>চক্র শুরু করুন</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <StatBar items={[
        { k: 'স্কিম', v: sc.name },
        { k: 'খালি সিট', v: bn(rows.filter((x) => !x.memberId).length), tone: empty ? 'warn' : 'ok' },
        { k: 'অপেক্ষমাণ', v: bn(wait.length) },
        { k: 'সর্বোচ্চ চক্র/সদস্য', v: bn(sc.maxCirclesPerMember) },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="সিট বরাদ্দ" sub="এক সদস্য একাধিকবার নয়">
          <div className="space-y-3">
            <label className="block"><span className="text-sm font-bold">সিট</span>
              <select value={seat} onChange={(e) => setSeat(e.target.value)} className={`${inputCls} mt-1`}>
                {rows.map((x) => <option key={x.no} value={x.no}>{bn(x.no)} — {x.memberId ? `${x.name} (পূর্ণ)` : 'খালি'}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm font-bold">সদস্য</span>
              <select value={member} onChange={(e) => setMember(e.target.value)} className={`${inputCls} mt-1`}>
                <option value="">— বাছাই করুন —</option>
                {rcMembers.map((m) => <option key={m.id} value={m.id}>{m.no} · {m.name}</option>)}
                {wait.map((w) => <option key={w.memberId} value={w.memberId}>{w.memberId} · অপেক্ষমাণ #{w.pos}</option>)}
              </select>
            </label>
            <Button block onClick={assign}>সিট বরাদ্দ করুন</Button>
            <p className="text-xs text-mut">বরাদ্দ হলে সদস্যকে নোটিশ ও SMS যাবে (ডেমো); জমা ফেরত নয় — D-46।</p>
          </div>
        </Card>

        <Card title="অপেক্ষমাণ তালিকা" sub="খালি হলে ক্রম অনুযায়ী ডাকা হবে" right={<Badge tone="info">{bn(wait.length)} জন</Badge>}>
          <DataTable
            columns={[
              { key: 'pos', head: 'ক্রম', align: 'center', render: (r) => bn(r.pos) },
              { key: 'memberId', head: 'সদস্য' },
              { key: 'applied', head: 'আবেদন' },
              {
                key: 'act', head: '', align: 'right', render: (r) => (
                  <Button size="sm" variant="secondary" onClick={() => { setMember(r.memberId); setSeat(String(empty?.no ?? 1)); }}>বাছাই</Button>
                ),
              },
            ]}
            rows={wait}
            empty="এই চক্রে কেউ অপেক্ষমাণ নেই"
          />
        </Card>
      </div>

      <Card title="সদস্য তালিকা" sub="সিট · সদস্য · জমা · প্রাপ্তি">
        <DataTable
          columns={[
            { key: 'no', head: 'সিট', align: 'center', render: (r) => bn(r.no) },
            { key: 'name', head: 'সদস্য', render: (r) => r.memberId ? r.name : <span className="text-mut">খালি</span> },
            { key: 'contributed', head: 'জমা', align: 'right', render: (r) => `৳${bn(r.contributed)}` },
            { key: 'missed', head: 'বকেয়া কিস্তি', align: 'center', render: (r) => bn(r.missed) },
            { key: 'won', head: 'প্রাপ্তি', align: 'right', render: (r) => r.receivedAmt ? `৳${bn(r.receivedAmt)}` : '—' },
            { key: 'receipt', head: 'রসিদ', render: (r) => r.receipt ?? '—' },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'won' ? 'ok' : r.missed ? 'danger' : r.status === 'vacant' ? 'neutral' : 'info'}>{r.status === 'won' ? 'প্রাপক' : r.missed ? 'বকেয়া' : r.status === 'vacant' ? 'খালি' : 'সক্রিয়'}</Badge> },
          ]}
          rows={rows}
        />
      </Card>
    </Page>
  );
}
