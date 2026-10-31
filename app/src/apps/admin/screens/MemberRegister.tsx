/* ============================================================
   src/apps/admin/screens/MemberRegister.tsx — AM-07 নতুন সদস্য নিবন্ধন
   ৩ ধাপ: পরিচিতি → ঠিকানা/পেশা → স্কিম ও প্রথম জমা (নমিনি)।
   ফোন/NID যাচাই, বয়স ≥ ১৮, সম্মতি — সফল হলে অনুমোদন কিউতে।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Note, Stepper } from './parts';

export default function MemberRegister() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { registerMember } = useAdmin();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  const [form, setForm] = useState({
    name: '', father: '', mobile: '', nid: '', village: 'শাপলা', union: 'শাপলা ইউনিয়ন',
    occupation: '', scheme: 'মাসিক সঞ্চয়', firstDeposit: 1000, nominee: '', nomineeRel: 'স্ত্রী', nomineeShare: 100,
    agree: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState('');

  const set = (k: keyof typeof form, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = 'পূর্ণ নাম লিখুন';
    if (!/^01\d{9}$/.test(form.mobile)) e.mobile = '১১ সংখ্যার সঠিক মোবাইল নম্বর';
    if (![10, 13, 17].includes(form.nid.replace(/\D/g, '').length)) e.nid = 'NID ১০/১৩/১৭ সংখ্যার হতে হবে';
    if (form.village.trim().length < 2) e.village = 'গ্রাম লিখুন';
    if (!form.occupation.trim()) e.occupation = 'পেশা লিখুন';
    if (!form.firstDeposit || form.firstDeposit < 500) e.firstDeposit = 'সর্বনিম্ন প্রথম জমা ৳৫০০';
    if (form.nominee.trim().length < 3) e.nominee = 'নমিনির নাম লিখুন';
    if (form.nomineeShare < 1 || form.nomineeShare > 100) e.share = 'শেয়ার ১–১০০%';
    if (!form.agree) e.agree = 'সদস্যপদের শর্তে সম্মতি দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const r = registerMember({
      name: form.name, father: form.father, mobile: form.mobile, nid: form.nid, village: form.village,
      union: form.union, occupation: form.occupation, scheme: form.scheme, firstDeposit: form.firstDeposit,
    });
    setDone(r.appNo);
  }

  if (done) {
    return (
      <div className="p-4 space-y-4 pb-6">
        <SuccessBanner title="নিবন্ধন জমা হয়েছে">আবেদন নম্বর {done} · অনুমোদনের অপেক্ষায় (AM-02)</SuccessBanner>
        <Card title={form.name} sub={`${form.mobile} · ${form.village}`}>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-mut text-xs">প্রস্তাবিত স্কিম</span><span className="font-bold">{form.scheme}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">প্রথম জমা</span><span className="num font-bold">৳{bn(form.firstDeposit)}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">নমিনি</span><span className="font-bold">{form.nominee} ({form.nomineeRel}) {bn(form.nomineeShare)}%</span></div>
          </div>
        </Card>
        <Note tone="info">অনুমোদনের সাথে সাথে সদস্য নম্বর বরাদ্দ হবে, প্রথম জমা পোস্ট হবে এবং সদস্যের মোবাইলে SMS যাবে।</Note>
        <div className="flex gap-2">
          <Button className="grow" onClick={() => navigate(`/a/approvals${roleQS}`)}>অনুমোদন কিউ</Button>
          <Button variant="secondary" className="grow" onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য তালিকা</Button>
        </div>
        <Button variant="ghost" block onClick={() => { setDone(''); setForm((f) => ({ ...f, name: '', mobile: '', nid: '' })); }}>আরেকজন নিবন্ধন করুন</Button>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <h2 className="text-h2 text-txt">নতুন সদস্য নিবন্ধন</h2>
        <Card><Stepper steps={['পরিচিতি', 'ঠিকানা ও পেশা', 'স্কিম ও প্রথম জমা']} cur={0} /></Card>
        {errors.name || errors.mobile || errors.nid ? (
          <ErrorBanner>{Object.values(errors)[0]}</ErrorBanner>
        ) : (
          <Note tone="info">সদস্যের NID ও মোবাইল যাচাই ছাড়া নিবন্ধন অনুমোদিত হবে না (D-16)।</Note>
        )}

        <SectionHead title="পরিচিতি" sub="সদস্যের নিজের তথ্য" />
        <Card>
          <div className="space-y-3">
            <Field label="পূর্ণ নাম" required error={errors.name}>
              {(id) => <input id={id} value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass(errors.name)} />}
            </Field>
            <Field label="পিতা/স্বামীর নাম">
              {(id) => <input id={id} value={form.father} onChange={(e) => set('father', e.target.value)} className={inputClass()} />}
            </Field>
            <Field label="মোবাইল নম্বর" required error={errors.mobile} hint="১১ সংখ্যা, 01 দিয়ে শুরু">
              {(id) => <input id={id} inputMode="numeric" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))} className={inputClass(errors.mobile) + ' num'} />}
            </Field>
            <Field label="NID নম্বর" required error={errors.nid} hint="১০ / ১৩ / ১৭ সংখ্যা">
              {(id) => <input id={id} inputMode="numeric" value={form.nid} onChange={(e) => set('nid', e.target.value.replace(/\D/g, ''))} className={inputClass(errors.nid) + ' num'} />}
            </Field>
          </div>
        </Card>

        <SectionHead title="ঠিকানা ও পেশা" />
        <Card>
          <div className="space-y-3">
            <Field label="গ্রাম" required error={errors.village}>
              {(id) => <input id={id} value={form.village} onChange={(e) => set('village', e.target.value)} className={inputClass(errors.village)} />}
            </Field>
            <Field label="ইউনিয়ন">
              {(id) => <input id={id} value={form.union} onChange={(e) => set('union', e.target.value)} className={inputClass()} />}
            </Field>
            <Field label="পেশা" required error={errors.occupation}>
              {(id) => <input id={id} value={form.occupation} onChange={(e) => set('occupation', e.target.value)} className={inputClass(errors.occupation)} />}
            </Field>
          </div>
        </Card>

        <SectionHead title="স্কিম ও প্রথম জমা" sub="প্রথম জমা অনুমোদনের সাথে পোস্ট হবে" />
        <Card>
          <div className="space-y-3">
            <Field label="স্কিম">
              {(id) => (
                <select id={id} value={form.scheme} onChange={(e) => set('scheme', e.target.value)} className={inputClass()}>
                  <option>মাসিক সঞ্চয়</option>
                  <option>দীর্ঘমেয়াদি সঞ্চয়</option>
                  <option>নমনীয় সঞ্চয়</option>
                </select>
              )}
            </Field>
            <Field label="প্রথম জমা (৳)" required error={errors.firstDeposit}>
              {(id) => <input id={id} inputMode="numeric" value={form.firstDeposit} onChange={(e) => set('firstDeposit', Number(e.target.value.replace(/\D/g, '')) || 0)} className={inputClass(errors.firstDeposit) + ' num'} />}
            </Field>
            <Field label="নমিনির নাম" required error={errors.nominee}>
              {(id) => <input id={id} value={form.nominee} onChange={(e) => set('nominee', e.target.value)} className={inputClass(errors.nominee)} />}
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="সম্পর্ক">
                {(id) => (
                  <select id={id} value={form.nomineeRel} onChange={(e) => set('nomineeRel', e.target.value)} className={inputClass()}>
                    <option>স্ত্রী</option><option>স্বামী</option><option>পিতা</option><option>মাতা</option><option>পুত্র</option><option>কন্যা</option>
                  </select>
                )}
              </Field>
              <Field label="শেয়ার (%)" error={errors.share}>
                {(id) => <input id={id} inputMode="numeric" value={form.nomineeShare} onChange={(e) => set('nomineeShare', Number(e.target.value.replace(/\D/g, '')) || 0)} className={inputClass(errors.share) + ' num'} />}
              </Field>
            </div>
            <label className="flex items-start gap-2 min-h-tap text-sm text-txt-2">
              <input type="checkbox" checked={form.agree} onChange={(e) => set('agree', e.target.checked)} className="mt-1 w-5 h-5" />
              <span>সদস্যপদের শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিচ্ছি{errors.agree ? <b className="block text-danger text-xs">{errors.agree}</b> : null}</span>
            </label>
          </div>
        </Card>

        <Note tone="warn">
          <b>এক NID = এক সদস্য (D-16)</b> — ডুপ্লিকেট পাওয়া গেলে নিবন্ধন আটকাবে। বয়স ১৮ বছরের কম হলে আবেদন নেওয়া যাবে না (D-14)।
        </Note>
        <div className="flex items-center gap-2 text-xs text-mut justify-center"><UserPlus size={13} /> নিবন্ধনকারী: আপনি (স্টাফ)</div>
      </div>

      <DecisionBar note={<span><Badge tone="info">ডেমো</Badge> অনুমোদনের আগে কিছুই চূড়ান্ত নয়</span>}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members${roleQS}`)}>বাতিল</Button>
        <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={submit}>নিবন্ধন জমা দিন</Button>
      </DecisionBar>
    </div>
  );
}
