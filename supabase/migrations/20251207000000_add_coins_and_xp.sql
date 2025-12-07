-- Add coins and xp fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Update existing profiles with default values
UPDATE public.profiles
SET coins = 0
WHERE coins IS NULL;

UPDATE public.profiles
SET xp = 0
WHERE xp IS NULL;
