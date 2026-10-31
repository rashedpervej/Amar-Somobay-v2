/* A-37 · স্টাফ, রোল ও পারমিশন — আমন্ত্রণ, সাসপেন্ড, সীমা ও অ্যাক্সেস লগ */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { LIMIT_MATRIX, PERM_MATRIX, PERM_ROLES, ROLE_BY_NAME, STAFF_STATUS } from '../../../domain/adminOps';
import { SEED_ACCESS } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';
import { Field } from './gsParts';

export default function GsStaff() {
  const { state, addStaff, suspendStaff } = useAdmin();
  const [f, setF] = useState({ name: '', role: 'COLLECTOR', mobile: '', scope: '' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const add = () => {
    const r = addStaff(f);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setF({ ...f, name: '', mobile: '', scope: '' }); }
  };
  const suspend = (id: string) => {
    const r = suspendStaff(id);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="স্টাফ ও পারমিশন" sub="ভূমিকা · স্কোপ · অনুমোদন সীমা · অ্যাক্সেস লগ · ডেমো" back="/w/settings">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'স্টাফ', v: bn(state.staff.length) },
        { k: 'সক্রিয়', v: bn(state.staff.filter((s) => s.status === 'active').length), tone: 'ok' },
        { k: 'আমন্ত্রিত', v: bn(state.staff.filter((s) => s.status === 'invited').length), tone: 'warn' },
        { k: 'নিষ্ক্রিয়', v: bn(state.staff.filter((s) => s.status === 'suspended').length), tone: 'danger' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="স্টাফ তালিকা" sub="নিষ্ক্রিয় করলে সেশন বাতিল হয়">
            <DataTable
              columns={[
                { key: 'name', head: 'নাম / ভূমিকা', render: (s) => <span>{s.name}<span className="block text-xs text-mut">{s.roleBn} · {s.role}</span></span> },
                { key: 'mobile', head: 'মোবাইল', render: (s) => <span className="num text-xs">{s.mobile}</span> },
                { key: 'scope', head: 'স্কোপ', render: (s) => <span className="text-xs">{s.scope}</span> },
                { key: 'limit', head: 'সীমা', align: 'right', render: (s) => <span className="num">{s.limit === null ? '—' : `৳${bn(s.limit)}`}</span> },
                { key: 'st', head: 'অবস্থা', render: (s) => <Badge tone={STAFF_STATUS[s.status].tone}>{STAFF_STATUS[s.status].t}</Badge> },
                { key: 'act', head: '', align: 'right', render: (s) => (
                  <Button size="sm" variant={s.status === 'suspended' ? 'secondary' : 'danger'} onClick={() => suspend(s.id)} disabled={s.status === 'suspended'}>নিষ্ক্রিয়</Button>
                ) },
              ]}
              rows={state.staff}
              empty="কোনো স্টাফ নেই"
            />
          </Card>

          <Card title="ভূমিকা অনুযায়ী অনুমতি" sub="C=তৈরি R=পড়া U=হালনাগাদ D=soft-delete A=অনুমোদন">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr><th className="px-3 py-2 text-left border-b border-line">এন্টিটি</th>
                    {PERM_ROLES.map((r) => <th key={r} className="px-2 py-2 border-b border-line text-center">{r}</th>)}</tr>
                </thead>
                <tbody>
                  {PERM_MATRIX.map((row) => (
                    <tr key={row.e}>
                      <td className="px-3 py-2 border-b border-line-2 font-bold whitespace-nowrap">{row.e}</td>
                      {row.c.map((c, i) => <td key={`${row.e}-${i}`} className="px-2 py-2 border-b border-line-2 text-center num">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="নতুন স্টাফ" sub="আমন্ত্রণ SMS যাবে (ডেমো)">
            <div className="space-y-3">
              <Field label="নাম"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} placeholder="পূর্ণ নাম" /></Field>
              <Field label="ভূমিকা">
                <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className={inputCls}>
                  {Object.entries(ROLE_BY_NAME).map(([k, v]) => <option key={k} value={k}>{v} · {k}</option>)}
                </select>
              </Field>
              <Field label="মোবাইল"><input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) })} className={`${inputCls} num`} placeholder="01XXXXXXXXX" inputMode="numeric" /></Field>
              <Field label="স্কোপ"><input value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} className={inputCls} placeholder="শাখা / রুট / সব শাখা" /></Field>
            </div>
            <Button block className="mt-3" onClick={add}>আমন্ত্রণ পাঠান</Button>
          </Card>

          <Card title="অনুমোদন সীমা" sub="D-22">
            {LIMIT_MATRIX.map((l) => (
              <div key={l.r} className="flex justify-between gap-2 py-1.5 border-b border-line-2 last:border-0 text-sm">
                <span>{l.r}<span className="block text-[11px] text-mut">{l.note}</span></span>
                <b className="num">{l.amt === null ? 'সীমা নেই' : `৳${bn(l.amt)}`}</b>
              </div>
            ))}
          </Card>

          <Card title="সাম্প্রতিক অ্যাক্সেস" sub="সফল ও ব্যর্থ লগইন">
            {SEED_ACCESS.map((a) => (
              <div key={`${a.who}-${a.at}`} className="py-1.5 border-b border-line-2 last:border-0 text-sm flex justify-between gap-2">
                <span>{a.who}<span className="block text-[11px] text-mut">{a.what} · {a.dev} · {a.at}</span></span>
                <Badge tone={a.ok ? 'ok' : 'danger'}>{a.ok ? 'সফল' : 'ব্যর্থ'}</Badge>
              </div>
            ))}
          </Card>
          <Note tone="warn">ORG_ADMIN ছাড়া অন্য কেউ স্টাফ যোগ/ভূমিকা বদলাতে পারবে না (D-35)।</Note>
        </div>
      </div>
    </Page>
  );
}
