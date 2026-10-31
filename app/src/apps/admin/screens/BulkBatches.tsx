/* ============================================================
   src/apps/admin/screens/BulkBatches.tsx — AM-22 বাল্ক জমা / কিস্তি এন্ট্রি
   ধাপ ২/৪ · KPI · চলমান যাচাই · প্রতিটি ব্যাচের কার্ড (পোস্ট অ্যাকশন) ·
   যাচাই-নিয়ম · অফলাইন নোট।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCheck, Download, FileSpreadsheet, Pencil, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { BATCH_STATUS, batchTotals } from '../../../domain/adminOps';
import { Accordion, KV, Note, Progress, StackedCard, StackHead, Stepper } from './parts';

export default function BulkBatches() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, postBatch } = useAdmin();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const t = batchTotals(state.batches);
  const running = state.batches.find((b) => b.status === 'validating');

  function post(id: string) {
    setMsg(''); setErr('');
    const r = postBatch(id);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <b className="text-sm">ব্যাচের ধাপ</b>
          <Badge tone="info">ধাপ ২/৪</Badge>
        </div>
        <Stepper steps={['তালিকা তৈরি', 'যাচাই', 'পোস্ট', 'রসিদ ও নোটিফিকেশন']} cur={1} />
      </Card>

      <KpiGrid>
        <Kpi label="বৈধ সারি" value={bn(t.valid)} tone="ok" note={`${bn(t.rows - t.valid)}টি ত্রুটি`} />
        <Kpi label="মোট অঙ্ক" value={`৳${bn(t.amount)}`} note="সব ব্যাচ মিলিয়ে" />
        <Kpi label="ডুপ্লিকেট" value={bn(t.dup)} tone="warn" note="আটকানো হয়েছে" />
        <Kpi label="যাচাই চলছে" value={running ? `${bn(running.progress)}%` : '—'} tone={running ? 'warn' : 'ok'} note={running ? running.no : 'কিছু নেই'} />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg}>ডেমো — লেজার বদলায়নি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {running ? (
        <Card title={`${running.no} · যাচাই চলছে`} right={<Badge tone="info">{bn(running.progress)}%</Badge>}>
          <Progress pct={running.progress} tone="warn" />
          <p className="text-xs text-mut mt-2">{bn(running.rows)} সারি · {running.by} · রুট {running.route}</p>
          <Note tone="info">বড় ব্যাচ ব্যাকগ্রাউন্ডে চলে — ফোন বন্ধ করলেও যাচাই থামবে না, শেষ হলে নোটিফিকেশন আসবে।</Note>
        </Card>
      ) : null}

      {state.batches.map((b) => (
        <StackedCard key={b.id} tone={b.status === 'posted' ? 'ok' : b.status === 'partial' ? 'warn' : b.status === 'failed' ? 'bad' : ''}
          head={<StackHead title={b.no} sub={`${b.by} · ${b.route} · ${b.at}`}
            right={<Badge tone={BATCH_STATUS[b.status].tone}>{BATCH_STATUS[b.status].t}</Badge>} />}>
          <div className="flex items-end justify-between mb-1">
            <div>
              <div className="text-xs text-mut">ব্যাচের অঙ্ক</div>
              <div className="num text-h3 font-extrabold">৳{bn(b.amount)}</div>
            </div>
            <div className="text-xs text-mut text-right">{bn(b.valid)}/{bn(b.rows)} সারি বৈধ</div>
          </div>
          <KV k="লেজার এন্ট্রি" v={b.txn ? b.txn : 'বাকি — পোস্টের পরে বসবে'} />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {b.dup ? <Badge tone="warn">{bn(b.dup)}টি ডুপ্লিকেট</Badge> : <Badge tone="ok">ডুপ্লিকেট নেই</Badge>}
            <Badge tone="neutral">{b.route}</Badge>
          </div>
          {b.errors.length ? (
            <div className="mt-2 rounded-r-sm bg-danger-bg border border-danger-bd p-2 space-y-1">
              {b.errors.map((e) => <div key={e.r} className="text-xs text-danger-ink">সারি {bn(e.r)} · {e.why}</div>)}
            </div>
          ) : null}
          <div className="flex gap-2 mt-2.5">
            {b.status === 'posted' ? (
              <>
                <Button size="sm" variant="ghost" className="grow" onClick={() => setMsg(`${b.no} · ${bn(b.valid)} সারি (ডেমো)`)}>সারি দেখুন</Button>
                <Button size="sm" variant="secondary" className="grow" icon={<Download size={14} />} onClick={() => setMsg(`রসিদ ${b.no} ডাউনলোড প্রস্তুত (ডেমো)`)}>রসিদ</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setMsg('ত্রুটিপূর্ণ সারি সংশোধনের পর্দা পরের ধাপে (ডেমো)')}>সংশোধন</Button>
                <Button size="sm" variant="secondary" className="grow" icon={<CheckCheck size={14} />} disabled={b.status === 'validating'} onClick={() => post(b.id)}>
                  {bn(b.valid)}টি সারি পোস্ট
                </Button>
              </>
            )}
          </div>
        </StackedCard>
      ))}

      <Accordion title="ব্যাচ পোস্টের আগে যাচাই" sub="৫টি স্বয়ংক্রিয় পরীক্ষা" defaultOpen>
        <div className="space-y-1.5">
          {[
            ['প্রতিটি সারিতে idempotency key', 'একই সারি দুবার পোস্ট হবে না', true],
            ['ডুপ্লিকেট চেক (সদস্য + অঙ্ক + তারিখ)', `${bn(t.dup)}টি আটকানো হয়েছে`, true],
            ['স্কিমের সীমা ও কিস্তির নিয়ম', 'সর্বোচ্চ অঙ্ক/মাসিক সংখ্যা যাচাই হয়েছে', true],
            ['পিরিয়ড খোলা আছে কি না', 'লকড মাসে ব্যাচ পোস্ট হবে না (R-05)', true],
            ['এন্ট্রিকারী ≠ অনুমোদনকারী', 'বাল্ক এন্ট্রিতেও BR-04 প্রযোজ্য', false],
          ].map(([a, b, ok]) => (
            <div key={String(a)} className="flex items-start gap-2 py-1.5">
              <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-ok' : 'bg-warn'}`} />
              <div>
                <div className="text-sm font-bold">{a}</div>
                <div className="text-xs text-mut">{b}</div>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Note tone="warn"><><WifiOff size={14} className="inline -mt-0.5 mr-1" /><b>মাঠ থেকে অফলাইনে ব্যাচ</b> — সংগ্রহক সংযোগ ছাড়াই কাগজের খাতার তালিকা তুলতে পারেন; sync-এর পরে আবার যাচাই হয় (D-18)।</></Note>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<FileSpreadsheet size={15} />} onClick={() => navigate(`/a/import${roleQS}`)}>CSV ইমপোর্ট</Button>
        <Button variant="secondary" className="grow" icon={<Plus size={15} />} onClick={() => navigate(`/a/entry${roleQS}`)}>একক এন্ট্রি</Button>
        <Button className="grow" onClick={() => setMsg('সব বৈধ সারি পোস্ট হয়েছে (ডেমো)')}>বৈধ সারি পোস্ট</Button>
      </div>
      <SectionHead title="নতুন ব্যাচ" sub="একটি ব্যাচে সর্বোচ্চ ৫০০ সারি" />
      <Button className="w-full" icon={<Plus size={16} />} onClick={() => setMsg('নতুন ব্যাচ তৈরি — এখানে ফাইল/সারি যোগ করুন (ডেমো)')}>নতুন ব্যাচ শুরু করুন</Button>
      <Note tone="info"><><RefreshCw size={14} className="inline -mt-0.5 mr-1" />ত্রুটিপূর্ণ সারি কখনো আংশিকভাবে পোস্ট হয় না — বাদ দিয়ে আলাদা ব্যাচে ঠিক করতে হয়।</></Note>
    </div>
  );
}
