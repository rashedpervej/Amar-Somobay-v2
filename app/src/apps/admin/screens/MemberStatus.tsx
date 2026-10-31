/* ============================================================
   src/apps/admin/screens/MemberStatus.tsx — AM-18 সদস্য অবস্থা পরিবর্তন
   নতুন অবস্থা → প্রভাব → কারণ ও কমিটি নম্বর → OTP → পরিবর্তন।
   ইতিহাস মুছে যায় না; ৯০ দিনের নিয়ম স্পষ্ট।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Lock, ShieldAlert } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { MEM_STATUS, memberById, type MemStatus } from '../../../domain/admin';
import { Note, Stepper } from './parts';

const REASONS = ['বকেয়া ৯০ দিন+', 'সদস্যের অনুরোধ', 'KYC অসম্পূর্ণ', 'নিয়ম ভঙ্গ', 'অন্য সমিতিতে যোগদান'];
const CONSEQ: Record<MemStatus, string> = {
  active: 'সব সেবা চালু হবে — জমা ও উত্তোলন দুটোই সম্ভব',
  dormant: 'নতুন জমা নেওয়া যাবে, উত্তোলন আটকাবে — ৯০ দিন বকেয়ায় স্বয়ংক্রিয় (D-07)',
  suspended: 'সব লেনদেন বন্ধ — কমিটির সিদ্ধান্ত ও কারণ বাধ্যতামূলক',
  exited: 'হিসাব বন্ধ — চূড়ান্ত নিষ্পত্তি ছাড়া এই অবস্থায় যাওয়া যাবে না (BR-15)',
};

export default function MemberStatus() {
  const { memberId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, changeStatus } = useAdmin();
  const m = memberById(state.members, memberId ?? 'm1');
  const [to, setTo] = useState<MemStatus>('dormant');
  const [reasonPick, setReasonPick] = useState(REASONS[0]);
  const [detail, setDetail] = useState('');
  const [committeeNo, setCommitteeNo] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  if (!m) return <div className="p-4"><Note tone="warn">সদস্য পাওয়া যায়নি</Note></div>;

  function submit() {
    setError('');
    if (to === m!.status) { setError('বর্তমান অবস্থাই নির্বাচিত — অন্য অবস্থা বাছুন'); return; }
    if (otp.replace(/\D/g, '').length !== 6) { setError('৬ সংখ্যার OTP দিন (ডেমো: ৪৭১৯০২)'); return; }
    const r = changeStatus(m!.id, to, reasonPick, detail, committeeNo);
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <button type="button" onClick={() => navigate(`/a/members/${m.id}${roleQS}`)} className="min-h-tap inline-flex items-center gap-1.5 text-sm font-bold text-green-700">← {m.name}</button>
        <div>
          <h2 className="text-h2 text-txt">অবস্থা পরিবর্তন</h2>
          <p className="text-sm text-mut">{m.name} · {m.no}</p>
        </div>
        {done ? <SuccessBanner title={done}>পরিবর্তন অডিট লগে সংরক্ষিত (ডেমো)।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <Card><Stepper steps={['সদস্য', 'নতুন অবস্থা', 'কারণ ও প্রভাব', 'OTP ও নিশ্চিত']} cur={2} /></Card>

        <SectionHead title="নতুন অবস্থা" sub={`বর্তমান: ${MEM_STATUS[m.status].t}`} />
        <Card>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MEM_STATUS) as MemStatus[]).map((k) => (
              <button key={k} type="button" onClick={() => setTo(k)}
                className={`min-h-tap rounded-r-sm border px-3 py-2 text-sm font-bold ${to === k ? 'border-green-700 bg-green-050 text-green-800' : 'border-line bg-card text-txt-2'}`}>
                {MEM_STATUS[k].t}
              </button>
            ))}
          </div>
          <Note tone={to === 'suspended' || to === 'exited' ? 'danger' : to === 'dormant' ? 'warn' : 'info'}>
            <b>{MEM_STATUS[to].t} করলে যা বদলাবে</b> — {CONSEQ[to]}
          </Note>
          {to === 'exited' ? (
            <Note tone="danger"><b>চূড়ান্ত নিষ্পত্তি ছাড়া প্রস্থান নয়</b> — AM-11 দিয়ে ক্লিয়ারেন্স সম্পন্ন করুন, নাহলে হিসাব অমিল থাকবে।</Note>
          ) : null}
        </Card>

        <SectionHead title="কারণ ও প্রভাব" sub="কারণ লেখা বাধ্যতামূলক" />
        <Card>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReasonPick(r)}
                className={`min-h-9 px-3 rounded-r-pill border text-sm font-bold ${reasonPick === r ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>{r}</button>
            ))}
          </div>
          <div className="mt-3 space-y-3">
            <Field label="বিস্তারিত" required hint="অন্তত ৫ অক্ষর — কী দেখে সিদ্ধান্ত নিলেন">
              {(fid) => <textarea id={fid} rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} className={inputClass() + ' py-2'} />}
            </Field>
            <Field label="কমিটির সিদ্ধান্ত নম্বর" hint="স্থগিত/প্রস্থানে বাধ্যতামূলক">
              {(fid) => <input id={fid} value={committeeNo} onChange={(e) => setCommitteeNo(e.target.value)} placeholder="যেমন ০৮/২০২৬" className={inputClass() + ' num'} />}
            </Field>
            <Field label="OTP (আপনার নিবন্ধিত মোবাইলে)" required hint="ডেমো: ৪৭১৯০২">
              {(fid) => <input id={fid} inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className={inputClass() + ' num tracking-[6px] text-center font-extrabold'} />}
            </Field>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-mut mt-2"><Lock size={13} /> ইতিহাস মুছে যায় না — প্রতিটি পরিবর্তন আলাদা ঘটনা হিসেবে থাকবে</div>
        </Card>

        <Note tone="warn"><b>৯০ দিন নিয়ম</b> — বকেয়া ৯০ দিন পেরোলে সিস্টেম নিজেই dormant করে (D-07); ম্যানুয়াল পরিবর্তনে কারণ লাগবে।</Note>
        <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><ShieldAlert size={13} /> maker ≠ checker · সদস্যকে SMS জানানো হবে</div>
        <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><Clock size={13} /> এখন পর্যন্ত {bn(2)}টি অবস্থা পরিবর্তন হয়েছে</div>
      </div>

      <DecisionBar note={<span><AlertTriangle size={13} className="inline -mt-0.5" /> {m.name} → {MEM_STATUS[to].t}</span>}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>বাতিল</Button>
        <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={submit}>অবস্থা বদলান</Button>
      </DecisionBar>
    </div>
  );
}
