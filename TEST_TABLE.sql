-- ============================================
-- SIMPLE TEST - Does the table exist?
-- ============================================

-- Test 1: Check if table exists
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'coin_purchases'
  ) THEN 'YES - Table exists ✅' 
  ELSE 'NO - Table does NOT exist ❌ (You need to run RUN_THIS_NOW.sql)' 
  END as result;

-- Test 2: If table exists, try to count rows
SELECT COUNT(*) as total_rows FROM public.coin_purchases;

-- Test 3: Check your admin status
SELECT 
  email,
  COALESCE(is_admin, false) as is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE email = 'playgenofficial@gmail.com';
