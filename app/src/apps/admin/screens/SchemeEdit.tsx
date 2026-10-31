/* ============================================================
   src/apps/admin/screens/SchemeEdit.tsx — AM-29 স্কিম সম্পাদনা (নতুন সংস্করণ)
   নীল হিরো · ৪ KPI · পুরনো/নতুন তুলনা টেবিল · লকড ফিল্ড ·
   সংস্করণ ইতিহাস · কমিটির সিদ্ধান্ত + তারিখ · version conflict সতর্কতা।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCheck, Eye, History, Lock, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { schemeById } from '../../../domain/adminOps';
import { Accordion, KV, Note } from './parts';

export default function SchemeEdit() {
  const { schemeId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, proposeVersion } = useAdmin();
  const s = schemeById(state.schemes, schemeId) ?? state.schemes[0];
  const [decisionNo, setDecisionNo] = useState('');
  const [effAt, setEffAt] = useState('2026-11-01');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const changed = state.sdiff.filter((d) => !d.locked && d.old !== d.neu);
  const locked = state.sdiff.filter((d) => d.locked);

  function submit() {
    setMsg(''); setErr('');
    if (effAt <= '2026-10-31') { setErr('কার্যকর তারিখ ভবিষ্যতের হতে হবে — পেছনের তারিখে নয় (R-05)'); return; }
    const r = proposeVersion(s.id, decisionNo);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(`${r.message} · কার্যকর ${effAt}`);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <div className="rounded-r-md bg-gradient-to-br from-info-ink to-info text-white px-4 py-4">
        <div className="text-xs opacity-85">{s.code} · {s.typeBn} · {bn(s.members)} জন সদস্য · ৳{bn(s.total)}</div>
        <div className="text-[21px] font-extrabold leading-tight mt-0.5">সম্পাদনা করলে নতুন সংস্করণ তৈরি হবে (D-32)</div>
        <div className="text-sm mt-2 opacity-90">বিদ্যমান অ্যাকাউন্টগুলো <b>পুরনো সংস্করণেই আটকানো</b> থাকবে — তাদের কিস্তি, নোটিশ পিরিয়ড বা ফি বদলাবে না।</div>
      </div>

      <KpiGrid>
        <Kpi label="বদলাচ্ছে" value={bn(changed.length)} tone="warn" note="ক্ষেত্র" />
        <Kpi label="লকড" value={bn(locked.length)} tone="danger" note="বদলানো যাবে না" />
        <Kpi label="বিদ্যমান অ্যাকাউন্ট" value={bn(s.members)} note="পুরনো নিয়মে চলবে" />
        <Kpi label="নতুন সংস্করণ" value={`v${bn(s.version + 1)}`} note="অনুমোদনের পরে কার্যকর" />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg}>ডেমো — নতুন সংস্করণ প্রস্তাবিত, কার্যকর নয়।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Card title="কী বদলাচ্ছে" sub={`${bn(state.sdiff.length)}টি ক্ষেত্র`}>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-mut text-left">
                <th className="py-1.5 px-1 font-bold">ক্ষেত্র</th>
                <th className="py-1.5 px-1 font-bold">পুরনো</th>
                <th className="py-1.5 px-1 font-bold">নতুন</th>
              </tr>
            </thead>
            <tbody>
              {state.sdiff.map((d) => (
                <tr key={d.f} className="border-t border-line-2 align-top">
                  <td className="py-2 px-1">
                    <span className="text-sm font-bold">{d.f}</span>
                    {d.locked ? <Badge tone="danger">লকড</Badge> : null}
                  </td>
                  <td className="py-2 px-1 num">{d.old}</td>
                  <td className="py-2 px-1">
                    {d.locked ? <span className="text-mut">বদলানো যাবে না</span>
                      : d.old === d.neu ? <span className="num text-mut">{d.neu}</span>
                        : <b className="num text-warn-ink">{d.neu}</b>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {state.sdiff.filter((d) => d.impact !== 'পরিবর্তন নেই').map((d) => (
          <p key={d.f} className="text-xs text-txt-2 border-t border-line-2 py-1.5"><b>{d.f}:</b> {d.impact}</p>
        ))}
      </Card>

      <Accordion title="সংস্করণ ইতিহাস" sub={`v${bn(s.version + 1)} প্রস্তাবিত`} defaultOpen>
        {[
          [`v${bn(s.version + 1)} · প্রস্তাবিত`, 'লক-ইন ৩ → ৬ মাস · নোটিশ ৭ → ১৫ দিন · বিলম্ব ফি ৳২০ → ৳২৫', 'আপনি (ম্যানেজার) · খসড়া', 'warn'],
          [`v${bn(s.version)} · বর্তমান`, '১ সেপ্টে ২০২৫ · লক-ইন ৩ → ৬ মাস, নোটিশ ৭ → ১৫ দিন', 'কমিটির সিদ্ধান্ত ২০২৬/১৩', 'ok'],
          [`v${bn(s.version - 1)}`, '২১ জুলাই ২০২৪ · বার্ষিক ফি ৳৩০ → ৳৫০', 'কমিটির সিদ্ধান্ত ২০২৪/০৭', 'neutral'],
          ['v১', '১৫ জানু ২০২৪ · প্রথম সংস্করণ', 'নিবন্ধনকালীন অনুমোদন', 'neutral'],
        ].map(([a, b, c, tone]) => (
          <div key={a} className="flex items-start gap-2 py-2 border-b border-line-2 last:border-b-0">
            <History size={15} className="mt-0.5 text-mut shrink-0" />
            <div className="grow">
              <b className="num text-sm block">{a}</b>
              <div className="text-xs">{b}</div>
              <div className="text-xs text-mut">{c}</div>
            </div>
            <Badge tone={tone as 'warn' | 'ok' | 'neutral'}>{tone === 'warn' ? 'খসড়া' : tone === 'ok' ? 'চালু' : 'পুরনো'}</Badge>
          </div>
        ))}
        <p className="text-xs text-mut mt-2">পুরনো সংস্করণ কখনো মুছে ফেলা হয় না — প্রতিটি অ্যাকাউন্ট যে সংস্করণে খুলেছিল, সেই নিয়মেই চলবে (D-32)।</p>
      </Accordion>

      <Note tone="danger"><><TriangleAlert size={14} className="inline -mt-0.5 mr-1" /><b>Version conflict — আপনার সংস্করণ পুরনো হয়ে গেছে</b> — কাজী নুরুন্নবী ১২ মিনিট আগে v{bn(s.version + 1)} সংরক্ষণ করেছেন (লক-ইন ৬ → ৯ মাস)। আপনার পরিবর্তন তার উপরে বসবে — আগে তুলনা দেখে নিন। কনফ্লিক্ট কখনো নীরবে সমাধান হয় না।</></Note>

      <Card title="লকড ফিল্ডের নিয়ম" sub="চালু স্কিমে">
        {[
          ['কিস্তির পরিমাণ', 'বিদ্যমান সদস্যের প্রতিশ্রুতি বদলে যায়'],
          ['স্কিমের ধরন', 'লেজারের সময়সূচি সম্পূর্ণ বদলে যায়'],
          ['স্কিম কোড', 'রসিদ ও অ্যাকাউন্ট নম্বরে ব্যবহৃত'],
          ['সুদের হার', 'ক্ষেত্রটি ডেটা মডেলেই নেই (BR-13)'],
        ].map(([a, b]) => (
          <div key={a} className="flex items-start gap-2 py-1.5">
            <Lock size={14} className="mt-0.5 text-danger-ink shrink-0" />
            <div>
              <div className="text-sm font-bold">{a}</div>
              <div className="text-xs text-mut">{b}</div>
            </div>
          </div>
        ))}
        <Note tone="info">বদলাতেই হলে নতুন স্কিম তৈরি করে পুরনোটি “নতুন নামভর্তি বন্ধ” করুন (AM-28 → AM-27)।</Note>
      </Card>

      <Card title="অনুমোদনের জন্য যা লাগবে" sub="৫টি শর্ত">
        <KV k="কমিটির লিখিত সিদ্ধান্ত" v="ডিফল্ট থেকে সরে যাওয়া প্রতিটি নিয়মে বাধ্যতামূলক" />
        <KV k="প্রভাব বিশ্লেষণ" v={`${bn(s.members)} জন বিদ্যমান সদস্য — কেউ প্রভাবিত হবে না`} />
        <KV k="সদস্যের সম্মতি" v="নিয়ম বদলালে সম্মতি ও সংস্করণ লগ (D-23)" />
        <KV k="কার্যকর হওয়ার তারিখ" v="অনুমোদনের পরের দিন থেকে (R-05)" />
        <KV k="পরিবর্তনের লগ" v="অডিট লগে before/after সহ" />
        <Field label="কমিটির সিদ্ধান্ত নম্বর" required hint="না দিলে সংরক্ষণ হবে না">
          {(fid) => <input id={fid} value={decisionNo} onChange={(e) => setDecisionNo(e.target.value)} className={inputClass()} placeholder="২০২৬/১১" />}
        </Field>
        <Field label="কার্যকর হওয়ার তারিখ">
          {(fid) => <input id={fid} type="date" value={effAt} onChange={(e) => setEffAt(e.target.value)} className={inputClass()} />}
        </Field>
      </Card>

      <Note tone="warn"><><b>বিলম্ব ফি ৳২০ → ৳২৫</b> — এটি D-08 ডিফল্ট থেকে সরে যাওয়া, তাই কমিটির সিদ্ধান্ত বাধ্যতামূলক; বিলম্ব ফি নির্ধারিত ফি, <b>সুদ নয়</b>; বার্ষিক সীমা ৳২০০ অটুট।</></Note>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" onClick={() => navigate(`/a/schemes/${s.id}${roleQS}`)}>বাতিল</Button>
        <Button variant="secondary" className="grow" icon={<Eye size={15} />} onClick={() => navigate(`/a/schemes/${s.id}${roleQS}`)}>প্রিভিউ</Button>
        <Button className="grow" icon={<CheckCheck size={15} />} onClick={submit} disabled={s.status === 'pending'}>
          {s.status === 'pending' ? 'আগেরটি অপেক্ষমাণ' : 'সংস্করণ জমা'}
        </Button>
      </div>
      <SectionHead title="প্রভাব" sub={`${bn(changed.length)} বদলাচ্ছে · ${bn(locked.length)} লকড`} />
      <p className="text-sm text-txt-2">বিদ্যমান {bn(s.members)} জন অ্যাকাউন্ট অপরিবর্তিত থাকবে (D-32) · নতুন সংস্করণ কার্যকর হবে {effAt} থেকে।</p>
    </div>
  );
}
