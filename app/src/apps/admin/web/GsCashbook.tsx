/* A-28 · দিনশেষ জমা ও ক্যাশ বুক — ঘোষিত/গণনা, পার্থক্য, সমাপ্তি */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { cashDiff } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';
import { Field } from './gsParts';

export default function GsCashbook() {
  const { state, closeCashDay } = useAdmin();
  const day = state.cashDays[0];
  const [counted, setCounted] = useState(String(day.counted));
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const diff = Number(counted) - day.declared;

  const close = () => {
    const r = closeCashDay(Number(counted), reason);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(`${r.message} — পার্থক্য ৳${bn(r.diff)}`); }
  };

  return (
    <Page title="ক্যাশ বুক ও দিন সমাপ্তি" sub="ঘোষিত বনাম গণনা · চ্যানেলভিত্তিক · ডেমো" back="/w/dashboard">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'ঘোষিত', v: `৳${bn(day.declared)}` },
        { k: 'গণনা', v: `৳${bn(Number(counted) || 0)}`, tone: diff === 0 ? 'ok' : 'warn' },
        { k: 'পার্থক্য', v: `৳${bn(diff)}`, tone: diff === 0 ? 'ok' : 'danger' },
        { k: 'অবস্থা', v: day.closed ? 'সমাপ্ত' : 'খোলা', tone: day.closed ? 'ok' : 'warn' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Card title={`${day.date} · দিনশেষ`} sub={`অনুমোদনকারী: ${day.approvedBy || 'বাকি'} · ${day.closed ? 'সমাপ্ত' : 'চলছে'}`}
            right={<Badge tone={day.closed ? 'ok' : 'warn'}>{day.closed ? 'সমাপ্ত' : 'খোলা'}</Badge>}>
            <div className="grid sm:grid-cols-2 gap-2">
              {[['নগদ', day.channels.cash], ['বিকাশ', day.channels.bkash], ['নগদের ওয়ালেট', day.channels.nagad], ['ব্যাংক', day.channels.bank]].map(([t, v]) => (
                <div key={String(t)} className="rounded-r-sm border border-line bg-card-2 px-3 py-2 text-sm flex justify-between">
                  <span>{t}</span><b className="num">৳{bn(Number(v))}</b>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <Field label="গণনা করা নগদ (৳)">
                <input type="number" value={counted} onChange={(e) => setCounted(e.target.value)} className={`${inputCls} num`} />
              </Field>
              <Field label="পার্থক্যের কারণ" hint="পার্থক্য থাকলে লিখুন">
                <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="ভাংতি / ঘাটতি" />
              </Field>
            </div>
            <div className={`rounded-r-sm border px-3 py-2 text-sm mt-3 ${diff === 0 ? 'border-ok-bd bg-ok-bg' : 'border-warn-bd bg-warn-bg'}`}>
              পার্থক্য: <b className="num">৳{bn(diff)}</b> {diff === 0 ? '— মিলেছে' : '— কারণ ও অনুমোদন লাগবে'}
            </div>
            <Button className="mt-3" onClick={close} disabled={day.closed}>দিন সমাপ্ত করুন</Button>
          </Card>

          <Card title="ক্যাশ ইতিহাস" sub="প্রতিটি দিনের ঘোষিত, গণনা ও অনুমোদন">
            <DataTable
              columns={[
                { key: 'date', head: 'তারিখ', render: (d) => d.date },
                { key: 'declared', head: 'ঘোষিত', align: 'right', render: (d) => <b className="num">৳{bn(d.declared)}</b> },
                { key: 'counted', head: 'গণনা', align: 'right', render: (d) => <span className="num">৳{bn(d.counted)}</span> },
                { key: 'diff', head: 'পার্থক্য', align: 'right', render: (d) => <span className={`num font-bold ${cashDiff(d) === 0 ? 'text-ok-ink' : 'text-danger-ink'}`}>৳{bn(cashDiff(d))}</span> },
                { key: 'st', head: 'অবস্থা', render: (d) => <Badge tone={d.closed ? 'ok' : 'warn'}>{d.closed ? 'সমাপ্ত' : 'খোলা'}</Badge> },
                { key: 'by', head: 'অনুমোদন', render: (d) => <span className="text-xs">{d.approvedBy || '—'}</span> },
              ]}
              rows={state.cashDays}
              empty="কোনো দিন নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="দিন সমাপ্তির শর্ত" sub="D-27 · D-28">
            <ul className="text-sm text-mut space-y-2 leading-relaxed">
              <li>• ঘোষিত ও গণনা মিলতে হবে; না মিললে কারণ বাধ্যতামূলক।</li>
              <li>• পার্থক্য কমিটির অনুমোদন ছাড়া সমন্বয় হয় না।</li>
              <li>• সমাপ্তির পরে নতুন এন্ট্রি পরের দিনের খাতায় যাবে।</li>
              <li>• ক্যাশ ও ওয়ালেট আলাদা করে গণনা; ব্যাংক স্টেটমেন্ট মিলিয়ে।</li>
            </ul>
          </Card>
          <Card title="চ্যানেল মোট">
            <div className="space-y-1.5 text-sm">
              {Object.entries(day.channels).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span>{k === 'cash' ? 'নগদ' : k === 'bkash' ? 'বিকাশ' : k === 'nagad' ? 'নগদ ওয়ালেট' : 'ব্যাংক'}</span><b className="num">৳{bn(v)}</b></div>
              ))}
            </div>
          </Card>
          <Note tone="warn">হাতে নগদ রাখা নয় — ব্যাংকে জমা দিয়ে রসিদ সংরক্ষণ করুন।</Note>
        </div>
      </div>
    </Page>
  );
}
