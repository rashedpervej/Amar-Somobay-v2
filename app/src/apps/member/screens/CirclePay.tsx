/* ============================================================
   src/apps/member/screens/CirclePay.tsx — RM-04 কিস্তি পরিশোধ
   ৩ ধাপ: অঙ্ক/মাধ্যম → নিশ্চিতকরণ → রসিদ। নিশ্চিত করলে চক্রের সংগ্রহ ও
   আমার জমা বাড়ে (স্টোর), রসিদ নম্বর তৈরি হয়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, Receipt } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { channelLabel, mySeat, nextDraw, type RcDraw } from '../../../domain/rosca';

const CHANNELS: RcDraw['channel'][] = ['cash', 'bank', 'bkash'];

export default function CirclePay() {
  const { circleId } = useParams();
  const navigate = useNavigate();
  const { circleById, payCircle } = useModules();
  const c = circleById(circleId);
  const [amount, setAmount] = useState<number | ''>(c?.contrib ?? 1000);
  const [channel, setChannel] = useState<RcDraw['channel']>('cash');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ receipt: string; amount: number } | null>(null);

  if (!c) {
    return (
      <div className="p-4">
        <Card title="চক্র পাওয়া যায়নি">
          <Button onClick={() => navigate('/m/circles')}>তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const me = mySeat(c);
  const next = nextDraw(c);
  const contrib = c.contrib;
  const value = typeof amount === 'number' ? amount : 0;
  const due = (me?.missed ?? 0) * c.contrib;

  async function submit() {
    if (!value || value < contrib) {
      setError(`সর্বনিম্ন ৳${bn(contrib)} (এক কিস্তি)`);
      return;
    }
    setError('');
    setBusy(true);
    const r = await payCircle(c!.id, value, channel);
    setBusy(false);
    setReceipt({ receipt: r.receipt, amount: r.amount });
  }

  if (receipt) {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-r-md bg-ok-bg border border-ok-bd px-4 py-5 text-center">
          <CheckCircle2 size={40} className="mx-auto text-ok" />
          <div className="text-h3 font-extrabold text-ok-ink mt-2">কিস্তি জমা হয়েছে</div>
          <div className="text-sm text-ok-ink/90 mt-1">
            ৳{bn(receipt.amount)} · {channelLabel(channel)}
          </div>
        </div>
        <Card title="রসিদ" sub={receipt.receipt}>
          <dl className="text-sm divide-y divide-line-2">
            {[
              ['চক্র', `${c.code} · ${c.name}`],
              ['সিট', me ? bn(me.no) : '—'],
              ['অঙ্ক', `৳${bn(receipt.amount)}`],
              ['মাধ্যম', channelLabel(channel)],
              ['রসিদ নম্বর', receipt.receipt],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2">
                <dt className="text-mut">{k}</dt>
                <dd className="num font-bold text-txt text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-mut mt-2">রসিদ নম্বর কখনো পুনর্ব্যবহার হয় না — যাচাই করতে S-07 ব্যবহার করুন।</p>
        </Card>
        <Button block onClick={() => navigate(`/m/circles/${c.id}`)} icon={<Check size={16} />}>
          চক্রে ফিরুন
        </Button>
        <Button block variant="secondary" onClick={() => navigate('/verify')}>
          রসিদ যাচাই
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <div className="flex items-center gap-2 text-xs">
        <span className="flex-1 h-1.5 rounded-r-pill bg-green-700" />
        <span className="flex-1 h-1.5 rounded-r-pill bg-green-700" />
        <span className="flex-1 h-1.5 rounded-r-pill bg-line-3" />
      </div>
      <div className="flex justify-between text-xs font-bold">
        <span className="text-green-700">১. অঙ্ক ও মাধ্যম</span>
        <span className="text-mut">২. নিশ্চিত</span>
        <span className="text-mut">৩. রসিদ</span>
      </div>

      <Card title={`${c.code} · কিস্তি`} sub={`ড্র ${bn(next?.no ?? c.seats)}-এর কিস্তি`} right={<Badge tone="info">ROSCA</Badge>}>
        <dl className="text-sm divide-y divide-line-2">
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">কিস্তির অঙ্ক</dt>
            <dd className="num font-bold">৳{bn(c.contrib)}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">এ পর্যন্ত জমা</dt>
            <dd className="num font-bold">৳{bn(me?.contributed ?? 0)} · {bn(me?.paidCount ?? 0)} কিস্তি</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">বকেয়া</dt>
            <dd className={`num font-bold ${due ? 'text-danger' : 'text-ok'}`}>{due ? `৳${bn(due)}` : 'নেই'}</dd>
          </div>
        </dl>

        <div className="mt-3 space-y-3">
          <Field label="অঙ্ক (৳)" required hint="বকেয়াসহ একসাথে দিতে পারেন">
            {(id) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputClass() + ' num min-h-tap text-h3 font-extrabold'}
              />
            )}
          </Field>
          <Chipset>
            <Chip active={amount === c.contrib} onClick={() => setAmount(c.contrib)}>৳{bn(c.contrib)}</Chip>
            {due ? <Chip active={amount === c.contrib + due} onClick={() => setAmount(c.contrib + due)}>বকেয়াসহ ৳{bn(c.contrib + due)}</Chip> : null}
            <Chip active={amount === c.contrib * 2} onClick={() => setAmount(c.contrib * 2)}>৳{bn(c.contrib * 2)}</Chip>
          </Chipset>
        </div>
      </Card>

      <Card title="মাধ্যম বেছে নিন" sub="৩টি বিকল্প">
        <div className="space-y-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`w-full min-h-tap rounded-r-sm border px-3 py-2 text-left flex items-center gap-2 ${channel === ch ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}
            >
              <span className={`w-4 h-4 rounded-r-pill border-2 ${channel === ch ? 'border-green-700 bg-green-700' : 'border-line-3'}`} />
              <span className="grow">
                <span className="block text-sm font-bold text-txt">{channelLabel(ch)}</span>
                <span className="block text-xs text-mut">
                  {ch === 'cash' ? 'সংগ্রহক আপনার রুটে আছেন · রসিদ তাৎক্ষণিক' : ch === 'bank' ? 'শাখা · সকাল ১০টা – দুপুর ২টা' : 'রেফারেন্সে চক্রের কোড দিন'}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs">
        <b>অফলাইনেও কিস্তি জমা দেওয়া যাবে</b> — সংযোগ না থাকলে এন্ট্রি কিউতে থাকবে, পরে sync হবে (idempotency_key)।
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <Button block size="lg" icon={<Receipt size={18} />} onClick={submit} disabled={busy}>
        {busy ? 'প্রক্রিয়া চলছে…' : `৳${bn(value)} প্রদান নিশ্চিত করুন`}
      </Button>
    </div>
  );
}
