/* ============================================================
   src/apps/admin/screens/CashBook.tsx — AM-15 দিনশেষ ক্যাশ বুক ও দিন সমাপ্তি
   ঘোষণা বনাম গণনা, পার্থক্যের কারণ বাধ্যতামূলক, দিন বন্ধ (প্রস্তাব),
   চ্যানেল-ভিত্তিক সংগ্রহ ও ইতিহাস।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, CheckCircle2, Clock, Printer, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { cashDiff, CHANNEL_LABEL, type Channel } from '../../../domain/admin';
import { Note, Stepper } from './parts';

const REASONS = ['ভাংতি ছিল না', 'ভুল রসিদ', 'সদস্যকে বেশি ফেরত', 'এন্ট্রি বাদ পড়েছে', 'অন্যান্য'];

export default function CashBook() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, closeCashDay } = useAdmin();
  const day = state.cashDays[0];
  const [counted, setCounted] = useState<number | ''>(day.counted || day.declared);
  const [reasonPick, setReasonPick] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const diff = cashDiff({ ...day, counted: typeof counted === 'number' ? counted : 0 });

  function submit() {
    setError('');
    if (typeof counted !== 'number' || counted <= 0) { setError('গণনা করা নগদ লিখুন'); return; }
    const r = closeCashDay(counted, `${reasonPick}${reason ? ` — ${reason}` : ''}`);
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-2">
        <div className="grow">
          <h2 className="text-h2 text-txt">দিনশেষ ক্যাশ বুক</h2>
          <p className="text-sm text-mut">{day.date} · শনিবার</p>
        </div>
        <Badge tone={day.closed ? 'ok' : 'warn'}>{day.closed ? 'বন্ধ' : 'চলমান'}</Badge>
      </div>

      {done ? <SuccessBanner title={done}>দিন বন্ধ হয়েছে — চূড়ান্ত অনুমোদন ম্যানেজারের কাছে (ডেমো)।</SuccessBanner> : null}
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <Card><Stepper steps={['সংগ্রহক ঘোষণা', 'নগদ গণনা', 'পার্থক্য', 'দিন বন্ধ']} cur={day.closed ? 3 : 1} /></Card>

      <KpiGrid>
        <Kpi label="ঘোষিত সংগ্রহ" value={`৳${bn(day.declared)}`} />
        <Kpi label="গণনা করা" value={`৳${bn(typeof counted === 'number' ? counted : 0)}`} tone={diff ? 'warn' : 'ok'} />
        <Kpi label="পার্থক্য" value={`৳${bn(Math.abs(diff))}`} tone={diff ? 'danger' : 'ok'} note={diff === 0 ? 'মিলেছে ✓' : diff > 0 ? 'উদ্বৃত্ত' : 'ঘাটতি'} />
        <Kpi label="মোট এন্ট্রি" value={bn(38)} unit="টি" note="৩ জন সংগ্রহক" />
      </KpiGrid>

      <SectionHead title="চ্যানেল অনুযায়ী" sub="সব চ্যানেলের যোগফল = ঘোষিত" />
      <Card>
        {(Object.keys(day.channels) as Channel[]).map((ch) => (
          <Row key={ch} icon={<Banknote size={16} />} title={CHANNEL_LABEL[ch]} sub={`${bn(Math.round((day.channels[ch] / day.declared) * 100))}%`} right={<span className="num font-bold">৳{bn(day.channels[ch])}</span>} />
        ))}
        <Row icon={<Banknote size={16} />} title="সর্বমোট" sub="ঘোষিত" right={<span className="num font-extrabold">৳{bn(day.declared)}</span>} />
      </Card>

      <SectionHead title="নগদ গণনা" sub="সংগ্রহকের ঘোষণা মিলিয়ে দেখুন" />
      <Card>
        <Field label="গণনা করা নগদ (৳)" required hint={`ঘোষিত ৳${bn(day.declared)} — হাতে গুনে মিলিয়ে লিখুন`}>
          {(fid) => (
            <input id={fid} inputMode="numeric" value={counted}
              onChange={(e) => setCounted(e.target.value ? Number(e.target.value.replace(/\D/g, '')) : '')}
              className={inputClass() + ' num text-h2 font-extrabold text-center'} />
          )}
        </Field>
        {diff !== 0 ? (
          <Note tone={diff > 0 ? 'warn' : 'danger'}>
            <b>{diff > 0 ? 'উদ্বৃত্ত' : 'ঘাটতি'} ৳{bn(Math.abs(diff))} — ব্যাখ্যা ছাড়া দিন বন্ধ হবে না</b>
          </Note>
        ) : (
          <Note tone="ok">গণনা ও ঘোষণা মিলেছে ✓</Note>
        )}
      </Card>

      <SectionHead title="পার্থক্যের কারণ" sub="পার্থক্য থাকলে বাধ্যতামূলক" />
      <Card>
        <div className="flex flex-wrap gap-1.5">
          {REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReasonPick(r)}
              className={`min-h-tap px-3 rounded-r-pill border text-sm font-bold ${reasonPick === r ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>{r}</button>
          ))}
        </div>
        <div className="mt-3">
          <Field label="বিস্তারিত (ঐচ্ছিক)">
            {(fid) => <textarea id={fid} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass() + ' py-2'} placeholder="যেমন: ২টি ৫০০ টাকার নোট ভাংতি ছিল না" />}
          </Field>
        </div>
      </Card>

      <Note tone="warn">
        <b>দিনশেষ না করলেও পোস্টিং চলবে</b> — কিন্তু ক্যাশ মিলিয়ে দিন বন্ধ না করলে পরদিনের সমন্বয় কঠিন হয় (অডিট ফ্ল্যাগ)।
      </Note>
      <Note tone="info">
        <b>থার্মাল প্রিন্ট মোবাইলে সীমিত</b> — প্রিন্ট না হলে PDF শেয়ার করুন; উভয়ই অডিটে গ্রহণযোগ্য।
      </Note>

      <div className="flex gap-2">
        <Button className="grow" icon={<CheckCircle2 size={15} />} onClick={submit} disabled={day.closed}>দিন বন্ধ করুন</Button>
        <Button variant="secondary" icon={<Printer size={15} />} onClick={() => navigate('/a/ledger' + roleQS)}>প্রিন্ট</Button>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><Clock size={13} /> হিসাবরক্ষক প্রস্তাব করেন — চূড়ান্ত অনুমোদন ম্যানেজারের</div>

      <SectionHead title="আগের দিন" sub="ইতিহাস" />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {state.cashDays.slice(1).map((d) => (
          <Row key={d.date} icon={<TriangleAlert size={16} />} title={d.date} sub={`${d.note} · অনুমোদন ${d.approvedBy}`}
            right={<Badge tone={cashDiff(d) === 0 ? 'ok' : 'warn'}>{cashDiff(d) === 0 ? 'মিলেছে' : `পার্থক্য ৳${bn(Math.abs(cashDiff(d)))}`}</Badge>} />
        ))}
      </div>
    </div>
  );
}
