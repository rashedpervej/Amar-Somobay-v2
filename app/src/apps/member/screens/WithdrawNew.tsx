/* ============================================================
   src/apps/member/screens/WithdrawNew.tsx — M-10 উত্তোলনের আবেদন
   অঙ্ক (ব্যালান্সের মধ্যে) → কারণ → মাধ্যম + হিসাব → সম্মতি → জমা।
   সফল হলে M-12 বিবরণে নেওয়া হয়; তালিকায় দেখা যাবে M-11-এ।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Card, Button, Badge, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import type { DepositMode } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

const MODES: DepositMode[] = ['ব্যাংক', 'বিকাশ', 'নগদ'];

export default function WithdrawNew() {
  const navigate = useNavigate();
  const { balance, requestWithdrawal, state } = useMember();
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<DepositMode>('ব্যাংক');
  const [accountName, setAccountName] = useState(state.profile.name);
  const [accountNo, setAccountNo] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  /* অপেক্ষমাণ আবেদনের অঙ্ক বাদ দিয়ে প্রকৃত উপলব্ধ ব্যালান্স */
  const pending = state.withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const available = Math.max(0, balance - pending);
  const value = typeof amount === 'number' ? amount : 0;

  function validate() {
    const e: Record<string, string> = {};
    if (!value) e.amount = 'উত্তোলনের অঙ্ক লিখুন';
    else if (value < 500) e.amount = 'সর্বনিম্ন ৳৫০০';
    else if (value > available) e.amount = `উপলব্ধ ৳${bn(available)}-এর বেশি নয়`;
    if (reason.trim().length < 5) e.reason = 'কারণ লিখুন (অন্তত ৫ অক্ষর)';
    if (mode !== 'নগদ') {
      if (accountName.trim().length < 3) e.accountName = 'হিসাবের নাম লিখুন';
      if (mode === 'বিকাশ' && !/^01\d{9}$/.test(accountNo.replace(/\D/g, ''))) e.accountNo = '১১ সংখ্যার মোবাইল নম্বর দিন';
      if (mode === 'ব্যাংক' && accountNo.replace(/\D/g, '').length < 10) e.accountNo = 'অন্তত ১০ সংখ্যার হিসাব নম্বর দিন';
    }
    if (!agree) e.agree = 'শর্তে সম্মতি দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const wd = await requestWithdrawal({ amount: value, mode, reason: reason.trim(), accountName, accountNo: mode === 'নগদ' ? '—' : accountNo });
      navigate(`/m/withdrawals/${wd.id}`, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <Card title="উত্তোলনের আবেদন" sub={`উপলব্ধ ৳${bn(available)}${pending > 0 ? ` (অপেক্ষমাণ ৳${bn(pending)} বাদে)` : ''}`} right={<Badge tone="brand">M-10</Badge>}>
        <div className="space-y-3">
          <Field label="অঙ্ক (৳)" required error={errors.amount} hint="সর্বনিম্ন ৳৫০০ · অনুমোদনের পর বিতরণ হবে">
            {(id) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputClass(errors.amount) + ' num min-h-tap'}
                placeholder="০"
              />
            )}
          </Field>

          <Field label="উত্তোলনের কারণ" required error={errors.reason}>
            {(id) => (
              <textarea
                id={id}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="যেমন: চিকিৎসা খরচ"
                className={inputClass(errors.reason) + ' py-2 min-h-[88px]'}
              />
            )}
          </Field>

          <Field label="মাধ্যম" required>
            {() => (
              <Chipset>
                {MODES.map((m) => (
                  <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
                    {m}
                  </Chip>
                ))}
              </Chipset>
            )}
          </Field>

          {mode !== 'নগদ' ? (
            <>
              <Field label="হিসাবের নাম" required error={errors.accountName}>
                {(id) => (
                  <input id={id} value={accountName} onChange={(e) => setAccountName(e.target.value)} className={inputClass(errors.accountName)} />
                )}
              </Field>
              <Field
                label={mode === 'বিকাশ' ? 'বিকাশ নম্বর' : 'ব্যাংক হিসাব নম্বর'}
                required
                error={errors.accountNo}
                hint={mode === 'বিকাশ' ? 'যে নম্বরে টাকা পাঠানো হবে' : 'শাখা ও হিসাবের নাম মিলিয়ে নিন'}
              >
                {(id) => (
                  <input
                    id={id}
                    inputMode="numeric"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className={inputClass(errors.accountNo) + ' num'}
                    placeholder={mode === 'বিকাশ' ? '০১৭xxxxxxxx' : '০১২৩৪৫৬৭৮৯০১২'}
                  />
                )}
              </Field>
            </>
          ) : (
            <p className="text-xs text-mut">নগদ উত্তোলন শাখা বা সংগ্রহকের কাছ থেকে নেওয়া যাবে — পরিচয়পত্র সাথে রাখুন।</p>
          )}

          <label className="flex items-start gap-2 min-h-tap py-1">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 w-5 h-5 accent-[var(--green-700)]" />
            <span className="text-sm text-txt-2">
              আমি জানি উত্তোলনে কমিটির অনুমোদন লাগবে এবং কোনো সুদ বা অতিরিক্ত চার্জ কাটা হবে না।
            </span>
          </label>
          {errors.agree ? <p className="text-xs text-danger font-bold">{errors.agree}</p> : null}

          {Object.keys(errors).length > 0 ? <ErrorBanner>উপরের তথ্যগুলো ঠিক করুন</ErrorBanner> : null}

          <Button block size="lg" onClick={submit} disabled={busy} icon={<Send size={18} />}>
            {busy ? 'জমা হচ্ছে…' : 'আবেদন জমা দিন'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
