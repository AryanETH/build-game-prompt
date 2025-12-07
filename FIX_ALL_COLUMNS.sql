-- ============================================
-- FIX ALL MISSING COLUMNS
-- Copy and run this entire script in Supabase SQL Editor
-- ============================================

-- 1. Add all missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_plus_member boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Create or replace the trigger function WITHOUT updated_at
CREATE OR REPLACE FUNCTION credit_coins_after_verification()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_username text;
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    -- Credit coins and set plus member (without updating updated_at)
    UPDATE public.profiles
    SET 
      coins = COALESCE(coins, 0) + NEW.coins_amount,
      is_plus_member = true
    WHERE id = NEW.user_id;
    
    NEW.verified_at = now();
    NEW.verified_by = auth.uid();
    
    -- Get user info for notification
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    SELECT username INTO user_username FROM public.profiles WHERE id = NEW.user_id;
    
    -- Notify (for future email integration)
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

-- 3. Make sure trigger exists
DROP TRIGGER IF EXISTS trigger_credit_coins ON public.coin_purchases;
CREATE TRIGGER trigger_credit_coins
  BEFORE UPDATE ON public.coin_purchases
  FOR EACH ROW
  EXECUTE FUNCTION credit_coins_after_verification();

-- 4. Set you as admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'playgenofficial@gmail.com');

-- 5. Verify everything
SELECT 'All columns added! ✅' as status;

SELECT 
  'Your profile:' as info,
  username,
  coins,
  is_admin,
  is_plus_member
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'playgenofficial@gmail.com');

SELECT 'Ready to verify payments! ✅' as status;
