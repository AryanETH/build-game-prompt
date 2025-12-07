-- ============================================
-- VERIFICATION SCRIPT
-- Run this to check if everything is set up correctly
-- ============================================

-- 1. Check if coin_purchases table exists
SELECT 
  'coin_purchases table' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'coin_purchases'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Check if is_plus_member column exists
SELECT 
  'is_plus_member column' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'is_plus_member'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 3. Check if is_admin column exists
SELECT 
  'is_admin column' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'is_admin'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 4. Check if storage bucket exists
SELECT 
  'payment-screenshots bucket' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'payment-screenshots'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 5. Check your admin status
SELECT 
  'Your admin status' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.email = 'playgenofficial@gmail.com' AND p.is_admin = true
    ) THEN '✅ YOU ARE ADMIN' 
    ELSE '❌ NOT ADMIN' 
  END as status;

-- 6. Show your profile details
SELECT 
  u.email,
  p.username,
  p.is_admin,
  p.is_plus_member,
  p.coins
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'playgenofficial@gmail.com';

-- ============================================
-- If all show ✅, you're ready to go!
-- ============================================
