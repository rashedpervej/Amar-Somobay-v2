import { useMemo, useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import {
  QH_CLASS, QH_LOAN_ST, QH_PURPOSE, qhClassOf, qhOutstanding, qhPaidPct, qhPerInst, qhPurposeLabel,
} from '../../../domain/adminQard';
import { Chips, Note, Page, StatBar } from './webParts';
import { QhCallout, QhZero, memName } from './qhParts';

const MONTHS = [['all', 'সব সময়'], ['2026-10', 'অক্টোবর ২০২৬'], ['2026-09', 'সেপ্টেম্বর ২০২৬'], ['2026-08', 'আগস্ট ২০২৬']] as const;

export default function QhWebReports() {
  const { state } = useAdminQh();
  const [period, setPeriod] = useState('all');
  const [msg, setMsg] = useState('');
  const inP = (d?: string | null) => period === 'all' || (!!d && d.startsWith(period));

  const loans = state.loans.filter((l) => inP(l.disbursedAt));
  const reps = state.repayments.filter((r) => inP(r.at));
  const apps = state.apps.filter((a) => inP(a.decision?.at ?? a.submittedAt));
  const disbursed = loans.reduce((n, l) => n + l.principal, 0);
  const collected = reps.reduce((n, r) => n + r.amount, 0);
  const outstanding = state.loans.reduce((n, l) => n + qhOutstanding(l, state.repayments, state.writeoffs), 0);
  const arrears = state.loans.reduce((n, l) => n + (l.status === 'arrears' ? qhOutstanding(l, state.repayments, state.writeoffs) : 0), 0);

  const purposeOf = (l: (typeof state.loans)[number]) => state.apps.find((a) => a.id === l.app)?.purpose;
  const byPurpose = useMemo(() => QH_PURPOSE.map((p) => ({
    p: p.t,
    n: state.loans.filter((l) => purposeOf(l) === p.k).length,
    amt: state.loans.filter((l) => purposeOf(l) === p.k).reduce((n, l) => n + l.principal, 0),
  })), [state.loans, state.apps]);

  const monthly = useMemo(() => {
    const map = new Map<string, { dis: number; col: number }>();
    state.loans.forEach((l) => { if (!l.disbursedAt) return; const m = l.disbursedAt.slice(0, 7); const x = map.get(m) ?? { dis: 0, col: 0 }; x.dis += l.principal; map.set(m, x); });
    state.repayments.forEach((r) => { const m = r.at.slice(0, 7); const x = map.get(m) ?? { dis: 0, col: 0 }; x.col += r.amount; map.set(m, x); });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [state.loans, state.repayments]);
  const maxM = Math.max(1, ...monthly.flatMap(([, v]) => [v.dis, v.col]));

  return (
    <Page title="কর্জে হাসানা রিপোর্ট" sub="শুধু পড়ার রিপোর্ট · মূলধন, আদায়, বকেয়া ও শ্রেণি — সুদ নেই"
      back="/w/qh" right={<><Button size="sm" variant="secondary" onClick={() => setMsg('CSV রপ্তানি ডেমো — প্রকৃত ফাইল তৈরি ব্যাকএন্ড সংযুক্তির পরে; প্রদর্শিত সংখ্যা সিড ডেটা।')}>CSV</Button><Button size="sm" variant="secondary" onClick={() => setMsg('প্রিন্ট ভিউ ডেমো — এই পেজ read-only।')}>প্রিন্ট</Button></>}>
      {msg && <Note tone="ok">{msg}</Note>}
      <div className="flex flex-wrap items-end gap-3">
        <div><span className="text-xs font-bold text-mut block mb-1">সময়কাল</span>
          <Chips value={period} onChange={setPeriod} items={MONTHS.map(([k, t]) => [k, t] as [string, string])} />
        </div>
        <Badge tone="info">read-only · ডেমো ডেটা</Badge>
        <QhZero />
      </div>

      <StatBar items={[
        { k: 'বিতরণ', v: `৳${bn(disbursed)}` },
        { k: 'আদায়', v: `৳${bn(collected)}`, tone: 'ok' },
        { k: 'বাকি মূলধন', v: `৳${bn(outstanding)}` },
        { k: 'বকেয়া', v: `৳${bn(arrears)}`, tone: arrears ? 'danger' : 'ok' },
        { k: 'আবেদন', v: bn(apps.length) },
        { k: 'সুদ আয়', v: '৳০', tone: 'ok' },
      ]} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="মাসিক বিতরণ ও আদায়" sub="ডেমো লেজার থেকে">
          <div className="h-48 flex items-end gap-3 px-2">
            {monthly.map(([m, v]) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 h-40 w-full justify-center">
                  <div className="w-4 bg-qh-600 rounded-t" style={{ height: `${(v.dis / maxM) * 100}%` }} title={`বিতরণ ৳${bn(v.dis)}`} />
                  <div className="w-4 bg-green-500 rounded-t" style={{ height: `${(v.col / maxM) * 100}%` }} title={`আদায় ৳${bn(v.col)}`} />
                </div>
                <span className="text-[10px] text-mut">{m.slice(5)}/{m.slice(2, 4)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-mut mt-2"><span>🟪 বিতরণ</span><span>🟩 আদায়</span></div>
        </Card>
        <Card title="উদ্দেশ্য অনুযায়ী" sub="পণ্য-ভিত্তিক বণ্টন">
          <DataTable
            columns={[
              { key: 'p', head: 'উদ্দেশ্য' },
              { key: 'n', head: 'ঋণ', align: 'right', render: (r) => bn(r.n) },
              { key: 'amt', head: 'মূলধন', align: 'right', render: (r) => `৳${bn(r.amt)}` },
              { key: 'sh', head: 'অংশ', align: 'right', render: (r) => `${bn(Math.round((r.amt / Math.max(1, state.loans.reduce((n, l) => n + l.principal, 0))) * 100))}%` },
            ]}
            rows={byPurpose}
          />
        </Card>
      </div>

      <Card title="শ্রেণি ও অবস্থা" sub="পোর্টফোলিওর স্বাস্থ্য">
        <DataTable
          columns={[
            { key: 'cls', head: 'শ্রেণি', render: (r) => <Badge tone={QH_CLASS[r.cls].tone}>{QH_CLASS[r.cls].t}</Badge> },
            { key: 'n', head: 'ঋণ', align: 'right', render: (r) => bn(r.n) },
            { key: 'amt', head: 'বাকি', align: 'right', render: (r) => `৳${bn(r.amt)}` },
            { key: 'policy', head: 'নীতি', render: (r) => r.cls === 'loss' ? 'write-off যাচাই' : r.cls === 'doubt' ? 'নোটিশ + কমিটি' : r.cls === 'watch' ? 'স্মারক' : 'স্বাভাবিক' },
          ]}
          rows={(['regular', 'watch', 'late', 'doubt', 'loss'] as const).map((cls) => ({
            cls,
            n: state.loans.filter((l) => qhClassOf(l, state.repayments) === cls).length,
            amt: state.loans.filter((l) => qhClassOf(l, state.repayments) === cls).reduce((n, l) => n + qhOutstanding(l, state.repayments, state.writeoffs), 0),
          }))}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="বিতরণ লেজার" sub="পিরিয়ড অনুযায়ী">
          <DataTable
            columns={[
              { key: 'no', head: 'ঋণ', render: (r) => r.no },
              { key: 'm', head: 'সদস্য', render: (r) => memName(r.memberId) },
              { key: 'p', head: 'মূলধন', align: 'right', render: (r) => `৳${bn(r.principal)}` },
              { key: 'purpose', head: 'উদ্দেশ্য', render: (r) => state.apps.find((a) => a.id === r.app)?.purposeText ?? '—' },
              { key: 'at', head: 'তারিখ', render: (r) => r.disbursedAt ?? '—' },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={QH_LOAN_ST[r.status].tone}>{QH_LOAN_ST[r.status].t}</Badge> },
            ]}
            rows={loans}
            empty="এই পিরিয়ডে বিতরণ নেই"
          />
        </Card>
        <Card title="আদায় লেজার" sub={`${bn(reps.length)} রসিদ · সুদ ৳০`}>
          <DataTable
            columns={[
              { key: 'receipt', head: 'রসিদ', render: (r) => r.receipt },
              { key: 'loan', head: 'ঋণ', render: (r) => state.loans.find((l) => l.id === r.loan)?.no ?? r.loan },
              { key: 'inst', head: 'কিস্তি', align: 'center', render: (r) => bn(r.inst) },
              { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => `৳${bn(r.amount)}` },
              { key: 'at', head: 'তারিখ', render: (r) => r.at },
              { key: 'by', head: 'গ্রহণকারী', render: (r) => r.by },
            ]}
            rows={reps}
            empty="এই পিরিয়ডে আদায় নেই"
          />
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <QhCallout title="গোপনীয়তা" tone="info">রিপোর্টে শুধু প্রয়োজনীয় তথ্য; সদস্যের আর্থিক অবস্থা বাইরে শেয়ার নয়। CSV রপ্তানিতেও একই নীতি।</QhCallout>
        <Note>এই পেজ read-only — কোনো form/action নেই যা ডেটা বদলায়। সংখ্যা সিড ডেটা ও ডেমো; প্রকৃত রিপোর্টে লাইভ লেজার ব্যবহার হবে।</Note>
      </div>
    </Page>
  );
}
