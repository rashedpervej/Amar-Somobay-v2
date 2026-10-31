/* A-38 · অডিট লগ — অপরিবর্তনীয় এন্ট্রি, ফিল্টার ও বিস্তারিত */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { AUDIT_ACTIONS, SEED_AUDIT_META, auditStats } from '../../../domain/adminOps';
import { Chips, Note, Page, StatBar } from './webParts';

export default function GsAudit() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [act, setAct] = useState('all');
  const [sel, setSel] = useState(state.audit[0]?.id ?? '');
  const rows = state.audit.filter((a) => (act === 'all' || a.action === act)
    && (q.trim() === '' || `${a.who} ${a.ref} ${a.refLabel} ${a.entityBn}`.includes(q.trim())));
  const e = state.audit.find((x) => x.id === sel) ?? rows[0] ?? state.audit[0];
  const stats = auditStats(state.audit);

  return (
    <Page title="অডিট লগ" sub={`${bn(SEED_AUDIT_META.total)} এন্ট্রি · ${bn(SEED_AUDIT_META.years)} বছর · ${SEED_AUDIT_META.note} · ডেমো`} back="/w/dashboard"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/reports')}>এক্সপোর্ট রিপোর্ট</Button>}>
      <StatBar items={[
        { k: 'আজকের এন্ট্রি', v: bn(stats.today) },
        { k: 'ব্যর্থ', v: bn(stats.failed), tone: stats.failed ? 'danger' : 'ok' },
        { k: 'অফলাইন সিঙ্ক', v: bn(stats.offline) },
        { k: 'সতর্কতা', v: bn(stats.alerts), tone: stats.alerts ? 'warn' : 'ok' },
      ]} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">খুঁজুন</span>
          <input value={q} onChange={(e2) => setQ(e2.target.value)} placeholder="কে / রেফ / এন্টিটি" className={`${inputCls} mt-1`} /></label>
        <div><span className="text-xs font-bold text-mut block mb-1">ক্রিয়া</span>
          <Chips value={act} onChange={setAct} items={[['all', 'সব'], ...Object.entries(AUDIT_ACTIONS).map(([k, v]) => [k, v.t] as [string, string])]} /></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card title="লগ তালিকা" sub={`${bn(rows.length)}টি এন্ট্রি দেখানো হচ্ছে`}>
          <DataTable
            columns={[
              { key: 'at', head: 'সময়', render: (a) => <span className="num text-xs">{a.at}</span> },
              { key: 'who', head: 'ব্যক্তি', render: (a) => <span>{a.who}<span className="block text-xs text-mut">{a.role}</span></span> },
              { key: 'act', head: 'ক্রিয়া', render: (a) => <Badge tone={AUDIT_ACTIONS[a.action].tone}>{a.actionBn}</Badge> },
              { key: 'ent', head: 'এন্টিটি / রেফ', render: (a) => <span>{a.entityBn}<span className="block text-xs text-mut num">{a.ref}</span></span> },
              { key: 'res', head: 'ফল', render: (a) => <Badge tone={a.result === 'success' ? 'ok' : 'danger'}>{a.result === 'success' ? 'সফল' : 'ব্যর্থ'}</Badge> },
              { key: 'act2', head: '', align: 'right', render: (a) => <Button size="sm" variant="secondary" onClick={() => setSel(a.id)}>বিস্তারিত</Button> },
            ]}
            rows={rows}
            empty="কোনো লগ নেই"
          />
        </Card>

        {e && (
          <div className="space-y-3">
            <Card title={`${e.actionBn} · ${e.ref}`} sub={`${e.at} · ${e.who} · ডেমো`}
              right={<Badge tone={AUDIT_ACTIONS[e.action].tone}>{e.actionBn}</Badge>}>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p>এন্টিটি: <b>{e.entityBn}</b></p>
                <p>ব্যক্তি: <b>{e.who}</b></p>
                <p>ভূমিকা: <b>{e.role}</b></p>
                <p>ফল: <b>{e.result === 'success' ? 'সফল' : 'ব্যর্থ'}</b></p>
                <p className="sm:col-span-2">বিষয়: <b>{e.refLabel}</b></p>
                <p>ডিভাইস: <b>{e.dev}</b></p>
                <p>IP: <b className="num">{e.ip}</b></p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                <div className="rounded-r-sm border border-line bg-card-2 px-3 py-2 text-sm"><span className="text-xs text-mut block">আগে</span><b>{e.before}</b></div>
                <div className="rounded-r-sm border border-ok-bd bg-ok-bg px-3 py-2 text-sm"><span className="text-xs text-mut block">পরে</span><b>{e.after}</b></div>
              </div>
              {e.note && <p className="text-xs text-mut mt-2">নোট: {e.note}</p>}
              {e.alert && <p className="text-xs text-danger-ink mt-2">{e.alert}</p>}
              {e.tag && <p className="text-xs text-info-ink mt-2">{e.tag}</p>}
            </Card>
            <Card title="লগের নীতি" sub="R-02 · D-30">
              <ul className="text-sm text-mut space-y-1.5">
                <li>• কোনো এন্ট্রি বদলানো বা মোছার API নেই।</li>
                <li>• আর্কাইভ মেয়াদ ৮ বছর; কমানোর সুযোগ নেই।</li>
                <li>• প্রতিটি সিদ্ধান্তে আগে/পরে ও কারণ সংরক্ষিত।</li>
                <li>• এক্সপোর্টও অডিটে আলাদা এন্ট্রি তৈরি করে।</li>
              </ul>
            </Card>
            <Note tone="warn">এই ডেমো লগে বাস্তব ব্যবহারকারীর তথ্য নেই — সব নমুনা।</Note>
          </div>
        )}
      </div>
    </Page>
  );
}
