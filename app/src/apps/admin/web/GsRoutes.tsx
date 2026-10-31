/* A-32 · সংগ্রহ পরিকল্পনা ও রুট — রুট তৈরি, সংগ্রহক বরাদ্দ, বোঝা */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { routeTotals } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';
import { Field, ProgressBar } from './gsParts';

export default function GsRoutes() {
  const { state, createRoute, assignAll } = useAdmin();
  const nav = useNavigate();
  const totals = routeTotals(state.routes);
  const [f, setF] = useState({ name: '', area: '', collector: '', day: 'শনি · সোম · বুধ', target: '50000' });
  const [routeId, setRouteId] = useState(state.routes[0]?.id ?? 'R1');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const create = () => {
    const r = createRoute({ ...f, target: Number(f.target) });
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setF({ ...f, name: '', area: '', collector: '', target: '50000' }); }
  };
  const assign = () => {
    const r = assignAll(routeId);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="সংগ্রহ পরিকল্পনা ও রুট" sub="রুট তৈরি · সংগ্রহক বরাদ্দ · বোঝা (load) · ডেমো" back="/w/collector"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/collector')}>সংগ্রহক ভিউ</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'রুট', v: bn(state.routes.length) },
        { k: 'মোট সদস্য', v: bn(totals.members) },
        { k: 'বরাদ্দহীন', v: bn(totals.unassigned), tone: totals.unassigned ? 'warn' : 'ok' },
        { k: 'মাসিক লক্ষ্য', v: `৳${bn(totals.target)}` },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="রুট তালিকা" sub="আদায় বনাম লক্ষ্য · সংগ্রহকের হাতে নগদ">
            <DataTable
              columns={[
                { key: 'id', head: 'রুট', render: (r) => <b className="num">{r.id}</b> },
                { key: 'name', head: 'নাম / এলাকা', render: (r) => <span>{r.name}<span className="block text-xs text-mut">{r.area} · {r.collector}</span></span> },
                { key: 'members', head: 'সদস্য', align: 'right', render: (r) => <span className="num">{bn(r.members)}</span> },
                { key: 'target', head: 'লক্ষ্য', align: 'right', render: (r) => <b className="num">৳{bn(r.target)}</b> },
                { key: 'prog', head: 'অগ্রগতি', render: (r) => <div className="w-28"><ProgressBar pct={Math.round((r.collected / Math.max(1, r.target)) * 100)} /></div> },
                { key: 'load', head: 'বোঝা', render: (r) => <Badge tone={r.load === 'over' ? 'warn' : 'ok'}>{r.load === 'over' ? 'বেশি' : 'স্বাভাবিক'}</Badge> },
                { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" variant="secondary" onClick={() => { setRouteId(r.id); nav('/w/collector'); }}>রুট দেখুন</Button> },
              ]}
              rows={state.routes}
              empty="কোনো রুট নেই"
            />
          </Card>

          <Card title="বরাদ্দহীন সদস্য" sub="নিকটবর্তী রুটে যোগ করা যায়">
            <DataTable
              columns={[
                { key: 'name', head: 'সদস্য', render: (m) => m.name },
                { key: 'village', head: 'গ্রাম', render: (m) => m.village },
                { key: 'near', head: 'নিকটবর্তী রুট', render: (m) => m.near },
              ]}
              rows={state.unassigned}
              empty="সব সদস্য রুটে বরাদ্দ আছে"
            />
            <div className="flex flex-wrap items-end gap-2 mt-3">
              <Field label="রুট">
                <select value={routeId} onChange={(e) => setRouteId(e.target.value)} className={inputCls}>
                  {state.routes.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
                </select>
              </Field>
              <Button onClick={assign} disabled={state.unassigned.length === 0}>সব বরাদ্দ করুন</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="নতুন রুট" sub="নাম, এলাকা, সংগ্রহক ও লক্ষ্য">
            <div className="space-y-3">
              <Field label="রুটের নাম"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} placeholder="যেমন: চন্দ্রপুর" /></Field>
              <Field label="এলাকা"><input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} className={inputCls} placeholder="গ্রাম/ইউনিয়ন" /></Field>
              <Field label="সংগ্রহক">
                <select value={f.collector} onChange={(e) => setF({ ...f, collector: e.target.value })} className={inputCls}>
                  <option value="">— বাছাই —</option>
                  {state.staff.filter((s) => s.role === 'COLLECTOR').map((s) => <option key={s.id} value={s.name}>{s.name} · {s.scope}</option>)}
                </select>
              </Field>
              <Field label="সংগ্রহের দিন"><input value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} className={inputCls} /></Field>
              <Field label="মাসিক লক্ষ্য (৳)"><input type="number" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} className={`${inputCls} num`} /></Field>
            </div>
            <Button block className="mt-3" onClick={create}>রুট তৈরি করুন</Button>
          </Card>
          <Note tone="warn">এক সংগ্রহকের উপর অতিরিক্ত বোঝা দিলে মান ও নিরাপত্তা ঝুঁকি (D-31); লোড দেখে বরাদ্দ দিন।</Note>
          <Note>ডেমো — কোনো বাস্তব রুট বা সংগ্রহক তৈরি হয় না।</Note>
        </div>
      </div>
    </Page>
  );
}
