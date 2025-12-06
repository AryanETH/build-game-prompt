import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GamePlayer } from "./GamePlayer";
import { Loader2, Heart, MessageCircle, Share2, Play, Sparkles, Smile, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { playClick, playSuccess, playError } from "@/lib/sounds";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { LoadingSpinner } from "./LoadingSpinner";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { GifPicker } from "./GifPicker";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { OnlineIndicator } from "./OnlineIndicator";

interface Game {
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
  likes_count?: number;
  parent_comment_id?: string | null;
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
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  // location UI removed per TikTok-style layout

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    })();
  }, []);

  const pageSize = 20; // Increased from 10 for better UX
  const { data: pages, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['games', 'feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // Optimized: Exclude game_code from list query (fetch only when playing)
      const { data, error } = await supabase
        .from('games')
        .select('id, title, description, thumbnail_url, cover_url, likes_count, plays_count, comments_count, creator_id')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || []) as unknown as GameWithCreator[];
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length === pageSize ? allPages.length : undefined),
    initialPageParam: 0,
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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

  // Fetch user's following list
  const { data: userFollows } = useQuery({
    queryKey: ['userFollows', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (userFollows) {
      setFollowedUsers(new Set(userFollows.map(f => f.following_id)));
    }
  }, [userFollows]);

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
    
    try {
      // Fetch full game data including game_code (only when needed)
      const { data: fullGame, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', game.id)
        .single();
      
      if (error || !fullGame) {
        toast.error("Failed to load game");
        playError();
        return;
      }
      
      setSelectedGame(fullGame as Game);
      
      // Increment play count (optimistic update)
      if (userId) {
        await supabase
          .from('games')
          .update({ plays_count: (game.plays_count || 0) + 1 })
          .eq('id', game.id);
        
        // Log activity
        await logActivity({ type: 'game_played', gameId: game.id });
        
        queryClient.invalidateQueries({ queryKey: ['games', 'feed'] });
      }
    } catch (err) {
      console.error('Play game error:', err);
      toast.error("Failed to load game");
      playError();
    }
  };

  const generateShareImage = (game: Game): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);
      
      // Load and draw Oplus logo
      const logo = new Image();
      logo.src = '/Oplus full horizonatal.png';
      
      const finishImage = () => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${game.title.replace(/[^a-z0-9]/gi, '_')}-oplus.png`, { 
              type: 'image/png' 
            });
            resolve(file);
          } else {
            reject(new Error('Failed to create image'));
          }
        }, 'image/png');
      };
      
      logo.onload = () => {
        // Draw logo at top (centered)
        const logoHeight = 140;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        ctx.drawImage(logo, (1200 - logoWidth) / 2, 40, logoWidth, logoHeight);
        
        // Add game title (center)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        const title = game.title.length > 30 ? game.title.substring(0, 30) + '...' : game.title;
        ctx.fillText(title, 600, 350);
        
        // Add tagline (bottom)
        ctx.font = '36px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText("Let's Play Together!", 600, 520);
        
        finishImage();
      };
      
      logo.onerror = () => {
        // Fallback if logo doesn't load
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('OPLUS', 600, 100);
        
        // Add game title (center)
        ctx.font = 'bold 72px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        const title = game.title.length > 30 ? game.title.substring(0, 30) + '...' : game.title;
        ctx.fillText(title, 600, 350);
        
        // Add tagline (bottom)
        ctx.font = '36px Arial';
        ctx.fillText("Let's Play Together!", 600, 520);
        
        finishImage();
      };
    });
  };

  const handleShare = async (game: Game) => {
    const shareUrl = `${window.location.origin}/feed?game=${game.id}`;
    const shareText = `Hey! I'm waiting for you, let's play ${game.title} on Oplus!\n\n${shareUrl}`;
    
    toast.info("Preparing to share...");
    
    try {
      // Generate the branded image first
      const imageFile = await generateShareImage(game);
      
      // Check if Web Share API with files is supported (Windows 10+ with compatible apps)
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `Play ${game.title} on Oplus`,
          text: shareText,
          files: [imageFile],
        };
        
        // Check if this specific share data is supported
        if (navigator.canShare(shareData)) {
          try {
            // This will open Windows Share dialog with installed apps
            await navigator.share(shareData);
            playSuccess();
            toast.success("Shared successfully!");
            return;
          } catch (shareError: any) {
            // User cancelled the share dialog
            if (shareError.name === 'AbortError') {
              toast.info("Share cancelled");
              return;
            }
            console.log('Share with files failed, trying advanced clipboard:', shareError);
          }
        }
      }
      
      // Fallback: Advanced Clipboard API (writes both image and text)
      try {
        const textBlob = new Blob([shareText], { type: 'text/plain' });
        const clipboardItem = new ClipboardItem({
          [imageFile.type]: imageFile,
          'text/plain': textBlob,
        });
        
        await navigator.clipboard.write([clipboardItem]);
        playSuccess();
        toast.success("Image & text copied to clipboard!", {
          description: "Paste into any app to share both!"
        });
        return;
      } catch (clipboardError) {
        console.log('Advanced clipboard failed, trying text only:', clipboardError);
      }
      
      // Final fallback: Text only to clipboard
      await navigator.clipboard.writeText(shareText);
      toast.success("Link copied to clipboard!");
      playSuccess();
      
    } catch (error: any) {
      console.error('Share error:', error);
      
      // User cancelled
      if (error.name === 'AbortError') {
        return;
      }
      
      // Last resort fallback
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Link copied to clipboard!");
        playSuccess();
      } catch (clipboardError) {
        toast.error("Failed to share");
        playError();
      }
    }
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
  const [replyingTo, setReplyingTo] = useState<CommentRow | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [gifPickerOpen, setGifPickerOpen] = useState(false);

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
    const uid = userId;
    if (!uid) {
      toast.error('Please sign in to comment');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('game_comments')
        .insert({
          game_id: commentsOpenFor.id,
          user_id: uid,
          content: newComment.trim(),
          parent_comment_id: replyingTo?.id || null,
        });
      
      if (error) {
        console.error('Comment error:', error);
        toast.error('Failed to send comment');
      } else {
        setNewComment("");
        setReplyingTo(null);
        toast.success('Comment added!');
        refetchComments();
        queryClient.invalidateQueries({ queryKey: ['games'] });
      }
    } catch (err) {
      console.error('Comment error:', err);
      toast.error('Failed to send comment');
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    if (!commentsOpenFor) return;
    const uid = userId;
    if (!uid) {
      toast.error('Please sign in to comment');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('game_comments')
        .insert({
          game_id: commentsOpenFor.id,
          user_id: uid,
          content: `[GIF]${gifUrl}`,
          parent_comment_id: replyingTo?.id || null,
        });
      
      if (error) {
        console.error('Comment error:', error);
        toast.error('Failed to send GIF');
      } else {
        setGifPickerOpen(false);
        setReplyingTo(null);
        toast.success('GIF sent!');
        refetchComments();
        queryClient.invalidateQueries({ queryKey: ['games'] });
      }
    } catch (err) {
      console.error('Comment error:', err);
      toast.error('Failed to send GIF');
    }
  };

  const handleFollowUser = async (creatorId: string) => {
    if (!userId) {
      toast.error('Please sign in to follow');
      return;
    }

    const isFollowing = followedUsers.has(creatorId);

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', creatorId);
        setFollowedUsers(prev => {
          const next = new Set(prev);
          next.delete(creatorId);
          return next;
        });
        toast.success('Unfollowed');
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: userId, following_id: creatorId });
        setFollowedUsers(prev => new Set(prev).add(creatorId));
        await logActivity({ type: 'user_followed', targetUserId: creatorId });
        toast.success('Following!');
      }
      queryClient.invalidateQueries({ queryKey: ['userFollows'] });
    } catch (err) {
      console.error('Follow error:', err);
      toast.error('Failed to follow user');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!userId) {
      toast.error('Please sign in to like comments');
      return;
    }
    
    const isLiked = likedComments.has(commentId);
    
    setLikedComments(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
    
    // Show optimistic update
    toast.success(isLiked ? 'Unliked' : 'Liked!');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      toast.error('Please sign in to delete comments');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('game_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Delete comment error:', error);
        toast.error('Failed to delete comment');
      } else {
        toast.success('Comment deleted');
        refetchComments();
        queryClient.invalidateQueries({ queryKey: ['games'] });
      }
    } catch (err) {
      console.error('Delete comment error:', err);
      toast.error('Failed to delete comment');
    }
  };

  // Import formatTimeAgo from hook instead of duplicating
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 365) return `${days}d`;
    const years = Math.floor(days / 365);
    return `${years}y`;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
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

  // TikTok-style vertical snap scroll with centered layout
  return (
    <>
    {/* Snap scrolling feed - TikTok style on mobile, centered on desktop */}
    <div className="relative w-full bg-white dark:bg-black md:bg-[#F8F9FA]" style={{ height: '100dvh' }}>
      {/* Mobile: Snap scroll, Desktop: Normal scroll with centered content */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory md:snap-none no-scrollbar pb-16 md:pb-0" style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}>
        {/* Desktop wrapper: flex column with centered items */}
       <div className="md:flex md:flex-col md:items-start md:w-full md:max-w-[900px] md:mx-auto md:justify-start md:min-h-screen md:py-8 md:gap-8">
        {hydratedGames?.map((game, index) => (
          <div key={game.id} className="w-full snap-start snap-always md:snap-align-none flex items-center justify-center" style={{ height: 'calc(100dvh - 120px)', minHeight: 'calc(100dvh - 120px)', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
            {/* Mobile: Full bleed, Desktop: Centered card with action buttons */}
            <div className="relative w-full h-full md:w-auto md:h-auto md:flex md:items-center md:gap-6">
              {/* Card container - Desktop: Fixed size with stacked effect */}
              <div className="relative w-full h-full md:w-[374px] md:h-[660px]">
              <Card className="relative w-full h-full overflow-visible md:overflow-hidden rounded-none md:rounded-3xl border-0 md:border md:border-gray-200 md:shadow-lg bg-black md:bg-gray-300">
                <img
                  src={game.cover_url || game.thumbnail_url || '/placeholder.svg'}
                  alt={game.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent dark:from-black/95 dark:via-black/20 md:bg-gradient-to-b md:from-gray-200/50 md:via-gray-300/50 md:to-black/80" />
                
                {/* Center Placeholder Icon - Desktop only */}
                <div className="hidden md:flex absolute inset-0 items-center justify-center z-0 opacity-20">
                  <svg className="w-24 h-24 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>

                {/* Remix button - top right (purple like reference) */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                    onClick={() => setRemixFor(game)}
                  >
                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                    Remix
                  </button>
                </div>

                {/* Game info - bottom left - fixed position on mobile to avoid browser UI */}
                <div className="absolute left-0 right-[70px] md:right-[80px] bottom-6 md:bottom-16 p-3 md:p-5 text-white z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
                      onClick={() => game.creator?.username && navigate(`/u/${game.creator.username}`)}
                    >
                      <div className="relative">
                        <Avatar className="w-9 h-9 md:w-12 md:h-12 border-2 border-white/50 group-hover:border-white transition-colors">
                          <AvatarImage src={game.creator?.avatar_url || undefined} />
                          <AvatarFallback className="gradient-primary text-white text-xs md:text-sm font-semibold">
                            {game.creator?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Plus icon for follow - only show if not following */}
                        {game.creator_id !== userId && !followedUsers.has(game.creator_id) && (
                          <button
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 md:w-6 md:h-6 rounded-full gradient-primary flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowUser(game.creator_id);
                            }}
                          >
                            <span className="text-xs md:text-sm font-bold leading-none">+</span>
                          </button>
                        )}
                      </div>
                      <span className="text-sm md:text-base font-bold drop-shadow-lg">@{game.creator?.username || 'creator'}</span>
                    </button>
                  </div>
                  <div className="text-sm md:text-lg font-semibold leading-tight mb-1 drop-shadow-lg line-clamp-2">{game.title}</div>
                  <div className="text-xs md:text-sm text-white/95 line-clamp-2 drop-shadow-md leading-snug">{game.description || ''}</div>
                </div>

                {/* Right action bar - Mobile only (desktop buttons are on right outside card) */}
                <div className="md:hidden absolute right-3 bottom-20 flex flex-col gap-3 items-center text-white z-30">
                {/* Play button - Purple gradient on desktop, primary on mobile */}
                <button
                  aria-label="Play game"
                  className="h-12 w-12 md:h-12 md:w-12 rounded-full flex items-center justify-center gradient-primary md:bg-[#5B4AF4] text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                  onClick={() => handlePlay(game)}
                >
                  <Play className="h-5 w-5 md:h-5 md:w-5 fill-current md:ml-1" strokeWidth={2} />
                </button>
                
                {/* Like button */}
                <div className="flex flex-col items-center gap-0.5 md:gap-1">
                  <button
                    aria-label={likedGames.has(game.id) ? 'Unlike game' : 'Like game'}
                    className={`h-12 w-12 md:h-12 md:w-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg ${
                      likedGames.has(game.id) 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-600/80 md:bg-[#FF4D4D] text-white hover:bg-gray-500'
                    }`}
                    onClick={() => likeMutation.mutate({ gameId: game.id, isLiked: likedGames.has(game.id) })}
                  >
                    <Heart className={`h-5 w-5 md:h-6 md:w-6 fill-current`} strokeWidth={2} />
                  </button>
                  <span className="text-[10px] md:text-xs font-bold text-white md:text-gray-500 drop-shadow-lg md:drop-shadow-none md:mt-1">{game.likes_count ?? 0}</span>
                </div>
                
                {/* Comments button */}
                <div className="flex flex-col items-center gap-0.5 md:gap-1">
                  <button
                    aria-label="View comments"
                    className="h-12 w-12 md:h-12 md:w-12 rounded-full flex items-center justify-center bg-gray-600/80 md:bg-gray-400/50 md:backdrop-blur-sm text-white hover:bg-gray-500 md:hover:bg-gray-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                    onClick={() => setCommentsOpenFor(game)}
                  >
                    <MessageCircle className="h-5 w-5 md:h-6 md:w-6 fill-white transform -scale-x-100" strokeWidth={2} />
                  </button>
                  <span className="text-[10px] md:text-xs font-bold text-white md:text-gray-500 drop-shadow-lg md:drop-shadow-none md:mt-1">
                    {commentsOpenFor?.id === game.id ? comments.length : (game.comments_count || 0)}
                  </span>
                </div>
                
                {/* Share button */}
                <div className="flex flex-col items-center">
                  <button
                    aria-label="Share game"
                    className="h-12 w-12 md:h-12 md:w-12 rounded-full flex items-center justify-center bg-gray-600/80 md:bg-gray-400/50 md:backdrop-blur-sm text-white hover:bg-gray-500 md:hover:bg-gray-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                    onClick={() => handleShare(game)}
                  >
                    <Share2 className="h-5 w-5 md:h-6 md:w-6 ml-[-2px]" strokeWidth={2} />
                  </button>
                </div>
              </div>
              </Card>
              
              {/* Next card peek - Desktop only */}
              {index < hydratedGames.length - 1 && (
                <div className="hidden md:block absolute bottom-[-20px] left-0 right-0 h-20 rounded-t-3xl bg-gray-300 border border-gray-200 border-b-0 shadow-sm pointer-events-none z-[-1]">
                  <div className="absolute inset-0 rounded-t-3xl overflow-hidden">
                    <img 
                      src={hydratedGames[index + 1].cover_url || hydratedGames[index + 1].thumbnail_url || '/placeholder.svg'}
                      alt=""
                      className="w-full h-full object-cover opacity-40"
                    />
                  </div>
                </div>
              )}
              </div>

              {/* Desktop: Action buttons on RIGHT */}
              <div className="hidden md:flex flex-col gap-4 items-center">
                {/* Play button */}
                <button
                  aria-label="Play game"
                  className="h-14 w-14 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
                  onClick={() => handlePlay(game)}
                >
                  <Play className="h-6 w-6 fill-white ml-0.5" strokeWidth={0} />
                </button>
                
                {/* Like button */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    aria-label={likedGames.has(game.id) ? 'Unlike game' : 'Like game'}
                    className={`h-14 w-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl ${
                      likedGames.has(game.id) 
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white' 
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400'
                    }`}
                    onClick={() => likeMutation.mutate({ gameId: game.id, isLiked: likedGames.has(game.id) })}
                  >
                    <Heart className={`h-6 w-6 ${likedGames.has(game.id) ? 'fill-white' : ''}`} strokeWidth={2} />
                  </button>
                  <span className="text-sm font-bold text-gray-700">{game.likes_count ?? 0}</span>
                </div>
                
                {/* Comments button */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    aria-label="View comments"
                    className="h-14 w-14 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
                    onClick={() => setCommentsOpenFor(game)}
                  >
                    <MessageCircle className="h-6 w-6" strokeWidth={2} />
                  </button>
                  <span className="text-sm font-bold text-gray-700">
                    {commentsOpenFor?.id === game.id ? comments.length : (game.comments_count || 0)}
                  </span>
                </div>
                
                {/* Share button */}
                <div className="flex flex-col items-center">
                  <button
                    aria-label="Share game"
                    className="h-14 w-14 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
                    onClick={() => handleShare(game)}
                  >
                    <Share2 className="h-6 w-6" strokeWidth={2} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
        </div>

        {games?.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 text-foreground">No games yet</h3>
              <p className="text-muted-foreground">Be the first to create a game!</p>
            </div>
          </div>
        )}
        <div ref={sentinelRef} className="h-24 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-purple-600 dark:text-purple-400" />}
        </div>
      </div>
    </div>


    {/* Comments Panel */}
    <Sheet open={!!commentsOpenFor} onOpenChange={(o) => {
      if (!o) {
        setCommentsOpenFor(null);
        setReplyingTo(null);
      }
    }}>
      <SheetContent side="right" className="w-full sm:w-[420px] md:w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Comments ({comments.length})</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {comments.filter(c => !c.parent_comment_id).map((c) => {
            const replies = comments.filter(r => r.parent_comment_id === c.id);
            const isExpanded = expandedComments.has(c.id);
            const isGif = c.content.startsWith('[GIF]');
            const gifUrl = isGif ? c.content.substring(5) : null;
            
            return (
              <div key={c.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <button onClick={() => c.user?.username && navigate(`/u/${c.user.username}`)} className="relative flex-shrink-0">
                    <Avatar className="h-9 w-9 hover:opacity-80 transition-opacity">
                      <AvatarImage src={c.user?.avatar_url || undefined} />
                      <AvatarFallback className="gradient-primary text-white text-xs">
                        {c.user?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {c.user_id && <OnlineIndicator userId={c.user_id} className="absolute bottom-0 right-0 w-2.5 h-2.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => c.user?.username && navigate(`/u/${c.user.username}`)}
                        className="text-sm font-semibold hover:underline"
                      >
                        {c.user?.username || 'User'}
                      </button>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                    </div>
                    {isGif ? (
                      <img src={gifUrl!} alt="GIF" className="mt-2 rounded-lg max-w-[200px] max-h-[200px] object-cover" />
                    ) : (
                      <div className="text-sm text-foreground whitespace-pre-wrap break-words mt-1">{c.content}</div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleLikeComment(c.id)}
                        className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors group"
                      >
                        <span className={`text-lg font-bold transition-colors ${likedComments.has(c.id) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>+</span>
                        <span className="text-muted-foreground">{likedComments.has(c.id) ? 1 : 0}</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(c)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                      >
                        Reply
                      </button>
                      {replies.length > 0 && (
                        <button
                          onClick={() => setExpandedComments(prev => {
                            const next = new Set(prev);
                            if (next.has(c.id)) next.delete(c.id);
                            else next.add(c.id);
                            return next;
                          })}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? 'Hide' : 'View'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                      {c.user_id === userId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors font-medium ml-auto"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Nested replies */}
                {isExpanded && replies.length > 0 && (
                  <div className="ml-12 space-y-3 border-l-2 border-muted pl-4">
                    {replies.map((r) => {
                      const isReplyGif = r.content.startsWith('[GIF]');
                      const replyGifUrl = isReplyGif ? r.content.substring(5) : null;
                      
                      return (
                        <div key={r.id} className="flex items-start gap-3">
                          <button onClick={() => r.user?.username && navigate(`/u/${r.user.username}`)} className="relative flex-shrink-0">
                            <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity">
                              <AvatarImage src={r.user?.avatar_url || undefined} />
                              <AvatarFallback className="gradient-primary text-white text-xs">
                                {r.user?.username?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            {r.user_id && <OnlineIndicator userId={r.user_id} className="absolute bottom-0 right-0 w-2.5 h-2.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => r.user?.username && navigate(`/u/${r.user.username}`)}
                                className="text-sm font-semibold hover:underline"
                              >
                                {r.user?.username || 'User'}
                              </button>
                              <span className="text-xs text-muted-foreground">{formatTimeAgo(r.created_at)}</span>
                            </div>
                            {isReplyGif ? (
                              <img src={replyGifUrl!} alt="GIF" className="mt-2 rounded-lg max-w-[180px] max-h-[180px] object-cover" />
                            ) : (
                              <div className="text-sm text-foreground whitespace-pre-wrap break-words mt-1">{r.content}</div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <button
                                onClick={() => handleLikeComment(r.id)}
                                className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors group"
                              >
                                <span className={`text-lg font-bold transition-colors ${likedComments.has(r.id) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>+</span>
                                <span className="text-muted-foreground">{likedComments.has(r.id) ? 1 : 0}</span>
                              </button>
                              {r.user_id === userId && (
                                <button
                                  onClick={() => handleDeleteComment(r.id)}
                                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors font-medium ml-auto"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {comments.length === 0 && (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">No comments yet. Be the first!</div>
            </div>
          )}
        </div>
        <div className="border-t px-6 py-4 bg-background">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Replying to @{replyingTo.user?.username}</span>
              <button onClick={() => setReplyingTo(null)} className="text-primary hover:underline">
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Popover open={gifPickerOpen} onOpenChange={setGifPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <GifPicker onSelect={handleGifSelect} />
              </PopoverContent>
            </Popover>
            <Input
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={handleSendComment} 
              disabled={!newComment.trim()}
              className="gradient-primary"
            >
              {replyingTo ? 'Reply' : 'Send'}
            </Button>
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
