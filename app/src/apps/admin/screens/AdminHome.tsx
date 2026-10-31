/* ============================================================
   src/apps/admin/screens/AdminHome.tsx — AM-01 অ্যাডমিন মোবাইল হোম
   আজ সংগৃহীত হিরো · সিদ্ধান্তের অপেক্ষায় ৪টি KPI · অ্যালার্ট · ৭ দিন · দ্রুত কাজ।
   সব সংখ্যা ডেমো (adminStore), কোনো সুদ/মুনাফা নেই।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, CheckCheck, ChevronRight, Clock, Plus, Search, Users, Wallet } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Hero, HeroChip, Note } from './parts';
import type { AdminShell } from '../../../nav/types';

const SEVEN_DAYS = [
  ['৩১ অক্টো', 2845000], ['৩০ অক্টো', 2612000], ['২৯ অক্টো', 2378000], ['২৮ অক্টো', 2456000],
  ['২৭ অক্টো', 2180000], ['২৬ অক্টো', 2520000], ['২৫ অক্টো', 1990000],
] as const;
const TARGET = 4200000;

export default function AdminHome({ shell }: { shell: AdminShell }) {
  const navigate = useNavigate();
  const { state } = useAdmin();
  const today = state.cashDays[0];
  const collected = today.declared;
  const pct = Math.round((collected / TARGET) * 100);
  const pending = state.approvals;
  const counts = {
    withdrawal: pending.filter((a) => a.kind === 'withdrawal').length,
    deposit: pending.filter((a) => a.kind === 'deposit').length,
    member: pending.filter((a) => a.kind === 'member').length,
    correction: pending.filter((a) => a.kind === 'correction').length,
  };
  const duesTotal = state.dues.reduce((s, d) => s + (d.amount - d.paid), 0);
  const roleQS = shell.role !== 'MANAGER' ? `?role=${shell.role}` : '';

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-2">
        <div className="grow">
          <p className="text-sm text-mut">{shell.roleBn}</p>
          <h2 className="text-h2 text-txt leading-tight">সমিতির অবস্থা</h2>
          <p className="text-xs text-mut mt-0.5">শাপলা সমবায় সমিতি · ৩১ অক্টোবর ২০২৬</p>
        </div>
        <Badge tone="brand">{shell.code}</Badge>
        {shell.readOnly ? <Badge tone="info">পঠন</Badge> : null}
      </div>

      {!today.closed ? (
        <button type="button" onClick={() => navigate(`/a/cashbook${roleQS}`)} className="w-full min-h-tap text-left rounded-r-sm bg-danger-bg border border-danger-bd text-danger-ink px-3 py-2.5 text-sm font-bold flex items-start gap-2">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>দিনশেষ হয়নি<span className="block font-normal text-xs">আজকের ক্যাশ গণনা ও বন্ধ করুন →</span></span>
        </button>
      ) : null}

      <Hero
        label="আজ সংগৃহীত"
        amount={`৳${bn(collected)}`}
        sub={`লক্ষ্য ৳${bn(TARGET)} · ${bn(pct)}% অর্জিত`}
        chips={<>
          <HeroChip>নগদ ৳{bn(today.channels.cash)}</HeroChip>
          <HeroChip>বিকাশ ৳{bn(today.channels.bkash)}</HeroChip>
          <HeroChip>ওয়ালেট ৳{bn(today.channels.nagad)}</HeroChip>
        </>}
      >
        <div className="h-1.5 rounded-r-pill bg-white/25 mt-3 overflow-hidden">
          <div className="h-full bg-lime" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </Hero>

      <SectionHead title="আপনার সিদ্ধান্তের অপেক্ষায়" sub={`${bn(pending.length)}টি`} />
      <KpiGrid>
        <button type="button" onClick={() => navigate(`/a/approvals${roleQS}`)} className="text-left min-h-tap">
          <Kpi label="জমা অনুমোদন" value={bn(counts.deposit)} unit="টি" tone="warn" note="যাচাই ও পোস্ট" />
        </button>
        <button type="button" onClick={() => navigate(`/a/approvals${roleQS}`)} className="text-left min-h-tap">
          <Kpi label="উত্তোলন অনুমোদন" value={bn(counts.withdrawal)} unit="টি" tone="danger" note="সীমা যাচাই" />
        </button>
        <button type="button" onClick={() => navigate(`/a/members/new${roleQS}`)} className="text-left min-h-tap">
          <Kpi label="সদস্য আবেদন" value={bn(counts.member)} unit="টি" tone="info" note="নতুন নিবন্ধন" />
        </button>
        <button type="button" onClick={() => navigate(`/a/approvals${roleQS}`)} className="text-left min-h-tap">
          <Kpi label="সংশোধন প্রস্তাব" value={bn(counts.correction)} unit="টি" tone="purple" note="রিভার্সাল" />
        </button>
      </KpiGrid>

      <SectionHead title="অ্যালার্ট" sub={`${bn(3)}টি`} />
      <div className="space-y-2">
        <Note tone="danger">
          <b>২টি উত্তোলন আবেদন ২৪ ঘণ্টা+ অপেক্ষায়</b>
          <span className="block text-xs mt-0.5">SLA অতিক্রম — সদস্যকে SMS গেছে (D-27)। এখনই সিদ্ধান্ত দিন।</span>
        </Note>
        <Note tone="warn">
          <b>৯০ দিন+ বকেয়া ১ জন সদস্য</b>
          <span className="block text-xs mt-0.5">অ্যাকাউন্ট নিষ্ক্রিয় হওয়ার ঝুঁকিতে (D-07)। মোট বকেয়া ৳{bn(duesTotal)}।</span>
        </Note>
        <Note tone="info">
          <b>দিনশেষ ক্যাশ বাকি</b>
          <span className="block text-xs mt-0.5">ঘোষিত ৳{bn(today.declared)} · গণনা করা হয়নি।</span>
        </Note>
      </div>

      <SectionHead title="গত ৭ দিনের সংগ্রহ" sub="ট্যাপ করলে দিনশেষ ক্যাশ বুক" />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {SEVEN_DAYS.map(([d, v]) => {
          const p = Math.round((v / TARGET) * 100);
          return (
            <Row
              key={d}
              icon={<Banknote size={17} />}
              title={d}
              sub={`লক্ষ্য ৳${bn(TARGET)} · ${bn(p)}% অর্জন`}
              right={<span className="num font-bold text-txt">৳{bn(v)}</span>}
              onClick={() => navigate(`/a/cashbook${roleQS}`)}
            />
          );
        })}
      </div>

      <SectionHead title="দ্রুত কাজ" sub="সব ভূমিকার জন্য একই API" />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        <Row icon={<Plus size={17} />} title="দ্রুত জমা এন্ট্রি" sub="সংগ্রহক / হিসাবরক্ষক" right={<ChevronRight size={16} className="text-mut" />} onClick={() => navigate(`/a/entry${roleQS}`)} />
        <Row icon={<Search size={17} />} title="সদস্য খুঁজুন" sub="নাম, মোবাইল বা সদস্য নম্বর" right={<ChevronRight size={16} className="text-mut" />} onClick={() => navigate(`/a/members${roleQS}`)} />
        <Row icon={<Banknote size={17} />} title="দিনশেষ জমা" sub="ক্যাশ গণনা ও বন্ধ" right={<ChevronRight size={16} className="text-mut" />} onClick={() => navigate(`/a/cashbook${roleQS}`)} />
        <Row icon={<AlertTriangle size={17} />} title="বকেয়া রেজিস্টার" sub={`মোট ৳${bn(duesTotal)}`} right={<Badge tone="warn">{bn(state.dues.length)}</Badge>} onClick={() => navigate(`/a/dues${roleQS}`)} />
        <Row icon={<Users size={17} />} title="সদস্য ৩৬০°" sub="একজন সদস্যের সব হিসাব" onClick={() => navigate(`/a/members/m1${roleQS}`)} />
        <Row icon={<Wallet size={17} />} title="তহবিল স্থানান্তর" sub="সমিতির হিসাবের মধ্যে" onClick={() => navigate(`/a/transfer${roleQS}`)} />
        <Row icon={<CheckCheck size={17} />} title="পেমেন্ট ও ভাউচার" sub="অনুমোদিত উত্তোলন" onClick={() => navigate(`/a/payouts${roleQS}`)} />
        <Row icon={<Clock size={17} />} title="অফলাইন sync" sub={`${bn(2)}টি এন্ট্রি কিউতে`} onClick={() => navigate('/sync')} />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="grow" onClick={() => navigate(`/a/ledger${roleQS}`)}>সাধারণ লেজার</Button>
        <Button className="grow" onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য খুঁজুন</Button>
      </div>

      <p className="text-xs text-mut text-center">
        ডেমো ডেটা — কোনো বাস্তব সদস্য বা অর্থ নয়। কোনো সুদ বা মুনাফার হিসাব নেই (D-01)।
      </p>
    </div>
  );
}
