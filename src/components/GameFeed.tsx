import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "./GameCard";
import { GamePlayer } from "./GamePlayer";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Game {
  id: string;
  title: string;
  description: string;
  game_code: string;
  thumbnail_url: string;
  cover_url?: string | null;
  likes_count: number;
  plays_count: number;
  creator_id: string;
  is_multiplayer?: boolean | null;
  multiplayer_type?: string | null;
  graphics_quality?: string | null;
}

export const GameFeed = () => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: games, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Game[];
    },
  });

  const { data: userLikes } = useQuery({
    queryKey: ['userLikes', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('game_likes')
        .select('game_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (userLikes) {
      setLikedGames(new Set(userLikes.map(like => like.game_id)));
    }
  }, [userLikes]);

  const likeMutation = useMutation({
    mutationFn: async ({ gameId, isLiked }: { gameId: string; isLiked: boolean }) => {
      if (!userId) {
        toast.error("Please sign in to like games");
        return;
      }

      if (isLiked) {
        const { error } = await supabase
          .from('game_likes')
          .delete()
          .eq('game_id', gameId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('game_likes')
          .insert({ game_id: gameId, user_id: userId });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { gameId, isLiked }) => {
      setLikedGames(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(gameId);
        } else {
          newSet.add(gameId);
        }
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  const handlePlay = async (game: Game) => {
    setSelectedGame(game);
    
    // Increment play count
    if (userId) {
      await supabase
        .from('games')
        .update({ plays_count: game.plays_count + 1 })
        .eq('id', game.id);
      
      queryClient.invalidateQueries({ queryKey: ['games'] });
    }
  };

  const handleShare = (game: Game) => {
    const shareUrl = `${window.location.origin}?game=${game.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Game link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedGame) {
    return (
      <GamePlayer
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    );
  }

  // TikTok-style vertical snapping feed
  return (
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <div className="absolute inset-0 overflow-y-auto no-scrollbar snap-y snap-mandatory">
        {games?.map((game) => (
          <section key={game.id} className="relative h-[calc(100vh-8rem)] w-full snap-start">
            <img
              src={game.cover_url || game.thumbnail_url || "/placeholder.svg"}
              alt={game.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

            {/* Right-side actions */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4">
              <button
                aria-label={likedGames.has(game.id) ? 'Unlike' : 'Like'}
                onClick={() => likeMutation.mutate({ gameId: game.id, isLiked: likedGames.has(game.id) })}
                className={`h-12 w-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-smooth ${likedGames.has(game.id) ? 'ring-2 ring-red-500' : ''}`}
              >
                <svg viewBox="0 0 24 24" className={`h-6 w-6 ${likedGames.has(game.id) ? 'fill-red-500 text-red-500' : 'text-white'}`}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.22 2.53C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="sr-only">Like</span>
              </button>

              <button
                onClick={() => handleShare(game)}
                className="h-12 w-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-smooth text-white"
                aria-label="Share"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 000-1.39l7.02-4.11A3 3 0 0018 7.91a3.09 3.09 0 10-3.09-3.09c0 .23.03.45.08.66L7.91 9.59A3.09 3.09 0 004.91 9a3.09 3.09 0 103.09 3.09c0-.23-.03-.45-.08-.66l7.08 4.15c.49.45 1.14.73 1.86.73a3.09 3.09 0 103.09-3.09 3.09 3.09 0 00-3.09-3.09z"/>
                </svg>
              </button>

              <button
                onClick={() => handlePlay(game)}
                className="h-12 w-12 rounded-full flex items-center justify-center bg-primary hover:opacity-90 transition-smooth text-white"
                aria-label="Play"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            {/* Bottom details */}
            <div className="absolute left-4 right-20 bottom-8 text-white">
              <h3 className="text-2xl font-bold mb-2 drop-shadow-md">{game.title}</h3>
              <p className="text-white/80 line-clamp-2 max-w-xl mb-3">{game.description || ''}</p>
              <div className="text-sm text-white/70">{game.plays_count} plays • {game.likes_count} likes</div>
            </div>
          </section>
        ))}

        {games?.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">No games yet</h3>
              <p className="text-muted-foreground">Be the first to create a game!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};