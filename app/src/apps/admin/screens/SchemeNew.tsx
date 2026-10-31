/* ============================================================
   src/apps/admin/screens/SchemeNew.tsx — AM-28 স্কিম তৈরি (মোবাইল উইজার্ড)
   ৪ ধাপ · প্রতিটি ধাপে ইনলাইন যাচাই · স্বয়ংক্রিয় চেক তালিকা ·
   সদস্য-প্রিভিউ · কমিটির সিদ্ধান্ত ছাড়া চালু নয় (D-34)।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Eye, Sparkles, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Accordion, KV, Note, Stepper } from './parts';

const STEPS = ['ধরন ও নাম', 'জমার নিয়ম', 'মেয়াদ ও উত্তোলন', 'পর্যালোচনা ও অনুমোদন'];

export default function SchemeNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, createScheme } = useAdmin();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('MS-05');
  const [name, setName] = useState('পল্লী সঞ্চয়');
  const [typeBn, setTypeBn] = useState<'মাসিক' | 'দৈনিক'>('মাসিক');
  const [installment, setInstallment] = useState('1000');
  const [tenure, setTenure] = useState<number | null>(36);
  const [minBalance, setMinBalance] = useState('5000');
  const [decisionNo, setDecisionNo] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const inst = Number(installment) || 0;
  const minBal = Number(minBalance) || 0;
  const dup = state.schemes.some((s) => s.code === code.trim());
  const checks = [
    { t: 'মেয়াদ সীমার মধ্যে', d: tenure === null ? 'চলমান — মেয়াদ নেই' : `${bn(tenure)} মাস ≤ সর্বোচ্চ ৬০ মাস`, ok: tenure === null || (tenure >= 3 && tenure <= 60) },
    { t: 'সর্বনিম্ন ব্যালেন্স', d: `৳${bn(minBal)} — নীতিসীমা ৳৫,০০০-এর নিচে`, ok: minBal <= 5000 },
    { t: 'কিস্তির অঙ্ক', d: `৳${bn(inst)} — সর্বনিম্ন ৳১০`, ok: inst >= 10 },
    { t: 'সুদ/মুনাফার কোনো ক্ষেত্র নেই', d: 'ফর্মেই নেই — যোগ করা যাবে না (BR-13)', ok: true },
    { t: 'একই কোড আগে ব্যবহৃত হয়নি', d: dup ? `${code} আগেই আছে — ইনলাইন ত্রুটি` : `${code} নতুন`, ok: !dup },
  ];
  const bad = checks.filter((c) => !c.ok);

  function next() {
    setMsg(''); setErr('');
    if (step < 3) {
      if (step === 2 && bad.length) { setErr(`এই ধাপে ${bn(bad.length)}টি ত্রুটি — ঠিক না করে পরের ধাপে যাওয়া যাবে না`); return; }
      setStep((s) => Math.min(3, s + 1));
      return;
    }
    if (decisionNo.trim().length < 4) { setErr('কমিটির সিদ্ধান্ত নম্বর ছাড়া স্কিম চালু হবে না (D-34)'); return; }
    const r = createScheme({ code, name, typeBn, installment: inst, tenure, minBalance: minBal }, decisionNo);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Card>
        <Stepper steps={STEPS} cur={step} />
        <p className="text-xs text-mut mt-2">ধাপ {bn(step + 1)} / {bn(STEPS.length)} · খসড়া স্বয়ংক্রিয়ভাবে সংরক্ষিত</p>
      </Card>

      {msg ? <SuccessBanner title={msg}>ডেমো — কোনো বাস্তব স্কিম তৈরি হয়নি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Note tone="info"><><Sparkles size={14} className="inline -mt-0.5 mr-1" /><b>প্রতিটি ক্ষেত্রে ডিফল্ট মান আগে থেকে বসানো</b> — প্রতিটি ডিফল্টের পাশে D-কোড দেখানো হয়, যাতে অনুমান অদৃশ্য না থাকে। বদলালে নতুন সিদ্ধান্ত হিসেবে লগে যাবে।</></Note>

      {step === 0 ? (
        <Card title="ধাপ ১ · ধরন ও নাম" sub="কোড অনন্য হতে হবে">
          <Field label="স্কিমের ধরন" required>
            {() => <Chipset>{(['মাসিক', 'দৈনিক'] as const).map((t) => <Chip key={t} active={typeBn === t} onClick={() => setTypeBn(t)}>{t}</Chip>)}</Chipset>}
          </Field>
          <Field label="স্কিমের নাম" required>
            {(fid) => <input id={fid} value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} placeholder="যেমন: পল্লী সঞ্চয়" />}
          </Field>
          <Field label="কোড" required hint="ছাঁচ: MS-05">
            {(fid) => <input id={fid} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputClass(dup ? 'কোড আগেই ব্যবহৃত' : undefined)} />}
          </Field>
          {dup ? <p className="text-xs text-danger-ink mt-1">‘{code}’ কোড আগেই আছে — রসিদ ও অ্যাকাউন্ট নম্বরে সংঘর্ষ হবে</p> : null}
        </Card>
      ) : null}

      {step === 1 ? (
        <Card title="ধাপ ২ · জমার নিয়ম" sub="কিস্তি ও সীমা">
          <Field label="কিস্তির পরিমাণ (৳)" required hint="সর্বনিম্ন ৳১০">
            {(fid) => <input id={fid} inputMode="numeric" value={installment} onChange={(e) => setInstallment(e.target.value.replace(/\D/g, ''))} className={inputClass()} />}
          </Field>
          <Field label="অতিরিক্ত জমা" hint="D-03">
            {() => <Chipset><Chip active>নিষেধ</Chip><Chip>অনুমোদিত</Chip></Chipset>}
          </Field>
          <Field label="সর্বনিম্ন ব্যালেন্স (৳)" required hint="সর্বোচ্চ ৳৫,০০০ — নীতিসীমা">
            {(fid) => <input id={fid} inputMode="numeric" value={minBalance} onChange={(e) => setMinBalance(e.target.value.replace(/\D/g, ''))} className={inputClass(minBal > 5000 ? 'সর্বনিম্ন ৳৫,০০০-এর বেশি নয়' : undefined)} />}
          </Field>
          {minBal > 5000 ? <p className="text-xs text-danger-ink mt-1">সর্বনিম্ন ব্যালেন্স ৳৫,০০০-এর বেশি হতে পারবে না — গ্রামীণ সদস্যের জন্য অসুবিধা হবে।</p> : null}
          <Note tone="warn">শতকরা হারে ফি দেওয়ার সুযোগ নেই — এটি সুদ-সদৃশ হতে পারে, তাই BR-13 অনুযায়ী বন্ধ।</Note>
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card title="ধাপ ৩ · মেয়াদ ও উত্তোলন" sub={bad.length ? `${bn(bad.length)}টি ত্রুটি` : 'সব যাচাই ঠিক'}>
            <Field label="মেয়াদ" required>
              {() => <Chipset>{[null, 12, 24, 36, 60].map((t) => (
                <Chip key={String(t)} active={tenure === t} onClick={() => setTenure(t)}>{t === null ? 'চলমান' : `${bn(t)} মাস`}</Chip>
              ))}</Chipset>}
            </Field>
            <div className="mt-2">
              <KV k="লক-ইন" v="৬ মাস (D-02 ডিফল্ট)" />
              <KV k="নোটিশ পিরিয়ড" v="১৫ দিন — D-02 ডিফল্ট ৭ দিনের বেশি" />
              <KV k="মাসে সর্বোচ্চ উত্তোলন" v="২ বার" />
              <KV k="একবারে সর্বোচ্চ" v="৳৫০,০০০" />
              <KV k="মেয়াদ পূর্ণ হলে" v="অবস্থা ‘মেয়াদ পূর্ণ’ — জমা ও উত্তোলন চলবে (D-06)" />
            </div>
          </Card>
          <Card title="এই ধাপের স্বয়ংক্রিয় যাচাই" right={<Badge tone={bad.length ? 'danger' : 'ok'}>{bad.length ? `${bn(bad.length)} ত্রুটি` : 'সব ঠিক'}</Badge>}>
            <div className="space-y-1.5">
              {checks.map((c) => (
                <div key={c.t} className="flex items-start gap-2 py-1">
                  {c.ok ? <Check size={15} className="text-ok-ink mt-0.5 shrink-0" /> : <TriangleAlert size={15} className="text-danger-ink mt-0.5 shrink-0" />}
                  <div>
                    <div className="text-sm font-bold">{c.t}</div>
                    <div className="text-xs text-mut">{c.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Card title="ধাপ ৪ · পর্যালোচনা ও অনুমোদন" sub="সরাসরি চালু হবে না">
            <KV k="কোড / নাম" v={`${code} · ${name}`} />
            <KV k="ধরন" v={typeBn} />
            <KV k="কিস্তি" v={`৳${bn(inst)}`} />
            <KV k="মেয়াদ" v={tenure ? `${bn(tenure)} মাস` : 'চলমান'} />
            <KV k="সর্বনিম্ন ব্যালেন্স" v={`৳${bn(minBal)}`} />
            <KV k="সুদ / মুনাফা" v={<b>৳০ — ক্ষেত্র নেই</b>} strong />
            <Field label="কমিটির সিদ্ধান্ত নম্বর" required hint="না দিলে সংরক্ষণ হবে না">
              {(fid) => <input id={fid} value={decisionNo} onChange={(e) => setDecisionNo(e.target.value)} className={inputClass()} placeholder="২০২৬/১১" />}
            </Field>
          </Card>
          <Card title="সদস্য যা দেখবে" sub="লাইভ প্রিভিউ · M-02/M-03" right={<Badge tone="info">প্রিভিউ</Badge>}>
            <div className="rounded-r-md overflow-hidden border border-line">
              <div className="bg-gradient-to-br from-green-800 to-green-600 text-white px-3.5 py-3">
                <b className="text-[15px]">{name}</b>
                <div className="text-xs opacity-85">{code} · {typeBn} · ০ জন সদস্য</div>
              </div>
              <div className="px-3.5 py-3">
                <KV k="প্রতি কিস্তি" v={`৳${bn(inst)}`} />
                <KV k="মোট সম্ভাব্য" v={`৳${bn(inst * (tenure ?? 0))}`} />
                <KV k="লক-ইন" v="৬ মাস" />
                <KV k="নোটিশ" v="১৫ দিন" />
                <p className="text-xs text-mut mt-2">প্রথম ৬ মাস তোলা যাবে না · মাসে ২ বার · সর্বনিম্ন ৳{bn(minBal)} থাকবে</p>
              </div>
            </div>
          </Card>
          <Note tone="warn"><><b>সরাসরি চালু হবে না</b> — উইজার্ড শেষ হলে স্কিম <b>খসড়া → অনুমোদনের অপেক্ষায়</b> যাবে; কমিটির লিখিত সিদ্ধান্ত নম্বর ছাড়া নামভর্তি খুলবে না (D-34)।</></Note>
        </>
      ) : null}

      <Accordion title="ধাপগুলোর সারাংশ" sub="যা এখনো ভরা হয়েছে">
        {[
          ['ধাপ ১ · মৌলিক তথ্য', `${name} · কোড ${code} · ধরন ${typeBn}`, !dup],
          ['ধাপ ২ · জমার নিয়ম', `কিস্তি ৳${bn(inst)} · সর্বনিম্ন ৳${bn(minBal)}`, inst >= 10 && minBal <= 5000],
          ['ধাপ ৩ · মেয়াদ ও উত্তোলন', tenure ? `${bn(tenure)} মাস · লক-ইন ৬ · নোটিশ ১৫ দিন` : 'চলমান মেয়াদ', true],
          ['ধাপ ৪ · পর্যালোচনা ও অনুমোদন', decisionNo ? `সিদ্ধান্ত ${decisionNo}` : 'কমিটির সিদ্ধান্ত বাকি', decisionNo.length >= 4],
        ].map(([a, b, ok]) => (
          <div key={String(a)} className="flex items-start gap-2 py-1.5 border-b border-line-2 last:border-b-0">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-ok' : 'bg-warn'}`} />
            <div className="grow">
              <div className="text-sm font-bold">{a}</div>
              <div className="text-xs text-mut">{b}</div>
            </div>
            <Badge tone={ok ? 'ok' : 'warn'}>{ok ? 'সম্পন্ন' : 'বাকি'}</Badge>
          </div>
        ))}
      </Accordion>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<ChevronLeft size={15} />} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>পেছনে</Button>
        <Button variant="secondary" className="grow" onClick={() => setMsg('খসড়া সংরক্ষিত (ডেমো)')}>খসড়া সংরক্ষণ</Button>
        <Button className="grow" disabled={step === 3 && (bad.length > 0 || decisionNo.trim().length < 4)} onClick={next}>
          {step === 3 ? 'অনুমোদনে পাঠান' : 'পরবর্তী ধাপ'} <ChevronRight size={15} />
        </Button>
      </div>
      <Button variant="ghost" className="w-full" icon={<Eye size={15} />} onClick={() => setMsg('প্রিভিউ — উপরের সদস্য-দৃশ্য দেখুন (ডেমো)')}>প্রিভিউ</Button>

      <SectionHead title="নীতি" sub="D-34 · D-06 · BR-13" />
      <p className="text-sm text-txt-2">উইজার্ডে কোনো সুদের ক্ষেত্র নেই; মেয়াদ পূর্ণ হলে স্বয়ংক্রিয় নিষ্পত্তি নয় — জমা ও উত্তোলন চলবে।</p>
      <div className="flex gap-2">
        <Button variant="ghost" className="grow" onClick={() => navigate(`/a/schemes${roleQS}`)}>স্কিম তালিকা</Button>
        <Button variant="ghost" className="grow" onClick={() => navigate(`/a/settings${roleQS}`)}>সেটিংস</Button>
      </div>
    </div>
  );
}
