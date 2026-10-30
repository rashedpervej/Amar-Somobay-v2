import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = () => {
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  const loading = useAuthStore(state => state.loading);
  const initialized = useAuthStore(state => state.initialized);
  const memberships = useAuthStore(state => state.memberships);
  const activeOrganization = useAuthStore(state => state.activeOrganization);
  const activeRole = useAuthStore(state => state.activeRole);
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2.5"></div>
        <p className="text-[12px] font-semibold text-slate-500 bangla">
          লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasActiveMembership = (memberships && memberships.some(m => m.status === 'active' && m.organization?.status === 'active')) ||
                              (activeOrganization?.status === 'active' && activeRole === 'member');

  const isCoopAdmin = (activeRole === 'cooperative_admin' || profile?.role === 'admin') && 
                      activeOrganization?.status === 'active';

  // A user is considered pending if they do NOT have an active approved cooperative membership/admin role
  const isPending = !hasActiveMembership && !isCoopAdmin;

  // Limited access for pending users (can complete profile, apply for cooperative, or join cooperative)
  const allowedForPending = ['/pending', '/settings/profile', '/settings/security', '/cooperative/apply', '/cooperative/join'];
  const isAllowedPendingPath = allowedForPending.includes(location.pathname) || location.pathname.startsWith('/join');

  if (isPending && !isAllowedPendingPath) {
    return <Navigate to="/pending" replace />;
  }

  // If user is NOT pending anymore (their cooperative or membership was approved), but they are on /pending, redirect to /dashboard
  if (!isPending && location.pathname === '/pending') {
    return <Navigate to="/dashboard" replace />;
  }

  // Cooperative Admin namespace protection: Only Cooperative Admins can access /admin/*
  const path = location.pathname;

  if (path.startsWith('/admin') && !isCoopAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Deny access to administrative routes for regular members (unless they are cooperative_admin or platform admin)
  const isMember = (profile?.role === 'member' || activeRole === 'member') && !isCoopAdmin;
  if (isMember) {
    const isTryingAdminRoute = 
      path === '/members' || path.startsWith('/members/') ||
      path === '/savings/bulk' || path.startsWith('/savings/bulk/') ||
      path === '/somobay/manage' || path.startsWith('/somobay/manage/') ||
      path === '/somobay/create' || path.startsWith('/somobay/create/') ||
      path === '/promotions/manage' || path.startsWith('/promotions/manage/') ||
      path === '/joint-goals' || path.startsWith('/joint-goals/') ||
      path.startsWith('/qard') ||
      path === '/rosca' ||
      (path.includes('/rosca/') && (path.endsWith('/settings') || path.endsWith('/reports') || path.endsWith('/completed'))) ||
      (path.startsWith('/somobay/') && path.endsWith('/settings'));
    
    if (isTryingAdminRoute) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
