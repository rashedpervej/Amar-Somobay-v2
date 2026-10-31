import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { QH_APP_ST, qhQueue, qhSlaBreaches, qhPurposeLabel } from '../../../domain/adminQard';
import { Chips, Note, Page, StatBar } from './webParts';
import { memName } from './qhParts';

export default function QhWebQueue() {
  const { state } = useAdminQh();
  const nav = useNavigate();
  const [st, setSt] = useState('all');
  const [q, setQ] = useState('');
  const all = qhQueue(state.apps);
  const breaches = qhSlaBreaches(state.apps);
  const rows = all.filter((a) => (st === 'all' || a.status === st) && (q.trim() === '' || a.no.includes(q) || memName(a.memberId).includes(q)));

  return (
    <Page title="আবেদন কিউ" sub="SLA ৫ কার্যদিবস · বাল্ক অনুমোদন নেই — প্রতিটি আবেদন আলাদা সিদ্ধান্ত (BR-22)"
      back="/w/qh" right={<Button size="sm" variant="secondary" onClick={() => nav('/w/qh/window')}>জানালা ও কোটা</Button>}>
      <StatBar items={[
        { k: 'কিউতে', v: bn(all.length) },
        { k: 'পর্যালোচনা', v: bn(state.apps.filter((a) => a.status === 'review').length), tone: 'warn' },
        { k: 'ফেরত', v: bn(state.apps.filter((a) => a.status === 'returned').length) },
        { k: 'SLA লঙ্ঘন', v: bn(breaches.length), tone: breaches.length ? 'danger' : 'ok' },
      ]} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="আবেদন নম্বর বা সদস্য" className={`${inputCls} mt-1`} />
        </label>
        <div><span className="text-xs font-bold text-mut block mb-1">অবস্থা</span>
          <Chips value={st} onChange={setSt} items={[['all', 'সব'], ...Object.entries(QH_APP_ST).map(([k, v]) => [k, v.t] as [string, string])]} />
        </div>
      </div>
      {breaches.length > 0 && <Note tone="warn">SLA লঙ্ঘন: {breaches.map((a) => a.no).join(', ')} — অগ্রাধিকার দিন; তবে সিদ্ধান্তের গুণমান কমাবেন না।</Note>}
      <Card title="আবেদন তালিকা" sub={`${bn(rows.length)}টি · জমা তারিখ অনুযায়ী · SLA আগে`}>
        <DataTable
          columns={[
            {
              key: 'no', head: 'আবেদন', render: (r) => (
                <button type="button" onClick={() => nav(`/w/qh/applications/${r.id}`)} className="min-h-10 text-left">
                  <b className="num text-green-800 hover:underline">{r.no}</b>
                  <span className="block text-xs text-mut">{r.submittedAt} · {r.channel === 'office' ? 'অফিস' : r.channel === 'app' ? 'অ্যাপ' : 'মাঠ'}</span>
                </button>
              ),
            },
            { key: 'member', head: 'সদস্য', render: (r) => <><b>{memName(r.memberId)}</b><span className="block text-xs text-mut">{r.memberId}</span></> },
            { key: 'purpose', head: 'উদ্দেশ্য', render: (r) => qhPurposeLabel(r.purpose) },
            { key: 'amount', head: 'আবেদিত', align: 'right', render: (r) => `৳${bn(r.amount)}` },
            { key: 'max', head: 'স্ন্যাপশট সীমা', align: 'right', render: (r) => `৳${bn(r.snapshot.maxAmount)}` },
            { key: 'sla', head: 'SLA', align: 'center', render: (r) => <Badge tone={r.slaBreached ? 'danger' : r.sla <= 2 ? 'warn' : 'ok'}>{bn(r.sla)} দিন</Badge> },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={QH_APP_ST[r.status].tone}>{QH_APP_ST[r.status].t}</Badge> },
            { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/applications/${r.id}`)}>বিস্তারিত</Button> },
          ]}
          rows={rows}
          empty="এই ফিল্টারে কোনো আবেদন নেই"
        />
      </Card>
      <Note>একসাথে অনেক আবেদন অনুমোদন করা যায় না (বাল্ক নেই) — প্রতিটির স্ন্যাপশট, নথি ও সীমা আলাদা যাচাই করতে হবে।</Note>
    </Page>
  );
}
