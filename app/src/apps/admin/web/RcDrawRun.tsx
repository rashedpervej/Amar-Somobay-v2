import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminRo, rcMembers } from '../../../store/adminRoscaStore';
import { RC_PAYOUT, rcSchemeById, rcSeats, type PayoutKey } from '../../../domain/adminRosca';
import { Money, Note, Page, StatBar } from './webParts';

const STEPS = ['প্রস্তুতি ও সিট', 'প্রাপক নির্বাচন', 'পুল ও চ্যানেল', 'অনুমোদন ও হ্যাশ'];

export default function RcDrawRun() {
  const { drawId } = useParams();
  const s = useAdminRo();
  const nav = useNavigate();
  const d = s.state.draws.find((x) => x.id === drawId) ?? s.state.draws[0];
  const c = s.state.circles.find((x) => x.id === d.circle) ?? s.state.circles[0];
  const sc = rcSchemeById(s.state.schemes, c.scheme);
  const seats = rcSeats(c, sc, s.state.seats, s.state.draws, s.state.missed, rcMembers);
  const [step, setStep] = useState(0);
  const [winner, setWinner] = useState('');
  const [approver, setApprover] = useState('নাসরিন আক্তার');
  const [channel, setChannel] = useState<PayoutKey>('cash_office');
  const [note, setNote] = useState('');
  const [collected, setCollected] = useState(String(d.amount));
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [hash, setHash] = useState<string | null>(null);
  const done = d.status === 'executed';

  const submit = () => {
    const r = s.executeDraw(d.id, {
      winnerSeat: Number(winner), approver, channel, note, collected: Number(collected),
    });
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
    setHash(`0x${(d.no * 7919 + 104729).toString(16)}`);
  };

  return (
    <Page title={`ড্র ${bn(d.no)} · সম্পাদন`} sub={`${c.code} · নির্ধারিত ${d.scheduled} · প্রস্তুতকারী ${d.by}`}
      back="/w/rc/draws"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/rc/draws/history')}>রেজিস্টার</Button>}>
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((t, i) => (
          <button key={t} type="button" onClick={() => setStep(i)}
            className={`min-h-9 px-3 rounded-r-pill border text-xs font-bold ${i === step ? 'bg-green-700 text-white border-green-800' : i < step ? 'bg-green-050 text-green-800 border-green-100' : 'bg-card text-mut border-line-3'}`}>
            {bn(i + 1)} · {t}
          </button>
        ))}
        {done && <Badge tone="ok">সম্পন্ন — অপরিবর্তনীয়</Badge>}
      </div>

      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}{hash ? ` · হ্যাশ ${hash}` : ''}</Note>}

      <StatBar items={[
        { k: 'পুল', v: <Money v={d.amount} /> },
        { k: 'সংগৃহীত', v: <Money v={Number(collected) || 0} />, tone: Number(collected) < d.amount ? 'warn' : 'ok' },
        { k: 'যোগ্য সিট', v: bn(seats.filter((x) => x.memberId && x.status !== 'won').length) },
        { k: 'পদ্ধতি', v: sc.drawMethod === 'lottery' ? 'লটারি' : 'নির্দিষ্ট ক্রম' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title={STEPS[step]} sub={done ? 'সম্পন্ন ড্র সম্পাদনা করা যাবে না — রিভার্সাল-জোড়া লাগবে' : 'ধাপ পূরণ করে পরের ধাপে যান'}>
          {step === 0 && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-r-sm border border-line p-3"><span className="text-mut">চক্র</span><b className="block">{c.code}</b></div>
                <div className="rounded-r-sm border border-line p-3"><span className="text-mut">স্কিম</span><b className="block">{sc.name}</b></div>
                <div className="rounded-r-sm border border-line p-3"><span className="text-mut">সিট / কিস্তি</span><b className="block">{bn(sc.seats)} · ৳{bn(sc.contrib)}</b></div>
                <div className="rounded-r-sm border border-line p-3"><span className="text-mut">সাক্ষী</span><b className="block">{c.witnesses.join(', ')}</b></div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {seats.map((x) => (
                  <span key={x.no} className={`min-h-12 rounded-r-sm border p-1 text-center text-[10px] ${x.status === 'won' ? 'bg-ok-bg border-ok-bd' : x.missed ? 'bg-danger-bg border-danger-bd' : 'bg-card border-line'}`}>
                    <b className="num block">{bn(x.no)}</b>{x.name.split(' ')[0]}
                  </span>
                ))}
              </div>
              <Button onClick={() => setStep(1)} disabled={done}>প্রাপক নির্বাচনে যান</Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-2">
                {seats.filter((x) => x.memberId && x.status !== 'won').map((x) => (
                  <button key={x.no} type="button" onClick={() => setWinner(String(x.no))} disabled={done}
                    className={`min-h-tap rounded-r-sm border px-3 py-2 text-left disabled:opacity-60 ${String(x.no) === winner ? 'border-green-600 bg-green-050' : 'border-line-3 bg-card'}`}>
                    <b className="text-sm">সিট {bn(x.no)} · {x.name}</b>
                    <span className="block text-xs text-mut">জমা ৳{bn(x.contributed)} · বকেয়া {bn(x.missed)}</span>
                  </button>
                ))}
              </div>
              <input value={winner} onChange={(e) => setWinner(e.target.value)} placeholder="সিট নম্বর" className={`${inputCls} max-w-40 num`} />
              <div className="flex gap-2"><Button variant="secondary" onClick={() => setStep(0)}>পিছনে</Button><Button onClick={() => setStep(2)} disabled={done}>পুল ও চ্যানেল</Button></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="block"><span className="text-sm font-bold">সংগৃহীত পুল (৳)</span>
                <input type="number" value={collected} onChange={(e) => setCollected(e.target.value)} className={`${inputCls} mt-1 num`} />
              </label>
              <div>
                <span className="text-sm font-bold">পেআউট চ্যানেল</span>
                <div className="grid sm:grid-cols-2 gap-2 mt-1">
                  {RC_PAYOUT.map((p) => (
                    <button key={p.k} type="button" disabled={!p.on || done} onClick={() => setChannel(p.k)}
                      className={`min-h-tap rounded-r-sm border px-3 py-2 text-left disabled:opacity-50 ${channel === p.k ? 'border-green-600 bg-green-050' : 'border-line-3 bg-card'}`}>
                      <b className="text-sm">{p.t}</b>
                      {!p.on && <span className="block text-xs text-mut">{p.flag ?? 'নিষ্ক্রিয়'}</span>}
                    </button>
                  ))}
                </div>
              </div>
              {Number(collected) < d.amount && (
                <Note tone="warn">ঘাটতি ৳{bn(d.amount - Number(collected))} — কভার সোর্স ও কমিটির সিদ্ধান্ত ছাড়া ড্র সম্পন্ন হবে না (D-38)।</Note>
              )}
              <div className="flex gap-2"><Button variant="secondary" onClick={() => setStep(1)}>পিছনে</Button><Button onClick={() => setStep(3)} disabled={done}>অনুমোদনে যান</Button></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label className="block"><span className="text-sm font-bold">অনুমোদনকারী *</span>
                <select value={approver} onChange={(e) => setApprover(e.target.value)} className={`${inputCls} mt-1`} disabled={done}>
                  {['নাসরিন আক্তার', 'মোঃ আব্দুল্লাহ', 'সুমি রানী দাস', 'কামরুল হাসান'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </label>
              <label className="block"><span className="text-sm font-bold">অনুমোদন মন্তব্য * (৫+ অক্ষর)</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={`${inputCls} mt-1 py-2`} disabled={done} placeholder="কমিটির সিদ্ধান্ত ও সাক্ষীর উপস্থিতি" />
              </label>
              {approver === d.by && <Note tone="warn">প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না — অন্য অনুমোদনকারী বাছাই করুন (BR-04)।</Note>}
              <Button block onClick={submit} disabled={done}>{done ? 'সম্পন্ন' : 'অনুমোদন ও ড্র সম্পন্ন করুন'}</Button>
              <p className="text-xs text-mut">সম্পন্ন হলে রসিদ ও হ্যাশ তৈরি হবে; পরে সংশোধন কেবল রিভার্সাল-জোড়া (R-02)।</p>
            </div>
          )}
        </Card>

        <div className="space-y-3">
          <Card title="নিয়ন্ত্রণ" sub="প্রোটোটাইপ নিয়ম">
            <ul className="text-sm space-y-1.5 text-txt-2">
              <li>• প্রস্তুতকারী ≠ অনুমোদনকারী (BR-04)</li>
              <li>• সম্পন্ন ড্র অপরিবর্তনীয় (BR-08)</li>
              <li>• পুল দায় আলাদা খাত (D-38)</li>
              <li>• লটারি পদ্ধতিতে সাক্ষী ও হ্যাশ (D-42)</li>
              <li>• ঘাটতি থাকলে কভার সোর্স লাগবে</li>
            </ul>
          </Card>
          <Note>ড্র সম্পন্ন হলে রসিদ নম্বর ও হ্যাশ তৈরি হয় — এই ডেমোতে হ্যাশ প্রদর্শিত, প্রকৃত অডিট চেইন ব্যাকএন্ডে হবে।</Note>
        </div>
      </div>
    </Page>
  );
}
