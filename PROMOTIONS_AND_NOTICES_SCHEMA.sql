-- =========================================================================
-- AMAR SOMOBAY: PROMOTIONS, NOTICES & MEETINGS SCHEMA (OPTIONAL SUPABASE SETUP)
-- =========================================================================
-- This script creates the 'promotions' table in Supabase if you wish to store
-- promotions, circular notices, and meetings in Supabase cloud database.
-- Note: The application also supports local Express/JSON persistence out-of-the-box.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  category TEXT DEFAULT 'লক্ষ্য',
  template_type TEXT DEFAULT 'target_promo',
  
  -- Target Destinations
  show_as_card BOOLEAN DEFAULT true,
  show_in_notices BOOLEAN DEFAULT false,
  show_in_meetings BOOLEAN DEFAULT false,
  show_as_popup BOOLEAN DEFAULT false,
  
  -- Card Configuration
  image_url TEXT,
  right_widget_type TEXT DEFAULT 'progress',
  target_text TEXT DEFAULT '',
  progress_percent NUMERIC DEFAULT 0,
  button_text TEXT DEFAULT 'বিস্তারিত দেখুন',
  button_link TEXT,
  badge_text TEXT,
  
  -- Details Content
  details_image_url TEXT,
  details_content TEXT DEFAULT '',
  
  -- Call to Action
  cta_type TEXT DEFAULT 'somobay',
  cta_phone TEXT,
  cta_text TEXT DEFAULT 'আমার সমিতি দেখুন',
  cta_link TEXT DEFAULT '/somobay/my',
  
  -- Meeting Details & Schedule
  meeting_date TEXT,
  meeting_time TEXT,
  meeting_location TEXT,
  meeting_status TEXT DEFAULT 'upcoming', -- 'upcoming' | 'completed' | 'cancelled'
  
  -- Analytics & Tracking
  views_count INTEGER DEFAULT 0,
  viewers JSONB DEFAULT '[]'::jsonb,
  attendees JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Allow everyone (authenticated + anon) to read active promotions/notices
CREATE POLICY "Allow public read access to active promotions"
  ON public.promotions
  FOR SELECT
  USING (true);

-- Allow authenticated admins to insert/update/delete promotions
CREATE POLICY "Allow authenticated users to manage promotions"
  ON public.promotions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON public.promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON public.promotions(created_at DESC);
