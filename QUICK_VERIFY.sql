-- ============================================================================
-- QUICK VERIFICATION (Run this last to check everything)
-- ============================================================================

-- Check tables exist
SELECT 
  table_name,
  '✅ Exists' as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('game_comments', 'comment_likes', 'media_library')
ORDER BY table_name;

-- Count everything
SELECT 
  (SELECT COUNT(*) FROM public.games) as games,
  (SELECT COUNT(*) FROM public.game_comments) as comments,
  (SELECT COUNT(*) FROM public.game_comments WHERE content LIKE '[GIF]%') as gifs,
  (SELECT COUNT(*) FROM public.comment_likes) as likes,
  (SELECT COUNT(*) FROM public.media_library WHERE type = 'sfx') as sfx,
  (SELECT COUNT(*) FROM public.media_library WHERE type = 'music') as music;

-- Show recent comments (including GIFs)
SELECT 
  c.content,
  CASE WHEN c.content LIKE '[GIF]%' THEN '🎬 GIF' ELSE '💬 Text' END as type,
  c.likes_count,
  u.username,
  c.created_at
FROM public.game_comments c
LEFT JOIN public.profiles u ON u.id = c.user_id
ORDER BY c.created_at DESC
LIMIT 10;

-- Show media library
SELECT type, COUNT(*) as count
FROM public.media_library
GROUP BY type;
