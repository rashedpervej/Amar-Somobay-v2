/* ============================================================
   src/apps/member/screens/Statement.tsx — M-14 স্টেটমেন্ট ও রসিদ কেন্দ্র
   সময়ভিত্তিক সারাংশ, পূর্ণ খতিয়ান, টেক্সট-স্টেটমেন্ট ডাউনলোড + প্রিন্ট।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Printer } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

type Line = { id: string; date: string; desc: string; credit: number; debit: number };

export default function Statement() {
  const { state, balance } = useMember();
  const navigate = useNavigate();
  const [year, setYear] = useState('সব');

  const years = useMemo(() => {
    const set = new Set<string>();
    [...state.deposits.map((d) => d.date), ...state.withdrawals.map((w) => w.date)].forEach((d) => {
      const m = d.match(/[০-৯]{4}/);
      if (m) set.add(m[0]);
    });
    return ['সব', ...[...set].sort().reverse()];
  }, [state.deposits, state.withdrawals]);

  const lines = useMemo<Line[]>(() => {
    const inRange = (d: string) => year === 'সব' || d.includes(year);
    const l: Line[] = [
      ...state.deposits.filter((d) => inRange(d.date)).map((d) => ({ id: d.id, date: d.date, desc: `${d.mode} জমা · ${d.receipt}`, credit: d.amount, debit: 0 })),
      ...state.withdrawals
        .filter((w) => w.status === 'paid' && inRange(w.date))
        .map((w) => ({ id: w.id, date: w.date, desc: `উত্তোলন · ${w.reference}`, credit: 0, debit: w.amount })),
    ];
    return l.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.deposits, state.withdrawals, year]);

  const credit = lines.reduce((s, l) => s + l.credit, 0);
  const debit = lines.reduce((s, l) => s + l.debit, 0);

  function download() {
    const head = ['তারিখ', 'বিবরণ', 'জমা (৳)', 'উত্তোলন (৳)'];
    const body = lines.map((l) => [l.date, l.desc, l.credit ? bn(l.credit) : '', l.debit ? bn(l.debit) : '']);
    const text = [
      'সমবায় — অ্যাকাউন্ট স্টেটমেন্ট',
      `সদস্য: ${state.profile.name} (${state.profile.memberNo})`,
      `সময়কাল: ${year}`,
      '———————————',
      head.join(' | '),
      ...body.map((r) => r.join(' | ')),
      '———————————',
      `মোট জমা: ৳${bn(credit)}`,
      `মোট উত্তোলন: ৳${bn(debit)}`,
      `বর্তমান ব্যালান্স: ৳${bn(balance)}`,
      '',
      'কোনো সুদ বা মুনাফা প্রদান করা হয় না (নীতি D-01)।',
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${state.profile.memberNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 space-y-4">
      <Card title="স্টেটমেন্ট" sub={`${state.profile.name} · ${state.profile.memberNo}`} right={<Badge tone="brand">M-14</Badge>}>
        <Chipset>
          {years.map((y) => (
            <Chip key={y} active={year === y} onClick={() => setYear(y)}>
              {y}
            </Chip>
          ))}
        </Chipset>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="rounded-r-sm bg-ok-bg px-2 py-2">
            <div className="text-[11px] text-ok-ink">জমা</div>
            <div className="num text-sm font-extrabold text-ok-ink">৳{bn(credit)}</div>
          </div>
          <div className="rounded-r-sm bg-danger-bg px-2 py-2">
            <div className="text-[11px] text-danger-ink">উত্তোলন</div>
            <div className="num text-sm font-extrabold text-danger-ink">৳{bn(debit)}</div>
          </div>
          <div className="rounded-r-sm bg-green-050 px-2 py-2">
            <div className="text-[11px] text-green-800">ব্যালান্স</div>
            <div className="num text-sm font-extrabold text-green-800">৳{bn(balance)}</div>
          </div>
        </div>
      </Card>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 bg-card-2 text-[11px] font-bold text-mut uppercase tracking-wide">
          <span>তারিখ · বিবরণ</span>
          <span className="text-right">অঙ্ক</span>
        </div>
        <div className="divide-y divide-line-2">
          {lines.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => navigate(`/m/txn/${l.id}`)}
              className="w-full min-h-tap px-4 py-2.5 grid grid-cols-[1fr_auto] gap-2 items-center text-left hover:bg-green-050/60"
            >
              <span className="min-w-0">
                <span className="block text-xs text-mut">{l.date}</span>
                <span className="block text-sm text-txt font-bold truncate">{l.desc}</span>
              </span>
              <span className={`num text-sm font-bold text-right ${l.credit ? 'text-ok' : 'text-danger'}`}>
                {l.credit ? `+৳${bn(l.credit)}` : `−৳${bn(l.debit)}`}
              </span>
            </button>
          ))}
          {lines.length === 0 ? <div className="px-4 py-8 text-center text-sm text-mut">এই সময়ে কোনো লেনদেন নেই</div> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Download size={16} />} onClick={download}>
          ডাউনলোড
        </Button>
        <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
          প্রিন্ট
        </Button>
      </div>

      <Card title="রসিদ যাচাই" sub="যেকোনো রসিদ নম্বর দিয়ে যাচাই করুন" right={<FileText size={16} className="text-mut" />}>
        <p className="text-sm text-txt-2">
          রসিদ নম্বর বা রেফারেন্স নম্বর নিয়ে সহায়তা কেন্দ্রে (M-21) টিকিট খুললে যাচাই করা হবে — কোনো ফি লাগবে না।
        </p>
        <Button block className="mt-2" variant="ghost" onClick={() => navigate('/m/help')}>
          সহায়তা কেন্দ্র
        </Button>
      </Card>
    </div>
  );
}
