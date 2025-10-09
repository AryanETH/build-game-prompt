-- Add multiplayer and graphics columns to games table
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS is_multiplayer BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS multiplayer_type TEXT,
  ADD COLUMN IF NOT EXISTS graphics_quality TEXT DEFAULT 'high';

-- Helpful comments for db docs
COMMENT ON COLUMN public.games.is_multiplayer IS 'Whether the game is intended to be played by multiple people';
COMMENT ON COLUMN public.games.multiplayer_type IS 'Type of multiplayer (co-op, versus, turn-based, real-time, party)';
COMMENT ON COLUMN public.games.graphics_quality IS 'Target graphics quality preset (low, medium, high, ultra, realistic)';
