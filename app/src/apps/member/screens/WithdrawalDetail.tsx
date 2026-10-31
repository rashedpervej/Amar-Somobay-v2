/* ============================================================
   src/apps/member/screens/WithdrawalDetail.tsx — M-12 উত্তোলন আবেদন বিবরণ
   অবস্থা-সময়রেখা · তথ্য · অপেক্ষমাণ হলে বাতিল করার সুযোগ (স্টোর আপডেট হয়)।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Copy } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { StatusChip, SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function WithdrawalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { withdrawalById, cancelWithdrawal } = useMember();
  const wd = withdrawalById(id);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!wd) {
    return (
      <div className="p-4">
        <Card title="আবেদন পাওয়া যায়নি">
          <Button onClick={() => navigate('/m/withdrawals')}>তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  async function cancel() {
    setBusy(true);
    try {
      await cancelWithdrawal(wd!.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      {wd.status === 'rejected' ? (
        <SuccessBanner title="এই আবেদন আর সক্রিয় নয়">
          প্রত্যাখ্যাত বা বাতিল হয়েছে — প্রয়োজনে নতুন আবেদন করুন।
        </SuccessBanner>
      ) : null}

      <Card
        title={`উত্তোলন ${wd.reference}`}
        sub={`${wd.date} · ${wd.mode}`}
        right={<StatusChip status={wd.status === 'approved' ? 'approved' : wd.status} />}
      >
        <div className="num text-display font-extrabold text-txt">৳{bn(wd.amount)}</div>
        <dl className="text-sm divide-y divide-line-2 mt-3">
          {[
            ['কারণ', wd.reason],
            ['মাধ্যম', wd.mode],
            ['হিসাব', `${wd.accountName}${wd.accountNo !== '—' ? ` · ${wd.accountNo}` : ''}`],
            ['রেফারেন্স', wd.reference],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-mut shrink-0">{k}</dt>
              <dd className="font-bold text-txt text-right break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="অবস্থা" sub="প্রতিটি ধাপ সম্পন্ন হলে হালনাগাদ হয়">
        <ol className="space-y-2">
          {wd.timeline.map((t, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className={`mt-1 w-3 h-3 rounded-r-pill shrink-0 ${t.done ? 'bg-ok' : 'bg-line-3'}`} />
              <div className="grow">
                <div className={`text-sm ${t.done ? 'font-bold text-txt' : 'text-mut'}`}>{t.label}</div>
                <div className="text-xs text-mut">{t.at}</div>
              </div>
              {t.done ? <Badge tone="ok">সম্পন্ন</Badge> : <Badge tone="neutral">অপেক্ষায়</Badge>}
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          icon={<Copy size={16} />}
          onClick={() => {
            navigator.clipboard?.writeText(`${wd.reference} · ৳${bn(wd.amount)}`).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? 'কপি হয়েছে' : 'রেফারেন্স কপি'}
        </Button>
        {wd.status === 'pending' ? (
          <Button variant="danger" icon={<Ban size={16} />} onClick={cancel} disabled={busy}>
            {busy ? 'বাতিল হচ্ছে…' : 'আবেদন বাতিল'}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => navigate('/m/withdrawals')}>
            সব আবেদন
          </Button>
        )}
      </div>

      <p className="text-xs text-mut text-center">
        উত্তোলনে কোনো সুদ, চার্জ বা শতাংশ কাটা হয় না — পুরো অঙ্কই আপনি পান।
      </p>
    </div>
  );
}
