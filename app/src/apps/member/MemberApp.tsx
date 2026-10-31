/* ============================================================
   src/apps/member/MemberApp.tsx — সদস্য অ্যাপের শেল + রাউট
   শুধু মোবাইল। MNAV-এর ৫ স্লট অপরিবর্তিত; ভেতরের সব পর্দা M-01…M-21 রুটেড
   এবং প্রতিটি আগের/পরের ধাপে সত্যিকারের নেভিগেশন আছে।
   ============================================================ */

import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MobileShell } from '../../components/shell/MobileShell';
import { MEMBER_NAV } from '../../nav/member';
import { member } from '../../demo/data';
import MemberHome from './screens/Home';
import Savings from './screens/Savings';
import AccountDetail from './screens/AccountDetail';
import Deposit from './screens/Deposit';
import ReceiptScreen from './screens/ReceiptScreen';
import Transactions from './screens/Transactions';
import TxnDetail from './screens/TxnDetail';
import Schemes from './screens/Schemes';
import SchemeDetail from './screens/SchemeDetail';
import Dues from './screens/Dues';
import Withdrawals from './screens/Withdrawals';
import WithdrawNew from './screens/WithdrawNew';
import WithdrawalDetail from './screens/WithdrawalDetail';
import Statement from './screens/Statement';
import Nominees from './screens/Nominees';
import Notifications from './screens/Notifications';
import Notices from './screens/Notices';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import Support from './screens/Support';
import CloseRequest from './screens/CloseRequest';
import More from './screens/More';

/* MNAV কী → রুট */
const ROUTE_BY_KEY: Record<string, string> = {
  home: '/m/home',
  savings: '/m/savings',
  deposit: '/m/deposit',
  txn: '/m/txn',
  more: '/m/more',
};

type Meta = { title: string; sub: string; model?: 'landing' | 'deep' | 'flow' };
const ORG = member.org;

/* নির্দিষ্ট পথের শিরোনাম; ডাইনামিক পথের জন্য প্রিফিক্স মिलान */
const TITLES: { match: RegExp; meta: Meta }[] = [
  { match: /^\/m\/home$/, meta: { title: 'সঞ্চয় হোম', sub: ORG, model: 'landing' } },
  { match: /^\/m\/savings\/[^/]+$/, meta: { title: 'অ্যাকাউন্ট বিবরণ', sub: 'কিস্তি ও জমার ইতিহাস' } },
  { match: /^\/m\/savings$/, meta: { title: 'আমার সঞ্চয়', sub: 'অ্যাকাউন্ট ও কিস্তি' } },
  { match: /^\/m\/schemes\/[^/]+$/, meta: { title: 'স্কিমের বিবরণ', sub: 'শর্ত ও সুবিধা' } },
  { match: /^\/m\/schemes$/, meta: { title: 'স্কিম তালিকা', sub: 'চারটি মডিউল' } },
  { match: /^\/m\/deposit\/receipt\/[^/]+$/, meta: { title: 'জমার রসিদ', sub: 'সংরক্ষণ ও যাচাই', model: 'flow' } },
  { match: /^\/m\/deposit$/, meta: { title: 'জমা দিন', sub: 'কিস্তি বা অতিরিক্ত জমা', model: 'flow' } },
  { match: /^\/m\/txn\/[^/]+$/, meta: { title: 'লেনদেন বিবরণ', sub: 'ডিজিটাল রসিদ' } },
  { match: /^\/m\/txn$/, meta: { title: 'লেনদেন', sub: 'ইতিহাস ও রসিদ' } },
  { match: /^\/m\/dues$/, meta: { title: 'বকেয়া কিস্তি', sub: 'সব বকেয়া এক জায়গায়' } },
  { match: /^\/m\/withdrawals\/new$/, meta: { title: 'উত্তোলনের আবেদন', sub: 'সর্বনিম্ন ৫০০ টাকা', model: 'flow' } },
  { match: /^\/m\/withdrawals\/[^/]+$/, meta: { title: 'উত্তোলন বিবরণ', sub: 'অবস্থা ও সময়রেখা' } },
  { match: /^\/m\/withdrawals$/, meta: { title: 'আমার উত্তোলন', sub: 'অপেক্ষমাণ ও পরিশোধিত' } },
  { match: /^\/m\/statement$/, meta: { title: 'স্টেটমেন্ট', sub: 'ডাউনলোড ও যাচাই' } },
  { match: /^\/m\/nominees$/, meta: { title: 'নমিনি', sub: 'শেয়ার ১০০%' } },
  { match: /^\/m\/notifications$/, meta: { title: 'নোটিফিকেশন', sub: 'সব বার্তা' } },
  { match: /^\/m\/notices$/, meta: { title: 'নোটিশ বোর্ড', sub: 'সংস্থার ঘোষণা' } },
  { match: /^\/m\/profile$/, meta: { title: 'প্রোফাইল ও KYC', sub: 'পরিচিতি ও ঠিকানা' } },
  { match: /^\/m\/settings$/, meta: { title: 'সেটিংস', sub: 'নিরাপত্তা ও পছন্দ' } },
  { match: /^\/m\/help$/, meta: { title: 'সহায়তা কেন্দ্র', sub: 'টিকিট ও প্রশ্ন' } },
  { match: /^\/m\/close-request$/, meta: { title: 'সদস্যপদ বন্ধ', sub: 'সতর্কতার সাথে', model: 'flow' } },
  { match: /^\/m\/more$/, meta: { title: 'আরও', sub: 'প্রোফাইল ও সহায়তা' } },
];

export default function MemberApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = TITLES.find((t) => t.match.test(location.pathname))?.meta ?? { title: 'সঞ্চয় হোম', sub: ORG, model: 'landing' };
  const activeKey = Object.keys(ROUTE_BY_KEY).find((k) => location.pathname === ROUTE_BY_KEY[k]) ?? (location.pathname.startsWith('/m/txn') || location.pathname.startsWith('/m/deposit') ? (location.pathname.startsWith('/m/deposit') ? 'deposit' : 'txn') : location.pathname.startsWith('/m/savings') || location.pathname.startsWith('/m/schemes') ? 'savings' : 'home');

  return (
    <MobileShell
      title={meta.title}
      subtitle={meta.sub}
      model={meta.model ?? 'deep'}
      nav={MEMBER_NAV}
      activeNav={activeKey}
      onNavigate={(slot) => navigate(ROUTE_BY_KEY[slot.key] ?? '/m/home')}
      onBack={() => navigate(-1)}
    >
      <Routes>
        <Route path="home" element={<MemberHome />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="schemes/:schemeId" element={<SchemeDetail />} />
        <Route path="savings" element={<Savings />} />
        <Route path="savings/:accountId" element={<AccountDetail />} />
        <Route path="deposit" element={<Deposit />} />
        <Route path="deposit/receipt/:depositId" element={<ReceiptScreen />} />
        <Route path="txn" element={<Transactions />} />
        <Route path="txn/:txnId" element={<TxnDetail />} />
        <Route path="dues" element={<Dues />} />
        <Route path="withdrawals" element={<Withdrawals />} />
        <Route path="withdrawals/new" element={<WithdrawNew />} />
        <Route path="withdrawals/:id" element={<WithdrawalDetail />} />
        <Route path="statement" element={<Statement />} />
        <Route path="nominees" element={<Nominees />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="notices" element={<Notices />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Support />} />
        <Route path="close-request" element={<CloseRequest />} />
        <Route path="more" element={<More />} />
        <Route path="*" element={<Navigate to="/m/home" replace />} />
      </Routes>
    </MobileShell>
  );
}
