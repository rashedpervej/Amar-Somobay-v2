/* S-09 · সাইনআপ (স্ব-নিবন্ধন) — মোবাইল → OTP → আবেদন জমা, অনুমোদনের আগে সক্রিয় নয় */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useSession } from '../../../store/sessionStore';

const STEPS = ['মোবাইল যাচাই', 'পরিচিতি', 'শর্ত ও জমা'];

export default function Signup() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, otpSent } = useSession();
  const [step, setStep] = useState(0);
  const [number, setNumber] = useState('');
  const [code, setCode] = useState('');
  const [f, setF] = useState({ name: '', father: '', nid: '', village: '', union: 'শাপলা ইউনিয়ন' });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const phoneOk = /^01\d{9}$/.test(number.trim());
  const valid = phoneOk && otpSent;

  async function next() {
    setError('');
    if (step === 0) {
      if (!phoneOk) { setError('১১ সংখ্যার সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)'); return; }
      setBusy(true);
      const r = await sendOtp(number);
      setBusy(false);
      if (!r.ok) { setError(r.error ?? 'OTP পাঠানো যায়নি'); return; }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (f.name.trim().length < 3) { setError('পূর্ণ নাম অন্তত ৩ অক্ষর'); return; }
      if (f.nid.trim().length < 10) { setError('NID কমপক্ষে ১০ সংখ্যা'); return; }
      if (f.village.trim().length < 2) { setError('গ্রামের নাম দিন'); return; }
      setStep(2);
      return;
    }
    if (!agree) { setError('শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিন'); return; }
    if (!valid) { setError('আগে মোবাইল যাচাই সম্পন্ন করুন'); return; }
    setBusy(true);
    const r = await verifyOtp(code);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? 'OTP মেলেনি'); return; }
    navigate('/m/pending', { replace: true });
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-h1 font-extrabold text-txt">সমিতিতে যোগ দিন</div>
        <p className="text-sm text-mut mt-1">স্ব-নিবন্ধন · OTP যাচাই · অনুমোদনের পরে অ্যাকাউন্ট সক্রিয় · ডেমো</p>
      </div>

      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 rounded-r-pill px-2 py-1.5 text-center text-[11px] font-bold ${i <= step ? 'bg-green-700 text-white' : 'bg-card-2 text-mut border border-line'}`}>
            {bn(i + 1)} · {s}
          </div>
        ))}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {step === 0 && (
        <Card title="মোবাইল নম্বর" sub="সংস্থায় আগে থেকে নম্বর থাকলে সেটিই দিন">
          <Field label="মোবাইল" required hint="১১ সংখ্যা — 01XXXXXXXXX">
            {(id) => (
              <input id={id} value={number} inputMode="numeric" placeholder="01XXXXXXXXX"
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className={`${inputClass} num`} />
            )}
          </Field>
          <div className="mt-3 rounded-r-sm border border-info-bd bg-info-bg text-info-ink px-3 py-2 text-xs">
            OTP ডেমো: যেকোনো ৬ সংখ্যা (০০০০০০ নয়)। কোনো বাস্তব SMS যায় না।
          </div>
          <Button block className="mt-3" onClick={next} disabled={busy || !phoneOk}>{busy ? 'পাঠানো হচ্ছে…' : 'OTP পাঠান'}</Button>
        </Card>
      )}

      {step === 1 && (
        <Card title="পরিচিতি" sub={`যাচাই হয়েছে: ${number} · ডেমো`} right={<Badge tone="ok">OTP</Badge>}>
          <div className="space-y-3">
            <Field label="পূর্ণ নাম" required>{(id) => <input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputClass()} placeholder="যেমন: ফাতেমা আক্তার" />}</Field>
            <Field label="পিতা/স্বামীর নাম" required>{(id) => <input id={id} value={f.father} onChange={(e) => setF({ ...f, father: e.target.value })} className={inputClass()} placeholder="পূর্ণ নাম" />}</Field>
            <Field label="NID নম্বর" required hint="কমপক্ষে ১০ সংখ্যা">{(id) => <input id={id} value={f.nid} inputMode="numeric" onChange={(e) => setF({ ...f, nid: e.target.value.replace(/\D/g, '').slice(0, 17) })} className={`${inputClass} num`} />}</Field>
            <Field label="গ্রাম" required>{(id) => <input id={id} value={f.village} onChange={(e) => setF({ ...f, village: e.target.value })} className={inputClass()} placeholder="গ্রামের নাম" />}</Field>
            <Field label="ইউনিয়ন">{(id) => <input id={id} value={f.union} onChange={(e) => setF({ ...f, union: e.target.value })} className={inputClass()} />}</Field>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" block onClick={() => setStep(0)}>আগের ধাপ</Button>
            <Button block onClick={next}>পরের ধাপ</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="শর্ত ও নিশ্চিতকরণ" sub="কমিটি অনুমোদনের আগে কোনো লেনদেন হবে না">
          <div className="rounded-r-sm border border-line bg-card-2 p-3 text-sm space-y-1.5">
            <p>নাম: <b>{f.name}</b></p>
            <p>মোবাইল: <b className="num">{number}</b></p>
            <p>NID: <b className="num">{f.nid}</b></p>
            <p>ঠিকানা: <b>{f.village}, {f.union}</b></p>
            <p>সঞ্চয়: <b>শুধু জমা — কোনো সুদ নেই</b></p>
          </div>
          <Field label="OTP" required hint="৬ সংখ্যা">
            {(id) => <input id={id} value={code} inputMode="numeric" onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={`${inputClass} num`} placeholder="১২৩৪৫৬" />}
          </Field>
          <button type="button" onClick={() => setAgree((v) => !v)} className="min-h-tap w-full flex items-start gap-2 text-left mt-2">
            <span className={`w-5 h-5 rounded-r-sm border grid place-items-center mt-0.5 ${agree ? 'bg-green-700 border-green-800 text-white' : 'border-line-3 bg-card'}`}>{agree ? '✓' : ''}</span>
            <span className="text-sm text-txt-2">আমি শর্তাবলি, গোপনীয়তা নীতি ও সুদমুক্ত নীতিতে সম্মত — আমার তথ্য যাচাই করা হবে।</span>
          </button>
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" block onClick={() => setStep(1)}>আগের ধাপ</Button>
            <Button block onClick={next} disabled={busy || !agree}>{busy ? 'জমা হচ্ছে…' : 'আবেদন জমা দিন'}</Button>
          </div>
        </Card>
      )}

      <Card title="আগে থেকেই সদস্য?">
        <Button block variant="secondary" onClick={() => navigate('/login')}>লগইন করুন</Button>
      </Card>
    </div>
  );
}
