/* ============================================================
   src/apps/member/screens/QardHome.tsx — QM-01 কর্জে হাসানা হোম
   যোগ্যতার অবস্থা, চলমান সুদমুক্ত সহায়তা, সম্পূর্ণ পরিশোধিত ঋণ ও আবেদনের সারাংশ।
   সুদ/মুনাফা কোথাও নেই — শুধু মূলধন ফেরত।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ChevronRight, FileText, Heart, Info, ShieldCheck, Scale } from 'lucide-react';
import { Badge, Button, Card, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';
import { useModules } from '../../../store/moduleStore';
import { eligibility, nextDue, outstanding, paidPct, perInstallment, productById, repaid } from '../../../domain/qard';

const appTone = (s: string) => (s === 'pending' ? 'warn' : s === 'approved' || s === 'disbursed' ? 'ok' : 'danger');
const appText = (s: string) => (s === 'pending' ? 'অপেক্ষমাণ' : s === 'approved' ? 'অনুমোদিত' : s === 'disbursed' ? 'বিতরণ হয়েছে' : 'প্রত্যাখ্যাত');

export default function QardHome() {
  const navigate = useNavigate();
  const { state, payable } = useMember();
  const { loans, repayments, applications, products } = useModules();

  const active = loans.filter((l) => l.status === 'active' || l.status === 'arrears');
  const closed = loans.filter((l) => l.status === 'closed');
  const loan = active[0];
  const el = eligibility(
    { kycVerified: state.profile.kycStatus === 'verified', memberMonths: 14, duesTotal: payable, hasActive: active.length > 0 },
    40000,
  );
  const next = loan ? nextDue(loan, repayments.filter((r) => r.loanId === loan.id).length) : null;

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-qh-gold-ink bg-qh-gold-soft border border-qh-gold-bd rounded-r-pill px-2.5 py-1">
        <Heart size={13} /> কর্জে হাসানা · সুদমুক্ত সহায়তা
      </div>

      <div className="rounded-r-lg bg-green-800 text-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-green-100">আমার যোগ্যতার অবস্থা</div>
            <div className="font-extrabold text-h2 mt-0.5">
              {el.state === 'eligible' ? 'আবেদন করতে পারবেন' : el.state === 'conditional' ? 'শর্ত পূরণ হলে পারবেন' : 'এখন আবেদন করা যাবে না'}
            </div>
            <div className="text-xs text-green-100 mt-1">
              সর্বোচ্চ ৳{bn(el.max)} · মূল্যায়ন {state.profile.since} থেকে · নিয়ম সংস্করণ ৩
            </div>
          </div>
          <Badge tone={el.state === 'eligible' ? 'ok' : 'warn'}>{el.state === 'eligible' ? 'যোগ্য' : el.state === 'conditional' ? 'শর্তসাপেক্ষ' : 'সীমিত'}</Badge>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-[11px] bg-white/12 border border-white/25 rounded-r-pill px-2 py-0.5 inline-flex items-center gap-1">
            <ShieldCheck size={11} /> সুদ ৳০
          </span>
          <span className="text-[11px] bg-white/12 border border-white/25 rounded-r-pill px-2 py-0.5">কোনো ফি নেই</span>
          <span className="text-[11px] bg-white/12 border border-white/25 rounded-r-pill px-2 py-0.5">শুধু মূলধন ফেরত</span>
        </div>
      </div>

      {el.reasons.some((r) => !r.ok) ? (
        <>
          <SectionHead title="কেন ও কী করলে হবে" sub={`${bn(el.reasons.filter((r) => !r.ok).length)}টি কারণ`} />
          <div className="space-y-2">
            {el.reasons.filter((r) => !r.ok).map((r) => (
              <div key={r.code} className="rounded-r-sm bg-warn-bg border border-warn-bd text-warn-ink px-3 py-2 text-sm">
                <b>{r.title}</b>
                <div className="text-xs mt-0.5">{r.detail}</div>
              </div>
            ))}
          </div>
          <Button block variant="secondary" onClick={() => navigate('/m/qard/eligibility')}>
            যোগ্যতার বিস্তারিত
          </Button>
        </>
      ) : null}

      {loan ? (
        <>
          <SectionHead
            title="আমার চলমান সহায়তা"
            sub={loan.no}
            right={<button type="button" onClick={() => navigate('/m/qard/loans')} className="text-sm font-bold text-green-700">বিস্তারিত</button>}
          />
          <Card title={`৳${bn(loan.principal)} · সুদ ৳০`} sub={`${bn(repaid(loans, repayments, loan.id))} পরিশোধিত · বাকি ৳${bn(outstanding(loans, repayments, loan.id))}`}>
            <div className="h-2 rounded-r-pill bg-line-2 overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: `${paidPct(loans, repayments, loan.id)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-mut mt-1">
              <span>{bn(paidPct(loans, repayments, loan.id))}% পরিশোধিত</span>
              <span>{bn(loan.tenure)} কিস্তি · ৳{bn(perInstallment(loan))}/কিস্তি</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-r-sm bg-card-2 p-2">
                <div className="text-[11px] text-mut">পরবর্তী কিস্তি</div>
                <div className="num text-sm font-extrabold text-txt">৳{bn(next?.amount ?? 0)}</div>
                <div className="text-[11px] text-mut">{loan.nextDue ?? '—'}</div>
              </div>
              <div className="rounded-r-sm bg-card-2 p-2">
                <div className="text-[11px] text-mut">উদ্দেশ্য</div>
                <div className="text-sm font-extrabold text-txt">{productById(products, loan.productId)?.name ?? '—'}</div>
                <div className="text-[11px] text-mut">{loan.committee}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button size="sm" icon={<ArrowDownToLine size={14} />} onClick={() => navigate('/m/qard/pay')}>কিস্তি দিন</Button>
              <Button size="sm" variant="secondary" icon={<Scale size={14} />} onClick={() => navigate('/m/qard/loans')}>ছক দেখুন</Button>
            </div>
          </Card>
        </>
      ) : (
        <Card title="চলমান সহায়তা নেই" sub="যোগ্য হলে আবেদন করতে পারবেন">
          <p className="text-sm text-txt-2">অনুমোদিত অঙ্ক শুধু মূলধন হিসেবে ফেরত দিতে হয় — কোনো সুদ, ফি বা অতিরিক্ত চার্জ নেই।</p>
          <Button block className="mt-2" onClick={() => navigate('/m/qard/apply')}>আবেদন করুন</Button>
        </Card>
      )}

      {closed.length ? (
        <>
          <SectionHead title="সম্পূর্ণ পরিশোধিত" sub={`${bn(closed.length)}টি`} />
          {closed.map((l) => (
            <Card key={l.id} title={`৳${bn(l.principal)} · সুদ ৳০`} sub={`${l.no} · ${l.disbursedAt} – ${l.closedAt ?? ''}`} right={<Badge tone="ok">সম্পন্ন</Badge>}>
              <p className="text-xs text-mut">
                {bn(l.tenure)}টি কিস্তিতে সম্পূর্ণ পরিশোধিত · {productById(products, l.productId)?.name}
              </p>
              <Button size="sm" variant="secondary" className="mt-2" icon={<FileText size={14} />} onClick={() => navigate(`/m/qard/certificate/${l.id}`)}>
                সমাপ্তি সনদ
              </Button>
            </Card>
          ))}
        </>
      ) : null}

      <SectionHead
        title="আমার আবেদন"
        sub={`${bn(applications.length)}টি`}
        right={<button type="button" onClick={() => navigate('/m/qard/applications')} className="text-sm font-bold text-green-700">সব দেখুন</button>}
      />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
        {applications.slice(0, 4).map((a) => (
          <button key={a.id} type="button" onClick={() => navigate('/m/qard/applications')} className="w-full min-h-tap px-4 py-2.5 flex items-center gap-3 text-left">
            <div className="grow min-w-0">
              <div className="num text-sm font-bold text-txt">{a.no}</div>
              <div className="text-xs text-mut">{a.submittedAt} · {a.purpose}</div>
            </div>
            <div className="num text-sm font-bold text-txt shrink-0">৳{bn(a.amount)}</div>
            <Badge tone={appTone(a.status)}>{appText(a.status)}</Badge>
          </button>
        ))}
      </div>

      <Card title="কর্জে হাসানা কী — সংক্ষেপে" right={<Info size={16} className="text-mut" />}>
        <p className="text-sm text-txt-2 leading-relaxed">
          এটি সমিতির <b>সুদমুক্ত সহায়তা</b>; আলাদা মডিউল ও আলাদা খাত। ফেরত দিতে হয় <b>শুধু মূলধন</b> — কোনো সুদ, মুনাফা বা
          সময়ভিত্তিক চার্জ নেই। আবেদন করতে পারেন শুধু <b>বিদ্যমান সক্রিয় সদস্য</b>, যোগ্যতা নিয়ম পাস করলে। এই অঙ্ক
          “মোট সঞ্চয়”-এ যোগ হয় না; উত্তোলনের সীমাও বাড়ায় না।
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/m/qard/products')}>পণ্য ও শর্ত</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/m/qard/eligibility')}>যোগ্যতা</Button>
        </div>
      </Card>

      <Row
        icon={<Heart size={18} />}
        title="আমার সহায়তা (ঋণ)"
        sub={`বাকি ৳${bn(loans.filter((l) => l.status !== 'closed').reduce((s, l) => s + outstanding(loans, repayments, l.id), 0))}`}
        right={<ChevronRight size={18} className="text-mut" />}
        onClick={() => navigate('/m/qard/loans')}
      />
    </div>
  );
}
