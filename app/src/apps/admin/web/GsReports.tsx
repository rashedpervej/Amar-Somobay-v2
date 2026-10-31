/* A-34 · রিপোর্ট কেন্দ্র — গ্রুপভিত্তিক, ফরম্যাট বাছাই, রান ইতিহাস */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { reportGroups } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';

export default function GsReports() {
  const { state, runReport } = useAdmin();
  const [fmt, setFmt] = useState('PDF');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const groups = reportGroups(state.reports);

  const run = (code: string, formats: string[]) => {
    const f = formats.includes(fmt) ? fmt : formats[0];
    const r = runReport(code, f);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="রিপোর্ট কেন্দ্র" sub="দৈনিক · সদস্য · সঞ্চয় · বকেয়া · আর্থিক · নিরীক্ষা · ডেমো" back="/w/dashboard"
      right={<div className="flex gap-1">{[['PDF'], ['Excel'], ['CSV']].map(([f]) => (
        <Button key={f} size="sm" variant={fmt === f ? 'primary' : 'secondary'} onClick={() => setFmt(f)}>{f}</Button>
      ))}</div>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মোট রিপোর্ট', v: bn(state.reports.length) },
        { k: 'চলমান', v: bn(state.reportRuns.filter((r) => r.status === 'running').length), tone: 'warn' },
        { k: 'প্রস্তুত', v: bn(state.reportRuns.filter((r) => r.status === 'ready').length), tone: 'ok' },
        { k: 'ব্যর্থ', v: bn(state.reportRuns.filter((r) => r.status === 'failed').length), tone: 'danger' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.g} title={g.g} sub={`${bn(g.items.length)}টি রিপোর্ট`}>
              <DataTable
                columns={[
                  { key: 'code', head: 'কোড', render: (r) => <b className="num text-xs">{r.code}</b> },
                  { key: 'name', head: 'নাম / প্যারামিটার', render: (r) => <span>{r.name}<span className="block text-xs text-mut">{r.params.join(' · ')} · {r.time}</span></span> },
                  { key: 'roles', head: 'অনুমতি', render: (r) => <span className="text-xs">{r.roles}</span> },
                  { key: 'fmt', head: 'ফরম্যাট', render: (r) => r.fmt.join(' · ') },
                  { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" onClick={() => run(r.code, r.fmt)}>চালান</Button> },
                ]}
                rows={g.items}
                empty="কোনো রিপোর্ট নেই"
              />
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <Card title="সাম্প্রতিক রান" sub="ফলাফল ডাউনলোড — ডেমো">
            {state.reportRuns.map((r) => (
              <div key={r.id} className="py-2 border-b border-line-2 last:border-0 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div><b>{r.name}</b><div className="text-xs text-mut num">{r.code} · {r.fmt} · {r.by} · {r.at}</div></div>
                  <Badge tone={r.status === 'ready' ? 'ok' : r.status === 'running' ? 'warn' : 'danger'}>{r.status === 'ready' ? 'প্রস্তুত' : r.status === 'running' ? 'চলছে' : 'ব্যর্থ'}</Badge>
                </div>
                {r.err && <p className="text-xs text-danger-ink mt-1">{r.err}</p>}
                <div className="text-xs text-mut mt-1">আকার: {r.size}</div>
              </div>
            ))}
          </Card>
          <Note>রিপোর্টে কোনো শতাংশ-ভিত্তিক মুনাফা নেই; বিলম্ব ফি নির্ধারিত ফি (D-01 · D-08)।</Note>
          <Note tone="warn">বড় রেঞ্জে রিপোর্ট ব্যর্থ হতে পারে — ছোট সময়সীমা বাছুন।</Note>
        </div>
      </div>
    </Page>
  );
}
