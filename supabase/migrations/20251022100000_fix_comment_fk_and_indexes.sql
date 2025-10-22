-- Ensure FK on game_comments.user_id -> profiles(id) and add indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'game_comments'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'game_comments_user_id_fkey'
  ) THEN
    ALTER TABLE public.game_comments
      ADD CONSTRAINT game_comments_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful index for creator lookups in feeds and profiles
CREATE INDEX IF NOT EXISTS idx_games_creator_id ON public.games(creator_id);
