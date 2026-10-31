/* ============================================================
   src/apps/admin/screens/CloseSettlement.tsx — AM-11 প্রস্থান ও চূড়ান্ত নিষ্পত্তি
   ক্লিয়ারেন্স চেক → নিষ্পত্তি প্রিভিউ → মওকুফ নম্বর → মাধ্যম → OTP →
   অ্যাকাউন্ট বন্ধ, সদস্য Exited, সনদ।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileText, Heart, Lock, ShieldCheck, X } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountsOf, CHANNEL_LABEL, dueTotal, memberById, type Channel } from '../../../domain/admin';
import { KV, Note, Stepper } from './parts';

const CH: Channel[] = ['cash', 'bank', 'bkash'];

export default function CloseSettlement() {
  const { memberId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, closeAccount } = useAdmin();
  const m = memberById(state.members, memberId ?? 'm1');
  const accs = accountsOf(state.accounts, m?.id ?? '');
  const acc = accs[0];
  const [waiver, setWaiver] = useState('');
  const [method, setMethod] = useState<Channel>('cash');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ message: string; payable: number } | null>(null);
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  if (!m || !acc) {
    return <div className="p-4 space-y-3"><Note tone="warn">সদস্য বা অ্যাকাউন্ট পাওয়া যায়নি</Note><Button onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য তালিকা</Button></div>;
  }

  const dues = dueTotal(state.dues, m.id);
  const fee = 0;
  const net = acc.posted - dues - fee;
  const payable = Math.max(0, net);
  const checks = [
    { ok: true, t: 'কোনো চলমান উত্তোলন আবেদন নেই', d: 'সব আবেদন নিষ্পত্তি হয়েছে' },
    { ok: dues === 0 || Boolean(waiver.trim()), t: 'বকেয়া কিস্তি শূন্য বা মওকুফ', d: dues ? `৳${bn(dues)} বকেয়া — কমিটির নম্বর দিন` : 'বকেয়া নেই ✓' },
    { ok: true, t: 'নমিনি তথ্য সম্পূর্ণ', d: 'NID সংযুক্ত' },
    { ok: true, t: 'KYC যাচাইকৃত', d: 'সব ডকুমেন্ট ঠিক' },
  ];
  const fails = checks.filter((c) => !c.ok);

  function submit() {
    setError('');
    if (otp.replace(/\D/g, '').length !== 6) { setError('৬ সংখ্যার OTP দিন (ডেমো: ৪৭১৯০২)'); return; }
    const r = closeAccount({ accountId: acc!.id, waiverNo: waiver, method });
    if (!r.ok) { setError(r.message); return; }
    setDone({ message: r.message, payable: r.payable ?? payable });
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <button type="button" onClick={() => navigate(`/a/members/${m.id}${roleQS}`)} className="min-h-tap inline-flex items-center gap-1.5 text-sm font-bold text-green-700">← {m.name}</button>
        {done ? (
          <>
            <SuccessBanner title="নিষ্পত্তি সম্পন্ন">৳{bn(done.payable)} প্রদেয় · {CHANNEL_LABEL[method]} · সনদ তৈরি (ডেমো)</SuccessBanner>
            <Card title="ক্লিয়ারেন্স সনদ" sub="যাচাই কোড সহ">
              <KV k="সদস্য" v={`${m.name} · ${m.no}`} />
              <KV k="প্রদেয়" v={`৳${bn(done.payable)}`} />
              <KV k="মাধ্যম" v={CHANNEL_LABEL[method]} />
              <KV k="অবস্থা" v="অ্যাকাউন্ট বন্ধ · সদস্য প্রস্থান" />
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" className="grow" icon={<FileText size={14} />} onClick={() => navigate('/verify')}>যাচাই</Button>
                <Button size="sm" className="grow" onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য তালিকা</Button>
              </div>
            </Card>
            <Note tone="info">মুছে ফেলা নয় — বন্ধ হওয়ার পরেও লেনদেনের ইতিহাস ও রসিদ দেখা যাবে; ভুল হলে রিভার্সাল করা যাবে।</Note>
          </>
        ) : (
          <>
            <h2 className="text-h2 text-txt">প্রস্থান ও নিষ্পত্তি</h2>
            <p className="text-sm text-mut">{m.name} · {acc.scheme}</p>
            <Card><Stepper steps={['ক্লিয়ারেন্স', 'প্রিভিউ ও OTP', 'পেমেন্ট ও সনদ']} cur={0} /></Card>
            {error ? <ErrorBanner>{error}</ErrorBanner> : null}

            <SectionHead title="ক্লিয়ারেন্স চেক" sub={`${bn(checks.length - fails.length)}/${bn(checks.length)}টি ঠিক আছে`} />
            <Card>
              {checks.map((c) => (
                <Row key={c.t} icon={c.ok ? <CheckCircle2 size={16} /> : <X size={16} />} title={c.t} sub={c.d} tone={c.ok ? undefined : 'danger'} />
              ))}
            </Card>
            {fails.length ? (
              <Note tone="danger"><b>{bn(fails.length)}টি সমস্যা নিষ্পত্তি না হলে বন্ধ করা যাবে না</b> — বিকল্প: কমিটির লিখিত সিদ্ধান্ত দিয়ে মওকুফ (D-09)।</Note>
            ) : null}

            <SectionHead title="চূড়ান্ত নিষ্পত্তি প্রিভিউ" sub="সদস্য ঠিক কত পাবেন — আগেই" />
            <Card>
              <KV k="জমা হয়েছে (posted)" v={<span className="text-ok-ink">৳{bn(acc.posted)}</span>} />
              <KV k="− বকেয়া কিস্তি" v={<span className={dues ? 'text-danger-ink' : ''}>৳{bn(dues)}</span>} />
              <KV k="− বিলম্ব ফি (সুদ নয়)" v="৳০" />
              <KV k="− বন্ধ করার চার্জ" v="৳০" />
              <KV k="= হিসাব অনুযায়ী" v={`৳${bn(net)}`} />
              <KV k="= সদস্যকে প্রদেয়" v={<span className="text-ok-ink text-lg">৳{bn(payable)}</span>} strong />
              {net < 0 ? (
                <Note tone="warn"><b>প্রদেয় ৳০-তে নামানো হয়েছে (D-19)</b> — সমিতির পাওনা বেশি, কিন্তু সমিতি সদস্যের কাছে দাবি করবে না; এই ছাড় কমিটির সিদ্ধান্ত ও অডিট লগে রেকর্ড হবে।</Note>
              ) : null}
            </Card>

            <SectionHead title="মওকুফ (waiver)" sub="D-09 · শুধু লিখিত সিদ্ধান্তসহ" />
            <Card>
              <Field label="কমিটির সিদ্ধান্ত নম্বর" hint="বকেয়া থাকলে বাধ্যতামূলক — দিলে নিরীক্ষককে অ্যালার্ট যাবে">
                {(fid) => <input id={fid} value={waiver} onChange={(e) => setWaiver(e.target.value)} placeholder="যেমন ০৭/২০২৬" className={inputClass() + ' num'} />}
              </Field>
            </Card>

            <SectionHead title="পেমেন্ট ও সনদ" />
            <Card>
              <div className="grid gap-2">
                {CH.map((c) => (
                  <button key={c} type="button" onClick={() => setMethod(c)}
                    className={`min-h-tap rounded-r-sm border px-3 py-2 text-left ${method === c ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}>
                    <span className="block text-sm font-bold text-txt">{CHANNEL_LABEL[c]}</span>
                    <span className="block text-xs text-mut">{c === 'cash' ? 'তাৎক্ষণিক · স্বাক্ষর ও রসিদ' : c === 'bank' ? 'BEFTN · পরবর্তী কার্যদিবস' : 'যাচাইকৃত মোবাইলে · ট্রানজেকশন আইডি সংরক্ষিত'}</span>
                  </button>
                ))}
              </div>
              <KV k="maker ≠ checker (BR-04)" v="প্রস্তাব: হিসাবরক্ষক · অনুমোদন: ম্যানেজার" />
              <KV k="প্রদানের পর" v="অ্যাকাউন্ট Closed → সদস্য Exited → ৮ বছর আর্কাইভ (D-30)" />
            </Card>

            <Note tone="danger"><b>চলমান উত্তোলন আবেদন থাকলে</b> — নিষ্পত্তি না হওয়া পর্যন্ত প্রস্থান আটকাবে; একই টাকা দুইবার দেওয়ার ঝুঁকি এড়ানো হয়।</Note>
            <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><Heart size={13} /> মৃত্যু দাবি হলে ভিন্ন পথ — AM-19 ব্যবহার করুন</div>
            <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><ShieldCheck size={13} /> OTP ছাড়া প্রস্থান সম্পন্ন হবে না (BR-15)</div>
          </>
        )}
      </div>

      {!done ? (
        <DecisionBar note={<span><Lock size={13} className="inline -mt-0.5" /> OTP যাচাই · প্রদেয় ৳{bn(payable)}</span>}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>বাতিল</Button>
          <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={submit}>নিষ্পত্তি নিশ্চিত</Button>
        </DecisionBar>
      ) : null}

      {!done ? (
        <div className="p-4 pt-0">
          <Card title="OTP যাচাই" sub="সদস্যের মোবাইলে পাঠানো কোড (ডেমো: ৪৭১৯০২)">
            <Field label="OTP" required>
              {(fid) => <input id={fid} inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className={inputClass() + ' num tracking-[8px] text-center font-extrabold'} />}
            </Field>
          </Card>
        </div>
      ) : null}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 text-xs text-mut"><AlertTriangle size={13} /> নিষ্পত্তি অপরিবর্তনীয় — সংশোধন করতে হলে রিভার্সাল লাগবে</div>
        <div className="mt-1"><Badge tone="neutral">ডেমো ডেটা</Badge></div>
      </div>
    </div>
  );
}
