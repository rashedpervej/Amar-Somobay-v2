import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { SCH_STATUS } from '../../../domain/adminOps';
import { Chips, Note, Page, StatBar } from './webParts';
import { gsDueLeft } from './gsParts';

export default function GsSchemes() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const [st, setSt] = useState('all');
  const [q, setQ] = useState('');
  const rows = state.schemes.filter((s) => (st === 'all' || s.status === st) && (q.trim() === '' || `${s.name} ${s.code}`.includes(q)));
  const totalMembers = state.schemes.reduce((n, s) => n + s.members, 0);
  const total = state.schemes.reduce((n, s) => n + s.total, 0);

  return (
    <Page title="স্কিম তালিকা" sub="সঞ্চয় স্কিম · সংস্করণ · সদস্য ও স্থিতি — পরিবর্তন মানেই নতুন সংস্করণ (BR-21)"
      back="/w/dashboard"
      right={<Button icon={<Plus size={15} />} onClick={() => nav('/w/schemes/new')}>নতুন স্কিম</Button>}>
      <StatBar items={[
        { k: 'মোট স্কিম', v: bn(state.schemes.length) },
        { k: 'চালু', v: bn(state.schemes.filter((s) => s.status === 'active').length), tone: 'ok' },
        { k: 'সদস্য (সব স্কিম)', v: bn(totalMembers) },
        { k: 'মোট স্থিতি', v: `৳${bn(total)}` },
      ]} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block max-w-sm grow"><span className="text-sm font-bold">খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="স্কিমের নাম বা কোড" className="w-full min-h-tap rounded-r-sm border border-line-3 bg-card px-3 mt-1" />
        </label>
        <div><span className="text-xs font-bold text-mut block mb-1">অবস্থা</span>
          <Chips value={st} onChange={setSt} items={[['all', 'সব'], ...Object.entries(SCH_STATUS).map(([k, v]) => [k, v.t] as [string, string])]} />
        </div>
      </div>
      <Card title="স্কিম" sub={`${bn(rows.length)}টি`}>
        <DataTable
          columns={[
            {
              key: 'name', head: 'স্কিম', render: (s) => (
                <button type="button" onClick={() => nav(`/w/schemes/${s.id}`)} className="min-h-10 text-left">
                  <b className="text-green-800 hover:underline">{s.name}</b>
                  <span className="block text-xs text-mut"><span className="num">{s.code}</span> · {s.typeBn} · v{bn(s.version)}</span>
                </button>
              ),
            },
            { key: 'st', head: 'অবস্থা', render: (s) => <Badge tone={SCH_STATUS[s.status].tone}>{SCH_STATUS[s.status].t}</Badge> },
            { key: 'members', head: 'সদস্য', align: 'right', render: (s) => bn(s.members) },
            { key: 'installment', head: 'কিস্তি', align: 'right', render: (s) => `৳${bn(s.installment)}` },
            { key: 'tenure', head: 'মেয়াদ', render: (s) => s.tenure ? `${bn(s.tenure)} মাস` : 'মেয়াদহীন' },
            { key: 'total', head: 'স্থিতি', align: 'right', render: (s) => `৳${bn(s.total)}` },
            { key: 'late', head: 'বিলম্ব ফি', align: 'right', render: (s) => `৳${bn(s.lateFee)}` },
            { key: 'act', head: '', align: 'right', render: (s) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/schemes/${s.id}`)}>বিস্তারিত</Button> },
          ]}
          rows={rows}
          empty="কোনো স্কিম নেই"
        />
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Note>স্কিম সম্পাদনা করলে পুরোনো হিসাবের শর্ত বদলায় না — নতুন সংস্করণ শুধু নতুন অ্যাকাউন্টে প্রযোজ্য (BR-21)।</Note>
        <Note tone="warn">বিলম্ব ফি একটি নির্ধারিত ফি — সুদ নেই; বার্ষিক সীমা ও নীতির আলাদা পর্যালোচনা চলছে — এখন কোনো নতুন চার্জ যোগ করা হয়নি।</Note>
      </div>
      <p className="text-xs text-mut">মোট বকেয়া (সব হিসাব): ৳{bn(gsDueLeft(state.dues))} · ডেমো ডেটা</p>
    </Page>
  );
}
