-- ============================================
-- DIAGNOSTIC SCRIPT
-- Run this to see what's wrong
-- ============================================

-- 1. Check if table exists
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'coin_purchases'
  ) THEN 'Table EXISTS ✅' ELSE 'Table MISSING ❌' END as table_status;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'coin_purchases'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'coin_purchases';

-- 4. Check policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'coin_purchases';

-- 5. Check your user
SELECT 
  u.id as user_id,
  u.email,
  p.username,
  p.is_admin,
  p.is_plus_member
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'playgenofficial@gmail.com';

-- 6. Try to select from table
SELECT COUNT(*) as total_purchases FROM public.coin_purchases;

-- 7. Check if you can insert (test)
-- Don't worry if this fails, it's just a test
SELECT 'If you see this, basic access works' as test;
