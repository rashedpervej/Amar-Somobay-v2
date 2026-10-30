import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { resolveOrganizationBySlug } from '../lib/slugUtils';
import { ShieldAlert, ArrowLeft, Loader2, Home, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface TenantContextType {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  role: string;
}

export const CooperativeTenantGuard: React.FC = () => {
  const { cooperativeSlug } = useParams<{ cooperativeSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    profile,
    memberships,
    fetchMemberships,
    setActiveOrganizationId,
    activeOrganizationId
  } = useAuthStore();

  const [verifying, setVerifying] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [resolvedOrg, setResolvedOrg] = useState<{ id: string; slug?: string | null; name: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyTenantAccess() {
      if (cooperativeSlug && cooperativeSlug !== cooperativeSlug.toLowerCase()) {
        const normalizedPath = location.pathname.replace(
          `/somobay/${cooperativeSlug}`,
          `/somobay/${cooperativeSlug.toLowerCase()}`
        );
        navigate(normalizedPath + location.search, { replace: true });
        return;
      }

      if (!user) {
        setVerifying(false);
        return;
      }

      setVerifying(true);
      setNotFound(false);
      setAccessDenied(false);

      try {
        // Ensure fresh memberships are loaded
        if (memberships.length === 0) {
          await fetchMemberships();
        }

        const currentMemberships = useAuthStore.getState().memberships;
        const currentProfile = useAuthStore.getState().profile;

        // Extract organizations where user is an active member
        const userOrgs = currentMemberships
          .filter(m => m.status === 'active' && m.organization)
          .map(m => m.organization!);

        let targetOrg = resolveOrganizationBySlug(cooperativeSlug || '', userOrgs);

        // If not found in user direct memberships, check database safely (for Super Admin audit and platform lookup)
        if (!targetOrg) {
          try {
            const cleanCode = (cooperativeSlug || '').trim();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);

            let dbOrg: any = null;

            if (isUuid) {
              const { data } = await supabase
                .from('organizations')
                .select('*')
                .or(`id.eq.${cleanCode},slug.ilike.${cleanCode}`)
                .limit(1);
              if (data && data.length > 0) dbOrg = data[0];
            } else {
              // Priority 1: Exact match on cooperative_code, slug, or reg_number (Case-insensitive)
              const { data: exactMatches } = await supabase
                .from('organizations')
                .select('*')
                .or(`cooperative_code.ilike.${cleanCode},slug.ilike.${cleanCode},reg_number.ilike.${cleanCode}`)
                .limit(1);

              if (exactMatches && exactMatches.length > 0) {
                dbOrg = exactMatches[0];
              } else {
                // Priority 2: Fuzzy fallback by name
                const { data: nameMatches } = await supabase
                  .from('organizations')
                  .select('*')
                  .ilike('name', `%${cleanCode}%`)
                  .limit(1);
                if (nameMatches && nameMatches.length > 0) {
                  dbOrg = nameMatches[0];
                }
              }
            }

            if (dbOrg) {
              const hasMembership = currentMemberships.some(m => m.organization_id === dbOrg.id && m.status === 'active');
              if (hasMembership || currentProfile?.role === 'admin') {
                targetOrg = dbOrg;
              } else {
                if (isMounted) {
                  setAccessDenied(true);
                  setVerifying(false);
                }
                return;
              }
            }
          } catch (queryErr) {
            console.warn('Organization database lookup error:', queryErr);
          }
        }

        if (!targetOrg) {
          // Organization doesn't exist at all in database
          if (isMounted) {
            setNotFound(true);
            setVerifying(false);
          }
          return;
        }

        // Access Granted: bind active tenant context
        if (isMounted) {
          setResolvedOrg(targetOrg);
          useAuthStore.setState({
            activeOrganizationId: targetOrg.id,
            activeOrganization: targetOrg as any,
            activeRole: currentMemberships.find(m => m.organization_id === targetOrg.id)?.role || (currentProfile?.role === 'admin' ? 'cooperative_admin' : 'member')
          });
          setVerifying(false);
        }
      } catch (err) {
        console.error('Tenant access verification error:', err);
        if (isMounted) {
          setAccessDenied(true);
          setVerifying(false);
        }
      }
    }

    verifyTenantAccess();

    return () => {
      isMounted = false;
    };
  }, [cooperativeSlug, user, memberships.length]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <Loader2 className="w-9 h-9 text-primary animate-spin mb-3" />
        <p className="text-[13px] font-semibold text-slate-600 bangla">
          সমবায়ের নিরাপত্তা ও সদস্যপদ যাচাই করা হচ্ছে...
        </p>
      </div>
    );
  }

  // 404: Cooperative does not exist
  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 border border-slate-200 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert size={34} />
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bangla block">
              সমবায় পাওয়া যায়নি (404 Not Found)
            </span>
            <h2 className="text-[18px] font-bold text-slate-800 bangla mt-1">
              সমবায়টির অস্তিত্ব নেই
            </h2>
            <p className="text-[12px] text-slate-600 bangla mt-2 leading-relaxed">
              <span className="font-bold text-slate-800">"{cooperativeSlug}"</span> কোড বা স্লাগে কোনো অনুমোদিত সমবায় পাওয়া যায়নি। অনুগ্রহ করে সঠিক লিংক বা কোড ব্যবহার করুন।
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Home size={16} />
              <span>মূল ড্যাশবোর্ডে ফিরুন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 403: Tenant Access Denied
  if (accessDenied || !resolvedOrg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 border border-rose-200 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert size={34} />
          </div>

          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider bangla block">
              নিরাপত্তা লঙ্ঘন সতর্কতা (403 Unauthorized)
            </span>
            <h2 className="text-[18px] font-bold text-slate-800 bangla mt-1">
              অননুমোদিত সমবায় প্রবেশাধিকার
            </h2>
            <p className="text-[12px] text-slate-600 bangla mt-2 leading-relaxed">
              আপনি <span className="font-bold text-slate-800">"{cooperativeSlug}"</span> সমবায়ের নিবন্ধিত সক্রিয় সদস্য বা প্রশাসক নন। মাল্টি-টেন্যান্ট আইসোলেশন ও ডেটা সুরক্ষা বিধিমালার কারণে এই সমবায়ের তথ্যে প্রবেশাধিকার সীমাবদ্ধ।
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 bangla text-left flex items-start gap-2">
            <Lock size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span>
              কোনো ব্যবহারকারী শুধুমাত্র স্লাগ বা আইডি জেনে অন্য সমবায়ের তথ্য দেখতে পারবে না।
            </span>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Home size={16} />
              <span>মূল ড্যাশবোর্ডে ফিরুন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Role-Based Access Control inside Cooperative:
  // Settings and more administration routes are strictly reserved for Cooperative Admins
  const isPrivilegedRoute = location.pathname.endsWith('/settings') || location.pathname.endsWith('/more');
  const userMembership = memberships.find(m => m.organization_id === resolvedOrg?.id && m.status === 'active');
  const isCoopAdmin = userMembership?.role === 'cooperative_admin' || profile?.role === 'admin';

  if (isPrivilegedRoute && !isCoopAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 border border-amber-200 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock size={34} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider bangla block">
              অননুমোদিত প্রশাসনিক রুট (403 Forbidden)
            </span>
            <h2 className="text-[18px] font-bold text-slate-800 bangla mt-1">
              সমবায় সেটিংস কেবল অ্যাডমিনের জন্য
            </h2>
            <p className="text-[12px] text-slate-600 bangla mt-2 leading-relaxed">
              আপনি এই সমবায়ের একজন সম্মানিত সদস্য, কিন্তু সমবায় সেটিংস বা আর্থিক পলিসি পরিবর্তনের অনুমতি শুধুমাত্র সমবায় প্রশাসকের (Cooperative Admin) রয়েছে।
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate(`/somobay/${cooperativeSlug}`)}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>সমবায় ড্যাশবোর্ডে ফিরুন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tenant access verified! Render protected child routes
  return <Outlet context={{ organization: resolvedOrg, membership: userMembership }} />;
};
