/* QAM-06 · জানালা, কোটা ও পুল — D-40 / D-51 / D-52 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, Clock, Droplets, Landmark, PencilLine, Users } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { Accordion, KV, Note } from './parts';
import { QhHero, QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import { qhDate, qhPoolState, qhQuotaLeft } from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

const ROUTE_NAME: Record<string, { name: string; collector: string; members: number }> = {
  R1: { name: 'শাপলা (উত্তর)', collector: 'রাজু আহমেদ', members: 18 },
  R2: { name: 'দক্ষিণপাড়া', collector: 'সেলিনা পারভীন', members: 16 },
  R3: { name: 'মধ্যপাড়া', collector: 'রাজু আহমেদ', members: 14 },
};

export default function QhWindow() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, saveWindow } = useAdminQh();
  const w = state.window;
  const pool = qhPoolState(w, state.loans, state.apps);
  const qLeft = qhQuotaLeft(w);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ start: w.start, end: w.end, nextStart: w.nextStart, nextEnd: w.nextEnd, quota: String(w.quota) });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const save = () => {
    setErr(''); setOk('');
    const res = saveWindow({ ...form, quota: Number(form.quota) || 0 });
    if (!res.ok) setErr(res.message); else { setOk(res.message); setEditing(false); }
  };

  const byProd = state.products.map((p) => ({
    p,
    approved: state.apps.filter((a) => a.product === p.id && (a.status === 'approved' || a.status === 'disbursed')).length,
    active: state.loans.filter((l) => l.product === p.id && (l.status === 'active' || l.status === 'arrears')).length,
    disbursed: state.loans.filter((l) => l.product === p.id && l.status !== 'pending').reduce((s, l) => s + l.principal, 0),
  }));

  return (
    <div className="p-4 space-y-3 pb-8">
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="সংরক্ষিত">{ok}</SuccessBanner> : null}

      <div className={`rounded-r-md border px-3.5 py-3 flex items-start gap-3 ${w.open ? 'bg-ok-bg border-ok-bd' : 'bg-warn-bg border-warn-bd'}`}>
        <span className={`shrink-0 size-9 rounded-r-pill grid place-items-center ${w.open ? 'bg-ok-ink text-white' : 'bg-warn-ink text-white'}`}>
          {w.open ? <Check size={16} /> : <Clock size={16} />}
        </span>
        <div>
          <b className="text-sm">{w.open ? 'জানালা খোলা আছে' : 'জানালা এখন বন্ধ'}</b>
          <p className="text-xs mt-0.5 text-mut leading-relaxed">
            {w.open ? `${qhDate(w.start)} – ${qhDate(w.end)} · কোটা বাকি ${bn(qLeft)}টি` :
              `চলমান জানালা ${qhDate(w.start)} – ${qhDate(w.end)} শেষ হয়েছে। পরবর্তী ${qhDate(w.nextStart)} – ${qhDate(w.nextEnd)} (D-51)`}
          </p>
        </div>
      </div>

      <QhHero label="QH ফান্ড পুল (D-40)" amount={tk(pool.available)}
        sub={`বরাদ্দ ${tk(pool.allocated)} · হল্ড ${tk(pool.held)} · প্রতিশ্রুতি ${tk(pool.committed)}`}>
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="rounded-r-sm bg-white/15 border border-white/25 px-2.5 py-1.5"><i className="not-italic text-green-100">উৎস · </i>{pool.source}</div>
          <div className="rounded-r-sm bg-qh-gold/25 border border-qh-gold-hi/60 px-2.5 py-1.5"><i className="not-italic text-qh-gold-soft">সদস্যের সঞ্চয় থেকে? · </i>{pool.note}</div>
        </div>
      </QhHero>

      <KpiGrid>
        <Kpi label="মাসিক কোটা" value={`${bn(w.used)}/${bn(w.quota)}`} tone={qLeft === 0 ? 'warn' : 'neutral'} note={`অবশিষ্ট ${bn(qLeft)}টি`} />
        <Kpi label="ওয়েটলিস্ট" value={bn(w.waitlist)} unit="জন" tone="warn" note="পরবর্তী জানালায় অগ্রাধিকার (D-52)" />
        <Kpi label="বরাদ্দ" value={`৳${bn(pool.allocated)}`} note="আলাদা ব্যাংক সাব-খাত" />
        <Kpi label="মুক্ত" value={`৳${bn(pool.available)}`} tone="ok" note="হল্ড ও প্রতিশ্রুতি বাদে" />
      </KpiGrid>

      <SectionHead title="মাসিক কোটা" sub={`${bn(w.used)}/${bn(w.quota)} ব্যবহৃত`} right={<QhZero />} />
      <Card>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="num text-h1 font-extrabold">{bn(w.used)} / {bn(w.quota)}</div>
            <div className="text-xs text-mut">মাসিক কোটা · অবশিষ্ট {bn(qLeft)}টি</div>
          </div>
          {qLeft === 0 ? <Badge tone="danger">কোটা পূর্ণ</Badge> : <Badge tone="ok">আরও অনুমোদন সম্ভব</Badge>}
        </div>
        <div className="h-2.5 rounded-r-pill bg-line-2 overflow-hidden mt-2">
          <div className={`h-full ${qLeft === 0 ? 'bg-danger' : 'bg-green-700'}`} style={{ width: `${Math.min(100, Math.round((w.used / w.quota) * 100))}%` }} />
        </div>
        <p className="text-xs text-mut mt-1.5">
          {qLeft === 0 ? 'কোটা শেষ — নতুন অনুমোদন আটকাবে (QH-B-08), আবেদন ওয়েটলিস্টে যাবে।' : 'কোটা বাকি থাকলে অনুমোদন সম্ভব।'}
        </p>

        <div className="mt-3 rounded-r-sm border border-line-2 overflow-hidden">
          <div className="grid grid-cols-4 gap-1 bg-card-2 px-2.5 py-1.5 text-[11px] font-bold text-mut">
            <span>এলাকা/শাখা</span><span className="text-right">কোটা</span><span className="text-right">সদস্য</span><span className="text-right">সংগ্রহক</span>
          </div>
          {Object.entries(w.perBranch).map(([k, n]) => (
            <div key={k} className="grid grid-cols-4 gap-1 px-2.5 py-1.5 text-xs border-t border-line-2">
              <span>{ROUTE_NAME[k]?.name ?? k}</span>
              <span className="text-right num">{bn(n)}টি</span>
              <span className="text-right num">{bn(ROUTE_NAME[k]?.members ?? 0)} জন</span>
              <span className="text-right text-[11px]">{ROUTE_NAME[k]?.collector ?? '—'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-mut mt-1.5">এলাকাভিত্তিক কোটা কমিটির সিদ্ধান্তে বদলানো যায় (D-51)।</p>
      </Card>

      <SectionHead title="পণ্যভিত্তিক বণ্টন" sub="সব অঙ্ক মূলধন, সুদ ৳০" />
      <Card>
        <div className="grid grid-cols-4 gap-1 bg-card-2 px-2.5 py-1.5 text-[11px] font-bold text-mut rounded-r-sm">
          <span>পণ্য</span><span className="text-right">অনুমোদিত</span><span className="text-right">চলমান</span><span className="text-right">বিতরণ</span>
        </div>
        {byProd.map(({ p, approved, active, disbursed }) => (
          <div key={p.id} className="grid grid-cols-4 gap-1 px-2.5 py-1.5 text-xs border-b border-line-2 last:border-b-0">
            <span className="font-bold">{p.code}</span>
            <span className="text-right num">{bn(approved)}টি</span>
            <span className="text-right num">{bn(active)}টি</span>
            <span className="text-right num">{tk(disbursed)}</span>
          </div>
        ))}
        <div className="mt-3"><Note tone="warn"><b className="inline-flex items-center gap-1"><Users size={13} /> ওয়েটলিস্ট {bn(w.waitlist)} জন</b><br />কোটা শেষ হলে আবেদন বাতিল হয় না, পরবর্তী জানালায় অগ্রাধিকার পান (D-52)।</Note></div>
      </Card>

      <SectionHead title="জানালার সময়সূচি" sub="চলমান ও পরবর্তী"
        right={<button type="button" className="min-h-tap px-1 text-sm font-bold text-green-800" onClick={() => setEditing((v) => !v)}><PencilLine size={15} className="inline mr-1" />সম্পাদনা</button>} />
      <Card>
        <KV k="চলমান জানালা" v={`${qhDate(w.start)} → ${qhDate(w.end)}`} />
        <KV k="পরবর্তী জানালা" v={`${qhDate(w.nextStart)} → ${qhDate(w.nextEnd)}`} />
        <KV k="ঘোষণা" v="জানালা শুরুর ৭ দিন আগে (SMS + অ্যাপ নোটিশ)" />
        <KV k="জানালার বাইরে আবেদন" v="গ্রহণ হবে না — কারণ QH-B-02 দেখানো হয়" />
      </Card>

      {editing ? (
        <Card title="জানালা সম্পাদনা" sub="তারিখ ও কোটা — কারণ QH-B-02 সদস্য অ্যাপে দেখানো হবে">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="qh-w-start">শুরু</label>
              <input id="qh-w-start" type="date" className={inputClass()} value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="qh-w-end">শেষ</label>
              <input id="qh-w-end" type="date" className={inputClass()} value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="qh-w-ns">পরবর্তী শুরু</label>
              <input id="qh-w-ns" type="date" className={inputClass()} value={form.nextStart} onChange={(e) => setForm((f) => ({ ...f, nextStart: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="qh-w-ne">পরবর্তী শেষ</label>
              <input id="qh-w-ne" type="date" className={inputClass()} value={form.nextEnd} onChange={(e) => setForm((f) => ({ ...f, nextEnd: e.target.value }))} />
            </div>
          </div>
          <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-w-q">মাসিক কোটা</label>
          <input id="qh-w-q" className={inputClass()} inputMode="numeric" value={form.quota} onChange={(e) => setForm((f) => ({ ...f, quota: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button variant="secondary" onClick={() => setEditing(false)}>বাতিল</Button>
            <Button icon={<Check size={15} />} onClick={save}>পরিবর্তন সংরক্ষণ</Button>
          </div>
        </Card>
      ) : null}

      <Accordion title="পুলের হিসাব ও সিদ্ধান্ত (D-40/51/52)" sub="মুক্ত = বরাদ্দ − হল্ড − প্রতিশ্রুতি">
        <KV k="মোট বরাদ্দ" v={tk(pool.allocated)} />
        <KV k="হল্ড (অনুমোদিত, বিতরণ বাকি)" v={tk(pool.held)} />
        <KV k="প্রতিশ্রুতি (বিচারাধীন/অনুমোদিত)" v={tk(pool.committed)} />
        <KV k="মুক্ত অঙ্ক" v={<b className="text-ok-ink">{tk(pool.available)}</b>} strong />
        <KV k="উৎস" v={pool.source} />
        <KV k="নীতি" v={pool.note} />
        <KV k="কোটা পূর্ণ হলে" v="জানালা বন্ধ + ওয়েটলিস্ট (D-51)" />
        <KV k="অগ্রাধিকার" v="প্রয়োজন → ওয়েটলিস্ট → সদস্যত্বকাল → জমার ধারা (D-52)" />
        <div className="mt-2"><Note tone="info">পুলের অঙ্ক আলাদা ব্যাংক সাব-খাতে থাকে; সাধারণ সঞ্চয় বা যৌথ লক্ষ্য তহবিল থেকে নেওয়া হয় না (§৪.২)।</Note></div>
      </Accordion>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<CalendarDays size={15} />} onClick={() => setEditing(true)}>জানালা সম্পাদনা</Button>
        <Button icon={<Check size={15} />} onClick={save}>পরবর্তী জানালা প্রকাশ</Button>
        <Button variant="ghost" icon={<Users size={15} />} onClick={() => navigate(`/a/qh/eligible${qs}`)}>যোগ্য তালিকা</Button>
        <Button variant="ghost" icon={<Landmark size={15} />} onClick={() => navigate(`/a/qh/loans${qs}`)}>ঋণ হাব</Button>
      </div>

      <div className="rounded-r-sm border border-line bg-card-2 px-3 py-2 text-xs text-mut">
        <Droplets size={13} className="inline mr-1" /> সদস্যদের নাম: {SEED_MEMBERS.filter((m) => state.eligible.some((e) => e.memberId === m.id && e.result === 'eligible')).map((m) => m.name).join(', ') || '—'} · পুলের অঙ্ক কোনো সদস্যের সঞ্চয় নয়।
      </div>
    </div>
  );
}
