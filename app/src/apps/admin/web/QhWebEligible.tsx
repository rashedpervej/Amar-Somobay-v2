import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { QH_BLOCK, QH_ELIG_ST, QH_SRC } from '../../../domain/adminQard';
import { Chips, Note, Page, StatBar } from './webParts';
import { memName } from './qhParts';

export default function QhWebEligible() {
  const { state } = useAdminQh();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [res, setRes] = useState('all');
  const [src, setSrc] = useState('all');
  const rows = state.eligible.filter((e) => {
    const name = memName(e.memberId);
    return (res === 'all' || e.result === res) && (src === 'all' || e.source === src) && (q.trim() === '' || name.includes(q) || e.memberId.includes(q));
  });

  return (
    <Page title="যোগ্য সদস্য তালিকা ব্যবস্থাপনা" sub="স্বয়ংক্রিয় নিয়ম · ম্যানুয়াল তালিকা · শর্তসাপেক্ষ এক্সেপশন — সীমা সহ"
      back="/w/qh" right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/rules')}>এক্সেপশন দিন</Button><Button size="sm" onClick={() => nav('/w/qh/simulation')}>Simulation</Button></>}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">সদস্য খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা আইডি" className={`${inputCls} mt-1`} />
        </label>
        <div><span className="text-xs font-bold text-mut block mb-1">ফল</span><Chips value={res} onChange={setRes} items={[['all', 'সব'], ['eligible', 'যোগ্য'], ['conditional', 'শর্তসাপেক্ষ'], ['blocked', 'অযোগ্য']]} /></div>
        <div><span className="text-xs font-bold text-mut block mb-1">উৎস</span><Chips value={src} onChange={setSrc} items={[['all', 'সব'], ['rule', 'নিয়ম'], ['manual', 'ম্যানুয়াল'], ['manual_exception', 'এক্সেপশন']]} /></div>
      </div>

      <StatBar items={[
        { k: 'যোগ্য', v: bn(state.eligible.filter((e) => e.result === 'eligible').length), tone: 'ok' },
        { k: 'শর্তসাপেক্ষ', v: bn(state.eligible.filter((e) => e.result === 'conditional').length), tone: 'warn' },
        { k: 'অযোগ্য', v: bn(state.eligible.filter((e) => e.result === 'blocked').length), tone: 'danger' },
        { k: 'মোট সীমা', v: `৳${bn(state.eligible.reduce((n, e) => n + e.maxAmount, 0))}` },
      ]} />

      <Card title="যোগ্যতা তালিকা" sub={`${bn(rows.length)} জন · নিয়ম সংস্করণ v${bn(state.versions[0]?.no ?? 3)} · বৈধতা ${state.eligible[0]?.validUntil ?? '—'}`}>
        <DataTable
          columns={[
            { key: 'member', head: 'সদস্য', render: (r) => <><b>{memName(r.memberId)}</b><span className="block text-xs text-mut">{r.memberId}</span></> },
            { key: 'st', head: 'ফল', render: (r) => <Badge tone={QH_ELIG_ST[r.result].tone}>{QH_ELIG_ST[r.result].t}</Badge> },
            { key: 'src', head: 'উৎস', render: (r) => <Badge tone={QH_SRC[r.source].tone}>{QH_SRC[r.source].t}</Badge> },
            { key: 'max', head: 'সীমা', align: 'right', render: (r) => <b className="num">৳{bn(r.maxAmount)}</b> },
            {
              key: 'reasons', head: 'কারণ', render: (r) => r.reasons.length
                ? <span className="text-xs">{r.reasons.map((x) => QH_BLOCK[x]?.a ?? x).join(' · ')}</span>
                : <span className="text-xs text-ok-ink">সব শর্ত পূরণ</span>,
            },
            { key: 'note', head: 'মন্তব্য', render: (r) => <span className="text-xs text-mut">{r.note}</span> },
            { key: 'date', head: 'মূল্যায়ন', render: (r) => <>{r.evaluatedAt}<span className="block text-xs text-mut">→ {r.validUntil}</span></> },
          ]}
          rows={rows}
          empty="এই ফিল্টারে কেউ নেই"
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Note>যোগ্যতা স্ন্যাপশট আবেদনের সময়ে জমা হয় — পরে নিয়ম বদলালেও পুরোনো আবেদনের স্ন্যাপশট অপরিবর্তিত (BR-21)।</Note>
        <Note tone="warn">ম্যানুয়াল এক্সেপশন শুধু কমিটি রেফারেন্সসহ (CM-YYMM-##); সীমা বাড়লেও নিয়মের অন্যান্য শর্ত প্রযোজ্য।</Note>
      </div>
    </Page>
  );
}
