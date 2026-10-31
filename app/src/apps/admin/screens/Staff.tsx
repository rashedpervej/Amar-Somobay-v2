/* ============================================================
   src/apps/admin/screens/Staff.tsx — AM-34 স্টাফ, রোল ও পারমিশন
   ৪ KPI · ব্যবহারকারী (নিষ্ক্রিয় করার আসল অ্যাকশন) · CRUDA ম্যাট্রিক্স ·
   অনুমোদন সীমা · অ্যাক্সেস লগ · নতুন স্টাফ ফর্ম · সেশন বাতিলের নীতি।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, History, Lock, Plus, Shield, UserX, Users } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { LIMIT_MATRIX, PERM_MATRIX, PERM_ROLES, ROLE_BY_NAME, STAFF_STATUS } from '../../../domain/adminOps';
import { Accordion, KV, Note } from './parts';

export default function StaffScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, addStaff, suspendStaff } = useAdmin();
  const [tab, setTab] = useState(PERM_ROLES[0]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('COLLECTOR');
  const [scope, setScope] = useState('R1');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const idx = PERM_ROLES.indexOf(tab);

  function add() {
    setMsg(''); setErr('');
    const r = addStaff({ name, role, mobile, scope });
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message); setName(''); setMobile('');
  }
  function suspend(id: string) {
    setMsg(''); setErr('');
    const r = suspendStaff(id);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <KpiGrid>
        <Kpi label="সক্রিয়" value={bn(state.staff.filter((s) => s.status === 'active').length)} tone="ok" note="লগইন করতে পারেন" />
        <Kpi label="নিষ্ক্রিয়" value={bn(state.staff.filter((s) => s.status === 'suspended').length)} tone="danger" note="তদন্তাধীন" />
        <Kpi label="আমন্ত্রিত / মেয়াদি" value={bn(state.staff.filter((s) => s.status === 'invited' || s.status === 'timeboxed').length)} tone="warn" note="লগইন বাকি বা মেয়াদি" />
        <Kpi label="ORG_ADMIN" value={bn(state.staff.filter((s) => s.role === 'ORG_ADMIN').length)} tone="ok" note="কমপক্ষে ১ জন বাধ্যতামূলক" />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg}>ডেমো — সেশন/পারমিশন বাস্তবে বদলায়নি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Card title="ব্যবহারকারী" sub={`${bn(state.staff.length)} জন`}>
        {state.staff.map((u) => (
          <div key={u.id} className="flex items-start gap-2 py-2.5 border-b border-line-2 last:border-b-0">
            <span className="w-9 h-9 rounded-full bg-green-100 text-green-800 grid place-items-center font-extrabold shrink-0">{u.name.slice(0, 1)}</span>
            <div className="grow min-w-0">
              <b className="text-sm block">{u.name}</b>
              <div className="text-xs text-mut">{u.roleBn} · <a href={`tel:${u.mobile}`} className="text-green-700 underline">{u.mobile}</a></div>
              <div className="text-xs text-mut">স্কোপ: {u.scope}{u.since ? ` · যোগদান ${u.since}` : ''}{u.invitedAt ? ` · আমন্ত্রণ ${u.invitedAt}` : ''}{u.last ? ` · শেষ লগইন ${u.last}` : ' · লগইন করেননি'}</div>
              {u.note ? <div className="text-xs text-danger-ink">{u.note}</div> : null}
              <div className="text-xs text-mut mt-1">অনুমোদন সীমা: <b>{u.limit === null ? 'সীমা নেই' : `৳${bn(u.limit)}`}</b></div>
              <div className="flex gap-2 mt-1.5">
                <Badge tone={STAFF_STATUS[u.status].tone}>{STAFF_STATUS[u.status].t}</Badge>
                <Button size="sm" variant="ghost" icon={<UserX size={13} />} disabled={u.status === 'suspended'} onClick={() => suspend(u.id)}>নিষ্ক্রিয়</Button>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card title="CRUDA পারমিশন ম্যাট্রিক্স" sub={`${bn(PERM_MATRIX.length)} × ${bn(PERM_ROLES.length)}`}>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {PERM_ROLES.map((r) => (
            <button key={r} type="button" onClick={() => setTab(r)}
              className={`min-h-tap shrink-0 px-2.5 rounded-r-pill border text-xs font-bold ${tab === r ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>{r}</button>
          ))}
        </div>
        <div className="mt-2 divide-y divide-line-2">
          {PERM_MATRIX.map((row) => {
            const c = row.c[idx] ?? '—';
            return (
              <div key={row.e} className="flex items-center gap-2 py-2">
                <Shield size={14} className={c === '—' ? 'text-mut' : c.includes('A') ? 'text-ok-ink' : 'text-info-ink'} />
                <span className="grow text-sm">{row.e}</span>
                <Badge tone={c === '—' ? 'neutral' : c.includes('A') ? 'ok' : 'info'}>{c}</Badge>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-mut mt-2">A = অনুমোদন ক্ষমতা, কিন্তু maker ≠ checker: যিনি এন্ট্রি করেছেন তিনি সেই এন্ট্রি অনুমোদন করতে পারবেন না (BR-04)। D = soft-delete; কোনো ডেটা সত্যিকারে মুছে ফেলা যায় না (R-02)।</p>
      </Card>

      <Accordion title="অনুমোদন সীমা (D-22)" sub={`${bn(LIMIT_MATRIX.length)}টি ভূমিকা`}>
        {LIMIT_MATRIX.map((r) => (
          <KV key={r.r} k={<span><b>{r.r}</b><span className="block text-xs text-mut">{r.note}</span></span>}
            v={r.amt === null ? 'সীমা নেই' : `৳${bn(r.amt)}`} />
        ))}
        <Note tone="warn">সীমা কমানো যাবে সঙ্গে সঙ্গে (ঝুঁকি কমে), কিন্তু বাড়াতে লিখিত কমিটির সিদ্ধান্ত ও অডিট লগ লাগবে।</Note>
      </Accordion>

      <Accordion title="সাম্প্রতিক অ্যাক্সেস লগ" sub={`${bn(state.staff.length)} জন ব্যবহারকারী`}>
        {state.audit.filter((a) => a.action === 'login').map((l) => (
          <div key={l.id} className="py-2 border-b border-line-2 last:border-b-0">
            <b className="text-sm block">{l.who} · {l.refLabel}</b>
            <div className="text-xs text-mut">{l.at} · {l.role} · {l.dev} · {l.ip}</div>
            {l.alert ? <div className="text-xs text-danger-ink">{l.alert}</div> : null}
            <Badge tone={l.result === 'success' ? 'ok' : 'danger'}>{l.result === 'success' ? 'সফল' : 'ব্যর্থ'}</Badge>
          </div>
        ))}
      </Accordion>

      <Card title="নতুন স্টাফ যোগ করুন" sub="ভূমিকা + স্কোপ + সীমা — ডিফল্টে কোনো পারমিশন নেই">
        <Field label="নাম" required>{(fid) => <input id={fid} value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} placeholder="পূর্ণ নাম" />}</Field>
        <Field label="মোবাইল" required hint="01XXXXXXXXX — প্রথম লগইনে OTP">{(fid) => <input id={fid} inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))} className={inputClass()} placeholder="01711000099" />}</Field>
        <Field label="ভূমিকা" required>
          {() => (
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(ROLE_BY_NAME).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`min-h-tap px-2.5 rounded-r-pill border text-xs font-bold ${role === r ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>{r}</button>
              ))}
            </div>
          )}
        </Field>
        <Field label="স্কোপ" required hint="শাখা / রুট">{(fid) => <input id={fid} value={scope} onChange={(e) => setScope(e.target.value)} className={inputClass()} />}</Field>
        <Button className="w-full mt-2" icon={<Plus size={15} />} onClick={add}>আমন্ত্রণ পাঠান</Button>
      </Card>

      <Note tone="danger"><><b>স্টাফ নিষ্ক্রিয় করলে সঙ্গে সঙ্গে যা হবে</b> — সেশন বাতিল, অফলাইন কিউতে থাকা তাঁর এন্ট্রি sync হবে না, ঝুলন্ত অনুমোদন ম্যানেজারের কিউতে ফিরে যাবে — এবং পুরো ঘটনা অডিট লগে থাকবে।</></Note>

      <SectionHead title="ভূমিকা" sub={`${bn(PERM_ROLES.length)}টি · স্কোপ ছাড়া পারমিশন নয়`} />
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(ROLE_BY_NAME).map(([k, v]) => <Badge key={k} tone="neutral">{k} · {v}</Badge>)}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<History size={15} />} onClick={() => navigate(`/a/audit${roleQS}`)}>অডিট লগ</Button>
        <Button variant="secondary" className="grow" icon={<Lock size={15} />} onClick={() => navigate(`/a/settings${roleQS}`)}>সেটিংস</Button>
        <Button className="grow" icon={<Users size={15} />} onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য</Button>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-mut"><Check size={13} /> সব সীমা ডেমো ডেটা — বাস্তব RBAC পরে সার্ভার-সাইড।</div>
    </div>
  );
}
