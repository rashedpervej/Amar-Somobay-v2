/* ============================================================
   src/apps/member/screens/SchemeDetail.tsx — M-03 স্কিম বিবরণ ও নামভর্তি
   ধাপ: শর্ত পড়া → কিস্তি নির্ধারণ → নমিনি বাছাই → সম্মতি → নামভর্তি।
   সফল হলে নতুন অ্যাকাউন্ট তৈরি হয় (ডেমো স্টোরে) এবং M-05-এ নেওয়া হয়।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { Badge, Button, Card, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function SchemeDetail() {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const { state, enroll } = useMember();
  const scheme = state.schemes.find((s) => s.id === schemeId);

  const [amount, setAmount] = useState<number | ''>(scheme?.installment ?? '');
  const [nomineeId, setNomineeId] = useState(state.nominees[0]?.id ?? '');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ number: string; id: string } | null>(null);

  const hint = useMemo(() => {
    if (!scheme) return '';
    return `ন্যূনতম ৳${bn(scheme.minDeposit)} · সর্বোচ্চ ৳${bn(scheme.installment * 10)}`;
  }, [scheme]);

  if (!scheme) {
    return (
      <div className="p-4">
        <Card title="স্কিম পাওয়া যায়নি" sub="লিংকটি পুরনো হতে পারে">
          <Button onClick={() => navigate('/m/schemes')}>স্কিম তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    const v = typeof amount === 'number' ? amount : 0;
    if (!v) e.amount = 'কিস্তির অঙ্ক লিখুন';
    else if (v < scheme!.minDeposit) e.amount = `ন্যূনতম ৳${bn(scheme!.minDeposit)}`;
    else if (v > scheme!.installment * 10) e.amount = `সর্বোচ্চ ৳${bn(scheme!.installment * 10)}`;
    if (!nomineeId) e.nominee = 'একজন নমিনি বাছাই করুন (অথবা আগে নমিনি যোগ করুন)';
    if (!accepted) e.accepted = 'শর্তাবলিতে সম্মতি দিতে হবে';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const acc = await enroll({
        schemeId: scheme!.id,
        installment: Number(amount),
        frequency: scheme!.frequency,
        nomineeId,
        accepted,
      });
      setDone({ number: acc.number, id: acc.id });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="p-4 space-y-3">
        <SuccessBanner title="নামভর্তি সম্পন্ন">
          আপনার অ্যাকাউন্ট নম্বর <b>{done.number}</b>. প্রথম কিস্তি ৳{bn(Number(amount))} — জমা দিলেই হিসাব চালু হবে।
        </SuccessBanner>
        <Button block onClick={() => navigate(`/m/savings/${done.id}`)}>
          অ্যাকাউন্ট দেখুন
        </Button>
        <Button block variant="secondary" onClick={() => navigate('/m/home')}>
          হোমে ফিরুন
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700"
      >
        <ArrowLeft size={16} /> স্কিম তালিকা
      </button>

      <Card title={scheme.name} sub={scheme.summary} right={<Badge tone="brand">{scheme.frequency}</Badge>}>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['কিস্তি', `৳${bn(scheme.installment)}`],
            ['মেয়াদ', `${bn(scheme.durationMonths)} মাস`],
            ['ন্যূনতম জমা', `৳${bn(scheme.minDeposit)}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-r-sm bg-card-2 border border-line-2 px-2.5 py-2">
              <div className="text-[11px] text-mut">{k}</div>
              <div className="num text-sm font-bold text-txt">{v}</div>
            </div>
          ))}
        </div>

        <SectionHead title="সুবিধা" />
        <ul className="pl-5 text-sm text-txt-2 space-y-1">
          {scheme.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <SectionHead title="নিয়ম" />
        <ul className="pl-5 text-sm text-txt-2 space-y-1">
          {scheme.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      <Card title="নামভর্তির তথ্য">
        <div className="space-y-3">
          <Field label="কিস্তির অঙ্ক (৳)" required hint={hint} error={errors.amount}>
            {(id) => (
              <select
                id={id}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={inputClass(errors.amount) + ' num'}
              >
                {[1, 2, 3, 4, 5, 10].map((m) => (
                  <option key={m} value={scheme.installment * m}>
                    ৳{bn(scheme.installment * m)}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="নমিনি" required error={errors.nominee} hint="অনুপস্থিতিতে টাকা গ্রহণের ব্যক্তি">
            {(id) => (
              <select id={id} value={nomineeId} onChange={(e) => setNomineeId(e.target.value)} className={inputClass(errors.nominee)}>
                <option value="">— বাছাই করুন —</option>
                {state.nominees.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} · {n.relation} · {bn(n.share)}%
                  </option>
                ))}
              </select>
            )}
          </Field>

          {state.nominees.length === 0 ? (
            <Row
              icon={<Info size={16} />}
              title="নমিনি নেই"
              sub="প্রথমে নমিনি যোগ করুন"
              right={<span className="text-xs font-bold text-green-700">যোগ করুন</span>}
              onClick={() => navigate('/m/nominees')}
            />
          ) : null}

          <label className="flex items-start gap-2 min-h-tap py-1">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[var(--green-700)]"
            />
            <span className="text-sm text-txt-2">
              আমি স্কিমের নিয়ম ও শর্তাবলি পড়েছি এবং সম্মত আছি। আমি জানি এখানে কোনো সুদ বা শতাংশভিত্তিক মুনাফা নেই।
            </span>
          </label>
          {errors.accepted ? <p className="text-xs text-danger font-bold">{errors.accepted}</p> : null}

          {Object.keys(errors).length > 0 ? <ErrorBanner>উপরের তথ্যগুলো ঠিক করুন</ErrorBanner> : null}

          <Button block size="lg" onClick={submit} disabled={busy} icon={<CheckCircle2 size={18} />}>
            {busy ? 'অপেক্ষা করুন…' : 'নামভর্তি সম্পন্ন করুন'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
