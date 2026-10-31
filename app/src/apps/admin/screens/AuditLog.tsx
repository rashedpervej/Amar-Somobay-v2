/* ============================================================
   src/apps/admin/screens/AuditLog.tsx — AM-35 অডিট লগ
   বেগুনি হিরো (অপরিবর্তনীয়) · ৪ KPI · অ্যালার্ট ব্লক · ছাঁকনি (সময়/ক্রিয়া/
   ভূমিকা/ব্যবহারকারী/ফল) · এন্ট্রি তালিকা · CSV/PDF এক্সপোর্ট (আসল ফাইল)।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Download, Filter, Lock, Printer, RefreshCw, WifiOff } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { AUDIT_ACTIONS, PERM_ROLES, SEED_AUDIT_META, auditStats } from '../../../domain/adminOps';
import { Accordion, Hero, Note } from './parts';

const TIMES = ['আজ', '৭ দিন', 'এই মাস', 'সব'] as const;
const RESULTS = ['সব', 'সফল', 'ব্যর্থ'] as const;

export default function AuditLog() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state } = useAdmin();
  const st = auditStats(state.audit);
  const [time, setTime] = useState<(typeof TIMES)[number]>('আজ');
  const [res, setRes] = useState<(typeof RESULTS)[number]>('সব');
  const [role, setRole] = useState('সব ভূমিকা');
  const [who, setWho] = useState('সবাই');
  const [ref, setRef] = useState('');
  const [msg, setMsg] = useState('');

  const list = useMemo(() => state.audit.filter((l) => {
    const okT = time === 'সব' ? true : time === 'আজ' ? l.at.startsWith('২০২৬-১০-৩১') : true;
    const okR = res === 'সব' ? true : res === 'সফল' ? l.result === 'success' : l.result !== 'success';
    const okRole = role === 'সব ভূমিকা' || l.role === role;
    const okWho = who === 'সবাই' || l.who === who;
    const okRef = !ref.trim() || `${l.ref} ${l.refLabel}`.toLowerCase().includes(ref.trim().toLowerCase());
    return okT && okR && okRole && okWho && okRef;
  }), [state.audit, time, res, role, who, ref]);

  function exportCsv() {
    const head = ['সময়', 'কে', 'ভূমিকা', 'ক্রিয়া', 'সত্ত্বা', 'রেফারেন্স', 'আগে', 'পরে', 'ফল', 'ডিভাইস', 'আইপি'];
    const rows = list.map((l) => [l.at, l.who, l.role, l.actionBn, l.entityBn, `${l.ref} ${l.refLabel}`, l.before, l.after, l.result === 'success' ? 'সফল' : 'ব্যর্থ', l.dev, l.ip]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    try {
      const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = `audit-log-${list.length}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMsg(`CSV তৈরি হয়েছে — ${bn(list.length)}টি এন্ট্রি (ডেমো ডেটা)।`);
    } catch {
      setMsg(`CSV প্রস্তুত — ${bn(list.length)}টি এন্ট্রি (এই পরিবেশে ফাইল ডাউনলোড সীমিত)।`);
    }
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <div className="rounded-r-md bg-gradient-to-br from-purple-ink to-purple text-white px-4 py-4">
        <div className="text-xs opacity-85">অপরিবর্তনীয় অডিট লগ (D-30)</div>
        <div className="num text-[29px] font-extrabold leading-tight">{bn(SEED_AUDIT_META.total)} <span className="text-[15px] opacity-80">এন্ট্রি</span></div>
        <div className="text-sm opacity-90 mt-1">সবচেয়ে পুরনো এন্ট্রি {SEED_AUDIT_META.oldest} · সংরক্ষণ {bn(SEED_AUDIT_META.years)} বছর</div>
        <div className="text-sm opacity-90">{SEED_AUDIT_META.note}</div>
      </div>

      <KpiGrid>
        <Kpi label="আজকের এন্ট্রি" value={bn(st.today)} note={`${bn(state.audit.filter((l) => l.at.startsWith('২০২৬-১০-৩১') && l.result === 'success').length)} সফল`} />
        <Kpi label="ব্যর্থ চেষ্টা" value={bn(st.failed)} tone={st.failed ? 'danger' : 'ok'} note="লগে সংরক্ষিত" />
        <Kpi label="অফলাইন → sync" value={bn(st.offline)} tone="warn" note="ডিভাইস ট্যাগসহ" />
        <Kpi label="অ্যালার্ট" value={bn(st.alerts)} tone={st.alerts ? 'danger' : 'ok'} note="নিরাপত্তা ও নগদ পার্থক্য" />
      </KpiGrid>

      {st.alerts ? (
        <Card title={`অ্যালার্ট ${bn(st.alerts)}টি`} sub="নিরীক্ষকের জন্য" right={<Badge tone="danger">যাচাই</Badge>}>
          {state.audit.filter((l) => l.alert).map((l) => (
            <div key={l.id} className="text-xs text-danger-ink py-1">
              <b>{l.alert}</b> · {l.actionBn} · {l.refLabel} — {l.before === '—' ? l.after : `${l.before} → ${l.after}`}
            </div>
          ))}
          <p className="text-xs text-mut mt-1">অ্যালার্ট নিয়ম কাস্টমাইজ করা যাবে (পরে): যেমন “একই ব্যবহারকারী ৫ মিনিটে ১০টি সংশোধন করলে”।</p>
        </Card>
      ) : null}

      {msg ? <SuccessBanner title={msg}>ডেমো — ফাইলটি ব্রাউজারেই তৈরি।</SuccessBanner> : null}

      <Card title="ফিল্টার" sub={`${bn(list.length)}টি এন্ট্রি দেখানো হচ্ছে`}>
        <div className="text-sm font-bold mb-1">সময়</div>
        <Chipset>{TIMES.map((x) => <Chip key={x} active={time === x} onClick={() => setTime(x)}>{x}</Chip>)}</Chipset>
        <div className="text-sm font-bold mb-1 mt-3">ক্রিয়ার ধরন</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(AUDIT_ACTIONS).map(([k, v]) => (
            <Badge key={k} tone={v.tone === 'ok' ? 'ok' : v.tone === 'danger' ? 'danger' : v.tone === 'warn' ? 'warn' : 'neutral'}>{v.t}</Badge>
          ))}
        </div>
        <div className="mt-3">
          <Field label="ভূমিকা">
            {(fid) => (
              <select id={fid} value={role} onChange={(e) => setRole(e.target.value)} className={inputClass()}>
                <option>সব ভূমিকা</option>
                {PERM_ROLES.map((r) => <option key={r}>{r}</option>)}
                <option>SYSTEM</option>
              </select>
            )}
          </Field>
          <Field label="ব্যবহারকারী">
            {(fid) => (
              <select id={fid} value={who} onChange={(e) => setWho(e.target.value)} className={inputClass()}>
                <option>সবাই</option>
                {[...new Set(state.audit.map((l) => l.who))].map((w) => <option key={w}>{w}</option>)}
              </select>
            )}
          </Field>
          <Field label="এন্টিটি / রেফারেন্স" hint="সদস্য নম্বর, লেনদেন আইডি বা রেফারেন্স">
            {(fid) => <input id={fid} value={ref} onChange={(e) => setRef(e.target.value)} className={inputClass()} placeholder="TXN-8827 / RSS-…" />}
          </Field>
        </div>
        <div className="text-sm font-bold mb-1 mt-3">ফলাফল</div>
        <Chipset>{RESULTS.map((x) => <Chip key={x} active={res === x} onClick={() => setRes(x)}>{x}</Chip>)}</Chipset>
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" className="grow" onClick={() => { setTime('সব'); setRes('সব'); setRole('সব ভূমিকা'); setWho('সবাই'); setRef(''); setMsg('ফিল্টার রিসেট'); }}>রিসেট</Button>
          <Button className="grow" icon={<Filter size={15} />} onClick={() => setMsg(`${bn(list.length)}টি এন্ট্রি ফিল্টার হয়েছে`)}>ফিল্টার করুন</Button>
        </div>
      </Card>

      <Card title="সাম্প্রতিক এন্ট্রি" sub={`${bn(list.length)}টি দেখানো (পেজ ১/${bn(Math.ceil(SEED_AUDIT_META.total / 10))})`}>
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="secondary" className="grow" icon={<Download size={14} />} onClick={exportCsv}>CSV এক্সপোর্ট</Button>
          <Button size="sm" variant="ghost" className="grow" icon={<Printer size={14} />} onClick={() => { setMsg('PDF প্রস্তুত (ডেমো)'); window.print(); }}>PDF</Button>
        </div>
        {list.length === 0 ? <p className="text-sm text-mut">এই ফিল্টারে কোনো এন্ট্রি নেই।</p> : null}
        {list.map((l) => {
          const a = AUDIT_ACTIONS[l.action];
          return (
            <div key={l.id} className="py-3 border-b border-line-2 last:border-b-0 flex items-start gap-2">
              <span className={`mt-0.5 w-8 h-8 rounded-full grid place-items-center shrink-0 ${l.result === 'success' ? (l.action === 'reject' || l.action === 'reverse' ? 'bg-danger-bg text-danger-ink' : 'bg-green-050 text-green-800') : 'bg-danger-bg text-danger-ink'}`}>
                <Lock size={14} />
              </span>
              <div className="grow min-w-0">
                <b className="text-sm block">{l.actionBn} · {l.entityBn}</b>
                <div className="text-xs text-mut">{l.who} · {l.role} · {l.at}</div>
                <div className="text-xs mt-1"><span className="text-mut">{l.ref}</span> · {l.refLabel}</div>
                {l.before !== '—' || l.after !== '—' ? (
                  <div className="text-xs mt-1 bg-neutral-bg rounded-r-sm px-2 py-1.5"><s className="text-mut">{l.before}</s> → <b>{l.after}</b></div>
                ) : null}
                <div className="text-xs text-mut mt-1">{l.dev}{l.ip !== '—' ? ` · ${l.ip}` : ''}</div>
                {l.note ? <div className="text-xs text-warn-ink">{l.note}</div> : null}
                {l.alert ? <div className="text-xs text-danger-ink">{l.alert}</div> : null}
              </div>
              <div className="shrink-0 text-right space-y-1">
                <Badge tone={a.tone === 'ok' ? 'ok' : a.tone === 'danger' ? 'danger' : a.tone === 'warn' ? 'warn' : 'neutral'}>{a.t}</Badge>
                {l.tag ? <div className="text-xs text-info-ink"><WifiOff size={11} className="inline" /> {l.tag}</div> : null}
                {l.result !== 'success' ? <div className="text-xs text-danger-ink">ব্যর্থ</div> : null}
              </div>
            </div>
          );
        })}
      </Card>

      <Accordion title="লগের নিয়ম ও সীমা" sub="৩টি নোট">
        <Note tone="danger"><><b>ব্যর্থ চেষ্টাও লগে থাকে</b> — অনুমোদন ব্যর্থ, ভুল পিন, এক্সপোর্ট ব্যর্থ — সবকিছু সংরক্ষিত; কে কী করার চেষ্টা করেছিল তা নিরীক্ষক দেখতে পারেন।</></Note>
        <Note tone="info"><><b>শুধু পঠন — এমনকি ORG_ADMIN-এর জন্যও</b> — লগ বদলানো বা মোছার কোনো API নেই; ভুল এন্ট্রির সংশোধন আলাদা এন্ট্রি হিসেবেই যোগ হয় (R-02)।</></Note>
        <Note tone="warn"><><b>সম্পূর্ণ লগ এক্সপোর্ট ব্যাকগ্রাউন্ডে</b> — {bn(SEED_AUDIT_META.total)} এন্ট্রির CSV মোবাইলে ডাউনলোড না করে ব্যাকগ্রাউন্ড জবে হবে; তৈরি হলে নোটিফিকেশনে লিংক।</></Note>
      </Accordion>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Filter size={15} />} onClick={() => setMsg('ফিল্টার প্যানেল উপরে খোলা আছে')}>ফিল্টার</Button>
        <Button variant="ghost" className="grow" icon={<Download size={15} />} onClick={exportCsv}>এক্সপোর্ট</Button>
        <Button variant="secondary" className="grow" icon={<RefreshCw size={15} />} onClick={() => navigate(`/a/finance${roleQS}`)}>রিপোর্ট সারাংশ</Button>
      </div>

      <SectionHead title="ডেমো নোট" sub="অডিট লগ ডেমো ডেটা" />
      <div className="flex items-center gap-1.5 text-xs text-mut"><AlertTriangle size={13} /> কোনো এন্ট্রি বদলানো যায় না — এই সেশনের অ্যাকশনও উপরে যোগ হয়।</div>
    </div>
  );
}
