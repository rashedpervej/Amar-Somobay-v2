/* ============================================================
   src/apps/admin/screens/TxnForensics.tsx — AM-13 লেনদেন বিবরণ (ফরেনসিক)
   Who/when/where: স্ট্যাম্প, ডিভাইস, IP, GPS, অডিট ট্রেইল ও রসিদ লিংক।
   পঠন-ভিত্তিক পর্দা — কোনো এডিট নেই, সংশোধন গেলে AM-14।
   ============================================================ */

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Clock, Download, Eye, MapPin, RefreshCw, ShieldCheck, Smartphone, Wifi } from 'lucide-react';
import { Badge, Button, Card, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountById, memberById } from '../../../domain/admin';
import { Hero, HeroChip, KV, Note } from './parts';

export default function TxnForensics() {
  const { txnId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAdmin();
  const t = state.txns.find((x) => x.id === txnId) ?? state.txns[0];
  const m = memberById(state.members, t.memberId);
  const acc = accountById(state.accounts, t.accId);
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const isIn = t.type === 'deposit' || (t.type === 'adjust' && t.amount > 0);

  return (
    <div className="p-4 space-y-4 pb-6">
      <button type="button" onClick={() => navigate(`/a/accounts/${acc?.id ?? 'a1'}${roleQS}`)} className="min-h-tap inline-flex items-center gap-1.5 text-sm font-bold text-green-700">← {acc?.no}</button>

      <Hero label={isIn ? 'জমা' : 'উত্তোলন / সংশোধন'} amount={`${isIn ? '+' : '−'}৳${bn(Math.abs(t.amount))}`} sub={`${t.no} · ${t.date}`}
        chips={<>
          <HeroChip>{t.status === 'posted' ? 'পোস্টেড' : t.status === 'reversed' ? 'রিভার্স হয়েছে' : 'ঝুলন্ত'}</HeroChip>
          <HeroChip>{t.channel === 'cash' ? 'নগদ' : t.channel === 'bkash' ? 'বিকাশ' : t.channel === 'nagad' ? 'নগদ (ওয়ালেট)' : 'ব্যাংক'}</HeroChip>
        </>} />

      <Card title="সদস্য ও অ্যাকাউন্ট" sub={`${m?.name} · ${m?.no}`}>
        <KV k="অ্যাকাউন্ট" v={`${acc?.scheme} · ${acc?.no}`} />
        <KV k="এন্ট্রি করেছেন" v={t.postedBy} />
        <KV k="রসিদ / রেফারেন্স" v={<span className="num">{t.reference}</span>} />
        <KV k="লেনদেনের পর ব্যালেন্স" v={<span className="num">৳{bn(t.balanceAfter)}</span>} />
      </Card>

      <SectionHead title="Who · When · Where" sub="ফরেনসিক ফিল্ড — বদলানো যায় না" />
      <Card>
        <Row icon={<Clock size={16} />} title="সময়" sub={`${t.date} · ${t.audit[0]?.at ?? ''}`} />
        <Row icon={<Smartphone size={16} />} title="ডিভাইস" sub={t.device} />
        <Row icon={<Wifi size={16} />} title="IP ঠিকানা" sub={t.ip} />
        <Row icon={<MapPin size={16} />} title="GPS" sub={t.gps} />
      </Card>

      <SectionHead title="অডিট ট্রেইল" sub={`${bn(t.audit.length)}টি ধাপ`} />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {t.audit.map((a, i) => (
          <div key={i} className="px-4 py-3 border-b border-line-2 last:border-b-0 flex gap-3">
            <span className="w-8 h-8 shrink-0 grid place-items-center rounded-r-pill bg-green-050 text-green-800">
              {isIn ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
            </span>
            <div className="grow">
              <div className="text-sm font-bold text-txt">{a.what}</div>
              <div className="text-xs text-mut">{a.by} · {a.at}</div>
            </div>
            {i === t.audit.length - 1 ? <Badge tone="ok">সর্বশেষ</Badge> : null}
          </div>
        ))}
      </div>

      <Note tone="info">
        <b>শুধু পঠন (Shell-E)</b> — নিরীক্ষক এই পর্দা থেকে কিছু বদলাতে পারেন না; সংশোধন হলে নতুন এন্ট্রি ও কারণ লাগবে।
      </Note>

      <div className="flex gap-2">
        <Button variant="secondary" className="grow" icon={<Download size={15} />} onClick={() => navigate(`/a/ledger${roleQS}`)}>লেজার</Button>
        <Button variant="secondary" className="grow" icon={<RefreshCw size={15} />} onClick={() => navigate(`/a/reversal${roleQS}`)}>রিভার্সাল</Button>
        <Button variant="ghost" icon={<Eye size={15} />} onClick={() => navigate('/verify')}>রসিদ</Button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><ShieldCheck size={13} /> অডিট লগ অপরিবর্তনীয় · ব্যাংক/ওয়ালেট অনিশ্চিত হলে Unknown</div>
    </div>
  );
}
