/* RAM-03 · নতুন চক্র / নতুন স্কিম — নিয়ম সংস্করণ ও চক্র শুরু (ফ্লো) */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Plus } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { rcPerDraw, rcTotalPool, type RcScheme } from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { PoolRow, useRoleQS } from './rcParts';

export default function RcNew() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, startCircle, saveScheme } = useAdminRo();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'circle' | 'scheme'>(params.get('mode') === 'scheme' ? 'scheme' : 'circle');
  const [schemeId, setSchemeId] = useState(state.schemes[0].id);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [f, setF] = useState({ code: 'RCS-04', name: '', seats: '8', contrib: '3000', freq: 'মাসিক', drawMethod: 'lottery' as 'lottery' | 'fixed' });
  const scheme = state.schemes.find((s) => s.id === schemeId) as RcScheme;

  const openCircle = () => {
    setErr(''); setMsg('');
    const r = startCircle(schemeId);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  const submitScheme = () => {
    setErr(''); setMsg('');
    const r = saveScheme({
      code: f.code, name: f.name, seats: Number(f.seats), contrib: Number(f.contrib),
      freq: f.freq, drawMethod: f.drawMethod,
    });
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
    setF({ ...f, code: 'RCS-05', name: '' });
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/rc${qs}`)}>ড্যাশবোর্ডে ফিরুন</Button>

      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('circle')}
          className={`grow min-h-tap rounded-r-sm border font-bold ${mode === 'circle' ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>নতুন চক্র</button>
        <button type="button" onClick={() => setMode('scheme')}
          className={`grow min-h-tap rounded-r-sm border font-bold ${mode === 'scheme' ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>নতুন স্কিম</button>
      </div>

      {msg ? <SuccessBanner title={msg}>{mode === 'circle' ? 'চক্র তালিকায় দেখুন — সিট বরাদ্দ করে প্রথম ড্র প্রস্তুত করুন।' : 'স্কিম তালিকায় যোগ হয়েছে।'}</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {mode === 'circle' ? (
        <>
          <Card title="১ · স্কিম বাছাই" sub="কিস্তি ও সিট সংখ্যা পরে বদলানো যায় না">
            <div className="space-y-2">
              {state.schemes.map((s) => (
                <button key={s.id} type="button" onClick={() => setSchemeId(s.id)}
                  className={`w-full text-left rounded-r-sm border px-3 py-2.5 ${schemeId === s.id ? 'border-green-600 bg-green-050' : 'border-line bg-card'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm">{s.code} · {s.name}</b>
                    <Badge tone={s.status === 'active' ? 'ok' : 'neutral'}>{s.status === 'active' ? 'চালু' : 'আর্কাইভড'}</Badge>
                  </div>
                  <div className="text-xs text-mut num">সিট {bn(s.seats)} · কিস্তি ৳{bn(s.contrib)} · প্রতি ড্র ৳{bn(rcPerDraw(s))}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="২ · চক্রের তথ্য">
            <PoolRow label="প্রতি ড্র পুল" value={`৳${bn(rcPerDraw(scheme))}`} />
            <div className="mt-2"><PoolRow label="মোট চক্র-পুল" value={`৳${bn(rcTotalPool(scheme))}`} /></div>
            <div className="mt-2"><PoolRow label="ড্র পদ্ধতি" value={scheme.drawMethod === 'lottery' ? 'লটারি' : 'পূর্বনির্ধারিত ক্রম'} /></div>
            <div className="mt-2"><PoolRow label="ডিফল্ট নীতি" value={`${bn(scheme.defaultPolicy.length)} ধাপ`} tone="warn" /></div>
            <p className="text-xs text-mut mt-2">চক্র শুরু হলে সদস্য যোগ দিতে পারবে; সিট পূর্ণ হলে প্রথম ড্র নির্ধারিত হবে। কোনো সুদ/অতিরিক্ত চার্জ নেই (BR-13)।</p>
          </Card>

          <Button block icon={<Plus size={16} />} onClick={openCircle} disabled={scheme.status === 'archived'}>
            {scheme.code} · নতুন চক্র খুলুন
          </Button>
          {scheme.status === 'archived' ? <p className="text-xs text-danger">আর্কাইভড স্কিমে নতুন চক্র খোলা যায় না।</p> : null}
        </>
      ) : (
        <>
          <Card title="নতুন নিয়ম সংস্করণ" sub="কোড একবারই তৈরি হয় (BR-08)">
            <div className="space-y-3">
              <Field label="স্কিম কোড" required hint="ধারা RCS-01">
                {(id) => <input id={id} className={inputClass()} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />}
              </Field>
              <Field label="স্কিমের নাম" required>
                {(id) => <input id={id} className={inputClass()} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="যেমন: মাসিক চক্র ৳৩,০০০ · ৮ সিট" />}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="সিট সংখ্যা" required hint="৬–২০">
                  {(id) => <input id={id} type="number" className={inputClass()} value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} />}
                </Field>
                <Field label="কিস্তি (৳)" required hint="২০০–২০,০০০">
                  {(id) => <input id={id} type="number" className={inputClass()} value={f.contrib} onChange={(e) => setF({ ...f, contrib: e.target.value })} />}
                </Field>
              </div>
              <div>
                <div className="text-sm font-bold text-txt-2 mb-1.5">ড্র পদ্ধতি</div>
                <div className="flex gap-2">
                  {(['lottery', 'fixed'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setF({ ...f, drawMethod: k })}
                      className={`grow min-h-tap rounded-r-sm border text-sm font-bold ${f.drawMethod === k ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3 text-txt-2'}`}>
                      {k === 'lottery' ? 'লটারি' : 'পূর্বনির্ধারিত ক্রম'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-mut mt-1">লটারিতে কমপক্ষে ৮ সিট লাগবে; Admin-নির্ধারিত পদ্ধতি D-42 অমীমাংসিত।</p>
              </div>
            </div>
          </Card>

          <SectionHead title="যাচাই" sub="সংরক্ষণের আগে" />
          <Card>
            <PoolRow label="প্রতি ড্র পুল" value={`৳${bn(Number(f.seats || 0) * Number(f.contrib || 0))}`} tone="ok" />
            <div className="mt-2"><PoolRow label="বিলম্ব ফি (২%)" value={`৳${bn(Math.round(Number(f.contrib || 0) * 0.02))}`} tone="warn" /></div>
            <p className="text-xs text-mut mt-2 flex items-start gap-1"><CheckCircle2 size={14} className="mt-0.5" /> নতুন স্কিম v1 হিসেবে সংরক্ষিত হবে; পুরোনো চক্রের হিসাব অপরিবর্তিত থাকবে।</p>
            <Button block className="mt-3" onClick={submitScheme}>স্কিম সংরক্ষণ করুন</Button>
          </Card>
        </>
      )}
    </div>
  );
}
