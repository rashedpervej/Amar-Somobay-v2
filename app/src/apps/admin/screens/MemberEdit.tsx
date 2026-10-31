/* ============================================================
   src/apps/admin/screens/MemberEdit.tsx — AM-09 সদস্য সম্পাদনা
   বদলানো যায় এমন ফিল্ড, বাধ্যতামূলক কারণ ও প্রমাণ, লকড ফিল্ড,
   পরিবর্তনের ইতিহাস — সংরক্ষণ করলে maker≠checker কিউতে যায়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, History, Lock, Pencil, Phone, ShieldAlert } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { useAdmin } from '../../../store/adminStore';
import { memberById } from '../../../domain/admin';
import { KV, Note, StackedCard, StackHead } from './parts';

export default function MemberEdit() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, saveMemberChange } = useAdmin();
  const m = memberById(state.members, id ?? 'm1');
  const [form, setForm] = useState({
    name: m?.name ?? '', father: m?.father ?? '', mobile: m?.mobile ?? '',
    village: m?.village ?? '', union: m?.union ?? '', occupation: m?.occupation ?? '',
  });
  const [reasonPick, setReasonPick] = useState('NID-এর সাথে মিল');
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState('NID-সামনে.jpg');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  if (!m) return <div className="p-4"><Note tone="warn">সদস্য পাওয়া যায়নি</Note></div>;

  function save() {
    setError('');
    if (reason.trim().length < 5) { setError('পরিবর্তনের কারণ অন্তত ৫ অক্ষরে লিখুন'); return; }
    if (!proof.trim()) { setError('প্রমাণ ছাড়া পরিবর্তন জমা হবে না'); return; }
    if (!/^01\d{9}$/.test(form.mobile)) { setError('মোবাইল নম্বর ১১ অঙ্কের হতে হবে (01…)'); return; }
    const patch = {
      name: form.name, father: form.father, mobile: form.mobile, village: form.village,
      union: form.union, occupation: form.occupation,
    };
    const r = saveMemberChange(m!.id, patch, `${reasonPick} — ${reason}`, proof);
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <button type="button" onClick={() => navigate(`/a/members/${m.id}${roleQS}`)} className="min-h-tap inline-flex items-center gap-1.5 text-sm font-bold text-green-700">← {m.name}</button>
        <div className="flex items-start gap-2">
          <div className="grow">
            <h2 className="text-h2 text-txt">সদস্য সম্পাদনা</h2>
            <p className="text-sm text-mut">{m.name} · {m.no}</p>
          </div>
          <Button size="sm" variant="ghost" icon={<History size={15} />} onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>ইতিহাস</Button>
        </div>

        {done ? <SuccessBanner title={done}>সবকিছু অডিট লগে লেখা হয়েছে (ডেমো)।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <Note tone="warn">
          <b>সম্পাদনা মানে মুছে ফেলা নয়</b> — প্রতিটি পরিবর্তনে আগের মান, কারণ, প্রমাণ ও কে করলেন, সব অডিট লগে যায়।
        </Note>

        <SectionHead title="বদলানো যাবে" />
        <Card>
          <div className="space-y-3">
            <Field label="নাম">{(fid) => <input id={fid} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} />}</Field>
            <Field label="পিতা/স্বামীর নাম">{(fid) => <input id={fid} value={form.father} onChange={(e) => setForm({ ...form, father: e.target.value })} className={inputClass()} />}</Field>
            <Field label="মোবাইল" hint="নম্বর বদলালে পুরনো ও নতুন — দুই নম্বরে OTP (D-21)">
              {(fid) => (
                <div className="flex gap-2">
                  <input id={fid} inputMode="numeric" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })} className={inputClass() + ' grow num'} />
                  <Button size="sm" variant="secondary" icon={<Phone size={14} />} onClick={() => setReasonPick('সিম বদল')}>বদলান</Button>
                </div>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="গ্রাম">{(fid) => <input id={fid} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className={inputClass()} />}</Field>
              <Field label="ইউনিয়ন">{(fid) => <input id={fid} value={form.union} onChange={(e) => setForm({ ...form, union: e.target.value })} className={inputClass()} />}</Field>
            </div>
            <Field label="পেশা">{(fid) => <input id={fid} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputClass()} />}</Field>
          </div>
        </Card>

        <SectionHead title="বদলাতে কারণ ও প্রমাণ লাগবে" />
        <Card>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {['NID-এর সাথে মিল', 'বিবাহ/ঠিকানা বদল', 'বানান ভুল', 'সিম বদল'].map((r) => (
              <button key={r} type="button" onClick={() => setReasonPick(r)}
                className={`min-h-9 px-3 rounded-r-pill border text-sm font-bold ${reasonPick === r ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>{r}</button>
            ))}
          </div>
          <Field label="কারণ (বাধ্যতামূলক)" required hint="যা লিখবেন, তা-ই অডিট লগে যাবে">
            {(fid) => <textarea id={fid} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass() + ' py-2'} placeholder="যেমন: NID-তে “মোঃ” আছে, ব্যাংক হিসাবে মিলছিল না" />}
          </Field>
          <div className="mt-3">
            <Field label="প্রমাণ" required hint="প্রমাণ ছাড়া পরিবর্তন জমা হবে না">
              {(fid) => <input id={fid} value={proof} onChange={(e) => setProof(e.target.value)} className={inputClass()} />}
            </Field>
          </div>
        </Card>

        <SectionHead title="লকড ফিল্ড" sub="শুধু ORG_ADMIN + কারণ + অডিট লগ" />
        <Card>
          <KV k={<span className="inline-flex items-center gap-1"><Lock size={13} /> সদস্য নম্বর</span>} v={<span className="num">{m.no}</span>} />
          <KV k={<span className="inline-flex items-center gap-1"><Lock size={13} /> NID নম্বর</span>} v={<span className="num">{m.nid}</span>} />
          <KV k={<span className="inline-flex items-center gap-1"><Lock size={13} /> যোগদানের তারিখ</span>} v={m.joined} />
          <KV k={<span className="inline-flex items-center gap-1"><Lock size={13} /> নিবন্ধনকারী সমিতি</span>} v="শাপলা সমবায় সমিতি" />
          <Note tone="info">সদস্য নম্বর ও NID বদলানো মানে হিসাবের পরিচয় বদল — প্রয়োজন হলে স্থানান্তর বা সংশোধন প্রক্রিয়া ব্যবহার করুন।</Note>
        </Card>

        <SectionHead title="পরিবর্তনের ইতিহাস" sub="২টি" />
        <StackedCard tone="warn" head={<StackHead title="মোবাইল: ০১৭১১ → ০১৮১১" sub="সিম বদল · প্রমাণ: NID" right={<Badge tone="warn">অপেক্ষমাণ</Badge>} />}
          foot={<>
            <Button size="sm" variant="secondary" className="grow" icon={<Check size={14} />} onClick={() => setDone('পরিবর্তন অনুমোদিত (ডেমো)')}>অনুমোদন</Button>
            <Button size="sm" variant="danger" onClick={() => setDone('প্রত্যাখ্যাত (ডেমো)')}>বাতিল</Button>
          </>}>
          <div className="flex justify-between text-xs"><span className="text-mut">কে ও কখন</span><span className="font-bold">রাজু আহমেদ · ৩০ অক্টো</span></div>
        </StackedCard>
        <StackedCard head={<StackHead title="ঠিকানা: পূর্বপাড়া → শাপলা" sub="NID অনুযায়ী · প্রমাণ: NID" right={<Badge tone="ok">প্রযোজ্য</Badge>} />}
          foot={<Button size="sm" variant="ghost" className="grow" onClick={() => setDone('আগের মান ফিরিয়ে আনা হয়েছে — নতুন এন্ট্রি হিসেবে (ডেমো)')}>আগের মান ফিরিয়ে আনুন</Button>}>
          <div className="flex justify-between text-xs"><span className="text-mut">কে ও কখন</span><span className="font-bold">হিসাবরক্ষক শাহানা · ১২ অক্টো</span></div>
        </StackedCard>

        <Note tone="danger">
          <b>ফিরিয়ে আনা মানে নতুন এন্ট্রি</b> — পুরনো মান ফিরিয়ে আনলে ইতিহাস মুছে যায় না; নতুন পরিবর্তন হিসেবেই লগে যাবে (R-02)।
        </Note>
        <div className="flex items-center gap-2 text-xs text-mut justify-center"><ShieldAlert size={13} /> maker ≠ checker · প্রতিটি বদল অডিট লগে (R-07)</div>
      </div>

      <DecisionBar note={<span><Pencil size={13} className="inline -mt-0.5" /> জমা দিলে অনুমোদন কিউতে যাবে</span>}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>বাতিল</Button>
        <Button size="sm" icon={<Check size={15} />} onClick={save}>পরিবর্তন জমা দিন</Button>
      </DecisionBar>
    </div>
  );
}
