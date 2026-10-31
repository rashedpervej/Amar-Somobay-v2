import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { RC_METHOD } from '../../../domain/adminRosca';
import { bn } from '../../../lib/bn';
import { Note, Page, StatBar } from './webParts';

export default function RcSchemeEdit() {
  const { schemeId } = useParams();
  const s = useAdminRo();
  const nav = useNavigate();
  const cur = schemeId ? s.state.schemes.find((x) => x.id === schemeId) : null;
  const [f, setF] = useState({
    code: cur?.code ?? 'RCS-04',
    name: cur?.name ?? '',
    seats: String(cur?.seats ?? 10),
    contrib: String(cur?.contrib ?? 4000),
    freq: cur?.freq ?? 'মাসিক',
    drawMethod: cur?.drawMethod ?? 'lottery' as 'lottery' | 'fixed',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    const r = s.saveScheme({
      id: cur?.id, code: f.code, name: f.name, seats: Number(f.seats), contrib: Number(f.contrib),
      freq: f.freq, drawMethod: f.drawMethod,
    });
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
  };

  const seats = Number(f.seats) || 0;
  const contrib = Number(f.contrib) || 0;

  return (
    <Page
      title={cur ? 'স্কিম সম্পাদনা' : 'নতুন ROSCA স্কিম'}
      sub={cur ? `${cur.code} · সংস্করণ v${cur.version} — পরিবর্তনে নতুন সংস্করণ হবে` : 'সিট, কিস্তি ও ড্র পদ্ধতি নির্ধারণ করুন'}
      back="/w/rc/schemes"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/rc/schemes')}>বাতিল</Button><Button size="sm" onClick={submit}>সংরক্ষণ ও প্রকাশ</Button></>}
    >
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="স্কিমের মূল তথ্য" sub="সব ঘর যাচাই করা হবে">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className="text-sm font-bold">স্কিম কোড *</span><input value={f.code} onChange={set('code')} className={`${inputCls} mt-1`} /></label>
            <label className="block"><span className="text-sm font-bold">ফ্রিকোয়েন্সি *</span>
              <select value={f.freq} onChange={set('freq')} className={`${inputCls} mt-1`}>
                {['মাসিক', 'সাপ্তাহিক', 'ত্রৈমাসিক'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2"><span className="text-sm font-bold">নাম *</span><input value={f.name} onChange={set('name')} placeholder="যেমন: মাসিক সঞ্চয় চক্র" className={`${inputCls} mt-1`} /></label>
            <label className="block"><span className="text-sm font-bold">সিট সংখ্যা *</span><input type="number" value={f.seats} onChange={set('seats')} className={`${inputCls} mt-1 num`} /></label>
            <label className="block"><span className="text-sm font-bold">প্রতি কিস্তি (৳) *</span><input type="number" value={f.contrib} onChange={set('contrib')} className={`${inputCls} mt-1 num`} /></label>
            <div className="sm:col-span-2">
              <span className="text-sm font-bold">ড্র পদ্ধতি *</span>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                {(['lottery', 'fixed'] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setF((x) => ({ ...x, drawMethod: k }))}
                    className={`min-h-tap rounded-r-sm border px-3 py-2 text-left ${f.drawMethod === k ? 'border-green-600 bg-green-050' : 'border-line-3 bg-card'}`}>
                    <b className="text-sm">{RC_METHOD[k]}</b>
                    <span className="block text-xs text-mut mt-0.5">{k === 'lottery' ? 'স্বচ্ছ লটারি, সাক্ষী ও হ্যাশ' : 'পূর্বনির্ধারিত ক্রম — কমিটির সিদ্ধান্ত'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="পুল হিসাব" sub="সিট × কিস্তি">
            <StatBar items={[
              { k: 'প্রতি ড্র', v: `৳${bn(seats * contrib)}`, tone: 'neutral' },
              { k: 'মোট পুল', v: `৳${bn(seats * contrib * seats)}` },
            ]} />
            <div className="mt-3 text-sm space-y-1.5 text-txt-2">
              <p>• প্রতি ড্র পুল: <b>৳{bn(seats * contrib)}</b></p>
              <p>• মোট দায়: <b>৳{bn(seats * contrib * seats)}</b></p>
              <p className="text-mut">পুল আলাদা দায় খাত — সদস্যের সঞ্চয় নয় (D-38)।</p>
            </div>
          </Card>
          <Note>সাব্যস্ত চ্যানেল নিষ্ক্রিয় (D-12)। সংরক্ষণ করলে নতুন সংস্করণ তৈরি হবে; চলমান চক্রের নিয়ম বদলাবে না (BR-21)।</Note>
        </div>
      </div>
    </Page>
  );
}
