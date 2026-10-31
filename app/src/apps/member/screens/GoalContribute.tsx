/* ============================================================
   src/apps/member/screens/GoalContribute.tsx — JM-04/my অবদান ও ইতিহাস
   লক্ষ্য বাছাই → অঙ্ক → মাধ্যম → নিশ্চিতকরণ; সফল হলে রসিদ + ইতিহাস হালনাগাদ।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Receipt, Send } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { channelLabel, collected, myContribs, myPaid, myPart, pct, type JgContrib } from '../../../domain/joint';

const CHANNELS: JgContrib['channel'][] = ['collector', 'office', 'bkash'];

export default function GoalContribute() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { goals, parts, contribs, contributeGoal } = useModules();
  const myGoals = goals.filter((g) => myPart(parts, g.id)?.status === 'active');
  const [selected, setSelected] = useState(goalId ?? myGoals[0]?.id ?? '');
  const g = goals.find((x) => x.id === selected) ?? myGoals[0];
  const [amount, setAmount] = useState<number | ''>(g?.rule === 'fixed' ? g.monthly ?? 1500 : g?.min ?? 500);
  const [channel, setChannel] = useState<JgContrib['channel']>('collector');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ receipt: string; amount: number } | null>(null);

  const paid = g ? myPaid(contribs, g.id) : 0;
  const list = g ? myContribs(contribs, g.id) : [];
  const value = typeof amount === 'number' ? amount : 0;

  async function submit() {
    if (!g) return;
    if (!value) {
      setError('অবদানের অঙ্ক লিখুন');
      return;
    }
    if (g.rule === 'flexible' && (value < (g.min ?? 0) || value > (g.max ?? 0))) {
      setError(`সীমা ৳${bn(g.min ?? 0)}–৳${bn(g.max ?? 0)}`);
      return;
    }
    if (g.rule === 'fixed' && g.monthly && value < g.monthly) {
      setError(`নির্দিষ্ট ৳${bn(g.monthly)}/মাস — এর কম নয়`);
      return;
    }
    setError('');
    setBusy(true);
    const r = await contributeGoal(g.id, value, channel);
    setBusy(false);
    setReceipt({ receipt: r.receipt, amount: r.amount });
    setNote('');
  }

  if (!g) {
    return (
      <div className="p-4">
        <Card title="কোনো সক্রিয় লক্ষ্য নেই" sub="আগে একটি লক্ষ্যে যোগ দিন">
          <Button onClick={() => navigate('/m/goals')}>লক্ষ্য দেখুন</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      {receipt ? (
        <div className="rounded-r-md bg-ok-bg border border-ok-bd px-4 py-4 text-center">
          <CheckCircle2 size={34} className="mx-auto text-ok" />
          <div className="font-extrabold text-ok-ink mt-1">অবদান জমা হয়েছে</div>
          <div className="text-sm text-ok-ink/90 mt-0.5">৳{bn(receipt.amount)} · রসিদ {receipt.receipt}</div>
        </div>
      ) : null}

      <Card title="কোন লক্ষ্যে অবদান দিচ্ছেন?" sub="একাধিক লক্ষ্য থাকলে বাছাই বাধ্যতামূলক">
        <div className="space-y-2">
          {myGoals.map((x) => {
            const on = x.id === g.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => { setSelected(x.id); setAmount(x.rule === 'fixed' ? x.monthly ?? 1500 : x.min ?? 500); setError(''); }}
                className={`w-full min-h-tap text-left rounded-r-sm border px-3 py-2 flex items-center gap-2 ${on ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}
              >
                <span className={`w-4 h-4 rounded-r-pill border-2 shrink-0 ${on ? 'border-green-700 bg-green-700' : 'border-line-3'}`} />
                <span className="grow min-w-0">
                  <span className="block text-sm font-bold text-txt truncate">{x.name}</span>
                  <span className="block text-xs text-mut">
                    {x.code} · {bn(pct(contribs, x))}% সংগৃহীত · আমার জমা ৳{bn(myPaid(contribs, x.id))}
                  </span>
                </span>
                {on ? <Badge tone="ok">নির্বাচিত</Badge> : null}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="অবদানের অঙ্ক" sub={g.rule === 'fixed' ? `নির্দিষ্ট ৳${bn(g.monthly ?? 0)}/মাস` : `সীমা ৳${bn(g.min ?? 0)}–৳${bn(g.max ?? 0)}`}>
        <Field label="অঙ্ক (৳)" required error={error}>
          {(id) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => { setAmount(e.target.value === '' ? '' : Number(e.target.value)); setError(''); }}
              className={inputClass(error) + ' num min-h-tap text-h3 font-extrabold'}
            />
          )}
        </Field>
        <div className="mt-2">
          <Chipset>
            {(g.rule === 'fixed' ? [g.monthly ?? 0, (g.monthly ?? 0) * 2] : [g.min ?? 0, 1500, g.max ?? 0]).map((v) => (
              <Chip key={v} active={amount === v} onClick={() => setAmount(v)}>৳{bn(v)}</Chip>
            ))}
          </Chipset>
        </div>
        <p className="text-xs text-mut mt-2">
          এখন পর্যন্ত জমা ৳{bn(paid)} · সংগ্রহ ৳{bn(collected(contribs, g.id))} / ৳{bn(g.target)}
        </p>
      </Card>

      <Card title="মাধ্যম">
        <div className="space-y-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`w-full min-h-tap rounded-r-sm border px-3 py-2 text-left flex items-center gap-2 ${channel === ch ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}
            >
              <span className={`w-4 h-4 rounded-r-pill border-2 shrink-0 ${channel === ch ? 'border-green-700 bg-green-700' : 'border-line-3'}`} />
              <span className="text-sm font-bold text-txt">{channelLabel(ch)}</span>
            </button>
          ))}
        </div>
        <Field label="নোট (ঐচ্ছিক)">
          {(id) => <input id={id} value={note} onChange={(e) => setNote(e.target.value)} placeholder="যেমন: অক্টোবরের অবদান" className={inputClass()} />}
        </Field>
      </Card>

      <div className="rounded-r-sm bg-warn-bg border border-warn-bd text-warn-ink px-3 py-2 text-xs">
        <b>এই টাকা ব্যক্তিগত সঞ্চয় নয়</b> — জমা হয় {g.name}-এর লক্ষ্য তহবিলে; লক্ষ্য পূরণের আগে ব্যক্তিগত উত্তোলন নেই।
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <Button block size="lg" icon={<Send size={17} />} onClick={submit} disabled={busy}>
        {busy ? 'জমা হচ্ছে…' : `৳${bn(value)} অবদান নিশ্চিত করুন`}
      </Button>

      <Card title="আমার অবদান ইতিহাস" sub={`${bn(list.length)}টি · ৳${bn(paid)}`} right={<Receipt size={16} className="text-mut" />}>
        <ul className="divide-y divide-line-2">
          {list.map((c) => (
            <li key={c.id} className="py-2 flex items-center gap-3">
              <div className="grow min-w-0">
                <div className="text-sm font-bold text-txt truncate">{c.at} · {channelLabel(c.channel)}</div>
                <div className="text-xs text-mut truncate">
                  রসিদ {c.receipt} · গ্রহণকারী {c.by}
                </div>
              </div>
              <div className="num text-sm font-bold text-txt shrink-0">৳{bn(c.amount)}</div>
            </li>
          ))}
          {list.length === 0 ? <li className="py-4 text-center text-sm text-mut">এখনো অবদান নেই</li> : null}
        </ul>
        <Button block variant="ghost" className="mt-2" onClick={() => navigate('/verify')}>
          রসিদ যাচাই করুন
        </Button>
      </Card>
    </div>
  );
}
