/* ============================================================
   src/apps/member/screens/GoalJoin.tsx — JM-03 যোগদান ও প্রতিশ্রুতি
   যোগ্যতার ৫টি শর্ত → প্রতিশ্রুতির অঙ্ক → সম্মতি → যোগদান (স্টোরে সেভ)।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Info, Plus, X } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';
import { useModules } from '../../../store/moduleStore';
import { partsOf } from '../../../domain/joint';

export default function GoalJoin() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { goalById, parts, joinGoal } = useModules();
  const { state } = useMember();
  const g = goalById(goalId);
  const [pledged, setPledged] = useState<number | ''>(g?.rule === 'fixed' ? g.monthly ?? 0 : g?.min ?? 500);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const joined = useMemo(() => parts.some((p) => p.goalId === goalId && p.isMe && p.status === 'active'), [parts, goalId]);

  if (!g) {
    return (
      <div className="p-4">
        <Card title="লক্ষ্য পাওয়া যায়নি">
          <Button onClick={() => navigate('/m/goals')}>ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const seats = partsOf(parts, g.id).filter((p) => p.status !== 'invited').length;
  const eligible = [
    ['সদস্য অবস্থা সক্রিয়', state.profile.kycStatus !== 'rejected', 'সক্রিয় সদস্য'],
    ['KYC যাচাই সম্পন্ন', state.profile.kycStatus === 'verified', state.profile.kycStatus === 'verified' ? 'NID যাচাইকৃত' : 'প্রোফাইল থেকে KYC সম্পন্ন করুন'],
    ['আমন্ত্রণ / খোলা যোগদান', g.join === 'open' || !!parts.find((p) => p.goalId === g.id && p.isMe), g.join === 'open' ? 'যে কেউ যোগ দিতে পারেন' : 'আমন্ত্রণ পাওয়া গেছে'],
    ['অংশগ্রহণের আসন খালি', seats < g.maxParts, `${bn(seats)}/${bn(g.maxParts)} জন যোগ দিয়েছেন`],
    ['লক্ষ্যের মেয়াদ বাকি', true, `${g.targetDate} পর্যন্ত`],
  ] as [string, boolean, string][];
  const allOk = eligible.every((r) => r[1]);

  async function submit() {
    const v = typeof pledged === 'number' ? pledged : 0;
    if (joined) {
      setError('আপনি ইতিমধ্যে এই লক্ষ্যে আছেন');
      return;
    }
    if (!v) {
      setError('প্রতিশ্রুতির অঙ্ক লিখুন');
      return;
    }
    if (g!.rule === 'fixed' && g!.monthly && v < g!.monthly) {
      setError(`এই লক্ষ্যে নির্দিষ্ট ৳${bn(g!.monthly)}/মাস — কম দেওয়া যাবে না`);
      return;
    }
    if (g!.rule === 'flexible' && (v < (g!.min ?? 0) || v > (g!.max ?? 0))) {
      setError(`সীমা ৳${bn(g!.min ?? 0)}–৳${bn(g!.max ?? 0)}`);
      return;
    }
    if (!agree) {
      setError('তহবিলের শর্তে সম্মতি দিন');
      return;
    }
    setError('');
    setBusy(true);
    await joinGoal(g!.id, v);
    setBusy(false);
    setDone(true);
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      {done ? <SuccessBanner title="যোগদান সম্পন্ন">আপনি {g.name}-এ যুক্ত হয়েছেন — প্রতিশ্রুতি ৳{bn(typeof pledged === 'number' ? pledged : 0)}।</SuccessBanner> : null}

      <Card title={g.name} sub={`${g.code} · ${bn(seats)}/${bn(g.maxParts)} জন`} right={<Badge tone={g.status === 'forming' ? 'info' : 'ok'}>{g.status === 'forming' ? 'গঠনধীন' : 'চলমান'}</Badge>}>
        <p className="text-sm text-txt-2">{g.desc}</p>
        <div className="mt-3">
          <div className="text-xs font-bold text-mut mb-1.5">যোগ্যতার শর্ত</div>
          <ul className="space-y-1.5">
            {eligible.map(([label, ok, detail]) => (
              <li key={label} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 w-5 h-5 rounded-r-pill grid place-items-center shrink-0 ${ok ? 'bg-ok-bg text-ok-ink' : 'bg-danger-bg text-danger-ink'}`}>
                  {ok ? <Check size={12} /> : <X size={12} />}
                </span>
                <span className="grow">
                  <span className={`font-bold ${ok ? 'text-txt' : 'text-danger'}`}>{label}</span>
                  <span className="block text-xs text-mut">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title="আমার প্রতিশ্রুতি" sub={g.rule === 'fixed' ? `নির্দিষ্ট ৳${bn(g.monthly ?? 0)}/মাস` : `সীমা ৳${bn(g.min ?? 0)}–৳${bn(g.max ?? 0)}`}>
        <Field label="মাসিক প্রতিশ্রুতি (৳)" required error={error}>
          {(id) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              value={pledged}
              onChange={(e) => { setPledged(e.target.value === '' ? '' : Number(e.target.value)); setError(''); }}
              className={inputClass(error) + ' num min-h-tap text-h3 font-extrabold'}
            />
          )}
        </Field>
        <div className="flex gap-2 mt-2">
          {(g.rule === 'fixed' ? [g.monthly ?? 0] : [g.min ?? 0, Math.round(((g.min ?? 0) + (g.max ?? 0)) / 2), g.max ?? 0]).map((v) => (
            <button key={v} type="button" onClick={() => setPledged(v)} className={`min-h-tap flex-1 rounded-r-sm border text-sm font-bold ${pledged === v ? 'border-green-700 bg-green-050 text-green-800' : 'border-line bg-card text-txt-2'}`}>
              ৳{bn(v)}
            </button>
          ))}
        </div>
        <label className="flex items-start gap-2 mt-3 py-1">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 w-5 h-5" />
          <span className="text-xs text-txt-2 leading-relaxed">
            আমি জানি এই অবদান <b>লক্ষ্য-নির্দিষ্ট তহবিলে</b> যায়, ব্যক্তিগতভাবে তোলা যায় না (BR-19); লক্ষ্য পূরণ না হলে
            {g.deadlinePolicy.join(' → ')} প্রযোজ্য।
          </span>
        </label>
      </Card>

      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs flex gap-2">
        <Info size={15} className="mt-0.5 shrink-0" />
        <span>একাধিক লক্ষ্যে থাকলে অবদান দেওয়ার সময় লক্ষ্য বাছাই বাধ্যতামূলক — ভুল তহবিলে টাকা যাওয়া রোধ করতে।</span>
      </div>

      {!allOk ? <ErrorBanner>উপরের শর্তগুলো পূরণ না হলে যোগদান সম্পন্ন হবে না</ErrorBanner> : null}

      <Button block size="lg" icon={<Plus size={18} />} onClick={submit} disabled={busy || joined || done || !allOk}>
        {busy ? 'যোগদান হচ্ছে…' : joined ? 'ইতিমধ্যে যোগদান করেছেন' : 'যোগদান নিশ্চিত করুন'}
      </Button>
      <Button block variant="ghost" onClick={() => navigate(`/m/goals/${g.id}`)}>
        লক্ষ্য বিস্তারিত দেখুন
      </Button>
    </div>
  );
}
