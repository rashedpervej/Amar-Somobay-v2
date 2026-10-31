/* ============================================================
   src/apps/member/screens/CircleReceipt.tsx — RM-06 পেআউট রসিদ (ভাউচার)
   ড্র পেআউটের ভাউচার: অঙ্ক, প্রাপক, সাক্ষী, হ্যাশ ও maker≠checker।
   প্রিন্ট/কপি/ডাউনলোড/যাচাই — সব কাজ করে।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Printer, ShieldCheck, Gift } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { channelLabel } from '../../../domain/rosca';

export default function CircleReceipt() {
  const { circleId, drawId } = useParams();
  const navigate = useNavigate();
  const { circleById, drawById } = useModules();
  const c = circleById(circleId);
  const d = c ? drawById(c.id, drawId) : undefined;
  const [copied, setCopied] = useState(false);

  if (!c || !d) {
    return (
      <div className="p-4">
        <Card title="ভাউচার পাওয়া যায়নি" sub="লিংকটি পুরনো হতে পারে">
          <Button onClick={() => navigate('/m/circles')}>চক্র তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const seat = c.seatList.find((s) => s.no === d.winnerSeat);
  const rows: [string, string][] = [
    ['চক্র', `${c.code} · ${c.name}`],
    ['ড্র নম্বর', `${bn(d.no)} / ${bn(c.seats)}`],
    ['প্রাপক', `${seat?.name ?? '—'} · সিট ${bn(seat?.no ?? 0)}`],
    ['ড্রয়ের তারিখ', d.executed ?? d.scheduled],
    ['পদ্ধতি', d.method === 'lottery' ? 'লটারি (সাক্ষীসহ)' : 'পূর্বনির্ধারিত ক্রম'],
    ['মাধ্যম', channelLabel(d.channel)],
    ['রসিদ নং', d.receipt],
    ['হ্যাশ', d.hash],
    ['সাক্ষী', c.witnesses.join(' · ')],
    ['হিসাব', 'ROSCA তহবিল → নগদ/ব্যাংক/বিকাশ'],
  ];

  function copy() {
    navigator.clipboard?.writeText(rows.map(([k, v]) => `${k}: ${v}`).join('\n')).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const text = ['সমবায় — ROSCA পেআউট ভাউচার', '———————————', ...rows.map(([k, v]) => `${k}: ${v}`), '', 'কোনো অতিরিক্ত চার্জ বা কর্তন নেই — শুধু পুলের অঙ্ক।'].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d!.receipt}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <div className="rounded-r-md bg-card border border-line shadow-sh-1 p-4 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-info-ink bg-info-bg border border-info-bd rounded-r-pill px-2.5 py-1">
          <Gift size={13} /> ড্র পেআউট ভাউচার
        </div>
        <div className="num text-display font-extrabold text-txt mt-2">৳{bn(d.amount)}</div>
        <div className="text-xs text-mut mt-1">
          {bn(d.amount)} টাকা মাত্র · {channelLabel(d.channel)}
        </div>
        <div className="mt-3 rounded-r-sm bg-card-2 border border-line-2 px-3 py-2 text-xs num font-bold text-txt">
          {d.receipt} · {d.hash}
        </div>
      </div>

      <Card title="বিস্তারিত" right={<Badge tone="ok">অনুমোদিত</Badge>}>
        <dl className="text-sm divide-y divide-line-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-mut shrink-0">{k}</dt>
              <dd className="num font-bold text-txt text-right break-words">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 py-2">
            <dt className="text-mut shrink-0">প্রস্তুত → অনুমোদন</dt>
            <dd className="font-bold text-txt text-right">কাউন্টার-২ → কাজী নুরুন্নবী</dd>
          </div>
        </dl>
      </Card>

      <div className="rounded-r-sm bg-ok-bg border border-ok-bd text-ok-ink px-3 py-2.5 text-xs flex gap-2">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <span>
          <b>কোনো অতিরিক্ত চার্জ বা কর্তন নেই</b> — পুল থেকে প্রাপ্ত ৳{bn(d.amount)} হুবহু দেওয়া হয়েছে। এই চক্রে আপনার মোট কিস্তি
          ৳{bn(seat?.contributed ?? 0)}; চক্র সম্পন্ন হলে প্রতিটি সদস্য যত জমা দিয়েছেন ঠিক ততই ফেরত পান (এক সিট = একবার পেআউট)।
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>প্রিন্ট</Button>
        <Button size="sm" variant="ghost" icon={<Copy size={14} />} onClick={copy}>{copied ? 'কপি হয়েছে' : 'কপি'}</Button>
        <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={download}>সেভ</Button>
      </div>

      <Button block variant="secondary" icon={<ShieldCheck size={15} />} onClick={() => navigate('/verify')}>
        রসিদ যাচাই করুন
      </Button>
      <Button block variant="ghost" onClick={() => navigate(`/m/circles/${c.id}/history`)}>
        ড্র ইতিহাস
      </Button>
    </div>
  );
}
