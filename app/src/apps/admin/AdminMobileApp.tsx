/* ============================================================
   src/apps/admin/AdminMobileApp.tsx — অ্যাডমিন মোবাইল শেল + ২০টি রুট
   ভূমিকা: ?role=MANAGER (ডিফল্ট) — শেল ও নেভ ভূমিকা অনুযায়ী বদলায় (D-35)।
   ব্যাচ ৪: AM-01…AM-20 (হোম · অনুমোদন · সদস্য · এন্ট্রি · লেজার · ক্যাশ · পেমেন্ট · সংশোধন · দাবি · তহবিল)।
   ব্যাচ ৫: AM-21…AM-35 (রিকনসিলিয়েশন · ব্যাচ · ইমপোর্ট · আর্থিক · রিপোর্ট ·
   স্কিম · স্থানান্তর · রুট · রিমাইন্ডার · সেটিংস · স্টাফ · অডিট)।
   ব্যাচ ৬: RAM-01…RAM-12 (ROSCA) + JAM-01…JAM-10 (যৌথ লক্ষ্য) — /a/rc/* ও /a/jg/*।
   ============================================================ */

import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MobileShell } from '../../components/shell/MobileShell';
import { bottomSlots, resolveAdminShell } from '../../nav/adminMobile';
import { SoonCard } from '../../components/SoonCard';
import AdminHome from './screens/AdminHome';
import Approvals from './screens/Approvals';
import ApprovalDecision from './screens/ApprovalDecision';
import Members from './screens/Members';
import Member360 from './screens/Member360';
import MemberRegister from './screens/MemberRegister';
import ApplicationReview from './screens/ApplicationReview';
import MemberEdit from './screens/MemberEdit';
import MemberStatus from './screens/MemberStatus';
import QuickEntry from './screens/QuickEntry';
import AccountLedger from './screens/AccountLedger';
import CloseSettlement from './screens/CloseSettlement';
import Dues from './screens/Dues';
import TxnForensics from './screens/TxnForensics';
import Reversal from './screens/Reversal';
import CashBook from './screens/CashBook';
import Payouts from './screens/Payouts';
import LedgerAdmin from './screens/LedgerAdmin';
import DeathClaim from './screens/DeathClaim';
import FundTransfer from './screens/FundTransfer';
import Reconciliation from './screens/Reconciliation';
import BulkBatches from './screens/BulkBatches';
import ImportCsv from './screens/ImportCsv';
import Finance from './screens/Finance';
import ReportCenter from './screens/ReportCenter';
import Schemes from './screens/Schemes';
import SchemeDetail from './screens/SchemeDetail';
import SchemeNew from './screens/SchemeNew';
import SchemeEdit from './screens/SchemeEdit';
import MemberMove from './screens/MemberMove';
import RoutePlan from './screens/RoutePlan';
import Reminders from './screens/Reminders';
import Settings from './screens/Settings';
import StaffScreen from './screens/Staff';
import AuditLog from './screens/AuditLog';
import AdminMore from './screens/AdminMore';
import RcDashboard from './screens/RcDashboard';
import RcCircles from './screens/RcCircles';
import RcNew from './screens/RcNew';
import RcCircle from './screens/RcCircle';
import RcSeats from './screens/RcSeats';
import RcDrawRun from './screens/RcDrawRun';
import RcDrawDetail from './screens/RcDrawDetail';
import RcPool from './screens/RcPool';
import RcRegister from './screens/RcRegister';
import RcCollect from './screens/RcCollect';
import RcDefaults from './screens/RcDefaults';
import RcReports from './screens/RcReports';
import RcSchemes from './screens/RcSchemes';
import RcCalendar from './screens/RcCalendar';
import JgDashboard from './screens/JgDashboard';
import JgGoals from './screens/JgGoals';
import JgNew from './screens/JgNew';
import JgGoal from './screens/JgGoal';
import JgParts from './screens/JgParts';
import JgArrears from './screens/JgArrears';
import JgMilestones from './screens/JgMilestones';
import JgDisb from './screens/JgDisb';
import JgSettle from './screens/JgSettle';
import JgReports from './screens/JgReports';

/* শেলের নেভ-কী → রুট */
const ROUTE_BY_KEY: Record<string, string> = {
  home: '/a/home',
  summary: '/a/home',
  approve: '/a/approvals',
  queue: '/a/approvals',
  member: '/a/members',
  today: '/a/members',
  dues: '/a/dues',
  cash: '/a/cashbook',
  dayclose: '/a/cashbook',
  entry: '/a/entry',
  alert: '/m/notifications',
  control: '/a/recon',
  ledger: '/a/ledger',
  wdappr: '/a/payouts',
  corr: '/a/reversal',
  status: '/a/members',
  claim: '/a/claims',
  transfer: '/a/transfer',
  txn: '/a/ledger',
  staff: '/a/staff',
  audit: '/a/audit',
  reports: '/a/reports',
  recon: '/a/recon',
  batch: '/a/batch',
  scheme: '/a/schemes',
  plan: '/a/routes',
  remind: '/a/reminders',
  settings: '/a/settings',
  fin: '/a/finance',
  mv: '/a/moves',
  more: '/a/more',
  /* ব্যাচ ৬ — ROSCA */
  rcdash: '/a/rc',
  rcscheme: '/a/rc/schemes',
  rccalendar: '/a/rc/calendar',
  rccircle: '/a/rc/circles',
  rcnew: '/a/rc/new',
  rcdraw: '/a/rc/register',
  rcseat: '/a/rc/circles/rc01/seats',
  rccollect: '/a/rc/collect',
  rcdefault: '/a/rc/defaults',
  rcreport: '/a/rc/reports',
  /* ব্যাচ ৬ — যৌথ লক্ষ্য */
  jgdash: '/a/jg',
  jggoal: '/a/jg/goals',
  jgnew: '/a/jg/new',
  jgpart: '/a/jg/goals/jg01/parts',
  jgarrear: '/a/jg/arrears',
  jgdisb: '/a/jg/goals/jg02/disbursements',
  jgsettle: '/a/jg/goals/jg03/settle',
  jgreport: '/a/jg/reports',
};

/** পথ → পর্দা-শিরোনাম (প্রোটোটাইপের হেডার কপি) */
function metaFor(path: string, fallback: { title: string; sub: string }) {
  if (path.startsWith('/a/approvals/')) return { title: 'অনুমোদনের সিদ্ধান্ত', sub: 'যাচাই ও সিদ্ধান্ত', model: 'flow' as const };
  if (path === '/a/approvals') return { title: 'অনুমোদন কিউ', sub: 'কিউ ও সিদ্ধান্ত', model: 'deep' as const };
  if (path === '/a/members/new') return { title: 'নতুন সদস্য', sub: 'নিবন্ধন', model: 'flow' as const };
  if (path.startsWith('/a/schemes/') && path.endsWith('/edit')) return { title: 'স্কিম সম্পাদনা', sub: 'নতুন সংস্করণ', model: 'flow' as const };
  if (path.endsWith('/edit')) return { title: 'সদস্য সম্পাদনা', sub: 'কারণ ও প্রমাণসহ', model: 'flow' as const };
  if (path.endsWith('/status')) return { title: 'অবস্থা পরিবর্তন', sub: 'কারণ ও OTP', model: 'flow' as const };
  if (path.endsWith('/close')) return { title: 'প্রস্থান ও নিষ্পত্তি', sub: 'ক্লিয়ারেন্স', model: 'flow' as const };
  if (path.startsWith('/a/members/')) return { title: 'সদস্য ৩৬০°', sub: 'সব হিসাব এক জায়গায়', model: 'deep' as const };
  if (path === '/a/members') return { title: 'সদস্য খুঁজুন', sub: 'নাম, মোবাইল বা নম্বর', model: 'deep' as const };
  if (path === '/a/entry') return { title: 'জমা এন্ট্রি', sub: 'দ্রুত ও নিরাপদ', model: 'flow' as const };
  if (path.startsWith('/a/accounts/')) return { title: 'অ্যাকাউন্ট লেজার', sub: 'ব্যালেন্স ও লেনদেন', model: 'deep' as const };
  if (path.startsWith('/a/txn/')) return { title: 'লেনদেন (ফরেনসিক)', sub: 'কে, কখন, কোথা থেকে', model: 'deep' as const };
  if (path === '/a/reversal') return { title: 'সংশোধন ও রিভার্সাল', sub: 'মুছবে না — উল্টো এন্ট্রি', model: 'flow' as const };
  if (path === '/a/cashbook') return { title: 'দিনশেষ ক্যাশ বুক', sub: 'গণনা ও দিন বন্ধ', model: 'deep' as const };
  if (path === '/a/payouts') return { title: 'নিষ্পত্তি ও পেমেন্ট', sub: 'প্রদান ও ভাউচার', model: 'flow' as const };
  if (path === '/a/ledger') return { title: 'সাধারণ লেজার', sub: 'সব এন্ট্রি এক জায়গায়', model: 'deep' as const };
  if (path === '/a/claims') return { title: 'মৃত্যু দাবি', sub: 'প্রমাণ ও কমিটি', model: 'flow' as const };
  if (path === '/a/transfer') return { title: 'তহবিল স্থানান্তর', sub: 'সমিতির হিসাবের মধ্যে', model: 'flow' as const };
  if (path === '/a/dues') return { title: 'বকেয়া রেজিস্টার', sub: 'বয়স অনুযায়ী ঝুঁকি', model: 'deep' as const };
  if (path === '/a/home') return { title: 'সমিতির অবস্থা', sub: 'আজকের কাজ', model: 'landing' as const };
  if (path === '/a/recon') return { title: 'রিকনসিলিয়েশন', sub: 'ব্যতিক্রম নিষ্পত্তি ও সাইন-অফ', model: 'deep' as const };
  if (path === '/a/batch') return { title: 'বাল্ক জমা এন্ট্রি', sub: 'ব্যাচ যাচাই ও পোস্ট', model: 'flow' as const };
  if (path === '/a/import') return { title: 'CSV / Excel ইমপোর্ট', sub: 'ম্যাপিং ও ড্রাই-রান', model: 'flow' as const };
  if (path === '/a/finance') return { title: 'আর্থিক বিবরণ', sub: 'বিবরণী ও রিটার্ন', model: 'deep' as const };
  if (path === '/a/reports') return { title: 'রিপোর্ট কেন্দ্র', sub: 'তৈরি ও ডাউনলোড', model: 'deep' as const };
  if (path === '/a/schemes/new') return { title: 'নতুন স্কিম তৈরি', sub: 'উইজার্ড · খসড়া', model: 'flow' as const };
  if (path.endsWith('/edit') && path.startsWith('/a/schemes/')) return { title: 'স্কিম সম্পাদনা', sub: 'নতুন সংস্করণ', model: 'flow' as const };
  if (path.startsWith('/a/schemes/')) return { title: 'স্কিম বিবরণ', sub: 'নিয়ম ও পরিসংখ্যান', model: 'deep' as const };
  if (path === '/a/schemes') return { title: 'স্কিম তালিকা', sub: 'নিয়ম ও সংস্করণ', model: 'deep' as const };
  if (path === '/a/moves') return { title: 'সদস্য স্থানান্তর', sub: 'রুট / শাখা', model: 'deep' as const };
  if (path === '/a/routes') return { title: 'সংগ্রহ পরিকল্পনা', sub: 'রুট ও সংগ্রহক', model: 'deep' as const };
  if (path === '/a/reminders') return { title: 'রিমাইন্ডার শিডিউল', sub: 'SMS ও যোগাযোগ', model: 'deep' as const };
  if (path === '/a/settings') return { title: 'সেটিংস হাব', sub: 'নীতি ও চালু/বন্ধ', model: 'deep' as const };
  if (path === '/a/staff') return { title: 'স্টাফ ও পারমিশন', sub: 'ভূমিকা ও সীমা', model: 'deep' as const };
  if (path === '/a/audit') return { title: 'অডিট লগ', sub: 'অপরিবর্তনীয় · শুধু পঠন', model: 'deep' as const };
  if (path === '/a/more') return { title: 'সব বিভাগ', sub: 'অ্যাডমিন মোবাইল', model: 'deep' as const };
  /* ---- ব্যাচ ৬ · ROSCA (RAM) ---- */
  if (path === '/a/rc') return { title: 'ROSCA', sub: 'চক্র ও ড্র নিয়ন্ত্রণ', model: 'landing' as const };
  if (path === '/a/rc/circles') return { title: 'চক্র তালিকা', sub: 'সিট ও পুল অবস্থা', model: 'deep' as const };
  if (path === '/a/rc/new') return { title: 'নতুন চক্র', sub: 'স্কিম ও নিয়ম সংস্করণ', model: 'flow' as const };
  if (path === '/a/rc/schemes/new') return { title: 'স্কিম তৈরি', sub: 'নতুন সংস্করণ · ৩ ধাপ', model: 'flow' as const };
  if (path === '/a/rc/schemes') return { title: 'চক্র স্কিম', sub: 'নিয়ম ও সংস্করণ', model: 'deep' as const };
  if (path === '/a/rc/calendar') return { title: 'ড্র ক্যালেন্ডার', sub: 'আসন্ন ও সম্পন্ন ড্র', model: 'deep' as const };
  if (/^\/a\/rc\/circles\/[^/]+\/seats$/.test(path)) return { title: 'সিট বরাদ্দ', sub: 'খালি সিট ও ওয়েটলিস্ট', model: 'flow' as const };
  if (/^\/a\/rc\/circles\/[^/]+\/draw$/.test(path)) return { title: 'ড্র পরিচালনা', sub: '৫ ধাপ · maker ≠ checker', model: 'flow' as const };
  if (/^\/a\/rc\/circles\/[^/]+\/pool$/.test(path)) return { title: 'পুল ও ঘাটতি', sub: 'সিদ্ধান্ত ও নথি', model: 'deep' as const };
  if (path.startsWith('/a/rc/circles/')) return { title: 'চক্রের হাব', sub: 'সারাংশ · সিট · ড্র', model: 'deep' as const };
  if (path.startsWith('/a/rc/draws/')) return { title: 'ড্রের রসিদ', sub: 'যাচাই ও প্রমাণ', model: 'deep' as const };
  if (path === '/a/rc/register') return { title: 'ড্র রেজিস্টার', sub: 'অপরিবর্তনীয় রেকর্ড', model: 'deep' as const };
  if (path === '/a/rc/collect') return { title: 'কিস্তি সংগ্রহ', sub: 'বকেয়া ও আদায়', model: 'deep' as const };
  if (path === '/a/rc/defaults') return { title: 'ডিফল্ট ও প্রতিস্থাপন', sub: 'D-41 · D-46', model: 'deep' as const };
  if (path === '/a/rc/reports') return { title: 'ROSCA রিপোর্ট', sub: 'তহবিল ও সংগ্রহ', model: 'deep' as const };
  /* ---- ব্যাচ ৬ · যৌথ লক্ষ্য (JAM) ---- */
  if (path === '/a/jg') return { title: 'যৌথ লক্ষ্য', sub: 'মডিউল ৩ · তহবিল দায়', model: 'landing' as const };
  if (path === '/a/jg/goals') return { title: 'লক্ষ্য তালিকা', sub: 'সীমা ও অগ্রগতি', model: 'deep' as const };
  if (path === '/a/jg/new') return { title: 'নতুন লক্ষ্য', sub: '৩ ধাপ · অনুমোদন', model: 'flow' as const };
  if (/^\/a\/jg\/goals\/[^/]+\/parts$/.test(path)) return { title: 'অংশগ্রহণকারী', sub: 'যোগদান অনুমোদন', model: 'deep' as const };
  if (/^\/a\/jg\/goals\/[^/]+\/milestones$/.test(path)) return { title: 'মাইলস্টোন', sub: 'অবদানের ধারা', model: 'deep' as const };
  if (/^\/a\/jg\/goals\/[^/]+\/disbursements$/.test(path)) return { title: 'বিতরণ ভাউচার', sub: 'প্রমাণ ছাড়া নয়', model: 'flow' as const };
  if (/^\/a\/jg\/goals\/[^/]+\/settle$/.test(path)) return { title: 'নিষ্পত্তি', sub: 'ফেরত ও অনুমোদন', model: 'flow' as const };
  if (path.startsWith('/a/jg/goals/')) return { title: 'লক্ষ্যের হাব', sub: 'অগ্রগতি ও হিসাব', model: 'deep' as const };
  if (path === '/a/jg/arrears') return { title: 'বকেয়া সংগ্রহ', sub: 'অবদান ও রিমাইন্ডার', model: 'deep' as const };
  if (path === '/a/jg/reports') return { title: 'যৌথ লক্ষ্য রিপোর্ট', sub: 'তহবিল ও ব্যয়', model: 'deep' as const };
  return { title: fallback.title, sub: fallback.sub, model: 'deep' as const };
}

function SoonRoute() {
  const { key } = useParams();
  const [params] = useSearchParams();
  const shell = resolveAdminShell(params.get('role'));
  const slot = [...shell.nav, ...(shell.fab ? [shell.fab] : [])].find((s) => s.key === key);
  return <SoonCard label={slot?.label ?? 'পর্দা'} phase="পরবর্তী" note="এই শেলের সব AM পর্দা এখন তৈরি — নিচের নেভিগেশন বা ড্রয়ার থেকে বেছে নিন।" />;
}

export default function AdminMobileApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const shell = resolveAdminShell(params.get('role'));
  const slots = bottomSlots(shell);
  const meta = metaFor(location.pathname, { title: shell.nameBn, sub: shell.roleBn });
  const activeKey = (() => {
    const p = location.pathname;
    if (p.startsWith('/a/approvals')) return 'approve';
    if (p.startsWith('/a/members')) return 'member';
    if (p.startsWith('/a/dues')) return 'dues';
    if (p.startsWith('/a/cashbook')) return 'cash';
    if (p.startsWith('/a/ledger') || p.startsWith('/a/txn') || p.startsWith('/a/accounts')) return 'ledger';
    if (p.startsWith('/a/payouts')) return 'wdappr';
    if (p === '/a/recon' || p === '/a/batch' || p === '/a/import') return 'control';
    if (p === '/a/schemes' || p.startsWith('/a/schemes/')) return 'scheme';
    if (p === '/a/routes') return 'plan';
    if (p === '/a/reminders') return 'remind';
    if (p === '/a/settings') return 'settings';
    if (p === '/a/staff') return 'staff';
    if (p === '/a/audit') return 'audit';
    if (p === '/a/reports') return 'reports';
    if (p === '/a/finance') return 'summary';
    if (p === '/a/moves') return 'mv';
    if (p === '/a/more') return 'more';
    if (p === '/a/rc' || p.startsWith('/a/rc/')) return 'rcdash';
    if (p === '/a/jg' || p.startsWith('/a/jg/')) return 'jgdash';
    return slots.find((s) => ROUTE_BY_KEY[s.key] === p)?.key ?? 'home';
  })();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  return (
    <MobileShell
      title={meta.title}
      subtitle={`${shell.roleBn}${shell.readOnly ? ' · শুধু পঠন' : ''}`}
      model={meta.model}
      nav={slots}
      activeNav={activeKey}
      onMenu={() => navigate('/')}
      onBack={() => navigate(-1)}
      onNavigate={(slot) => {
        const to = ROUTE_BY_KEY[slot.key];
        navigate(to ? `${to}${roleQS}` : `/a/soon/${slot.key}${roleQS}`);
      }}
    >
      <Routes>
        <Route path="home" element={<AdminHome shell={shell} />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="approvals/:id" element={<ApprovalDecision />} />
        <Route path="approvals/:id/review" element={<ApplicationReview />} />
        <Route path="members" element={<Members />} />
        <Route path="members/new" element={<MemberRegister />} />
        <Route path="members/:memberId" element={<Member360 />} />
        <Route path="members/:memberId/edit" element={<MemberEdit />} />
        <Route path="members/:memberId/status" element={<MemberStatus />} />
        <Route path="members/:memberId/close" element={<CloseSettlement />} />
        <Route path="entry" element={<QuickEntry />} />
        <Route path="accounts/:accountId" element={<AccountLedger />} />
        <Route path="txn/:txnId" element={<TxnForensics />} />
        <Route path="reversal" element={<Reversal />} />
        <Route path="cashbook" element={<CashBook />} />
        <Route path="payouts" element={<Payouts />} />
        <Route path="ledger" element={<LedgerAdmin />} />
        <Route path="claims" element={<DeathClaim />} />
        <Route path="transfer" element={<FundTransfer />} />
        <Route path="dues" element={<Dues />} />
        <Route path="recon" element={<Reconciliation />} />
        <Route path="batch" element={<BulkBatches />} />
        <Route path="import" element={<ImportCsv />} />
        <Route path="finance" element={<Finance />} />
        <Route path="reports" element={<ReportCenter />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="schemes/new" element={<SchemeNew />} />
        <Route path="schemes/:schemeId" element={<SchemeDetail />} />
        <Route path="schemes/:schemeId/edit" element={<SchemeEdit />} />
        <Route path="moves" element={<MemberMove />} />
        <Route path="routes" element={<RoutePlan />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="settings" element={<Settings />} />
        <Route path="staff" element={<StaffScreen />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="more" element={<AdminMore />} />
        <Route path="rc" element={<RcDashboard />} />
        <Route path="rc/circles" element={<RcCircles />} />
        <Route path="rc/new" element={<RcNew />} />
        <Route path="rc/schemes" element={<RcSchemes />} />
        <Route path="rc/schemes/new" element={<RcNew />} />
        <Route path="rc/calendar" element={<RcCalendar />} />
        <Route path="rc/circles/:circleId" element={<RcCircle />} />
        <Route path="rc/circles/:circleId/seats" element={<RcSeats />} />
        <Route path="rc/circles/:circleId/draw" element={<RcDrawRun />} />
        <Route path="rc/circles/:circleId/pool" element={<RcPool />} />
        <Route path="rc/draws/:drawId" element={<RcDrawDetail />} />
        <Route path="rc/register" element={<RcRegister />} />
        <Route path="rc/collect" element={<RcCollect />} />
        <Route path="rc/defaults" element={<RcDefaults />} />
        <Route path="rc/reports" element={<RcReports />} />
        <Route path="jg" element={<JgDashboard />} />
        <Route path="jg/goals" element={<JgGoals />} />
        <Route path="jg/new" element={<JgNew />} />
        <Route path="jg/goals/:goalId" element={<JgGoal />} />
        <Route path="jg/goals/:goalId/parts" element={<JgParts />} />
        <Route path="jg/goals/:goalId/milestones" element={<JgMilestones />} />
        <Route path="jg/goals/:goalId/disbursements" element={<JgDisb />} />
        <Route path="jg/goals/:goalId/settle" element={<JgSettle />} />
        <Route path="jg/arrears" element={<JgArrears />} />
        <Route path="jg/reports" element={<JgReports />} />
        <Route path="soon/:key" element={<SoonRoute />} />
        <Route path="*" element={<Navigate to={`/a/home${roleQS}`} replace />} />
      </Routes>
    </MobileShell>
  );
}
