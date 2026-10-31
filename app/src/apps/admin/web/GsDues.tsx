import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Chips, Note, Page, StatBar } from './webParts';
import { gsAccount, gsMemberName } from './gsParts';

const BANDS = ['1–30 দিন', '31–60 দিন', '61–90 দিন', '90+ দিন'];

export default function GsDues() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const [band, setBand] = useState('all');
  const [q, setQ] = useState('');
  const rows = state.dues.filter((d) => (band === 'all' || d.band === band)
    && (q.trim() === '' || `${gsMemberName(state.members, d.memberId)} ${gsAccount(state.accounts, d.accId)?.no ?? ''}`.includes(q.trim())));
  const total = rows.reduce((n, d) => n + Math.max(0, d.amount - d.paid), 0);
  const fee = rows.reduce((n, d) => n + d.lateFee, 0);

  return (
    <Page title="বকেয়া রেজিস্টার" sub="কিস্তি বকেয়া · বিলম্ব ফি · কোনো সুদ নেই (D-07 · D-08)"
      back="/w/dashboard"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/reminders')}>রিমাইন্ডার</Button><Button size="sm" onClick={() => nav('/w/reports')}>রিপোর্ট</Button></>}>
      <StatBar items={[
        { k: 'বকেয়া কিস্তি', v: bn(rows.length), tone: rows.length ? 'warn' : 'ok' },
        { k: 'বকেয়া অঙ্ক', v: `৳${bn(total)}`, tone: 'danger' },
        { k: 'বিলম্ব ফি', v: `৳${bn(fee)}` },
        { k: '৯০+ দিন', v: bn(rows.filter((d) => d.age > 90).length), tone: 'danger' },
      ]} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">সদস্য / হিসাব</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} mt-1`} placeholder="খুঁজুন" /></label>
        <div><span className="text-xs font-bold text-mut block mb-1">বয়স-ব্যান্ড</span>
          <Chips value={band} onChange={setBand} items={[['all', 'সব'], ...BANDS.map((b) => [b, b] as [string, string])]} /></div>
      </div>
      <Card title="বকেয়া তালিকা" sub={`${bn(rows.length)}টি · মোট ৳${bn(total)}`}>
        <DataTable
          columns={[
            {
              key: 'member', head: 'সদস্য', render: (d) => (
                <button type="button" onClick={() => nav(`/w/members/${d.memberId}`)} className="min-h-10 text-left">
                  <b className="text-green-800 hover:underline">{gsMemberName(state.members, d.memberId)}</b>
                  <span className="block text-xs text-mut">{gsAccount(state.accounts, d.accId)?.no}</span>
                </button>
              ),
            },
            { key: 'inst', head: 'কিস্তি', align: 'center', render: (d) => `#${bn(d.instNo)}` },
            { key: 'due', head: 'নির্ধারিত', render: (d) => <span className="num">{d.due}</span> },
            { key: 'amount', head: 'বকেয়া', align: 'right', render: (d) => <b className="num text-danger-ink">৳{bn(Math.max(0, d.amount - d.paid))}</b> },
            { key: 'fee', head: 'বিলম্ব ফি', align: 'right', render: (d) => `৳${bn(d.lateFee)}` },
            { key: 'age', head: 'বয়স', align: 'center', render: (d) => <Badge tone={d.age > 90 ? 'danger' : d.age > 30 ? 'warn' : 'info'}>{bn(d.age)} দিন</Badge> },
            { key: 'band', head: 'ব্যান্ড', render: (d) => d.band },
            { key: 'act', head: '', align: 'right', render: (d) => <Button size="sm" variant="secondary" onClick={() => nav(`/w/accounts/${d.accId}`)}>হিসাব</Button> },
          ]}
          rows={rows}
          empty="কোনো বকেয়া নেই ✅"
        />
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Note tone="warn">বিলম্ব ফি নির্ধারিত ফি, সুদ নয়; ৯০+ দিনে অ্যাকাউন্ট নিষ্ক্রিয় হওয়ার ঝুঁকি — কমিটি পর্যালোচনা করুন।</Note>
        <Note>বকেয়া মাফ করার এখানে কোনো বোতাম নেই; মওকুফ শুধু কমিটির সিদ্ধান্তে প্রস্থান/নিষ্পত্তি পর্দায়।</Note>
      </div>
    </Page>
  );
}
