/* ============================================================
   src/apps/admin/screens/Reminders.tsx — AM-32 রিমাইন্ডার ও যোগাযোগ
   SMS ব্যালেন্স হিরো · ৪ KPI · টেমপ্লেট তালিকা (টগল আসল অ্যাকশন) ·
   ডেলিভারি লগ · নম্বরের অবস্থা · opt-out ও শব্দচয়ন নীতি।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, BellOff, Send, Settings, ShieldCheck, WifiOff } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { templateTotals } from '../../../domain/adminOps';
import { Accordion, Hero, KV, Note, Progress } from './parts';

export default function Reminders() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, toggleTemplate } = useAdmin();
  const t = templateTotals(state.templates);
  const low = state.sms.balance <= state.sms.lowAt;
  const [text, setText] = useState('প্রিয় {{name}}, {{month}} মাসের কিস্তি ৳{{amount}} বাকি আছে।');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function toggle(id: string) {
    setMsg(''); setErr('');
    const r = toggleTemplate(id);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Hero label={`SMS ব্যালেন্স · ${bn(state.sms.validNumbers)}টি সচল নম্বর · ${bn(state.sms.invalidNumbers)}টি অচল`}
        amount={`৳${bn(state.sms.balance)}`}
        sub={low ? 'ব্যালেন্স সতর্কতার সীমার নিচে — রিচার্জ না করলে রিমাইন্ডার বন্ধ হবে।' : 'ব্যালেন্স যথেষ্ট'}
        chips={<>
          <span className="text-xs">প্রতি SMS ৳{bn(state.sms.perSms)}</span>
          <span className="text-xs">আরও {bn(Math.floor(state.sms.balance / state.sms.perSms))}টি</span>
          <span className="text-xs">সীমা ৳{bn(state.sms.lowAt)}</span>
        </>} />

      <KpiGrid>
        <Kpi label="পাঠানো" value={bn(t.sent)} tone="ok" note="সব টেমপ্লেট মিলিয়ে" />
        <Kpi label="ব্যর্থ" value={bn(t.failed)} tone={t.failed ? 'danger' : 'ok'} note={`${bn(Math.round(((t.sent - t.failed) / Math.max(1, t.sent)) * 100))}% ডেলিভার্ড`} />
        <Kpi label="খরচ" value={`৳${bn(t.cost)}`} note="সমিতির ব্যয়" />
        <Kpi label="বাদ দিয়েছেন" value={bn(state.optOut.length)} tone="warn" note="সম্মতি প্রত্যাহার (D-23)" />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg}>ডেমো — কোনো SMS যায়নি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Card title="টেমপ্লেট ও শিডিউল" sub={`${bn(t.on)}টি চালু / ${bn(state.templates.length)}টি`}>
        <div className="divide-y divide-line-2">
          {state.templates.map((tp) => (
            <div key={tp.id} className="py-2.5 flex items-start gap-2">
              {tp.on ? <Bell size={15} className="mt-0.5 text-ok-ink shrink-0" /> : <BellOff size={15} className="mt-0.5 text-mut shrink-0" />}
              <div className="grow min-w-0">
                <b className="text-sm block">{tp.name}</b>
                <div className="text-xs text-mut num">{tp.code} · {tp.channel.join(' + ')} · ট্রিগার: {tp.trigger}</div>
                <div className="text-xs mt-1 bg-neutral-bg rounded-r-sm px-2 py-1.5 leading-relaxed">{tp.body}</div>
                <div className="text-xs text-mut mt-1">পাঠানো {bn(tp.sent)} · ডেলিভার্ড {bn(tp.delivered)} · ব্যর্থ {bn(tp.failed)} · খরচ ৳{bn(tp.cost)}</div>
              </div>
              <button type="button" onClick={() => toggle(tp.id)}
                className={`min-h-tap shrink-0 px-2.5 rounded-r-pill border text-xs font-bold ${tp.on ? 'bg-green-700 text-white border-green-800' : 'bg-card text-mut border-line-3'}`}>
                {tp.on ? 'চালু' : 'বন্ধ'}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="বার্তার নমুনা" sub="প্লেসহোল্ডার বদলে যাবে">
        <Field label="বার্তা" hint="“সুদ” শব্দ ব্যবহার নিষিদ্ধ (D-01)">
          {(fid) => <textarea id={fid} rows={3} value={text} onChange={(e) => setText(e.target.value)} className={inputClass()} />}
        </Field>
        <Button className="w-full mt-2" icon={<Send size={15} />}
          onClick={() => setMsg('নমুনা SMS প্রিভিউ — {{name}} → মর্জিনা বেগম, {{amount}} → ১,০০০ (ডেমো)')}>নমুনা দেখান</Button>
      </Card>

      <Accordion title="ডেলিভারি লগ" sub={`${bn(state.delivery.length)}টি ব্যাচ`}>
        {state.delivery.map((d) => (
          <div key={`${d.tpl}-${d.at}`} className="py-2 border-b border-line-2 last:border-b-0">
            <b className="num text-sm">{d.tpl}</b>
            <div className="text-xs text-mut">{d.at} · {d.by}</div>
            <div className="text-xs">পাঠানো {bn(d.sent)} · ডেলিভার্ড {bn(d.delivered)} · ব্যর্থ {bn(d.failed)}</div>
            {d.failList ? <div className="text-xs text-danger-ink">{d.failList}</div> : null}
          </div>
        ))}
        {state.delivery.length ? null : <p className="text-sm text-mut">কোনো লগ নেই।</p>}
      </Accordion>

      <Card title="নম্বরের অবস্থা">
        <KV k="সক্রিয় ও বৈধ নম্বর" v={bn(state.sms.validNumbers)} />
        <KV k="অবৈধ / বন্ধ নম্বর" v={<span className="text-danger-ink">{bn(state.sms.invalidNumbers)}</span>} />
        <KV k="বাদ দিয়েছেন (opt-out)" v={state.optOut.map((o) => `${o.name} · ${o.why}`).join(' · ') || 'কেউ না'} />
        <Note tone="warn"><><ShieldCheck size={14} className="inline -mt-0.5 mr-1" /><b>opt-out মানা বাধ্যতামূলক</b> — যিনি বিপণন বার্তা বন্ধ করেছেন তাঁকে শুধু লেনদেন-সম্পর্কিত বাধ্যতামূলক নোটিশ যাবে; রসিদের SMS কোনো অবস্থাতেই বন্ধ হয় না (D-23)।</></Note>
      </Card>

      <Note tone="info"><><b>বার্তায় কখনো “সুদ” শব্দ নয়</b> — টেমপ্লেটে বিলম্ব ফিকে স্পষ্টভাবে “৳২০ ফি (সুদ নয়)” লেখা হয়, যাতে সুদ ও ফি গুলিয়ে না ফেলেন (D-01/D-08)।</></Note>
      <Note tone="warn"><><WifiOff size={14} className="inline -mt-0.5 mr-1" />সংযোগ না থাকলে বার্তা কিউতে থাকবে — পাঠানোর চেষ্টা ব্যর্থ হলেও লগে থাকবে।</></Note>

      <div className="mt-2"><Progress pct={Math.min(100, (state.sms.balance / (state.sms.lowAt * 5)) * 100)} tone={low ? 'danger' : 'ok'} /></div>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Send size={15} />} onClick={() => setMsg('এখনই পাঠানো — কিউতে যোগ হয়েছে (ডেমো)')}>এখনই পাঠান</Button>
        <Button variant="secondary" className="grow" icon={<Settings size={15} />} onClick={() => navigate(`/a/settings${roleQS}`)}>সেটিংস</Button>
        <Button className="grow" onClick={() => setMsg('নতুন টেমপ্লেট — ফর্ম উপরে (ডেমো)')}>নতুন টেমপ্লেট</Button>
      </div>
      <SectionHead title="সময়সূচি" sub="গ্রেস শেষ → স্মারক → ফি" />
      <p className="text-sm text-txt-2">বকেয়া হলে গ্রেস শেষ হওয়ার ৩ দিনের মধ্যে স্মারক; বিলম্ব ফি বসার পরে নোটিশ — সব SMS লগে থাকবে।</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="ok">D-08 ফি = নির্ধারিত, সুদ নয়</Badge>
        <Badge tone="info">D-23 সম্মতি</Badge>
        <Badge tone="neutral">রসিদ SMS সর্বদা চালু</Badge>
      </div>
    </div>
  );
}
