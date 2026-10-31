/* A-16 · সদস্য স্থানান্তর — রুট/শাখা, ভবিষ্যৎ তারিখ, প্রভাব ও ORG_ADMIN অনুমোদন */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { MV_STATUS } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';
import { Field, MemberSelect, gsMemberName } from './gsParts';

export default function GsMoves() {
  const { state, requestMove, approveMove } = useAdmin();
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [to, setTo] = useState(state.routes[1]?.id ?? 'R2');
  const [reason, setReason] = useState('');
  const [effAt, setEffAt] = useState('2026-11-05');
  const [approver, setApprover] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const submit = () => {
    const r = requestMove(memberId, to, reason, effAt);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setReason(''); }
  };
  const approve = (id: string) => {
    const r = approveMove(id, approver || 'ORG_ADMIN · সভাপতি');
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="সদস্য স্থানান্তর" sub="রুট/শাখা বদল · পুরনো ইতিহাস অপরিবর্তিত · ডেমো" back="/w/members">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'অপেক্ষমাণ', v: bn(state.moves.filter((m) => m.status === 'pending').length), tone: 'warn' },
        { k: 'অনুমোদিত', v: bn(state.moves.filter((m) => m.status === 'approved').length) },
        { k: 'কার্যকর', v: bn(state.moves.filter((m) => m.status === 'done').length), tone: 'ok' },
        { k: 'সদস্য সংখ্যা', v: bn(state.members.length) },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Card title="নতুন অনুরোধ" sub="কার্যকর তারিখ ভবিষ্যতের হতে হবে (R-05)">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><MemberSelect members={state.members} value={memberId} onChange={setMemberId} /></div>
              <Field label="গন্তব্য রুট">
                <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}>
                  {state.routes.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name} · {r.collector}</option>)}
                </select>
              </Field>
              <Field label="কার্যকর তারিখ">
                <input type="date" value={effAt} onChange={(e) => setEffAt(e.target.value)} className={`${inputCls} num`} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="কারণ" hint="অন্তত ৫ অক্ষর — অডিটে যাবে">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="ঠিকানা বদল / শ্বশুরবাড়ি / অন্য শাখা" />
                </Field>
              </div>
            </div>
            <div className="rounded-r-sm border border-info-bd bg-info-bg text-info-ink px-3 py-2 text-xs mt-3">
              প্রভাব: রুটভিত্তিক রিপোর্ট বদলাবে, পুরনো লেনদেনের ইতিহাস পুরনো রুটেই থাকবে, আজকের ক্যাশে কোনো প্রভাব নেই।
            </div>
            <Button className="mt-3" onClick={submit}>অনুরোধ জমা দিন</Button>
          </Card>

          <Card title="অনুরোধের তালিকা" sub="শাখা স্থানান্তরে ORG_ADMIN-এর নাম/সিদ্ধান্ত নম্বর দিন">
            <DataTable
              columns={[
                { key: 'no', head: 'নম্বর', render: (m) => <b className="num">{m.no}</b> },
                { key: 'member', head: 'সদস্য', render: (m) => gsMemberName(state.members, m.memberId) },
                { key: 'kind', head: 'ধরন', render: (m) => m.kindBn },
                { key: 'fromto', head: 'থেকে →', render: (m) => <span className="text-xs">{m.from} → {m.to}</span> },
                { key: 'eff', head: 'কার্যকর', render: (m) => <span className="num">{m.effAt}</span> },
                { key: 'st', head: 'অবস্থা', render: (m) => <Badge tone={MV_STATUS[m.status].tone}>{MV_STATUS[m.status].t}</Badge> },
                { key: 'act', head: '', align: 'right', render: (m) => m.status === 'pending'
                  ? <Button size="sm" variant="secondary" onClick={() => approve(m.id)}>অনুমোদন</Button>
                  : <span className="text-xs text-mut">—</span> },
              ]}
              rows={state.moves}
              empty="কোনো স্থানান্তর অনুরোধ নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="অনুমোদনকারী" sub="শাখা স্থানান্তরের জন্য বাধ্যতামূলক (D-35)">
            <Field label="ORG_ADMIN নাম / সিদ্ধান্ত নম্বর">
              <input value={approver} onChange={(e) => setApprover(e.target.value)} className={inputCls} placeholder="কামরুল হাসান · সিদ্ধান্ত ১২/২৬" />
            </Field>
          </Card>
          <Card title="প্রভাবের সারাংশ">
            {state.moves[0] && (
              <ul className="text-sm text-mut space-y-1.5">
                <li>• সংগ্রহক: {state.moves[0].impact.collector}</li>
                <li>• রিপোর্ট: {state.moves[0].impact.report}</li>
                <li>• ক্যাশ: {state.moves[0].impact.cash}</li>
                <li>• ইতিহাস: {state.moves[0].impact.history}</li>
              </ul>
            )}
          </Card>
          <Note tone="warn">একই সদস্য একাধিক রুটে থাকতে পারবেন না; পুরনো ডেটা ডিলিট হয় না।</Note>
          <Note>স্টাফ স্কোপ ও ভূমিকা পরিবর্তন হলে অডিট লগে যাবে (D-35 · R-02)।</Note>
        </div>
      </div>
    </Page>
  );
}
