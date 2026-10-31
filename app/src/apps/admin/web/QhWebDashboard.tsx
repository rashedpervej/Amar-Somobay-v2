import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, FileText, Wallet } from 'lucide-react';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import {
  QH_CLASS, QH_LOAN_ST, qhArrearsOf, qhClassOf, qhDaysLate, qhPoolState, qhPortfolio, qhQueue,
} from '../../../domain/adminQard';
import { Desk, Go, Money, Note, Page, Rail, StatBar } from './webParts';
import { QhHero, QhZero, memName } from './qhParts';

export default function QhWebDashboard() {
  const { state } = useAdminQh();
  const nav = useNavigate();
  const pf = qhPortfolio(state.loans, state.repayments, state.writeoffs);
  const pool = qhPoolState(state.window, state.loans, state.apps);
  const queue = qhQueue(state.apps);
  const pendingLoans = state.loans.filter((l) => l.status === 'pending');
  const proposed = state.writeoffs.filter((w) => w.status === 'proposed');
  const bad = state.loans.filter((l) => l.status === 'arrears');
  const todo = queue.length + pendingLoans.length + proposed.length;
  const todos = [
    ...pendingLoans.map((l) => ({ id: l.id, kind: 'বিতরণ · OTP বাকি', ref: `${l.no} · ${memName(l.memberId)}`, amt: l.principal, to: `/w/qh/disburse/${l.id}`, tone: 'warn' as const })),
    ...queue.filter((a) => a.status === 'review').map((a) => ({ id: a.id, kind: 'সিদ্ধান্ত বাকি', ref: `${a.no} · ${memName(a.memberId)}`, amt: a.amount, to: `/w/qh/applications/${a.id}/decision`, tone: 'warn' as const })),
    ...proposed.map((w) => ({ id: w.id, kind: 'write-off অনুমোদন', ref: `${w.no} · ${w.committee}`, amt: w.amount, to: '/w/qh/writeoff', tone: 'danger' as const })),
  ];

  return (
    <Page title="QH ড্যাশবোর্ড" sub="পুল · অমীমাংসিত কাজ · বকেয়া · জানালা — সব সংখ্যা ডেমো সিড থেকে"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/applications')}>আবেদন কিউ</Button><Button size="sm" onClick={() => nav('/w/qh/products')}>পণ্য ও নিয়ম</Button></>}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <QhHero label="মোট বিতরণ (শুধু মূলধন)" amount={`৳${bn(pf.disbursed)}`}
          sub={`আদায় ৳${bn(pf.repaid)} (${bn(pf.collectionRate)}%) · বাকি ৳${bn(pf.outstanding)}`}>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="rounded-r-sm bg-white/15 border border-white/25 px-2.5 py-2"><i className="not-italic text-green-100 block">ছেড়ে দেওয়া</i><b className="num">৳{bn(pf.writeOff)}</b></div>
            <div className="rounded-r-sm bg-white/15 border border-white/25 px-2.5 py-2"><i className="not-italic text-green-100 block">সমাপ্ত ঋণ</i><b className="num">{bn(pf.closed)}টি</b></div>
            <div className="rounded-r-sm bg-qh-gold/25 border border-qh-gold-hi/60 px-2.5 py-2"><i className="not-italic text-qh-gold-soft block">সুদ / ফি আয়</i><b className="num">৳০ ✓</b></div>
          </div>
        </QhHero>
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="পুলে মুক্ত" value={`৳${bn(pool.available)}`} note={`বরাদ্দ ৳${bn(pool.allocated)} · হল্ড ৳${bn(pool.held)}`} tone="purple" />
          <Kpi label="অমীমাংসিত" value={bn(todo)} unit="টি" tone="warn" note="দিনশেষ গেট (BR-25)" />
          <Kpi label="বকেয়া ঋণ" value={bn(bad.length)} unit="টি" tone={bad.length ? 'danger' : 'ok'} note={`৳${bn(pf.arrears)} · বিলম্ব ফি ৳০`} />
          <Kpi label="জানালা" value={state.window.open ? 'খোলা' : 'বন্ধ'} note={`কোটা ${bn(state.window.used)}/${bn(state.window.quota)}`} />
        </div>
      </div>

      <Note>QH পুল সদস্যের সঞ্চয় নয় — সমিতির নিজস্ব তহবিল + ওয়াকফ অনুদান, আলাদা ব্যাংক সাব-খাত (D-40)। কোনো সুদ, সার্ভিস চার্জ বা বিলম্ব ফি নেই; শুধু মূলধন ফেরত।</Note>

      <Desk>
        <div className="space-y-4">
          <Card title="অমীমাংসিত কাজ" sub={`${bn(todo)}টি · OTP ${bn(pendingLoans.length)} · পর্যালোচনা ${bn(queue.length)} · write-off ${bn(proposed.length)}`}
            right={<Badge tone={todo ? 'warn' : 'ok'}>{todo ? 'কর্মবাকি' : 'নিষ্পত্তি'}</Badge>}>
            {todos.length === 0 ? <p className="text-sm text-mut">কোনো অমীমাংসিত কাজ নেই — সব নিষ্পত্তি হয়েছে ✅</p> : (
              <div className="divide-y divide-line-2">
                {todos.map((t) => (
                  <button key={`${t.kind}-${t.id}`} type="button" onClick={() => nav(t.to)}
                    className="min-h-10 w-full flex items-center gap-3 px-1 py-2.5 text-left hover:bg-green-050 rounded-r-sm">
                    <span className={`size-8 rounded-r-pill grid place-items-center shrink-0 ${t.tone === 'danger' ? 'bg-danger-bg text-danger-ink' : 'bg-warn-bg text-warn-ink'}`}>
                      {t.tone === 'danger' ? <AlertTriangle size={15} /> : <FileText size={15} />}
                    </span>
                    <span className="grow min-w-0">
                      <b className="block text-sm">{t.kind}</b>
                      <span className="block text-xs text-mut num truncate">{t.ref}</span>
                    </span>
                    <Money v={t.amt} />
                    <ArrowRight size={15} className="text-mut" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="ঋণ পোর্টফোলিও" sub="মূলধন · আদায় · শ্রেণি" right={<Go to="/w/qh/loans">ঋণ হাব</Go>}>
            <DataTable
              columns={[
                { key: 'no', head: 'ঋণ', render: (r) => <button type="button" className="min-h-10 font-bold text-green-800 hover:underline" onClick={() => nav(`/w/qh/loans/${r.id}`)}>{r.no}</button> },
                { key: 'member', head: 'সদস্য', render: (r) => memName(r.memberId) },
                { key: 'principal', head: 'মূলধন', align: 'right', render: (r) => `৳${bn(r.principal)}` },
                { key: 'late', head: 'বিলম্ব', align: 'center', render: (r) => `${bn(qhDaysLate(r, state.repayments))} দিন` },
                { key: 'cls', head: 'শ্রেণি', render: (r) => <Badge tone={QH_CLASS[qhClassOf(r, state.repayments)].tone}>{QH_CLASS[qhClassOf(r, state.repayments)].t}</Badge> },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={QH_LOAN_ST[r.status].tone}>{QH_LOAN_ST[r.status].t}</Badge> },
              ]}
              rows={state.loans.filter((l) => l.status === 'active' || l.status === 'arrears').slice(0, 6)}
            />
          </Card>
        </div>

        <div className="space-y-3">
          <StatBar items={[
            { k: 'সক্রিয় ঋণ', v: bn(state.loans.filter((l) => l.status === 'active' || l.status === 'arrears').length) },
            { k: 'বকেয়া কিস্তি', v: bn(state.loans.reduce((n, l) => n + qhArrearsOf(l, state.repayments), 0)) },
            { k: 'জানালা', v: state.window.open ? 'খোলা' : 'বন্ধ', tone: state.window.open ? 'ok' : 'warn' },
            { k: 'সুদ', v: '৳০', tone: 'ok' },
          ]} />
          <Rail title="দ্রুত কাজ">
            <Go to="/w/qh/products">পণ্য ও যোগ্যতা নিয়ম</Go>
            <Go to="/w/qh/rules">নিয়ম ও এক্সেপশন</Go>
            <Go to="/w/qh/simulation">নিয়ম Simulation</Go>
            <Go to="/w/qh/eligible">যোগ্য সদস্য</Go>
            <Go to="/w/qh/window">জানালা ও কোটা</Go>
            <Go to="/w/qh/arrears">বকেয়া ও write-off</Go>
            <Go to="/w/qh/reports">QH রিপোর্ট</Go>
          </Rail>
          <Card title="সাম্প্রতিক অডিট" sub="ডেমো ইভেন্ট">
            <div className="space-y-2">
              {state.events.slice(0, 6).map((e) => (
                <div key={e.id} className="flex items-start gap-2 text-sm border-b border-line-2 last:border-0 pb-2">
                  <span className={`mt-1.5 size-2 rounded-r-pill ${e.tone === 'ok' ? 'bg-ok' : e.tone === 'warn' ? 'bg-warn' : 'bg-info'}`} />
                  <div className="grow"><b className="block text-xs">{e.what}</b><span className="text-[11px] text-mut">{e.at} · {e.ref}</span></div>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex justify-center"><QhZero /></div>
        </div>
      </Desk>
    </Page>
  );
}
