/* ============================================================
   src/apps/shared/screens/Login.tsx — S-01 লগইন / OTP প্রমাণীকরণ
   ধাপ ১: নম্বর → OTP পাঠান · ধাপ ২: ৬ সংখ্যার OTP + শর্তে সম্মতি → প্রবেশ।
   সফল হলে সমিতি নির্বাচনে (S-02) যায়; "পিন দিয়ে প্রবেশ" বিকল্পও কাজ করে।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, KeyRound, LogIn, Send, WifiOff } from 'lucide-react';
import { Button, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { useSession } from '../../../store/sessionStore';

export default function Login() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, otpSent, phone } = useSession();
  const [number, setNumber] = useState(phone);
  const [code, setCode] = useState('');
  const [agree, setAgree] = useState(true);
  const [method, setMethod] = useState<'otp' | 'pin'>('otp');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<'বাংলা' | 'English'>('বাংলা');

  const phoneOk = /^01\d{9}$/.test(number.trim());

  async function requestOtp() {
    setError('');
    if (!phoneOk) {
      setError('১১ সংখ্যার সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)');
      return;
    }
    setBusy(true);
    const r = await sendOtp(number);
    setBusy(false);
    if (!r.ok) setError(r.error ?? 'নম্বরটি ঠিক নয়');
    else setInfo('OTP পাঠানো হয়েছে (ডেমো: যেকোনো ৬ সংখ্যা, ০০০০০০ ছাড়া)');
  }

  async function submit() {
    setError('');
    if (!phoneOk) {
      setError('১১ সংখ্যার সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)');
      return;
    }
    if (!agree) {
      setError('শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিতে হবে');
      return;
    }
    setBusy(true);
    if (method === 'otp') {
      const r = await verifyOtp(code);
      setBusy(false);
      if (!r.ok) {
        setError(r.error ?? 'OTP যাচাই ব্যর্থ');
        return;
      }
    } else {
      if (!/^\d{4,6}$/.test(pin)) {
        setBusy(false);
        setError('৪–৬ সংখ্যার পিন দিন');
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
      setBusy(false);
    }
    navigate('/organizations', { replace: true });
  }

  return (
    <div className="mx-auto max-w-[430px] min-h-full flex flex-col bg-green-900 text-white">
      <div className="grow p-5 flex flex-col">
        <div className="text-center pt-6">
          <div className="w-16 h-16 rounded-r-lg bg-lime text-green-900 grid place-items-center text-3xl font-extrabold mx-auto shadow-sh-2">
            স
          </div>
          <div className="text-display font-extrabold mt-3 tracking-tight">Somobay</div>
          <div className="text-sm text-green-100/80 mt-1">সমবায় সঞ্চয় — সহজ, স্বচ্ছ, আপনার হাতে</div>
        </div>

        <div className="mt-5 rounded-r-lg bg-card text-txt p-4 shadow-sh-2">
          <div className="font-bold text-h3">মোবাইল নম্বর দিয়ে প্রবেশ</div>
          <p className="text-xs text-mut mt-1">পাসওয়ার্ড মনে রাখতে হবে না — OTP-ই যথেষ্ট।</p>

          <div className="mt-3 space-y-3">
            <Field label="মোবাইল নম্বর" required hint="সমিতিতে যে নম্বর দেওয়া আছে সেটিই দিন">
              {(id) => (
                <div className="flex items-center gap-1 rounded-r-sm border border-line-3 bg-card-2 px-2">
                  <span className="text-sm text-mut px-1">+৮৮০</span>
                  <input
                    id={id}
                    value={number}
                    inputMode="numeric"
                    onChange={(e) => setNumber(e.target.value)}
                    className="grow bg-transparent outline-none min-h-tap num font-bold"
                  />
                </div>
              )}
            </Field>

            {!otpSent ? (
              <Button block icon={<Send size={16} />} onClick={requestOtp} disabled={busy || !phoneOk}>
                {busy ? 'পাঠানো হচ্ছে…' : 'OTP পাঠান'}
              </Button>
            ) : null}

            <div className="flex items-center gap-2">
              <Chipset>
                <Chip active={method === 'otp'} onClick={() => { setMethod('otp'); setError(''); }}>OTP</Chip>
                <Chip active={method === 'pin'} onClick={() => { setMethod('pin'); setError(''); }}>পিন</Chip>
              </Chipset>
            </div>

            {method === 'otp' ? (
              <Field label="OTP" required hint="৬ সংখ্যা">
                {(id) => (
                  <input
                    id={id}
                    value={code}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="１２৩４৫６"
                    className={inputClass() + ' num text-center text-h2 tracking-[0.4em] font-extrabold'}
                  />
                )}
              </Field>
            ) : (
              <Field label="পিন" required hint="৪–৬ সংখ্যা">
                {(id) => (
                  <input
                    id={id}
                    type="password"
                    value={pin}
                    inputMode="numeric"
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={inputClass() + ' num text-center tracking-[0.4em] font-extrabold'}
                  />
                )}
              </Field>
            )}

            {otpSent ? <p className="text-xs text-mut">আবার পাঠান: ২৮ সেকেন্ড পরে</p> : null}

            <label className="flex items-start gap-2 py-1">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 w-5 h-5" />
              <span className="text-xs text-txt-2 leading-relaxed">
                আমি <b>শর্তাবলি</b> ও <b>গোপনীয়তা নীতি</b> পড়েছি এবং সম্মত। সম্মতির সংস্করণ v2.1 সংরক্ষিত হবে।
              </span>
            </label>

            {info ? <p className="text-xs text-ok font-bold">{info}</p> : null}
            {error ? <ErrorBanner>{error}</ErrorBanner> : null}

            <Button block size="lg" icon={<LogIn size={18} />} onClick={submit} disabled={busy}>
              {busy ? 'যাচাই হচ্ছে…' : 'প্রবেশ করুন'}
            </Button>

            <div className="border-t border-line-2 pt-3 text-center space-y-2">
              <button type="button" onClick={() => setMethod(method === 'otp' ? 'pin' : 'otp')} className="min-h-tap text-sm font-bold text-green-700 inline-flex items-center gap-1.5">
                <KeyRound size={15} /> {method === 'otp' ? 'পিন / পাসওয়ার্ড দিয়ে প্রবেশ' : 'OTP দিয়ে প্রবেশ'}
              </button>
              <button type="button" onClick={() => navigate('/verify')} className="block w-full min-h-tap text-xs text-mut">
                রসিদ যাচাই করুন — লগইন ছাড়াই
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-r-sm bg-white/95 text-warn-ink border border-warn-bd px-3 py-2 text-xs flex gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            <b>৩ বার ভুল OTP হলে</b> নিরাপত্তার জন্য ১০ মিনিট অপেক্ষা করতে হবে (ব্রুট-ফোর্স প্রতিরোধ)।
          </span>
        </div>

        <div className="mt-4 text-center">
          <Chipset>
            <Chip active={lang === 'বাংলা'} onClick={() => setLang('বাংলা')}>বাংলা</Chip>
            <Chip active={lang === 'English'} onClick={() => setLang('English')}>English</Chip>
          </Chipset>
          <div className="text-[11px] text-green-100/70 mt-3 leading-relaxed">
            সহায়তা: ০১৭১১-৪৫৬৭৮৯
            <br />
            সমবায় সমিতি আইন ২০০১ অনুযায়ী নিবন্ধিত
          </div>
        </div>
      </div>

      <div className="bg-danger-bg text-danger-ink border-t border-danger-bd px-3 py-2 text-xs flex items-center gap-2">
        <WifiOff size={14} /> ইন্টারনেট নেই — লগইন সম্ভব নয়। আগে লগইন হয়ে থাকলে সংরক্ষিত ডেটা দেখতে পারবেন।
      </div>
    </div>
  );
}
