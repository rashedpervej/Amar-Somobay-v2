-- ==============================================================================
-- FIX PROFILES INFINITE RECURSION & RLS PERMISSIONS
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create a non-recursive SECURITY DEFINER function to check admin role
-- A SECURITY DEFINER function runs with table owner privileges, bypassing
-- RLS on public.profiles to prevent circular / infinite recursion (Postgres error 42P17).
CREATE OR REPLACE FUNCTION public.check_is_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop all recursive / conflicting policies on public.profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "fallback_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "tenant_isolated_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_policy" ON public.profiles;

-- 3. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Clean, High-Performance, Non-Recursive Policies
-- Policy 1: Authenticated users can view all member/profile info
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Policy 2: Users can insert their own profile upon registration
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile (name, avatar, bio, phone)
CREATE POLICY "profiles_update_own_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Platform Admins can update any profile (via non-recursive helper)
CREATE POLICY "profiles_update_admin_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.check_is_admin(auth.uid()));

-- ==============================================================================
-- DONE! Profiles RLS infinite recursion is now completely resolved.
-- ==============================================================================
