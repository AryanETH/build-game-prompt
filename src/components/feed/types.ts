// Shared types for feed components
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
}

export type GameWithCreator = Game & {
  creator?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

export interface FeedProps {
  games: GameWithCreator[];
  userId: string | null;
  likedGames: Set<string>;
  followedUsers: Set<string>;
  commentsCount: Record<string, number>;
  onPlay: (game: Game) => void;
  onLike: (gameId: string, isLiked: boolean) => void;
  onShare: (game: Game) => void;
  onRemix: (game: GameWithCreator) => void;
  onComment: (game: GameWithCreator) => void;
  onFollow: (creatorId: string) => void;
  onNavigateToProfile: (username: string) => void;
}
