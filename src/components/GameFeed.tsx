import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GamePlayer } from "./GamePlayer";
import { Loader2, Heart, MessageCircle, Share2, Play, Sparkles, Smile, ChevronDown, ChevronUp, Trash2, Volume2, VolumeX } from "lucide-react";
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
import { MentionInput } from "./MentionInput";
import { CommentText } from "./CommentText";
import { GameCardSkeleton, MobileFeedSkeleton } from "./GameCardSkeleton";
import { notifyGameLike, notifyGameComment, notifyCommentReply, notifyGamePlay, notifyNewFollower, notifyCommentLike, notifyGameMention, notifyMention } from "@/lib/notificationSystem";
import { LinkifiedText } from "./LinkifiedText";

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
  // Immersive media fields
  background_sound_url?: string | null;
  media_type?: 'image' | 'video' | 'gif' | null;
  media_url?: string | null;
  media_duration?: number | null;
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
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [mutedGames, setMutedGames] = useState<Set<string>>(new Set());
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [preloadedVideos, setPreloadedVideos] = useState<Set<string>>(new Set());
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null); // Track which video should have audio
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const queryClient = useQueryClient();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false); // Flag to prevent observer interference during button navigation
  const savedScrollPosition = useRef<number>(0); // Save scroll position when leaving feed

  // location UI removed per TikTok-style layout

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    })();
  }, []);

  // Fetch current user's profile
  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfile', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('Profile fetch error:', error);
        return null;
      }
      return data as Profile;
    },
  });

  const pageSize = 20; // Increased from 10 for better UX
  const { data: pages, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['games', 'feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // Optimized: Exclude game_code from list query (fetch only when playing)
      // Include immersive media fields for video/audio playback
      const { data, error } = await supabase
        .from('games')
        .select('id, title, description, thumbnail_url, cover_url, likes_count, plays_count, comments_count, creator_id, media_type, media_url, background_sound_url, media_duration')
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
      if (error) {
        console.warn('Creator profiles fetch error:', error);
        return [] as Profile[];
      }
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
        throw new Error("Not authenticated");
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

        // Log like activity (async, don't wait)
        logActivity({ type: 'game_liked', gameId });

        // Send notification to game owner (async, don't wait)
        const game = hydratedGames.find(g => g.id === gameId);
        if (game && game.creator_id !== userId) {
          supabase.auth.getUser().then(({ data: userData }) => {
            supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', userId)
              .single()
              .then(({ data: profile, error: profileError }) => {
                if (profile && !profileError && userData.user) {
                  notifyGameLike(
                    game.creator_id,
                    profile.username || 'User',
                    profile.avatar_url || '',
                    userId,
                    gameId,
                    game.title,
                    game.thumbnail_url || game.cover_url || undefined
                  );
                }
              });
          });
        }
      }
    },
    onMutate: async ({ gameId, isLiked }) => {
      // OPTIMISTIC UPDATE: Update UI immediately
      setLikedGames(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(gameId);
        } else {
          newSet.add(gameId);
        }
        return newSet;
      });

      // Optimistically update the game's likes_count
      queryClient.setQueryData(['games', 'feed'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any[]) =>
            page.map((game: any) => {
              if (game.id === gameId) {
                return {
                  ...game,
                  likes_count: isLiked
                    ? Math.max((game.likes_count || 0) - 1, 0)
                    : (game.likes_count || 0) + 1
                };
              }
              return game;
            })
          )
        };
      });
    },
    onError: (error, { gameId, isLiked }) => {
      // ROLLBACK: Revert optimistic update on error
      setLikedGames(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(gameId);
        } else {
          newSet.delete(gameId);
        }
        return newSet;
      });

      // Refetch to get correct state
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.error("Failed to update like");
    },
    onSuccess: () => {
      // Refetch in background to sync with server
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  const handlePlay = async (game: Game) => {
    playClick();
    
    // Save scroll position before opening game
    const scrollContainer = document.querySelector('.snap-y');
    if (scrollContainer) {
      savedScrollPosition.current = scrollContainer.scrollTop;
    }
    
    // Pause all videos and mute them when leaving feed
    videoRefs.current.forEach((video) => {
      video.pause();
      video.muted = true;
    });
    stopBackgroundSound();

    try {
      // Fetch full game data including game_code (only when needed)
      const { data: fullGame, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', game.id)
        .single();

      if (error || !fullGame) {
        console.error('Game fetch error:', error);
        toast.error("Failed to load game");
        playError();
        return;
      }

      setSelectedGame(fullGame as any); // Use any to avoid type issues with missing columns

      // Increment play count (optimistic update)
      if (userId) {
        try {
          await supabase
            .from('games')
            .update({ plays_count: (game.plays_count || 0) + 1 })
            .eq('id', game.id);
        } catch (updateError) {
          console.warn('Failed to update play count:', updateError);
        }

        // Log activity
        try {
          await logActivity({ type: 'game_played', gameId: game.id });
        } catch (activityError) {
          console.warn('Failed to log activity:', activityError);
        }

        queryClient.invalidateQueries({ queryKey: ['games', 'feed'] });

        // Send notification to game owner (only if not playing own game)
        if (game.creator_id !== userId) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', userId)
            .single();

          if (profile && !profileError) {
            await notifyGamePlay(
              game.creator_id,
              profile.username,
              profile.avatar_url || '',
              userId,
              game.id,
              game.title,
              game.thumbnail_url || game.cover_url || undefined
            );
          }
        }
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

      const shareUrl = `${window.location.origin}/feed?game=${game.id}`;

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
        const logoHeight = 120;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        ctx.drawImage(logo, (1200 - logoWidth) / 2, 40, logoWidth, logoHeight);

        // Add game title (center)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px Montserrat, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        const title = game.title.length > 35 ? game.title.substring(0, 35) + '...' : game.title;
        ctx.fillText(title, 600, 300);

        // Add tagline
        ctx.font = '32px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText("Hey! I'm waiting for you, let's play together!", 600, 380);

        // Add URL at bottom (important - embedded in image)
        ctx.font = 'bold 28px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 8;
        // Shorten URL for display if needed
        const displayUrl = shareUrl.replace('https://', '').replace('http://', '');
        ctx.fillText(displayUrl, 600, 560);

        finishImage();
      };

      logo.onerror = () => {
        // Fallback if logo doesn't load
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 56px Montserrat, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OPLUS', 600, 100);

        // Add game title (center)
        ctx.font = 'bold 64px Montserrat, Arial, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        const title = game.title.length > 35 ? game.title.substring(0, 35) + '...' : game.title;
        ctx.fillText(title, 600, 300);

        // Add tagline
        ctx.font = '32px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText("Hey! I'm waiting for you, let's play together!", 600, 380);

        // Add URL at bottom
        ctx.font = 'bold 28px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 8;
        const displayUrl = shareUrl.replace('https://', '').replace('http://', '');
        ctx.fillText(displayUrl, 600, 560);

        finishImage();
      };
    });
  };

  const handleShare = async (game: Game) => {
    const shareUrl = `${window.location.origin}/feed?game=${game.id}`;
    const shareText = `Hey! I'm waiting for you, let's play ${game.title} on Oplus!\n\n${shareUrl}`;

    toast.info("Preparing to share...");

    try {
      // Generate the branded image first (now includes URL embedded in image)
      const imageFile = await generateShareImage(game);

      // STRATEGY 1: Copy text to clipboard FIRST, then open share dialog
      // This ensures text is available even if share API doesn't pass it
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (clipErr) {
        console.log('Pre-clipboard copy failed:', clipErr);
      }

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
            toast.success("Shared successfully!", {
              description: "Text is also in your clipboard - paste it if needed!"
            });
            return;
          } catch (shareError: any) {
            // User cancelled the share dialog
            if (shareError.name === 'AbortError') {
              toast.info("Share cancelled (text still in clipboard)");
              return;
            }
            console.log('Share with files failed, trying advanced clipboard:', shareError);
          }
        }
      }

      // STRATEGY 2: Advanced Clipboard API (writes both image and text)
      try {
        const textBlob = new Blob([shareText], { type: 'text/plain' });
        const clipboardItem = new ClipboardItem({
          [imageFile.type]: imageFile,
          'text/plain': textBlob,
        });

        await navigator.clipboard.write([clipboardItem]);
        playSuccess();
        toast.success("Image & text copied to clipboard!", {
          description: "Paste into any app - both image and text will appear!"
        });
        return;
      } catch (clipboardError) {
        console.log('Advanced clipboard failed, trying text only:', clipboardError);
      }

      // STRATEGY 3: Text only to clipboard (URL is embedded in image anyway)
      await navigator.clipboard.writeText(shareText);
      toast.success("Link copied to clipboard!", {
        description: "The URL is also visible in the image"
      });
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

  // Desktop navigation functions
  const navigateUp = () => {
    if (!hydratedGames || hydratedGames.length === 0) return;
    
    // Set flag to prevent observer interference during programmatic scroll
    isNavigatingRef.current = true;
    
    const newIndex = currentGameIndex > 0 ? currentGameIndex - 1 : hydratedGames.length - 1;
    const prevGame = hydratedGames[currentGameIndex];
    const nextGame = hydratedGames[newIndex];
    
    // Pause current video before scrolling
    if (prevGame?.media_type === 'video') {
      const prevVideo = videoRefs.current.get(prevGame.id);
      if (prevVideo && !prevVideo.paused) {
        prevVideo.pause();
      }
    }
    
    setCurrentGameIndex(newIndex);
    
    // Scroll to the game card with start alignment for snap scroll compatibility
    const gameElement = document.querySelector(`[data-game-index="${newIndex}"]`);
    if (gameElement) {
      gameElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Play new video and reset flag after scroll animation completes
    setTimeout(() => {
      if (nextGame?.media_type === 'video') {
        const nextVideo = videoRefs.current.get(nextGame.id);
        if (nextVideo && nextVideo.paused && nextVideo.readyState >= 2) {
          nextVideo.play().catch(() => {});
        }
      }
      isNavigatingRef.current = false;
    }, 500);
  };

  const navigateDown = () => {
    if (!hydratedGames || hydratedGames.length === 0) return;
    
    // Set flag to prevent observer interference during programmatic scroll
    isNavigatingRef.current = true;
    
    const newIndex = currentGameIndex < hydratedGames.length - 1 ? currentGameIndex + 1 : 0;
    const prevGame = hydratedGames[currentGameIndex];
    const nextGame = hydratedGames[newIndex];
    
    // Pause current video before scrolling
    if (prevGame?.media_type === 'video') {
      const prevVideo = videoRefs.current.get(prevGame.id);
      if (prevVideo && !prevVideo.paused) {
        prevVideo.pause();
      }
    }
    
    setCurrentGameIndex(newIndex);
    
    // Scroll to the game card with start alignment for snap scroll compatibility
    const gameElement = document.querySelector(`[data-game-index="${newIndex}"]`);
    if (gameElement) {
      gameElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Play new video and reset flag after scroll animation completes
    setTimeout(() => {
      if (nextGame?.media_type === 'video') {
        const nextVideo = videoRefs.current.get(nextGame.id);
        if (nextVideo && nextVideo.paused && nextVideo.readyState >= 2) {
          nextVideo.play().catch(() => {});
        }
      }
      isNavigatingRef.current = false;
    }, 500);
  };

  // Keyboard navigation for desktop
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only on desktop (md and up)
      if (window.innerWidth < 768) return;
      
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        navigateUp();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        navigateDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGameIndex, hydratedGames]);

  // Audio management functions
  const playBackgroundSound = (gameId: string, soundUrl: string) => {
    if (mutedGames.has(gameId)) return;
    
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // Create and play new audio
    const audio = new Audio(soundUrl);
    audio.loop = true;
    audio.volume = 0.3; // Lower volume for background
    audio.play().catch(console.error);
    setCurrentAudio(audio);
  };

  const stopBackgroundSound = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  };

  const toggleGameMute = (gameId: string) => {
    const newMutedGames = new Set(mutedGames);
    const videoElement = videoRefs.current.get(gameId);
    
    if (mutedGames.has(gameId)) {
      // Unmute - only if this is the active video
      newMutedGames.delete(gameId);
      
      // Unmute video's original sound only if it's the active video
      if (videoElement && activeVideoId === gameId) {
        videoElement.muted = false;
      }
      
      // If this game has background sound, play it
      const game = hydratedGames?.find(g => g.id === gameId);
      if (game?.background_sound_url) {
        playBackgroundSound(gameId, game.background_sound_url);
      }
    } else {
      // Mute
      newMutedGames.add(gameId);
      
      // Mute video's original sound
      if (videoElement) {
        videoElement.muted = true;
      }
      
      // Stop background sound if playing
      if (currentAudio) {
        stopBackgroundSound();
      }
    }
    setMutedGames(newMutedGames);
  };

  // Aggressive video preloading system for Instagram-style instant loading
  useEffect(() => {
    if (!hydratedGames || hydratedGames.length === 0) return;

    const preloadVideos = () => {
      // Preload current + next 3 + previous 1 videos for smooth scrolling
      const startIndex = Math.max(0, currentGameIndex - 1);
      const endIndex = Math.min(hydratedGames.length, currentGameIndex + 4);
      
      const videosToPreload = hydratedGames
        .slice(startIndex, endIndex)
        .filter(game => game.media_type === 'video' && game.media_url)
        .map(game => ({ url: game.media_url!, id: game.id }))
        .filter(({ url }) => !preloadedVideos.has(url));

      videosToPreload.forEach(({ url, id }) => {
        if (!preloadedVideos.has(url)) {
          const video = document.createElement('video');
          video.preload = 'metadata'; // Use metadata for faster initial load
          video.muted = true;
          video.playsInline = true;
          video.loop = true;
          
          // Set mobile-friendly attributes
          video.setAttribute('webkit-playsinline', 'true');
          video.setAttribute('x5-playsinline', 'true');
          video.setAttribute('playsinline', 'true');
          
          // Add source element for better compatibility
          const source = document.createElement('source');
          source.src = url;
          source.type = 'video/mp4';
          video.appendChild(source);
          
          // Force immediate loading
          video.load();
          
          // Start loading data immediately
          const onCanPlay = () => {
            setPreloadedVideos(prev => new Set(prev).add(url));
          };
          
          video.addEventListener('canplaythrough', onCanPlay, { once: true });
          video.addEventListener('loadeddata', onCanPlay, { once: true });
          video.addEventListener('loadedmetadata', () => {
            // Metadata loaded - video is ready to play
            setPreloadedVideos(prev => new Set(prev).add(url));
          }, { once: true });
          
          // Fallback timeout
          setTimeout(() => {
            if (video.readyState >= 1) { // HAVE_METADATA
              onCanPlay();
            }
          }, 3000);

          video.addEventListener('error', (e) => {
            console.warn('Failed to preload video:', url, e);
          }, { once: true });
        }
      });
    };

    // Debounce preloading to avoid excessive calls
    const timeoutId = setTimeout(preloadVideos, 100);
    return () => clearTimeout(timeoutId);
  }, [currentGameIndex, hydratedGames, preloadedVideos]);

  // Video sound management - videos autoplay muted, this controls which one has sound
  useEffect(() => {
    const videoElements = Array.from(videoRefs.current.values());
    if (videoElements.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Skip observer actions during programmatic navigation to prevent glitches
        if (isNavigatingRef.current) return;
        
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const gameId = video.dataset.gameId;
          
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // This video is NOW on screen - give it SOUND
            if (gameId) {
              setActiveVideoId(gameId);
              
              // MUTE all OTHER videos (they keep autoplaying, just silent)
              videoRefs.current.forEach((otherVideo, otherId) => {
                if (otherId !== gameId) {
                  otherVideo.muted = true;
                }
              });
              
              // UNMUTE this video (unless user manually muted it)
              if (!mutedGames.has(gameId)) {
                video.muted = false;
              }
            }
          } else if (entry.intersectionRatio < 0.3) {
            // Video is off screen - mute it (but let it keep playing)
            video.muted = true;
          }
        });
      },
      {
        threshold: [0.3, 0.5], // Trigger at 30% (mute) and 50% (unmute)
        rootMargin: '0px'
      }
    );

    videoElements.forEach(video => {
      if (video) observer.observe(video);
    });

    return () => {
      videoElements.forEach(video => {
        if (video) observer.unobserve(video);
      });
    };
  }, [hydratedGames, mutedGames]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

  // Give first video sound when feed loads (videos autoplay muted by default)
  useEffect(() => {
    if (!hydratedGames || hydratedGames.length === 0) return;
    
    const timer = setTimeout(() => {
      // Find the first video game
      const firstGame = hydratedGames[0];
      const isFirstGameVideo = firstGame?.media_type === 'video' && firstGame?.media_url;
      
      if (isFirstGameVideo && !activeVideoId) {
        const video = videoRefs.current.get(firstGame.id);
        if (video) {
          // Mute all other videos
          videoRefs.current.forEach((v, id) => {
            if (id !== firstGame.id) {
              v.muted = true;
            }
          });
          
          // Set this as active and give it sound
          setActiveVideoId(firstGame.id);
          
          // Unmute if user hasn't manually muted
          if (!mutedGames.has(firstGame.id)) {
            video.muted = false;
          }
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [hydratedGames, activeVideoId, mutedGames]);

  // Realtime: refetch feed on any games change
  useEffect(() => {
    const gamesChannel = supabase
      .channel('realtime:games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        queryClient.invalidateQueries({ queryKey: ['games'] });
      })
      .subscribe();

    // Also listen to comment changes to update comment counts in real-time
    const commentsChannel = supabase
      .channel('realtime:game_comments_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['games'] });
      })
      .subscribe();

    return () => {
      gamesChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', commentsOpenFor?.id],
    enabled: !!commentsOpenFor?.id,
    refetchInterval: 1000, // Refetch every 1 second for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 0, // Always consider data stale for instant updates
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

  // Fetch user's comment likes
  const { data: userCommentLikes } = useQuery({
    queryKey: ['userCommentLikes', userId, commentsOpenFor?.id],
    enabled: !!userId && !!commentsOpenFor?.id,
    refetchInterval: 1000, // Refetch every 1 second for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 0, // Always consider data stale for instant updates
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', userId);

      if (error) {
        console.warn('Comment likes fetch error:', error);
        return [];
      }
      return data || [];
    },
  });

  useEffect(() => {
    if (userCommentLikes) {
      setLikedComments(new Set(userCommentLikes.map(like => like.comment_id)));
    }
  }, [userCommentLikes]);

  useEffect(() => {
    if (!commentsOpenFor) return;
    const channel = supabase
      .channel(`comments:${commentsOpenFor.id}`)
      // Listen to all comment changes (INSERT, UPDATE, DELETE)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_comments',
        filter: `game_id=eq.${commentsOpenFor.id}`
      }, () => {
        refetchComments();
        queryClient.invalidateQueries({ queryKey: ['games'] }); // Update comment counts
      })
      // Listen to all comment like changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comment_likes'
      }, () => {
        refetchComments();
        queryClient.invalidateQueries({ queryKey: ['userCommentLikes', userId, commentsOpenFor.id] });
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [commentsOpenFor, refetchComments, queryClient, userId]);

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

        // Get user profile for notifications
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', uid)
          .single();

        if (profile) {
          // Send notification to game owner or comment owner
          if (commentsOpenFor.creator_id !== uid) {
            if (replyingTo) {
              // Notify comment owner about reply
              if (replyingTo.user_id !== uid) {
                await notifyCommentReply(
                  replyingTo.user_id,
                  profile.username,
                  profile.avatar_url || '',
                  uid,
                  commentsOpenFor.id,
                  commentsOpenFor.title,
                  replyingTo.id
                );
              }
            } else {
              // Notify game owner about comment
              await notifyGameComment(
                commentsOpenFor.creator_id,
                profile.username,
                profile.avatar_url || '',
                uid,
                commentsOpenFor.id,
                commentsOpenFor.title,
                '', // comment ID will be generated
                commentsOpenFor.thumbnail_url || commentsOpenFor.cover_url || undefined
              );
            }
          }

          // Detect and notify user mentions (@username)
          const userMentions = newComment.match(/@([a-zA-Z0-9._]+)(?![a-zA-Z0-9._])/g);
          if (userMentions) {
            for (const mention of userMentions) {
              const username = mention.substring(1);
              const { data: mentionedUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

              if (mentionedUser && mentionedUser.id !== uid) {
                await notifyMention(
                  mentionedUser.id,
                  profile.username,
                  profile.avatar_url || '',
                  uid,
                  commentsOpenFor.id,
                  commentsOpenFor.title,
                  '' // comment ID
                );
              }
            }
          }

          // Detect and notify game mentions (+gamename)
          const gameMentions = newComment.match(/\+([a-zA-Z0-9._\s]+)(?![a-zA-Z0-9._])/g);
          if (gameMentions) {
            for (const mention of gameMentions) {
              const gameTitle = mention.substring(1);
              const { data: mentionedGame, error: gameError } = await supabase
                .from('games')
                .select('id, title, creator_id, thumbnail_url, cover_url')
                .ilike('title', `%${gameTitle}%`)
                .limit(1)
                .single();

              if (mentionedGame && !gameError && mentionedGame.creator_id !== uid) {
                await notifyGameMention(
                  mentionedGame.creator_id,
                  profile.username,
                  profile.avatar_url || '',
                  uid,
                  mentionedGame.id,
                  mentionedGame.title,
                  '', // comment ID
                  mentionedGame.thumbnail_url || mentionedGame.cover_url || undefined
                );
              }
            }
          }
        }
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

        // Send notification to followed user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', userId)
          .single();

        if (profile && !profileError) {
          await notifyNewFollower(
            creatorId,
            profile.username,
            profile.avatar_url || '',
            userId
          );
        }
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

    // OPTIMISTIC UPDATE: Update UI immediately
    setLikedComments(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });

    // Optimistically update the comment's likes_count in the UI
    queryClient.setQueryData(['comments', commentsOpenFor?.id], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((comment: CommentRow) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes_count: isLiked
              ? Math.max((comment.likes_count || 0) - 1, 0)
              : (comment.likes_count || 0) + 1
          };
        }
        return comment;
      });
    });

    try {
      if (isLiked) {
        // Unlike: Delete from database
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);

        if (error) {
          console.warn('Failed to unlike comment:', error);
          throw error;
        }
      } else {
        // Like: Insert into database
        const { error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: userId });

        if (error) {
          console.warn('Failed to like comment:', error);
          throw error;
        }

        // Send notification to comment owner (async, don't wait)
        if (commentsOpenFor) {
          const comment = comments?.find(c => c.id === commentId);
          if (comment && comment.user_id !== userId) {
            supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', userId)
              .single()
              .then(({ data: profile, error: profileError }) => {
                if (profile && !profileError) {
                  notifyCommentLike(
                    comment.user_id,
                    profile.username,
                    profile.avatar_url || '',
                    userId,
                    commentsOpenFor.id,
                    commentsOpenFor.title,
                    commentId,
                    commentsOpenFor.thumbnail_url || commentsOpenFor.cover_url || undefined
                  );
                }
              });
          }
        }
      }

      // Refetch in background to sync with server
      refetchComments();
    } catch (error) {
      console.error('Failed to like/unlike comment:', error);
      toast.error('Failed to update like');

      // ROLLBACK: Revert optimistic update on error
      setLikedComments(prev => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(commentId);
        } else {
          next.delete(commentId);
        }
        return next;
      });

      // Revert the count
      queryClient.setQueryData(['comments', commentsOpenFor?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((comment: CommentRow) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes_count: isLiked
                ? (comment.likes_count || 0) + 1
                : Math.max((comment.likes_count || 0) - 1, 0)
            };
          }
          return comment;
        });
      });
    }
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
    return (
      <>
        {/* Mobile Loading - Full screen scroll-snap skeleton */}
        <div className="md:hidden">
          <MobileFeedSkeleton count={3} />
        </div>
        
        {/* Desktop Loading - Existing layout */}
        <div className="hidden md:block relative w-full bg-[#F8F9FA]" style={{ height: '100dvh' }}>
          <div className="h-full overflow-y-auto no-scrollbar pb-16 md:pb-0">
            <div className="flex flex-col items-start w-full max-w-[900px] mx-auto justify-start min-h-screen py-8 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-full flex items-center justify-center">
                  <div className="relative w-auto h-auto flex items-center gap-6">
                    <div className="relative w-[374px] h-[660px]">
                      <GameCardSkeleton />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
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
        onClose={() => {
          setSelectedGame(null);
          // Restore scroll position after closing game
          setTimeout(() => {
            const scrollContainer = document.querySelector('.snap-y');
            if (scrollContainer && savedScrollPosition.current > 0) {
              scrollContainer.scrollTop = savedScrollPosition.current;
            }
            // Resume the active video
            if (activeVideoId) {
              const video = videoRefs.current.get(activeVideoId);
              if (video) {
                video.play().catch(() => {});
                if (!mutedGames.has(activeVideoId)) {
                  video.muted = false;
                }
              }
            }
          }, 100);
        }}
      />
    );
  }

  // TikTok-style vertical snap scroll with centered layout
  return (
    <>
      {/* Snap scrolling feed - TikTok style on mobile, centered on desktop */}
      <div className="relative w-full bg-white dark:bg-black md:bg-[#F8F9FA]" style={{ height: '100' }}>
        {/* Desktop Navigation Buttons */}
        <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-50">
          <button
            onClick={navigateUp}
            className="h-12 w-12 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
            aria-label="Previous game"
          >
            <ChevronUp className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={navigateDown}
            className="h-12 w-12 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
            aria-label="Next game"
          >
            <ChevronDown className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Mobile: Snap scroll, Desktop: Normal scroll with centered content */}
        <div className="snap-feed-container md:h-full md:overflow-y-auto md:snap-none no-scrollbar pb-16 md:pb-0">
          {/* Desktop wrapper: flex column with centered items */}
          <div className="md:flex md:flex-col md:items-start md:w-full md:mx-auto md:justify-start md:min-h-screen md:py-8 md:gap-8">
            {hydratedGames?.map((game, index) => (
              <div key={game.id} data-game-index={index} className="snap-item w-full flex items-center justify-center md:snap-align-none md:h-[760px]">
                {/* Mobile: Full bleed, Desktop: Centered card with action buttons */}
                <div className="relative w-full h-full md:w-auto md:h-[760px] md:flex md:items-end md:gap-6">
                  {/* Card container - Desktop: Fixed size with stacked effect */}
                  <div className="relative w-full h-full md:w-[424px] md:h-[760px]">
                    <Card className="relative w-full h-full overflow-visible md:overflow-hidden rounded-none md:rounded-2xl border-0 md:border md:border-gray-200 md:shadow-lg bg-black md:bg-gray-300">
                      {/* Conditional Media Rendering */}
                      {game.media_type === 'video' && game.media_url ? (
                        <video
                          ref={(el) => {
                            if (el) {
                              videoRefs.current.set(game.id, el);
                            } else {
                              videoRefs.current.delete(game.id);
                            }
                          }}
                          data-game-id={game.id}
                          key={game.id + '-video'}
                          className="absolute inset-0 w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          poster={game.thumbnail_url || game.cover_url || undefined}
                          onLoadStart={() => setLoadingVideos(prev => new Set(prev).add(game.id))}
                          onCanPlay={() => setLoadingVideos(prev => { const s = new Set(prev); s.delete(game.id); return s; })}
                          onPlaying={() => setLoadingVideos(prev => { const s = new Set(prev); s.delete(game.id); return s; })}
                          onError={() => setLoadingVideos(prev => { const s = new Set(prev); s.delete(game.id); return s; })}
                          style={{ transform: 'translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
                        >
                          <source src={game.media_url} type="video/mp4" />
                        </video>
                      ) : (
                        <img
                          src={game.media_url || game.cover_url || game.thumbnail_url || '/placeholder.svg'}
                          alt={game.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onLoad={() => {
                            // Auto-play background sound when image loads (if not muted)
                            if (game.background_sound_url && !mutedGames.has(game.id)) {
                              playBackgroundSound(game.id, game.background_sound_url);
                            }
                          }}
                        />
                      )}
                      
                      {/* Video Loading Indicator */}
                      {game.media_type === 'video' && loadingVideos.has(game.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                            <span className="text-white text-sm font-medium">Loading video...</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent dark:from-black/95 dark:via-black/20 md:bg-gradient-to-b md:from-transparent md:via-transparent md:to-black/80" />

                      {/* Remix button - top right */}
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
                      <div className="absolute left-0 right-[70px] md:right-[80px] bottom-6 md:bottom-2 p-3 md:p-5 text-white z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
                            onClick={() => game.creator?.username && navigate(`/u/${game.creator.username}`)}
                          >
                            <div className="relative">
                              <Avatar className="w-9 h-9 md:w-12 md:h-12 border-2 border-white/50 group-hover:border-white transition-colors">
                                <AvatarImage src={game.creator?.avatar_url || undefined} className="object-cover" />
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
                        {game.description && (
                          <div>
                            <div className={`text-xs md:text-sm text-white/95 drop-shadow-md leading-snug ${expandedDescriptions.has(game.id) ? '' : 'line-clamp-2'}`}>
                              <LinkifiedText text={game.description} />
                            </div>
                            {game.description.length > 80 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDescriptions(prev => {
                                    const next = new Set(prev);
                                    if (next.has(game.id)) {
                                      next.delete(game.id);
                                    } else {
                                      next.add(game.id);
                                    }
                                    return next;
                                  });
                                }}
                                className="text-xs md:text-sm font-semibold text-white/90 hover:text-white mt-1 drop-shadow-lg"
                              >
                                {expandedDescriptions.has(game.id) ? 'Less' : 'More'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right action bar - Mobile only (desktop buttons are on right outside card) */}
                      <div className="md:hidden absolute right-3 bottom-20 flex flex-col gap-3 items-center text-white z-30">
                        {/* Play button - Purple gradient on desktop, primary on mobile */}
                        <button
                          aria-label="Play game"
                          className="h-10 w-10 md:h-10 md:w-10 mb-2 rounded-full flex items-center justify-center gradient-primary md:bg-[#5B4AF4] text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                          onClick={() => handlePlay(game)}
                        >
                          <Play className="h-5 w-5 md:h-5 md:w-5 fill-current md:ml-1" strokeWidth={2} />
                        </button>

                        {/* Like button */}
                        <div className="flex flex-col items-center gap-0.5 md:gap-1">
                          <button
                            aria-label={likedGames.has(game.id) ? 'Unlike game' : 'Like game'}
                            className={`h-10 w-10 md:h-10 md:w-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 ${likedGames.has(game.id)
                                ? 'bg-transparent text-white'
                                : 'bg-transparent md:bg-transparent text-white hover:bg-transparent'
                              }`}
                            onClick={() => likeMutation.mutate({ gameId: game.id, isLiked: likedGames.has(game.id) })}
                          >
                            <Heart className={`h-7 w-7 md:h-8 md:w-8 hover:scale-110 active:scale-95 transition-all duration-200 ${likedGames.has(game.id)
                                ? 'fill-red-500 stroke-red-500'
                                : 'fill-none '
                              }`} strokeWidth={2} />
                          </button>
                          <span className="text-[12px] md:text-xs font-bold text-white md:text-gray-500 drop-shadow-lg md:drop-shadow-none md:mt-1">{game.likes_count ?? 0}</span>
                        </div>

                        {/* Comments button */}
                        <div className="flex flex-col items-center gap-0.5 md:gap-1">
                          <button
                            aria-label="View comments"
                            className="h-10 w-10 md:h-10 md:w-10 rounded-full flex items-center justify-center bg-transparent md:backdrop-blur-sm text-white hover:scale-110 active:scale-95 transition-all duration-200"
                            onClick={() => setCommentsOpenFor(game)}
                          >
                            <MessageCircle className="h-7 w-7 md:h-8 md:w-8 fill-none transform -scale-x-100" strokeWidth={2} />
                          </button>
                          <span className="text-[12px] md:text-xs font-bold text-white md:text-gray-500 drop-shadow-lg md:drop-shadow-none md:mt-0">
                            {commentsOpenFor?.id === game.id ? comments.length : (game.comments_count || 0)}
                          </span>
                        </div>

                        {/* Share button */}
                        <div className="flex flex-col items-center">
                          <button
                            aria-label="Share game"
                            className="h-12 w-12 md:h-12 md:w-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
                            onClick={() => handleShare(game)}
                          >
                            <Share2 className="h-7 w-7 md:h-8 md:w-8 ml-[-2px]" strokeWidth={2} />
                          </button>
                        </div>

                        {/* Mute/Unmute button - show for videos or games with background sound */}
                        {(game.media_type === 'video' || game.background_sound_url) && (
                          <div className="flex flex-col items-center">
                            <button
                              aria-label={mutedGames.has(game.id) ? 'Unmute sound' : 'Mute sound'}
                              className={`h-12 w-12 md:h-12 md:w-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 ${
                                mutedGames.has(game.id)
                                  ? 'text-red-500'
                                  : 'text-white'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGameMute(game.id);
                              }}
                            >
                              {mutedGames.has(game.id) ? (
                                <VolumeX className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2} />
                              ) : (
                                <Volume2 className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        )}
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

                  {/* Desktop: Action buttons on RIGHT - positioned at bottom */}
                  <div className="hidden md:flex flex-col gap-4 items-center self-end mb-8">
                    {/* Play button */}
                    <button
                      aria-label="Play game"
                      className="h-14 w-14 rounded-full flex items-center justify-center bg-[#5B4AF4] text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
                      onClick={() => handlePlay(game)}
                    >
                      <Play className="h-6 w-6 fill-white ml-0.5" strokeWidth={0} />
                    </button>

                    {/* Like button */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        aria-label={likedGames.has(game.id) ? 'Unlike game' : 'Like game'}
                        className="h-14 w-14 rounded-full flex items-center justify-center bg-transparent text-gray-700 dark:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                        onClick={() => likeMutation.mutate({ gameId: game.id, isLiked: likedGames.has(game.id) })}
                      >
                        <Heart className={`h-6 w-6 ${likedGames.has(game.id)
                            ? 'fill-red-500 stroke-red-500'
                            : 'fill-none stroke-gray-700 dark:stroke-white'
                          }`} strokeWidth={2} />
                      </button>
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{game.likes_count ?? 0}</span>
                    </div>

                    {/* Comments button */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        aria-label="View comments"
                        className="h-14 w-14 rounded-full flex items-center justify-center bg-transparent text-gray-700 dark:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                        onClick={() => setCommentsOpenFor(game)}
                      >
                        <MessageCircle className="h-6 w-6 fill-none transform -scale-x-100 stroke-gray-700 dark:stroke-white" strokeWidth={2} />
                      </button>
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        {commentsOpenFor?.id === game.id ? comments.length : (game.comments_count || 0)}
                      </span>
                    </div>

                    {/* Share button */}
                    <div className="flex flex-col items-center">
                      <button
                        aria-label="Share game"
                        className="h-14 w-14 rounded-full flex items-center justify-center bg-transparent text-gray-700 dark:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                        onClick={() => handleShare(game)}
                      >
                        <Share2 className="h-6 w-6 ml-[-2px] stroke-gray-700 dark:stroke-white" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Mute/Unmute button - show for videos or games with background sound */}
                    {(game.media_type === 'video' || game.background_sound_url) && (
                      <div className="flex flex-col items-center">
                        <button
                          aria-label={mutedGames.has(game.id) ? 'Unmute sound' : 'Mute sound'}
                          className={`h-14 w-14 rounded-full flex items-center justify-center bg-transparent hover:scale-110 active:scale-95 transition-all duration-200 ${
                            mutedGames.has(game.id)
                              ? 'text-red-500'
                              : 'text-gray-700 dark:text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGameMute(game.id);
                          }}
                        >
                          {mutedGames.has(game.id) ? (
                            <VolumeX className="h-6 w-6 stroke-current" strokeWidth={2} />
                          ) : (
                            <Volume2 className="h-6 w-6 stroke-gray-700 dark:stroke-white" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    )}
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
        <SheetContent side="right" className="w-full sm:w-[420px] md:w-[480px] flex flex-col p-0 h-full">
          {/* Mobile: Instagram/TikTok style with profile header */}
          {/* Desktop: Simple header with just title */}
          <div className="md:hidden px-4 py-3 border-b flex items-center gap-3 flex-shrink-0 bg-background">
            <button
              onClick={() => commentsOpenFor?.creator?.username && navigate(`/u/${commentsOpenFor.creator.username}`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-10 w-10 border-2 border-muted">
                <AvatarImage src={commentsOpenFor?.creator?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="gradient-primary text-white text-sm font-semibold">
                  {commentsOpenFor?.creator?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">@{commentsOpenFor?.creator?.username || 'creator'}</span>
                <span className="text-xs text-muted-foreground">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
              </div>
            </button>
            {commentsOpenFor?.creator_id && commentsOpenFor.creator_id !== userId && (
              <Button
                size="sm"
                variant={followedUsers.has(commentsOpenFor.creator_id) ? "outline" : "default"}
                className={followedUsers.has(commentsOpenFor.creator_id) ? "" : "gradient-primary"}
                onClick={() => handleFollowUser(commentsOpenFor.creator_id)}
              >
                {followedUsers.has(commentsOpenFor.creator_id) ? 'Following' : 'Follow'}
              </Button>
            )}
            {/* Spacer to push close button to the right and prevent overlap */}
            <div className="flex-1" />
          </div>

          {/* Desktop: Simple header */}
          <div className="hidden md:block px-6 py-4 border-b flex-shrink-0 bg-background">
            <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
          </div>

          {/* Scrollable comments area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 smooth-scroll-mobile">
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
                        <AvatarImage src={c.user?.avatar_url || undefined} className="object-cover" />
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
                        <div className="text-sm text-foreground whitespace-pre-wrap break-words mt-1">
                          <CommentText text={c.content} />
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleLikeComment(c.id)}
                          className="flex items-center gap-1.5 text-xs hover:text-white transition-colors group"
                        >
                          <span className={`text-lg font-bold transition-colors ${likedComments.has(c.id) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>+</span>
                          <span className="text-muted-foreground">{c.likes_count || 0}</span>
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
                                <AvatarImage src={r.user?.avatar_url || undefined} className="object-cover" />
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
                                  <span className="text-muted-foreground">{r.likes_count || 0}</span>
                                </button>
                                <button
                                  onClick={() => setReplyingTo(r)}
                                  className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                                >
                                  Reply
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
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <div className="text-sm font-medium text-muted-foreground">No comments yet</div>
                <div className="text-xs text-muted-foreground mt-1">Be the first to comment!</div>
              </div>
            )}
          </div>

          {/* Unified input for both Mobile and Desktop */}
          <div className="border-t px-4 md:px-6 py-3 md:py-4 pb-20 md:pb-4 bg-background flex-shrink-0">
            {replyingTo && (
              <div className="mb-2 flex items-center gap-2 text-xs bg-muted/50 md:bg-transparent px-3 md:px-0 py-2 md:py-0 rounded-lg md:rounded-none text-muted-foreground">
                <span className="md:hidden">Replying to <span className="font-semibold text-foreground">@{replyingTo.user?.username}</span></span>
                <span className="hidden md:inline">Replying to @{replyingTo.user?.username}</span>
                <button onClick={() => setReplyingTo(null)} className="ml-auto text-primary hover:underline font-medium">
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* Mobile: Show avatar */}
              {userId && (
                <Avatar className="h-8 w-8 flex-shrink-0 md:hidden">
                  <AvatarImage src={currentUserProfile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="gradient-primary text-white text-xs">
                    {currentUserProfile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Single GIF Picker Popover - button position changes based on screen size */}
              <Popover open={gifPickerOpen} onOpenChange={setGifPickerOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 md:order-first h-9 w-9 md:h-10 md:w-10"
                    type="button"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[320px] p-0 max-h-[60vh] overflow-hidden"
                  align="start"
                  side="top"
                  sideOffset={8}
                  onInteractOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('[role="dialog"]')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <GifPicker onSelect={handleGifSelect} />
                </PopoverContent>
              </Popover>

              {/* Input field */}
              <MentionInput
                placeholder={replyingTo ? "Write a reply... (@ for users, + for games)" : "Add a comment... (@ for users, + for games)"}
                value={newComment}
                onChange={setNewComment}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                className="flex-1 order-first md:order-none"
              />

              {/* Send button */}
              <Button
                onClick={handleSendComment}
                disabled={!newComment.trim()}
                size="sm"
                className="gradient-primary font-semibold md:font-normal"
              >
                {replyingTo ? 'Reply' : (
                  <span className="md:hidden">Post</span>
                )}
                <span className="hidden md:inline">{replyingTo ? 'Reply' : 'Send'}</span>
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
              {isRemixing ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing...</>) : 'Publish Remix'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
