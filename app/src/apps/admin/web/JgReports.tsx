import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import {
  JG_STATUS, jgCollected, jgDisbOf, jgPaidOut, jgPartsOf, jgPctOf, jgSpend,
} from '../../../domain/adminJoint';
import { Note, Page, StatBar } from './webParts';

export default function JgReports() {
  const s = useAdminJg();
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const col = s.state.goals.reduce((n, g) => n + jgCollected(s.state.contribs, g.id), 0);
  const paid = jgSpend(s.state.disbs);
  const blocked = s.state.disbs.filter((d) => d.status === 'blocked').reduce((n, d) => n + d.amount, 0);

  return (
    <Page title="Joint Goal রিপোর্ট ও নিরীক্ষা" sub="ট্রায়াল ব্যালেন্স · লক্ষ্যভিত্তিক তহবিল · প্রমাণসহ বিতরণ (BR-12 · D-50)"
      back="/w/jg"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/jg/goals')}>লক্ষ্য তালিকা</Button><Button size="sm" onClick={() => setMsg('রিপোর্ট এক্সপোর্ট ডেমো — প্রকৃত CSV/PDF ব্যাকএন্ড সংযুক্তির পরে।')}>এক্সপোর্ট</Button></>}>
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মোট সংগৃহীত', v: `৳${bn(col)}`, tone: 'ok' },
        { k: 'মোট ব্যয়', v: `৳${bn(paid)}` },
        { k: 'তহবিল ব্যালেন্স', v: `৳${bn(col - paid)}`, tone: col - paid >= 0 ? 'ok' : 'danger' },
        { k: 'আটকানো ভাউচার', v: `৳${bn(blocked)}`, tone: blocked ? 'warn' : 'ok' },
      ]} />
      <Note>ট্রায়াল ব্যালেন্স নিয়ম: মোট অবদান − মোট পরিশোধিত ব্যয় = তহবিল ব্যালেন্স। কোনো ব্যক্তিগত উত্তোলন বা সুদ নেই (BR-19)।</Note>

      <Card title="লক্ষ্যভিত্তিক আর্থিক সারসংক্ষেপ" sub="ডেমো সিড · প্রতিটি সংখ্যা derived">
        <DataTable
          caption="সংগৃহীত = রসিদকৃত অবদান · ব্যয় = পরিশোধিত ভাউচার · ব্যালেন্স = তহবিলে থাকা"
          columns={[
            { key: 'code', head: 'লক্ষ্য', render: (r) => <><b>{r.code}</b><span className="block text-xs text-mut">{r.name}</span></> },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={JG_STATUS[r.status].tone}>{JG_STATUS[r.status].t}</Badge> },
            { key: 'target', head: 'লক্ষ্য', align: 'right', render: (r) => `৳${bn(r.target)}` },
            { key: 'pct', head: 'অর্জিত', align: 'center', render: (r) => `${bn(Math.min(100, jgPctOf(s.state.contribs, r)))}%` },
            { key: 'col', head: 'সংগৃহীত', align: 'right', render: (r) => `৳${bn(jgCollected(s.state.contribs, r.id))}` },
            { key: 'out', head: 'ব্যয়', align: 'right', render: (r) => `৳${bn(jgPaidOut(s.state.disbs, r.id))}` },
            { key: 'bal', head: 'ব্যালেন্স', align: 'right', render: (r) => <b className="num">৳{bn(jgCollected(s.state.contribs, r.id) - jgPaidOut(s.state.disbs, r.id))}</b> },
            { key: 'parts', head: 'জন', align: 'center', render: (r) => bn(jgPartsOf(s.state.parts, r.id).length) },
          ]}
          rows={s.state.goals}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="বিতরণ প্রমাণ" sub="প্রতিটি ভাউচারের প্রমাণ ও অনুমোদন">
          <DataTable
            columns={[
              { key: 'no', head: 'ভাউচার' },
              { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => `৳${bn(r.amount)}` },
              { key: 'evidence', head: 'প্রমাণ', render: (r) => <span className="text-xs">{r.evidence.join(' · ') || 'নেই'}</span> },
              { key: 'by', head: 'প্রস্তুত / অনুমোদন', render: (r) => <span className="text-xs">{r.by ?? '—'} / {r.appr ?? '—'}</span> },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'paid' ? 'ok' : r.status === 'blocked' ? 'danger' : 'warn'}>{r.status === 'paid' ? 'পরিশোধিত' : r.status === 'blocked' ? 'আটকানো' : 'বাকি'}</Badge> },
            ]}
            rows={s.state.disbs}
          />
        </Card>
        <Card title="লক্ষ্যভিত্তিক ব্যয়ের অগ্রগতি" sub="পুল দায় নয় — earmarked">
          {s.state.goals.map((g) => {
            const c = jgCollected(s.state.contribs, g.id);
            const p = jgPaidOut(s.state.disbs, g.id);
            const pct = c ? Math.round((p / c) * 100) : 0;
            return (
              <div key={g.id} className="py-2 border-b border-line-2 last:border-0">
                <div className="flex justify-between text-sm"><b>{g.code}</b><span className="text-mut num">{bn(pct)}% ব্যয়</span></div>
                <div className="h-2 rounded-r-pill bg-line-2 overflow-hidden mt-1"><div className="h-full bg-purple" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                <div className="text-xs text-mut mt-0.5">{bn(jgDisbOf(s.state.disbs, g.id).length)} ভাউচার · ৳{bn(p)} / ৳{bn(c)}</div>
              </div>
            );
          })}
        </Card>
      </div>
      <Note>এই রিপোর্ট ডেমো ডেটার; নিরীক্ষা ও নিয়ন্ত্রক ফরম্যাটে এক্সপোর্ট ব্যাকএন্ড কাজের অংশ। AUDITOR শুধু পড়তে পারেন।</Note>
    </Page>
  );
}
