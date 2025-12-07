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
