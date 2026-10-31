/* ============================================================
   src/apps/admin/screens/ImportCsv.tsx — AM-23 বাল্ক ইমপোর্ট ও ম্যাপিং
   ধাপ ৩/৫ · ফাইল বাছাই → ম্যাপিং → ড্রাই-রান → কমিট (আসল অ্যাকশন) ·
   ভাঙা ফাইলের কারণ · সব ইমপোর্টের তালিকা · কমিটের শর্ত।
   ============================================================ */

import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCheck, Download, Eye, FileUp, RefreshCw, Shuffle } from 'lucide-react';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { IMPORT_STATUS } from '../../../domain/adminOps';
import { KV, Note, Progress, StackedCard, StackHead, Stepper } from './parts';

export default function ImportCsv() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, commitImport } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const pending = state.imports.find((x) => x.status === 'dry_run');
  const broken = state.imports.find((x) => x.status === 'parse_error');
  const [pick, setPick] = useState(pending?.id ?? state.imports[0].id);
  const im = state.imports.find((x) => x.id === pick) ?? state.imports[0];

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(csv|xlsx|xls)$/i.test(f.name)) { setErr('শুধু CSV / Excel ফাইল (.csv, .xlsx, .xls)'); return; }
    setErr(''); setFileName(f.name);
    setMsg(`${f.name} আপলোড হয়েছে — কলাম ম্যাপিং দেখে ড্রাই-রান চালান (ডেমো, ফাইল পড়া হয়নি)`);
  }
  function commit(id: string) {
    setMsg(''); setErr('');
    const r = commitImport(id);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <b className="text-sm">ইমপোর্টের ধাপ</b>
          <Badge tone="warn">ধাপ ৩/৫</Badge>
        </div>
        <Stepper steps={['আপলোড', 'কলাম ম্যাপিং', 'ড্রাই-রান', 'কমিট', 'লেজার']} cur={2} />
      </Card>

      {msg ? <SuccessBanner title={msg}>কোনো লেজার এন্ট্রি এখনো বসেনি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {im ? (
        <StackedCard tone="warn" head={<StackHead title={im.file} sub={`${im.by} · ${im.at} · ${im.size}`}
          right={<Badge tone={IMPORT_STATUS[im.status].tone}>{IMPORT_STATUS[im.status].t}</Badge>} />}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-mut">প্রভাব</div>
              <div className="num text-h3 font-extrabold">৳{bn(im.amount)}</div>
            </div>
            <div className="text-xs text-mut text-right">{bn(im.rows)} সারি · বৈধ {bn(im.valid)}</div>
          </div>
          <div className="mt-1">
            <KV k="সারি" v={`${bn(im.rows)} · বৈধ ${bn(im.valid)} · ত্রুটি ${bn(im.invalid)}`} />
            <KV k="ডুপ্লিকেট" v={`${bn(im.dup)}টি চিহ্নিত — কমিটে বাদ পড়বে`} />
            <KV k="ম্যাপিং" v={im.mapping} />
            <KV k="ড্রাই-রান" v="কিছুই পোস্ট হয়নি — শুধু হিসাব" />
          </div>
          <div className="flex gap-2 mt-2.5">
            <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => setMsg(`ত্রুটি ${bn(im.invalid)}টি — তালিকা পরের ধাপে (ডেমো)`)}>ত্রুটি {bn(im.invalid)}</Button>
            <Button size="sm" variant="secondary" className="grow" icon={<Shuffle size={14} />} onClick={() => setMsg('কলাম ম্যাপিং সম্পাদনা — নিচের টেবিলে দেখানো মান (ডেমো)')}>ম্যাপিং</Button>
            <Button size="sm" className="grow" icon={<CheckCheck size={14} />} disabled={im.status !== 'dry_run'} onClick={() => commit(im.id)}>কমিট</Button>
          </div>
        </StackedCard>
      ) : null}

      <Card title="কলাম ম্যাপিং" sub={`${bn(state.importsMap.length)}টি কলাম`}>
        <DataTable
          columns={[{ key: 'f', head: 'ফাইলের কলাম' }, { key: 's', head: 'সিস্টেমের ফিল্ড' }]}
          rows={state.importsMap.map(([f, s], i) => ({ id: i, f, s: <span className="font-mono text-xs">{s}</span> }))}
        />
        <Note tone="info"><><b>টাকা → পয়সা</b> — ফাইলে টাকা থাকে, ডেটাবেসে সব অঙ্ক <code>*_paisa BIGINT</code>; তাই ম্যাপিংয়ে ×১০০ হয়। ভাসমান দশমিক কোথাও ব্যবহার হয় না।</></Note>
      </Card>

      {broken ? (
        <Card title={broken.file} sub={`${broken.by} · ${broken.at} · ${broken.size}`}>
          <div className="rounded-r-sm bg-danger-bg border border-danger-bd p-2.5">
            <b className="text-sm text-danger-ink">ফাইল পড়া যায়নি</b>
            <p className="text-xs text-danger-ink mt-0.5">{broken.err}</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="ghost" className="grow" onClick={() => setMsg('CSV নির্দেশিকা ডাউনলোড প্রস্তুত (ডেমো)')}>নির্দেশিকা</Button>
            <Button size="sm" variant="secondary" className="grow" icon={<RefreshCw size={14} />} onClick={() => fileRef.current?.click()}>আবার আপলোড</Button>
          </div>
        </Card>
      ) : null}

      <Card title="সব ইমপোর্ট" sub={`${bn(state.imports.length)}টি ফাইল`}>
        <div className="divide-y divide-line-2">
          {state.imports.map((x) => (
            <button key={x.id} type="button" onClick={() => setPick(x.id)} className="w-full min-h-tap text-left py-2.5 flex items-start gap-2">
              <FileUp size={15} className={`mt-0.5 shrink-0 ${x.status === 'committed' ? 'text-ok-ink' : x.status === 'parse_error' ? 'text-danger-ink' : 'text-warn-ink'}`} />
              <span className="grow min-w-0">
                <span className="block text-sm font-bold truncate">{x.file}</span>
                <span className="block text-xs text-mut">{x.at} · {bn(x.rows)} সারি · {x.by}</span>
                <span className="block text-xs text-txt-2">{x.effect}</span>
              </span>
              <Badge tone={IMPORT_STATUS[x.status].tone}>{IMPORT_STATUS[x.status].t}</Badge>
            </button>
          ))}
        </div>
      </Card>

      <Card title="নতুন ফাইল">
        <Field label="CSV / Excel ফাইল" required hint="আপলোডের পর ম্যাপিং ও ড্রাই-রান দেখে তবেই কমিট">
          {(fid) => (
            <>
              <input ref={fileRef} id={fid} type="file" accept=".csv,.xlsx,.xls,text/csv" className="sr-only" onChange={onFile} />
              <button type="button" onClick={() => fileRef.current?.click()} className={inputClass() + ' min-h-tap text-left w-full'}>
                {fileName || 'ফাইল বাছাই করুন (.csv / .xlsx)'}
              </button>
            </>
          )}
        </Field>
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" className="grow" icon={<Download size={15} />} onClick={() => setMsg('নমুনা টেমপ্লেট (CSV) ডাউনলোড প্রস্তুত (ডেমো)')}>টেমপ্লেট</Button>
          <Button variant="secondary" className="grow" onClick={() => navigate(`/a/batch${roleQS}`)}>ব্যাচে যান</Button>
        </div>
      </Card>

      <KpiGrid>
        <Kpi label="ড্রাই-রান" value={bn(state.imports.filter((x) => x.status === 'dry_run').length)} tone="warn" note="কমিটের অপেক্ষায়" />
        <Kpi label="কমিটেড" value={bn(state.imports.filter((x) => x.status === 'committed').length)} tone="ok" note="লেজারে গেছে" />
        <Kpi label="ভাঙা ফাইল" value={bn(state.imports.filter((x) => x.status === 'parse_error').length)} tone="danger" note="আবার আপলোড" />
        <Kpi label="ডুপ্লিকেট" value={bn(state.imports.reduce((s, x) => s + x.dup, 0))} tone="warn" note="বাদ পড়বে" />
      </KpiGrid>

      <Note tone="warn"><><b>পুরনো খাতা ঢোকানো সংবেদনশীল কাজ</b> — কমিটের আগে ম্যানেজারের অনুমোদন লাগবে, প্রতিটি সারিতে আলাদা idempotency key বসবে, পুরো ইমপোর্ট একটি ব্যাচ হিসেবে অডিট লগে থাকবে; পরে ফেরত নিলেও লগ মুছবে না (R-02)।</></Note>
      <Progress pct={60} />
      <SectionHead title="কমিটের পরে" sub="রোলব্যাক শুধু নতুন ব্যাচ দিয়ে" />
      <p className="text-sm text-txt-2">কমিটেড সারি ডিলিট হয় না — ভুল হলে রিভার্সাল এন্ট্রি (AM-14) বা নতুন ব্যাচে সংশোধন।</p>
    </div>
  );
}
