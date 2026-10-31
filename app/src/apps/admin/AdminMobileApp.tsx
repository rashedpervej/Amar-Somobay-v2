/* ============================================================
   src/apps/admin/AdminMobileApp.tsx — অ্যাডমিন মোবাইল শেল + ২০টি রুট
   ভূমিকা: ?role=MANAGER (ডিফল্ট) — শেল ও নেভ ভূমিকা অনুযায়ী বদলায় (D-35)।
   ব্যাচ ৪: AM-01…AM-20 সম্পূর্ণ (হোম · অনুমোদন · সদস্য · এন্ট্রি · লেজার ·
   ক্যাশ · পেমেন্ট · সংশোধন · দাবি · তহবিল)।
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
  control: '/a/ledger',
  ledger: '/a/ledger',
  wdappr: '/a/payouts',
  corr: '/a/reversal',
  status: '/a/members',
  claim: '/a/claims',
  transfer: '/a/transfer',
  txn: '/a/ledger',
  staff: '/a/soon/staff',
  audit: '/a/soon/audit',
  reports: '/a/soon/reports',
};

/** পথ → পর্দা-শিরোনাম (প্রোটোটাইপের হেডার কপি) */
function metaFor(path: string, fallback: { title: string; sub: string }) {
  if (path.startsWith('/a/approvals/')) return { title: 'অনুমোদনের সিদ্ধান্ত', sub: 'যাচাই ও সিদ্ধান্ত', model: 'flow' as const };
  if (path === '/a/approvals') return { title: 'অনুমোদন কিউ', sub: 'কিউ ও সিদ্ধান্ত', model: 'deep' as const };
  if (path === '/a/members/new') return { title: 'নতুন সদস্য', sub: 'নিবন্ধন', model: 'flow' as const };
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
  return { title: fallback.title, sub: fallback.sub, model: 'deep' as const };
}

function SoonRoute() {
  const { key } = useParams();
  const [params] = useSearchParams();
  const shell = resolveAdminShell(params.get('role'));
  const slot = [...shell.nav, ...(shell.fab ? [shell.fab] : [])].find((s) => s.key === key);
  return <SoonCard label={slot?.label ?? 'পর্দা'} phase="ব্যাচ ৫" note="AM-21…AM-35 পরবর্তী ব্যাচে আসছে — এই শেলের বাকি বিভাগ ড্রয়ারে।" />;
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
        <Route path="soon/:key" element={<SoonRoute />} />
        <Route path="*" element={<Navigate to={`/a/home${roleQS}`} replace />} />
      </Routes>
    </MobileShell>
  );
}
