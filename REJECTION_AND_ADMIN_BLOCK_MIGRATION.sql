-- ==============================================================================
-- REJECTION REASONS & ADMIN QUALIFICATION BLOCK MIGRATION
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Profiles Table: Add admin block columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin_blocked boolean DEFAULT false;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS admin_blocked_reason text;

-- 2. Organizations Table: Add rejection columns
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- 3. Organization Members Table: Add rejection columns
ALTER TABLE public.organization_members 
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.organization_members 
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
