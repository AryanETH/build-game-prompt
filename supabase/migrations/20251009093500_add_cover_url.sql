-- Add cover_url column for full-bleed background images
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

COMMENT ON COLUMN public.games.cover_url IS 'Large cover image for vertical feed backgrounds';
