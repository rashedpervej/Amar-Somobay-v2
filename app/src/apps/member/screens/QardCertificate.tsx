/* ============================================================
   src/apps/member/screens/QardCertificate.tsx — QM-08 সমাপ্তি সনদ
   সম্পূর্ণ মূলধন পরিশোধের প্রমাণপত্র — প্রিন্ট, কপি ও ডাউনলোড কাজ করে।
   সনদে স্পষ্ট লেখা থাকে: কোনো সুদ, মুনাফা বা অতিরিক্ত চার্জ নেওয়া হয়নি।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Printer, ShieldCheck, Star } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';
import { useModules } from '../../../store/moduleStore';
import { productById, repaid } from '../../../domain/qard';

export default function QardCertificate() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { state } = useMember();
  const { loans, repayments, products } = useModules();
  const closed = loans.filter((l) => l.status === 'closed');
  const loan = closed.find((l) => l.id === loanId) ?? closed[0];
  const [copied, setCopied] = useState(false);

  if (!loan) {
    return (
      <div className="p-4 space-y-4">
        <Card title="সনদ এখনো তৈরি হয়নি" sub="সম্পূর্ণ মূলধন পরিশোধের পর সনদ ইস্যু হয়">
          <p className="text-sm text-txt-2">
            আপনি সমস্ত কিস্তি পরিশোধ করলে সিস্টেম স্বয়ংক্রিয়ভাবে সনদ তৈরি করে — কোনো আবেদন লাগে না।
          </p>
          <Button className="mt-2" onClick={() => navigate('/m/qard/loans')}>আমার সহায়তা</Button>
        </Card>
      </div>
    );
  }

  const rows: [string, string][] = [
    ['সনদ নম্বর', loan.certNo ?? '—'],
    ['ঋণ নম্বর', loan.no],
    ['সদস্য', `${state.profile.name} (${state.profile.memberNo})`],
    ['পণ্য', productById(products, loan.productId)?.name ?? '—'],
    ['অনুমোদিত মূলধন', `৳${bn(loan.principal)}`],
    ['পরিশোধিত', `৳${bn(repaid(loans, repayments, loan.id))}`],
    ['সুদ / মুনাফা', '৳০'],
    ['মেয়াদ', `${bn(loan.tenure)} কিস্তি`],
    ['সমাপ্তি', loan.closedAt ?? '—'],
    ['প্রমাণ হ্যাশ', loan.certHash ?? '—'],
  ];

  function copy() {
    navigator.clipboard?.writeText(rows.map(([k, v]) => `${k}: ${v}`).join('\n')).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const text = [
      'সমবায় — কর্জে হাসানা সমাপ্তি সনদ',
      '————————————————',
      ...rows.map(([k, v]) => `${k}: ${v}`),
      '',
      'এতদ্বারা প্রমাণিত হয় যে সদস্য সম্পূর্ণ মূলধন পরিশোধ করেছেন।',
      'কোনো সুদ, মুনাফা বা অতিরিক্ত চার্জ গ্রহণ করা হয়নি (BR-20)।',
      `ইস্যু: ${loan.closedAt ?? ''} · যাচাই: ${loan.certHash ?? ''}`,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${loan.certNo ?? 'qard-certificate'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <div className="rounded-r-lg border-2 border-qh-gold-bd bg-qh-gold-pale p-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-r-pill bg-qh-gold-soft text-qh-gold-ink grid place-items-center">
          <Star size={24} />
        </div>
        <div className="text-xs font-bold tracking-wide text-qh-gold-ink mt-2">সমাপ্তি সনদ · কর্জে হাসানা</div>
        <p className="text-sm text-txt-2 mt-2 leading-relaxed">
          এতদ্বারা প্রমাণিত হচ্ছে যে <b>{state.profile.name}</b> ({state.profile.memberNo}) সম্পূর্ণ মূলধন পরিশোধ করেছেন।
          কোনো সুদ, মুনাফা বা অতিরিক্ত চার্জ গ্রহণ করা হয়নি।
        </p>
        <div className="num text-xs font-bold text-qh-gold-ink mt-2">
          {loan.certNo} · হ্যাশ {loan.certHash}
        </div>
      </div>

      <Card title="সনদের বিবরণ" right={<Badge tone="ok">বৈধ</Badge>}>
        <dl className="text-sm divide-y divide-line-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-mut shrink-0">{k}</dt>
              <dd className="num font-bold text-txt text-right break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>প্রিন্ট</Button>
        <Button size="sm" variant="ghost" icon={<Copy size={14} />} onClick={copy}>{copied ? 'কপি হয়েছে' : 'কপি'}</Button>
        <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={download}>সেভ</Button>
      </div>

      <Button block variant="secondary" icon={<ShieldCheck size={15} />} onClick={() => navigate('/verify')}>
        সনদ যাচাই (S-07)
      </Button>
      <Button block variant="ghost" onClick={() => navigate('/m/qard/loans')}>আমার সহায়তা</Button>
    </div>
  );
}
