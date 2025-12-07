-- ============================================
-- ADD COINS COLUMN TO PROFILES
-- Run this in Supabase SQL Editor NOW
-- ============================================

-- Add coins column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;

-- Verify it was added
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('coins', 'is_admin', 'is_plus_member');

-- Check your profile
SELECT 
  username,
  coins,
  is_admin,
  is_plus_member
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'playgenofficial@gmail.com');
