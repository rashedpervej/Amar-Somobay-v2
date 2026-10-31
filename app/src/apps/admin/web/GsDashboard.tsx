import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CheckCheck, Plus, Users } from 'lucide-react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL } from '../../../domain/admin';
import { GsKpi, MemberStatus, gsAccount, gsMemberName, gsDueLeft } from './gsParts';
import { Go, Note, Page, Rail, StatBar } from './webParts';

const TARGET = 4200000;

export default function GsDashboard() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const today = state.cashDays[0];
  const pending = state.approvals;
  const duesTotal = state.dues.reduce((n, d) => n + Math.max(0, d.amount - d.paid), 0);
  const collected = today.declared;
  const pct = Math.round((collected / TARGET) * 100);
  const active = state.accounts.filter((a) => a.status === 'active');
  const posted = state.accounts.reduce((n, a) => n + a.posted, 0);
  const counts = {
    deposit: pending.filter((a) => a.kind === 'deposit').length,
    withdrawal: pending.filter((a) => a.kind === 'withdrawal').length,
    member: pending.filter((a) => a.kind === 'member').length,
    correction: pending.filter((a) => a.kind === 'correction').length,
  };

  return (
    <Page title="সাধারণ সঞ্চয় ড্যাশবোর্ড" sub="শাপলা সমবায় সমিতি · ৩১ অক্টোবর ২০২৬ · সব সংখ্যা ডেমো"
      right={<><Button size="sm" variant="secondary" icon={<BanknoteIcon />} onClick={() => nav('/w/deposits/new')}>নতুন জমা</Button><Button size="sm" onClick={() => nav('/w/approvals/deposits')}>অনুমোদন কিউ</Button></>}>

      {!today.closed && (
        <button type="button" onClick={() => nav('/w/cashbook')}
          className="w-full min-h-10 text-left rounded-r-sm border border-danger-bd bg-danger-bg text-danger-ink px-3 py-2.5 text-sm font-bold flex items-center gap-2">
          <AlertTriangle size={16} /> দিনশেষ হয়নি — আজকের ক্যাশ গণনা ও বন্ধ করুন
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GsKpi label="আজ সংগৃহীত" value={`৳${bn(collected)}`} sub={`লক্ষ্য ৳${bn(TARGET)} · ${bn(pct)}% অর্জিত`} />
        <GsKpi label="মোট সঞ্চয় স্থিতি" value={`৳${bn(posted)}`} sub={`${bn(active.length)}টি সক্রিয় হিসাব`} />
        <GsKpi label="অনুমোদন বাকি" value={bn(pending.length)} sub={`জমা ${bn(counts.deposit)} · উত্তোলন ${bn(counts.withdrawal)}`} tone="warn" />
        <GsKpi label="বকেয়া" value={`৳${bn(duesTotal)}`} sub={`${bn(state.dues.length)}টি কিস্তি · বিলম্ব ফি আলাদা`} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <Card title="আজকের সংগ্রহ" sub="মাধ্যম অনুযায়ী — সুদ শূন্য / মুনাফা নেই" right={<Badge tone="neutral">ডেমো</Badge>}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['cash', 'bkash', 'nagad', 'bank'] as const).map((c) => (
                <div key={c} className="rounded-r-sm border border-line p-2.5">
                  <span className="text-xs text-mut block">{CHANNEL_LABEL[c]}</span>
                  <b className="num text-sm">৳{bn(today.channels[c])}</b>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-mut mb-1"><span>লক্ষ্যের {bn(pct)}%</span><span>৳{bn(TARGET)}</span></div>
              <div className="h-2 rounded-r-pill bg-line-2 overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${Math.min(100, pct)}%` }} /></div>
            </div>
          </Card>

          <Card title="আপনার সিদ্ধান্তের অপেক্ষায়" sub={`${bn(pending.length)}টি আবেদন · SLA সহ`} right={<Go to="/w/approvals/deposits">সব দেখুন</Go>}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { t: 'জমা অনুমোদন', n: counts.deposit, to: '/w/approvals/deposits', icon: ArrowDownToLine },
                { t: 'উত্তোলন অনুমোদন', n: counts.withdrawal, to: '/w/approvals/withdrawals', icon: ArrowUpFromLine },
                { t: 'সদস্য নিবন্ধন', n: counts.member, to: '/w/approvals/members', icon: Users },
                { t: 'সংশোধন প্রস্তাব', n: counts.correction, to: '/w/approvals/corrections', icon: CheckCheck },
              ].map((x) => {
                const Icon = x.icon;
                return (
                  <button key={x.t} type="button" onClick={() => nav(x.to)}
                    className="min-h-10 flex items-center gap-2 rounded-r-sm border border-line bg-card px-3 py-2 text-left hover:border-green-600">
                    <Icon size={16} className="text-green-700" />
                    <span className="grow text-sm font-bold">{x.t}</span>
                    <Badge tone={x.n ? 'warn' : 'neutral'}>{bn(x.n)}</Badge>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="সাম্প্রতিক জমা" sub="সর্বশেষ পোস্টেড লেনদেন" right={<Go to="/w/ledger">খতিয়ান</Go>}>
            <DataTable
              columns={[
                { key: 'no', head: 'রেফারেন্স', render: (r) => <b className="num">{r.no}</b> },
                { key: 'member', head: 'সদস্য', render: (r) => gsMemberName(state.members, r.memberId) },
                { key: 'acc', head: 'হিসাব', render: (r) => gsAccount(state.accounts, r.accId)?.no ?? '—' },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => <span className="num">৳{bn(r.amount)}</span> },
                { key: 'channel', head: 'মাধ্যম', render: (r) => CHANNEL_LABEL[r.channel] },
                { key: 'at', head: 'তারিখ', render: (r) => r.date },
              ]}
              rows={state.txns.slice(0, 6)}
            />
          </Card>
        </div>

        <div className="space-y-3">
          <StatBar items={[
            { k: 'সদস্য', v: bn(state.members.length) },
            { k: 'হিসাব', v: bn(state.accounts.length) },
            { k: 'চলমান স্কিম', v: bn(state.schemes.filter((s) => s.status === 'active').length) },
            { k: 'আজকের লেনদেন', v: bn(state.txns.filter((t) => t.date === '2026-10-31').length) },
          ]} />
          <Rail title="দ্রুত কাজ">
            <Go to="/w/members/new">নতুন সদস্য নিবন্ধন</Go>
            <Go to="/w/members">সদস্য খুঁজুন</Go>
            <Go to="/w/deposits/new">দ্রুত জমা এন্ট্রি</Go>
            <Go to="/w/cashbook">দিনশেষ ক্যাশ</Go>
            <Go to="/w/dues">বকেয়া রেজিস্টার</Go>
            <Go to="/w/transfer">তহবিল স্থানান্তর</Go>
            <Go to="/w/reports">রিপোর্ট কেন্দ্র</Go>
          </Rail>
          <Note tone="warn">দিনশেষ ক্যাশ বাকি — ঘোষিত ৳{bn(today.declared)}; গণনা করা হয়নি। মিলে গেলে দিন বন্ধ করুন।</Note>
          <Note>ডেমো ডেটা — কোনো বাস্তব সদস্য বা অর্থ নয়। সুদ শূন্য — কোনো শতাংশ-ভিত্তিক মুনাফাও নেই (D-01)।</Note>
        </div>
      </div>
    </Page>
  );
}

function BanknoteIcon() {
  return <Plus size={15} />;
}
