/* ============================================================
   src/apps/member/screens/ReceiptScreen.tsx — M-07 জমা নিশ্চিতকরণ ও রসিদ (স্বতন্ত্র পর্দা)
   সফল জমার পর স্টোর থেকে রসিদ পড়ে দেখানো হয়; প্রিন্ট/কপি/ডাউনলোড কাজ করে।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Download, Printer, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function ReceiptScreen() {
  const { depositId } = useParams();
  const navigate = useNavigate();
  const { depositById, state } = useMember();
  const dep = depositById(depositId);
  const [copied, setCopied] = useState(false);

  if (!dep) {
    return (
      <div className="p-4">
        <Card title="রসিদ পাওয়া যায়নি" sub="লিংকটি পুরনো হতে পারে">
          <Button onClick={() => navigate('/m/txn')}>লেনদেনে ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const account = state.accounts.find((a) => a.id === dep.accountId);

  const rows: [string, string][] = [
    ['রসিদ নম্বর', dep.receipt],
    ['তারিখ', dep.date],
    ['সদস্য', state.profile.name],
    ['অ্যাকাউন্ট', account?.number ?? '—'],
    ['স্কিম', account?.schemeName ?? '—'],
    ['মাধ্যম', dep.mode],
    ['অঙ্ক', `৳${bn(dep.amount)}`],
    ['স্ট্যাটাস', 'গৃহীত'],
    ...(dep.note ? ([['নোট', dep.note]] as [string, string][]) : []),
  ];

  function copy() {
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
    navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function download() {
    const text = ['সমবায় — জমার রসিদ', '———————————', ...rows.map(([k, v]) => `${k}: ${v}`), '', 'কোনো সুদ বা মুনাফা নেই (নীতি D-01)'].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dep!.receipt}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 space-y-4">
      <SuccessBanner title="জমা নিশ্চিত হয়েছে">
        ৳{bn(dep.amount)} জমা গৃহীত হয়েছে — রসিদ <b>{dep.receipt}</b>।
      </SuccessBanner>

      <Card title="জমার রসিদ" sub={dep.receipt} right={<Badge tone="ok">গৃহীত</Badge>}>
        <dl className="text-sm divide-y divide-line-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-mut shrink-0">{k}</dt>
              <dd className="font-bold text-txt text-right break-words num">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 rounded-r-sm bg-green-050 border border-line-2 px-3 py-2 text-xs text-txt-2 flex items-start gap-2">
          <ShieldCheck size={14} className="mt-0.5 text-ok shrink-0" />
          <span>
            যাচাইয়ের সংকেত: <b>{dep.receipt}</b> · অঙ্ক <b>৳{bn(dep.amount)}</b>। রসিদ কেন্দ্র (M-14) বা সহায়তা (M-21) থেকে
            যে কেউ এই নম্বর যাচাই করতে পারেন।
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold"
        >
          <Printer size={18} className="text-green-700" /> প্রিন্ট
        </button>
        <button
          type="button"
          onClick={copy}
          className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold"
        >
          <Copy size={18} className="text-info" /> {copied ? 'কপি হয়েছে' : 'কপি'}
        </button>
        <button
          type="button"
          onClick={download}
          className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold"
        >
          <Download size={18} className="text-warn" /> ডাউনলোড
        </button>
      </div>

      <Button block onClick={() => navigate('/m/home')} icon={<CheckCircle2 size={18} />}>
        হোমে ফিরুন
      </Button>
      <Button block variant="secondary" onClick={() => navigate('/m/txn')}>
        সব লেনদেন দেখুন
      </Button>
    </div>
  );
}
