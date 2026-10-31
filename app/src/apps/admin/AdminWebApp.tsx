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
import QhWebDashboard from './web/QhWebDashboard';
import QhWebProducts from './web/QhWebProducts';
import QhWebRules from './web/QhWebRules';
import QhWebSimulation from './web/QhWebSimulation';
import QhWebEligible from './web/QhWebEligible';
import QhWebWindow from './web/QhWebWindow';
import QhWebQueue from './web/QhWebQueue';
import QhWebAppDetail from './web/QhWebAppDetail';
import QhWebDecision from './web/QhWebDecision';
import QhWebDisburse from './web/QhWebDisburse';
import QhWebLoans from './web/QhWebLoans';
import QhWebLoanDetail from './web/QhWebLoanDetail';
import QhWebRepay from './web/QhWebRepay';
import QhWebArrears from './web/QhWebArrears';
import QhWebClose from './web/QhWebClose';
import QhWebWriteOff from './web/QhWebWriteOff';
import QhWebReports from './web/QhWebReports';
import GsDashboard from './web/GsDashboard';
import GsSchemes from './web/GsSchemes';
import GsSchemeNew from './web/GsSchemeNew';
import GsSchemeDetail from './web/GsSchemeDetail';
import GsMembers from './web/GsMembers';
import GsMemberNew from './web/GsMemberNew';
import GsMemberDetail from './web/GsMemberDetail';
import GsMemberExit from './web/GsMemberExit';
import GsAccount from './web/GsAccount';
import GsApplication from './web/GsApplication';
import GsDeposits from './web/GsDeposits';
import GsDepositNew from './web/GsDepositNew';
import GsApprovals from './web/GsApprovals';
import GsApprovalDetail from './web/GsApprovalDetail';
import GsPayouts from './web/GsPayouts';
import GsLedger from './web/GsLedger';
import GsDues from './web/GsDues';
import GsCollector from './web/GsCollector';
import GsStatus from './web/GsStatus';
import GsClaims from './web/GsClaims';
import GsMoves from './web/GsMoves';
import GsBulk from './web/GsBulk';
import GsImport from './web/GsImport';
import GsTxn from './web/GsTxn';
import GsReversal from './web/GsReversal';
import GsCashbook from './web/GsCashbook';
import GsTransfer from './web/GsTransfer';
import GsRecon from './web/GsRecon';
import GsRoutes from './web/GsRoutes';
import GsReminders from './web/GsReminders';
import GsReports from './web/GsReports';
import GsFinance from './web/GsFinance';
import GsSettings from './web/GsSettings';
import GsStaff from './web/GsStaff';
import GsAudit from './web/GsAudit';
import GsNotices from './web/GsNotices';
import GsMeetings from './web/GsMeetings';

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
  return <SoonCard label={item?.label ?? 'পর্দা'} phase="ব্যাচ ১০–১২" note="এই পর্দাটি ডেস্কটপ-শুধু (Admin Web)।" />;
}

const ROUTE_MAP: Record<string, string> = {
  scheme: '/w/schemes', member: '/w/members', deposit: '/w/deposits', depappr: '/w/approvals/deposits',
  wdappr: '/w/approvals/withdrawals', ledger: '/w/ledger', dues: '/w/dues', batch: '/w/bulk',
  route: '/w/collector', plan: '/w/routes', cash: '/w/cashbook', transfer: '/w/transfer', recon: '/w/recon',
  txn: '/w/txn', corr: '/w/reversal', status: '/w/status', claim: '/w/claims', mv: '/w/moves',
  remind: '/w/reminders', reports: '/w/reports', fin: '/w/finance', staff: '/w/staff', settings: '/w/settings',
  audit: '/w/audit',
  rcdash: '/w/rc', rcscheme: '/w/rc/schemes', rccircle: '/w/rc/circles', rcdraw: '/w/rc/draws',
  rccollect: '/w/rc/collect', rcdefault: '/w/rc/defaults', rcreport: '/w/rc/reports',
  jgdash: '/w/jg', jggoal: '/w/jg/goals', jgjoin: '/w/jg/join', jgcollect: '/w/jg/collect',
  jgmile: '/w/jg/milestones', jgspend: '/w/jg/spend', jgreport: '/w/jg/reports',
  qhdash: '/w/qh', qhproduct: '/w/qh/products', qhsim: '/w/qh/simulation', qhelig: '/w/qh/eligible',
  qhwindow: '/w/qh/window', qhqueue: '/w/qh/queue', qhdisb: '/w/qh/disburse', qhloan: '/w/qh/loans',
  qharrears: '/w/qh/arrears', qhreport: '/w/qh/reports',
};

const TITLES: [RegExp, string, string][] = [
  [/^\/w\/notices/, 'নোটিশ ও প্রমোশন', 'প্রশাসন › নোটিশ'],
  [/^\/w\/meetings/, 'সভা ও হাজিরা', 'প্রশাসন › সভা'],
  [/^\/w\/bulk\/import/, 'CSV ইমপোর্ট ও ম্যাপিং', 'সঞ্চয় › বাল্ক › ইমপোর্ট'],
  [/^\/w\/bulk/, 'বাল্ক জমা ও ইমপোর্ট', 'সঞ্চয় › বাল্ক'],
  [/^\/w\/txn\/[^/]+/, 'লেনদেন ও অডিট', 'সঞ্চয় › লেনদেন › বিস্তারিত'],
  [/^\/w\/txn/, 'লেনদেন ও অডিট', 'সঞ্চয় › লেনদেন'],
  [/^\/w\/reversal/, 'সংশোধন ও রিভার্সাল', 'সঞ্চয় › সংশোধন'],
  [/^\/w\/cashbook/, 'ক্যাশ বুক ও দিন সমাপ্তি', 'ক্যাশ › ক্যাশ বুক'],
  [/^\/w\/transfer/, 'তহবিল স্থানান্তর', 'ক্যাশ › স্থানান্তর'],
  [/^\/w\/recon/, 'রিকনসিলিয়েশন', 'ক্যাশ › রিকনসিলিয়েশন'],
  [/^\/w\/collector/, 'আজকের রুট (সংগ্রহক)', 'সংগ্রহ › আজকের রুট'],
  [/^\/w\/routes/, 'সংগ্রহ পরিকল্পনা ও রুট', 'সংগ্রহ › পরিকল্পনা'],
  [/^\/w\/reminders/, 'রিমাইন্ডার শিডিউল', 'যোগাযোগ › রিমাইন্ডার'],
  [/^\/w\/status/, 'সদস্য অবস্থা পরিবর্তন', 'সদস্য › অবস্থা'],
  [/^\/w\/claims\/[^/]+/, 'নমিনি ও মৃত্যু দাবি', 'সদস্য › দাবি › বিস্তারিত'],
  [/^\/w\/claims/, 'নমিনি ও মৃত্যু দাবি', 'সদস্য › দাবি'],
  [/^\/w\/moves/, 'সদস্য স্থানান্তর', 'সদস্য › স্থানান্তর'],
  [/^\/w\/reports/, 'রিপোর্ট কেন্দ্র', 'রিপোর্ট › কেন্দ্র'],
  [/^\/w\/finance/, 'আর্থিক বিবরণ ও রিটার্ন', 'রিপোর্ট › আর্থিক'],
  [/^\/w\/staff/, 'স্টাফ ও পারমিশন', 'প্রশাসন › স্টাফ'],
  [/^\/w\/settings/, 'সেটিংস', 'প্রশাসন › সেটিংস'],
  [/^\/w\/audit/, 'অডিট লগ', 'প্রশাসন › অডিট'],
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
  [/^\/w\/qh\/products/, 'QH পণ্য ও নিয়ম', 'কর্জে হাসানা › পণ্য'],
  [/^\/w\/qh\/rules/, 'QH নিয়ম ও ব্যতিক্রম', 'কর্জে হাসানা › নিয়ম'],
  [/^\/w\/qh\/simulation/, 'QH নিয়ম Simulation', 'কর্জে হাসানা › সিমুলেশন'],
  [/^\/w\/qh\/eligible/, 'যোগ্য সদস্য তালিকা', 'কর্জে হাসানা › যোগ্যতা'],
  [/^\/w\/qh\/window/, 'জানালা ও কোটা', 'কর্জে হাসানা › জানালা'],
  [/^\/w\/qh\/queue/, 'আবেদন কিউ', 'কর্জে হাসানা › কিউ'],
  [/^\/w\/qh\/applications\/[^/]+\/decision/, 'QH সিদ্ধান্ত', 'কর্জে হাসানা › আবেদন › সিদ্ধান্ত'],
  [/^\/w\/qh\/applications\/[^/]+/, 'QH আবেদন বিস্তারিত', 'কর্জে হাসানা › আবেদন'],
  [/^\/w\/qh\/disburse\/[^/]+/, 'QH বিতরণ', 'কর্জে হাসানা › বিতরণ › সম্পাদন'],
  [/^\/w\/qh\/disburse/, 'বিতরণ ব্যবস্থাপনা', 'কর্জে হাসানা › বিতরণ'],
  [/^\/w\/qh\/loans\/[^/]+\/repay/, 'QH পরিশোধ ও রসিদ', 'কর্জে হাসানা › ঋণ › পরিশোধ'],
  [/^\/w\/qh\/loans\/[^/]+\/close/, 'QH সমাপ্তি ও সনদ', 'কর্জে হাসানা › ঋণ › সমাপ্তি'],
  [/^\/w\/qh\/loans\/[^/]+/, 'QH ঋণ হাব', 'কর্জে হাসানা › ঋণ › বিস্তারিত'],
  [/^\/w\/qh\/loans/, 'ঋণ, ছক ও পরিশোধ', 'কর্জে হাসানা › ঋণ'],
  [/^\/w\/qh\/arrears/, 'বকেয়া ও write-off', 'কর্জে হাসানা › বকেয়া'],
  [/^\/w\/qh\/writeoff/, 'write-off ব্যবস্থাপনা', 'কর্জে হাসানা › write-off'],
  [/^\/w\/qh\/reports/, 'QH রিপোর্ট', 'কর্জে হাসানা › রিপোর্ট'],
  [/^\/w\/qh$/, 'কর্জে হাসানা ড্যাশবোর্ড', 'কর্জে হাসানা › ড্যাশবোর্ড'],
  [/^\/w\/schemes\/new/, 'নতুন স্কিম', 'সঞ্চয় › স্কিম › নতুন'],
  [/^\/w\/schemes\/[^/]+/, 'স্কিম বিস্তারিত', 'সঞ্চয় › স্কিম › বিস্তারিত'],
  [/^\/w\/schemes/, 'স্কিম তালিকা', 'সঞ্চয় › স্কিম'],
  [/^\/w\/members\/new/, 'নতুন সদস্য', 'সদস্য › নতুন'],
  [/^\/w\/members\/[^/]+\/exit/, 'প্রস্থান ও নিষ্পত্তি', 'সদস্য › নিষ্পত্তি'],
  [/^\/w\/members\/[^/]+\/status/, 'সদস্য অবস্থা', 'সদস্য › অবস্থা'],
  [/^\/w\/members\/[^/]+/, 'সদস্য ৩৬০°', 'সদস্য › বিস্তারিত'],
  [/^\/w\/members/, 'সদস্য তালিকা', 'সদস্য'],
  [/^\/w\/accounts\/[^/]+/, 'অ্যাকাউন্ট বিবরণ', 'হিসাব › খতিয়ান'],
  [/^\/w\/applications\/[^/]+/, 'সদস্য আবেদন', 'সদস্য › আবেদন'],
  [/^\/w\/approvals\/deposits/, 'জমা অনুমোদন', 'অনুমোদন › জমা'],
  [/^\/w\/approvals\/withdrawals/, 'উত্তোলন অনুমোদন', 'অনুমোদন › উত্তোলন'],
  [/^\/w\/approvals\/members/, 'সদস্য নিবন্ধন আবেদন', 'অনুমোদন › নিবন্ধন'],
  [/^\/w\/approvals\/corrections/, 'সংশোধন প্রস্তাব', 'অনুমোদন › সংশোধন'],
  [/^\/w\/approval\/[^/]+/, 'অনুমোদন সিদ্ধান্ত', 'অনুমোদন › সিদ্ধান্ত'],
  [/^\/w\/deposits\/new/, 'নতুন জমা', 'জমা › নতুন'],
  [/^\/w\/deposits/, 'জমা রেকর্ড', 'জমা'],
  [/^\/w\/payouts/, 'নিষ্পত্তি ও পেমেন্ট', 'পেমেন্ট ও ভাউচার'],
  [/^\/w\/ledger/, 'লেনদেন ও খতিয়ান', 'হিসাব › খতিয়ান'],
  [/^\/w\/dues/, 'বকেয়া রেজিস্টার', 'নিয়ন্ত্রণ › বকেয়া'],
  [/^\/w\/dashboard/, 'সাধারণ সঞ্চয় ড্যাশবোর্ড', 'ওভারভিউ › ড্যাশবোর্ড'],
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
  if (path === '/w/qh' || path === '/w/qh/') return 'qhdash';
  if (path.startsWith('/w/qh/products') || path.startsWith('/w/qh/rules')) return 'qhproduct';
  if (path.startsWith('/w/qh/simulation')) return 'qhsim';
  if (path.startsWith('/w/qh/eligible')) return 'qhelig';
  if (path.startsWith('/w/qh/window')) return 'qhwindow';
  if (path.startsWith('/w/qh/queue') || path.startsWith('/w/qh/applications')) return 'qhqueue';
  if (path.startsWith('/w/qh/disburse')) return 'qhdisb';
  if (path.startsWith('/w/qh/loans') || path.startsWith('/w/qh/close')) return 'qhloan';
  if (path.startsWith('/w/qh/arrears') || path.startsWith('/w/qh/writeoff')) return 'qharrears';
  if (path.startsWith('/w/qh/reports')) return 'qhreport';
  if (path.startsWith('/w/collector')) return 'route';
  if (path.startsWith('/w/routes')) return 'plan';
  if (path.startsWith('/w/bulk')) return 'batch';
  if (path.startsWith('/w/cashbook')) return 'cash';
  if (path.startsWith('/w/transfer')) return 'transfer';
  if (path.startsWith('/w/recon')) return 'recon';
  if (path.startsWith('/w/txn')) return 'txn';
  if (path.startsWith('/w/reversal')) return 'corr';
  if (path.startsWith('/w/status')) return 'status';
  if (path.startsWith('/w/claims')) return 'claim';
  if (path.startsWith('/w/moves')) return 'mv';
  if (path.startsWith('/w/reminders')) return 'remind';
  if (path.startsWith('/w/reports')) return 'reports';
  if (path.startsWith('/w/finance')) return 'fin';
  if (path.startsWith('/w/settings')) return 'settings';
  if (path.startsWith('/w/staff')) return 'staff';
  if (path.startsWith('/w/audit')) return 'audit';
  if (path.startsWith('/w/schemes')) return 'scheme';
  if (path.startsWith('/w/members')) return 'member';
  if (path.startsWith('/w/accounts') || path.startsWith('/w/applications')) return 'member';
  if (path.startsWith('/w/deposits')) return 'deposit';
  if (path.startsWith('/w/approvals/deposits')) return 'depappr';
  if (path.startsWith('/w/approvals/withdrawals')) return 'wdappr';
  if (path.startsWith('/w/approval') || path.startsWith('/w/approvals')) return 'depappr';
  if (path.startsWith('/w/payouts')) return 'wdappr';
  if (path.startsWith('/w/ledger')) return 'ledger';
  if (path.startsWith('/w/dues')) return 'dues';
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
          ) : path.startsWith('/w/qh') ? (
            <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => navigate('/w/qh/queue')}>QH আবেদন কিউ</Button>
          ) : (
            <Button size="sm" variant="secondary" icon={<Banknote size={15} />} onClick={() => navigate('/w/cashbook')}>ক্যাশ বুক</Button>
          )}
          <Button size="sm" onClick={() => navigate(path.startsWith('/w/rc') ? '/w/rc/collect' : path.startsWith('/w/qh') ? '/w/qh/disburse' : '/w/deposits/new')}>
            {path.startsWith('/w/rc') ? 'নতুন কিস্তি' : path.startsWith('/w/qh') ? 'বিতরণ' : 'নতুন জমা'}
          </Button>
        </>
      }
    >
      <Routes>
        <Route path="dashboard" element={<GsDashboard />} />
        <Route path="schemes" element={<GsSchemes />} />
        <Route path="schemes/new" element={<GsSchemeNew />} />
        <Route path="schemes/:schemeId" element={<GsSchemeDetail />} />
        <Route path="members" element={<GsMembers />} />
        <Route path="members/new" element={<GsMemberNew />} />
        <Route path="members/:memberId" element={<GsMemberDetail />} />
        <Route path="members/:memberId/exit" element={<GsMemberExit />} />
        <Route path="accounts/:accId" element={<GsAccount />} />
        <Route path="applications/:appId" element={<GsApplication />} />
        <Route path="deposits" element={<GsDeposits />} />
        <Route path="deposits/new" element={<GsDepositNew />} />
        <Route path="approvals/:kind" element={<GsApprovals />} />
        <Route path="approval/:id" element={<GsApprovalDetail />} />
        <Route path="payouts" element={<GsPayouts />} />
        <Route path="ledger" element={<GsLedger />} />
        <Route path="dues" element={<GsDues />} />

        <Route path="notices" element={<GsNotices />} />
        <Route path="meetings" element={<GsMeetings />} />
        <Route path="collector" element={<GsCollector />} />
        <Route path="status" element={<GsStatus />} />
        <Route path="claims" element={<GsClaims />} />
        <Route path="claims/:id" element={<GsClaims />} />
        <Route path="moves" element={<GsMoves />} />
        <Route path="bulk" element={<GsBulk />} />
        <Route path="bulk/import" element={<GsImport />} />
        <Route path="txn" element={<GsTxn />} />
        <Route path="txn/:txnId" element={<GsTxn />} />
        <Route path="reversal" element={<GsReversal />} />
        <Route path="cashbook" element={<GsCashbook />} />
        <Route path="transfer" element={<GsTransfer />} />
        <Route path="recon" element={<GsRecon />} />
        <Route path="routes" element={<GsRoutes />} />
        <Route path="reminders" element={<GsReminders />} />
        <Route path="reports" element={<GsReports />} />
        <Route path="finance" element={<GsFinance />} />
        <Route path="settings" element={<GsSettings />} />
        <Route path="staff" element={<GsStaff />} />
        <Route path="audit" element={<GsAudit />} />

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

        <Route path="qh" element={<QhWebDashboard />} />
        <Route path="qh/products" element={<QhWebProducts />} />
        <Route path="qh/rules" element={<QhWebRules />} />
        <Route path="qh/simulation" element={<QhWebSimulation />} />
        <Route path="qh/eligible" element={<QhWebEligible />} />
        <Route path="qh/window" element={<QhWebWindow />} />
        <Route path="qh/queue" element={<QhWebQueue />} />
        <Route path="qh/applications" element={<QhWebQueue />} />
        <Route path="qh/applications/:appId" element={<QhWebAppDetail />} />
        <Route path="qh/applications/:appId/decision" element={<QhWebDecision />} />
        <Route path="qh/disburse" element={<QhWebDisburse />} />
        <Route path="qh/disburse/:loanId" element={<QhWebDisburse />} />
        <Route path="qh/loans" element={<QhWebLoans />} />
        <Route path="qh/loans/:loanId" element={<QhWebLoanDetail />} />
        <Route path="qh/loans/:loanId/repay" element={<QhWebRepay />} />
        <Route path="qh/loans/:loanId/close" element={<QhWebClose />} />
        <Route path="qh/close" element={<QhWebClose />} />
        <Route path="qh/arrears" element={<QhWebArrears />} />
        <Route path="qh/writeoff" element={<QhWebWriteOff />} />
        <Route path="qh/reports" element={<QhWebReports />} />

        <Route path=":key" element={<WebSoon />} />
        <Route path="*" element={<Navigate to="/w/dashboard" replace />} />
      </Routes>
    </AdminWebShell>
  );
}
