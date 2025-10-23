-- Add onboarding, personalization, and safety fields to profiles
DO $$
BEGIN
  -- display_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name text;
  END IF;

  -- bio (limit to 150 chars via check)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio text;
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_bio_length_check CHECK (char_length(COALESCE(bio, '')) <= 150);
  END IF;

  -- date_of_birth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='date_of_birth'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth date;
  END IF;

  -- age_tier: 1=Kids,2=Teens,3=Young Adults,4=Adults
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='age_tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN age_tier smallint;
  END IF;

  -- onboarding_complete
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='onboarding_complete'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_complete boolean DEFAULT false;
  END IF;

  -- interests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='interests'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN interests text[] DEFAULT '{}';
  END IF;

  -- goal ("create" | "play" | "both") - loosen to text initially
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='goal'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN goal text;
  END IF;

  -- skill_level ("beginner" | "intermediate" | "expert")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='skill_level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN skill_level text;
  END IF;

  -- device_type ("mobile" | "tablet" | "desktop")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='device_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN device_type text;
  END IF;

  -- preferred_styles (e.g., ["2d-platformer", "simulation"])
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='preferred_styles'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_styles text[] DEFAULT '{}';
  END IF;

  -- region and language
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='region'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN region text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='language'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN language text;
  END IF;

  -- consents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='ai_personalization_consent'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ai_personalization_consent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='guardian_consent'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN guardian_consent boolean DEFAULT false;
  END IF;

  -- avatar_choice (identifier for predesigned avatar), distinct from avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='avatar_choice'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_choice text;
  END IF;

  -- phone (optional cache of user's phone for convenience; authoritative in auth.users)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;

  -- trust & safety score (basic placeholder)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='trust_score'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trust_score integer DEFAULT 50;
  END IF;
END $$;

-- Helpful index for age tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_age_tier ON public.profiles(age_tier);
