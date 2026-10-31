import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { qhPoolState, qhQuotaLeft } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, memName } from './qhParts';

export default function QhWebWindow() {
  const { state, saveWindow } = useAdminQh();
  const nav = useNavigate();
  const w = state.window;
  const pool = qhPoolState(w, state.loans, state.apps);
  const [f, setF] = useState({ start: '2026-10-01', end: '2026-10-20', nextStart: '2026-11-01', nextEnd: '2026-11-15', quota: String(w.quota), open: w.open });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const submit = () => {
    const r = saveWindow({ ...f, quota: Number(f.quota) });
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const wait = state.apps.filter((a) => a.waitlist);

  return (
    <Page title="আবেদন জানালা ও কোটা নিয়ন্ত্রণ" sub="মাসিক জানালা · কোটা · পুল · ওয়েটলিস্ট — সদস্য অ্যাপে একই নিয়ম (D-51)"
      back="/w/qh" right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/applications')}>আবেদন কিউ</Button><Button size="sm" onClick={submit}>পরিবর্তন সংরক্ষণ</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Card title="চলমান জানালা" sub={`${w.start} → ${w.end}`} right={<Badge tone={w.open ? 'ok' : 'neutral'}>{w.open ? 'খোলা' : 'বন্ধ'}</Badge>}>
              <div className="text-sm space-y-1.5">
                <p>কোটা: <b className="num">{bn(w.used)}/{bn(w.quota)}</b> · বাকি <b className="num">{bn(qhQuotaLeft(w))}</b></p>
                <p>ওয়েটলিস্ট: <b className="num">{bn(w.waitlist)}</b> জন</p>
                <p className="text-xs text-mut">আবেদন বন্ধ থাকলে কারণ QH-B-02 ও পরবর্তী তারিখ দেখানো হবে।</p>
              </div>
            </Card>
            <Card title="পরবর্তী জানালা" sub={`${w.nextStart} → ${w.nextEnd}`}>
              <div className="text-sm space-y-1.5">
                <p>শাখা-ভিত্তিক কোটা: {Object.entries(w.perBranch).map(([k, v]) => `${k} ${bn(v)}`).join(' · ')}</p>
                <p className="text-xs text-mut">মোট কোটা {bn(w.quota)} — শাখা বরাদ্দের যোগফল সমান হতে হবে।</p>
              </div>
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => nav('/w/qh/reports')}>কোটা রিপোর্ট</Button>
            </Card>
          </div>

          <Card title="তহবিল পুল" sub="আলাদা ব্যাংক সাব-খাত — সদস্যের সঞ্চয় নয় (D-40)">
            <StatBar items={[
              { k: 'বরাদ্দ', v: `৳${bn(pool.allocated)}` },
              { k: 'হল্ড', v: `৳${bn(pool.held)}`, tone: 'warn' },
              { k: 'প্রতিশ্রুতি', v: `৳${bn(pool.committed)}` },
              { k: 'মুক্ত', v: `৳${bn(pool.available)}`, tone: pool.available > 0 ? 'ok' : 'danger' },
            ]} />
            <p className="text-sm text-mut mt-2">{w.pool.source}</p>
            <p className="text-xs text-mut">{w.pool.note}</p>
          </Card>

          <Card title="ওয়েটলিস্ট" sub="কোটা পূর্ণ হলে অগ্রাধিকার ক্রম (D-52)" right={<Badge tone="info">{bn(wait.length)} জন</Badge>}>
            <DataTable
              columns={[
                { key: 'no', head: 'আবেদন', render: (r) => <b className="num">{r.no}</b> },
                { key: 'member', head: 'সদস্য', render: (r) => memName(r.memberId) },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => `৳${bn(r.amount)}` },
                { key: 'at', head: 'জমা', render: (r) => r.submittedAt },
                { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/applications/${r.id}`)}>দেখুন</Button> },
              ]}
              rows={wait}
              empty="ওয়েটলিস্ট খালি"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="জানালা সম্পাদনা" sub="তারিখ ও মাসিক কোটা">
            <div className="space-y-2">
              {([['start', 'চলমান শুরু'], ['end', 'চলমান শেষ'], ['nextStart', 'পরবর্তী শুরু'], ['nextEnd', 'পরবর্তী শেষ']] as const).map(([k, label]) => (
                <label key={k} className="block"><span className="text-sm font-bold">{label}</span>
                  <input type="date" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${inputCls} mt-1`} />
                </label>
              ))}
              <label className="block"><span className="text-sm font-bold">মাসিক কোটা</span>
                <input type="number" value={f.quota} onChange={(e) => setF({ ...f, quota: e.target.value })} className={`${inputCls} mt-1 num`} />
              </label>
              <button type="button" onClick={() => setF({ ...f, open: !f.open })}
                className={`min-h-tap w-full flex items-center justify-between rounded-r-sm border px-3 ${f.open ? 'border-ok-bd bg-ok-bg' : 'border-line-3 bg-card'}`}>
                <span className="text-sm font-bold">জানালা খোলা রাখুন</span>
                <span className={`size-6 rounded-r-pill border-2 grid place-items-center text-xs ${f.open ? 'bg-green-700 border-green-700 text-white' : 'border-line-3'}`}>{f.open ? '✓' : ''}</span>
              </button>
              <Button block onClick={submit}>জানালা ও কোটা সংরক্ষিত করুন</Button>
            </div>
          </Card>
          <QhCallout title="নিয়ন্ত্রণ" tone="warn">
            জানালা বন্ধ থাকলে নতুন আবেদন জমা হয় না, কিন্তু পর্যালোচনা ও বিতরণ চলতে থাকে। কোটা বাড়ালে পুলে পর্যাপ্ত অর্থ থাকতে হবে (D-40)।
          </QhCallout>
          <Note>পরিবর্তন অডিটে যাবে; পুরোনো জানালার আবেদনে নতুন কোটা প্রযোজ্য নয়।</Note>
        </div>
      </div>
    </Page>
  );
}
