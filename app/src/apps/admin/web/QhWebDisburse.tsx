import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { qhChannelLabel, qhPoolState } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, QhZero, memName } from './qhParts';

export default function QhWebDisburse() {
  const { loanId } = useParams();
  const { state, disburse } = useAdminQh();
  const nav = useNavigate();
  const pending = state.loans.filter((l) => l.status === 'pending');
  const loan = loanId ? state.loans.find((l) => l.id === loanId) : null;
  const [otp, setOtp] = useState('');
  const [note, setNote] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const pool = qhPoolState(state.window, state.loans, state.apps);

  if (!loan) {
    return (
      <Page title="বিতরণ ব্যবস্থাপনা" sub="অনুমোদিত কিন্তু বিতরণ বাকি — OTP ও প্রমাণ ছাড়া টাকা ছাড়বে না (BR-22)"
        back="/w/qh" right={<Button size="sm" variant="secondary" onClick={() => nav('/w/qh/loans')}>ঋণ হাব</Button>}>
        <StatBar items={[
          { k: 'বিতরণ বাকি', v: bn(pending.length), tone: pending.length ? 'warn' : 'ok' },
          { k: 'পুলে মুক্ত', v: `৳${bn(pool.available)}`, tone: pool.available >= 0 ? 'ok' : 'danger' },
          { k: 'OTP যাচাই', v: 'বাধ্যতামূলক' },
          { k: 'সুদ', v: '৳০', tone: 'ok' },
        ]} />
        <QuickList pending={pending} />
        <Card title="বিতরণ তালিকা" sub="প্রতিটি ঋণ আলাদা OTP ও প্রমাণ">
          <DataTable
            columns={[
              {
                key: 'no', head: 'ঋণ', render: (r) => (
                  <button type="button" onClick={() => nav(`/w/qh/disburse/${r.id}`)} className="min-h-10 text-left">
                    <b className="num text-green-800 hover:underline">{r.no}</b>
                    <span className="block text-xs text-mut">{memName(r.memberId)}</span>
                  </button>
                ),
              },
              { key: 'principal', head: 'মূলধন', align: 'right', render: (r) => `৳${bn(r.principal)}` },
              { key: 'tenure', head: 'মেয়াদ', align: 'center', render: (r) => `${bn(r.tenure)} মাস` },
              { key: 'channel', head: 'চ্যানেল', render: (r) => qhChannelLabel(r.channel) },
              { key: 'by', head: 'প্রস্তুতকারী', render: (r) => r.by },
              { key: 'appr', head: 'অনুমোদনকারী', render: (r) => r.appr },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone="warn">OTP বাকি</Badge> },
              { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" onClick={() => nav(`/w/qh/disburse/${r.id}`)}>বিতরণ</Button> },
            ]}
            rows={pending}
            empty="বিতরণের অপেক্ষায় কোনো ঋণ নেই ✅"
          />
        </Card>
        <Note>টাকা ছাড়ার আগে সদস্যের পরিচয়, OTP ও স্বাক্ষরিত রসিদ নিশ্চিত করুন। কোনো সুদ বা ফি কাটা হবে না — পুরো অনুমোদিত মূলধন যাবে।</Note>
      </Page>
    );
  }

  const canGo = loan.by.trim() !== loan.appr.trim();
  const submit = () => {
    const r = disburse(loan.id, { otp, approver: loan.appr, note, evidence });
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title={`${loan.no} · বিতরণ`} sub={`${memName(loan.memberId)} · ৳${bn(loan.principal)} · ${loan.tenure} মাস`}
      back="/w/qh/disburse" right={<Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/loans/${loan.id}`)}>ঋণ বিস্তারিত</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="বিতরণ-পূর্ব গেট" sub="সব শর্ত পূরণ না হলে টাকা ছাড়বে না">
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                ['maker ≠ checker', canGo, `${loan.by} → ${loan.appr}`],
                ['পুলে পর্যাপ্ত অর্থ', pool.available >= loan.principal, `মুক্ত ৳${bn(pool.available)} / প্রয়োজন ৳${bn(loan.principal)}`],
                ['অনুমোদিত সিদ্ধান্ত', true, 'কমিটি রেফারেন্স আছে'],
                ['প্রমাণ সংযুক্ত', evidence.length > 0 || loan.evidence.length > 0, 'রসিদ / স্বাক্ষর / ভাউচার'],
              ].map(([t, ok, sub]) => (
                <div key={String(t)} className={`rounded-r-sm border px-3 py-2.5 ${ok ? 'border-ok-bd bg-ok-bg' : 'border-danger-bd bg-danger-bg'}`}>
                  <b className="text-sm">{ok ? '✓' : '✕'} {t}</b>
                  <span className="block text-xs text-mut">{sub}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="সদস্য ও ঋণের শর্ত" sub="বিতরণের সময়কার স্ন্যাপশট">
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-xs text-mut block">সদস্য</span><b>{memName(loan.memberId)}</b></div>
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-xs text-mut block">মূলধন</span><b className="num">৳{bn(loan.principal)}</b></div>
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-xs text-mut block">প্রথম কিস্তি</span><b>2026-11-30</b></div>
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-xs text-mut block">চ্যানেল</span><b>{qhChannelLabel(loan.channel)}</b></div>
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-xs text-mut block">কমিটি</span><b>{loan.committee}</b></div>
              <div className="rounded-r-sm border border-line p-2.5"><span className="text-xs text-mut block">সুদ / ফি</span><b className="text-ok-ink">৳০</b></div>
            </div>
          </Card>

          <Card title="প্রমাণ সংযুক্তি" sub="D-50 — ছবি/রসিদ/স্বাক্ষর ছাড়া নয়">
            <div className="flex flex-wrap gap-2">
              {['সদস্যের স্বাক্ষরিত রসিদ', 'বিতরণ ভাউচার', 'ব্যাংক/ওয়ালেট রেফারেন্স'].map((t) => {
                const on = evidence.includes(t);
                return (
                  <button key={t} type="button" onClick={() => setEvidence((v) => on ? v.filter((x) => x !== t) : [...v, t])}
                    className={`min-h-10 px-3 rounded-r-sm border text-sm font-bold ${on ? 'border-ok-bd bg-ok-bg' : 'border-line-3 bg-card'}`}>
                    {on ? '✓ ' : ''}{t}
                  </button>
                );
              })}
            </div>
            {loan.evidence.length > 0 && <p className="text-xs text-mut mt-2">আগে থেকে সংযুক্ত: {loan.evidence.join(' · ')}</p>}
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="OTP যাচাই" sub="ডেমো OTP 123456" right={<Badge tone="warn">BR-22</Badge>}>
            <label className="block"><span className="text-sm font-bold">6-সংখ্যার OTP</span>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} placeholder="••••••" className={`${inputCls} mt-1 num tracking-[0.4em] text-center`} />
            </label>
            <label className="block mt-2"><span className="text-sm font-bold">নোট (ঐচ্ছিক)</span>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} mt-1 py-2`} placeholder="হস্তান্তরের স্থান/সময়" />
            </label>
            <Button block className="mt-3" onClick={submit} disabled={!canGo}>OTP যাচাই ও ছাড়</Button>
            <p className="text-xs text-mut mt-2">OTP ভুল হলে কিছুই পরিবর্তন হবে না; ভাউচার ও হ্যাশ তৈরি হলে বিতরণ অপরিবর্তনীয় (BR-08)।</p>
          </Card>
          <QhCallout title="সুদ শূন্য নিশ্চিত" tone="ok">বিতরণে ৳{bn(loan.principal)} পুরোটাই যাবে; কোনো সার্ভিস চার্জ/অ্যাডভান্স সুদ কাটা হবে না।</QhCallout>
          <div className="flex justify-center"><QhZero /></div>
        </div>
      </div>
    </Page>
  );
}

function QuickList({ pending }: { pending: { id: string; no: string }[] }) {
  const nav = useNavigate();
  if (!pending.length) return null;
  return (
    <Card title="দ্রুত বিতরণ" sub="সরাসরি খুলুন">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {pending.map((l) => (
          <button key={l.id} type="button" onClick={() => nav(`/w/qh/disburse/${l.id}`)} className="min-h-10 rounded-r-sm border border-line px-3 py-2 text-left text-sm font-bold hover:border-green-600">
            {l.no} <span className="text-xs text-mut font-normal">· OTP বাকি</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
