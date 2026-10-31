/* ============================================================
   src/apps/member/screens/QardPay.tsx — QM-07 কিস্তি পরিশোধ
   শুধু মূলধন কমে — ছাড় নেই, জরিমানা নেই। কিস্তি / আগাম / সম্পূর্ণ বাকি।
   নিশ্চিত করলে স্টোরে পরিশোধ যোগ হয়, রসিদ তৈরি হয়; শেষ কিস্তিতে সনদ।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Receipt, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { QH_CHANNEL, nextDue, outstanding, paidPct, perInstallment, repaid, repaymentsOf } from '../../../domain/qard';

export default function QardPay() {
  const navigate = useNavigate();
  const { loans, repayments, repayQard } = useModules();
  const loan = loans.find((l) => l.status === 'active' || l.status === 'arrears') ?? loans[0];
  const [channel, setChannel] = useState<'cash' | 'bank' | 'bkash'>('cash');
  const [plan, setPlan] = useState<'next' | 'advance' | 'full'>('next');
  const [amount, setAmount] = useState<number | ''>(loan ? perInstallment(loan) : 0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ receipt: string; amount: number } | null>(null);

  if (!loan) {
    return (
      <div className="p-4">
        <Card title="পরিশোধযোগ্য কোনো সহায়তা নেই">
          <Button onClick={() => navigate('/m/qard')}>কর্জে হাসানা হোম</Button>
        </Card>
      </div>
    );
  }

  const left = outstanding(loans, repayments, loan.id);
  const next = nextDue(loan, repaymentsOf(repayments, loan.id).length);
  const per = perInstallment(loan);
  const value = typeof amount === 'number' ? amount : 0;
  const closed = plan === 'full' && value >= left;

  function pick(p: 'next' | 'advance' | 'full') {
    setPlan(p);
    setAmount(p === 'next' ? per : p === 'advance' ? per * 2 : left);
    setError('');
  }

  async function submit() {
    if (!value || value <= 0) {
      setError('অঙ্ক লিখুন');
      return;
    }
    if (value > left) {
      setError(`বাকি মাত্র ৳${bn(left)} — এর বেশি নয়`);
      return;
    }
    setError('');
    setBusy(true);
    const r = await repayQard(loan!.id, value, channel);
    setBusy(false);
    setReceipt({ receipt: r.receipt, amount: r.amount });
  }

  if (receipt) {
    const nowLeft = Math.max(0, left - receipt.amount);
    return (
      <div className="p-4 space-y-4 pb-6">
        <div className="rounded-r-md bg-ok-bg border border-ok-bd px-4 py-5 text-center">
          <CheckCircle2 size={38} className="mx-auto text-ok" />
          <div className="font-extrabold text-ok-ink mt-1.5">পরিশোধ জমা হয়েছে</div>
          <div className="text-sm text-ok-ink/90 mt-0.5">৳{bn(receipt.amount)} · রসিদ {receipt.receipt}</div>
        </div>
        <Card title="হালনাগাদ হিসাব" sub={loan.no}>
          <dl className="text-sm divide-y divide-line-2">
            <div className="flex justify-between py-2">
              <dt className="text-mut">মূলধন</dt>
              <dd className="num font-bold">৳{bn(loan.principal)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-mut">এই পরিশোধের পর বাকি</dt>
              <dd className={`num font-bold ${nowLeft ? 'text-txt' : 'text-ok'}`}>৳{bn(nowLeft)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-mut">সুদ ৳০ · ফি নেই</dt>
              <dd className="font-bold text-ok">কোনো চার্জ নেই</dd>
            </div>
          </dl>
          {nowLeft === 0 ? (
            <div className="mt-2 rounded-r-sm bg-qh-gold-soft border border-qh-gold-bd text-qh-gold-ink px-3 py-2 text-sm">
              সম্পূর্ণ মূলধন পরিশোধ হয়েছে — সমাপ্তি সনদ তৈরি হয়েছে।
            </div>
          ) : null}
        </Card>
        {nowLeft === 0 ? (
          <Button block icon={<FileText size={16} />} onClick={() => navigate(`/m/qard/certificate/${loan.id}`)}>
            সমাপ্তি সনদ দেখুন
          </Button>
        ) : null}
        <Button block variant="secondary" onClick={() => navigate('/m/qard/loans')}>ঋণের ছক</Button>
        <Button block variant="ghost" onClick={() => navigate('/m/qard')}>হোমে ফিরুন</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <Card title="পরিশোধ" sub={`${loan.no} · পরবর্তী ${next?.date ?? '—'}`} right={<Badge tone="ok">সুদ ৳০</Badge>}>
        <dl className="text-sm divide-y divide-line-2">
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">মূলধন</dt>
            <dd className="num font-bold">৳{bn(loan.principal)}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">পরিশোধিত</dt>
            <dd className="num font-bold text-ok">৳{bn(repaid(loans, repayments, loan.id))} ({bn(paidPct(loans, repayments, loan.id))}%)</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">বাকি (derived)</dt>
            <dd className="num font-bold">৳{bn(left)}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">পরবর্তী কিস্তি</dt>
            <dd className="num font-bold">৳{bn(per)} · {next?.date}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">বিলম্ব ফি / চার্জ</dt>
            <dd className="font-bold text-ok">৳০</dd>
          </div>
        </dl>
      </Card>

      <Card title="কী পরিশোধ করবেন?" sub="আগাম দেওয়া যাবে — ছাড় বা জরিমানা নেই">
        <div className="space-y-2">
          {[
            ['next', 'শুধু এই কিস্তি', `৳${bn(per)} · পরবর্তী কিস্তি ${next?.date ?? '—'}`],
            ['advance', 'আগাম দুই কিস্তি', `৳${bn(per * 2)} · বাকি কিস্তি ${bn(Math.max(0, Math.ceil(left / per) - 2))}টি হবে`],
            ['full', 'সম্পূর্ণ বাকি মূলধন', `৳${bn(left)} · পরিশোধ হলে ঋণ বন্ধ ও সনদ ইস্যু`],
          ].map(([k, title, sub]) => (
            <button
              key={k}
              type="button"
              onClick={() => pick(k as 'next' | 'advance' | 'full')}
              className={`w-full min-h-tap text-left rounded-r-sm border px-3 py-2 flex items-center gap-2 ${plan === k ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}
            >
              <span className={`w-4 h-4 rounded-r-pill border-2 shrink-0 ${plan === k ? 'border-green-700 bg-green-700' : 'border-line-3'}`} />
              <span className="grow">
                <span className="block text-sm font-bold text-txt">{title}</span>
                <span className="block text-xs text-mut">{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="অঙ্ক ও মাধ্যম">
        <Field label="পরিশোধের অঙ্ক (৳)" required error={error}>
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
        <Chipset>
          <Chip active={value === per} onClick={() => pick('next')}>৳{bn(per)}</Chip>
          <Chip active={value === per * 2} onClick={() => pick('advance')}>৳{bn(per * 2)}</Chip>
          <Chip active={value === left} onClick={() => pick('full')}>সম্পূর্ণ ৳{bn(left)}</Chip>
        </Chipset>

        <Field label="মাধ্যম" required>
          {() => (
            <Chipset>
              {QH_CHANNEL.map((c) => (
                <Chip key={c.k} active={channel === c.k} onClick={() => setChannel(c.k)}>{c.t}</Chip>
              ))}
            </Chipset>
          )}
        </Field>

        <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs flex gap-2">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          <span>রসিদ নম্বর অপরিবর্তনীয় (BR-08) · কোনো সুদ/চার্জ যোগ হবে না · Prev: QR-2610-0005</span>
        </div>
      </Card>

      {closed ? (
        <div className="rounded-r-sm bg-qh-gold-soft border border-qh-gold-bd text-qh-gold-ink px-3 py-2 text-xs">
          এই পরিশোধে সম্পূর্ণ মূলধন শোধ হবে — সনদ তৈরি হবে। কোনো “settlement discount” নেই, শুধু বাকি অঙ্ক।
        </div>
      ) : null}

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <Button block size="lg" icon={<Receipt size={18} />} onClick={submit} disabled={busy}>
        {busy ? 'প্রক্রিয়া চলছে…' : `৳${bn(value)} পরিশোধ নিশ্চিত করুন`}
      </Button>

      <Card title="সাম্প্রতিক পরিশোধ" sub={`${bn(repaymentsOf(repayments, loan.id).length)}টি`}>
        <ul className="divide-y divide-line-2">
          {repaymentsOf(repayments, loan.id).slice().reverse().map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between gap-2 text-sm">
              <div>
                <div className="font-bold text-txt num">{r.receipt}</div>
                <div className="text-xs text-mut">কিস্তি {bn(r.inst)} · {r.at}</div>
              </div>
              <div className="num font-bold">৳{bn(r.amount)}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
