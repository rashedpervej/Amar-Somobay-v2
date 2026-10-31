/* QAM-03 · যোগ্যতা নিয়ম — ১৪টি নিয়ম ৪টি স্তরে, ম্যানুয়াল এক্সেপশন ও অগ্রাধিকার (D-52/59) */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, Info, Lock, Unlock, Users, TriangleAlert, X } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { Accordion, KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import { QH_LAYER, QH_ELIG_ST, QH_SRC, qhDate, qhRuleValue, type LayerKey } from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

export default function QhRules() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, saveRuleVersion, grantException } = useAdminQh();
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [member, setMember] = useState('m8');
  const [committee, setCommittee] = useState('CM-2610-08');
  const [reason, setReason] = useState('');

  const byLayer = (k: LayerKey) => state.rules.filter((r) => r.layer === k);
  const exceptions = state.eligible.filter((e) => e.source === 'manual_exception');

  const publish = () => {
    setErr(''); setOk('');
    const res = saveRuleVersion({ minSavings: 5000, maxPct: 50, minMonths: 6 }, 'কামরুল হাসান (সমিতি প্রশাসক)');
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };

  const grant = () => {
    setErr(''); setOk('');
    const res = grantException(member, committee.trim().toUpperCase(), reason);
    if (!res.ok) setErr(res.message); else { setOk(res.message); setReason(''); }
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ok">{bn(state.rules.length)}টি নিয়ম · ৪ স্তর</Badge>
        <Badge tone="neutral">সংস্করণ {bn(state.versions.length)}</Badge>
        <QhZero />
      </div>

      <KpiGrid>
        <Kpi label="গেট স্তর" value={bn(byLayer('gate').length)} note="আগে না চললে বাকি পরীক্ষা নেই" />
        <Kpi label="আর্থিক স্তর" value={bn(byLayer('financial').length)} note="সঞ্চয় · বকেয়া · সদস্যত্বকাল" />
        <Kpi label="সতর্কতা নিয়ম" value={bn(state.rules.filter((r) => r.sev === 'warn').length)} tone="warn" note="আটকায় না, পর্যালোচনা লাগে" />
        <Kpi label="এক্সেপশন" value={bn(exceptions.length)} tone="warn" note="D-59 · কমিটি রেফারেন্স বাধ্যতামূলক" />
      </KpiGrid>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="সফল">{ok}</SuccessBanner> : null}

      <Card title="নিয়মের ক্রম (§৭.১)" sub="স্তর পাস না হলে পরের স্তর চলবে না">
        <div className="space-y-2">
          {QH_LAYER.map((l, i) => {
            const rs = byLayer(l.k);
            const blocks = rs.filter((r) => r.sev === 'block').length;
            return (
              <div key={l.k} className="flex items-start gap-2.5 rounded-r-sm border border-line bg-card-2 px-3 py-2.5">
                <span className="shrink-0 size-7 rounded-r-pill grid place-items-center bg-green-100 text-green-800 text-xs font-extrabold">{bn(i + 1)}</span>
                <div className="grow min-w-0">
                  <div className="text-sm font-extrabold leading-snug">{l.t}</div>
                  <div className="text-xs text-mut mt-0.5">{bn(rs.length)}টি নিয়ম · {bn(blocks)}টি ব্লকিং · {l.sub}</div>
                </div>
                <Badge tone="ok"><Check size={11} /> স্তর {bn(i + 1)}</Badge>
              </div>
            );
          })}
        </div>
        <div className="mt-3"><Note tone="warn">নিয়ম পরিবর্তনের আগে Simulation বাধ্যতামূলক — কতজন যোগ্য/অযোগ্য হবেন দেখুন। ব্যক্তিগত তালিকা Simulation-এ দেখানো হয় না (D-57)।</Note></div>
      </Card>

      {QH_LAYER.map((l) => (
        <div key={l.k} className="rounded-r-md border border-line bg-card shadow-sh-1 overflow-hidden">
          <div className="px-3.5 pt-3 pb-1.5 flex items-start gap-2">
            <span className="grow">
              <span className="block text-sm font-extrabold">{l.t}</span>
              <span className="block text-xs text-mut">{l.sub}</span>
            </span>
            <Badge tone="neutral">{bn(byLayer(l.k).length)}টি</Badge>
          </div>
          <div className="divide-y divide-line-2">
            {byLayer(l.k).map((r) => (
              <div key={r.id} className="px-3.5 py-2.5">
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 size-7 rounded-r-sm grid place-items-center ${r.sev === 'warn' ? 'bg-warn-bg text-warn-ink' : 'bg-danger-bg text-danger-ink'}`}>
                    {r.sev === 'warn' ? <Unlock size={13} /> : <Lock size={13} />}
                  </span>
                  <div className="grow min-w-0">
                    <div className="text-sm font-bold leading-snug">{r.label}</div>
                    <div className="text-xs text-mut num mt-0.5">{r.key} {r.op} {qhRuleValue(r)} · কারণ {r.reason}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge tone={r.sev === 'warn' ? 'warn' : 'danger'}>{r.sev === 'warn' ? 'সতর্কতা' : 'আটকে দেয়'}</Badge>
                      <Badge tone="neutral">কার্যকর {qhDate(r.since)}</Badge>
                      {r.active ? <Badge tone="ok">সক্রিয়</Badge> : <Badge tone="neutral"><X size={11} /> নিষ্ক্রিয়</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Accordion title="ম্যানুয়াল এক্সেপশন ও অগ্রাধিকার (D-52/59)" sub="নিয়মই একমাত্র উৎস — হাতে “যোগ্য” লেখা যায় না" defaultOpen>
        <KV k="ম্যানুয়াল তালিকা" v="কমিটি নির্দিষ্ট সদস্য যোগ করতে পারে · কারণ ও রেফারেন্স বাধ্যতামূলক" />
        <KV k="এক্সেপশন" v="শুধু ORG_ADMIN · অডিট লগে স্বয়ংক্রিয় চিহ্ন (D-59)" />
        <KV k="বহিষ্কার তালিকা" v="সব নিয়ম পাস করলেও আটকাবে (QH-B-07)" />
        <KV k="অগ্রাধিকার ক্রম" v="প্রয়োজনের তীব্রতা → ওয়েটলিস্ট → সদস্যত্বকাল → জমার ধারা (D-52)" />
      </Accordion>

      <SectionHead title="চলমান এক্সেপশন" sub={`${bn(exceptions.length)}টি · ম্যানুয়াল অনুমোদন বাধ্যতামূলক`} />
      {exceptions.length === 0 ? (
        <Card><p className="text-sm text-mut">কোনো চলমান ম্যানুয়াল এক্সেপশন নেই।</p></Card>
      ) : exceptions.map((e) => {
        const m = SEED_MEMBERS.find((x) => x.id === e.memberId);
        return (
          <Card key={e.memberId} title={m?.name ?? e.memberId} sub={`${m?.no ?? ''} · কমিটি রেফারেন্স · সীমা ${tk(e.maxAmount)}`}
            right={<Badge tone={QH_ELIG_ST[e.result].tone}>{QH_ELIG_ST[e.result].t}</Badge>}>
            <p className="text-xs text-mut leading-relaxed">{e.note}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {e.reasons.map((c) => <Badge key={c} tone="warn">{c}</Badge>)}
              <Badge tone="neutral">{QH_SRC[e.source].t}</Badge>
              <Badge tone="neutral">বৈধ {qhDate(e.validUntil)}</Badge>
            </div>
          </Card>
        );
      })}

      <Card title="নতুন ম্যানুয়াল এক্সেপশন" sub="ORG_ADMIN · কমিটি রেফারেন্স ও কারণ ছাড়া সংরক্ষণ হবে না (D-59)">
        <label className="block text-sm font-bold mb-1" htmlFor="qh-ex-member">সদস্য</label>
        <select id="qh-ex-member" className={inputClass()} value={member} onChange={(e) => setMember(e.target.value)}>
          {SEED_MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.no}</option>)}
        </select>
        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-ex-cm">কমিটি রেফারেন্স</label>
        <input id="qh-ex-cm" className={inputClass()} value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="CM-YYMM-##" />
        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-ex-note">কারণ</label>
        <textarea id="qh-ex-note" className={inputClass()} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: দুর্যোগে ক্ষতিগ্রস্ত — কমিটির বিশেষ সিদ্ধান্ত" />
        <Button className="mt-3" block icon={<Users size={15} />} onClick={grant}>এক্সেপশন রেকর্ড করুন</Button>
        <p className="text-xs text-mut mt-2"><Info size={12} className="inline mr-1" />এক্সেপশন দেওয়া ব্যক্তি এই আবেদনের অনুমোদনকারী হতে পারবেন না (BR-04 প্রসারণ)।</p>
      </Card>

      <SectionHead title="সংস্করণ ইতিহাস" sub={`${bn(state.versions.length)}টি · স্ন্যাপশট অপরিবর্তনীয় (BR-21)`} />
      <div className="space-y-2">
        {state.versions.map((v, i) => (
          <Card key={v.id} title={`v${bn(v.no)}${i === 0 ? ' · চালু' : ''}`} sub={`${qhDate(v.validFrom)} · ${v.by}`}
            right={<Badge tone={i === 0 ? 'ok' : 'neutral'}>{v.committee}</Badge>}>
            <p className="text-sm">{v.changes}</p>
            <p className="text-xs text-mut mt-1">{v.note}</p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              <Badge tone="neutral">যোগ্য {bn(v.sim.eligible)} জন</Badge>
              <Badge tone="warn">নতুন আটকেছে {bn(v.sim.newlyBlocked)} জন</Badge>
              <Badge tone="ok">নতুন যোগ্য {bn(v.sim.newlyEligible)} জন</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<BarChart3 size={15} />} onClick={() => navigate(`/a/qh/simulation${qs}`)}>Simulation</Button>
        <Button icon={<Check size={15} />} onClick={publish}>সংস্করণ প্রকাশ</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/products${qs}`)}>পণ্য কনফিগ</Button>
        <Button variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate(`/a/qh/eligible${qs}`)}>যোগ্য তালিকা</Button>
      </div>

      <div className="rounded-r-sm border border-warn-bd bg-warn-bg px-3 py-2 text-xs text-warn-ink">
        <TriangleAlert size={13} className="inline mr-1" /><b>সুদ ৳০</b> — নিয়মে কোনো মুনাফা/সুদ হার নেই; সব নিয়ম শুধু যোগ্যতা যাচাই করে (BR-20)।
      </div>
    </div>
  );
}
