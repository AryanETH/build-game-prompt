// Core type definitions for the application

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  coins: number;
  is_plus_member: boolean;
  followers_count: number;
  following_count: number;
  xp: number;
  created_at?: string;
  updated_at?: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  game_code: string;
  thumbnail_url: string;
  cover_url?: string | null;
  likes_count: number;
  plays_count: number;
  comments_count?: number;
  creator_id: string;
  is_multiplayer?: boolean | null;
  multiplayer_type?: string | null;
  graphics_quality?: string | null;
  sound_url?: string | null;
  original_game_id?: string | null;
  country?: string | null;
  city?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GameWithCreator extends Game {
  creator?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  game_id: string;
  likes_count?: number;
  parent_comment_id?: string | null;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface GameLike {
  user_id: string;
  game_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: 'game_created' | 'game_played' | 'game_liked' | 'user_followed' | 'comment_added';
  game_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface CoinPurchase {
  id: string;
  user_id: string;
  amount: number;
  coins: number;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

// New feature types

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement_type: string;
  requirement_value: number;
  coins_reward: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  game_id: string;
  challenger_score: number;
  challenged_score: number | null;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  created_at: string;
  expires_at: string;
}

export interface GameReaction {
  id: string;
  game_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  game_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  game_id: string;
  name: string;
  description: string;
  entry_fee: number;
  prize_pool: number;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'active' | 'completed';
  max_participants: number;
  created_at: string;
}

export interface TournamentParticipant {
  tournament_id: string;
  user_id: string;
  score: number;
  rank: number | null;
  joined_at: string;
}
