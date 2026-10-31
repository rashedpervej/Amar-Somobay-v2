/* ============================================================
   src/apps/admin/screens/Settings.tsx — AM-33 সেটিংস হাব
   সেটআপ যাচাই (প্রগ্রেস) · ৪ KPI · মূল মান · অ্যাকর্ডিয়নে বিভাগ ·
   দ্রুত টগল (আসল অ্যাকশন) · ধ্বংসাত্মক রিসেট (type-to-confirm) · নীতি।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Building2, FileText, History, Lock, Search, Shield, Trash2, Users } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { LIMIT_MATRIX, settingsTotals } from '../../../domain/adminOps';
import { Accordion, KV, Note, Progress } from './parts';

const ICON: Record<string, typeof Building2> = { building: Building2, shield: Shield, file: FileText, bell: Bell, archive: History };

export default function Settings() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, toggleSetting } = useAdmin();
  const t = settingsTotals(state.settings);
  const notOk = state.setup.filter((x) => !x.ok);
  const done = state.setup.filter((x) => x.ok);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const groups = state.settings.filter((g) => !q.trim() || g.g.includes(q) || g.items.some((i) => i.t.includes(q) || i.d.includes(q)));

  function toggle(key: string) {
    setMsg(''); setErr('');
    const r = toggleSetting(key);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <b className="text-sm">প্রাথমিক সেটআপ যাচাই</b>
          <Badge tone={notOk.length ? 'warn' : 'ok'}>{bn(done.length)}/{bn(state.setup.length)}</Badge>
        </div>
        <Progress pct={(done.length / state.setup.length) * 100} tone={notOk.length ? 'warn' : 'ok'} />
        <div className="mt-2 space-y-1">
          {state.setup.map((x) => (
            <div key={x.t} className="flex items-start gap-2">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${x.ok ? 'bg-ok' : 'bg-danger'}`} />
              <span className="text-sm">{x.t}</span>
            </div>
          ))}
        </div>
        {notOk.length ? (
          <Note tone="danger"><><b>{notOk.map((x) => x.t).join(' · ')} — বাকি</b> — এগুলো নিশ্চিত না হওয়া পর্যন্ত রেগুলেটরি রিটার্ন চূড়ান্ত করা যাবে না (AM-24, D-29)।</></Note>
        ) : null}
      </Card>

      {msg ? <SuccessBanner title={msg}>ডেমো — সেটিং শুধু এই সেশনে বদলেছে।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <KpiGrid>
        <Kpi label="সেটিংস" value={bn(t.items)} note={`${bn(state.settings.length)}টি বিভাগ`} />
        <Kpi label="লকড নীতি" value={bn(t.locked)} tone="warn" note="আইন/নীতিগত" />
        <Kpi label="সেটআপ" value={`${bn(done.length)}/${bn(state.setup.length)}`} tone={notOk.length ? 'warn' : 'ok'} note={notOk.length ? `${bn(notOk.length)}টি বাকি` : 'সম্পন্ন'} />
        <Kpi label="এই মাসে পরিবর্তন" value={bn(state.audit.filter((a) => a.entityBn === 'সেটিংস').length)} tone="info" note="অডিট লগে (AM-35)" />
      </KpiGrid>

      <Card title="মূল মান এক নজরে" sub="সব বিভাগের সারাংশ">
        <KV k="SMS ব্যালেন্স" v={`৳${bn(state.sms.balance)} · ৳${bn(state.sms.perSms)}/SMS · সচল ${bn(state.sms.validNumbers)}টি`} />
        <KV k="অনুমোদন সীমা (D-22)" v={LIMIT_MATRIX.map((r) => `${r.r} ${r.amt === null ? 'অসীম' : `৳${bn(r.amt)}`}`).join(' · ')} />
        <KV k="ফি ও চার্জ (D-05)" v="ভর্তি ৳১০০ · বার্ষিক ৳৫০ · উত্তোলন ৳২০ · স্টেটমেন্ট ৳০" />
        <KV k="বিলম্ব ফি (D-08)" v="৳২০/কিস্তি · বছরে সর্বোচ্চ ৳২০০ · সুদ নয়" />
        <KV k="অর্থবছর (D-15)" v="১ জুলাই – ৩০ জুন" />
        <KV k="আর্কাইভ মেয়াদ (D-30)" v="আর্থিক রেকর্ড ও অডিট লগ ৮ বছর" />
      </Card>

      <Card>
        <Field label="সেটিংস খুঁজুন" hint="বিভাগ বা নাম">
          {(fid) => (
            <div className="flex gap-2">
              <input id={fid} value={q} onChange={(e) => setQ(e.target.value)} className={inputClass() + ' grow'} placeholder="যেমন: ফি / সীমা / SMS" />
              <Button size="sm" variant="secondary" icon={<Search size={15} />} onClick={() => setMsg(`${bn(groups.length)}টি বিভাগ পাওয়া গেছে`)}>খুঁজুন</Button>
            </div>
          )}
        </Field>
      </Card>

      {groups.map((g, gi) => {
        const Icon = ICON[g.icon] ?? FileText;
        return (
          <Accordion key={g.g} title={`${g.g} (${bn(g.items.length)})`} sub={g.items.every((i) => i.ok) ? 'সম্পূর্ণ' : 'খোলা আছে'} defaultOpen={gi === 1}
            right={<Icon size={16} className="text-mut" />}>
            {g.items.map((it) => (
              <div key={it.key} className="flex items-start gap-2 py-2 border-b border-line-2 last:border-b-0">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${it.ok ? 'bg-ok' : 'bg-warn'}`} />
                <div className="grow min-w-0">
                  <b className="text-sm block">{it.t} {it.locked ? <Lock size={12} className="inline text-mut" /> : null}</b>
                  <div className="text-xs text-mut">{it.d}</div>
                </div>
                <Badge tone={it.ok ? 'ok' : 'warn'}>{it.v}</Badge>
              </div>
            ))}
          </Accordion>
        );
      })}

      <Card title="দ্রুত টগল" sub="ORG_ADMIN ও MANAGER">
        {state.toggles.map((x) => (
          <div key={x.key} className="flex items-start gap-2 py-2 border-b border-line-2 last:border-b-0">
            <div className="grow">
              <b className="text-sm block">{x.t}</b>
              <div className="text-xs text-mut">{x.d}</div>
            </div>
            <button type="button" onClick={() => toggle(x.key)} aria-pressed={x.on}
              className={`min-h-tap shrink-0 px-3 rounded-r-pill border text-xs font-bold ${x.on ? 'bg-green-700 text-white border-green-800' : 'bg-card text-mut border-line-3'}`}>
              {x.on ? 'চালু' : 'বন্ধ'}
            </button>
          </div>
        ))}
      </Card>

      <Accordion title="পরিবর্তনের ইতিহাস" sub="সাম্প্রতিক ৩টি" right={<Badge tone="info">অডিট</Badge>}>
        {state.audit.filter((a) => a.entityBn.includes('সেটিংস')).slice(0, 3).map((a) => (
          <div key={a.id} className="py-2 border-b border-line-2 last:border-b-0">
            <b className="text-sm block">{a.refLabel}</b>
            <div className="text-xs">{a.before} → {a.after}</div>
            <div className="text-xs text-mut">{a.at} · {a.who}</div>
          </div>
        ))}
        <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => navigate(`/a/audit${roleQS}`)}>অডিট লগ →</Button>
      </Accordion>

      <Accordion title="ধ্বংসাত্মক সেটিংস" sub="উচ্চ সতর্কতা" right={<Trash2 size={16} className="text-danger-ink" />}>
        <Note tone="danger"><><b>সমিতির সব সেটিংস রিসেট</b> — স্কিম নীতি, ফি, অনুমোদন সীমা, নম্বর প্যাটার্ন সব ডিফল্টে ফিরবে। লেনদেনের ডেটা মুছবে না (R-02)।</></Note>
        <Field label="নিশ্চিত করতে নিবন্ধন নম্বর লিখুন" hint="খুলনা-২৩৪/২০১৯">
          {(fid) => <input id={fid} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass()} placeholder="খুলনা-২৩৪/২০১৯" />}
        </Field>
        <Button variant="danger" size="sm" className="mt-2" icon={<Trash2 size={14} />} disabled={confirm.trim() !== 'খুলনা-২৩৪/২০১৯'}
          onClick={() => { setErr(''); setMsg('রিসেট অনুরোধ — ORG_ADMIN দ্বিতীয় অনুমোদন লাগবে (ডেমো, কিছু বদলায়নি)'); }}>রিসেট করুন</Button>
        <p className="text-xs text-mut mt-2">টাইপ-টু-কনফার্ম না মিললে বোতাম সক্রিয় হয় না। রিসেটের পর সেটআপ চেকলিস্ট আবার চালু হবে।</p>
      </Accordion>

      <Note tone="warn"><><Shield size={14} className="inline -mt-0.5 mr-1" /><b>নীতি বদল মানে কমিটির সিদ্ধান্ত</b> — ফি, বিলম্ব ফি, গ্রেস, মওকুফ বা অনুমোদন সীমা বদলালে লিখিত কমিটির সিদ্ধান্ত নম্বর লাগবে (D-09), পরিবর্তন অডিট লগে before/after সহ থাকবে, সদস্য-প্রভাবী হলে সংস্করণসহ সম্মতি নিতে হবে (D-23)।</></Note>
      <Note tone="info"><><Lock size={14} className="inline -mt-0.5 mr-1" /><b>সুদ/মুনাফা সেটিংস নিষ্ক্রিয়</b> — “সুদ/মুনাফা নিষ্ক্রিয় (D-01)” একটি টগল নয়, এটি <b>লকড</b>; সঞ্চয় মডিউলে সুদ গণনার কোনো সুইচ নেই।</></Note>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Users size={15} />} onClick={() => navigate(`/a/staff${roleQS}`)}>স্টাফ</Button>
        <Button variant="secondary" className="grow" icon={<History size={15} />} onClick={() => navigate(`/a/audit${roleQS}`)}>অডিট লগ</Button>
        <Button className="grow" disabled={!notOk.length} onClick={() => setMsg('সব সেটআপ ধাপ সম্পন্ন ✓ (ডেমো)')}>সেটআপ সম্পন্ন</Button>
      </div>
      <SectionHead title="সেটআপ" sub={notOk.length ? `${bn(notOk.length)}টি বাকি` : 'সব সম্পন্ন'} />
    </div>
  );
}
