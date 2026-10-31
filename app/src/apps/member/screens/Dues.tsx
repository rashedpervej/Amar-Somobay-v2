/* ============================================================
   src/apps/member/screens/Dues.tsx — M-13 বকেয়া কিস্তি
   বকেয়ার পূর্ণ হিসাব, প্রতিটি কিস্তি থেকে সরাসরি জমা (M-06 প্রি-ফিল)।
   বিলম্ব-ফি শুধু "পর্যালোচনাধীন" হিসেবে দেখানো হয় — কোনো চার্জ যোগ হয় না।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, CalendarClock } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { EmptyState } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { dueInstallments } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

export default function Dues() {
  const { state, payable } = useMember();
  const navigate = useNavigate();
  const dues = dueInstallments(state).map((i) => {
    const acc = state.accounts.find((a) => a.id === i.accountId);
    const scheme = state.schemes.find((s) => s.id === acc?.schemeId);
    return {
      ...i,
      schemeId: scheme?.id ?? '',
      schemeName: scheme?.name ?? 'সাধারণ সঞ্চয়',
      month: i.dueDate.replace(/^[\u09E6-\u09EF]+\s+/, ''),
    };
  });

  const byScheme = state.schemes
    .map((s) => {
      const items = dues.filter((d) => d.schemeId === s.id);
      return { scheme: s, items, total: items.reduce((a, b) => a + b.amount, 0) };
    })
    .filter((g) => g.items.length > 0);

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-r-md border border-warn/40 bg-warn-bg p-4">
        <div className="flex items-center gap-2 text-warn-ink text-xs font-bold">
          <AlertTriangle size={15} /> মোট বকেয়া
        </div>
        <div className="num text-display font-extrabold text-warn-ink mt-1">৳{bn(payable)}</div>
        <div className="text-xs text-warn-ink/90 mt-1">{bn(dues.length)} কিস্তি বাকি</div>
      </div>

      {byScheme.length === 0 ? (
        <Card>
          <EmptyState
            title="কোনো বকেয়া নেই"
            sub="সব কিস্তি পরিশোধিত — ধন্যবাদ"
            action={<Button size="sm" onClick={() => navigate('/m/savings')}>অ্যাকাউন্ট দেখুন</Button>}
          />
        </Card>
      ) : (
        byScheme.map((g) => (
          <Card
            key={g.scheme.id}
            title={g.scheme.name}
            sub={`${bn(g.items.length)} কিস্তি · ৳${bn(g.total)}`}
            right={<Badge tone="warn">{g.scheme.frequency}</Badge>}
          >
            <ul className="divide-y divide-line-2">
              {g.items.map((it) => (
                <li key={it.id} className="py-2.5 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-r-pill bg-card-2 grid place-items-center shrink-0">
                    <CalendarClock size={16} className="text-mut" />
                  </span>
                  <div className="grow min-w-0">
                    <div className="text-sm font-bold text-txt">{it.month}</div>
                    <div className="text-xs text-mut">
                      কিস্তি {bn(it.serial)} · নির্ধারিত {it.dueDate}
                      {it.status === 'overdue' ? ' · দেরি হয়েছে' : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="num font-bold text-sm text-txt">৳{bn(it.amount)}</div>
                    <button
                      type="button"
                      onClick={() => navigate(`/m/deposit?amount=${it.amount}&note=${encodeURIComponent(`${it.month} কিস্তি`)}`)}
                      className="min-h-tap px-2 inline-flex items-center text-xs font-bold text-green-700 underline underline-offset-2"
                    >
                      জমা দিন
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              block
              className="mt-2"
              icon={<Banknote size={17} />}
              onClick={() => navigate(`/m/deposit?amount=${g.total}&note=${encodeURIComponent(`${g.scheme.name} — বকেয়া`)}`)}
            >
              পুরো বকেয়া ৳{bn(g.total)} জমা
            </Button>
          </Card>
        ))
      )}

      <Card title="দেরি-ফি সম্পর্কে" sub="নীতিগত পর্যালোচনা চলছে" right={<Badge tone="neutral">পরিবর্তন নেই</Badge>}>
        <p className="text-sm text-txt-2">
          বর্তমানে দেরি-ফি আরোপ করা হয় না। সামান্য দেরির জন্য চার্জ চালু করা হলে তা শরিয়াহ ও আইন পর্যালোচনার পরই হবে —
          এবং সেটি দাতব্য তহবিলে যাবে, সংস্থার আয়ে নয়।
        </p>
      </Card>
    </div>
  );
}
