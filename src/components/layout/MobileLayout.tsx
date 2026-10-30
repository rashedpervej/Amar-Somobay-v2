import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Home, 
  PiggyBank, 
  Coins, 
  CalendarDays, 
  FileText,
  Menu, 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  BarChart3,
  Settings as SettingsIcon,
  Target,
  Megaphone
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { StickyHeader } from './StickyHeader';
import { NoticePopupBanner } from '../NoticePopupBanner';

export type AdminTab = 'dashboard' | 'members' | 'somobay' | 'reports' | 'more';
export type MemberTab = 'dashboard' | 'savings' | 'somobay' | 'updates' | 'settings';

export function getActiveAdminTab(pathname: string): AdminTab {
  if (pathname === '/dashboard' || pathname === '/') {
    return 'dashboard';
  }
  // Member management paths (e.g. /members, /somobay/:slug/members, /somobay/:slug/members/*)
  if (pathname.includes('/members')) {
    return 'members';
  }
  // Reports paths (e.g. /admin/reports, /somobay/:slug/reports, /somobay/:slug/reports/*)
  if (pathname.includes('/reports')) {
    return 'reports';
  }
  // More / settings / notifications / promo controls
  if (
    pathname.endsWith('/more') || 
    pathname.includes('/admin/more') ||
    pathname.includes('/settings') ||
    pathname.includes('/app-settings') ||
    pathname.includes('/admin/updates') ||
    pathname.includes('/admin/notices') ||
    pathname.includes('/promotions')
  ) {
    return 'more';
  }
  // Somobay scheme management, cooperative root, tenant dashboard, rosca, joint goals, qard
  if (
    pathname.startsWith('/somobay') ||
    pathname.startsWith('/admin/savings') ||
    pathname.startsWith('/admin/loans') ||
    pathname.startsWith('/admin/installments') ||
    pathname.startsWith('/rosca') ||
    pathname.startsWith('/joint-goals') ||
    pathname.startsWith('/qard')
  ) {
    return 'somobay';
  }
  return 'dashboard';
}

export function getActiveMemberTab(pathname: string): MemberTab {
  if (pathname === '/dashboard' || pathname === '/') {
    return 'dashboard';
  }
  if (pathname.startsWith('/savings')) {
    return 'savings';
  }
  if (pathname.startsWith('/updates') || pathname.startsWith('/notices') || pathname.startsWith('/promotions')) {
    return 'updates';
  }
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }
  if (
    pathname.startsWith('/somobay') ||
    pathname.startsWith('/goals') ||
    pathname.startsWith('/rosca') ||
    pathname.startsWith('/qard')
  ) {
    return 'somobay';
  }
  return 'dashboard';
}

export interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  headerTitle?: React.ReactNode;
  headerSubtitle?: string;
  backTo?: string;
  onBack?: () => void;
  showBack?: boolean;
  headerRight?: React.ReactNode;
  customHeader?: React.ReactNode;
  hideHeader?: boolean;
}

interface RouteMeta {
  title: string;
  isRoot?: boolean;
  backTo?: string;
}

function resolveRouteMeta(pathname: string, isAdmin: boolean): RouteMeta {
  // Exact match table
  const exactMap: Record<string, RouteMeta> = {
    '/dashboard': { title: 'ড্যাশবোর্ড', isRoot: true },
    '/members': { title: 'সদস্য ব্যবস্থাপনা', isRoot: isAdmin, backTo: '/dashboard' },
    '/somobay/manage': { title: 'সমবায় স্কিম ও প্ল্যান', isRoot: true },
    '/somobay': { title: isAdmin ? 'সমবায় ব্যবস্থাপনা' : 'আমার সমবায়', isRoot: true, backTo: '/dashboard' },
    '/admin/savings': { title: 'সঞ্চয় ব্যবস্থাপনা', isRoot: false, backTo: '/dashboard' },
    '/admin/loans': { title: 'ঋণ ব্যবস্থাপনা', isRoot: false, backTo: '/dashboard' },
    '/admin/installments': { title: 'কিস্তি ও আদায়', isRoot: false, backTo: '/dashboard' },
    '/admin/reports': { title: 'রিপোর্ট ও হিসাব', isRoot: true },
    '/admin/app-settings': { title: 'অ্যাপ সেটিংস', isRoot: false, backTo: '/settings' },
    '/settings': { title: 'সেটিংস', isRoot: !isAdmin, backTo: '/dashboard' },
    '/settings/profile': { title: 'প্রোফাইল পরিবর্তন', isRoot: false, backTo: '/settings' },
    '/settings/security': { title: 'নিরাপত্তা সেটিংস', isRoot: false, backTo: '/settings' },
    '/savings': { title: 'সঞ্চয় হিসাব', isRoot: !isAdmin, backTo: '/dashboard' },
    '/savings/insights': { title: 'সঞ্চয় বিশ্লেষণ', isRoot: false, backTo: '/savings' },
    '/savings/deposit': { title: 'সঞ্চয় জমা', isRoot: false, backTo: '/savings' },
    '/savings/bulk': { title: 'একত্রে সঞ্চয় জমা', isRoot: false, backTo: '/savings' },
    '/notifications': { title: 'নোটিফিকেশন', isRoot: false },
    '/updates': { title: 'আপডেটস ও নোটিশ', isRoot: !isAdmin, backTo: '/dashboard' },
    '/notices': { title: 'আপডেটস ও নোটিশ', isRoot: !isAdmin, backTo: '/dashboard' },
    '/admin/updates': { title: 'আপডেটস ও প্রমোশন কন্ট্রোল', isRoot: false, backTo: '/admin/more' },
    '/admin/notices': { title: 'আপডেটস ও প্রমোশন কন্ট্রোল', isRoot: false, backTo: '/admin/more' },
    '/promotions/manage': { title: 'প্রমোশন ব্যানার কন্ট্রোল', isRoot: false, backTo: '/admin/more' },
    '/rosca': { title: 'রোটেশনাল সঞ্চয় (ROSCA)', isRoot: false, backTo: '/somobay' },
    '/joint-goals': { title: 'যৌথ সঞ্চয় (Joint Goals)', isRoot: false, backTo: '/somobay' },
    '/joint-goals/create': { title: 'নতুন যৌথ সঞ্চয়', isRoot: false, backTo: '/joint-goals' },
    '/qard': { title: 'কর্জে হাসানা মেনু', isRoot: false, backTo: '/somobay' },
    '/qard/dashboard': { title: 'কর্জে হাসানা ড্যাশবোর্ড', isRoot: false, backTo: '/qard' },
    '/qard/schemes': { title: 'কর্জে হাসানা স্কিম', isRoot: false, backTo: '/qard' },
    '/qard/members': { title: 'সদস্য তালিকা', isRoot: false, backTo: '/qard' },
    '/qard/repayments': { title: 'কিস্তি ও পরিশোধ', isRoot: false, backTo: '/qard' },
    '/qard/loans': { title: 'ঋণ আবেদন ও মঞ্জুরি', isRoot: false, backTo: '/qard' },
    '/qard/overdue': { title: 'বকেয়া ঋণ হিসাব', isRoot: false, backTo: '/qard' },
    '/qard/reports': { title: 'কর্জে হাসানা রিপোর্ট', isRoot: false, backTo: '/qard' },
    '/qard/settings': { title: 'কর্জে হাসানা সেটিংস', isRoot: false, backTo: '/qard' }
  };

  if (exactMap[pathname]) {
    return exactMap[pathname];
  }

  // Pattern matching
  if (pathname.startsWith('/members/')) {
    return { title: 'সদস্য বিবরণ', isRoot: false, backTo: '/members' };
  }
  if (pathname.startsWith('/somobay/manage/')) {
    return { title: 'সমবায় স্কিম পরিচালনা', isRoot: false, backTo: '/somobay/manage' };
  }
  if (pathname.startsWith('/promotions/')) {
    return { title: 'প্রমোশন বিবরণ', isRoot: false, backTo: '/notices' };
  }

  // Rosca patterns
  if (pathname.startsWith('/rosca/')) {
    if (pathname.includes('/settings')) return { title: 'চক্রের সেটিংস', isRoot: false };
    if (pathname.includes('/reports')) return { title: 'রোসকা রিপোর্ট', isRoot: false };
    if (pathname.includes('/progress')) return { title: 'রোসকা অগ্রগতি', isRoot: false };
    if (pathname.includes('/completed')) return { title: 'সমাপ্ত রোসকা চক্র', isRoot: false };
    if (pathname.includes('/draw-result/')) return { title: 'লটারি ফলাফল', isRoot: false };
    if (pathname.includes('/members/')) return { title: 'সদস্য বিবরণ', isRoot: false };
    return { title: 'রোসকা চক্র বিবরণ', isRoot: false, backTo: '/rosca' };
  }

  // Joint Goals Admin patterns
  if (pathname.startsWith('/joint-goals/')) {
    if (pathname.includes('/contribute')) return { title: 'টাকা জমা দিন', isRoot: false };
    if (pathname.includes('/progress')) return { title: 'লক্ষ্যের অগ্রগতি', isRoot: false };
    if (pathname.includes('/transactions')) return { title: 'লেনদেন বিবরণ', isRoot: false };
    if (pathname.includes('/reports')) return { title: 'গোল রিপোর্ট', isRoot: false };
    if (pathname.includes('/settings')) return { title: 'গোল সেটিংস', isRoot: false };
    if (pathname.includes('/completed')) return { title: 'সমাপ্ত লক্ষ্য', isRoot: false };
    if (pathname.includes('/members/')) return { title: 'সদস্য বিবরণ', isRoot: false };
    return { title: 'যৌথ সঞ্চয় বিবরণ', isRoot: false, backTo: '/joint-goals' };
  }

  // User Goals patterns
  if (pathname.startsWith('/goals/')) {
    if (pathname.includes('/my-contribution')) return { title: 'আমার অবদান', isRoot: false };
    if (pathname.includes('/contributions')) return { title: 'সকল অবদান', isRoot: false };
    if (pathname.includes('/contribute')) return { title: 'অবদান যুক্ত করুন', isRoot: false };
    if (pathname.includes('/members/me')) return { title: 'আমার তথ্য', isRoot: false };
    if (pathname.includes('/members')) return { title: 'গ্রুপের সদস্যবৃন্দ', isRoot: false };
    if (pathname.includes('/progress')) return { title: 'লক্ষ্যের অগ্রগতি', isRoot: false };
    if (pathname.includes('/information')) return { title: 'লক্ষ্যের তথ্য', isRoot: false };
    if (pathname.includes('/notices')) return { title: 'ঘোষণা ও নোটিশ', isRoot: false };
    if (pathname.includes('/completed')) return { title: 'সম্পন্ন লক্ষ্য', isRoot: false };
    return { title: 'যৌথ সঞ্চয় লক্ষ্য', isRoot: false, backTo: '/somobay' };
  }

  // Qard patterns
  if (pathname.startsWith('/qard/')) {
    if (pathname.includes('/schemes/')) return { title: 'স্কিম বিবরণ', isRoot: false, backTo: '/qard/schemes' };
    if (pathname.includes('/members/') && pathname.includes('/history')) return { title: 'সদস্যের ইতিহাস', isRoot: false, backTo: '/qard/members' };
    return { title: 'কর্জে হাসানা', isRoot: false, backTo: '/qard' };
  }

  // Multi-tenant Cooperative workspace patterns
  if (pathname.startsWith('/somobay/')) {
    const parts = pathname.split('/');
    if (parts.length === 3 && !['create', 'manage', 'menu'].includes(parts[2])) {
      return { title: 'সমবায় ড্যাশবোর্ড', isRoot: true, backTo: '/somobay' };
    }
    const slug = parts[2];
    if (pathname.includes('/plans')) return { title: 'সমবায় স্কিম ও প্ল্যান', isRoot: false, backTo: `/somobay/${slug}` };
    if (pathname.includes('/general-cooperative')) return { title: 'সাধারণ সমবায় ব্যবস্থাপনা', isRoot: false, backTo: `/somobay/${slug}` };
    if (pathname.includes('/members')) return { title: 'সমবায় সদস্যবৃন্দ', isRoot: false, backTo: `/somobay/${slug}` };
    if (pathname.includes('/reports')) return { title: 'সমবায় রিপোর্ট ও হিসাব', isRoot: false, backTo: `/somobay/${slug}` };
    if (pathname.includes('/settings')) return { title: 'সমবায় সেটিংস', isRoot: false, backTo: `/somobay/${slug}` };
    if (pathname.includes('/more')) return { title: 'সমবায় মেনু', isRoot: false, backTo: `/somobay/${slug}` };
  }

  return { title: 'গ্রামীণ সমবায়', isRoot: false };
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  showNav = true,
  headerTitle,
  headerSubtitle,
  backTo,
  onBack,
  showBack,
  headerRight,
  customHeader,
  hideHeader = false
}) => {
  const { profile, activeOrganization, activeRole, memberships } = useAuthStore();
  const location = useLocation();

  // Multi-tenant role & approval checks (strictly aligned with ProtectedRoute)
  const isPlatformAdmin = profile?.role === 'admin';
  const isCoopAdmin = (activeRole === 'cooperative_admin' || isPlatformAdmin) && activeOrganization?.status === 'active';
  const isAdmin = isPlatformAdmin || isCoopAdmin;

  const hasActiveMembership = (memberships && memberships.some(m => m.status === 'active' && m.organization?.status === 'active')) ||
                              (activeOrganization?.status === 'active' && activeRole === 'member');

  // A user is considered pending if they have no active approved cooperative membership and are not an approved admin,
  // or if their profile role is explicitly 'pending', or if currently on /pending route
  const isPendingUser = profile?.role === 'pending' || (!hasActiveMembership && !isCoopAdmin && !isPlatformAdmin);
  const isPendingRoute = location.pathname === '/pending' || location.pathname.startsWith('/pending');

  const isApproved = !isPendingUser && !isPendingRoute && (isAdmin || hasActiveMembership);

  // Extract current cooperative slug if inside /somobay/:slug
  const pathParts = location.pathname.split('/');
  const isSomobaySubroute = pathParts[1] === 'somobay' && pathParts[2] && !['create', 'manage', 'menu'].includes(pathParts[2]);
  const currentSlug = isSomobaySubroute ? pathParts[2] : (activeOrganization?.slug || null);

  // Active tab determination (mutually exclusive)
  const activeAdminTab = getActiveAdminTab(location.pathname);
  const activeMemberTab = getActiveMemberTab(location.pathname);

  // Rule: Admin More page MUST NOT have a top header.
  const isMorePage = location.pathname === '/admin/more' || (isSomobaySubroute && pathParts[3] === 'more');
  const shouldOmitHeader = hideHeader || isMorePage;

  const routeMeta = resolveRouteMeta(location.pathname, isAdmin);
  const activeTitle = headerTitle !== undefined ? headerTitle : routeMeta.title;
  const activeShowBack = showBack !== undefined ? showBack : !routeMeta.isRoot;
  let activeBackTo = backTo !== undefined ? backTo : routeMeta.backTo;
  if (isPendingUser && (activeBackTo === '/settings' || activeBackTo === '/dashboard')) {
    activeBackTo = '/pending';
  }

  return (
    <div className="mobile-container">
      {customHeader ? (
        customHeader
      ) : !shouldOmitHeader ? (
        <StickyHeader
          title={activeTitle}
          subtitle={headerSubtitle}
          backTo={activeBackTo}
          onBack={onBack}
          showBack={activeShowBack}
          rightAction={headerRight}
        />
      ) : null}

      <main className={`w-full flex-1 px-4 pt-3.5 flex flex-col gap-[16px] ${showNav && isApproved ? 'pb-[84px]' : 'pb-8'}`}>
        {children}
      </main>

      {showNav && isApproved && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-white border-t border-border flex items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          <div className="flex justify-around items-center w-full px-1">
            {isAdmin ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeAdminTab === 'dashboard' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <LayoutDashboard size={22} strokeWidth={activeAdminTab === 'dashboard' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeAdminTab === 'dashboard' ? 'font-bold' : 'font-medium'}`}>ড্যাশবোর্ড</span>
                </Link>
                
                <Link 
                  to={currentSlug ? `/somobay/${currentSlug}/members` : "/members"} 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeAdminTab === 'members' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Users size={22} strokeWidth={activeAdminTab === 'members' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeAdminTab === 'members' ? 'font-bold' : 'font-medium'}`}>সদস্য</span>
                </Link>
                
                <Link 
                  to="/somobay" 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeAdminTab === 'somobay' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <TrendingUp size={22} strokeWidth={activeAdminTab === 'somobay' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeAdminTab === 'somobay' ? 'font-bold' : 'font-medium'}`}>সমবায়</span>
                </Link>

                <Link 
                  to={currentSlug ? `/somobay/${currentSlug}/reports` : "/admin/reports"} 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeAdminTab === 'reports' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <BarChart3 size={22} strokeWidth={activeAdminTab === 'reports' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeAdminTab === 'reports' ? 'font-bold' : 'font-medium'}`}>রিপোর্ট</span>
                </Link>
                
                <Link 
                  to={currentSlug ? `/somobay/${currentSlug}/more` : "/admin/more"} 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeAdminTab === 'more' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Menu size={22} strokeWidth={activeAdminTab === 'more' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeAdminTab === 'more' ? 'font-bold' : 'font-medium'}`}>আরও</span>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeMemberTab === 'dashboard' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Home size={22} strokeWidth={activeMemberTab === 'dashboard' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeMemberTab === 'dashboard' ? 'font-bold' : 'font-medium'}`}>হোম</span>
                </Link>

                <Link 
                  to="/savings" 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeMemberTab === 'savings' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <PiggyBank size={22} strokeWidth={activeMemberTab === 'savings' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeMemberTab === 'savings' ? 'font-bold' : 'font-medium'}`}>সঞ্চয়</span>
                </Link>

                <Link 
                  to="/somobay" 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeMemberTab === 'somobay' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Users size={22} strokeWidth={activeMemberTab === 'somobay' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeMemberTab === 'somobay' ? 'font-bold' : 'font-medium'}`}>সমবায়</span>
                </Link>

                <Link 
                  to="/updates" 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeMemberTab === 'updates' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Megaphone size={22} strokeWidth={activeMemberTab === 'updates' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeMemberTab === 'updates' ? 'font-bold' : 'font-medium'}`}>আপডেটস</span>
                </Link>

                <Link 
                  to="/settings" 
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all active:scale-90 select-none cursor-pointer ${activeMemberTab === 'settings' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Menu size={22} strokeWidth={activeMemberTab === 'settings' ? 2.5 : 1.8} />
                  <span className={`text-[11px] bangla ${activeMemberTab === 'settings' ? 'font-bold' : 'font-medium'}`}>আরও</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Global Notice Popup Banner for active user screens */}
      <NoticePopupBanner />
    </div>
  );
};
