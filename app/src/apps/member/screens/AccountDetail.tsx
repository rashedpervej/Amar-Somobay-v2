/* ============================================================
   src/apps/member/screens/AccountDetail.tsx — M-05 সঞ্চয় অ্যাকাউন্ট বিবরণ
   ব্যালান্স · কিস্তির সময়সূচি · শেষ জমা · কাজ (জমা / উত্তোলন / স্টেটমেন্ট)
   ============================================================ */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, FileText, Receipt } from 'lucide-react';
import { Badge, Button, Card, Row, SectionHead } from '../../../components/ui';
import { StatusChip } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { computeBalance } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { state, accountById } = useMember();
  const account = accountById(accountId) ?? state.accounts[0];

  if (!account) {
    return (
      <div className="p-4">
        <Card title="অ্যাকাউন্ট পাওয়া যায়নি">
          <Button onClick={() => navigate('/m/savings')}>তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const balance = computeBalance(state, account.id);
  const installments = state.installments.filter((i) => i.accountId === account.id);
  const paid = installments.filter((i) => i.status === 'paid').length;
  const deposits = state.deposits.filter((d) => d.accountId === account.id);
  const progress = Math.min(100, Math.round((paid / account.totalInstallments) * 100));

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <div className="rounded-r-lg bg-green-700 text-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-green-100">অ্যাকাউন্ট {account.number}</div>
            <div className="text-h3 mt-0.5">{account.schemeName}</div>
          </div>
          <Badge tone="ok">{account.status === 'active' ? 'সক্রিয়' : 'বন্ধের আবেদন'}</Badge>
        </div>
        <div className="mt-3 text-xs text-green-100">বর্তমান ব্যালান্স</div>
        <div className="num text-display font-extrabold leading-none">৳{bn(balance)}</div>
        <div className="mt-3 h-2 rounded-r-pill bg-white/20 overflow-hidden">
          <div className="h-full bg-lime" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-green-100 mt-1.5">
          <span>{bn(paid)}/{bn(account.totalInstallments)} কিস্তি পরিশোধিত</span>
          <span>{bn(progress)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => navigate('/m/deposit')}
          className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold text-txt"
        >
          <ArrowDownToLine size={18} className="text-green-700" /> জমা দিন
        </button>
        <button
          type="button"
          onClick={() => navigate('/m/withdrawals/new')}
          className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold text-txt"
        >
          <ArrowUpFromLine size={18} className="text-danger" /> উত্তোলন
        </button>
        <button
          type="button"
          onClick={() => navigate('/m/statement')}
          className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold text-txt"
        >
          <FileText size={18} className="text-info" /> স্টেটমেন্ট
        </button>
      </div>

      <SectionHead title="কিস্তির সময়সূচি" sub={`${bn(installments.length)}টি কিস্তি · ${bn(account.frequency)}`} />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
        {installments.map((i) => (
          <div key={i.id} className="px-4 py-3 flex items-center gap-3">
            <span className="w-8 h-8 grid place-items-center rounded-r-pill bg-card-2 border border-line-2 text-xs font-bold text-mut num">
              {bn(i.serial)}
            </span>
            <div className="grow min-w-0">
              <div className="text-sm font-bold text-txt">কিস্তি {bn(i.serial)}</div>
              <div className="text-xs text-mut">
                {i.status === 'paid' ? `পরিশোধিত · ${i.paidOn}` : `শেষ তারিখ ${i.dueDate}`}
              </div>
            </div>
            <div className="text-right">
              <div className="num text-sm font-bold text-txt">৳{bn(i.amount)}</div>
              <StatusChip status={i.status} />
            </div>
          </div>
        ))}
      </div>

      <SectionHead title="এই অ্যাকাউন্টের জমা" sub={`${bn(deposits.length)}টি রসিদ`} />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {deposits.slice(0, 4).map((d) => (
          <Row
            key={d.id}
            icon={<Receipt size={16} />}
            title={`৳${bn(d.amount)} · ${d.mode}`}
            sub={`${d.date} · ${d.receipt}`}
            right={<span className="text-xs font-bold text-green-700">রসিদ</span>}
            onClick={() => navigate(`/m/txn/${d.id}`)}
          />
        ))}
        {deposits.length === 0 ? <div className="px-4 py-8 text-center text-sm text-mut">এখনো কোনো জমা নেই</div> : null}
      </div>
    </div>
  );
}
