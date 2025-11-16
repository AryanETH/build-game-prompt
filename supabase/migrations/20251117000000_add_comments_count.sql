-- Add comments_count column to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Update existing games with current comment counts
UPDATE public.games
SET comments_count = (
  SELECT COUNT(*)
  FROM public.game_comments
  WHERE game_comments.game_id = games.id
);

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_game_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.games
    SET comments_count = comments_count + 1
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.games
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_game_comments_count_trigger ON public.game_comments;

-- Trigger for comments count
CREATE TRIGGER update_game_comments_count_trigger
  AFTER INSERT OR DELETE ON public.game_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_game_comments_count();
