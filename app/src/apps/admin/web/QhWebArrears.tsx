import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { QH_CLASS, qhArrearsOf, qhClassOf, qhDaysLate, qhInsts } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, memName } from './qhParts';

const LADDER = [
  { k: 'notice', t: '১ · স্মারক ও নোটিশ', sub: 'SMS/চিঠি — ৫ দিন পর' },
  { k: 'meeting', t: '২ · কমিটি আলোচনা', sub: 'কারণ শুনানি — ১৫ দিন' },
  { k: 'plan', t: '৩ · পুনর্গঠন পরিকল্পনা', sub: 'মেয়াদ বাড়িয়ে কিস্তি কমানো' },
  { k: 'writeoff', t: '৪ · write-off প্রস্তাব', sub: 'ORG_ADMIN অনুমোদন (BR-23)' },
];

export default function QhWebArrears() {
  const { state } = useAdminQh();
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const bad = state.loans.filter((l) => l.status === 'arrears' || l.status === 'writeoff' || qhDaysLate(l, state.repayments) > 0);

  return (
    <Page title="বকেয়া ও ডিফল্ট ব্যবস্থাপনা" sub="শ্রেণিকরণ · প্রতিকার ল্যাডার · স্মারক — সুদ শূন্য, বিলম্ব ফি নেই (D-41 · D-44)"
      back="/w/qh" right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/writeoff')}>write-off</Button><Button size="sm" onClick={() => setMsg('সব বকেয়া সদস্যকে স্মারক SMS কিউতে পাঠানো হয়েছে (ডেমো) — প্রকৃত SMS গেটওয়ে সংযুক্ত নয়।')}>সবাইকে স্মারক</Button></>}>
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'বকেয়া ঋণ', v: bn(state.loans.filter((l) => l.status === 'arrears').length), tone: 'danger' },
        { k: 'মোট বকেয়া', v: `৳${bn(state.loans.reduce((n, l) => n + qhArrearsOf(l, state.repayments), 0))}` },
        { k: '৯১+ দিন', v: bn(state.loans.filter((l) => qhDaysLate(l, state.repayments) > 90).length), tone: 'danger' },
        { k: 'write-off', v: bn(state.writeoffs.filter((w) => w.status !== 'done').length), tone: 'warn' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <Card title="বকেয়া তালিকা" sub="দিন অনুযায়ী · শ্রেণি ও প্রতিকার">
            <DataTable
              columns={[
                {
                  key: 'no', head: 'ঋণ', render: (r) => (
                    <button type="button" onClick={() => nav(`/w/qh/loans/${r.id}`)} className="min-h-10 text-left">
                      <b className="num text-green-800 hover:underline">{r.no}</b>
                      <span className="block text-xs text-mut">{memName(r.memberId)}</span>
                    </button>
                  ),
                },
                { key: 'days', head: 'বিলম্ব', align: 'center', render: (r) => <Badge tone={qhDaysLate(r, state.repayments) > 90 ? 'danger' : qhDaysLate(r, state.repayments) > 30 ? 'warn' : 'info'}>{bn(qhDaysLate(r, state.repayments))} দিন</Badge> },
                { key: 'due', head: 'বকেয়া কিস্তি', align: 'center', render: (r) => bn(qhInsts(r, state.repayments).filter((i) => i.status === 'overdue').length) },
                { key: 'amt', head: 'বকেয়া অঙ্ক', align: 'right', render: (r) => <b className="num text-danger-ink">৳{bn(qhArrearsOf(r, state.repayments))}</b> },
                { key: 'cls', head: 'শ্রেণি', render: (r) => <Badge tone={qhClassOf(r, state.repayments) === 'doubt' ? 'danger' : qhClassOf(r, state.repayments) === 'loss' ? 'neutral' : 'warn'}>{QH_CLASS[qhClassOf(r, state.repayments)].t}</Badge> },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'writeoff' ? 'neutral' : 'danger'}>{r.status === 'writeoff' ? 'ছেড়ে দেওয়া' : 'বকেয়া'}</Badge> },
                {
                  key: 'act', head: '', align: 'right', render: (r) => (
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setMsg(`${memName(r.memberId)}-কে স্মারক পাঠানো হয়েছে (ডেমো) — ৫ কার্যদিবসের সময় দেওয়া হলো।`)}>স্মারক</Button>
                      <Button size="sm" onClick={() => nav(`/w/qh/loans/${r.id}/repay`)}>আদায়</Button>
                    </div>
                  ),
                },
              ]}
              rows={bad}
              empty="কোনো বকেয়া নেই ✅"
            />
          </Card>

          <Card title="বিস্তারিত বকেয়া" sub="কোন কিস্তি কত দিন বাকি">
            <DataTable
              columns={[
                { key: 'loan', head: 'ঋণ', render: (r) => r.loan },
                { key: 'member', head: 'সদস্য' },
                { key: 'inst', head: 'কিস্তি', align: 'center', render: (r) => bn(r.inst) },
                { key: 'due', head: 'নির্ধারিত', render: (r) => r.due },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => `৳${bn(r.amount)}` },
                { key: 'days', head: 'দিন', align: 'center', render: (r) => bn(r.days) },
              ]}
              rows={state.loans.filter((l) => l.status !== 'closed').flatMap((l) => qhInsts(l, state.repayments).filter((i) => i.status === 'overdue').map((i) => ({ loan: l.no, member: memName(l.memberId), inst: i.no, due: i.due, amount: i.amount, days: qhDaysLate(l, state.repayments) })))}
              empty="কোনো বকেয়া কিস্তি নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="প্রতিকার ল্যাডার" sub="সুদ ও বিলম্ব ফি নেই">
            {LADDER.map((x, i) => (
              <div key={x.k} className="flex items-start gap-2 py-2 border-b border-line-2 last:border-0">
                <span className="size-6 shrink-0 rounded-r-pill bg-warn-bg text-warn-ink grid place-items-center text-xs font-bold">{bn(i + 1)}</span>
                <div><b className="text-sm block">{x.t}</b><span className="text-xs text-mut">{x.sub}</span></div>
              </div>
            ))}
            <Button size="sm" variant="secondary" block className="mt-2" onClick={() => setMsg('পুনর্গঠন প্রস্তাব খসড়া তৈরি — ঋণ হাব থেকে কমিটি রেফারেন্স দিয়ে অনুমোদন করুন।')}>পুনর্গঠন খসড়া</Button>
          </Card>
          <QhCallout title="শাস্তিমূলক চার্জ নয়" tone="warn">
            বিলম্ব ফি স্বয়ংক্রিয়ভাবে যোগ হয় না; কোনো সুদও নেই। প্রয়োজনে কমিটি সিদ্ধান্ত ও পুনর্গঠন — তারপরও অর্থ ফেরতের বাধ্যবাধকতা থাকে।
          </QhCallout>
          <Note>write-off শুধু আদায়ের সব চেষ্টা ব্যর্থ হলে; ORG_ADMIN অনুমোদন ও নিরীক্ষক অ্যালার্ট বাধ্যতামূলক (BR-23)।</Note>
        </div>
      </div>
    </Page>
  );
}
