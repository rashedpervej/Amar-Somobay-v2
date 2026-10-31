/* ============================================================
   src/apps/admin/screens/AccountLedger.tsx — AM-10 অ্যাকাউন্ট বিবরণ ও লেজার
   ব্যালেন্স হিরো, ৪টি KPI, ৬টি লেনদেন (ট্যাপ → ফরেনসিক), স্কিমের নিয়ম।
   ============================================================ */

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Download, Eye, Pencil, Wallet } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountById, availOf, memberById } from '../../../domain/admin';
import { Hero, HeroChip, KV, Note } from './parts';

export default function AccountLedger() {
  const { accountId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAdmin();
  const acc = accountById(state.accounts, accountId ?? 'a1');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  if (!acc) return <div className="p-4"><Note tone="warn">অ্যাকাউন্ট পাওয়া যায়নি</Note></div>;
  const m = memberById(state.members, acc.memberId);
  const txns = state.txns.filter((t) => t.accId === acc.id);
  const avail = availOf(acc);

  return (
    <div className="p-4 space-y-4 pb-6">
      <button type="button" onClick={() => navigate(`/a/members/${acc.memberId}${roleQS}`)} className="min-h-tap inline-flex items-center gap-1.5 text-sm font-bold text-green-700">← {m?.name}</button>

      <Hero label="জমা হয়েছে (posted)" amount={`৳${bn(acc.posted)}`} sub={`${acc.no} · ${acc.scheme}`}
        chips={<>
          <HeroChip>তোলার যোগ্য ৳{bn(avail)}</HeroChip>
          <HeroChip>আটক ৳{bn(acc.hold)}</HeroChip>
          {acc.pending ? <HeroChip>যাচাই বাকি ৳{bn(acc.pending)}</HeroChip> : null}
        </>} />

      <div className="flex flex-wrap gap-1.5">
        <Badge tone={acc.status === 'frozen' ? 'danger' : 'ok'}>{acc.status === 'frozen' ? 'ফ্রিজ' : acc.status === 'closed' ? 'বন্ধ' : 'সক্রিয়'}</Badge>
        <Badge tone="info">কিস্তি {bn(acc.paid)}/{bn(acc.tenure ?? '—')}</Badge>
        <Badge tone="neutral">৳{bn(acc.installment)}/মাস</Badge>
      </div>

      <KpiGrid>
        <Kpi label="মোট জমা" value={`৳${bn(acc.totalIn)}`} />
        <Kpi label="মোট উত্তোলন" value={`৳${bn(acc.totalOut)}`} />
        <Kpi label="বাকি কিস্তি" value={bn(acc.missed)} unit="টি" tone={acc.missed ? 'warn' : 'ok'} note={`পরবর্তী ${acc.nextDue}`} />
        <Kpi label="খোলা হয়েছে" value={acc.opened} note={`${bn(acc.day)} দিন চলছে`} />
      </KpiGrid>

      <SectionHead title="লেজার" sub={`${bn(txns.length)}টি দেখানো হচ্ছে`} right={<Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => navigate(`/a/ledger${roleQS}`)}>স্টেটমেন্ট</Button>} />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {txns.length === 0 ? <div className="px-4 py-8 text-center text-sm text-mut">কোনো লেনদেন নেই</div> : null}
        {txns.map((t) => (
          <Row key={t.id} icon={<Wallet size={16} />}
            title={`${t.type === 'deposit' ? 'সঞ্চয় জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type === 'fee' ? 'ফি' : 'সংশোধন'} · ${t.date}`}
            sub={`${t.no} · ব্যালেন্স ৳${bn(t.balanceAfter)} · ${t.status === 'posted' ? 'পোস্টেড' : t.status}`}
            right={<span className={`num font-bold ${t.type === 'deposit' ? 'text-ok' : 'text-danger-ink'}`}>{t.type === 'deposit' ? '+' : '−'}৳{bn(t.amount)}</span>}
            onClick={() => navigate(`/a/txn/${t.id}${roleQS}`)} />
        ))}
      </div>

      <SectionHead title="স্কিমের নিয়ম (এই অ্যাকাউন্টে প্রযোজ্য)" sub="সংস্করণ পিনিং · D-32" />
      <Card>
        <KV k="কিস্তি" v={`৳${bn(acc.installment)} · নির্ধারিত`} />
        <KV k="মেয়াদ / লক-ইন" v={`${acc.tenure ? `${bn(acc.tenure)} মাস` : 'খোলা'} · লক ${bn(acc.lockIn)} মাস`} />
        <KV k="নোটিশ পিরিয়ড" v={`${bn(acc.noticeDays)} দিন · মাসে ${bn(acc.maxPerMonth)} বার (D-02)`} />
        <KV k="সর্বনিম্ন ব্যালেন্স" v={`৳${bn(acc.minBal)}`} />
        <KV k="সর্বোচ্চ উত্তোলন" v={`৳${bn(acc.maxAmount)}`} />
        <KV k="সুদ" v={<span className="text-ok-ink">নেই (D-01)</span>} />
        <Note tone="info">অ্যাকাউন্ট খোলার সময়ের নিয়ম সংস্করণ সংরক্ষিত — স্কিম বদলালেও এই অ্যাকাউন্টে পুরনো নিয়মই চলবে (D-32)।</Note>
      </Card>

      <Note tone="danger">
        <b>অ্যাকাউন্ট ফ্রিজ হলে</b> — নতুন জমা নেওয়া যাবে, উত্তোলন আটকাবে; কারণ ও কার ফ্রিজ করেছে তা দেখানো হবে।
      </Note>

      <div className="flex gap-2">
        <Button className="grow" onClick={() => navigate(`/a/entry?account=${acc.id}`)}>জমা নিন</Button>
        <Button variant="secondary" className="grow" icon={<Pencil size={15} />} onClick={() => navigate(`/a/reversal${roleQS}`)}>সংশোধন</Button>
        <Button variant="ghost" icon={<Eye size={15} />} onClick={() => navigate(`/a/txn/${txns[0]?.id ?? 't1'}${roleQS}`)}>ফরেনসিক</Button>
      </div>
    </div>
  );
}
