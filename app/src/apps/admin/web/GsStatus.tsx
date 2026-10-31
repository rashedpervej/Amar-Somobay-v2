/* A-12 · সদস্য অবস্থা পরিবর্তন — suspend / dormant / exited, কারণ ও কমিটি বাধ্যতামূলক */
import { useState } from 'react';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import type { MemStatus } from '../../../domain/admin';
import { Note, Page } from './webParts';
import { Field, MEMBER_STATUS, MemberStatus } from './gsParts';

const TARGETS: { v: MemStatus; t: string; d: string }[] = [
  { v: 'active', t: 'সক্রিয়', d: 'স্বাভাবিক লেনদেন চালু' },
  { v: 'dormant', t: 'নিষ্ক্রিয়', d: '৯০ দিন বকেয়া হলে (D-07)' },
  { v: 'suspended', t: 'স্থগিত', d: 'তদন্ত/শৃঙ্খলা — কমিটির সিদ্ধান্ত লাগবে' },
  { v: 'exited', t: 'প্রস্থান', d: 'চূড়ান্ত নিষ্পত্তি — ডেটা মুছবে না' },
];

export default function GsStatus() {
  const { state, changeStatus } = useAdmin();
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const m = state.members.find((x) => x.id === memberId) ?? state.members[0];
  const [to, setTo] = useState<MemStatus>('dormant');
  const [reason, setReason] = useState('বকেয়ার কারণে নিষ্ক্রিয়');
  const [detail, setDetail] = useState('');
  const [committeeNo, setCommitteeNo] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const submit = () => {
    if (!m) return;
    const r = changeStatus(m.id, to, reason, detail, committeeNo);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setDetail(''); }
  };

  return (
    <Page title="সদস্য অবস্থা পরিবর্তন" sub="D-07 · D-13 · ইতিহাস অক্ষত রাখা হয়, কোনো তথ্য মুছে ফেলা হয় না · ডেমো"
      back="/w/members">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Card title="সদস্য ও বর্তমান অবস্থা" sub="অবস্থা বদলালেও পুরনো লেনদেন ও অডিট থাকবে">
            <Field label="সদস্য">
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
                {state.members.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.no} · {x.mobile}</option>)}
              </select>
            </Field>
            {m && (
              <div className="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
                <p>নম্বর: <b className="num">{m.no}</b></p>
                <p>রুট: <b>{m.route}</b></p>
                <p>বর্তমান অবস্থা: <MemberStatus s={m.status} /></p>
              </div>
            )}
          </Card>

          <Card title="নতুন অবস্থা" sub="স্থগিত/প্রস্থানের জন্য কমিটির সিদ্ধান্ত নম্বর লাগবে">
            <div className="grid sm:grid-cols-2 gap-2">
              {TARGETS.map((t) => (
                <button key={t.v} type="button" onClick={() => setTo(t.v)}
                  className={`min-h-10 rounded-r-sm border px-3 py-2 text-left text-sm ${to === t.v ? 'border-green-700 bg-green-050' : 'border-line-3 bg-card hover:bg-green-050'}`}>
                  <span className="flex items-center justify-between gap-2"><b>{t.t}</b><Badge tone={MEMBER_STATUS[t.v].tone}>{MEMBER_STATUS[t.v].t}</Badge></span>
                  <span className="block text-xs text-mut mt-0.5">{t.d}</span>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <Field label="কারণ (শ্রেণি)">
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
                  {['বকেয়ার কারণে নিষ্ক্রিয়', 'তদন্তাধীন — কমিটির নির্দেশ', 'সদস্যের লিখিত অনুরোধ', 'মৃত্যু — দাবি প্রক্রিয়াধীন', 'শৃঙ্খলা ভঙ্গ'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="কমিটির সিদ্ধান্ত নম্বর" hint="স্থগিত ও প্রস্থানে বাধ্যতামূলক">
                <input value={committeeNo} onChange={(e) => setCommitteeNo(e.target.value)} className={inputCls} placeholder="CM-2610-12" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="বিস্তারিত কারণ" hint="অন্তত ৫ অক্ষর — অডিট লগে যাবে">
                  <textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} className={`${inputCls} py-2`} placeholder="কী দেখে সিদ্ধান্ত — তারিখ, প্রমাণ, সভার নম্বর" />
                </Field>
              </div>
            </div>
            <Button className="mt-3" onClick={submit}>অবস্থা পরিবর্তন করুন</Button>
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="নিয়ম" sub="D-07 · D-13">
            <ul className="text-sm text-mut space-y-2 leading-relaxed">
              <li>• নিষ্ক্রিয় = ৯০ দিন বকেয়া; নতুন জমা নেওয়া যাবে, উত্তোলন সীমিত।</li>
              <li>• স্থগিত = তদন্ত চলছে; উভয় দিক বন্ধ, কমিটির সিদ্ধান্ত ছাড়া ফেরানো যাবে না।</li>
              <li>• প্রস্থান = চূড়ান্ত নিষ্পত্তির পরে; তথ্য আর্কাইভে থাকে, মুছে যায় না (R-02)।</li>
              <li>• প্রতিটি পরিবর্তনে কারণ, কে করলেন ও কখন — অডিট লগে অপরিবর্তনীয়।</li>
            </ul>
          </Card>
          <Card title="বর্তমান সদস্যের ঝুঁকি">
            {m && (
              <div className="space-y-1.5 text-sm">
                <p>বকেয়া কিস্তি: <b className="num">{bn(state.dues.filter((d) => d.memberId === m.id).length)}</b></p>
                <p>মোট বাকি: <b className="num">৳{bn(state.dues.filter((d) => d.memberId === m.id).reduce((n, d) => n + (d.amount - d.paid), 0))}</b></p>
                <p>KYC: <Badge tone={m.kyc === 'verified' ? 'ok' : 'warn'}>{m.kyc === 'verified' ? 'যাচাই' : 'অসম্পূর্ণ'}</Badge></p>
              </div>
            )}
          </Card>
          <Note>অবস্থা বদলানো মানে টাকা মাফ নয়; বকেয়া আলাদা প্রক্রিয়ায় (D-09)। সুদ নেই।</Note>
          <Note tone="warn">ডেমো: কোনো বাস্তব সদস্যের তথ্য পরিবর্তন হয় না, শুধু এই সেশনে দেখানো হয়।</Note>
        </div>
      </div>
    </Page>
  );
}
