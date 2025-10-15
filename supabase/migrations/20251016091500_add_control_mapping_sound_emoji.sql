-- Add control mapping and sound effects to games, and emoji cursor to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='games' AND column_name='control_mapping'
  ) THEN
    ALTER TABLE public.games ADD COLUMN control_mapping jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='games' AND column_name='sound_effects'
  ) THEN
    ALTER TABLE public.games ADD COLUMN sound_effects jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='emoji_cursor'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN emoji_cursor text;
  END IF;
END $$;

COMMENT ON COLUMN public.games.control_mapping IS 'Serialized control bindings for desktop/mobile';
COMMENT ON COLUMN public.games.sound_effects IS 'Map of game SFX assets or parameters';
COMMENT ON COLUMN public.profiles.emoji_cursor IS 'Preferred emoji cursor for desktop sessions (optional)';
