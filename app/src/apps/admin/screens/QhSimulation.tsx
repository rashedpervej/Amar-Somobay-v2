/* QAM-04 · নিয়ম Simulation — খসড়া নিয়মের প্রভাব, ব্যক্তিগত তালিকা ছাড়া (D-57) */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, EyeOff, History, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { qhDate } from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { useRoleQS } from './rcParts';

const DEFAULTS = { minSavings: 10000, maxPct: 30, minMonths: 6 };

export default function QhSimulation() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, runSim, saveRuleVersion } = useAdminQh();
  const [form, setForm] = useState({ ...DEFAULTS });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const sim = state.sim;
  const cur = state.eligible.filter((e) => e.result === 'eligible').length;
  const latest = state.versions[0];

  const run = () => {
    setErr(''); setOk('');
    const res = runSim(form);
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };

  const save = () => {
    setErr(''); setOk('');
    const res = saveRuleVersion({ minSavings: form.minSavings, maxPct: form.maxPct, minMonths: form.minMonths }, 'কামরুল হাসান (সমিতি প্রশাসক)');
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };

  const delta = (d: number) => `${d >= 0 ? '+' : '−'}${bn(Math.abs(d))}`;

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand"><ShieldCheck size={12} /> নমুনা ৯ জন</Badge>
        <Badge tone="warn">Simulation বাধ্যতামূলক (D-57)</Badge>
        <QhZero />
      </div>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="Simulation">{ok}</SuccessBanner> : null}

      <Card title="খসড়া নিয়মের মান" sub="শুধু সংখ্যা ও ব্যান্ড — কোনো ব্যক্তিগত তালিকা নয়">
        <label className="block text-sm font-bold mb-1" htmlFor="qh-s1">ন্যূনতম মোট সঞ্চয় (৳)</label>
        <input id="qh-s1" className={inputClass()} inputMode="numeric" value={form.minSavings}
          onChange={(e) => setForm((f) => ({ ...f, minSavings: Number(e.target.value) || 0 }))} />
        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-s2">সঞ্চয়ের সর্বোচ্চ শতাংশ (%) · D-54</label>
        <input id="qh-s2" className={inputClass()} inputMode="numeric" value={form.maxPct}
          onChange={(e) => setForm((f) => ({ ...f, maxPct: Number(e.target.value) || 0 }))} />
        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-s3">ন্যূনতম সদস্যত্বকাল (মাস)</label>
        <input id="qh-s3" className={inputClass()} inputMode="numeric" value={form.minMonths}
          onChange={(e) => setForm((f) => ({ ...f, minMonths: Number(e.target.value) || 0 }))} />
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => { setForm({ ...DEFAULTS }); setErr(''); }}>ডিফল্টে ফিরুন</Button>
          <Button icon={<Check size={15} />} onClick={run}>Simulation চালান</Button>
        </div>
      </Card>

      <KpiGrid>
        <Kpi label="চালু সংস্করণে যোগ্য" value={bn(cur)} unit="জন" note={`v${bn(latest.no)} · ${qhDate(latest.validFrom)}`} />
        <Kpi label="খসড়ায় যোগ্য" value={sim ? bn(sim.eligible) : '—'} unit="জন" tone={sim ? 'warn' : 'neutral'} note="Simulation চালানোর পর" />
        <Kpi label="নতুন আটকাবেন" value={sim ? bn(sim.newlyBlocked) : '—'} unit="জন" tone="warn" note="ঝুঁকি" />
        <Kpi label="নতুন যোগ্য" value={sim ? bn(sim.newlyEligible) : '—'} unit="জন" tone="ok" note="সুযোগ" />
      </KpiGrid>

      <SectionHead title="ফলাফল" sub="খসড়া বনাম চালু সংস্করণ" />
      <Card>
        {sim ? (
          <div className="space-y-2">
            {[
              { k: 'যোগ্য সদস্য', a: `${bn(cur)} জন`, b: `${bn(sim.eligible)} জন`, d: delta(sim.eligible - cur), tone: sim.eligible >= cur ? 'ok' : 'warn' },
              { k: 'অযোগ্য', a: `${bn(9 - cur)} জন`, b: `${bn(sim.blocked)} জন`, d: delta(sim.blocked - (9 - cur)), tone: 'warn' },
              { k: 'নতুন আটকানো', a: '—', b: `${bn(sim.newlyBlocked)} জন`, d: 'ঝুঁকি', tone: 'danger' },
              { k: 'নতুন যোগ্য', a: '—', b: `${bn(sim.newlyEligible)} জন`, d: 'সুযোগ', tone: 'ok' },
            ].map((r) => (
              <div key={r.k} className="grid grid-cols-4 gap-1.5 items-center text-sm border-b border-line-2 last:border-b-0 py-2">
                <span className="text-mut text-xs">{r.k}</span>
                <b className="num text-xs">{r.a}</b>
                <b className="num text-xs">{r.b}</b>
                <Badge tone={r.tone as 'ok' | 'warn' | 'danger'}>{r.d}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-mut">এখনো Simulation চালানো হয়নি — উপরের ফর্মে মান দিন, তারপর “Simulation চালান” চাপুন। ফলাফল ছাড়া নতুন সংস্করণ প্রকাশ আটকাবে (D-57)।</p>
        )}
      </Card>

      <SectionHead title="সীমার বণ্টন" sub="কতজন কোন ব্যান্ডে · নাম নেই (D-57)" />
      <Card>
        {sim ? (
          <div className="space-y-2">
            {sim.bands.map((n, i) => (
              <div key={sim.bandLabels[i]} className="flex items-center gap-2 text-xs">
                <span className="w-[46%] shrink-0 text-mut">{sim.bandLabels[i]}</span>
                <span className="grow h-2.5 rounded-r-pill bg-line-2 overflow-hidden">
                  <span className="block h-full rounded-r-pill bg-green-700" style={{ width: `${Math.round((n / Math.max(1, sim.members)) * 100)}%` }} />
                </span>
                <b className="num w-6 text-right">{bn(n)}</b>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-mut">Simulation চালালে এখানে সীমার ব্যান্ড দেখানো হবে।</p>}
        <div className="mt-3"><Note tone="warn"><b className="inline-flex items-center gap-1"><EyeOff size={13} /> গোপনীয়তা</b><br />{sim?.privacy ?? 'শুধু সংখ্যা ও বণ্টন — কোনো নাম, আইডি বা পরিচয় নেই (D-57)।'}</Note></div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={run}>আবার চালান</Button>
        <Button icon={<Check size={15} />} onClick={save}>ফলাফলসহ সংরক্ষণ</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/rules${qs}`)}>যোগ্যতা নিয়ম</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/eligible${qs}`)}>যোগ্য তালিকা</Button>
      </div>

      <Card title="সংস্করণ তুলনা (v1 → v3)" sub={`নমুনা আকার ${bn(latest.sim.sample)} জন · প্রোডাকশনে সমিতির সব সদস্য`}
        right={<Badge tone="neutral"><History size={11} /> {bn(state.versions.length)}টি</Badge>}>
        <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold text-mut border-b border-line-2 pb-1.5">
          <span>সংস্করণ</span><span>যোগ্য</span><span>নতুন আটকেছে</span><span>নতুন যোগ্য</span>
        </div>
        {state.versions.map((v, i) => (
          <div key={v.id} className="grid grid-cols-4 gap-1.5 text-xs border-b border-line-2 last:border-b-0 py-1.5">
            <b>v{bn(v.no)}{i === 0 ? ' ✓' : ''}</b>
            <span className="num">{bn(v.sim.eligible)} জন</span>
            <span className="num">{bn(v.sim.newlyBlocked)} জন</span>
            <span className="num">{bn(v.sim.newlyEligible)} জন</span>
          </div>
        ))}
        <div className="mt-2 text-xs text-mut leading-relaxed">
          <p><b className="text-txt">v{bn(latest.no)} পরিবর্তন:</b> {latest.changes}</p>
          <p className="mt-1"><b className="text-txt">গোপনীয়তা:</b> {latest.note}</p>
        </div>
        <div className="mt-3"><Note tone="info">নিয়ম কঠিন করলে যাঁরা আগে যোগ্য ছিলেন তাঁরা আটকাবেন — পুরোনো আবেদনের স্ন্যাপশট অপরিবর্তিত থাকবে (BR-21)।</Note></div>
      </Card>

      <div className="rounded-r-sm border border-warn-bd bg-warn-bg px-3 py-2 text-xs text-warn-ink">
        <TriangleAlert size={13} className="inline mr-1" /> সুদ ৳০ — Simulation-এও শুধু মূলধন; কোনো মুনাফা হার নেই (BR-20)।
      </div>
    </div>
  );
}
