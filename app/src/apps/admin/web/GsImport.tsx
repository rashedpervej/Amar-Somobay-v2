/* A-19 · বাল্ক ইমপোর্ট ও ম্যাপিং — ড্রাই-রান, কলাম ম্যাপিং, কমিট */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { IMPORT_STATUS } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';

export default function GsImport() {
  const { state, commitImport } = useAdmin();
  const nav = useNavigate();
  const [file, setFile] = useState('');
  const [sel, setSel] = useState(state.imports[0]?.id ?? '');
  const im = state.imports.find((x) => x.id === sel) ?? state.imports[0];
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const dry = state.imports.find((x) => x.status === 'dry_run');

  const commit = () => {
    if (!dry) { setErr('ড্রাই-রান ফাইল নেই — আগে যাচাই করুন'); setMsg(''); return; }
    const r = commitImport(dry.id);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="CSV ইমপোর্ট ও ম্যাপিং" sub="পুরনো খাতা · ড্রাই-রান প্রথম, কমিট পরে · ডেমো" back="/w/bulk"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/bulk')}>ব্যাচ তালিকা</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'ইমপোর্ট ফাইল', v: bn(state.imports.length) },
        { k: 'ড্রাই-রান', v: bn(state.imports.filter((x) => x.status === 'dry_run').length), tone: 'warn' },
        { k: 'কমিটেড', v: bn(state.imports.filter((x) => x.status === 'committed').length), tone: 'ok' },
        { k: 'পার্স ত্রুটি', v: bn(state.imports.filter((x) => x.status === 'parse_error').length), tone: 'danger' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="ফাইল যাচাই (ড্রাই-রান)" sub="ডেমোতে ফাইল পড়া হয় না — নাম দিয়ে প্রস্তুতি দেখানো হয়">
            <div className="flex flex-wrap items-end gap-2">
              <label className="grow min-w-[240px]">
                <span className="block text-sm font-bold">ফাইল নাম</span>
                <input value={file} onChange={(e) => setFile(e.target.value)} placeholder="purano-khata-2026.csv" className="w-full min-h-tap rounded-r-sm border border-line-3 bg-card px-3 text-sm mt-1" />
              </label>
              <Button onClick={() => { setMsg(file.trim() ? `‘${file.trim()}’ নামে ডেমো প্রস্তুতি — নিচের ড্রাই-রান ফাইলটি কমিট করুন` : ''); setErr(file.trim() ? '' : 'ফাইলের নাম দিন'); }}>যাচাই শুরু</Button>
            </div>
            <Note tone="warn">বাস্তব CSV/XLSX পার্সিং এই ডেমোতে নেই; নমুনা ড্রাই-রান ফাইল ব্যবহার করে কমিট ফ্লো পরীক্ষা করা যায়।</Note>
          </Card>

          <Card title="ইমপোর্ট ফাইল" sub="প্রতিটি ফাইল = একটি ব্যাচ; ফেরত নিলে ডেটা মুছে যায় না">
            <DataTable
              columns={[
                { key: 'file', head: 'ফাইল', render: (x) => <b className="text-xs">{x.file}</b> },
                { key: 'rows', head: 'সারি / বৈধ', render: (x) => <span className="num">{bn(x.rows)} / {bn(x.valid)}</span> },
                { key: 'amt', head: 'অঙ্ক', align: 'right', render: (x) => <b className="num">৳{bn(x.amount)}</b> },
                { key: 'st', head: 'অবস্থা', render: (x) => <Badge tone={IMPORT_STATUS[x.status].tone}>{IMPORT_STATUS[x.status].t}</Badge> },
                { key: 'act', head: '', align: 'right', render: (x) => <Button size="sm" variant="secondary" onClick={() => setSel(x.id)}>বিস্তারিত</Button> },
              ]}
              rows={state.imports}
              empty="কোনো ইমপোর্ট নেই"
            />
          </Card>

          {im && (
            <Card title={im.file} sub={`${im.by} · ${im.at} · ${im.size} · ডেমো`}
              right={<Badge tone={IMPORT_STATUS[im.status].tone}>{IMPORT_STATUS[im.status].t}</Badge>}>
              {im.err && <Note tone="warn">{im.err}</Note>}
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p>ম্যাপিং: <b>{im.mapping}</b></p>
                <p>প্রভাব: <b>{im.effect}</b></p>
                <p>ডুপ্লিকেট: <b className="num">{bn(im.dup)}</b></p>
                <p>অবৈধ সারি: <b className="num">{bn(im.invalid)}</b></p>
              </div>
              {im.status === 'dry_run' && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button onClick={commit}>ড্রাই-রান কমিট করুন</Button>
                  <Button variant="secondary" onClick={() => nav('/w/bulk')}>ব্যাচ দেখুন</Button>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card title="কলাম ম্যাপিং" sub="৯টি কলাম → ৯টি ফিল্ড · ডেমো">
            <div className="space-y-1.5 text-sm">
              {state.importsMap.map(([src, dst]) => (
                <div key={src} className="flex items-center justify-between gap-2 border-b border-line-2 last:border-0 py-1.5">
                  <span>{src}</span><span className="text-xs text-mut num">{dst}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="ড্রাই-রান নিয়ম">
            <ul className="text-sm text-mut space-y-1.5">
              <li>• প্রথমে সব সারি যাচাই — কিছুই পোস্ট হয় না।</li>
              <li>• ডুপ্লিকেট/ফাঁকা অঙ্ক বাদ পড়ে, রিপোর্টে দেখা যায়।</li>
              <li>• কমিটের পরে একটি ব্যাচ ও ট্রানজেকশন নম্বর তৈরি হয়।</li>
              <li>• ফেরত নিলে রিভার্সাল এন্ট্রি — মূল ডেটা মুছে যায় না (R-02)।</li>
            </ul>
          </Card>
          <Note tone="warn">পুরনো খাতার ডেটা ডেমো; বাস্তব ইমপোর্টের আগে ব্যাকআপ ও কমিটি অনুমোদন লাগবে।</Note>
        </div>
      </div>
    </Page>
  );
}
