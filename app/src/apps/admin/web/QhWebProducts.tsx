import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { QH_PURPOSE, QH_REPAY, type QhProduct, type PurposeKey, type RepayKey } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhZero } from './qhParts';

export default function QhWebProducts() {
  const { state, saveProduct } = useAdminQh();
  const nav = useNavigate();
  const [sel, setSel] = useState(state.products[0].id);
  const p = state.products.find((x) => x.id === sel) ?? state.products[0];
  const [f, setF] = useState({ name: p.name, min: String(p.min), max: String(p.max), tenure: String(p.tenure), grace: String(p.grace), repay: p.repay });
  const [purposes, setPurposes] = useState<PurposeKey[]>(p.purposes);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const choose = (x: QhProduct) => {
    setSel(x.id);
    setF({ name: x.name, min: String(x.min), max: String(x.max), tenure: String(x.tenure), grace: String(x.grace), repay: x.repay });
    setPurposes(x.purposes);
    setErr(''); setMsg('');
  };
  const submit = () => {
    const r = saveProduct({ id: p.id, name: f.name, min: Number(f.min), max: Number(f.max), tenure: Number(f.tenure), grace: Number(f.grace), purposes, repay: f.repay as RepayKey });
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
  };

  return (
    <Page title="সহায়তা পণ্য কনফিগারেশন" sub="পণ্য · অঙ্ক সীমা · মেয়াদ · গ্রেস · উদ্দেশ্য — সংশোধনে নতুন সংস্করণ (BR-21)"
      back="/w/qh"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/rules')}>যোগ্যতা নিয়ম</Button><Button size="sm" onClick={submit}>নতুন সংস্করণ প্রকাশ</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <StatBar items={[
        { k: 'সক্রিয় পণ্য', v: bn(state.products.length), tone: 'ok' },
        { k: 'সর্বোচ্চ সীমা', v: `৳${bn(Math.max(...state.products.map((x) => x.max)))}` },
        { k: 'সুদ / ফি', v: '৳০', tone: 'ok' },
        { k: 'নথি বাধ্যতামূলক', v: 'D-58' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card title="পণ্য তালিকা" sub="একটি বেছে ডান প্যানেলে সম্পাদনা করুন">
          <DataTable
            columns={[
              {
                key: 'name', head: 'পণ্য', render: (r) => (
                  <button type="button" onClick={() => choose(r)} className="min-h-10 text-left">
                    <b className={r.id === sel ? 'text-green-800' : ''}>{r.name}</b>
                    <span className="block text-xs text-mut">{r.code} · v{bn(r.version)} · {r.committee}</span>
                  </button>
                ),
              },
              { key: 'min', head: 'সীমা', align: 'right', render: (r) => `৳${bn(r.min)}–${bn(r.max)}` },
              { key: 'tenure', head: 'মেয়াদ', align: 'center', render: (r) => `${bn(r.tenure)} মাস` },
              { key: 'grace', head: 'গ্রেস', align: 'center', render: (r) => `${bn(r.grace)} দিন` },
              { key: 'repay', head: 'পরিশোধ', render: (r) => QH_REPAY.find((x) => x.k === r.repay)?.t },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'active' ? 'ok' : 'info'}>{r.status === 'active' ? 'সক্রিয়' : 'জানালাভিত্তিক'}</Badge> },
            ]}
            rows={state.products}
          />
          <div className="grid sm:grid-cols-3 gap-2 mt-3 text-xs text-mut">
            <p>• কোনো সুদ/সেবা চার্জ নেই — শুধু মূলধন ফেরত।</p>
            <p>• বিলম্ব ফি নেই (D-41) — কোনো ক্ষেত্রেই।</p>
            <p>• নথি ছাড়া আবেদন স্ন্যাপশট ব্লক হবে (D-58)।</p>
          </div>
        </Card>

        <div className="space-y-3">
          <Card title={`সম্পাদনা · ${p.code}`} sub={`বর্তমান সংস্করণ v${p.version} — সংরক্ষণে v${p.version + 1}`} right={<QhZero />}>
            <div className="space-y-3">
              <label className="block"><span className="text-sm font-bold">পণ্যের নাম</span>
                <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={`${inputCls} mt-1`} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([['min', 'সর্বনিম্ন (৳)'], ['max', 'সর্বোচ্চ (৳)'], ['tenure', 'মেয়াদ (মাস)'], ['grace', 'গ্রেস (দিন)']] as const).map(([k, label]) => (
                  <label key={k} className="block"><span className="text-sm font-bold">{label}</span>
                    <input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${inputCls} mt-1 num`} />
                  </label>
                ))}
              </div>
              <div>
                <span className="text-sm font-bold">উদ্দেশ্য-ক্যাটাগরি</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {QH_PURPOSE.map((x) => (
                    <button key={x.k} type="button" onClick={() => setPurposes((v) => v.includes(x.k) ? v.filter((y) => y !== x.k) : [...v, x.k])}
                      className={`min-h-10 px-2.5 rounded-r-pill border text-xs font-bold ${purposes.includes(x.k) ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3 text-txt-2'}`}>
                      {x.t}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block"><span className="text-sm font-bold">পরিশোধের ধরন</span>
                <select value={f.repay} onChange={(e) => setF({ ...f, repay: e.target.value as RepayKey })} className={`${inputCls} mt-1`}>
                  {QH_REPAY.map((x) => <option key={x.k} value={x.k}>{x.t}</option>)}
                </select>
              </label>
              <Button block onClick={submit}>সংরক্ষণ ও প্রকাশ</Button>
            </div>
          </Card>
          <Note>আবেদন জমার সময়কার পণ্য-স্ন্যাপশট অপরিবর্তনীয় (BR-21); পরিবর্তন শুধু নতুন আবেদনে প্রযোজ্য।</Note>
        </div>
      </div>
    </Page>
  );
}
