/* ============================================================
   src/apps/member/screens/QardLoans.tsx — QM-06 আমার সহায়তা
   চলমান ও সমাপ্ত ঋণ, মূলধন-ভিত্তিক কিস্তি ছক, পরিশোধ অবস্থা ও প্রমাণ।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, FileText, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { nextDue, outstanding, paidPct, perInstallment, productById, repaid, repaymentsOf, schedule } from '../../../domain/qard';

export default function QardLoans() {
  const navigate = useNavigate();
  const { loans, repayments, products } = useModules();
  const active = loans.filter((l) => l.status !== 'closed');
  const done = loans.filter((l) => l.status === 'closed');
  const totalOutstanding = loans.reduce((s, l) => s + outstanding(loans, repayments, l.id), 0);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="rounded-r-md bg-green-800 text-white p-4">
        <div className="text-xs text-green-100">মোট বাকি মূলধন</div>
        <div className="num text-display font-extrabold mt-1">৳{bn(totalOutstanding)}</div>
        <div className="text-xs text-green-100 mt-1">
          মূলধন ৳{bn(loans.reduce((s, l) => s + l.principal, 0))} − পরিশোধিত ৳{bn(loans.reduce((s, l) => s + repaid(loans, repayments, l.id), 0))} · সুদ ৳০
        </div>
      </div>

      {active.length ? <SectionHead title="চলমান / বিতরণ বাকি" sub={`${bn(active.length)}টি`} /> : null}
      {active.map((l) => {
        const ds = schedule(l, repayments);
        const next = nextDue(l, repaymentsOf(repayments, l.id).length);
        return (
          <Card
            key={l.id}
            title={`${l.no} · ৳${bn(l.principal)}`}
            sub={`${productById(products, l.productId)?.name} · ${bn(l.tenure)} কিস্তি · ${l.committee}`}
            right={<Badge tone={l.status === 'pending' ? 'warn' : 'ok'}>{l.status === 'pending' ? 'বিতরণ বাকি' : 'চলমান'}</Badge>}
          >
            <div className="h-2 rounded-r-pill bg-line-2 overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: `${paidPct(loans, repayments, l.id)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-mut mt-1">
              <span>{bn(paidPct(loans, repayments, l.id))}% পরিশোধিত</span>
              <span>বাকি ৳{bn(outstanding(loans, repayments, l.id))}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-r-sm bg-card-2 p-2">
                <div className="text-[11px] text-mut">পরবর্তী কিস্তি</div>
                <div className="num text-sm font-extrabold text-txt">৳{bn(next?.amount ?? 0)}</div>
                <div className="text-[11px] text-mut">{next?.date}</div>
              </div>
              <div className="rounded-r-sm bg-card-2 p-2">
                <div className="text-[11px] text-mut">পরিশোধ অবস্থা</div>
                <div className="text-sm font-extrabold text-ok">{l.status === 'arrears' ? 'বকেয়া' : 'নিয়মিত'}</div>
                <div className="text-[11px] text-mut">চার্জ ৳০</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs font-bold text-mut mb-1">মূলধন-ভিত্তিক কিস্তি ছক · প্রতি ৳{bn(perInstallment(l))}</div>
              <div className="grid grid-cols-6 gap-1.5">
                {ds.map((s) => (
                  <div
                    key={s.no}
                    className={`rounded-r-sm border py-1 text-center ${
                      s.status === 'paid' ? 'border-ok-bd bg-ok-bg text-ok-ink' : s.status === 'next' ? 'border-warn-bd bg-warn-bg text-warn-ink' : 'border-line bg-card-2 text-mut'
                    }`}
                  >
                    <div className="num text-[11px] font-bold">{bn(s.no)}</div>
                    <div className="text-[10px]">{s.status === 'paid' ? 'দেওয়া' : s.status === 'next' ? 'বর্তমান' : 'বাকি'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-2 py-1.5 text-xs mt-2">
              maker ≠ checker ✓ · কমিটি {l.committee} · কোনো সুদ/ফি নেই
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button size="sm" icon={<ArrowDownToLine size={14} />} onClick={() => navigate('/m/qard/pay')}>কিস্তি পরিশোধ</Button>
              <Button size="sm" variant="secondary" onClick={() => navigate('/m/qard/applications')}>আবেদন ইতিহাস</Button>
            </div>
          </Card>
        );
      })}

      {done.length ? <SectionHead title="সমাপ্ত" sub={`${bn(done.length)}টি`} /> : null}
      {done.map((l) => (
        <Card
          key={l.id}
          title={`${l.no} · ৳${bn(l.principal)}`}
          sub={`${l.disbursedAt} – ${l.closedAt ?? ''} · সম্পূর্ণ পরিশোধিত`}
          right={<Badge tone="neutral">সম্পন্ন</Badge>}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-txt-2">
              {bn(l.tenure)} কিস্তি · সুদ ৳০
              <div className="text-xs text-mut">সনদ {l.certNo ?? '—'}</div>
            </div>
            <Button size="sm" variant="secondary" icon={<FileText size={14} />} onClick={() => navigate(`/m/qard/certificate/${l.id}`)}>
              সনদ
            </Button>
          </div>
        </Card>
      ))}

      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs flex gap-2">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <span>
          মূলধন − পরিশোধিত = বাকি (derived)। কোনো সুদ/মুনাফা যোগ হয় না। ছেড়ে দেওয়া (write-off) অঙ্ক বাকি থেকে বাদ পড়ে কিন্তু
          খাতায় <b>ক্ষতি</b> হিসেবে আলাদা দৃশ্যমান থাকে।
        </span>
      </div>
    </div>
  );
}
