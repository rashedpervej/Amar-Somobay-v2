/* A-33 · রিমাইন্ডার ও যোগাযোগ শিডিউল — টেমপ্লেট, SMS ব্যালেন্স, ডেলিভারি */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { templateTotals } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';
import { Field } from './gsParts';

export default function GsReminders() {
  const { state, toggleTemplate } = useAdmin();
  const [sel, setSel] = useState(state.templates[0]?.id ?? '');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const t = state.templates.find((x) => x.id === sel);
  const totals = templateTotals(state.templates);

  const toggle = (id: string) => {
    const r = toggleTemplate(id);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="রিমাইন্ডার শিডিউল" sub="SMS/Push টেমপ্লেট · ডেলিভারি লগ · ডেমো" back="/w/dashboard">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'চালু টেমপ্লেট', v: bn(totals.on) },
        { k: 'মোট পাঠানো', v: bn(totals.sent) },
        { k: 'ব্যর্থ', v: bn(totals.failed), tone: totals.failed ? 'warn' : 'ok' },
        { k: 'SMS ব্যালেন্স', v: `৳${bn(state.sms.balance)}`, tone: state.sms.balance < state.sms.lowAt ? 'danger' : 'ok' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="টেমপ্লেট তালিকা" sub="চালু/বন্ধ করুন · পাঠানোর আগে নমুনা দেখুন">
            <DataTable
              columns={[
                { key: 'code', head: 'কোড', render: (x) => <b className="num text-xs">{x.code}</b> },
                { key: 'name', head: 'নাম / ট্রিগার', render: (x) => <span>{x.name}<span className="block text-xs text-mut">{x.trigger}</span></span> },
                { key: 'ch', head: 'চ্যানেল', render: (x) => x.channel.join(' · ') },
                { key: 'sent', head: 'পাঠানো / পৌঁছেছে', render: (x) => <span className="num">{bn(x.sent)} / {bn(x.delivered)}</span> },
                { key: 'on', head: 'অবস্থা', render: (x) => <Badge tone={x.on ? 'ok' : 'neutral'}>{x.on ? 'চালু' : 'বন্ধ'}</Badge> },
                { key: 'act', head: '', align: 'right', render: (x) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setSel(x.id)}>নমুনা</Button>
                    <Button size="sm" variant="secondary" onClick={() => toggle(x.id)}>{x.on ? 'বন্ধ' : 'চালু'}</Button>
                  </div>
                ) },
              ]}
              rows={state.templates}
              empty="কোনো টেমপ্লেট নেই"
            />
          </Card>

          {t && (
            <Card title={`নমুনা · ${t.name}`} sub={`${t.channel.join(' + ')} · ${t.trigger} · ডেমো`}
              right={<Badge tone={t.on ? 'ok' : 'neutral'}>{t.on ? 'চালু' : 'বন্ধ'}</Badge>}>
              <div className="rounded-r-sm border border-line bg-card-2 px-3 py-2.5 text-sm leading-relaxed">{t.body}</div>
              <p className="text-xs text-mut mt-2">পাঠানো {bn(t.sent)} · পৌঁছেছে {bn(t.delivered)} · ব্যর্থ {bn(t.failed)} · খরচ ৳{bn(t.cost)}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => toggle(t.id)}>{t.on ? 'টেমপ্লেট বন্ধ' : 'টেমপ্লেট চালু'}</Button>
                <Button size="sm" variant="secondary" onClick={() => { setMsg('নমুনা SMS ডেমো — বাস্তবে পাঠানো হয়নি'); setErr(''); }}>পরীক্ষামূলক পাঠান</Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card title="SMS ব্যালেন্স" sub="কম হলে রিমাইন্ডার বন্ধ (D-33)">
            <div className="text-sm space-y-1.5">
              <p>ব্যালেন্স: <b className="num">৳{bn(state.sms.balance)}</b></p>
              <p>প্রতি SMS: <b className="num">৳{bn(state.sms.perSms)}</b></p>
              <p>সতর্ক সীমা: <b className="num">৳{bn(state.sms.lowAt)}</b></p>
              <p>বৈধ নম্বর: <b className="num">{bn(state.sms.validNumbers)}</b> · অবৈধ <b className="num">{bn(state.sms.invalidNumbers)}</b></p>
            </div>
            {state.sms.balance < state.sms.lowAt && <p className="text-xs text-danger-ink mt-2">ব্যালেন্স কম — টপ-আপ করুন, নইলে বকেয়া রিমাইন্ডার যাবে না।</p>}
          </Card>
          <Card title="ডেলিভারি লগ">
            {state.delivery.map((d) => (
              <div key={`${d.tpl}-${d.at}`} className="py-1.5 border-b border-line-2 last:border-0 text-sm">
                <div className="flex justify-between gap-2"><b className="num text-xs">{d.tpl}</b><span className="text-xs text-mut">{d.at}</span></div>
                <div className="text-xs text-mut">পাঠানো {bn(d.sent)} · পৌঁছেছে {bn(d.delivered)} · ব্যর্থ {bn(d.failed)}</div>
                {d.failList && <div className="text-xs text-danger-ink mt-0.5">{d.failList}</div>}
              </div>
            ))}
          </Card>
          <Card title="অপ্ট-আউট" sub="বিপণন বার্তা বন্ধ">
            {state.optOut.map((o) => <p key={o.name} className="text-sm py-1">{o.name} <span className="text-xs text-mut">· {o.why}</span></p>)}
          </Card>
          <Note tone="warn">জরুরি ও আইনি বার্তা অপ্ট-আউটেও যাবে; নিরব ঘণ্টায় শুধু নিরাপত্তা বার্তা।</Note>
        </div>
      </div>
    </Page>
  );
}
