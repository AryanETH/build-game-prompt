-- Add public/private visibility and tighten SELECT policy
BEGIN;

-- 1) Visibility flag on games
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Index to speed up common queries
CREATE INDEX IF NOT EXISTS idx_games_is_public ON public.games(is_public);

-- 2) Replace permissive SELECT policy with visibility-aware policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'games' AND policyname = 'Games are viewable by everyone'
  ) THEN
    EXECUTE 'DROP POLICY "Games are viewable by everyone" ON public.games';
  END IF;
END $$;

-- Ensure RLS is enabled (idempotent if already on)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow selecting a game if it's public OR owned by the requester
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'games' AND policyname = 'Public or own games selectable'
  ) THEN
    EXECUTE 'CREATE POLICY "Public or own games selectable" ON public.games FOR SELECT USING (is_public OR auth.uid() = creator_id)';
  END IF;
END $$;

COMMIT;