import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "./GameCard";
import { GamePlayer } from "./GamePlayer";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LocationFilter } from "./LocationFilter";
import { useLocationContext } from "@/context/LocationContext";
import { useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

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
  sound_url?: string | null;
  original_game_id?: string | null;
  country?: string | null;
  city?: string | null;
}

type GameWithCreator = Game & {
  creator?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  game_id: string;
  user?: { id: string; username: string; avatar_url: string | null } | null;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export const GameFeed = () => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mode: globalMode, city: globalCity, country: globalCountry } = useLocationContext();
  const [locationMode, setLocationMode] = useState<"global" | "country" | "city">(globalMode);
  const [locationFilter, setLocationFilter] = useState<string | undefined>(globalMode === 'city' ? globalCity ?? undefined : globalMode === 'country' ? globalCountry ?? undefined : undefined);
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Keep local filters synced with global context changes
    setLocationMode(globalMode);
    const nextFilter = globalMode === 'city' ? (globalCity ?? undefined) : globalMode === 'country' ? (globalCountry ?? undefined) : undefined;
    setLocationFilter(nextFilter);
  }, [globalMode, globalCity, globalCountry]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const pageSize = 10;
  const { data: pages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['games'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('games')
        .select('id, title, description, thumbnail_url, cover_url, likes_count, plays_count, creator_id, is_multiplayer, multiplayer_type, graphics_quality, sound_url, country, city, original_game_id')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || []) as unknown as GameWithCreator[];
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length === pageSize ? allPages.length : undefined),
    initialPageParam: 0,
  });

  const games = useMemo(() => (pages?.pages || []).flat(), [pages]);

  // Hydrate creator username/avatar without joins to avoid RLS issues
  const uniqueCreatorIds = useMemo(
    () => Array.from(new Set(games.map((g) => g.creator_id))).filter(Boolean),
    [games]
  );

  const { data: creatorProfiles = [] } = useQuery({
    queryKey: ['creatorProfiles', uniqueCreatorIds],
    enabled: uniqueCreatorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', uniqueCreatorIds as string[]);
      if (error) return [] as Profile[]; // fail-soft: keep feed rendering
      return (data || []) as Profile[];
    },
  });

  const creatorById = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const p of creatorProfiles) map.set(p.id, p);
    return map;
  }, [creatorProfiles]);

  const hydratedGames: GameWithCreator[] = useMemo(
    () => games.map((g) => ({ ...g, creator: creatorById.get(g.creator_id) ?? null })),
    [games, creatorById]
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
    }, { root: null, rootMargin: "200px", threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelRef.current, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    // Fetch full game data including game_code
    const { data: fullGame, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', game.id)
      .single();
    
    if (error || !fullGame) {
      toast.error("Failed to load game");
      return;
    }
    
    setSelectedGame(fullGame as Game);
    
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

  // Realtime: refetch feed on any games change
  useEffect(() => {
    const channel = supabase
      .channel('realtime:games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        queryClient.invalidateQueries({ queryKey: ['games'] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  // Remix dialog state
  const [remixFor, setRemixFor] = useState<GameWithCreator | null>(null);
  const [remixPrompt, setRemixPrompt] = useState("");
  const [remixTitle, setRemixTitle] = useState("");
  const [isRemixing, setIsRemixing] = useState(false);

  const handleSubmitRemix = async () => {
    if (!remixFor || !remixPrompt.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to remix games');
      return;
    }
    try {
      setIsRemixing(true);
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: { prompt: remixPrompt, options: {} },
      });
      if (error) throw error;
      const gameCode: string = data.gameCode;

      const newTitle = remixTitle.trim() || `Remix: ${remixFor.title}`;
      const payload: any = {
        title: newTitle,
        description: `Remix of ${remixFor.title}${remixFor.creator?.username ? ` by @${remixFor.creator.username}` : ''}`,
        game_code: gameCode,
        creator_id: user.id,
        thumbnail_url: remixFor.thumbnail_url || null,
        cover_url: remixFor.cover_url || remixFor.thumbnail_url || null,
        sound_url: null,
        original_game_id: remixFor.id,
        country: null,
        city: null,
      };

      const insert = await supabase
        .from('games')
        .insert(payload)
        .select('id')
        .single();
      if (insert.error) throw insert.error;
      setRemixFor(null);
      setRemixPrompt("");
      setRemixTitle("");
      toast.success('Remix published!');
      const newId = insert.data?.id as string;
      if (newId) navigate(`/feed?game=${newId}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to publish remix');
    } finally {
      setIsRemixing(false);
    }
  };

  // Auto-open a game if query param ?game=id is present
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const gameId = params.get('game');
    if (!gameId) return;
    (async () => {
      const { data, error } = await supabase.from('games').select('*').eq('id', gameId).maybeSingle();
      if (!error && data) {
        setSelectedGame(data as Game);
      }
    })();
  }, [routerLocation.search]);

  // Comments state
  const [commentsOpenFor, setCommentsOpenFor] = useState<GameWithCreator | null>(null);
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', commentsOpenFor?.id],
    enabled: !!commentsOpenFor?.id,
    queryFn: async () => {
      const gid = commentsOpenFor!.id;
      const { data, error } = await supabase
        .from('game_comments')
        .select('*, user:profiles!game_comments_user_id_fkey(id, username, avatar_url)')
        .eq('game_id', gid)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as CommentRow[];
    },
  });

  useEffect(() => {
    if (!commentsOpenFor) return;
    const channel = supabase
      .channel(`comments:${commentsOpenFor.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_comments', filter: `game_id=eq.${commentsOpenFor.id}` }, () => {
        refetchComments();
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [commentsOpenFor, refetchComments]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !commentsOpenFor) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    const { error } = await supabase
      .from('game_comments')
      .insert({
        game_id: commentsOpenFor.id,
        user_id: user.id,
        content: newComment.trim(),
      });
    if (error) {
      toast.error('Failed to send comment');
    } else {
      setNewComment("");
    }
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
    <>
    <LocationFilter
      onLocationChange={(mode, location) => {
        setLocationMode(mode);
        setLocationFilter(location);
      }}
    />
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <div className="absolute inset-0 overflow-y-auto no-scrollbar snap-y snap-mandatory">
        {hydratedGames?.map((game) => (
          <section key={game.id} className="relative h-[calc(100vh-8rem)] w-full snap-start">
            <img
              src={game.cover_url || game.thumbnail_url || "/placeholder.svg"}
              alt={game.title}
              loading="lazy"
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
                onClick={() => setRemixFor(game)}
                className="h-12 w-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-smooth text-white"
                aria-label="Remix"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path fill="currentColor" d="M7 7h6v2H9v6H7V7zm10 10h-6v-2h4V9h2v8z"/>
                </svg>
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
                onClick={() => setCommentsOpenFor(game)}
                className="h-12 w-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-smooth text-white"
                aria-label="Comments"
              >
                <MessageCircle className="h-6 w-6" />
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
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10 ring-2 ring-white/30">
                  <AvatarImage src={game.creator?.avatar_url || undefined} />
                  <AvatarFallback>{game.creator?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold drop-shadow-md">{game.title}</h3>
                    <div 
                      className="text-sm text-white/80 hover:underline cursor-pointer"
                      onClick={() => game.creator?.username && navigate(`/u/${game.creator.username}`)}
                    >
                      by {game.creator?.username || 'Unknown'}
                    </div>
                </div>
              </div>
                <div className="flex items-center gap-2 mb-2">
                  {game.original_game_id && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white/90">Remix</span>
                  )}
                </div>
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
        <div id="feed-sentinel" ref={sentinelRef} className="h-24 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        </div>
      </div>
    </div>

    {/* Comments Panel */}
    <Sheet open={!!commentsOpenFor} onOpenChange={(o) => !o && setCommentsOpenFor(null)}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={c.user?.avatar_url || undefined} />
                  <AvatarFallback>{c.user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{c.user?.username || 'User'}</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{c.content}</div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-sm text-muted-foreground">No comments yet. Be the first!</div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button onClick={handleSendComment} disabled={!newComment.trim()}>Send</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    {/* Remix Dialog */}
    <Dialog open={!!remixFor} onOpenChange={(o) => !o && setRemixFor(null)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Remix game{remixFor ? `: ${remixFor.title}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="New title (optional)"
            value={remixTitle}
            onChange={(e) => setRemixTitle(e.target.value)}
          />
          <Input
            placeholder="Describe your remix idea (prompt)"
            value={remixPrompt}
            onChange={(e) => setRemixPrompt(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRemixFor(null)} disabled={isRemixing}>Cancel</Button>
          <Button onClick={handleSubmitRemix} disabled={!remixPrompt.trim() || isRemixing}>
            {isRemixing ? (<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Publishing...</>) : 'Publish Remix'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};