/* ============================================================
   src/apps/member/screens/Deposit.tsx — M-06 জমা প্রদান (নির্দিষ্ট ফর্ম)
   অঙ্ক → মাধ্যম → নিশ্চিতকরণ (আসল স্টোর-আপডেট) → M-07 স্বতন্ত্র রসিদ পর্দা।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Receipt, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import type { DepositMode } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

const QUICK = [500, 1000, 2000, 5000];
const MODES: DepositMode[] = ['নগদ', 'বিকাশ', 'ব্যাংক'];

export default function Deposit() {
  const navigate = useNavigate();
  const { balance, payable, addDeposit } = useMember();
  const [params] = useSearchParams();
  const preAmount = Number(params.get('amount') ?? '') || 1000;
  const [amount, setAmount] = useState<number | ''>(preAmount);
  const [mode, setMode] = useState<DepositMode>('নগদ');
  const [note, setNote] = useState(params.get('note') ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const value = typeof amount === 'number' ? amount : 0;

  function validate() {
    const e: Record<string, string> = {};
    if (!value) e.amount = 'জমার অঙ্ক লিখুন';
    else if (value < 100) e.amount = 'সর্বনিম্ন ৳১০০';
    else if (value > 100000) e.amount = 'একবারে সর্বোচ্চ ৳১,০০,০০০ — বেশি হলে শাখায় যোগাযোগ করুন';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const dep = await addDeposit({ amount: value, mode, note: note.trim() || undefined });
      navigate(`/m/deposit/receipt/${dep.id}`, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card title="কত টাকা জমা দিচ্ছেন?" sub="সর্বনিম্ন ৳১০০">
        <Field label="জমার অঙ্ক (৳)" required error={errors.amount} hint={`ব্যালান্স ৳${bn(balance)} · বকেয়া ৳${bn(payable)}`}>
          {(id) => (
            <div className={`flex items-center gap-2 rounded-r-sm border px-3 ${errors.amount ? 'border-danger' : 'border-line-3'} bg-card-2`}>
              <span className="text-h2 text-mut">৳</span>
              <input
                id={id}
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="num grow bg-transparent outline-none text-h1 font-extrabold text-txt min-h-tap"
              />
            </div>
          )}
        </Field>

        <div className="mt-2">
          <Chipset>
            {QUICK.map((q) => (
              <Chip key={q} active={amount === q} onClick={() => setAmount(q)}>
                ৳{bn(q)}
              </Chip>
            ))}
            {payable > 0 ? (
              <Chip active={amount === payable} onClick={() => setAmount(payable)}>
                বকেয়া ৳{bn(payable)}
              </Chip>
            ) : null}
          </Chipset>
        </div>
      </Card>

      <Card title="মাধ্যম">
        <Chipset>
          {MODES.map((m) => (
            <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
              {m}
            </Chip>
          ))}
        </Chipset>
        <p className="text-xs text-mut mt-2">
          {mode === 'নগদ'
            ? 'সংগ্রহক বা শাখায় নগদ জমা দিন — রসিদ সাথে সাথে তৈরি হবে।'
            : mode === 'বিকাশ'
              ? 'বিকাশে পাঠানোর পর এই রসিদটি প্রমাণ হিসেবে রাখুন।'
              : 'ব্যাংক জমার রেফারেন্স নম্বর সংরক্ষণ করুন।'}
        </p>
      </Card>

      <Card title="নোট (ঐচ্ছিক)">
        <Field label="নোট">
          {(id) => (
            <input
              id={id}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: অক্টোবরের কিস্তি"
              className={inputClass()}
            />
          )}
        </Field>
      </Card>

      {Object.keys(errors).length > 0 ? <ErrorBanner>জমার অঙ্ক ঠিক করুন</ErrorBanner> : null}

      <Button block size="lg" disabled={busy} onClick={submit} icon={<Receipt size={18} />}>
        {busy ? 'প্রক্রিয়া চলছে…' : `জমা নিশ্চিত করুন${value ? ` · ৳${bn(value)}` : ''}`}
      </Button>

      <div className="flex items-start gap-2 text-xs text-mut px-2">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ok" />
        <span>ডেমো — কোনো বাস্তব টাকা নেওয়া হয় না। জমার সাথে কোনো সুদ বা শতাংশভিত্তিক চার্জ যোগ হবে না।</span>
      </div>
      <Badge tone="neutral">নীতি D-01 · সুদমুক্ত</Badge>
    </div>
  );
}
