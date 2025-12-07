-- ============================================
-- QUICK SETUP: Coin Purchase System
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- 1. Update bio length constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_bio_length_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_bio_length_check;
  END IF;
  ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_bio_length_check CHECK (char_length(COALESCE(bio, '')) <= 100);
END $$;

-- 2. Add is_plus_member and is_admin columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_plus_member boolean DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 3. Create coin_purchases table
CREATE TABLE IF NOT EXISTS public.coin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_inr numeric NOT NULL,
  coins_amount integer NOT NULL,
  utr_number text NOT NULL,
  payment_screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_coin_purchases_user_id ON public.coin_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_status ON public.coin_purchases(status);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_created_at ON public.coin_purchases(created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.coin_purchases ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own purchases" ON public.coin_purchases;
DROP POLICY IF EXISTS "Users can create own purchases" ON public.coin_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.coin_purchases;
DROP POLICY IF EXISTS "Admins can update purchases" ON public.coin_purchases;

-- 7. Create RLS policies
CREATE POLICY "Users can view own purchases"
  ON public.coin_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases"
  ON public.coin_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON public.coin_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND COALESCE(profiles.is_admin, false) = true
    )
  );

CREATE POLICY "Admins can update purchases"
  ON public.coin_purchases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND COALESCE(profiles.is_admin, false) = true
    )
  );

-- 8. Create coin credit function
CREATE OR REPLACE FUNCTION credit_coins_after_verification()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_username text;
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    UPDATE public.profiles
    SET 
      coins = COALESCE(coins, 0) + NEW.coins_amount,
      is_plus_member = true,
      updated_at = now()
    WHERE id = NEW.user_id;
    
    NEW.verified_at = now();
    NEW.verified_by = auth.uid();
    
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    SELECT username INTO user_username FROM public.profiles WHERE id = NEW.user_id;
    
    PERFORM pg_notify(
      'coin_credited',
      json_build_object(
        'user_id', NEW.user_id,
        'email', user_email,
        'username', user_username,
        'coins', NEW.coins_amount,
        'amount', NEW.amount_inr
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for coin credit
DROP TRIGGER IF EXISTS trigger_credit_coins ON public.coin_purchases;
CREATE TRIGGER trigger_credit_coins
  BEFORE UPDATE ON public.coin_purchases
  FOR EACH ROW
  EXECUTE FUNCTION credit_coins_after_verification();

-- 10. Create timestamp update function
CREATE OR REPLACE FUNCTION update_coin_purchase_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for timestamp
DROP TRIGGER IF EXISTS trigger_update_coin_purchase_timestamp ON public.coin_purchases;
CREATE TRIGGER trigger_update_coin_purchase_timestamp
  BEFORE UPDATE ON public.coin_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_coin_purchase_timestamp();

-- 12. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Storage policies
DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view payment screenshots" ON storage.objects;
CREATE POLICY "Public can view payment screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-screenshots');

DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND COALESCE(profiles.is_admin, false) = true
  )
);

-- ============================================
-- SET YOURSELF AS ADMIN (IMPORTANT!)
-- Replace 'your-email@example.com' with your actual email
-- ============================================

-- Option 1: Set admin by email
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'playgenofficial@gmail.com'
);

-- Option 2: Set admin by user ID (if you know your user ID)
-- UPDATE public.profiles SET is_admin = true WHERE id = 'your-user-id-here';

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify everything is set up
-- ============================================

-- Check if table exists
SELECT 'coin_purchases table exists!' as status 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'coin_purchases';

-- Check if column exists
SELECT 'is_plus_member column exists!' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'is_plus_member';

-- Check if bucket exists
SELECT 'payment-screenshots bucket exists!' as status
FROM storage.buckets 
WHERE id = 'payment-screenshots';

-- ============================================
-- SUCCESS! 🎉
-- Your coin purchase system is now set up!
-- ============================================
