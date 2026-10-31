/* ============================================================
   src/apps/admin/screens/Reconciliation.tsx — AM-21 রিকনসিলিয়েশন ও ব্যতিক্রম নিষ্পত্তি
   ধাপ ৩/৪ · পার্থক্য হিরো · ৪ KPI · স্টেটমেন্ট টেবিল · ব্যতিক্রম
   নিষ্পত্তি (আসল অ্যাকশন) · সব ব্যতিক্রমের তালিকা · সাইন-অফ শর্ত।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Download, Eye, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { RECON_KIND, reconPct } from '../../../domain/adminOps';
import { Accordion, Hero, KV, Note, Progress, Stepper, SubCard } from './parts';

export default function Reconciliation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, resolveException, signOffRecon } = useAdmin();
  const r = state.recon;
  const open = state.reconEx.filter((x) => x.status !== 'resolved');
  const [pick, setPick] = useState(open[0]?.id ?? state.reconEx[0].id);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const ex = state.reconEx.find((x) => x.id === pick) ?? state.reconEx[0];
  const pct = reconPct(r);

  function act(mode: 'resolve' | 'suspense') {
    setMsg(''); setErr('');
    const res = resolveException(ex.id, mode, note);
    if (!res.ok) { setErr(res.message); return; }
    setMsg(res.message); setNote('');
  }
  function signOff() {
    setMsg(''); setErr('');
    const res = signOffRecon();
    if (!res.ok) { setErr(res.message); return; }
    setMsg(res.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <b className="text-sm">ধাপ</b>
          <Badge tone="warn">ধাপ {bn(open.length ? 3 : 4)}/৪</Badge>
        </div>
        <Stepper steps={['স্টেটমেন্ট আপলোড', 'স্বয়ংক্রিয় মিল', 'ব্যতিক্রম নিষ্পত্তি', 'সাইন-অফ']} cur={open.length ? 2 : 3} />
      </Card>

      <Hero label={`পার্থক্য (সিস্টেম − বাইরের স্টেটমেন্ট) · ${r.period}`} amount={`৳${bn(r.diff)}`}
        sub={r.source} chips={<>
          <span className="text-xs">সিস্টেম ৳{bn(r.sysTotal)}</span>
          <span className="text-xs">স্টেটমেন্ট ৳{bn(r.extTotal)}</span>
          <span className="text-xs">মিল {bn(pct)}%</span>
        </>} />

      <KpiGrid>
        <Kpi label="মিলে গেছে" value={bn(r.matched)} tone="ok" note="স্বয়ংক্রিয় ম্যাচ" />
        <Kpi label="অমিল" value={bn(r.unmatched)} tone="danger" note="নিষ্পত্তি বাকি" />
        <Kpi label="সাসপেন্স" value={bn(r.suspense)} tone="warn" note="H10 খাতায় আটক" />
        <Kpi label="সাইন-অফ" value={r.signedOff ? 'হয়েছে' : 'বাকি'} note={r.signedOff ? 'সম্পন্ন' : 'চলছে'} />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg}>ডেমো — কোনো বাস্তব তথ্য বদলায়নি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Card title="আপলোড করা স্টেটমেন্ট" sub={`${bn(r.statements.length)}টি ফাইল`}>
        <div className="divide-y divide-line-2">
          {r.statements.map((s) => (
            <div key={s.file} className="py-2">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm">{s.src}</b>
                <span className={`num text-sm font-bold ${s.diff ? 'text-danger-ink' : 'text-ok-ink'}`}>পার্থক্য ৳{bn(s.diff)}</span>
              </div>
              <div className="text-xs text-mut">{s.file} · {s.uploadedAt}</div>
              <div className="text-xs text-mut mt-0.5">সারি {bn(s.rows)} · মিল {bn(s.matched)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="ব্যতিক্রম নিষ্পত্তি" sub={`${bn(open.length)}টি খোলা`}
        right={<Badge tone={RECON_KIND[ex.kind].tone}>{RECON_KIND[ex.kind].t}</Badge>}>
        <div className="space-y-1">
          <KV k="লেনদেন" v={ex.txn} />
          <KV k="সদস্য / তারিখ" v={`${ex.member} · ${ex.date}`} />
          <KV k="অঙ্ক" v={`৳${bn(ex.amount)}`} strong />
          <KV k="সম্ভাব্য কারণ" v={ex.cause} />
          <KV k="প্রস্তাবিত ব্যবস্থা" v={ex.action} />
          <KV k="অবস্থা" v={ex.status === 'resolved' ? `নিষ্পত্তি · ${ex.by}` : ex.status === 'suspense' ? 'সাসপেন্স (H10)' : 'খোলা'} />
        </div>

        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="ghost" className="grow" icon={<Eye size={15} />}
            onClick={() => navigate(`/a/txn/${ex.txn}${roleQS}`)}>ট্রেইল</Button>
          <Button size="sm" variant="ghost" className="grow" onClick={() => { setPick(open[0]?.id ?? ex.id); }}>পরেরটি</Button>
        </div>

        <div className="mt-3 border-t border-line-2 pt-3 space-y-2">
          <Field label="নিষ্পত্তির কারণ / লিখিত ব্যাখ্যা" required hint="৫ অক্ষরের কম হলে সংরক্ষণ হবে না">
            {(fid) => <textarea id={fid} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass()} placeholder="যেমন: বিকাশ স্টেটমেন্টে ফি বাদ দেওয়া হয়েছে — সংশোধন প্রস্তাব" />}
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="grow" onClick={() => act('suspense')}>সাসপেন্সে রাখুন</Button>
            <Button size="sm" className="grow" icon={<ShieldCheck size={15} />} onClick={() => act('resolve')}>নিষ্পত্তি করুন</Button>
          </div>
        </div>
      </Card>

      <Card title="সব ব্যতিক্রম">
        <div className="divide-y divide-line-2">
          {state.reconEx.map((x) => (
            <button key={x.id} type="button" onClick={() => setPick(x.id)}
              className={`w-full min-h-tap text-left py-2.5 flex items-start gap-2 ${x.id === ex.id ? 'bg-green-50 -mx-2 px-2 rounded-r-sm' : ''}`}>
              <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${x.status === 'resolved' ? 'text-ok-ink' : x.status === 'suspense' ? 'text-warn-ink' : 'text-danger-ink'}`} />
              <span className="grow min-w-0">
                <span className="block text-sm font-bold">{x.kindBn} · ৳{bn(x.amount)}</span>
                <span className="block text-xs text-mut">{x.txn} · {x.member} · {x.date}</span>
                <span className="block text-xs text-txt-2">{x.action}</span>
              </span>
              <Badge tone={x.status === 'resolved' ? 'ok' : x.status === 'suspense' ? 'warn' : 'danger'}>
                {x.status === 'resolved' ? 'নিষ্পত্তি' : x.status === 'suspense' ? 'সাসপেন্স' : 'খোলা'}
              </Badge>
            </button>
          ))}
        </div>
      </Card>

      <Accordion title="সাইন-অফের আগে শর্ত" sub={`অমিল ${bn(open.length)}টি · সাসপেন্স ${bn(r.suspense)}টি`} defaultOpen>
        <p className="text-sm text-txt-2 leading-relaxed">
          প্রতিটি অমিলের নিষ্পত্তি বা লিখিত কারণ থাকতে হবে; সাসপেন্স খাতায় (H10) রাখা অঙ্কের তদন্ত চলছে তা লগে থাকতে হবে।
          এগুলো ছাড়া পিরিয়ড রিকনসাইলড চিহ্নিত করা যাবে না — এবং মাস বন্ধ করা যাবে না।
        </p>
        <div className="mt-2"><Progress pct={pct} tone={pct > 90 ? 'ok' : 'warn'} /></div>
      </Accordion>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Download size={15} />}
          onClick={() => setMsg('স্টেটমেন্ট ডাউনলোড প্রস্তুত (ডেমো)')}>স্টেটমেন্ট</Button>
        <Button variant="secondary" className="grow" icon={<RefreshCw size={15} />}
          onClick={() => navigate(`/a/reversal${roleQS}`)}>সংশোধন</Button>
        <Button className="grow" onClick={signOff} disabled={r.signedOff}>
          {r.signedOff ? 'সাইন-অফ হয়েছে' : open.length ? `${bn(open.length)}টি নিষ্পত্তি বাকি` : 'সাইন-অফ করুন'}
        </Button>
      </div>
      <Note tone="info">পার্থক্য ৳{bn(r.diff)} · মিল {bn(r.matched)}টি · অমিল {bn(r.unmatched)}টি · সাসপেন্স {bn(r.suspense)}টি — সবই ডেমো ডেটা।</Note>
      <SectionHead title="মাস বন্ধ" sub="সাইন-অফের পরেই কেবল সম্ভব (R-05)" />
      <SubCard>
        <p className="text-sm text-txt-2">মাস বন্ধ করলে ওই পিরিয়ডে নতুন এন্ট্রি বসবে না; সংশোধনের একমাত্র পথ রিভার্সাল (AM-14)।</p>
      </SubCard>
    </div>
  );
}
