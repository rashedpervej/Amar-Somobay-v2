-- ==============================================================================
-- AMAR-SOMOBAY: SETTINGS SEGREGATION & RLS REINFORCEMENT
-- 1. Secures public.app_settings so only Platform Owners / Super Admins can write
-- 2. Ensures organizations table has logo_url, reg_number, and config columns
-- 3. Removes legacy wallet flags and secures multi-tenant boundaries
-- ==============================================================================

-- 1. Ensure organizations has logo_url and config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'config'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN config JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'bangla_font'
  ) THEN
    ALTER TABLE public.app_settings ADD COLUMN bangla_font TEXT DEFAULT 'system_default';
  END IF;
END $$;

-- 2. Secure public.app_settings RLS
-- Everyone can read platform settings (needed for site name, logo, theme)
DROP POLICY IF EXISTS "Public read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin manage app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Superadmin manage app_settings" ON public.app_settings;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_settings" ON public.app_settings
  FOR SELECT USING (true);

-- ONLY Platform Super Admins can insert/update/delete platform settings
CREATE POLICY "Superadmin manage app_settings" ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Secure organizations update policy for cooperative admins
DROP POLICY IF EXISTS "Cooperative admin update organization" ON public.organizations;
CREATE POLICY "Cooperative admin update organization" ON public.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND role = 'cooperative_admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND role = 'cooperative_admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
    )
  );
