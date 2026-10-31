import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Note, Page } from './webParts';
import { Field } from './gsParts';

export default function GsMemberNew() {
  const { state, registerMember } = useAdmin();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: '', father: '', mobile: '', nid: '', village: '', union: 'শাপলা ইউনিয়ন',
    occupation: '', scheme: state.schemes[0]?.name ?? 'মাসিক সঞ্চয়', firstDeposit: '500',
  });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [appNo, setAppNo] = useState('');

  const next = () => {
    if (step === 0) {
      if (f.name.trim().length < 3) return setErr('সদস্যের নাম অন্তত ৩ অক্ষর দিন');
      if (!/^01[3-9]\d{8}$/.test(f.mobile)) return setErr('মোবাইল নম্বর ১১ সংখ্যার হতে হবে (01…)');
      if (f.nid.trim().length < 10) return setErr('NID কমপক্ষে ১০ সংখ্যা');
    }
    if (step === 1 && f.village.trim().length < 2) return setErr('গ্রামের নাম দিন');
    setErr(''); setStep((s) => Math.min(2, s + 1));
  };
  const save = () => {
    if (Number(f.firstDeposit) < 0) return setErr('প্রাথমিক জমা ঋণাত্মক নয়');
    const r = registerMember({ ...f, firstDeposit: Number(f.firstDeposit) });
    if (!r.ok) { setErr(r.message); return; }
    setErr(''); setMsg(r.message); setAppNo(r.appNo);
  };

  return (
    <Page title="নতুন সদস্য নিবন্ধন" sub="তিন ধাপ · NID ও মোবাইল যাচাই · অনুমোদনের আগে সক্রিয় নয়" back="/w/members"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/members')}>তালিকা</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg} {appNo && <b className="num">({appNo})</b>} — <button type="button" className="underline font-bold min-h-10" onClick={() => nav('/w/approvals/members')}>অনুমোদন কিউ দেখুন</button></Note>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title={`ধাপ ${bn(step + 1)} · ${['পরিচয়', 'ঠিকানা ও পেশা', 'স্কিম ও জমা'][step]}`} sub="সব তথ্য ডেমো; বাস্তব NID যাচাই সংযুক্ত নয়">
          <div className="flex gap-1.5 mb-4">
            {['পরিচয়', 'ঠিকানা', 'স্কিম'].map((s, i) => <div key={s} className={`flex-1 rounded-r-pill px-2 py-1.5 text-center text-xs font-bold ${i <= step ? 'bg-green-700 text-white' : 'bg-card-2 text-mut border border-line'}`}>{s}</div>)}
          </div>
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="পূর্ণ নাম"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} placeholder="যেমন: ফাতেমা আক্তার" /></Field>
              <Field label="পিতা/স্বামীর নাম"><input value={f.father} onChange={(e) => setF({ ...f, father: e.target.value })} className={inputCls} /></Field>
              <Field label="মোবাইল"><input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) })} className={`${inputCls} num`} placeholder="01XXXXXXXXX" inputMode="numeric" /></Field>
              <Field label="NID নম্বর"><input value={f.nid} onChange={(e) => setF({ ...f, nid: e.target.value.replace(/\D/g, '').slice(0, 17) })} className={`${inputCls} num`} inputMode="numeric" /></Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="গ্রাম/মহল্লা"><input value={f.village} onChange={(e) => setF({ ...f, village: e.target.value })} className={inputCls} /></Field>
              <Field label="ইউনিয়ন"><input value={f.union} onChange={(e) => setF({ ...f, union: e.target.value })} className={inputCls} /></Field>
              <Field label="পেশা"><input value={f.occupation} onChange={(e) => setF({ ...f, occupation: e.target.value })} className={inputCls} placeholder="গৃহিণী / কৃষক / শিক্ষক" /></Field>
              <Field label="রুট"><input value="R1 (ডিফল্ট)" readOnly className={`${inputCls} bg-card-2`} /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="স্কিম">
                <select value={f.scheme} onChange={(e) => setF({ ...f, scheme: e.target.value })} className={inputCls}>
                  {state.schemes.filter((s) => s.status === 'active' || s.status === 'pending').map((s) => <option key={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="প্রাথমিক জমা (৳)" hint="অনুমোদনের পর পোস্ট হবে">
                <input type="number" value={f.firstDeposit} onChange={(e) => setF({ ...f, firstDeposit: e.target.value })} className={`${inputCls} num`} />
              </Field>
              <div className="sm:col-span-2"><Note>নিবন্ধন জমা হলে সদস্য <b>নিষ্ক্রিয়</b> অবস্থায় থাকবে; অনুমোদনের পর সক্রিয় ও KYC verified হবে।</Note></div>
            </div>
          )}
          <div className="flex justify-between mt-4">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>আগের ধাপ</Button>
            {step < 2 ? <Button onClick={next}>পরের ধাপ</Button> : <Button onClick={save} disabled={!!msg}>নিবন্ধন জমা</Button>}
          </div>
        </Card>
        <div className="space-y-3">
          <Card title="যাচাইয়ের নিয়ম">
            <ul className="text-sm text-mut space-y-2 leading-relaxed">
              <li>• NID-এর সাথে নাম ও জন্মতারিখ মিলতে হবে।</li>
              <li>• একই মোবাইল/NID দিয়ে দ্বিতীয় সদস্য নয়।</li>
              <li>• অনুমোদনের আগে কোনো টাকা পোস্ট হবে না।</li>
              <li>• আত্মীয়/স্বার্থের দ্বন্দ্ব থাকলে কমিটিকে জানাতে হবে।</li>
            </ul>
          </Card>
          <Card title="তৈরি হবে">
            <div className="text-sm space-y-1">
              <p>সদস্য নম্বর: <b>স্বয়ংক্রিয়</b></p>
              <p>প্রাথমিক জমা: <b className="num">৳{bn(Number(f.firstDeposit) || 0)}</b></p>
              <p>অবস্থা: <b>নিষ্ক্রিয় → অনুমোদনের অপেক্ষায়</b></p>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
