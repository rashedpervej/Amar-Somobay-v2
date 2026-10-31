/* ============================================================
   src/apps/admin/screens/ReportCenter.tsx — AM-25 রিপোর্ট কেন্দ্র
   লাইভ সার্চ · গ্রুপ-চিপ · অ্যাকর্ডিয়নে প্রতিটি রিপোর্ট (চালানোর আসল
   ফর্ম) · সাম্প্রতিক রান (ডাউনলোড/আবার) · ভূমিকা-ভিত্তিক সীমা।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Clock, Download, FileText, Filter, RefreshCw, Search, Share2 } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { reportGroups } from '../../../domain/adminOps';
import { Accordion, Note } from './parts';

const GROUPS = ['সব', 'দৈনিক', 'সদস্য', 'সঞ্চয়', 'বকেয়া', 'আর্থিক', 'নিরীক্ষা', 'রেগুলেটরি'];

export default function ReportCenter() {
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, runReport } = useAdmin();
  const [q, setQ] = useState('');
  const [g, setG] = useState('সব');
  const [code, setCode] = useState(state.reports[0].code);
  const [fmt, setFmt] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');
  const [period, setPeriod] = useState('এই মাস');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const list = useMemo(() => state.reports.filter((r) => {
    const okG = g === 'সব' || r.g === g;
    const okQ = !q.trim() || `${r.code} ${r.name} ${r.g}`.toLowerCase().includes(q.trim().toLowerCase());
    return okG && okQ;
  }), [state.reports, g, q]);
  const groups = reportGroups(list);
  const running = state.reportRuns.filter((x) => x.status === 'running');
  const failed = state.reportRuns.filter((x) => x.status === 'failed');

  function run() {
    setMsg(''); setErr('');
    const r = runReport(code, fmt);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(`${r.message} · পিরিয়ড: ${period}`);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Card>
        <Field label="রিপোর্ট খুঁজুন" hint="নাম বা কোড (যেমন AR-01)">
          {(fid) => (
            <div className="flex gap-2">
              <input id={fid} value={q} onChange={(e) => setQ(e.target.value)} className={inputClass() + ' grow'} placeholder="বকেয়া / ট্রায়াল / অডিট" />
              <Button size="sm" variant="secondary" icon={<Search size={15} />} onClick={() => setMsg(`${bn(list.length)}টি রিপোর্ট পাওয়া গেছে`)}>খুঁজুন</Button>
            </div>
          )}
        </Field>
        <Chipset>
          {GROUPS.map((x) => <Chip key={x} active={g === x} onClick={() => setG(x)}>{x}</Chip>)}
        </Chipset>
      </Card>

      {msg ? <SuccessBanner title={msg}>ডেমো — ফাইল তৈরি হয়েছে বলে ধরা হচ্ছে।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {groups.map((grp, i) => (
        <Accordion key={grp.g} title={`${grp.g} (${bn(grp.items.length)})`} sub={i === 0 ? 'দ্রুত ব্যবহারের তালিকা' : 'তালিকা'} defaultOpen={i === 0}>
          <div className="divide-y divide-line-2">
            {grp.items.map((r) => (
              <div key={r.code} className="py-2 flex items-start gap-2">
                <FileText size={15} className="mt-0.5 text-info-ink shrink-0" />
                <div className="grow min-w-0">
                  <b className="text-sm block">{r.code} · {r.name}</b>
                  <div className="text-xs text-mut">প্যারামিটার: {r.params.join(' · ')}</div>
                  <div className="text-xs text-mut mt-0.5">{r.time} · {r.fmt.join(' / ')} · {r.roles}</div>
                </div>
                <Button size="sm" variant="ghost" icon={<Download size={14} />}
                  onClick={() => { setCode(r.code); setFmt((r.fmt[0] as 'PDF' | 'Excel' | 'CSV') ?? 'PDF'); setMsg(''); run(); }}>চালান</Button>
              </div>
            ))}
          </div>
        </Accordion>
      ))}

      <Card title="রিপোর্ট তৈরি করুন" sub={`${bn(state.reports.length)}টি রিপোর্ট · ${bn(groups.length)}টি গ্রুপ`}>
        <Field label="রিপোর্ট" required>
          {(fid) => (
            <select id={fid} value={code} onChange={(e) => setCode(e.target.value)} className={inputClass()}>
              {state.reports.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
            </select>
          )}
        </Field>
        <div className="mt-3">
          <div className="text-sm font-bold mb-1">সময় / পিরিয়ড</div>
          <Chipset>
            {['আজ', 'এই মাস', 'অর্থবছর', 'কাস্টম'].map((x) => <Chip key={x} active={period === x} onClick={() => setPeriod(x)}>{x}</Chip>)}
          </Chipset>
        </div>
        <div className="mt-3">
          <div className="text-sm font-bold mb-1">ফরম্যাট</div>
          <Chipset>
            {(['PDF', 'Excel', 'CSV'] as const).map((x) => <Chip key={x} active={fmt === x} onClick={() => setFmt(x)}>{x}</Chip>)}
          </Chipset>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" className="grow" onClick={() => setMsg('বাতিল — কিছু তৈরি হয়নি')}>বাতিল</Button>
          <Button className="grow" icon={<FileText size={15} />} onClick={run}>তৈরি করুন</Button>
        </div>
        <Note tone="info">আনুমানিক সময় ২৫ সেকেন্ড — ছোট রেঞ্জ হলে সঙ্গে সঙ্গে, বড় হলে ব্যাকগ্রাউন্ড জব ও নোটিফিকেশন।</Note>
      </Card>

      <Card title="সাম্প্রতিক রিপোর্ট" sub={`${bn(state.reportRuns.length)}টি`}>
        <div className="divide-y divide-line-2">
          {state.reportRuns.map((x) => (
            <div key={x.id} className="py-2 flex items-start gap-2">
              {x.status === 'ready' ? <FileText size={15} className="mt-0.5 text-ok-ink shrink-0" />
                : x.status === 'running' ? <RefreshCw size={15} className="mt-0.5 text-info-ink shrink-0" />
                  : <AlertTriangle size={15} className="mt-0.5 text-danger-ink shrink-0" />}
              <div className="grow min-w-0">
                <b className="text-sm block">{x.name}</b>
                <div className="text-xs text-mut">{x.code} · {x.by} · {x.fmt}{x.size !== '—' ? ` · ${x.size}` : ''}</div>
                <div className="text-xs text-mut">{x.at}</div>
                {x.err ? <div className="text-xs text-danger-ink">{x.err}</div> : null}
              </div>
              {x.status === 'ready' ? (
                <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => setMsg(`${x.name}.${x.fmt.toLowerCase()} ডাউনলোড প্রস্তুত (ডেমো)`)}>ডাউনলোড</Button>
              ) : x.status === 'running' ? <Badge tone="info">তৈরি হচ্ছে</Badge>
                : <Button size="sm" variant="ghost" onClick={() => { setCode(x.code); run(); }}>আবার</Button>}
            </div>
          ))}
        </div>
      </Card>

      <KpiGrid>
        <Kpi label="রিপোর্ট" value={bn(state.reports.length)} note={`${bn(groups.length)} গ্রুপ`} />
        <Kpi label="চলছে" value={bn(running.length)} tone={running.length ? 'warn' : 'ok'} note="ব্যাকগ্রাউন্ড" />
        <Kpi label="ব্যর্থ" value={bn(failed.length)} tone={failed.length ? 'danger' : 'ok'} note="আবার চেষ্টা" />
        <Kpi label="তৈরি" value={bn(state.reportRuns.filter((x) => x.status === 'ready').length)} tone="ok" note="ডাউনলোডযোগ্য" />
      </KpiGrid>

      {running.length ? <Note tone="info"><><Clock size={14} className="inline -mt-0.5 mr-1" /><b>{bn(running.length)}টি রিপোর্ট ব্যাকগ্রাউন্ডে তৈরি হচ্ছে</b> — অ্যাপ বন্ধ করলেও কাজ থামবে না, লিংক নোটিফিকেশনে আসবে।</></Note> : null}
      {failed.length ? <Note tone="danger"><><b>{bn(failed.length)}টি ব্যর্থ</b> — {failed.map((f) => f.err).join(' · ')}। রেঞ্জ ছোট করে আবার চেষ্টা করুন।</></Note> : null}

      <Note tone="warn"><><Filter size={14} className="inline -mt-0.5 mr-1" /><b>সব রিপোর্টে ভূমিকা-ভিত্তিক সীমা</b> — AUDITOR ও EXTERNAL_AUDITOR শুধু নিরীক্ষা-গ্রুপ; রেগুলেটরি ছক শুধু ORG_ADMIN (D-22)।</></Note>
      <Note tone="info"><><Share2 size={14} className="inline -mt-0.5 mr-1" /><b>প্রিন্ট ও শেয়ার</b> — মোবাইলে থার্মাল প্রিন্টার সরাসরি চলবে না; PDF তৈরি করে শেয়ার করুন। ফাইলের বিষয়বস্তু ডেস্কটপের সাথে একই।</></Note>
      <SectionHead title="শেষ ধাপ" sub="রিপোর্ট → নোটিফিকেশন" />
      <p className="text-sm text-txt-2">বড় রিপোর্ট ব্যাকগ্রাউন্ড জবে চলে — তৈরি হলে নোটিফিকেশনে লিংক আসবে (মোবাইলে ডাউনলোড আটকে রাখা হয় না)।</p>
    </div>
  );
}
