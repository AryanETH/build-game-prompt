-- Add parent_comment_id column to game_comments for nested replies
ALTER TABLE public.game_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.game_comments(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_game_comments_parent ON public.game_comments(parent_comment_id);
