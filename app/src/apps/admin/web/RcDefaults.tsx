import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { RC_DEF_ST, RC_STEP, RC_STEP_ORDER, rcStepIndex } from '../../../domain/adminRosca';
import { Note, Page, StatBar } from './webParts';

export default function RcDefaults() {
  const s = useAdminRo();
  const nav = useNavigate();
  const [committee, setCommittee] = useState('');
  const [repl, setRepl] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const act = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const wait = s.state.waitlist;

  return (
    <Page title="ডিফল্ট ও প্রতিস্থাপন" sub="সতর্কতা → বিলম্ব ফি → প্রতিস্থাপন → বাতিল — কমিটির সিদ্ধান্ত ছাড়া শেষ ধাপ নয় (D-46)"
      back="/w/rc"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/rc/collect')}>কিস্তি সংগ্রহ</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'খোলা কেস', v: bn(s.state.defaults.filter((d) => d.status !== 'resolved').length), tone: 'danger' },
        { k: 'কমিটি বাকি', v: bn(s.state.defaults.filter((d) => d.status === 'pending-committee').length), tone: 'warn' },
        { k: 'মোট দাবি', v: `৳${bn(s.state.defaults.reduce((n, d) => n + d.amount, 0))}` },
        { k: 'নিষ্পত্তি', v: bn(s.state.defaults.filter((d) => d.status === 'resolved').length), tone: 'ok' },
      ]} />
      <Note tone="warn">প্রতিস্থাপনে বহির্গত সদস্যের জমার নিষ্পত্তি কমিটির সিদ্ধান্তে; সরাসরি ডিলিট বা ফোরফেইট নয়। বিলম্ব ফি আলাদা খাতে — সুদ শূন্য।</Note>

      <div className="grid gap-4 md:grid-cols-2">
        {s.state.defaults.map((d) => {
          const idx = rcStepIndex(d.step);
          return (
            <Card key={d.id} title={`কেস ${d.id} · সিট ${bn(d.seatNo)}`} sub={`${d.circle} · ${RC_DEF_ST[d.status].t}`}
              right={<Badge tone={d.status === 'resolved' ? 'ok' : d.status === 'pending-committee' ? 'warn' : 'danger'}>{RC_DEF_ST[d.status].t}</Badge>}>
              <div className="flex items-center gap-1 mb-3">
                {RC_STEP_ORDER.map((x, i) => (
                  <div key={x} className={`flex-1 text-center text-[10px] font-bold rounded-r-pill py-1 border ${i < idx ? 'bg-ok-bg border-ok-bd text-ok-ink' : i === idx ? 'bg-warn-bg border-warn-bd text-warn-ink' : 'bg-card-2 border-line text-mut'}`}>
                    {RC_STEP[x]}
                  </div>
                ))}
              </div>
              <div className="text-sm space-y-1 text-txt-2">
                <p>বকেয়া ড্র: <b>{d.missedDraws.map((n) => `#${bn(n)}`).join(', ') || '—'}</b></p>
                <p>দাবি: <b className="num">৳{bn(d.amount)}</b> · বিলম্ব ফি: <b className="num">৳{bn(d.lateFee)}</b></p>
                <p>নোটিশ: {d.noticeSent} · কমিটি: {d.committee ?? '—'}</p>
                <p className="text-mut">{d.note}</p>
              </div>
              {d.status !== 'resolved' ? (
                <div className="mt-3 space-y-2">
                  <Button size="sm" variant="secondary" block onClick={() => act(s.advanceDefault(d.id))} disabled={idx >= RC_STEP_ORDER.length - 1}>
                    পরের ধাপে নিন
                  </Button>
                  <div className="flex gap-1.5">
                    <input value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="কমিটি সিদ্ধান্ত নম্বর" className={`${inputCls} min-h-9 text-sm`} />
                    <Button size="sm" onClick={() => act(s.resolveDefault(d.id, committee))}>নিষ্পত্তি</Button>
                  </div>
                  <div className="flex gap-1.5">
                    <select value={repl[d.id] ?? ''} onChange={(e) => setRepl((x) => ({ ...x, [d.id]: e.target.value }))} className={`${inputCls} min-h-9 text-sm`}>
                      <option value="">ওয়েটলিস্ট</option>
                      {(wait[d.circle] ?? []).map((w) => <option key={w.memberId} value={w.memberId}>{w.memberId} · #{bn(w.pos)}</option>)}
                    </select>
                    <Button size="sm" variant="secondary" onClick={() => act(s.replaceSeat(d.id, repl[d.id] ?? ''))}>প্রতিস্থাপন</Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-ok-ink font-bold">✅ নিষ্পত্তি হয়েছে — রেকর্ড অপরিবর্তনীয়</p>
              )}
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
