/* ============================================================
   src/apps/admin/screens/AdminHome.tsx — AM-01 অ্যাডমিন মোবাইল হোম
   মোবাইল-প্রথম, ভূমিকা-সচেতন (সংগ্রহক / হিসাবরক্ষক / ম্যানেজার …)।
   ডেটা ডেমো (src/demo/data.ts) — কোনো বাস্তব হিসাব নয়।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, CheckCheck, Plus, Users } from 'lucide-react';
import { Badge, Card, Kpi, KpiGrid, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { adminKpis, approvals, recentCollections } from '../../../demo/data';
import type { AdminShell } from '../../../nav/types';

export default function AdminHome({ shell }: { shell: AdminShell }) {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-2">
        <div className="grow">
          <p className="text-sm text-mut">{shell.roleBn}</p>
          <h2 className="text-h2 text-txt leading-tight">আজকের সারসংক্ষেপ</h2>
        </div>
        <Badge tone="brand">{shell.code}</Badge>
        {shell.readOnly ? <Badge tone="info">পঠন</Badge> : null}
      </div>

      <KpiGrid>
        <Kpi label="সদস্য" value={bn(adminKpis.members)} unit="জন" />
        <Kpi label="আজকের আদায়" value={`৳${bn(adminKpis.todayCollection)}`} note="ডেমো" />
        <Kpi label="অনুমোদন বাকি" value={bn(adminKpis.pendingApprovals)} unit="টি" note="কিউতে" />
        <Kpi label="হাতে নগদ" value={`৳${bn(adminKpis.cashInHand)}`} note="ডেমো" />
      </KpiGrid>

      <Card
        title="দ্রুত কাজ"
        sub="কেবল নিচের কাজগুলো এখন সক্রিয়"
        right={<Badge tone="neutral">ডেমো</Badge>}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate('/a/approvals')}
            className="min-h-tap rounded-r-sm bg-green-050 border border-line-2 text-green-800 font-bold text-sm flex items-center justify-center gap-1.5"
          >
            <CheckCheck size={17} /> অনুমোদন ({bn(approvals.length)})
          </button>
          <button
            type="button"
            onClick={() => navigate('/a/soon/entry')}
            className="min-h-tap rounded-r-sm bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-1.5"
          >
            <Plus size={17} /> জমা এন্ট্রি
          </button>
        </div>
      </Card>

      <SectionHead title="আজকের আদায়" sub="শেষ কয়েকটি" />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {recentCollections.map((c) => (
          <Row
            key={c.id}
            icon={<Banknote size={17} />}
            title={c.member}
            sub={`${c.time} · ${c.mode} · ${c.collector}`}
            right={<span className="num font-bold text-ok">৳{bn(c.amount)}</span>}
          />
        ))}
      </div>

      <SectionHead title="নজরদারি" />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        <Row
          icon={<AlertTriangle size={17} />}
          title="বকেয়া সদস্য"
          sub="কিস্তি মিস করা সদস্যদের তালিকা"
          right={<Badge tone="warn">ডেমো</Badge>}
          onClick={() => navigate('/a/soon/dues')}
        />
        <Row
          icon={<Users size={17} />}
          title="সদস্য খোঁজা"
          sub="নাম বা মোবাইল দিয়ে"
          onClick={() => navigate('/a/soon/member')}
        />
        <Row
          icon={<CheckCheck size={17} />}
          title="অনুমোদন কিউ"
          sub={`${bn(approvals.length)}টি অপেক্ষমাণ`}
          right={<Badge tone="danger">{bn(approvals.length)}</Badge>}
          onClick={() => navigate('/a/approvals')}
        />
      </div>

      <p className="text-xs text-mut text-center">
        ডেমো ডেটা — কোনো বাস্তব সদস্য বা অর্থ নয়। কোনো সুদ বা মুনাফার হিসাব নেই।
      </p>
    </div>
  );
}
