/* ============================================================
   src/apps/admin/AdminWebApp.tsx — অ্যাডমিন ওয়েব (ডেস্কটপ)
   আলাদা অভিজ্ঞতা: সাইডবার + টপবার + টেবিল-কেন্দ্রিক কনটেন্ট।
   ব্যাচ ৮: ROSCA RA-01…12 + Joint Goal JA-01…10 (২২ পর্দা, ডেস্কটপ-শুধু)
   বাকি আইটেম "পরবর্তী ব্যাচ" কার্ড।
   ডেটা ডেমো (adminRoscaStore / adminJointStore)।
   ============================================================ */

import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Banknote, CheckCheck, Plus } from 'lucide-react';
import { AdminWebShell } from '../../components/shell/AdminWebShell';
import { Badge, Button, Card, DataTable, Kpi, KpiGrid, SectionHead } from '../../components/ui';
import { SoonCard } from '../../components/SoonCard';
import { bn } from '../../lib/bn';
import { ADMIN_WEB_NAV } from '../../nav/adminWeb';
import { adminKpis, approvals, recentCollections } from '../../demo/data';
import RcDashboard from './web/RcDashboard';
import RcSchemes from './web/RcSchemes';
import RcSchemeEdit from './web/RcSchemeEdit';
import RcCircles from './web/RcCircles';
import RcCircleDetail from './web/RcCircleDetail';
import RcSeats from './web/RcSeats';
import RcDraws from './web/RcDraws';
import RcDrawRun from './web/RcDrawRun';
import RcDrawHistory from './web/RcDrawHistory';
import RcCollect from './web/RcCollect';
import RcDefaults from './web/RcDefaults';
import RcReports from './web/RcReports';
import JgDashboard from './web/JgDashboard';
import JgGoals from './web/JgGoals';
import JgGoalNew from './web/JgGoalNew';
import JgGoalDetail from './web/JgGoalDetail';
import JgJoin from './web/JgJoin';
import JgCollect from './web/JgCollect';
import JgMilestones from './web/JgMilestones';
import JgSpend from './web/JgSpend';
import JgClose from './web/JgClose';
import JgReports from './web/JgReports';

function Dashboard() {
  const nav = useNavigate();
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

      <Card title="মডিউল হাব" sub="ব্যাচ ৮ — ROSCA ও Joint Goal ডেস্কটপ পর্দা সম্পূর্ণ">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { t: 'ROSCA ড্যাশবোর্ড', d: '১২টি পর্দা · পুল · ড্র · ডিফল্ট', to: '/w/rc' },
            { t: 'ROSCA সংগ্রহ', d: 'কিস্তি, বকেয়া ও রসিদ', to: '/w/rc/collect' },
            { t: 'Joint Goal', d: '১০টি পর্দা · লক্ষ্য · অবদান · বিতরণ', to: '/w/jg' },
            { t: 'লক্ষ্য নতুন', d: 'নিয়ম ও সংস্করণ', to: '/w/jg/goals/new' },
          ].map((x) => (
            <button key={x.to} type="button" onClick={() => nav(x.to)}
              className="min-h-10 text-left rounded-r-sm border border-line bg-card p-3 hover:border-green-600 transition">
              <b className="text-sm text-green-800">{x.t}</b>
              <span className="block text-xs text-mut mt-1">{x.d}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function WebSoon() {
  const { key } = useParams();
  const item = ADMIN_WEB_NAV.flatMap((g) => g.items).find((i) => i.key === key);
  return <SoonCard label={item?.label ?? 'পর্দা'} phase="ব্যাচ ৯–১২" note="এই পর্দাটি ডেস্কটপ-শুধু (Admin Web)।" />;
}

const ROUTE_MAP: Record<string, string> = {
  rcdash: '/w/rc', rcscheme: '/w/rc/schemes', rccircle: '/w/rc/circles', rcdraw: '/w/rc/draws',
  rccollect: '/w/rc/collect', rcdefault: '/w/rc/defaults', rcreport: '/w/rc/reports',
  jgdash: '/w/jg', jggoal: '/w/jg/goals', jgjoin: '/w/jg/join', jgcollect: '/w/jg/collect',
  jgmile: '/w/jg/milestones', jgspend: '/w/jg/spend', jgreport: '/w/jg/reports',
};

const TITLES: [RegExp, string, string][] = [
  [/^\/w\/rc\/schemes\/new/, 'ROSCA স্কিম তৈরি', 'ROSCA › স্কিম › নতুন'],
  [/^\/w\/rc\/schemes\/[^/]+/, 'ROSCA স্কিম সম্পাদনা', 'ROSCA › স্কিম › সম্পাদনা'],
  [/^\/w\/rc\/schemes/, 'ROSCA স্কিম', 'ROSCA › স্কিম'],
  [/^\/w\/rc\/circles\/[^/]+\/seats/, 'সিট বরাদ্দ', 'ROSCA › সার্কেল › সিট'],
  [/^\/w\/rc\/circles\/[^/]+/, 'সার্কেল বিস্তারিত', 'ROSCA › সার্কেল › বিস্তারিত'],
  [/^\/w\/rc\/circles/, 'সক্রিয় সার্কেল', 'ROSCA › সার্কেল'],
  [/^\/w\/rc\/draws\/history/, 'ড্র ইতিহাস', 'ROSCA › ড্র › রেজিস্টার'],
  [/^\/w\/rc\/draws\/[^/]+\/run/, 'ড্র সম্পাদন', 'ROSCA › ড্র › সম্পাদন'],
  [/^\/w\/rc\/draws/, 'ড্র ক্যালেন্ডার', 'ROSCA › ড্র'],
  [/^\/w\/rc\/collect/, 'কিস্তি সংগ্রহ', 'ROSCA › সংগ্রহ'],
  [/^\/w\/rc\/defaults/, 'ডিফল্ট ও প্রতিস্থাপন', 'ROSCA › ডিফল্ট'],
  [/^\/w\/rc\/reports/, 'ROSCA রিপোর্ট', 'ROSCA › রিপোর্ট'],
  [/^\/w\/rc$/, 'ROSCA ড্যাশবোর্ড', 'ROSCA › ড্যাশবোর্ড'],
  [/^\/w\/jg\/goals\/new/, 'নতুন যৌথ লক্ষ্য', 'Joint Goal › লক্ষ্য › নতুন'],
  [/^\/w\/jg\/goals\/[^/]+/, 'লক্ষ্য বিস্তারিত', 'Joint Goal › লক্ষ্য › বিস্তারিত'],
  [/^\/w\/jg\/goals/, 'লক্ষ্য তালিকা', 'Joint Goal › লক্ষ্য'],
  [/^\/w\/jg\/join/, 'অংশগ্রহণ ও যোগদান', 'Joint Goal › যোগদান'],
  [/^\/w\/jg\/collect/, 'অবদান সংগ্রহ', 'Joint Goal › সংগ্রহ'],
  [/^\/w\/jg\/milestones/, 'মাইলস্টোন', 'Joint Goal › অগ্রগতি'],
  [/^\/w\/jg\/spend/, 'অর্থ ব্যবহার', 'Joint Goal › বিতরণ'],
  [/^\/w\/jg\/close/, 'মেয়াদ ও নিষ্পত্তি', 'Joint Goal › নিষ্পত্তি'],
  [/^\/w\/jg\/reports/, 'Joint Goal রিপোর্ট', 'Joint Goal › রিপোর্ট'],
  [/^\/w\/jg$/, 'Joint Goal ড্যাশবোর্ড', 'Joint Goal › ড্যাশবোর্ড'],
];

function activeKey(path: string): string {
  if (path === '/w/rc' || path === '/w/rc/') return 'rcdash';
  if (path.startsWith('/w/rc/schemes')) return 'rcscheme';
  if (path.startsWith('/w/rc/circles')) return 'rccircle';
  if (path.startsWith('/w/rc/draws')) return 'rcdraw';
  if (path.startsWith('/w/rc/collect')) return 'rccollect';
  if (path.startsWith('/w/rc/defaults')) return 'rcdefault';
  if (path.startsWith('/w/rc/reports')) return 'rcreport';
  if (path === '/w/jg' || path === '/w/jg/') return 'jgdash';
  if (path.startsWith('/w/jg/goals')) return 'jggoal';
  if (path.startsWith('/w/jg/join')) return 'jgjoin';
  if (path.startsWith('/w/jg/collect')) return 'jgcollect';
  if (path.startsWith('/w/jg/milestones')) return 'jgmile';
  if (path.startsWith('/w/jg/spend') || path.startsWith('/w/jg/close')) return 'jgspend';
  if (path.startsWith('/w/jg/reports')) return 'jgreport';
  return path.includes('/w/dashboard') ? 'dash' : path.split('/w/')[1]?.split('/')[0] ?? 'dash';
}

export default function AdminWebApp() {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const active = activeKey(path);
  const meta = TITLES.find(([re]) => re.test(path));
  const title = meta?.[1] ?? (active === 'dash' ? 'ড্যাশবোর্ড' : 'অ্যাডমিন ওয়েব');
  const crumb = meta?.[2] ?? 'ওভারভিউ › ড্যাশবোর্ড';

  return (
    <AdminWebShell
      title={title}
      breadcrumb={crumb}
      active={active}
      onNavigate={(slot) => navigate(ROUTE_MAP[slot.key] ?? (slot.key === 'dash' ? '/w/dashboard' : `/w/${slot.key}`))}
      actions={
        <>
          {path.startsWith('/w/rc') ? (
            <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => navigate('/w/rc/schemes/new')}>নতুন স্কিম</Button>
          ) : path.startsWith('/w/jg') ? (
            <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => navigate('/w/jg/goals/new')}>নতুন লক্ষ্য</Button>
          ) : (
            <Button size="sm" variant="secondary" icon={<Banknote size={15} />}>ক্যাশ বুক</Button>
          )}
          <Button size="sm" onClick={() => navigate('/w/rc/collect')}>নতুন জমা</Button>
        </>
      }
    >
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="rc" element={<RcDashboard />} />
        <Route path="rc/schemes" element={<RcSchemes />} />
        <Route path="rc/schemes/new" element={<RcSchemeEdit />} />
        <Route path="rc/schemes/:schemeId" element={<RcSchemeEdit />} />
        <Route path="rc/circles" element={<RcCircles />} />
        <Route path="rc/circles/:circleId" element={<RcCircleDetail />} />
        <Route path="rc/circles/:circleId/seats" element={<RcSeats />} />
        <Route path="rc/draws" element={<RcDraws />} />
        <Route path="rc/draws/history" element={<RcDrawHistory />} />
        <Route path="rc/draws/:drawId/run" element={<RcDrawRun />} />
        <Route path="rc/collect" element={<RcCollect />} />
        <Route path="rc/defaults" element={<RcDefaults />} />
        <Route path="rc/reports" element={<RcReports />} />

        <Route path="jg" element={<JgDashboard />} />
        <Route path="jg/goals" element={<JgGoals />} />
        <Route path="jg/goals/new" element={<JgGoalNew />} />
        <Route path="jg/goals/:goalId" element={<JgGoalDetail />} />
        <Route path="jg/join" element={<JgJoin />} />
        <Route path="jg/collect" element={<JgCollect />} />
        <Route path="jg/milestones" element={<JgMilestones />} />
        <Route path="jg/spend" element={<JgSpend />} />
        <Route path="jg/close" element={<JgClose />} />
        <Route path="jg/reports" element={<JgReports />} />

        <Route path=":key" element={<WebSoon />} />
        <Route path="*" element={<Navigate to="/w/dashboard" replace />} />
      </Routes>
    </AdminWebShell>
  );
}
