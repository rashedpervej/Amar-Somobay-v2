import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import { jgChannelLabel, jgGoalById, jgPaidOut, jgSpend } from '../../../domain/adminJoint';
import { Note, Page, StatBar } from './webParts';

export default function JgSpend() {
  const s = useAdminJg();
  const nav = useNavigate();
  const eligible = s.state.goals.filter((g) => g.status === 'achieved' || g.status === 'settling');
  const [goal, setGoal] = useState(eligible[0]?.id ?? '');
  const [purpose, setPurpose] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState<'cash_office' | 'bkash' | 'bank'>('bank');
  const [evidence, setEvidence] = useState('');
  const [approver, setApprover] = useState('নাসরিন আক্তার');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const pending = s.state.disbs.filter((d) => d.status === 'approval');

  const req = () => {
    const r = s.requestDisb(goal, { purpose, payee, amount: Number(amount), channel, evidence });
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
  };
  const act = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="অর্থ ব্যবহার ও বিতরণ" sub="প্রমাণ ছাড়া ভাউচার নয় (D-50) ·maker ≠ checker (BR-04) · ব্যক্তিগত উত্তোলন নেই (BR-19)"
      back="/w/jg"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/jg/reports')}>রিপোর্ট</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <StatBar items={[
        { k: 'পরিশোধিত', v: `৳${bn(jgSpend(s.state.disbs))}`, tone: 'ok' },
        { k: 'অনুমোদন বাকি', v: bn(pending.length), tone: pending.length ? 'warn' : 'ok' },
        { k: 'আটকানো', v: bn(s.state.disbs.filter((d) => d.status === 'blocked').length), tone: 'danger' },
        { k: 'যোগ্য লক্ষ্য', v: bn(eligible.length) },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card title="নতুন বিতরণ ভাউচার" sub="লক্ষ্য পূরণের পরেই (BR-19)">
          <div className="space-y-3">
            <label className="block"><span className="text-sm font-bold">লক্ষ্য</span>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className={`${inputCls} mt-1`}>
                {eligible.map((g) => <option key={g.id} value={g.id}>{g.code} · {g.name}</option>)}
                {!eligible.length && <option value="">কোনো লক্ষ্য পূরণ হয়নি</option>}
              </select>
            </label>
            <label className="block"><span className="text-sm font-bold">কাজের বিবরণ *</span>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className={`${inputCls} mt-1`} placeholder="যেমন: নলকূপ স্থাপন — ১ম কিস্তি" />
            </label>
            <label className="block"><span className="text-sm font-bold">প্রাপক *</span>
              <input value={payee} onChange={(e) => setPayee(e.target.value)} className={`${inputCls} mt-1`} placeholder="ভেন্ডর / কমিটি / প্রতিষ্ঠান" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="text-sm font-bold">অঙ্ক (৳) *</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} mt-1 num`} />
              </label>
              <label className="block"><span className="text-sm font-bold">মাধ্যম</span>
                <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className={`${inputCls} mt-1`}>
                  {(['bank', 'bkash', 'cash_office'] as const).map((k) => <option key={k} value={k}>{jgChannelLabel(k)}</option>)}
                </select>
              </label>
            </div>
            <label className="block"><span className="text-sm font-bold">প্রমাণের রেফারেন্স *</span>
              <input value={evidence} onChange={(e) => setEvidence(e.target.value)} className={`${inputCls} mt-1`} placeholder="কোটেশন, কমিটি সিদ্ধান্ত, রসিদ (কমা দিয়ে একাধিক)" />
            </label>
            <Button block onClick={req}>ভাউচার তৈরি ও অনুমোদনে পাঠান</Button>
            <p className="text-xs text-mut">ভাউচার তৈরি করলে অনুমোদনকারী আলাদা হতে হবে; প্রমাণ ছাড়া অর্থ মুক্তি পায় না।</p>
          </div>
        </Card>

        <div className="space-y-3">
          <Card title="অনুমোদনের অপেক্ষায়" sub="প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না">
            {pending.length === 0 && <p className="text-sm text-mut">কোনো ভাউচার অপেক্ষমাণ নেই ✅</p>}
            {pending.map((d) => (
              <div key={d.id} className="rounded-r-sm border border-line p-3 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="grow">{d.no} · {d.purpose}</b>
                  <Badge tone="warn">৳{bn(d.amount)}</Badge>
                </div>
                <p className="text-xs text-mut mt-1">{jgGoalById(s.state.goals, d.goal).code} · প্রাপক {d.payee} · {jgChannelLabel(d.channel)}</p>
                <p className="text-xs text-mut">প্রমাণ: {d.evidence.join(' · ') || 'নেই'} · প্রস্তুতকারী {d.by}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <select value={approver} onChange={(e) => setApprover(e.target.value)} className={`${inputCls} min-h-9 max-w-52 text-sm`}>
                    {['নাসরিন আক্তার', 'মোঃ আব্দুল্লাহ', 'কামরুল হাসান', 'সুমি রানী দাস'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <Button size="sm" onClick={() => act(s.approveDisb(d.id, approver))}>অনুমোদন ও পরিশোধ</Button>
                  <Button size="sm" variant="secondary" onClick={() => act(s.rejectDisb(d.id))}>আটকান</Button>
                </div>
              </div>
            ))}
          </Card>

          <Card title="সব ভাউচার" sub="লক্ষ্যভিত্তিক বিতরণ">
            <DataTable
              columns={[
                { key: 'no', head: 'ভাউচার', render: (r) => <b className="num">{r.no}</b> },
                { key: 'goal', head: 'লক্ষ্য', render: (r) => jgGoalById(s.state.goals, r.goal).code },
                { key: 'purpose', head: 'কাজ' },
                { key: 'payee', head: 'প্রাপক' },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => `৳${bn(r.amount)}` },
                { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'paid' ? 'ok' : r.status === 'approval' ? 'warn' : r.status === 'blocked' ? 'danger' : 'neutral'}>{r.status === 'paid' ? 'পরিশোধিত' : r.status === 'approval' ? 'অনুমোদন বাকি' : r.status === 'blocked' ? 'আটকানো' : 'পরিকল্পিত'}</Badge> },
                { key: 'by', head: 'প্রস্তুত / অনুমোদন', render: (r) => <><span className="block text-xs">{r.by ?? '—'}</span><span className="block text-xs text-mut">{r.appr ?? '—'}</span></> },
              ]}
              rows={s.state.disbs}
            />
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="লক্ষ্যভিত্তিক ব্যবহার" sub="লক্ষ্য পূরণের পর ব্যয়">
          <DataTable
            columns={[
              { key: 'goal', head: 'লক্ষ্য', render: (r) => <>{r.code}<span className="block text-xs text-mut">{r.name}</span></> },
              { key: 'paid', head: 'পরিশোধিত', align: 'right', render: (r) => `৳${bn(jgPaidOut(s.state.disbs, r.id))}` },
              { key: 'target', head: 'লক্ষ্য', align: 'right', render: (r) => `৳${bn(r.target)}` },
            ]}
            rows={s.state.goals}
          />
        </Card>
        <Note>বিতরণ অনুমোদন সীমা: MANAGER ৳৫০,০০০ · APPROVER ৳২,০০,০০০ · ORG_ADMIN সীমাহীন (ডেমো নীতি)। সীমার বেশি হলে আরও অনুমোদন লাগবে; অর্থ কখনো ব্যক্তিগত অ্যাকাউন্টে নয়।</Note>
      </div>
    </Page>
  );
}
