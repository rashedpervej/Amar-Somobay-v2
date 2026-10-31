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
import Circles from './screens/Circles';
import CircleDetail from './screens/CircleDetail';
import CircleDraws from './screens/CircleDraws';
import CirclePay from './screens/CirclePay';
import CircleHistory from './screens/CircleHistory';
import CircleReceipt from './screens/CircleReceipt';
import Goals from './screens/Goals';
import GoalDetail from './screens/GoalDetail';
import GoalJoin from './screens/GoalJoin';
import GoalContribute from './screens/GoalContribute';
import GoalUses from './screens/GoalUses';
import QardHome from './screens/QardHome';
import QardEligibility from './screens/QardEligibility';
import QardProducts from './screens/QardProducts';
import QardApply from './screens/QardApply';
import QardApplications from './screens/QardApplications';
import QardLoans from './screens/QardLoans';
import QardPay from './screens/QardPay';
import QardCertificate from './screens/QardCertificate';
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

/* নির্দিষ্ট পথের শিরোনাম; ডাইনামিক পথের জন্য প্রিফিক্স মিল */
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
  { match: /^\/m\/circles$/, meta: { title: 'আমার চক্র', sub: 'ROSCA · চক্রভিত্তিক সঞ্চয়' } },
  { match: /^\/m\/circles\/[^/]+\/draws$/, meta: { title: 'ড্র ক্রম ও পরবর্তী ড্র', sub: 'অপরিবর্তনীয় ফল' } },
  { match: /^\/m\/circles\/[^/]+\/pay$/, meta: { title: 'কিস্তি পরিশোধ', sub: 'অঙ্ক · মাধ্যম · রসিদ', model: 'flow' } },
  { match: /^\/m\/circles\/[^/]+\/history$/, meta: { title: 'ড্র ইতিহাস ও প্রাপ্তি', sub: 'ভাউচারসহ' } },
  { match: /^\/m\/circles\/[^/]+\/receipt\/[^/]+$/, meta: { title: 'প্রাপ্তি ভাউচার', sub: 'ড্র পেআউট রসিদ' } },
  { match: /^\/m\/circles\/[^/]+$/, meta: { title: 'চক্র বিস্তারিত', sub: 'সিট, ড্র ও পুল হিসাব' } },
  { match: /^\/m\/goals$/, meta: { title: 'আমাদের লক্ষ্য', sub: 'যৌথ লক্ষ্য সঞ্চয়' } },
  { match: /^\/m\/goals\/uses$/, meta: { title: 'অর্জন ও ব্যবহার', sub: 'ভাউচার ও প্রমাণ' } },
  { match: /^\/m\/goals\/[^/]+\/join$/, meta: { title: 'যোগদান ও প্রতিশ্রুতি', sub: 'শর্ত যাচাই', model: 'flow' } },
  { match: /^\/m\/goals\/[^/]+\/contribute$/, meta: { title: 'অবদান দিন', sub: 'লক্ষ্য · অঙ্ক · রসিদ', model: 'flow' } },
  { match: /^\/m\/goals\/[^/]+$/, meta: { title: 'লক্ষ্য বিস্তারিত', sub: 'অগ্রগতি ও অংশগ্রহণকারী' } },
  { match: /^\/m\/qard$/, meta: { title: 'কর্জে হাসানা', sub: 'সুদমুক্ত সহায়তা' } },
  { match: /^\/m\/qard\/eligibility$/, meta: { title: 'যোগ্যতা ও আমার অবস্থা', sub: 'কারণ ও করণীয়' } },
  { match: /^\/m\/qard\/products$/, meta: { title: 'পণ্য ও শর্তাবলি', sub: 'সুদ শূন্য · শুধু মূলধন' } },
  { match: /^\/m\/qard\/apply$/, meta: { title: 'সহায়তার আবেদন', sub: 'অঙ্ক · উদ্দেশ্য · কাগজ', model: 'flow' } },
  { match: /^\/m\/qard\/applications$/, meta: { title: 'আবেদনের অবস্থা', sub: 'ইতিহাস ও সিদ্ধান্ত' } },
  { match: /^\/m\/qard\/loans$/, meta: { title: 'আমার সহায়তা', sub: 'ঋণ ও কিস্তি ছক' } },
  { match: /^\/m\/qard\/pay$/, meta: { title: 'কিস্তি পরিশোধ', sub: 'শুধু মূলধন · চার্জ নেই', model: 'flow' } },
  { match: /^\/m\/qard\/certificate(\/[^/]+)?$/, meta: { title: 'সমাপ্তি সনদ', sub: 'সুদ শূন্য প্রমাণপত্র' } },
  { match: /^\/m\/more$/, meta: { title: 'আরও', sub: 'প্রোফাইল ও সহায়তা' } },
];

export default function MemberApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = TITLES.find((t) => t.match.test(location.pathname))?.meta ?? { title: 'সঞ্চয় হোম', sub: ORG, model: 'landing' };
  const p = location.pathname;
  const activeKey =
    Object.keys(ROUTE_BY_KEY).find((k) => p === ROUTE_BY_KEY[k]) ??
    (p.startsWith('/m/deposit') ? 'deposit'
      : p.startsWith('/m/txn') ? 'txn'
      : p.startsWith('/m/savings') || p.startsWith('/m/schemes') ? 'savings'
      : p.startsWith('/m/circles') || p.startsWith('/m/goals') || p.startsWith('/m/qard') || p.startsWith('/m/more')
        || p.startsWith('/m/profile') || p.startsWith('/m/settings') || p.startsWith('/m/help') ? 'more'
      : 'home');

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
        <Route path="circles" element={<Circles />} />
        <Route path="circles/:circleId" element={<CircleDetail />} />
        <Route path="circles/:circleId/draws" element={<CircleDraws />} />
        <Route path="circles/:circleId/pay" element={<CirclePay />} />
        <Route path="circles/:circleId/history" element={<CircleHistory />} />
        <Route path="circles/:circleId/receipt/:drawId" element={<CircleReceipt />} />
        <Route path="goals" element={<Goals />} />
        <Route path="goals/uses" element={<GoalUses />} />
        <Route path="goals/:goalId" element={<GoalDetail />} />
        <Route path="goals/:goalId/join" element={<GoalJoin />} />
        <Route path="goals/:goalId/contribute" element={<GoalContribute />} />
        <Route path="qard" element={<QardHome />} />
        <Route path="qard/eligibility" element={<QardEligibility />} />
        <Route path="qard/products" element={<QardProducts />} />
        <Route path="qard/apply" element={<QardApply />} />
        <Route path="qard/applications" element={<QardApplications />} />
        <Route path="qard/loans" element={<QardLoans />} />
        <Route path="qard/pay" element={<QardPay />} />
        <Route path="qard/certificate" element={<QardCertificate />} />
        <Route path="qard/certificate/:loanId" element={<QardCertificate />} />
        <Route path="more" element={<More />} />
        <Route path="*" element={<Navigate to="/m/home" replace />} />
      </Routes>
    </MobileShell>
  );
}
