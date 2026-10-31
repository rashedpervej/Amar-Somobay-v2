import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { useAdminJg } from '../../../store/adminJointStore';
import { JG_CRULE, JG_LIMIT, jgLimitLeft } from '../../../domain/adminJoint';
import { bn } from '../../../lib/bn';
import { Note, Page } from './webParts';

export default function JgGoalNew() {
  const s = useAdminJg();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: '', desc: '', target: '', targetDate: '2027-03-31',
    crule: 'flexible' as 'fixed' | 'flexible', monthly: '', maxParts: '10', join: 'invited' as 'invited' | 'open',
  });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    const r = s.createGoal({
      name: f.name, desc: f.desc, target: Number(f.target), targetDate: f.targetDate,
      crule: f.crule, monthly: Number(f.monthly), maxParts: Number(f.maxParts), join: f.join,
    });
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
  };

  return (
    <Page title="নতুন যৌথ লক্ষ্য" sub="নিয়ম ও সংস্করণ · কমিটির সিদ্ধান্ত · যোগদান অনুমোদন" back="/w/jg/goals"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/jg/goals')}>বাতিল</Button><Button size="sm" onClick={submit}>লক্ষ্য তৈরি করুন</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg} — <button type="button" className="min-h-10 underline font-bold" onClick={() => nav('/w/jg/goals')}>তালিকায় দেখুন</button></Note>}
      <Note tone="warn">সক্রিয় লক্ষ্যের সীমা {bn(JG_LIMIT)} — এখন বাকি {bn(jgLimitLeft(s.state.goals))}টি (D-43)।</Note>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="লক্ষ্যের তথ্য" sub="সব ঘর যাচাই হবে">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2"><span className="text-sm font-bold">লক্ষ্যের নাম *</span>
              <input value={f.name} onChange={set('name')} placeholder="যেমন: গ্রামীণ পাঠাগার নির্মাণ" className={`${inputCls} mt-1`} />
            </label>
            <label className="block sm:col-span-2"><span className="text-sm font-bold">উদ্দেশ্য * (১০+ অক্ষর)</span>
              <textarea rows={3} value={f.desc} onChange={set('desc')} placeholder="কী কাজ হবে, কারা উপকৃত হবেন, অর্থ কীভাবে ব্যবহার হবে" className={`${inputCls} mt-1 py-2`} />
            </label>
            <label className="block"><span className="text-sm font-bold">লক্ষ্য অঙ্ক (৳) *</span>
              <input type="number" value={f.target} onChange={set('target')} className={`${inputCls} mt-1 num`} />
            </label>
            <label className="block"><span className="text-sm font-bold">মেয়াদ *</span>
              <input type="date" value={f.targetDate} onChange={set('targetDate')} className={`${inputCls} mt-1`} />
            </label>
            <label className="block"><span className="text-sm font-bold">সর্বোচ্চ অংশগ্রহণকারী *</span>
              <input type="number" value={f.maxParts} onChange={set('maxParts')} className={`${inputCls} mt-1 num`} />
            </label>
            <label className="block"><span className="text-sm font-bold">যোগদান</span>
              <select value={f.join} onChange={set('join')} className={`${inputCls} mt-1`}>
                <option value="invited">আমন্ত্রণে (Admin অনুমোদন)</option>
                <option value="open">খোলা (Admin অনুমোদন তবু লাগবে)</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <span className="text-sm font-bold">অবদানের নিয়ম *</span>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                {(['fixed', 'flexible'] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setF((x) => ({ ...x, crule: k }))}
                    className={`min-h-tap rounded-r-sm border px-3 py-2 text-left ${f.crule === k ? 'border-green-600 bg-green-050' : 'border-line-3 bg-card'}`}>
                    <b className="text-sm">{JG_CRULE[k]}</b>
                    <span className="block text-xs text-mut mt-0.5">{k === 'fixed' ? 'প্রতি মাসে নির্দিষ্ট কিস্তি' : 'সীমার ভেতরে নমনীয়'}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="block"><span className="text-sm font-bold">{f.crule === 'fixed' ? 'মাসিক কিস্তি (৳) *' : 'ন্যূনতম অবদান (৳) *'}</span>
              <input type="number" value={f.monthly} onChange={set('monthly')} className={`${inputCls} mt-1 num`} />
            </label>
          </div>
        </Card>

        <div className="space-y-3">
          <Card title="নিয়ন্ত্রণ">
            <ul className="text-sm space-y-1.5 text-txt-2">
              <li>• লক্ষ্য অঙ্ক পরে কমানো যাবে না (D-49)</li>
              <li>• যোগদানে Admin অনুমোদন বাধ্যতামূলক</li>
              <li>• ব্যক্তিগত উত্তোলন নেই (BR-19)</li>
              <li>• অর্থ earmarked — অন্য তহবিলে নয় (D-39)</li>
              <li>• কমিটি সিদ্ধান্ত নম্বর পরে যোগ করতে হবে</li>
            </ul>
          </Card>
          <Note>তৈরি হলে লক্ষ্য “forming” অবস্থায় থাকবে — কমিটি ও যোগদান অনুমোদনের পর সক্রিয় হবে।</Note>
        </div>
      </div>
    </Page>
  );
}
