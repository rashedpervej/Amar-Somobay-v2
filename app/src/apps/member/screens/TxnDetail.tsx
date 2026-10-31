/* ============================================================
   src/apps/member/screens/TxnDetail.tsx — M-09 লেনদেন বিবরণ ও ডিজিটাল রসিদ (স্বতন্ত্র পর্দা)
   জমা হলে জমার রসিদ, উত্তোলন হলে উত্তোলন-ভাউচার। প্রিন্ট/কপি/ডাউনলোড কাজ করে।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Printer, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Row } from '../../../components/ui';
import { StatusChip } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function TxnDetail() {
  const { txnId } = useParams();
  const navigate = useNavigate();
  const { depositById, withdrawalById, state } = useMember();
  const [copied, setCopied] = useState(false);

  const dep = depositById(txnId);
  const wd = withdrawalById(txnId);

  if (!dep && !wd) {
    return (
      <div className="p-4">
        <Card title="লেনদেন পাওয়া যায়নি" sub="লিংকটি পুরনো হতে পারে">
          <Button onClick={() => navigate('/m/txn')}>লেনদেন তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const rows: [string, string][] = dep
    ? [
        ['ধরন', 'জমা (ক্রেডিট)'],
        ['রসিদ নম্বর', dep.receipt],
        ['তারিখ', dep.date],
        ['সদস্য', state.profile.name],
        ['অ্যাকাউন্ট', state.accounts.find((a) => a.id === dep.accountId)?.number ?? '—'],
        ['মাধ্যম', dep.mode],
        ['অঙ্ক', `৳${bn(dep.amount)}`],
        ['স্ট্যাটাস', 'অনুমোদিত'],
        ...(dep.note ? ([['নোট', dep.note]] as [string, string][]) : []),
      ]
    : [
        ['ধরন', 'উত্তোলন (ডেবিট)'],
        ['রেফারেন্স', wd!.reference],
        ['তারিখ', wd!.date],
        ['কারণ', wd!.reason],
        ['মাধ্যম', wd!.mode],
        ['অ্যাকাউন্ট', `${wd!.accountName} · ${wd!.accountNo}`],
        ['অঙ্ক', `৳${bn(wd!.amount)}`],
        ['স্ট্যাটাস', wd!.status === 'pending' ? 'অপেক্ষমাণ' : wd!.status === 'paid' ? 'পরিশোধিত' : 'প্রত্যাখ্যাত'],
      ];

  function copy() {
    navigator.clipboard?.writeText(rows.map(([k, v]) => `${k}: ${v}`).join('\n')).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function download() {
    const title = dep ? 'জমার রসিদ' : 'উত্তোলন ভাউচার';
    const text = [`সমবায় — ${title}`, '———————————', ...rows.map(([k, v]) => `${k}: ${v}`), '', 'কোনো সুদ বা মুনাফা নেই (নীতি D-01)'].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dep ? dep.receipt : wd!.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <Card
        title={dep ? 'জমার ডিজিটাল রসিদ' : 'উত্তোলন ভাউচার'}
        sub={dep ? dep.receipt : wd!.reference}
        right={<Badge tone={dep ? 'ok' : wd!.status === 'rejected' ? 'danger' : wd!.status === 'pending' ? 'warn' : 'ok'}>
          {dep ? 'জমা' : 'উত্তোলন'}
        </Badge>}
      >
        <dl className="text-sm divide-y divide-line-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-mut shrink-0">{k}</dt>
              <dd className="font-bold text-txt text-right break-words num">{v}</dd>
            </div>
          ))}
        </dl>

        {wd ? (
          <div className="mt-3">
            <div className="text-xs font-bold text-mut mb-2">অবস্থা</div>
            <div className="space-y-1.5">
              {wd.timeline.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={`w-2.5 h-2.5 rounded-r-pill ${t.done ? 'bg-ok' : 'bg-line-3'}`} />
                  <span className={t.done ? 'text-txt font-bold' : 'text-mut'}>{t.label}</span>
                  <span className="text-xs text-mut ml-auto">{t.at}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-r-sm bg-green-050 border border-line-2 px-3 py-2 text-xs text-txt-2 flex items-start gap-2">
            <ShieldCheck size={14} className="mt-0.5 text-ok shrink-0" />
            <span>
              যাচাই সংকেত: <b>{dep!.receipt}</b> · ৳{bn(dep!.amount)} — এই নম্বর দিয়ে যে কেউ রসিদ যাচাই করতে পারেন।
            </span>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => window.print()} className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold">
          <Printer size={18} className="text-green-700" /> প্রিন্ট
        </button>
        <button type="button" onClick={copy} className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold">
          <Copy size={18} className="text-info" /> {copied ? 'কপি হয়েছে' : 'কপি'}
        </button>
        <button type="button" onClick={download} className="min-h-tap rounded-r-sm bg-card border border-line shadow-sh-1 flex flex-col items-center justify-center gap-1 text-xs font-bold">
          <Download size={18} className="text-warn" /> ডাউনলোড
        </button>
      </div>

      {wd && wd.status === 'pending' ? (
        <Row
          title="স্ট্যাটাস আপডেট"
          sub="অনুমোদনের পর SMS ও নোটিফিকেশন আসবে"
          right={<StatusChip status="pending" />}
        />
      ) : null}

      <Button block variant="secondary" onClick={() => navigate('/m/txn')}>
        সব লেনদেন
      </Button>
    </div>
  );
}
