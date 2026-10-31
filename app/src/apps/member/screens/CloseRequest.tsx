/* ============================================================
   src/apps/member/screens/CloseRequest.tsx — M-15 সদস্যপদ বন্ধের আবেদন
   সতর্কতা → কারণ → নিষ্পত্তির মাধ্যম → চূড়ান্ত নিশ্চিতকরণ। আবেদন জমা হলে
   স্টোর-এ সংরক্ষিত হয় এবং পুনরায় দেখা যায়। কোনো ডেটা মুছে ফেলা হয় না।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileCheck2 } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import type { DepositMode } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

const MODES: DepositMode[] = ['ব্যাংক', 'বিকাশ', 'নগদ'];

export default function CloseRequest() {
  const navigate = useNavigate();
  const { state, balance, requestClose } = useMember();
  const existing = state.closeRequest;
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<DepositMode>('ব্যাংক');
  const [accountName, setAccountName] = useState(state.profile.name);
  const [accountNo, setAccountNo] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (reason.trim().length < 10) e.reason = 'কারণ লিখুন (অন্তত ১০ অক্ষর)';
    if (mode !== 'নগদ' && accountNo.replace(/\D/g, '').length < 10) e.accountNo = 'হিসাব/মোবাইল নম্বর সঠিকভাবে দিন';
    if (accountName.trim().length < 3) e.accountName = 'হিসাবের নাম লিখুন';
    if (confirmText !== 'বন্ধ') e.confirmText = 'নিশ্চিত করতে "বন্ধ" লিখুন';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      await requestClose({ reason: reason.trim(), settlementMode: mode, accountName, accountNo: mode === 'নগদ' ? '—' : accountNo });
    } finally {
      setBusy(false);
    }
  }

  if (existing) {
    return (
      <div className="p-4 space-y-4">
        <SuccessBanner title="আবেদন জমা হয়েছে">
          সদস্যপদ বন্ধের আবেদন গৃহীত হয়েছে — রেফারেন্স <b>{existing.id}</b>।
        </SuccessBanner>
        <Card title="আবেদনের বিবরণ" sub={existing.at} right={<Badge tone="warn">পর্যালোচনাধীন</Badge>}>
          <dl className="text-sm divide-y divide-line-2">
            {[
              ['কারণ', existing.reason],
              ['নিষ্পত্তির মাধ্যম', existing.settlementMode],
              ['হিসাব', `${existing.accountName}${existing.accountNo !== '—' ? ` · ${existing.accountNo}` : ''}`],
              ['যে অঙ্ক ফেরতযোগ্য', `৳${bn(balance)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2">
                <dt className="text-mut shrink-0">{k}</dt>
                <dd className="font-bold text-txt text-right break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-mut mt-3">
            পর্যালোচনা ও নিষ্পত্তি শেষ হলে SMS জানানো হবে। অনুমোদনের আগে আপনি শাখায় গিয়ে আবেদন প্রত্যাহার করতে পারেন।
          </p>
        </Card>
        <Button block onClick={() => navigate('/m/home')}>হোমে ফিরুন</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <div className="rounded-r-md border border-danger/30 bg-danger-bg p-4 flex gap-2">
        <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
        <div className="text-sm text-danger-ink">
          <b>সদস্যপদ বন্ধ করলে কী হবে?</b>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li>সব চলমান স্কিম বন্ধ হবে, নতুন কিস্তি তৈরি হবে না।</li>
            <li>অপেক্ষমাণ উত্তোলন আগে নিষ্পত্তি করতে হবে।</li>
            <li>আপনার জমা ও লেনদেনের রেকর্ড সংরক্ষিত থাকবে (মুছে ফেলা হয় না)।</li>
          </ul>
        </div>
      </div>

      <Card title="বন্ধের কারণ" right={<Badge tone="neutral">M-15</Badge>}>
        <Field label="কারণ" required error={errors.reason} hint="যেমন: অন্য জেলায় স্থানান্তর, আর্থিক সীমাবদ্ধতা">
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass(errors.reason) + ' py-2 min-h-[88px]'}
            />
          )}
        </Field>
      </Card>

      <Card title="ফেরতযোগ্য অঙ্ক কীভাবে নেবেন?" sub={`আনুমানিক ৳${bn(balance)} (নিষ্পত্তির হিসাবে বদলাতে পারে)`}>
        <Chipset>
          {MODES.map((m) => (
            <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
              {m}
            </Chip>
          ))}
        </Chipset>
        <div className="mt-3 space-y-3">
          <Field label="হিসাবের নাম" required error={errors.accountName}>
            {(id) => <input id={id} value={accountName} onChange={(e) => setAccountName(e.target.value)} className={inputClass(errors.accountName)} />}
          </Field>
          <Field label={mode === 'নগদ' ? 'নগদ উত্তোলনের শাখা (ঐচ্ছিক)' : mode === 'বিকাশ' ? 'বিকাশ নম্বর' : 'ব্যাংক হিসাব নম্বর'} required={mode !== 'নগদ'} error={errors.accountNo}>
            {(id) => (
              <input
                id={id}
                value={accountNo}
                inputMode="numeric"
                onChange={(e) => setAccountNo(e.target.value)}
                className={inputClass(errors.accountNo) + ' num'}
                placeholder={mode === 'নগদ' ? 'শাখার নাম' : '০১৭xxxxxxxx'}
              />
            )}
          </Field>
        </div>
      </Card>

      <Card title="নিশ্চিতকরণ" sub="এটি অপরিবর্তনীয় নয় — কমিটি অনুমোদনের আগে প্রত্যাহার করা যায়">
        <Field label='নিশ্চিত করতে "বন্ধ" লিখুন' required error={errors.confirmText}>
          {(id) => <input id={id} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={inputClass(errors.confirmText)} placeholder="বন্ধ" />}
        </Field>
      </Card>

      {Object.keys(errors).length > 0 ? <ErrorBanner>উপরের তথ্যগুলো ঠিক করুন</ErrorBanner> : null}

      <Button block size="lg" variant="danger" disabled={busy} onClick={submit} icon={<FileCheck2 size={18} />}>
        {busy ? 'জমা হচ্ছে…' : 'বন্ধের আবেদন জমা দিন'}
      </Button>
      <p className="text-xs text-mut text-center">
        আবেদন জমা দিলে কোনো টাকা কেটে নেওয়া হয় না; নিষ্পত্তির হিসাব কমিটি জানাবে।
      </p>
    </div>
  );
}
