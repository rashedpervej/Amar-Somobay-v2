/* ============================================================
   src/apps/member/screens/Savings.tsx — M-04 আমার সঞ্চয় (তালিকা)
   প্রতিটি অ্যাকাউন্ট কার্ড → M-05 বিবরণ। কোনো মুনাফার হার নেই (D-01)।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { computeBalance } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

export default function Savings() {
  const { state } = useMember();
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h3 text-txt">আমার অ্যাকাউন্ট</h2>
          <p className="text-xs text-mut">{bn(state.accounts.length)}টি সক্রিয় হিসাব</p>
        </div>
        <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => navigate('/m/schemes')}>
          নতুন স্কিম
        </Button>
      </div>

      {state.accounts.map((a) => {
        const balance = computeBalance(state, a.id);
        const paid = state.installments.filter((i) => i.accountId === a.id && i.status === 'paid').length;
        const progress = Math.min(100, Math.round((paid / a.totalInstallments) * 100));
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate(`/m/savings/${a.id}`)}
            className="w-full min-h-tap text-left rounded-r-md bg-card border border-line shadow-sh-1 p-4 hover:shadow-sh-2 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-txt">{a.schemeName}</div>
                <div className="text-xs text-mut mt-0.5">
                  {a.number} · {a.frequency} ৳{bn(a.installment)}
                </div>
              </div>
              <Badge tone={a.status === 'active' ? 'ok' : 'warn'} dot>
                {a.status === 'active' ? 'সক্রিয়' : 'আবেদনকৃত'}
              </Badge>
            </div>

            <div className="num text-h1 font-extrabold text-txt mt-3">৳{bn(balance)}</div>
            <div className="text-xs text-mut">বর্তমান ব্যালান্স</div>

            <div className="mt-2.5 h-2 rounded-r-pill bg-line-2 overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-mut mt-1.5">
              <span>
                {bn(paid)}/{bn(a.totalInstallments)} কিস্তি · {bn(progress)}%
              </span>
              <span className="text-green-700 font-bold flex items-center gap-0.5">
                বিস্তারিত <ChevronRight size={14} />
              </span>
            </div>
          </button>
        );
      })}

      <Card title="শতাংশ-ভিত্তিক চার্জ" right={<Badge tone="ok">৳০</Badge>}>
        <p className="text-sm text-txt-2">
          সঞ্চয় আমানতে কোনো সুদ বা মুনাফার হিসাব নেই — ব্যালান্স =
          প্রারম্ভিক জমা + আপনার জমা − উত্তোলন। শেয়ার-লভ্যাংশ এখনো চালু হয়নি (শরিয়াহ ও আইনগত যাচাইয়ের অপেক্ষায়)।
        </p>
      </Card>
    </div>
  );
}
