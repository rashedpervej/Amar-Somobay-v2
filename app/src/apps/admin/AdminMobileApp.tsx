/* ============================================================
   src/apps/admin/AdminMobileApp.tsx — অ্যাডমিন মোবাইল শেল + রাউট
   ভূমিকা: ?role=MANAGER (ডিফল্ট) — শেল ও নেভ ভূমিকা অনুযায়ী বদলায় (D-35)।
   এখনকার পর্দা: AM-01 হোম · AM-02 অনুমোদন কিউ · বাকিগুলো সৎ "ফেজ ৩" কার্ড।
   ============================================================ */

import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MobileShell } from '../../components/shell/MobileShell';
import { bottomSlots, resolveAdminShell } from '../../nav/adminMobile';
import { SoonCard } from '../../components/SoonCard';
import AdminHome from './screens/AdminHome';
import Approvals from './screens/Approvals';

/* শেলের নেভ-কী → রুট (যেগুলো এখনো নেই সেগুলো /a/soon-এ যায়) */
const ROUTE_BY_KEY: Record<string, string> = {
  home: '/a/home',
  summary: '/a/home',
  approve: '/a/approvals',
  queue: '/a/approvals',
};

const TITLES: Record<string, { title: string; sub: string; model?: 'landing' | 'deep' | 'flow' }> = {
  '/a/home': { title: 'অ্যাডমিন হোম', sub: 'আজকের কাজ', model: 'landing' },
  '/a/approvals': { title: 'অনুমোদন', sub: 'কিউ ও সিদ্ধান্ত', model: 'flow' },
};

function SoonRoute() {
  const { key } = useParams();
  const [params] = useSearchParams();
  const shell = resolveAdminShell(params.get('role'));
  const slot = [...shell.nav, ...(shell.fab ? [shell.fab] : [])].find((s) => s.key === key);
  return <SoonCard label={slot?.label ?? 'পর্দা'} phase="ফেজ ৩" note="এই শেলের বাকি সব বিভাগ ড্রয়ারে (সম্পূর্ণ ANAV)।" />;
}

export default function AdminMobileApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const shell = resolveAdminShell(params.get('role'));
  const slots = bottomSlots(shell);
  const meta = TITLES[location.pathname] ?? { title: shell.nameBn, sub: shell.roleBn };
  const activeKey = slots.find((s) => ROUTE_BY_KEY[s.key] === location.pathname)?.key ?? 'home';
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  return (
    <MobileShell
      title={meta.title}
      subtitle={`${shell.roleBn}${shell.readOnly ? ' · শুধু পঠন' : ''}`}
      model={location.pathname === '/a/approvals' ? 'flow' : (meta.model ?? 'deep')}
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
        <Route path="soon/:key" element={<SoonRoute />} />
        <Route path="*" element={<Navigate to={`/a/home${roleQS}`} replace />} />
      </Routes>
    </MobileShell>
  );
}
