-- ============================================
-- COPY AND RUN THIS ENTIRE SCRIPT NOW
-- ============================================

-- 1. Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_plus_member boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Create coin_purchases table
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

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_coin_purchases_user_id ON public.coin_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_status ON public.coin_purchases(status);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_created_at ON public.coin_purchases(created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.coin_purchases ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies
DROP POLICY IF EXISTS "Users can view own purchases" ON public.coin_purchases;
DROP POLICY IF EXISTS "Users can create own purchases" ON public.coin_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.coin_purchases;
DROP POLICY IF EXISTS "Admins can update purchases" ON public.coin_purchases;

-- 6. Create policies
CREATE POLICY "Users can view own purchases" ON public.coin_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own purchases" ON public.coin_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.coin_purchases FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND COALESCE(profiles.is_admin, false) = true));
CREATE POLICY "Admins can update purchases" ON public.coin_purchases FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND COALESCE(profiles.is_admin, false) = true));

-- 7. Create functions
CREATE OR REPLACE FUNCTION credit_coins_after_verification() RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_username text;
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    UPDATE public.profiles SET coins = COALESCE(coins, 0) + NEW.coins_amount, is_plus_member = true, updated_at = now() WHERE id = NEW.user_id;
    NEW.verified_at = now();
    NEW.verified_by = auth.uid();
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    SELECT username INTO user_username FROM public.profiles WHERE id = NEW.user_id;
    PERFORM pg_notify('coin_credited', json_build_object('user_id', NEW.user_id, 'email', user_email, 'username', user_username, 'coins', NEW.coins_amount, 'amount', NEW.amount_inr)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_coin_purchase_timestamp() RETURNS TRIGGER AS $$
BEGIN

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers
DROP TRIGGER IF EXISTS trigger_credit_coins ON public.coin_purchases;
CREATE TRIGGER trigger_credit_coins BEFORE UPDATE ON public.coin_purchases FOR EACH ROW EXECUTE FUNCTION credit_coins_after_verification();

DROP TRIGGER IF EXISTS trigger_update_coin_purchase_timestamp ON public.coin_purchases;
CREATE TRIGGER trigger_update_coin_purchase_timestamp BEFORE UPDATE ON public.coin_purchases FOR EACH ROW EXECUTE FUNCTION update_coin_purchase_timestamp();

-- 9. SET YOU AS ADMIN (IMPORTANT!)
UPDATE public.profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'playgenofficial@gmail.com');

-- 10. VERIFY EVERYTHING
SELECT 'Setup Complete! ✅' as status;
SELECT 'coin_purchases table exists' as check, COUNT(*) as count FROM public.coin_purchases;
SELECT 'Your admin status' as check, email, username, is_admin, is_plus_member, coins FROM auth.users u JOIN public.profiles p ON p.id = u.id WHERE u.email = 'playgenofficial@gmail.com';
