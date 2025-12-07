-- Coin Purchase System with UTR Verification

-- Add is_plus_member to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_plus_member boolean DEFAULT false;

-- Coin purchase transactions table
CREATE TABLE IF NOT EXISTS public.coin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_inr numeric NOT NULL, -- Amount in rupees
  coins_amount integer NOT NULL, -- Coins to be credited (amount * 2)
  utr_number text NOT NULL, -- UTR/Transaction reference
  payment_screenshot_url text, -- Optional screenshot
  status text NOT NULL DEFAULT 'pending', -- pending, verified, rejected
  verified_by uuid REFERENCES auth.users(id), -- Admin who verified
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coin_purchases_user_id ON public.coin_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_status ON public.coin_purchases(status);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_created_at ON public.coin_purchases(created_at DESC);

-- RLS Policies
ALTER TABLE public.coin_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.coin_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own purchases
CREATE POLICY "Users can create own purchases"
  ON public.coin_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
  ON public.coin_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Admins can update purchases (verify/reject)
CREATE POLICY "Admins can update purchases"
  ON public.coin_purchases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Function to credit coins after verification
CREATE OR REPLACE FUNCTION credit_coins_after_verification()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_username text;
BEGIN
  -- If status changed to 'verified', credit the coins
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    -- Add coins to user's profile
    UPDATE public.profiles
    SET 
      coins = COALESCE(coins, 0) + NEW.coins_amount,
      is_plus_member = true,
      updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Set verification timestamp
    NEW.verified_at = now();
    NEW.verified_by = auth.uid();
    
    -- Get user email and username for notification
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    SELECT username INTO user_username
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Send email notification (async via pg_net or edge function)
    -- This will be called from the application layer
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

-- Trigger to auto-credit coins
DROP TRIGGER IF EXISTS trigger_credit_coins ON public.coin_purchases;
CREATE TRIGGER trigger_credit_coins
  BEFORE UPDATE ON public.coin_purchases
  FOR EACH ROW
  EXECUTE FUNCTION credit_coins_after_verification();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_coin_purchase_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coin_purchase_timestamp ON public.coin_purchases;
CREATE TRIGGER trigger_update_coin_purchase_timestamp
  BEFORE UPDATE ON public.coin_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_coin_purchase_timestamp();
