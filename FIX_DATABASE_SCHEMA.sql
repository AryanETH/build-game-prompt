-- Fix Database Schema - Add Missing Tables and Columns
-- This migration adds all missing tables and columns referenced in the TypeScript code

-- Add missing columns to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_multiplayer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS multiplayer_type TEXT,
ADD COLUMN IF NOT EXISTS graphics_quality TEXT,
ADD COLUMN IF NOT EXISTS sound_url TEXT,
ADD COLUMN IF NOT EXISTS original_game_id UUID REFERENCES public.games(id),
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS background_sound_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'gif')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_duration INTEGER,
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- Create game_comments table
CREATE TABLE IF NOT EXISTS public.game_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  likes_count INTEGER DEFAULT 0,
  parent_comment_id UUID REFERENCES public.game_comments(id) ON DELETE CASCADE
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES public.game_comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('game_published', 'game_creating', 'game_liked', 'user_followed', 'game_played')),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Enable Row Level Security for new tables
ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_comments
CREATE POLICY IF NOT EXISTS "Comments are viewable by everyone"
  ON public.game_comments FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create comments"
  ON public.game_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own comments"
  ON public.game_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own comments"
  ON public.game_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY IF NOT EXISTS "Comment likes are viewable by everyone"
  ON public.comment_likes FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can like comments"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can unlike comments"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for follows
CREATE POLICY IF NOT EXISTS "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY IF NOT EXISTS "Users can unfollow others"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies for notifications
CREATE POLICY IF NOT EXISTS "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_activities
CREATE POLICY IF NOT EXISTS "Activities are viewable by everyone"
  ON public.user_activities FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can log activities"
  ON public.user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for direct_messages
CREATE POLICY IF NOT EXISTS "Users can view their own messages"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY IF NOT EXISTS "Authenticated users can send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.game_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.game_comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for comment likes count
DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON public.comment_likes;
CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

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
    SET comments_count = comments_count - 1
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for comments count
DROP TRIGGER IF EXISTS update_game_comments_count_trigger ON public.game_comments;
CREATE TRIGGER update_game_comments_count_trigger
  AFTER INSERT OR DELETE ON public.game_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_game_comments_count();

-- Update existing data to have default values for new columns
UPDATE public.games SET 
  comments_count = 0 WHERE comments_count IS NULL,
  is_multiplayer = false WHERE is_multiplayer IS NULL,
  is_live = false WHERE is_live IS NULL;

UPDATE public.profiles SET 
  coins = 0 WHERE coins IS NULL;