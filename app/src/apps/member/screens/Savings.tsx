/* ============================================================
   src/apps/member/screens/Savings.tsx — M-04 আমার সঞ্চয় অ্যাকাউন্ট (তালিকা ও সারাংশ)
   শুধু সঞ্চয়ের তথ্য — কোনো সুদ/মুনাফার হার নেই (নীতি D-01)।
   ============================================================ */

import { Link } from 'react-router-dom';
import { ChevronRight, FileText, TrendingUp, Wallet } from 'lucide-react';
import { Badge, Card, Row } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { savingsAccount } from '../../../demo/data';

export default function Savings() {
  const progress = Math.round((savingsAccount.paid / savingsAccount.total) * 100);

  return (
    <div className="p-4 space-y-4">
      <Card title="আমার সঞ্চয় অ্যাকাউন্ট" sub="একটি সক্রিয় হিসাব">
        <div className="rounded-r-md bg-green-050 border border-line-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-txt">{savingsAccount.planName}</div>
              <div className="text-xs text-mut mt-0.5">
                {savingsAccount.frequency} কিস্তি · ৳{bn(savingsAccount.installment)}
              </div>
            </div>
            <Badge tone="ok" dot>
              সক্রিয়
            </Badge>
          </div>

          <div className="num text-h1 font-extrabold text-txt mt-3">৳{bn(savingsAccount.balance)}</div>
          <div className="text-xs text-mut">বর্তমান ব্যালান্স</div>

          <div className="mt-3 h-2 rounded-r-pill bg-white border border-line-2 overflow-hidden">
            <div className="h-full bg-green-600" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-mut mt-1.5">
            <span>{bn(savingsAccount.paid)}/{bn(savingsAccount.total)} কিস্তি</span>
            <span>{bn(progress)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-3 py-2">
            <div className="text-xs text-mut">পরবর্তী কিস্তি</div>
            <div className="num font-bold text-txt">৳{bn(savingsAccount.installment)}</div>
            <div className="text-xs text-mut">{savingsAccount.nextDue}</div>
          </div>
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-3 py-2">
            <div className="text-xs text-mut">শতাংশ-ভিত্তিক চার্জ</div>
            <div className="num font-bold text-ok">৳{bn(0)}</div>
            <div className="text-xs text-mut">সুদমুক্ত নীতি</div>
          </div>
        </div>
      </Card>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        <Row
          icon={<Wallet size={18} />}
          title="উত্তোলনের আবেদন"
          sub="সঞ্চয় থেকে টাকা তোলার আবেদন (M-10)"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => undefined}
        />
        <Row
          icon={<FileText size={18} />}
          title="স্টেটমেন্ট ও রসিদ"
          sub="সব লেনদেন, রসিদ কেন্দ্র (M-14)"
          right={<Link to="/m/txn" className="text-xs font-bold text-green-700">খুলুন</Link>}
        />
        <Row
          icon={<TrendingUp size={18} />}
          title="বকেয়া ও নির্ধারিত কিস্তি"
          sub="কোন কিস্তি কখন দিতে হবে (M-13)"
          right={<Badge tone="warn">১টি বাকি</Badge>}
          onClick={() => undefined}
        />
      </div>

      <p className="text-xs text-mut text-center px-4">
        এই পর্দায় কোনো মুনাফার হার নেই — সঞ্চয় আমানতে শতাংশ নয়, শুধু জমা ও উত্তোলন।
      </p>
    </div>
  );
}
