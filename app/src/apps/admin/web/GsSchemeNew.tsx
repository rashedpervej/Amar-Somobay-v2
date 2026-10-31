import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Note, Page } from './webParts';
import { Field } from './gsParts';

const STEPS = ['মূল তথ্য', 'শর্ত ও সীমা', 'কমিটি অনুমোদন'];

export default function GsSchemeNew() {
  const { state, createScheme } = useAdmin();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ code: '', name: '', typeBn: 'মাসিক', installment: '500', tenure: '', minBalance: '500', decisionNo: '' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [code] = useState('MS-05');

  const next = () => {
    if (step === 0) {
      if (f.name.trim().length < 3) { setErr('স্কিমের নাম অন্তত ৩ অক্ষর দিন'); return; }
      if (!/^[A-Z]{2}-\d{2}$/.test(f.code.trim() || code)) { setErr('কোডের ছাঁচ: MS-05 — দুই বড় অক্ষর, হাইফেন, দুই অঙ্ক'); return; }
    }
    setErr('');
    setStep((s) => Math.min(2, s + 1));
  };
  const save = () => {
    const r = createScheme({
      code: f.code.trim() || code, name: f.name, typeBn: f.typeBn,
      installment: Number(f.installment), tenure: f.tenure ? Number(f.tenure) : null,
      minBalance: Number(f.minBalance),
    }, f.decisionNo);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="নতুন স্কিম তৈরি" sub="তিন ধাপ · কমিটির সিদ্ধান্ত ছাড়া স্কিম চালু হয় না (D-34)" back="/w/schemes"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/schemes')}>তালিকায় ফিরুন</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <Card title={`ধাপ ${bn(step + 1)} · ${STEPS[step]}`} sub={`${bn(step + 1)}/${bn(3)}`}>
            <div className="flex gap-1.5 mb-4">
              {STEPS.map((s, i) => (
                <div key={s} className={`flex-1 rounded-r-pill px-2 py-1.5 text-center text-xs font-bold ${i <= step ? 'bg-green-700 text-white' : 'bg-card-2 text-mut border border-line'}`}>{s}</div>
              ))}
            </div>
            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="স্কিম কোড" hint="পরিবর্তন করা যাবে না; রসিদে ব্যবহৃত">
                  <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder={code} className={`${inputCls} num`} />
                </Field>
                <Field label="স্কিমের নাম">
                  <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="যেমন: শিক্ষা সঞ্চয়" className={inputCls} />
                </Field>
                <Field label="ধরন">
                  <select value={f.typeBn} onChange={(e) => setF({ ...f, typeBn: e.target.value })} className={inputCls}>
                    {['মাসিক', 'মেয়াদি', 'দৈনিক', 'নমনীয়'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="কিস্তি (৳)" hint="সর্বনিম্ন ৳১০">
                  <input type="number" value={f.installment} onChange={(e) => setF({ ...f, installment: e.target.value })} className={`${inputCls} num`} />
                </Field>
              </div>
            )}
            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="মেয়াদ (মাস)" hint="খালি রাখলে মেয়াদহীন">
                  <input type="number" value={f.tenure} onChange={(e) => setF({ ...f, tenure: e.target.value })} placeholder="36" className={`${inputCls} num`} />
                </Field>
                <Field label="সর্বনিম্ন ব্যালেন্স (৳)" hint="সর্বোচ্চ ৳৫,০০০">
                  <input type="number" value={f.minBalance} onChange={(e) => setF({ ...f, minBalance: e.target.value })} className={`${inputCls} num`} />
                </Field>
                <Field label="লক-ইন (মাস)">
                  <input value="৬" readOnly className={`${inputCls} bg-card-2`} />
                </Field>
                <Field label="নোটিশ পিরিয়ড (দিন)">
                  <input value="১৫" readOnly className={`${inputCls} bg-card-2`} />
                </Field>
                <div className="sm:col-span-2"><Note>শতাংশ/মুনাফা হার নেই — এই স্কিমে সুদ নেই, কোনো লভ্যাংশও যোগ হবে না (D-01)।</Note></div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <p>কোড: <b className="num">{f.code || code}</b></p>
                  <p>নাম: <b>{f.name || '—'}</b></p>
                  <p>ধরন: <b>{f.typeBn}</b></p>
                  <p>কিস্তি: <b className="num">৳{bn(Number(f.installment) || 0)}</b></p>
                  <p>মেয়াদ: <b>{f.tenure ? `${bn(Number(f.tenure))} মাস` : 'মেয়াদহীন'}</b></p>
                  <p>সর্বনিম্ন ব্যালেন্স: <b className="num">৳{bn(Number(f.minBalance) || 0)}</b></p>
                </div>
                <Field label="কমিটির সিদ্ধান্ত নম্বর" hint="কমপক্ষে ৪ অক্ষর — ছাড়া চালু হবে না">
                  <input value={f.decisionNo} onChange={(e) => setF({ ...f, decisionNo: e.target.value })} placeholder="CM-2610-08" className={inputCls} />
                </Field>
              </div>
            )}
            <div className="flex justify-between mt-4">
              <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>আগের ধাপ</Button>
              {step < 2 ? <Button onClick={next}>পরের ধাপ</Button> : <Button onClick={save}>খসড়া জমা</Button>}
            </div>
          </Card>
        </div>
        <div className="space-y-3">
          <Card title="কেন অনুমোদন?">
            <p className="text-sm text-mut leading-relaxed">নতুন স্কিম প্রথমে <b>অনুমোদনের অপেক্ষায়</b> থাকে। কমিটির সিদ্ধান্ত নম্বর ছাড়া সদস্য ভর্তি বা টাকা গ্রহণ শুরু করা যাবে না (D-34)।</p>
          </Card>
          <Card title="বিদ্যমান স্কিম">
            <div className="space-y-1.5 text-sm">
              {state.schemes.map((s) => <div key={s.id} className="flex justify-between gap-2"><span className="truncate">{s.name}</span><b className="num">{s.code}</b></div>)}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
