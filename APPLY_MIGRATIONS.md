# 🔧 Apply Database Migrations

## Error: "Could not find the table 'public.coin_purchases'"

This means the database migrations haven't been applied yet. Follow these steps:

## Option 1: Using Supabase CLI (Recommended)

### Step 1: Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### Step 2: Link to your project
```bash
supabase link --project-ref your-project-ref
```

### Step 3: Apply migrations
```bash
supabase db push
```

This will apply all pending migrations including:
- `20251207000000_update_bio_length.sql`
- `20251207000001_coin_purchase_system.sql`
- `20251207000002_payment_screenshots_bucket.sql`

## Option 2: Using Supabase Dashboard (Manual)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor"

### Step 2: Run Migration 1 - Update Bio Length
Copy and paste this SQL:

```sql
-- Update bio length constraint from 150 to 100 characters
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_bio_length_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_bio_length_check;
  END IF;

  -- Add new constraint with 100 char limit
  ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_bio_length_check CHECK (char_length(COALESCE(bio, '')) <= 100);
END $$;
```

Click "Run" ✅

### Step 3: Run Migration 2 - Coin Purchase System
Copy and paste this SQL:

```sql
-- Coin Purchase System with UTR Verification

-- Add is_plus_member to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_plus_member boolean DEFAULT false;

-- Coin purchase transactions table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coin_purchases_user_id ON public.coin_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_status ON public.coin_purchases(status);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_created_at ON public.coin_purchases(created_at DESC);

-- Enable RLS
ALTER TABLE public.coin_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own purchases" ON public.coin_purchases;
CREATE POLICY "Users can view own purchases"
  ON public.coin_purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own purchases" ON public.coin_purchases;
CREATE POLICY "Users can create own purchases"
  ON public.coin_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.coin_purchases;
CREATE POLICY "Admins can view all purchases"
  ON public.coin_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update purchases" ON public.coin_purchases;
CREATE POLICY "Admins can update purchases"
  ON public.coin_purchases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Function to credit coins
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

-- Trigger
DROP TRIGGER IF EXISTS trigger_credit_coins ON public.coin_purchases;
CREATE TRIGGER trigger_credit_coins
  BEFORE UPDATE ON public.coin_purchases
  FOR EACH ROW
  EXECUTE FUNCTION credit_coins_after_verification();

-- Update timestamp function
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
```

Click "Run" ✅

### Step 4: Run Migration 3 - Storage Bucket
Copy and paste this SQL:

```sql
-- Create storage bucket for payment screenshots

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
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
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
```

Click "Run" ✅

## Verify Migrations Applied

### Check if table exists:
```sql
SELECT * FROM public.coin_purchases LIMIT 1;
```

If this returns "Success" (even with 0 rows), the table is created! ✅

### Check if column exists:
```sql
SELECT is_plus_member FROM public.profiles LIMIT 1;
```

If this works, the column is added! ✅

## After Applying Migrations

1. Refresh your application
2. Go to Admin panel
3. Click on "Coins" tab
4. You should see "No coin purchases yet" instead of an error

## Troubleshooting

### Error: "permission denied"
- Make sure you're logged in as admin
- Check your Supabase project permissions

### Error: "relation already exists"
- This is OK! It means the table was already created
- The migration uses `IF NOT EXISTS` to prevent errors

### Still getting errors?
1. Check Supabase logs in Dashboard > Logs
2. Verify your project is connected
3. Try running migrations one by one

---

**Need Help?**
- Check Supabase Dashboard > Database > Tables
- Look for `coin_purchases` table
- If it exists, the migration worked!
