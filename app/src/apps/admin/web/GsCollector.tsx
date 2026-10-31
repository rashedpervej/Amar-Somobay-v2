/* A-02 · মাঠ সংগ্রহক ড্যাশবোর্ড — আজকের রুট, লক্ষ্য, বকেয়া ও ক্যাশ */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { gsAccountsOf, gsDueLeft, gsMemberName, ProgressBar } from './gsParts';
import { Chips, Note, Page, StatBar } from './webParts';

export default function GsCollector() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const collectors = state.staff.filter((s) => s.role === 'COLLECTOR');
  const [routeId, setRouteId] = useState(state.routes[0]?.id ?? 'R1');
  const route = state.routes.find((r) => r.id === routeId) ?? state.routes[0];
  const dues = state.dues.filter((d) => {
    const m = state.members.find((x) => x.id === d.memberId);
    return m?.route === routeId && d.amount > d.paid;
  });
  const dueTotal = dues.reduce((n, d) => n + (d.amount - d.paid), 0);
  const collectedToday = state.txns.filter((t) => t.type === 'deposit' && t.date === '2026-10-31').reduce((n, t) => n + t.amount, 0);
  const cash = state.cashDays[0].channels;
  const pct = Math.round((route.collected / Math.max(1, route.target)) * 100);

  return (
    <Page title="আজকের রুট (সংগ্রহক)" sub="মাঠ সংগ্রহকের দিন · লক্ষ্য বনাম আদায় · বকেয়া তালিকা · ডেমো"
      right={<Button icon={<span className="num">৳</span>} onClick={() => nav(`/w/deposits/new?member=${dues[0]?.memberId ?? 'm1'}`)}>কিস্তি নিন</Button>}>
      <StatBar items={[
        { k: 'আজকের আদায়', v: `৳${bn(collectedToday)}` },
        { k: 'রুটের লক্ষ্য', v: `৳${bn(route.target)}` },
        { k: 'বকেয়া সদস্য', v: bn(dues.length), tone: dues.length ? 'warn' : 'ok' },
        { k: 'হাতে নগদ', v: `৳${bn(route.cashInHand)}`, tone: 'ok' },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-mut">রুট বাছুন</span>
        <Chips items={state.routes.map((r) => [r.id, `${r.id} · ${r.name}`])} value={routeId} onChange={setRouteId} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <Card title={`${route.name} · ${route.area}`} sub={`${route.day} · সংগ্রহক ${route.collector} · ডেমো`}
            right={<Badge tone={route.load === 'over' ? 'warn' : 'ok'}>{route.load === 'over' ? 'চাপ বেশি' : 'স্বাভাবিক'}</Badge>}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>আদায় <b className="num">৳{bn(route.collected)}</b></span>
              <b className="num">{bn(pct)}%</b>
            </div>
            <ProgressBar pct={pct} tone={pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : 'danger'} />
            <div className="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
              <p>সদস্য: <b className="num">{bn(route.members)}</b></p>
              <p>বকেয়া অঙ্ক: <b className="num">৳{bn(route.overdueAmt)}</b></p>
              <p>হাতে নগদ: <b className="num">৳{bn(route.cashInHand)}</b></p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={() => nav(`/w/deposits/new?member=${dues[0]?.memberId ?? 'm1'}`)}>জমা এন্ট্রি</Button>
              <Button size="sm" variant="secondary" onClick={() => nav('/w/dues')}>বকেয়া দেখুন</Button>
              <Button size="sm" variant="secondary" onClick={() => nav('/w/cashbook')}>ক্যাশ জমা</Button>
            </div>
          </Card>

          <Card title="আজকের বকেয়া" sub={`${bn(dues.length)}টি কিস্তি বাকি · মোট ৳${bn(dueTotal)}`}>
            <DataTable
              columns={[
                { key: 'm', head: 'সদস্য', render: (d) => gsMemberName(state.members, d.memberId) },
                { key: 'acc', head: 'হিসাব', render: (d) => gsAccountsOf(state.accounts, d.memberId)[0]?.no ?? d.accId },
                { key: 'age', head: 'বয়স', render: (d) => `${bn(d.age)} দিন` },
                { key: 'amt', head: 'বাকি', align: 'right', render: (d) => <b className="num">৳{bn(d.amount - d.paid)}</b> },
                { key: 'go', head: '', align: 'right', render: (d) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/deposits/new?member=${d.memberId}`)}>আদায়</Button> },
              ]}
              rows={dues}
              empty="এই রুটে আজ বকেয়া নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="ক্যাশ ও ওয়ালেট" sub="আজকের সংগ্রহ · ডেমো">
            {[['নগদ', cash.cash], ['বিকাশ', cash.bkash], ['নগদের ওয়ালেট', cash.nagad], ['ব্যাংক', cash.bank]].map(([t, v]) => (
              <div key={String(t)} className="flex justify-between py-1.5 border-b border-line-2 last:border-0 text-sm">
                <span>{t}</span><b className="num">৳{bn(Number(v))}</b>
              </div>
            ))}
          </Card>
          <Card title="সংগ্রহক দল" sub="ভূমিকা ও স্কোপ">
            {collectors.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-line-2 last:border-0 text-sm">
                <span>{c.name} <span className="text-xs text-mut">· {c.scope}</span></span>
                <Badge tone={c.status === 'active' ? 'ok' : 'warn'}>{c.status === 'active' ? 'সক্রিয়' : 'মেয়াদি'}</Badge>
              </div>
            ))}
          </Card>
          <Note tone="warn">নগদ হাতে রাখা যাবে না — দিনশেষে ক্যাশ বুক মিলিয়ে জমা দিন। কোনো সুদ নেই।</Note>
          <Note>বকেয়া থাকলে সদস্যের হিসাব নিষ্ক্রিয় হওয়ার ঝুঁকি (D-07); মওকুফ শুধু কমিটির সিদ্ধান্তে।</Note>
          <Card title="দ্রুত রুট বদল">
            <div className="space-y-2">
              {state.routes.map((r) => (
                <button key={r.id} type="button" onClick={() => setRouteId(r.id)}
                  className={`min-h-10 w-full text-left rounded-r-sm border px-3 py-2 text-sm ${r.id === routeId ? 'border-green-700 bg-green-050 font-bold' : 'border-line-3 bg-card'}`}>
                  {r.id} · {r.name} — {bn(r.members)} সদস্য
                </button>
              ))}
            </div>
          </Card>
          <Note>বকেয়া যোগফল: ৳{bn(gsDueLeft(dues))}। ডেমো ডেটা — বাস্তব সদস্য নয়।</Note>
        </div>
      </div>
    </Page>
  );
}
