/* A-18 · বাল্ক জমা / কিস্তি এন্ট্রি — ব্যাচ যাচাই, ত্রুটি ও পোস্ট */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { BATCH_STATUS, batchTotals } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';

export default function GsBulk() {
  const { state, postBatch } = useAdmin();
  const nav = useNavigate();
  const [sel, setSel] = useState(state.batches.find((b) => b.status !== 'posted')?.id ?? state.batches[0]?.id ?? '');
  const b = state.batches.find((x) => x.id === sel) ?? state.batches[0];
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const totals = batchTotals(state.batches);

  const post = () => {
    if (!b) return;
    const r = postBatch(b.id);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="বাল্ক জমা ও ইমপোর্ট" sub="সংগ্রহকের ব্যাচ · যাচাই · আংশিক পোস্ট · ডেমো"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/bulk/import')}>CSV ইমপোর্ট</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মোট সারি', v: bn(totals.rows) },
        { k: 'বৈধ', v: bn(totals.valid), tone: 'ok' },
        { k: 'ডুপ্লিকেট', v: bn(totals.dup), tone: totals.dup ? 'danger' : 'ok' },
        { k: 'মোট অঙ্ক', v: `৳${bn(totals.amount)}` },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Card title="ব্যাচ তালিকা" sub="‘বাছাই’ করে ডান পাশে যাচাই ও পোস্ট করুন">
            <DataTable
              columns={[
                { key: 'no', head: 'ব্যাচ', render: (x) => <b className="num">{x.no}</b> },
                { key: 'route', head: 'রুট', render: (x) => x.route },
                { key: 'rows', head: 'সারি / বৈধ', render: (x) => <span className="num">{bn(x.rows)} / {bn(x.valid)}</span> },
                { key: 'amt', head: 'অঙ্ক', align: 'right', render: (x) => <b className="num">৳{bn(x.amount)}</b> },
                { key: 'st', head: 'অবস্থা', render: (x) => <Badge tone={BATCH_STATUS[x.status].tone}>{BATCH_STATUS[x.status].t}</Badge> },
                { key: 'act', head: '', align: 'right', render: (x) => <Button size="sm" variant="secondary" onClick={() => setSel(x.id)}>বাছাই</Button> },
              ]}
              rows={state.batches}
              empty="কোনো ব্যাচ নেই"
            />
          </Card>

          {b && (
            <Card title={`${b.no} · ত্রুটি ও পোস্ট`} sub={`${b.by} · ${b.at} · রুট ${b.route} · ডেমো`}
              right={<Badge tone={BATCH_STATUS[b.status].tone}>{BATCH_STATUS[b.status].t}</Badge>}>
              <div className="grid sm:grid-cols-3 gap-2 text-sm">
                <p>সারি: <b className="num">{bn(b.rows)}</b></p>
                <p>বৈধ: <b className="num">{bn(b.valid)}</b></p>
                <p>ডুপ্লিকেট: <b className="num">{bn(b.dup)}</b></p>
                <p className="sm:col-span-3">অঙ্ক: <b className="num">৳{bn(b.amount)}</b> · অগ্রগতি: <b className="num">{bn(b.progress)}%</b></p>
              </div>
              {b.errors.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-bold mb-1">বাদ পড়া সারি</p>
                  <DataTable columns={[
                    { key: 'r', head: 'সারি', render: (e) => <span className="num">{bn(e.r)}</span> },
                    { key: 'why', head: 'কারণ', render: (e) => e.why },
                  ]} rows={b.errors} empty="কোনো ত্রুটি নেই" />
                </div>
              ) : <Note tone="ok">এই ব্যাচে কোনো ত্রুটি নেই — পোস্ট করা যাবে।</Note>}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button onClick={post} disabled={b.status === 'posted' || b.status === 'validating'}>ব্যাচ পোস্ট করুন</Button>
                <Button variant="secondary" onClick={() => nav(`/w/txn?txn=${b.txn || ''}`)} disabled={!b.txn}>পোস্ট করা লেনদেন</Button>
                <Button variant="secondary" onClick={() => nav('/w/bulk/import')}>ইমপোর্টে যান</Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card title="নিয়ম" sub="D-16 · D-20">
            <ul className="text-sm text-mut space-y-2 leading-relaxed">
              <li>• যাচাই শেষ না হলে পোস্ট বন্ধ; আংশিক ব্যাচে শুধু বৈধ সারি পোস্ট হয়।</li>
              <li>• ডুপ্লিকেট শনাক্ত হয় সদস্য + তারিখ + অঙ্ক মিলিয়ে।</li>
              <li>• প্রতিটি ব্যাচের জন্য একটি ট্রানজেকশন নম্বর; সারি আলাদা রসিদ পায়।</li>
              <li>• ভুল হলে রিভার্সাল — ডিলিট নয় (R-02)।</li>
            </ul>
          </Card>
          <Card title="আজকের ব্যাচ সারাংশ">
            <div className="space-y-1.5 text-sm">
              {state.batches.slice(0, 3).map((x) => (
                <div key={x.id} className="flex justify-between gap-2">
                  <span className="truncate">{x.no}</span>
                  <b className="num">৳{bn(x.amount)}</b>
                </div>
              ))}
            </div>
          </Card>
          <Note>ভবিষ্যতে CSV/XLSX আপলোড বাস্তব ব্যাকএন্ডে যাবে; এই ডেমোতে ফাইল পড়া হয় না।</Note>
        </div>
      </div>
    </Page>
  );
}
