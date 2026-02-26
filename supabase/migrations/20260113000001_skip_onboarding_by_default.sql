-- Skip onboarding by default - users go straight to /feed after signup

-- Update the handle_new_user function to set onboarding_complete = true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    name, 
    avatar_url, 
    coins, 
    xp,
    onboarding_complete  -- Set to true by default
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    100, -- Starting coins
    0,   -- Starting XP
    true -- Skip onboarding, go straight to feed
  );
  RETURN NEW;
END;
$$;

-- Update existing profiles to skip onboarding
UPDATE public.profiles 
SET onboarding_complete = true 
WHERE onboarding_complete IS NULL OR onboarding_complete = false;
