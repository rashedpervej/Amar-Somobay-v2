/* A-35 · আর্থিক বিবরণ ও রেগুলেটরি রিটার্ন — আয়-ব্যয়, উদ্বৃত্তপত্র, সাইন-অফ */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { FIN, FIN_BS_ASSET, FIN_BS_LIAB, FIN_CASHFLOW, FIN_EXPENSE, FIN_INCOME, FIN_MEMBERS, FIN_SCHEME, RETURN_STATUS, financeTotals } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';

export default function GsFinance() {
  const { state, signOffFinance } = useAdmin();
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const t = financeTotals();

  const sign = () => {
    const r = signOffFinance();
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="আর্থিক বিবরণ ও রিটার্ন" sub={`অর্থবছর ${FIN.fy} · ${FIN.period} · ডেমো`} back="/w/reports">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'আয়', v: `৳${bn(t.inc)}`, tone: 'ok' },
        { k: 'ব্যয়', v: `৳${bn(t.exp)}` },
        { k: 'উদ্বৃত্ত', v: `৳${bn(t.surplus)}`, tone: t.surplus >= 0 ? 'ok' : 'danger' },
        { k: 'সাইন-অফ', v: state.financeSignedOff ? 'হয়েছে' : 'বাকি', tone: state.financeSignedOff ? 'ok' : 'warn' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="আয়-ব্যয়" sub="চলতি অর্থবছর বনাম গত বছর">
          <DataTable
            columns={[
              { key: 'h', head: 'খাত', render: (r) => r.h },
              { key: 'cur', head: 'চলতি', align: 'right', render: (r) => <b className="num">৳{bn(r.cur)}</b> },
              { key: 'prev', head: 'গত', align: 'right', render: (r) => <span className="num">৳{bn(r.prev)}</span> },
            ]}
            rows={[...FIN_INCOME, ...FIN_EXPENSE]}
            empty="কোনো খাত নেই"
          />
          <p className="text-xs text-mut mt-2">উদ্বৃত্ত = আয় − ব্যয় = ৳{bn(t.surplus)}; ট্রায়াল ব্যালেন্স {FIN.trialOk ? 'মিলেছে' : 'মেলেনি'}।</p>
        </Card>

        <Card title="উদ্বৃত্তপত্র" sub={`সম্পদ ৳${bn(t.asset)} · দায় ৳${bn(t.liab)} · ${t.balanced ? 'মিলেছে' : 'মেলেনি'}`}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-bold mb-1">সম্পদ</p>
              {FIN_BS_ASSET.map((r) => <div key={r.h} className="flex justify-between text-sm py-1 border-b border-line-2 last:border-0"><span>{r.h}</span><b className="num">৳{bn(r.cur)}</b></div>)}
            </div>
            <div>
              <p className="text-sm font-bold mb-1">দায় ও তহবিল</p>
              {FIN_BS_LIAB.map((r) => <div key={r.h} className="flex justify-between text-sm py-1 border-b border-line-2 last:border-0"><span>{r.h}</span><b className="num">৳{bn(r.cur)}</b></div>)}
            </div>
          </div>
          <div className={`mt-3 rounded-r-sm border px-3 py-2 text-sm ${t.balanced ? 'border-ok-bd bg-ok-bg' : 'border-danger-bd bg-danger-bg'}`}>
            {t.balanced ? 'দুই পাশ সমান — সাইন-অফ করা যাবে' : 'দুই পাশ মেলেনি — সাইন-অফ আটকে আছে (BR-12)'}
          </div>
        </Card>

        <Card title="নগদ প্রবাহ" sub="চলতি বনাম গত বছর">
          <DataTable
            columns={[
              { key: 'h', head: 'খাত', render: (r) => r.h },
              { key: 'cur', head: 'চলতি', align: 'right', render: (r) => <b className="num">৳{bn(r.cur)}</b> },
              { key: 'prev', head: 'গত', align: 'right', render: (r) => <span className="num">৳{bn(r.prev)}</span> },
            ]}
            rows={FIN_CASHFLOW}
            empty="কোনো প্রবাহ নেই"
          />
        </Card>

        <Card title="স্কিমভিত্তিক সারাংশ" sub="সদস্য · সংগৃহীত · বকেয়া">
          <DataTable
            columns={[
              { key: 's', head: 'স্কিম', render: (r) => state.schemes.find((x) => x.id === r.s)?.name ?? r.s },
              { key: 'members', head: 'সদস্য', align: 'right', render: (r) => <span className="num">{bn(r.members)}</span> },
              { key: 'collected', head: 'সংগৃহীত', align: 'right', render: (r) => <b className="num">৳{bn(r.collected)}</b> },
              { key: 'dues', head: 'বকেয়া', align: 'right', render: (r) => <span className="num">৳{bn(r.dues)}</span> },
            ]}
            rows={FIN_SCHEME}
            empty="কোনো স্কিম নেই"
          />
          <p className="text-xs text-mut mt-2">সদস্য: মোট {bn(FIN_MEMBERS.total)} · নতুন {bn(FIN_MEMBERS.joined)} · নিষ্ক্রিয় {bn(FIN_MEMBERS.dormant)} · প্রস্থান {bn(FIN_MEMBERS.exited)}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card title="রেগুলেটরি রিটার্ন" sub="সমবায় অধিদপ্তরের ছক · প্রস্তুতি">
          <DataTable
            columns={[
              { key: 'code', head: 'কোড', render: (r) => <b className="num">{r.code}</b> },
              { key: 'name', head: 'নাম', render: (r) => r.name },
              { key: 'fmt', head: 'ছক', render: (r) => <span className="text-xs">{r.fmt}</span> },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={RETURN_STATUS[r.status].tone}>{RETURN_STATUS[r.status].t}</Badge> },
            ]}
            rows={state.returns}
            empty="কোনো রিটার্ন নেই"
          />
        </Card>
        <div className="space-y-3">
          <Card title="সাইন-অফ" sub="দুই পাশ মিললেই অনুমোদন">
            <p className="text-sm text-mut">সাইন-অফের পরে খুললে অডিট লগে থাকবে; ডেটা বদলানো যাবে না।</p>
            <Button block className="mt-3" onClick={sign} disabled={state.financeSignedOff || !t.balanced}>অর্থবছর সাইন-অফ</Button>
          </Card>
          <Note tone="warn">সুদ / মুনাফা নেই; বিলম্ব ফি নির্ধারিত ফি (D-01 · D-08)।</Note>
        </div>
      </div>
    </Page>
  );
}
