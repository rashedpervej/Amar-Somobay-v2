/* ============================================================
   src/apps/admin/AdminWebApp.tsx — অ্যাডমিন ওয়েব (ডেস্কটপ)
   আলাদা অভিজ্ঞতা: সাইডবার + টপবার + টেবিল-কেন্দ্রিক কনটেন্ট।
   এখনকার পর্দা: A-01 ড্যাশবোর্ড; বাকি ৪৮ আইটেম "ফেজ ৪" কার্ড।
   ডেটা ডেমো (src/demo/data.ts)।
   ============================================================ */

import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Banknote, CheckCheck } from 'lucide-react';
import { AdminWebShell } from '../../components/shell/AdminWebShell';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid, SectionHead } from '../../components/ui';
import { SoonCard } from '../../components/SoonCard';
import { bn } from '../../lib/bn';
import { ADMIN_WEB_NAV } from '../../nav/adminWeb';
import { adminKpis, approvals, recentCollections } from '../../demo/data';

function Dashboard() {
  return (
    <div className="space-y-4">
      <KpiGrid cols={4}>
        <Kpi label="সদস্য" value={bn(adminKpis.members)} unit="জন" note="ডেমো" />
        <Kpi label="আজকের আদায়" value={`৳${bn(adminKpis.todayCollection)}`} note="ডেমো" />
        <Kpi label="অনুমোদন বাকি" value={bn(adminKpis.pendingApprovals)} unit="টি" />
        <Kpi label="হাতে নগর" value={`৳${bn(adminKpis.cashInHand)}`} note="ডেমো" />
      </KpiGrid>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionHead title="আজকের আদায়" sub="সর্বশেষ এন্ট্রি" right={<Badge tone="neutral">ডেমো</Badge>} />
          <DataTable
            caption="সংগ্রহক অনুযায়ী — কোনো সুদ/মুনাফার কলাম নেই"
            columns={[
              { key: 'member', head: 'সদস্য' },
              { key: 'amount', head: 'অঙ্ক', align: 'right', mono: true, render: (r) => `৳${bn(r.amount)}` },
              { key: 'mode', head: 'মাধ্যম' },
              { key: 'time', head: 'সময়' },
            ]}
            rows={recentCollections}
          />
        </div>

        <div>
          <SectionHead title="অনুমোদনের অপেক্ষায়" sub={`${bn(approvals.length)}টি`} />
          <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
            {approvals.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-2">
                <span className="w-8 h-8 grid place-items-center rounded-r-pill bg-warn-bg text-warn-ink">
                  <CheckCheck size={16} />
                </span>
                <div className="grow min-w-0">
                  <div className="text-sm font-bold text-txt truncate">{a.member}</div>
                  <div className="text-xs text-mut truncate">
                    {a.kind} · {a.submitted}
                  </div>
                </div>
                <span className="num text-sm font-bold text-txt">
                  {a.amount ? `৳${bn(a.amount)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card title="সিস্টেম অবস্থা" sub="ফেজ ২–৩ ভিত্তি">
        <ul className="text-sm text-txt-2 space-y-1.5">
          <li>✅ ডিজাইন টোকেন প্রোটোটাইপের সাথে ১০০% সমান (d03)</li>
          <li>✅ নেভিগেশন প্রোটোটাইপ-যাচাই করা (d05)</li>
          <li>✅ সুদ-সংক্রান্ত কোনো ফিল্ড বা কলাম নেই (d01)</li>
          <li>⏳ বাকি ৪৮টি ওয়েব পর্দা — ফেজ ৪</li>
        </ul>
      </Card>
    </div>
  );
}

function WebSoon() {
  const { key } = useParams();
  const item = ADMIN_WEB_NAV.flatMap((g) => g.items).find((i) => i.key === key);
  return <SoonCard label={item?.label ?? 'পর্দা'} phase="ফেজ ৪" note="এই পর্দাটি ডেস্কটপ-শুধু (Admin Web)।" />;
}

export default function AdminWebApp() {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const active = path.includes('/w/dashboard') ? 'dash' : path.split('/w/')[1]?.split('/')[0] ?? 'dash';

  return (
    <AdminWebShell
      title={active === 'dash' ? 'ড্যাশবোর্ড' : 'অ্যাডমিন ওয়েব'}
      breadcrumb="ওভারভিউ › ড্যাশবোর্ড"
      active={active}
      onNavigate={(slot) => navigate(slot.key === 'dash' ? '/w/dashboard' : `/w/${slot.key}`)}
      actions={
        <>
          <Button size="sm" variant="secondary" icon={<Banknote size={15} />}>
            ক্যাশ বুক
          </Button>
          <Button size="sm">নতুন জমা</Button>
        </>
      }
    >
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path=":key" element={<WebSoon />} />
        <Route path="*" element={<Navigate to="/w/dashboard" replace />} />
      </Routes>
    </AdminWebShell>
  );
}
