/* ============================================================
   src/apps/admin/screens/RoutePlan.tsx — AM-31 সংগ্রহ পরিকল্পনা ও রুট
   সবুজ হিরো (লক্ষ্য/সংগৃহীত) · চাপ ও বরাদ্দহীন আলার্ট · প্রতিটি রুটের
   কার্ড (কল/সদস্য/বকেয়া) · সংগ্রহক তুলনা · বরাদ্দ · নতুন রুট · ক্যালেন্ডার।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, Download, Phone, Plus, Users } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { routeTotals } from '../../../domain/adminOps';
import { Accordion, Hero, KV, Note, Progress } from './parts';

const WEEK = [
  ['শনি', 'R1 · রাজু'], ['রবি', 'R2 · সালমা + R3 · হাবিবুর'], ['সোম', 'R1 · রাজু'],
  ['মঙ্গল', 'R2 · সালমা + R3 · হাবিবুর'], ['বুধ', 'R1 · রাজু'],
  ['বৃহস্পতি', 'R2 · সালমা + R3 · হাবিবুর'], ['শুক্র', 'R1 · রাজু'],
];

export default function RoutePlan() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, createRoute, assignAll } = useAdmin();
  const t = routeTotals(state.routes);
  const [name, setName] = useState('নতুন রুট');
  const [area, setArea] = useState('হরিণাকুণ্ডু');
  const [collector, setCollector] = useState('');
  const [target, setTarget] = useState('30000');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const over = state.routes.filter((r) => r.load === 'over');
  const pct = Math.round((t.collected / Math.max(1, t.target)) * 100);

  function add() {
    setMsg(''); setErr('');
    const r = createRoute({ name, area, collector, day: 'শনি · সোম · বুধ', target: Number(target) || 0 });
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }
  function assign(id: string) {
    setMsg(''); setErr('');
    const r = assignAll(id);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Hero label={`আজকের লক্ষ্য বনাম সংগৃহীত · ${bn(state.routes.length)}টি রুট`} amount={`৳${bn(t.collected)}`}
        sub={`লক্ষ্য ৳${bn(t.target)}`} chips={<>
          <span className="text-xs">অর্জন {bn(pct)}%</span>
          <span className="text-xs">বকেয়া {bn(t.dues)} জন</span>
          <span className="text-xs">৳{bn(t.overdueAmt)}</span>
        </>} />

      {msg ? <SuccessBanner title={msg}>ডেমো — পরের দিন থেকে কার্যকর হবে।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {over.length ? (
        <Note tone="danger"><><b>{over.map((r) => r.id).join(', ')} রুটে সংগ্রহকের উপর চাপ বেশি</b> — {over.map((r) => `${bn(r.members)} জন, লক্ষ্যের ${bn(Math.round((r.collected / r.target) * 100))}% সংগৃহীত`).join(' · ')} — সদস্য অন্য রুটে সরালে বা নতুন সংগ্রহক যোগ করলে দিনশেষ ঘাটতির ঝুঁকি কমে।</></Note>
      ) : null}
      {state.unassigned.length ? (
        <Note tone="warn"><><b>{bn(state.unassigned.length)} জন সদস্য কোনো সংগ্রহক বরাদ্দ পাননি</b> — বরাদ্দ ছাড়া নিয়মিত সংগ্রহ হবে না; তারা বকেয়া রেজিস্টারে (AM-12) জমা হবে।</></Note>
      ) : null}

      {state.routes.map((r) => {
        const p = Math.round((r.collected / Math.max(1, r.target)) * 100);
        return (
          <Card key={r.id} title={`${r.id} · ${r.name}`} sub={`${r.area} · ${r.day}`}
            right={<Badge tone={r.load === 'over' ? 'danger' : p >= 70 ? 'ok' : 'warn'}>{r.load === 'over' ? 'চাপ বেশি' : `${bn(p)}% অর্জন`}</Badge>}>
            <KV k="সংগ্রহক" v={r.collector} />
            <KV k="সদস্য" v={<span>{bn(r.members)} জন{r.unassigned ? <span className="text-warn-ink"> · {bn(r.unassigned)} জন বরাদ্দহীন</span> : null}</span>} />
            <KV k="লক্ষ্য / সংগৃহীত" v={`৳${bn(r.target)} / ৳${bn(r.collected)}`} />
            <div className="my-2"><Progress pct={p} tone={p >= 70 ? 'ok' : 'warn'} /></div>
            <KV k="বকেয়া" v={`${bn(r.dues)} জন · ৳${bn(r.overdueAmt)}`} />
            <KV k="হাতে নগদ" v={`৳${bn(r.cashInHand)} — দিনশেষে জমা দিতে হবে`} />
            <div className="flex gap-2 mt-2.5">
              <a href={`tel:${r.mobile}`} className="min-h-tap inline-flex items-center gap-1.5 px-3 rounded-r-sm border border-line-3 text-sm font-bold text-txt-2">
                <Phone size={14} /> কল
              </a>
              <Button size="sm" variant="secondary" className="grow" icon={<Users size={14} />} onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য</Button>
              <Button size="sm" variant="ghost" className="grow" onClick={() => navigate(`/a/dues${roleQS}`)}>বকেয়া</Button>
            </div>
          </Card>
        );
      })}

      <Card title="সব রুট মিলিয়ে" sub={`${bn(state.routes.length)}টি রুট`}>
        <KV k="মোট সদস্য" v={`${bn(t.members)} জন`} />
        <KV k="আজকের লক্ষ্য" v={`৳${bn(t.target)}`} />
        <KV k="সংগৃহীত" v={`৳${bn(t.collected)} (${bn(pct)}%)`} />
        <KV k="বকেয়া" v={`${bn(t.dues)} জন · ৳${bn(t.overdueAmt)}`} />
        <KV k="রুটবিহীন" v={<span className="text-danger-ink">{bn(t.unassigned)} জন</span>} />
      </Card>

      <Card title="সংগ্রহকের কর্মক্ষমতা তুলনা" sub="শুধু পরিকল্পনার জন্য">
        {state.routes.map((r) => {
          const p = Math.round((r.collected / Math.max(1, r.target)) * 100);
          return (
            <div key={r.id} className="flex items-center gap-2 py-2 border-b border-line-2 last:border-b-0">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-800 grid place-items-center font-extrabold shrink-0">{r.collector.slice(0, 1)}</span>
              <div className="grow min-w-0">
                <b className="text-sm block">{r.collector}</b>
                <div className="text-xs text-mut">{r.id} · {bn(r.members)} জন</div>
                <div className="mt-1"><Progress pct={p} tone={p >= 70 ? 'ok' : 'warn'} /></div>
              </div>
              <b className="num text-sm shrink-0">৳{bn(r.collected)}</b>
            </div>
          );
        })}
        <p className="text-xs text-mut mt-2">তুলনা শুধু পরিকল্পনার জন্য — বেতন/মূল্যায়নের সাথে যুক্ত নয়।</p>
      </Card>

      {state.unassigned.length ? (
        <Card title="সদস্য বরাদ্দ" sub={`${bn(state.unassigned.length)} জন বাকি`} right={<Badge tone="danger">বরাদ্দহীন</Badge>}>
          {state.unassigned.map((u) => (
            <div key={u.memberId} className="flex items-center justify-between py-1.5 border-b border-line-2 last:border-b-0">
              <span className="text-sm">{u.name}<span className="block text-xs text-mut">{u.village}</span></span>
              <b className="text-sm">{u.near}</b>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="secondary" className="grow" onClick={() => setMsg('ভারসাম্যের পরামর্শ: R4 নতুন রুট তৈরি করুন — R3-তে ইতিমধ্যে ৪৯ জন')}>পরামর্শ</Button>
            <Button size="sm" className="grow" onClick={() => assign('R3')}>R3-তে বরাদ্দ করুন</Button>
          </div>
          <Note tone="info"><><b>ভারসাম্যের পরামর্শ</b> — R3-তে ইতিমধ্যে {bn(state.routes.find((r) => r.id === 'R3')?.members ?? 0)} জন সদস্য ও দূরত্ব বেশি; নতুন {bn(state.unassigned.length)} জন যোগ করলে একদিনে শেষ করা কঠিন হবে। R4 তৈরি করে দ্বিতীয় সংগ্রহক বরাদ্দ করার পরামর্শ।</></Note>
        </Card>
      ) : null}

      <Card title="নতুন রুট তৈরি" sub="লক্ষ্য ও সংগ্রহক বাধ্যতামূলক">
        <Field label="রুটের নাম" required>{(fid) => <input id={fid} value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} />}</Field>
        <Field label="এলাকা">{(fid) => <input id={fid} value={area} onChange={(e) => setArea(e.target.value)} className={inputClass()} />}</Field>
        <Field label="সংগ্রহক" required hint="স্টাফ তালিকা থেকে নাম">{(fid) => <input id={fid} value={collector} onChange={(e) => setCollector(e.target.value)} className={inputClass()} placeholder="যেমন: মোঃ আব্দুল্লাহ" />}</Field>
        <Field label="দৈনিক লক্ষ্য (৳)" required hint="সর্বনিম্ন ৳১,০০০">{(fid) => <input id={fid} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))} className={inputClass()} />}</Field>
        <Button className="w-full mt-2" icon={<Plus size={15} />} onClick={add}>রুট তৈরি করুন</Button>
      </Card>

      <Accordion title="সাপ্তাহিক ক্যালেন্ডার" sub="তালিকা ভিউ">
        {WEEK.map(([d, r], i) => (
          <div key={d} className="flex items-center gap-3 py-1.5 border-b border-line-2 last:border-b-0">
            <b className="w-16 shrink-0 text-sm">{d}</b>
            <span className={`grow text-sm ${i === 6 ? 'text-mut' : ''}`}>{r}</span>
            {i === 6 ? <Badge tone="neutral">আজ</Badge> : null}
          </div>
        ))}
        <p className="text-xs text-mut mt-2">ছুটির দিনে রুট স্বয়ংক্রিয়ভাবে বন্ধ (S-03)।</p>
      </Accordion>

      <Accordion title="পরিকল্পনা সাজানোর নিয়ম" sub="৪টি শর্ত">
        {[
          ['এক সংগ্রহকের দৈনিক সর্বোচ্চ সদস্য', '৬০ জন — বেশি হলে রুট ভাগ করতে হবে'],
          ['ছুটির দিনে সংগ্রহ নয়', 'ছুটির ক্যালেন্ডার (S-03) অনুযায়ী রুট স্বয়ংক্রিয়ভাবে বন্ধ'],
          ['বরাদ্দহীন সদস্য থাকা যাবে না', `${bn(t.unassigned)} জন বাকি — অ্যালার্ট চলছে`],
          ['রুট বদলালে সদস্যের সম্মতি', 'ঠিকানা বদল না হলে সদস্যকে আগে জানানো হয় (AM-30)'],
        ].map(([a, b]) => (
          <div key={a} className="py-1.5 border-b border-line-2 last:border-b-0">
            <div className="text-sm font-bold">{a}</div>
            <div className="text-xs text-mut">{b}</div>
          </div>
        ))}
        <Note tone="info">API: GET/POST <code>/routes</code> · <code>/{"{id}"}/assign-members</code> · <code>/{"{id}"}/progress</code> — ডেস্কটপ A-32-এর একই এন্ডপয়েন্ট।</Note>
      </Accordion>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Download size={15} />} onClick={() => setMsg('রুট পরিকল্পনা CSV ডাউনলোড প্রস্তুত (ডেমো)')}>এক্সপোর্ট</Button>
        <Button variant="secondary" className="grow" onClick={() => navigate(`/a/moves${roleQS}`)}>স্থানান্তর</Button>
        <Button className="grow" icon={<CalendarDays size={15} />} onClick={() => setMsg('ক্যালেন্ডার ভিউ পরের ধাপে — তালিকা ভিউই প্রধান')}>ক্যালেন্ডার</Button>
      </div>
      <SectionHead title="রুট বদলের নিয়ম" sub="পরের দিন থেকে কার্যকর" />
      <p className="text-sm text-txt-2">রুট বদলালে আজকের সংগ্রহ প্রভাবিত হবে না — পরিবর্তন পরের দিন থেকে কার্যকর হয়।</p>
    </div>
  );
}
