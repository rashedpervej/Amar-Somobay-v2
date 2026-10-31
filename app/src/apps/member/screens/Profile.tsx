/* ============================================================
   src/apps/member/screens/Profile.tsx — M-18 প্রোফাইল ও KYC
   পরিচিতি, যোগাযোগ, ঠিকানা ও পিতা-মাতার তথ্য সম্পাদনা; সেভ করলে স্টোরে
   সংরক্ষিত হয় (পুনরায় খুললে হালনাগাদ তথ্যই দেখা যায়)। KYC অগ্রগতি হিসাব হয়।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Save, ShieldAlert, UserRound } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { ErrorBanner, Field, StatusChip, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import type { Profile as ProfileT } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

const KYC_FIELDS: (keyof ProfileT)[] = ['name', 'nameEn', 'phone', 'email', 'nid', 'dob', 'address', 'occupation', 'fatherName', 'motherName'];

export default function Profile() {
  const { state, saveProfile } = useMember();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileT>(state.profile);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileT, string>>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const completion = useMemo(() => {
    const filled = KYC_FIELDS.filter((k) => String(form[k] ?? '').trim().length > 0).length;
    return Math.round((filled / KYC_FIELDS.length) * 100);
  }, [form]);

  function set<K extends keyof ProfileT>(key: K, value: ProfileT[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function validate() {
    const e: Partial<Record<keyof ProfileT, string>> = {};
    if (form.name.trim().length < 3) e.name = 'পূর্ণ নাম লিখুন';
    if (!/^01\d{9}$/.test(form.phone.replace(/\D/g, ''))) e.phone = '১১ সংখ্যার মোবাইল নম্বর দিন';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'ইমেইল সঠিক নয়';
    const nid = form.nid.replace(/\D/g, '');
    if ([10, 13, 17].includes(nid.length) === false) e.nid = 'NID ১০, ১৩ বা ১৭ সংখ্যার হতে হবে';
    if (!form.dob.trim()) e.dob = 'জন্মতারিখ লিখুন';
    if (form.address.trim().length < 10) e.address = 'বিস্তারিত ঠিকানা লিখুন';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      await saveProfile(form);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  const textField = (
    key: keyof ProfileT,
    label: string,
    opts: { required?: boolean; hint?: string; type?: string; placeholder?: string; multiline?: boolean } = {},
  ) => (
    <Field label={label} required={opts.required} error={errors[key]} hint={opts.hint}>
      {(id) =>
        opts.multiline ? (
          <textarea
            id={id}
            rows={3}
            value={String(form[key] ?? '')}
            onChange={(e) => set(key, e.target.value as ProfileT[typeof key])}
            className={inputClass(errors[key]) + ' py-2 min-h-[80px]'}
            placeholder={opts.placeholder}
          />
        ) : (
          <input
            id={id}
            type={opts.type ?? 'text'}
            value={String(form[key] ?? '')}
            onChange={(e) => set(key, e.target.value as ProfileT[typeof key])}
            className={inputClass(errors[key])}
            placeholder={opts.placeholder}
          />
        )
      }
    </Field>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-r-md bg-card border border-line p-4 shadow-sh-1 flex items-center gap-3">
        <div className="w-14 h-14 rounded-r-pill bg-green-050 grid place-items-center shrink-0">
          <UserRound size={26} className="text-green-700" />
        </div>
        <div className="grow min-w-0">
          <div className="font-extrabold text-txt truncate">{state.profile.name}</div>
          <div className="text-xs text-mut">
            সদস্য নং {state.profile.memberNo} · যোগদান {state.profile.since}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StatusChip status={state.profile.kycStatus === 'verified' ? 'verified' : state.profile.kycStatus} />
            {state.profile.kycStatus === 'verified' ? <Badge tone="ok">KYC সম্পন্ন</Badge> : null}
          </div>
        </div>
      </div>

      <Card title="KYC অগ্রগতি" sub={`${bn(completion)}% সম্পূর্ণ`}>
        <div className="h-2 rounded-r-pill bg-card-2 overflow-hidden">
          <div className="h-full bg-green-700 transition-all" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 ? (
          <p className="text-xs text-warn-ink mt-2 flex items-start gap-1.5">
            <ShieldAlert size={13} className="mt-0.5 shrink-0" />
            সব ঘর পূরণ করলে উত্তোলন সীমা ও পরিষেবা বাড়ে। তথ্য গোপনীয় থাকে।
          </p>
        ) : (
          <p className="text-xs text-ok mt-2 flex items-center gap-1.5">
            <BadgeCheck size={13} /> সব তথ্য পূরণ হয়েছে।
          </p>
        )}
      </Card>

      {saved ? <SuccessBanner title="সংরক্ষিত হয়েছে">প্রোফাইলের তথ্য হালনাগাদ হয়েছে।</SuccessBanner> : null}

      <Card title="পরিচিতি">
        <div className="space-y-3">
          {textField('name', 'পূর্ণ নাম (বাংলা)', { required: true })}
          {textField('nameEn', 'Full Name (English)')}
          {textField('fatherName', 'পিতার নাম')}
          {textField('motherName', 'মাতার নাম')}
          {textField('occupation', 'পেশা', { placeholder: 'যেমন: কৃষি উদ্যোক্তা' })}
        </div>
      </Card>

      <Card title="যোগাযোগ ও পরিচয়">
        <div className="space-y-3">
          {textField('phone', 'মোবাইল নম্বর', { required: true, type: 'tel', placeholder: '০১৭xxxxxxxx' })}
          {textField('email', 'ইমেইল', { type: 'email', placeholder: 'name@example.com' })}
          {textField('nid', 'জাতীয় পরিচয়পত্র নম্বর', { required: true, hint: 'শুধু সংখ্যা — ১০/১৩/১৭ ডিজিট' })}
          {textField('dob', 'জন্মতারিখ', { required: true, placeholder: '০১ জানুয়ারি ১৯৯০' })}
        </div>
      </Card>

      <Card title="ঠিকানা">
        {textField('address', 'বিস্তারিত ঠিকানা', { required: true, multiline: true, placeholder: 'গ্রাম/মহল্লা, ডাকঘর, উপজেলা, জেলা' })}
      </Card>

      {Object.keys(errors).length > 0 ? <ErrorBanner>উপরের ঘরগুলো ঠিক করুন</ErrorBanner> : null}

      <Button block size="lg" icon={<Save size={18} />} onClick={submit} disabled={busy}>
        {busy ? 'সংরক্ষণ হচ্ছে…' : 'তথ্য সংরক্ষণ করুন'}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => navigate('/m/nominees')}>
          নমিনি (M-19)
        </Button>
        <Button variant="secondary" onClick={() => navigate('/m/settings')}>
          সেটিংস (M-20)
        </Button>
      </div>
    </div>
  );
}
