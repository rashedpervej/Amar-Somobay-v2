import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Organization, OrganizationMember, UserOrgRole } from '../types/multiTenant';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'member' | 'pending';
  phone?: string | null;
  phone_verified?: boolean | null;
  avatar_url: string | null;
  bio: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  union_pouro?: string | null;
  village?: string | null;
  profile_completed: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  activeOrganizationId: string | null;
  activeOrganization: Organization | null;
  activeRole: UserOrgRole | null;
  memberships: OrganizationMember[];
  setActiveOrganizationId: (orgId: string) => void;
  fetchMemberships: (overrideUser?: User | null, overrideProfile?: Profile | null) => Promise<void>;
  setAuth: (user: User | null, profile: Profile | null) => void;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  activeOrganizationId: null,
  activeOrganization: null,
  activeRole: null,
  memberships: [],
  setActiveOrganizationId: (orgId: string) => {
    const { memberships, profile } = get();
    const activeMember = memberships.find(m => m.organization_id === orgId);
    set({
      activeOrganizationId: orgId,
      activeOrganization: activeMember?.organization || null,
      activeRole: activeMember?.role || (profile?.role === 'admin' ? 'cooperative_admin' : null)
    });
  },
  fetchMemberships: async (passedUser?: User | null, passedProfile?: Profile | null) => {
    const user = passedUser !== undefined ? passedUser : get().user;
    const profile = passedProfile !== undefined ? passedProfile : get().profile;
    const activeOrganizationId = get().activeOrganizationId;
    if (!user) return;
    try {
      const { data: members } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      let memberships: OrganizationMember[] = (members as any) || [];
      
      let currentOrgId = activeOrganizationId;
      if (!currentOrgId && memberships.length > 0) {
        currentOrgId = memberships[0].organization_id;
      }
      const activeMember = memberships.find(m => m.organization_id === currentOrgId);
      const activeOrganization = activeMember?.organization || null;

      let activeRole: UserOrgRole | null = null;
      if (activeMember?.role) {
        activeRole = activeMember.role;
      } else if (profile?.role === 'admin') {
        activeRole = 'cooperative_admin';
      }

      let updatedProfile = profile;
      if (activeMember && activeMember.status === 'active' && activeMember.organization?.status === 'active') {
        if (profile && profile.role === 'pending') {
          const targetRole = activeMember.role === 'cooperative_admin' ? 'admin' : 'member';
          updatedProfile = { ...profile, role: targetRole };
          supabase.from('profiles').update({ role: targetRole }).eq('id', user.id).then();
        }
      } else if ((!profile || profile.role !== 'admin') && memberships.length === 0) {
        // User has NO active memberships: profile role must be 'pending'
        if (profile && profile.role === 'member') {
          updatedProfile = { ...profile, role: 'pending' };
          supabase.from('profiles').update({ role: 'pending' }).eq('id', user.id).then();
        }
      }

      set({
        memberships,
        activeOrganizationId: currentOrgId,
        activeOrganization,
        activeRole,
        ...(updatedProfile ? { profile: updatedProfile } : {})
      });
    } catch (e) {
      console.warn('Organization memberships fetch error (fallback mode):', e);
    }
  },
  setAuth: (user, profile) => {
    set({ user, profile, loading: false });
  },
  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user) throw new Error('Not authenticated');

    // Security check: Only existing admins can change role
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.role && profile?.role !== 'admin') {
      delete sanitizedUpdates.role;
    }

    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', user.id);

    if (profileError) throw profileError;

    // 2. Sync to auth metadata if relevant fields are updated
    if (updates.full_name || updates.avatar_url) {
      await supabase.auth.updateUser({
        data: { 
          full_name: updates.full_name,
          avatar_url: updates.avatar_url
        }
      });
    }
    
    // 3. Fetch fresh profile data to ensure state is in sync with DB
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!fetchError && updatedProfile) {
      // Calculate completion status
      const isCompleted = !!updatedProfile.full_name && !!updatedProfile.avatar_url;
      
      if (isCompleted !== updatedProfile.profile_completed) {
        await supabase.from('profiles').update({ profile_completed: isCompleted }).eq('id', user.id);
        updatedProfile.profile_completed = isCompleted;
      }
      
      set({ profile: updatedProfile });
    }
  },
  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear local state
      set({ 
        user: null, 
        profile: null, 
        loading: false,
        activeOrganizationId: null,
        activeOrganization: null,
        activeRole: null,
        memberships: []
      });
    }
  },
  initialize: async () => {
    // Safety fallback timer to prevent blank screen if network or Supabase stalls
    const safetyTimeout = setTimeout(() => {
      if (!get().initialized) {
        console.warn('Supabase auth getSession timed out, forcing initialized state');
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    }, 3500);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Session retrieval error:', error.message);
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes('refresh token') || errMsg.includes('refresh_token') || errMsg.includes('token not found') || errMsg.includes('invalid refresh')) {
          // Forcefully clear session if refresh token is gone
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Fallback: clear local storage manually if signer fails
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
          }
        }
        set({ user: null, profile: null, loading: false, initialized: true });
        return;
      }

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // Atomically fetch memberships and resolve active organization/role BEFORE marking initialized
        await get().fetchMemberships(session.user, profile);
        set({ user: session.user, profile: get().profile || profile, loading: false, initialized: true });
      } else {
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      const msg = error?.message?.toLowerCase() || '';
      const isRefreshError = msg.includes('refresh token') || msg.includes('refresh_token') || msg.includes('token not found') || msg.includes('invalid refresh');
      
      if (isRefreshError) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
      }
      set({ user: null, profile: null, loading: false, initialized: true });
    } finally {
      clearTimeout(safetyTimeout);
    }

    // Listener for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const currentProfile = get().profile;
        
        if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            profile: null, 
            loading: false,
            activeOrganizationId: null,
            activeOrganization: null,
            activeRole: null,
            memberships: []
          });
          return;
        }

        if (session?.user) {
          if (currentProfile?.id === session.user.id && get().initialized && !get().loading) return;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          await get().fetchMemberships(session.user, profile);
          set({ user: session.user, profile: get().profile || profile, loading: false, initialized: true });
        } else {
          if (currentProfile !== null || get().user !== null) {
            set({ 
              user: null, 
              profile: null, 
              loading: false,
              activeOrganizationId: null,
              activeOrganization: null,
              activeRole: null,
              memberships: []
            });
          }
        }
      } catch (error: any) {
        console.error('Auth state change handler error:', error);
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('refresh token') || msg.includes('refresh_token') || msg.includes('token not found') || msg.includes('invalid refresh')) {
          set({ user: null, profile: null, loading: false });
        }
      }
    });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__authStore = useAuthStore;
}
