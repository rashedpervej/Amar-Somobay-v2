/* ============================================================
   src/apps/member/MemberApp.tsx — সদস্য অ্যাপের শেল + রাউট
   শুধু মোবাইল (আপনার নির্দেশ)। নেভিগেশন MNAV-এর ৫ স্লট — প্রোটোটাইপ-যাচাই করা।
   এখনকার পর্দা: M-01 হোম · M-04 সঞ্চয় · M-06 জমা · M-08 লেনদেন · M-18 আরও।
   ============================================================ */

import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MobileShell } from '../../components/shell/MobileShell';
import { MEMBER_NAV } from '../../nav/member';
import { member } from '../../demo/data';
import MemberHome from './screens/Home';
import Savings from './screens/Savings';
import Deposit from './screens/Deposit';
import Transactions from './screens/Transactions';
import More from './screens/More';

/* MNAV কী → রুট (Phase 3-এ স্ক্রিন ম্যাপিং অনুযায়ী বাড়বে) */
const ROUTE_BY_KEY: Record<string, string> = {
  home: '/m/home',
  savings: '/m/savings',
  deposit: '/m/deposit',
  txn: '/m/txn',
  more: '/m/more',
};

const TITLES: Record<string, { title: string; sub: string; model?: 'landing' | 'deep' | 'flow' }> = {
  '/m/home': { title: 'সঞ্চয় হোম', sub: member.org, model: 'landing' },
  '/m/savings': { title: 'আমার সঞ্চয়', sub: 'অ্যাকাউন্ট ও কিস্তি' },
  '/m/deposit': { title: 'জমা দিন', sub: 'কিস্তি বা অতিরিক্ত জমা', model: 'flow' },
  '/m/txn': { title: 'লেনদেন', sub: 'ইতিহাস ও রসিদ' },
  '/m/more': { title: 'আরও', sub: 'প্রোফাইল ও সহায়তা' },
};

export default function MemberApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = TITLES[location.pathname] ?? TITLES['/m/home'];
  const activeKey =
    Object.keys(ROUTE_BY_KEY).find((k) => ROUTE_BY_KEY[k] === location.pathname) ?? 'home';

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
        <Route path="savings" element={<Savings />} />
        <Route path="deposit" element={<Deposit />} />
        <Route path="txn" element={<Transactions />} />
        <Route path="more" element={<More />} />
        <Route path="*" element={<Navigate to="/m/home" replace />} />
      </Routes>
    </MobileShell>
  );
}
