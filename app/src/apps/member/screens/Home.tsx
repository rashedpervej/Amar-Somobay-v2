/* ============================================================
   src/apps/member/screens/Home.tsx — M-01 সঞ্চয় হোম (সদস্য)
   প্রোটোটাইপের M-01-এর কাঠামো: অভিবাদন → ব্যালান্স কার্ড → পরবর্তী কিস্তি →
   দ্রুত কাজ → সাম্প্রতিক লেনদেন। ডেটা ডেমো (src/demo/data.ts)।
   ============================================================ */

import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, BookOpen, Headphones, History, Plus } from 'lucide-react';
import { Badge, Card, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { member, savingsAccount, transactions } from '../../../demo/data';

export default function MemberHome() {
  const navigate = useNavigate();
  const recent = transactions.slice(0, 3);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-3">
        <div className="grow">
          <p className="text-sm text-mut">আসসালামু আলাইকুম</p>
          <h2 className="text-h2 text-txt leading-tight">{member.name}</h2>
          <p className="text-xs text-mut mt-0.5">
            {member.memberNo} · {member.org}
          </p>
        </div>
        <Badge tone="ok" dot>
          সক্রিয়
        </Badge>
      </div>

      {/* ব্যালান্স */}
      <div className="rounded-r-lg bg-green-700 text-white p-4 shadow-sh-2">
        <div className="text-xs text-green-100">আমার সঞ্চয় ব্যালান্স</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="num text-display font-extrabold leading-none">৳{bn(savingsAccount.balance)}</span>
        </div>
        <p className="text-xs text-green-100 mt-2">
          {savingsAccount.planName} · {savingsAccount.frequency} কিস্তি
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/m/deposit')}
            className="grow min-h-tap rounded-r-sm bg-lime text-green-900 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[.98] transition"
          >
            <Plus size={18} /> জমা দিন
          </button>
          <button
            type="button"
            onClick={() => navigate('/m/txn')}
            className="grow min-h-tap rounded-r-sm bg-white/12 border border-white/25 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[.98] transition"
          >
            <History size={18} /> লেনদেন
          </button>
        </div>
      </div>

      {/* পরবর্তী কিস্তি */}
      <Card title="পরবর্তী কিস্তি" sub={`${savingsAccount.paid}/${savingsAccount.total} কিস্তি পরিশোধিত`}>
        <div className="flex items-center gap-3">
          <div className="grow">
            <div className="num text-h2 font-extrabold text-txt">৳{bn(savingsAccount.installment)}</div>
            <div className="text-sm text-mut">শেষ তারিখ {savingsAccount.nextDue}</div>
          </div>
          <Badge tone="warn">বাকি আছে</Badge>
        </div>
        <div className="mt-3 h-2 rounded-r-pill bg-line-2 overflow-hidden">
          <div
            className="h-full bg-green-600"
            style={{ width: `${Math.round((savingsAccount.paid / savingsAccount.total) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-mut mt-2">
          কোনো সুদ, মুনাফা বা শতাংশভিত্তিক চার্জ নেই — শুধু আপনার জমা।
        </p>
      </Card>

      <SectionHead title="দ্রুত কাজ" />
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<ArrowDownToLine size={20} />} label="জমা দিন" onClick={() => navigate('/m/deposit')} />
        <QuickAction icon={<ArrowUpFromLine size={20} />} label="উত্তোলনের আবেদন" onClick={() => navigate('/m/savings')} />
        <QuickAction icon={<BookOpen size={20} />} label="স্টেটমেন্ট" onClick={() => navigate('/m/txn')} />
        <QuickAction icon={<Headphones size={20} />} label="সহায়তা" onClick={() => navigate('/m/more')} />
      </div>

      <SectionHead
        title="সাম্প্রতিক লেনদেন"
        right={
          <Link to="/m/txn" className="text-sm font-bold text-green-700">
            সব দেখুন
          </Link>
        }
      />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {recent.map((t) => (
          <Row
            key={t.id}
            title={t.title}
            sub={`${t.date} · ${t.mode} · ${t.receipt}`}
            right={
              <span className={`num font-bold ${t.kind === 'withdraw' ? 'text-danger' : 'text-ok'}`}>
                {t.kind === 'withdraw' ? '−' : '+'}৳{bn(t.amount)}
              </span>
            }
          />
        ))}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[88px] rounded-r-md bg-card border border-line shadow-sh-1 px-3 py-3 flex flex-col items-start justify-center gap-1.5 hover:bg-green-050 active:scale-[.98] transition"
    >
      <span className="w-9 h-9 grid place-items-center rounded-r-sm bg-green-050 text-green-700 border border-line-2">
        {icon}
      </span>
      <span className="text-sm font-bold text-txt leading-tight">{label}</span>
    </button>
  );
}
