import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GamePlayer } from "./GamePlayer";
import { Loader2, Heart, MessageCircle, Share2, Play, Sparkles } from "lucide-react";
import { playClick, playSuccess, playError } from "@/lib/sounds";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
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
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  // location UI removed per TikTok-style layout

  useEffect(() => {
    const uid = (window as any).Clerk?.user?.id || null;
    setUserId(uid);
  }, []);

  const pageSize = 10;
  const { data: pages, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['games'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // Try full select first; fall back to minimal columns if remote DB lags migrations
      const attemptSelect = async (columns: string, orderBy: string = 'created_at') =>
        supabase
          .from('games')
          .select(columns)
          .order(orderBy as any, { ascending: false })
          .range(from, to);

      // 1) Full schema
      let { data, error } = await attemptSelect('id, title, description, thumbnail_url, cover_url, likes_count, plays_count, creator_id, is_multiplayer, multiplayer_type, graphics_quality, sound_url, country, city, original_game_id, is_public');
      if (error) {
        // 2) Minimal columns widely available
        const minimal = await attemptSelect('id, title, description, thumbnail_url, creator_id, likes_count, plays_count');
        if (minimal.error) {
          // 3) Last resort: wildcard select (includes game_code); tolerate heavier payload to avoid empty feed
          const wildcard = await attemptSelect('*');
          if (wildcard.error) throw wildcard.error;
          data = wildcard.data as any[];
        } else {
          data = minimal.data as any[];
        }
      }

      return (data || []) as unknown as GameWithCreator[];
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length === pageSize ? allPages.length : undefined),
    initialPageParam: 0,
    retry: 1,
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
        
        // Log like activity
        await logActivity({ type: 'game_liked', gameId });
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
    playClick();
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
    playSuccess();
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
    if (!remixFor) return;
    const baseTitle = remixTitle.trim() || `Remix: ${remixFor.title}`;
    const params = new URLSearchParams({ remix: remixFor.id, title: baseTitle });
    if (remixPrompt.trim()) params.set('prompt', remixPrompt.trim());
    setRemixFor(null);
    setRemixPrompt("");
    setRemixTitle("");
    playClick();
    navigate(`/create?${params.toString()}`);
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
    const uid = (window as any).Clerk?.user?.id || null;
    if (!uid) {
      toast.error('Please sign in to comment');
      return;
    }
    const { error } = await supabase
      .from('game_comments')
      .insert({
        game_id: commentsOpenFor.id,
        user_id: uid,
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

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Failed to load games</h3>
          <p className="text-muted-foreground text-sm">{(error as any)?.message || 'Please try again.'}</p>
        </div>
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

  // TikTok-style vertical snap scroll with strict 9:16 container on desktop
  return (
    <>
    {/* Snap scrolling feed - both mobile and desktop */}
    <div className="relative h-screen w-full overflow-hidden bg-white dark:bg-black">
      <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar" style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}>
        {hydratedGames?.map((game) => (
          <div key={game.id} className="h-full w-full snap-start snap-always flex items-center justify-center">
            {/* 9:16 frame centered; on desktop uses viewport-fitted width */}
            <div className="relative nineBySixteen w-full h-full md:vh-9-16">
              <Card className="absolute inset-0 overflow-hidden rounded-[28px] border border-border/60">
                <img
                  src={game.cover_url || game.thumbnail_url || '/placeholder.svg'}
                  alt={game.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute top-4 right-4 z-10">
                  <button
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-accent/90 to-accent hover:from-accent hover:to-accent/90 text-accent-foreground backdrop-blur-md text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                    onClick={() => setRemixFor(game)}
                  >
                    <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                    Remix
                  </button>
                </div>

                <div className="absolute left-0 right-24 bottom-36 md:bottom-32 p-5 md:p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      onClick={() => game.creator?.username && navigate(`/u/${game.creator.username}`)}
                    >
                      <Avatar className="w-10 h-10 border-2 border-white/40">
                        <AvatarImage src={game.creator?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {game.creator?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold drop-shadow-lg">@{game.creator?.username || 'creator'}</span>
                    </button>
                  </div>
                  <div className="text-xl md:text-2xl font-bold leading-tight mb-1 drop-shadow-lg line-clamp-2">{game.title}</div>
                  <div className="text-sm text-white/90 line-clamp-2 drop-shadow-md">{game.description || ''}</div>
                </div>

                <div className="absolute bottom-28 md:bottom-24 right-0 p-5 flex flex-col gap-5 items-center text-white">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      aria-label="Like"
                      className={`h-16 w-16 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md hover:bg-black/60 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl ${likedGames.has(game.id) ? 'text-red-500' : ''}`}
                      onClick={() => likeMutation.mutate({ gameId: game.id, isLiked: likedGames.has(game.id) })}
                    >
                      <Heart className={`h-7 w-7 ${likedGames.has(game.id) ? 'fill-current' : ''}`} strokeWidth={1.5} />
                    </button>
                    <span className="text-sm font-semibold text-white drop-shadow-lg">{game.likes_count ?? 0}</span>
                  </div>
                  
                  <button
                    aria-label="Comments"
                    className="h-14 w-14 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                    onClick={() => setCommentsOpenFor(game)}
                  >
                    <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
                  </button>
                  
                  <button
                    aria-label="Share"
                    className="h-14 w-14 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                    onClick={() => handleShare(game)}
                  >
                    <Share2 className="h-6 w-6" strokeWidth={1.5} />
                  </button>
                  
                  <button
                    aria-label="Play"
                    className="h-14 w-14 rounded-full flex items-center justify-center bg-primary/90 backdrop-blur-md text-primary-foreground hover:bg-primary hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/50"
                    onClick={() => handlePlay(game)}
                  >
                    <Play className="h-6 w-6 fill-current" strokeWidth={1.5} />
                  </button>
                </div>
              </Card>
            </div>
          </div>
        ))}

        {games?.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">No games yet</h3>
              <p className="text-muted-foreground">Be the first to create a game!</p>
            </div>
          </div>
        )}
        <div ref={sentinelRef} className="h-24 flex items-center justify-center">
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