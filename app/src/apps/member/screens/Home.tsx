/* ============================================================
   src/apps/member/screens/Home.tsx — M-01 সঞ্চয় হোম (সদস্য)
   অভিবাদন → ব্যালান্স → পরবর্তী কিস্তি → দ্রুত কাজ → সাম্প্রতিক লেনদেন।
   সব সংখ্যা স্টোর থেকে: জমা দিলে সাথে সাথে ব্যালান্স ও তালিকা বদলায়।
   ============================================================ */

import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, BookOpen, Headphones, History, Plus } from 'lucide-react';
import { Badge, Card, Row, SectionHead } from '../../../components/ui';
import { StatusChip } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { dueInstallments } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

export default function MemberHome() {
  const navigate = useNavigate();
  const { state, balance, account, unreadCount } = useMember();
  const p = state.profile;
  const dues = dueInstallments(state);
  const next = dues[0];
  const paid = state.installments.filter((i) => i.status === 'paid').length;
  const total = state.installments.length || 1;

  const recent = [
    ...state.deposits.map((d) => ({ id: d.id, title: `${d.mode} জমা`, date: d.date, amount: d.amount, kind: 'deposit' as const, ref: d.receipt })),
    ...state.withdrawals.filter((w) => w.status !== 'rejected').map((w) => ({ id: w.id, title: w.reason, date: w.date, amount: w.amount, kind: 'withdraw' as const, ref: w.reference })),
  ].slice(0, 3);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-3">
        <div className="grow">
          <p className="text-sm text-mut">আসসালামু আলাইকুম</p>
          <h2 className="text-h2 text-txt leading-tight">{p.name}</h2>
          <p className="text-xs text-mut mt-0.5">
            {p.memberNo} · {p.org}
          </p>
        </div>
        <button type="button" onClick={() => navigate('/m/notifications')} className="relative min-w-tap min-h-tap grid place-items-center rounded-r-sm border border-line bg-card">
          <span className="text-h3">🔔</span>
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-r-pill bg-danger text-white text-[11px] font-bold grid place-items-center">
              {bn(unreadCount)}
            </span>
          ) : null}
        </button>
      </div>

      {/* ব্যালান্স */}
      <div className="rounded-r-lg bg-green-700 text-white p-4 shadow-sh-2">
        <div className="text-xs text-green-100">আমার সঞ্চয় ব্যালান্স</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="num text-display font-extrabold leading-none">৳{bn(balance)}</span>
        </div>
        <p className="text-xs text-green-100 mt-2">
          {account?.schemeName ?? 'সাধারণ সঞ্চয়'} · {state.accounts.length} অ্যাকাউন্ট
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
      <Card
        title="পরবর্তী কিস্তি"
        sub={`${bn(paid)}/${bn(total)} কিস্তি পরিশোধিত`}
        right={<Link to="/m/dues" className="text-xs font-bold text-green-700">সব বকেয়া</Link>}
      >
        <div className="flex items-center gap-3">
          <div className="grow">
            <div className="num text-h2 font-extrabold text-txt">৳{bn(next?.amount ?? account?.installment ?? 0)}</div>
            <div className="text-sm text-mut">{next ? `শেষ তারিখ ${next.dueDate}` : 'সব কিস্তি পরিশোধিত'}</div>
          </div>
          {next ? <StatusChip status={next.status === 'overdue' ? 'overdue' : 'due'} /> : <Badge tone="ok">সম্পন্ন</Badge>}
        </div>
        <div className="mt-3 h-2 rounded-r-pill bg-line-2 overflow-hidden">
          <div className="h-full bg-green-600 transition-all" style={{ width: `${Math.round((paid / total) * 100)}%` }} />
        </div>
        <p className="text-xs text-mut mt-2">কোনো সুদ, মুনাফা বা শতাংশভিত্তিক চার্জ নেই — শুধু আপনার জমা।</p>
      </Card>

      <SectionHead title="দ্রুত কাজ" />
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<ArrowDownToLine size={20} />} label="জমা দিন" onClick={() => navigate('/m/deposit')} />
        <QuickAction icon={<ArrowUpFromLine size={20} />} label="উত্তোলনের আবেদন" onClick={() => navigate('/m/withdrawals/new')} />
        <QuickAction icon={<BookOpen size={20} />} label="স্টেটমেন্ট" onClick={() => navigate('/m/statement')} />
        <QuickAction icon={<Headphones size={20} />} label="সহায়তা" onClick={() => navigate('/m/help')} />
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
            sub={`${t.date} · ${t.ref}`}
            right={
              <span className={`num font-bold ${t.kind === 'withdraw' ? 'text-danger' : 'text-ok'}`}>
                {t.kind === 'withdraw' ? '−' : '+'}৳{bn(t.amount)}
              </span>
            }
            onClick={() => navigate(`/m/txn/${t.id}`)}
          />
        ))}
        {recent.length === 0 ? <div className="px-4 py-6 text-center text-sm text-mut">এখনো কোনো লেনদেন নেই</div> : null}
      </div>

      <Card title="আরও" sub="স্কিম, নোটিশ ও সেটিংস">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => navigate('/m/schemes')} className="min-h-tap rounded-r-sm bg-card-2 border border-line text-sm font-bold text-txt-2">
            স্কিম দেখুন
          </button>
          <button type="button" onClick={() => navigate('/m/notices')} className="min-h-tap rounded-r-sm bg-card-2 border border-line text-sm font-bold text-txt-2">
            নোটিশ বোর্ড
          </button>
        </div>
      </Card>
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
      <span className="w-9 h-9 grid place-items-center rounded-r-sm bg-green-050 text-green-700 border border-line-2">{icon}</span>
      <span className="text-sm font-bold text-txt leading-tight">{label}</span>
    </button>
  );
}
