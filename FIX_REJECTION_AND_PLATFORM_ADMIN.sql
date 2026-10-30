-- ==============================================================================
-- FIX: REJECTION SUPPORT & PLATFORM ADMIN AUTHORIZATION
-- Enables rejection of cooperative applications and member join requests.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. EXTEND STATUS CHECK CONSTRAINTS TO ALLOW 'rejected'
-- ==============================================================================

-- Organizations table constraint
ALTER TABLE public.organizations 
  DROP CONSTRAINT IF EXISTS organizations_status_check;

ALTER TABLE public.organizations 
  ADD CONSTRAINT organizations_status_check 
  CHECK (status IN ('active', 'suspended', 'pending', 'rejected'));

-- Organization members table constraint
ALTER TABLE public.organization_members 
  DROP CONSTRAINT IF EXISTS organization_members_status_check;

ALTER TABLE public.organization_members 
  ADD CONSTRAINT organization_members_status_check 
  CHECK (status IN ('active', 'pending', 'suspended', 'rejected'));

-- 2. HARDEN IS_PLATFORM_ADMIN FUNCTION (SUPER ADMIN ONLY)
-- ==============================================================================
-- Super Admin is strictly restricted to platform_admins OR pervej.spl@gmail.com
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = p_user_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND email = 'pervej.spl@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;

-- 3. SYNC ONLY ROOT SUPER ADMIN (Rashed Pervej) INTO PLATFORM_ADMINS TABLE
-- ==============================================================================
-- Purge any non-superadmin users (e.g. 'New User Test') from platform_admins
DELETE FROM public.platform_admins
WHERE user_id NOT IN (
  SELECT id FROM public.profiles WHERE email = 'pervej.spl@gmail.com'
);

INSERT INTO public.platform_admins (user_id, permission_level, granted_by)
SELECT id, 'platform_owner', 'SUPERUSER_ROOT'
FROM public.profiles
WHERE email = 'pervej.spl@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 4. HARDEN RLS POLICIES FOR REJECTION & UPDATES
-- ==============================================================================

-- Organizations Update Policy
DROP POLICY IF EXISTS "org_update_policy" ON public.organizations;
CREATE POLICY "org_update_policy" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin(auth.uid()) 
    OR public.is_org_admin(id, auth.uid())
  )
  WITH CHECK (
    public.is_platform_admin(auth.uid()) 
    OR public.is_org_admin(id, auth.uid())
  );

-- Organization Members Update Policy
DROP POLICY IF EXISTS "org_members_update_policy" ON public.organization_members;
CREATE POLICY "org_members_update_policy" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin(auth.uid()) 
    OR public.is_org_admin(organization_id, auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.is_platform_admin(auth.uid()) 
    OR public.is_org_admin(organization_id, auth.uid())
    OR user_id = auth.uid()
  );
