-- ============================================================
-- Profile Fields Migration
-- Adds fields per finalized profile design:
--   Personal: gender, date_of_birth, phone_verified
--   Address: division, district, upazila, union_pouro, village
-- Removes reliance on bio for completion (bio kept for backward compat).
-- ============================================================

-- 1. Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text
  CHECK (gender IS NULL OR gender IN ('male','female','other'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified boolean
  NOT NULL DEFAULT false;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upazila text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS union_pouro text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS village text;

-- 2. Ensure phone column exists (added earlier, idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 3. Update RLS: users can update own profile (already exists; re-declare for safety)
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. (Optional) Backfill phone_verified for existing users who already have a phone
-- UPDATE public.profiles SET phone_verified = true WHERE phone IS NOT NULL AND phone <> '';

-- 5. Index for address-based queries (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_division ON public.profiles(division);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON public.profiles(district);
