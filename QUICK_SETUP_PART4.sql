-- ============================================================================
-- PART 4: BACKFILL COUNTS (Run this fourth)
-- ============================================================================

-- Backfill comments_count for games
UPDATE public.games g
SET comments_count = (
  SELECT COUNT(*)
  FROM public.game_comments c
  WHERE c.game_id = g.id
)
WHERE comments_count IS NULL 
   OR comments_count != (
     SELECT COUNT(*)
     FROM public.game_comments c
     WHERE c.game_id = g.id
   );

-- Backfill likes_count for comments
UPDATE public.game_comments gc
SET likes_count = (
  SELECT COUNT(*)
  FROM public.comment_likes cl
  WHERE cl.comment_id = gc.id
)
WHERE likes_count IS NULL 
   OR likes_count != (
     SELECT COUNT(*)
     FROM public.comment_likes cl
     WHERE cl.comment_id = gc.id
   );
