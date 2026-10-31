/* QAM-02 · সহায়তা পণ্য কনফিগারেশন — সীমা, মেয়াদ, গ্রেস, পরিশোধ ধরন ও নথি
   ⚠️ কোনো পণ্যেই “মুনাফা হার” / “বিলম্ব ফি” ক্ষেত্র নেই; পরিবর্তনে নতুন সংস্করণ (BR-21)। */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, FileCheck2, HeartHandshake, Info, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, Chipset, Chip, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import {
  QH_DOC, QH_PURPOSE, QH_REPAY, qhPurposeLabel, qhRepayLabel, type PurposeKey, type QhProduct, type RepayKey,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

type Form = { name: string; min: string; max: string; tenure: string; grace: string; purposes: PurposeKey[]; repay: RepayKey };

const toForm = (p: QhProduct): Form => ({
  name: p.name, min: String(p.min), max: String(p.max), tenure: String(p.tenure), grace: String(p.grace),
  purposes: [...p.purposes], repay: p.repay,
});

export default function QhProducts() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, saveProduct } = useAdminQh();
  const [pick, setPick] = useState(state.products[0].id);
  const product = state.products.find((p) => p.id === pick) ?? state.products[0];
  const [form, setForm] = useState<Form>(toForm(product));
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => { setForm(toForm(product)); setErr(''); }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const togglePurpose = (k: PurposeKey) => setForm((f) => ({
    ...f, purposes: f.purposes.includes(k) ? f.purposes.filter((x) => x !== k) : [...f.purposes, k],
  }));

  const submit = () => {
    setErr(''); setOk('');
    const res = saveProduct({
      id: product.id, name: form.name, min: Number(form.min) || 0, max: Number(form.max) || 0,
      tenure: Number(form.tenure) || 0, grace: Number(form.grace) || 0, purposes: form.purposes, repay: form.repay,
    });
    if (!res.ok) setErr(res.message); else setOk(res.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Badge tone="brand"><HeartHandshake size={12} /> {bn(state.products.length)}টি পণ্য</Badge>
        <Badge tone="neutral">QHP-কোড</Badge>
        <QhZero />
      </div>

      <div className="space-y-2">
        {state.products.map((x) => (
          <button key={x.id} type="button" onClick={() => setPick(x.id)}
            className={`min-h-tap w-full text-left rounded-r-md border shadow-sh-1 px-3.5 py-3 ${pick === x.id ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-extrabold">{x.name}</div>
                <div className="text-xs text-mut num">{x.code} · {bn(x.tenure)} কিস্তি · {qhRepayLabel(x.repay)}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge tone="neutral"><Clock size={11} /> গ্রেস {bn(x.grace)} দিন</Badge>
                  <Badge tone={x.status === 'window' ? 'warn' : 'ok'}>{x.status === 'window' ? 'জানালাভিত্তিক' : 'সক্রিয়'}</Badge>
                  <Badge tone="neutral">নিয়ম v{bn(x.version)} · {x.committee}</Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="num font-extrabold">{tk(x.max)}</div>
                <div className="text-[11px] text-mut">সর্বনিম্ন {tk(x.min)}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-mut">সুদমুক্ত — কোনো পণ্যেই সময়ভিত্তিক চার্জ নেই (BR-20)। সংস্করণ বাড়লে পুরোনো আবেদনের স্ন্যাপশট অপরিবর্তিত থাকে।</p>

      <SectionHead title={`নির্বাচিত পণ্য · ${product.code}`} sub={`${product.name} · চলমান সংস্করণ v${bn(product.version)}`} />

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="সংরক্ষিত">{ok}</SuccessBanner> : null}

      <Card pad>
        <label className="block text-sm font-bold mb-1" htmlFor="qh-p-name">পণ্যের নাম</label>
        <input id="qh-p-name" className={inputClass()} value={form.name} onChange={(e) => set('name', e.target.value)} />

        <div className="mt-3 text-sm font-bold">উদ্দেশ্য-ক্যাটাগরি (D-69)</div>
        <div className="mt-1.5"><Chipset>
          {QH_PURPOSE.map((x) => (
            <Chip key={x.k} active={form.purposes.includes(x.k)} onClick={() => togglePurpose(x.k)}>{x.t}</Chip>
          ))}
        </Chipset></div>
        <p className="text-xs text-mut mt-1">বাছাই: {form.purposes.map(qhPurposeLabel).join(', ') || 'কিছু বাছাই করা হয়নি'}</p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="block text-sm font-bold mb-1" htmlFor="qh-p-min">সর্বনিম্ন (৳)</label>
            <input id="qh-p-min" className={inputClass()} inputMode="numeric" value={form.min} onChange={(e) => set('min', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" htmlFor="qh-p-max">সর্বোচ্চ (৳)</label>
            <input id="qh-p-max" className={inputClass()} inputMode="numeric" value={form.max} onChange={(e) => set('max', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" htmlFor="qh-p-ten">মেয়াদ (মাস)</label>
            <input id="qh-p-ten" className={inputClass()} inputMode="numeric" value={form.tenure} onChange={(e) => set('tenure', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" htmlFor="qh-p-gr">গ্রেস (দিন) · D-41</label>
            <input id="qh-p-gr" className={inputClass()} inputMode="numeric" value={form.grace} onChange={(e) => set('grace', e.target.value)} />
          </div>
        </div>

        <div className="mt-3 text-sm font-bold">পরিশোধ ধরন (D-53)</div>
        <div className="mt-1.5 space-y-2">
          {QH_REPAY.map((r) => (
            <button key={r.k} type="button" onClick={() => setForm((f) => ({ ...f, repay: r.k }))}
              className={`min-h-tap w-full text-left rounded-r-sm border px-3 py-2.5 ${form.repay === r.k ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}>
              <span className="flex items-center gap-2">
                <span className={`size-4 rounded-r-pill border-2 grid place-items-center ${form.repay === r.k ? 'border-green-700' : 'border-line-2'}`}>
                  {form.repay === r.k ? <span className="size-2 rounded-r-pill bg-green-700" /> : null}
                </span>
                <span className="text-sm font-bold">{r.t}</span>
                {form.repay === r.k ? <Badge tone="ok"><Check size={11} /> নির্বাচিত</Badge> : null}
              </span>
              <span className="block text-xs text-mut mt-0.5 pl-6">
                {r.k === 'equal' ? 'প্রতি মাসে সমান মূলধন কিস্তি — ডিফল্ট' : r.k === 'lump' ? 'মেয়াদ শেষে এককালীন মূলধন — দুর্যোগ পণ্যে' : 'সদস্যের সুবিধামতো, ন্যূনতম কিস্তিসহ'}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-r-sm bg-warn-bg border border-warn-bd text-warn-ink px-3 py-2.5 text-sm">
          <b className="inline-flex items-center gap-1"><ShieldCheck size={14} /> সুদ শূন্য বাধ্যতামূলক</b>
          <p className="text-xs mt-1 leading-relaxed">কোনো পণ্যে “মুনাফা হার”, “সার্ভিস চার্জ” বা “বিলম্ব ফি” ক্ষেত্র নেই। বিলম্ব ফি সুদ-সমতুল্য বিবেচিত হওয়ায় নিষ্ক্রিয় (BR-20 · D-41)।</p>
        </div>
      </Card>

      <SectionHead title="নথির প্রয়োজন (D-58)" sub={`${bn(QH_DOC.length)}টি · নথি ছাড়া আবেদন সম্পূর্ণ হয় না`} />
      <Card pad>
        <div className="space-y-2">
          {QH_DOC.map((d) => (
            <div key={d.k} className="flex items-start gap-2 rounded-r-sm border border-line px-3 py-2">
              <FileCheck2 size={15} className="text-green-700 mt-0.5 shrink-0" />
              <div className="grow text-sm font-bold">{d.t}</div>
              <Badge tone={d.k === 'photo' ? 'warn' : 'ok'}>{d.k === 'photo' ? 'ঐচ্ছিক' : 'আবশ্যক'}</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-mut mt-2">ছবি থেকে পড়া মান স্বয়ংক্রিয়ভাবে বসবে না — প্রতিটি ক্ষেত্র যাচাই করতে হবে (D-80)।</p>
      </Card>

      <div className="rounded-r-sm border border-line bg-card-2 px-3 py-2.5 text-xs text-mut">
        <Info size={13} className="inline mr-1" /> পরিবর্তনে নতুন সংস্করণ তৈরি হবে · পুরোনো আবেদনের স্ন্যাপশট বদলাবে না (BR-21)
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={() => { setForm(toForm(product)); setErr(''); setOk(''); }}>বাতিল</Button>
        <Button icon={<Check size={15} />} onClick={submit}>সংরক্ষণ ও প্রকাশ</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/rules${qs}`)}>যোগ্যতা নিয়ম</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/simulation${qs}`)}>Simulation</Button>
      </div>

      <div className="rounded-r-sm border border-warn-bd bg-warn-bg px-3 py-2 text-xs text-warn-ink">
        <TriangleAlert size={13} className="inline mr-1" /> এই ফর্মে কোনো “মুনাফা হার” বা “বিলম্ব ফি” নেই — ইচ্ছাকৃতভাবে বাদ (BR-20)।
      </div>
    </div>
  );
}
