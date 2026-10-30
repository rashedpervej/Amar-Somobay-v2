-- ==============================================================================
-- MASTER FIX FOR:
-- 1. Profiles RLS Infinite Recursion (Error 42P17)
-- 2. Organizations Table RLS (new row violates row-level security policy for table "organizations")
-- 3. Organization Members Application & Join RLS
-- 4. Storage Bucket 'avatars' creation and upload policies for profile picture
-- ==============================================================================
-- Run this ENTIRE script in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE FIX (Eliminate Infinite Recursion)
-- ------------------------------------------------------------------------------

-- Create non-recursive SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.check_is_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop all conflicting / recursive policies on profiles
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.check_is_admin(auth.uid()) OR public.is_platform_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 2. STORAGE 'avatars' BUCKET & POLICIES (Fix Profile Picture Upload)
-- ------------------------------------------------------------------------------

-- Ensure 'avatars' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing avatar policies if any
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated avatars upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated avatars update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated avatars delete" ON storage.objects;

-- Allow public read access to avatar images
CREATE POLICY "Public avatars access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their avatar
CREATE POLICY "Authenticated avatars upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update/replace their avatar
CREATE POLICY "Authenticated avatars update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to delete their avatar
CREATE POLICY "Authenticated avatars delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- ------------------------------------------------------------------------------
-- 3. ORGANIZATIONS TABLE POLICIES (Fix "new row violates row-level security policy")
-- ------------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_all_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_delete_policy" ON public.organizations;

-- Anyone authenticated can view organizations (needed for search, apply, and viewing pending apps)
CREATE POLICY "org_select_policy" ON public.organizations
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can insert a new organization (for application)
CREATE POLICY "org_insert_policy" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Platform admin or Org admin can update organization details
CREATE POLICY "org_update_policy" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_org_admin(id, auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()) OR public.is_org_admin(id, auth.uid()));

-- Only platform admin can delete an organization
CREATE POLICY "org_delete_policy" ON public.organizations
  FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 4. ORGANIZATION MEMBERS POLICIES & TRIGGER (Allow Self-Application & Joining)
-- ------------------------------------------------------------------------------

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_modify_policy" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_select_policy" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON public.organization_members;

-- Select policy: User can view their own membership or members of their org or platform admin
CREATE POLICY "org_members_select_policy" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_platform_admin(auth.uid())
    OR public.is_org_member(organization_id, auth.uid())
  );

-- Insert policy: User can submit application for themselves or org admin can add members
CREATE POLICY "org_members_insert_policy" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

-- Update policy: Org admin or platform admin can update member role/status
CREATE POLICY "org_members_update_policy" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  )
  WITH CHECK (
    public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

-- Delete policy
CREATE POLICY "org_members_delete_policy" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 5. UPGRADE MEMBER ESCALATION TRIGGER (Supports Safe Self-Application)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_org_member_escalation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Prevent regular user from changing their own role or status
    IF OLD.user_id = auth.uid() AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status) THEN
      IF NOT public.is_platform_admin(auth.uid()) THEN
        RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: আপনি নিজের মেম্বারশিপ রোল বা স্ট্যাটাস পরিবর্তন করতে পারবেন না।';
      END IF;
    END IF;

    -- Only org admin or platform admin can update member status/roles
    IF NOT (public.is_org_admin(NEW.organization_id, auth.uid()) OR public.is_platform_admin(auth.uid())) THEN
      RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: শুধুমাত্র সমবায় অ্যাডমিন বা সুপার অ্যাডমিন সদস্যদের রোল বা স্ট্যাটাস পরিবর্তন করতে পারবেন।';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- If applicant is self-applying (e.g. creating cooperative or joining)
    IF NEW.user_id = auth.uid() THEN
      -- Safety guarantee: regular applicant MUST start in 'pending' status
      IF NEW.status = 'active' AND NOT public.is_platform_admin(auth.uid()) THEN
        NEW.status := 'pending';
      END IF;
    ELSE
      -- Adding someone else requires org admin or platform admin privileges
      IF NOT (public.is_org_admin(NEW.organization_id, auth.uid()) OR public.is_platform_admin(auth.uid())) THEN
        RAISE EXCEPTION 'নিরাপত্তা ত্রুটি: অন্য সদস্যকে যুক্ত করতে অ্যাডমিন অধিকার প্রয়োজন।';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_protect_org_member_escalation ON public.organization_members;
CREATE TRIGGER tr_protect_org_member_escalation
  BEFORE UPDATE OR INSERT ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_org_member_escalation();

-- ------------------------------------------------------------------------------
-- 6. STATUS CHECK CONSTRAINTS (Allow 'rejected' & 'suspended')
-- ------------------------------------------------------------------------------
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_status_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_status_check CHECK (status IN ('active', 'suspended', 'pending', 'rejected'));

ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_status_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_status_check CHECK (status IN ('active', 'pending', 'suspended', 'rejected'));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- ALL DONE! Profiles, Organizations, Members, and Storage are fully configured.
-- ==============================================================================
