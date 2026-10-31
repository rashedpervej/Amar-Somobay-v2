/* JAM-03 · নতুন যৌথ লক্ষ্য (৩ ধাপ) — মৌলিক তথ্য · অবদানের নিয়ম · মেয়াদ ও নিষ্পত্তি */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { JG_DEADLINE, JG_LIMIT, JG_OWN, JG_STEP, JG_USE, jgActive, jgLimitLeft } from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { Stepper } from './parts';
import { PoolRow, tk, useRoleQS } from './rcParts';

const STEPS = ['মৌলিক তথ্য', 'অবদানের নিয়ম', 'মেয়াদ ও নিষ্পত্তি'];

export default function JgNew() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, createGoal } = useAdminJg();
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [f, setF] = useState({
    name: '', desc: '', target: '', targetDate: '2027-01-31',
    crule: 'fixed' as 'fixed' | 'flexible', monthly: '1000', maxParts: '10', join: 'invited' as 'invited' | 'open',
  });

  const submit = () => {
    setErr(''); setMsg('');
    const r = createGoal({
      name: f.name, desc: f.desc, target: Number(f.target), targetDate: f.targetDate,
      crule: f.crule, monthly: Number(f.monthly), maxParts: Number(f.maxParts), join: f.join,
    });
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
    setStep(2);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/jg/goals${qs}`)}>লক্ষ্য তালিকা</Button>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <b>৩ ধাপে লক্ষ্য</b>
          <Badge tone="info">ধাপ {bn(step + 1)}/৩</Badge>
        </div>
        <div className="mt-3"><Stepper steps={STEPS} cur={step} /></div>
      </Card>

      {msg ? <SuccessBanner title={msg}>যোগদানে Admin অনুমোদন বাধ্যতামূলক (D-49) — লক্ষ্য তালিকায় এখনই দেখা যাবে।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {step === 0 ? (
        <>
          <SectionHead title="১ · মৌলিক তথ্য" sub="নাম, উদ্দেশ্য ও অঙ্ক" />
          <Card>
            <div className="space-y-3">
              <Field label="লক্ষ্যের নাম" required hint="সদস্যরা এই নামেই দেখবেন (JM-01)">
                {(id) => <input id={id} className={inputClass()} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="যেমন: মসজিদ সংস্কার ও ছাদ মেরামত" />}
              </Field>
              <Field label="লক্ষ্য কোড" hint="স্বয়ংক্রিয় — JG-YYMM-##; একবার তৈরি হলে বদলানো যায় না (BR-08)">
                {(id) => <input id={id} className={inputClass()} value="JG-2611-0৬" readOnly />}
              </Field>
              <Field label="উদ্দেশ্যের বিবরণ" required hint="সদস্যদের কাছে প্রকাশিত হয় — স্বচ্ছতার অংশ">
                {(id) => <textarea id={id} rows={3} className={inputClass()} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="কেন এই লক্ষ্য, টাকা কোথায় খরচ হবে, কারা উপকার পাবেন" />}
              </Field>
              <Field label="লক্ষ্য অঙ্ক (৳)" required hint="তৈরির পর কমানো যাবে না; বাড়ালে নতুন সংস্করণ (D-49)">
                {(id) => <input id={id} type="number" className={inputClass()} value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} placeholder="20000" />}
              </Field>
              <Field label="শেষ মেয়াদ" required hint="মেয়াদ শেষে নতুন অবদান বন্ধ; নিষ্পত্তির ধাপ শুরু (D-39)">
                {(id) => <input id={id} type="date" className={inputClass()} value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} />}
              </Field>
            </div>
            <Button block className="mt-3" onClick={() => { setErr(''); if (f.name.trim().length < 4 || f.desc.trim().length < 10 || !Number(f.target)) { setErr('নাম, বিবরণ (১০+) ও লক্ষ্য অঙ্ক পূরণ করুন'); return; } setStep(1); }}>পরবর্তী ধাপ</Button>
          </Card>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <SectionHead title="২ · অংশগ্রহণ ও অবদানের নিয়ম" sub="D-49" />
          <Card>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-bold text-txt-2 mb-1.5">যোগদানের ধরন</div>
                <div className="flex gap-2">
                  {(['invited', 'open'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setF({ ...f, join: k })}
                      className={`grow min-h-tap rounded-r-sm border text-sm font-bold ${f.join === k ? 'bg-purple text-white border-purple-ink' : 'bg-card border-line-3 text-txt-2'}`}>
                      {k === 'invited' ? 'আমন্ত্রণে' : 'খোলা'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-mut mt-1">সব ক্ষেত্রেই Admin অনুমোদন বাধ্যতামূলক (D-49)।</p>
              </div>
              <Field label="সর্বোচ্চ অংশগ্রহণকারী" hint="৩–৫০ জন">
                {(id) => <input id={id} type="number" className={inputClass()} value={f.maxParts} onChange={(e) => setF({ ...f, maxParts: e.target.value })} />}
              </Field>
              <div>
                <div className="text-sm font-bold text-txt-2 mb-1.5">অবদানের নিয়ম</div>
                <div className="flex gap-2">
                  {(['fixed', 'flexible'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setF({ ...f, crule: k })}
                      className={`grow min-h-tap rounded-r-sm border text-sm font-bold ${f.crule === k ? 'bg-purple text-white border-purple-ink' : 'bg-card border-line-3 text-txt-2'}`}>
                      {k === 'fixed' ? 'নির্দিষ্ট মাসিক' : 'নমনীয়'}
                    </button>
                  ))}
                </div>
              </div>
              <Field label={f.crule === 'fixed' ? 'মাসিক অবদান (৳)' : 'ন্যূনতম মাসিক (৳)'} required>
                {(id) => <input id={id} type="number" className={inputClass()} value={f.monthly} onChange={(e) => setF({ ...f, monthly: e.target.value })} />}
              </Field>
              <p className="text-xs text-mut">প্রতিকারের ধাপ: {JG_STEP.map((x) => x[1]).join(' → ')} · কোনো বিলম্ব ফি নেই (D-49)।</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" onClick={() => setStep(0)}>পেছনে</Button>
              <Button className="grow" onClick={() => setStep(2)}>পরবর্তী ধাপ</Button>
            </div>
          </Card>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <SectionHead title="৩ · মেয়াদ, মালিকানা ও নিষ্পত্তি" sub="D-39 · D-50" />
          <Card>
            <PoolRow label="লক্ষ্য অঙ্ক" value={tk(Number(f.target || 0))} />
            <div className="mt-2"><PoolRow label="মেয়াদ" value={f.targetDate} /></div>
            <div className="mt-2"><PoolRow label="অংশগ্রহণকারী সীমা" value={`${bn(Number(f.maxParts || 0))} জন`} /></div>
            <div className="mt-2"><PoolRow label="অবদানের নিয়ম" value={f.crule === 'fixed' ? `নির্দিষ্ট ${tk(Number(f.monthly || 0))}/মাস` : `নমনীয় · ন্যূনতম ${tk(Number(f.monthly || 0))}`} />
            </div>
            <div className="mt-2"><PoolRow label="টাকার মালিকানা" value={JG_OWN[0][1]} tone="ok" /></div>
            <div className="mt-2"><PoolRow label="মেয়াদে পূরণ না হলে" value={JG_DEADLINE[0][1]} tone="warn" /></div>
            <div className="mt-2"><PoolRow label="অর্থ ব্যবহার" value={JG_USE.slice(0, 2).map((u) => u[1]).join(' · ')} /></div>
          </Card>

          <SectionHead title="সংরক্ষণের আগে যাচাই" />
          <Card>
            <PoolRow label="লক্ষ্য অঙ্ক > ০" value={`${tk(Number(f.target || 0))} ✓`} tone="ok" />
            <div className="mt-2"><PoolRow label="মেয়াদ আজকের পরে" value={`${f.targetDate} ✓`} tone="ok" /></div>
            <div className="mt-2"><PoolRow label="সক্রিয় লক্ষ্যের সীমা" value={`${bn(jgActive(state.goals).length)} + ১ ≤ ${bn(JG_LIMIT)} ✓`} tone={jgLimitLeft(state.goals) ? 'ok' : 'warn'} /></div>
            <div className="mt-2"><PoolRow label="কমিটির সিদ্ধান্ত নম্বর" value="সংরক্ষণের পর যোগ করতে হবে" tone="warn" /></div>
            <p className="text-xs text-mut mt-2 flex items-start gap-1"><Info size={13} className="mt-0.5" /> সব নিয়ম সংস্করণভিত্তিক সংরক্ষিত হয়; পরে বদলালে পুরোনো সংস্করণের হিসাব অপরিবর্তিত থাকে।</p>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={!!msg}>পেছনে</Button>
              <Button className="grow" icon={<CheckCircle2 size={16} />} onClick={submit} disabled={!!msg}>অনুমোদনে পাঠান</Button>
            </div>
            {msg ? <Button block variant="secondary" className="mt-2" onClick={() => navigate(`/a/jg/goals${qs}`)}>লক্ষ্য তালিকায় দেখুন</Button> : null}
          </Card>
        </>
      ) : null}
    </div>
  );
}
