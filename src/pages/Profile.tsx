import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Heart, Play, Loader2, Pencil, UserPlus, UserCheck, Star, Trash2, Coins, LogOut, Share2, Settings, Bookmark, Sparkles, Plus, HelpCircle, Crown, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GamePlayer } from "@/components/GamePlayer";
import { ActivityFeed } from "@/components/ActivityFeed";
import { logActivity } from "@/lib/activityLogger";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Switch } from "@/components/ui/switch";
import { Dialog as UIDialog, DialogContent as UIDialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { CoinPurchase } from "@/components/CoinPurchase";
import { PlusBadge } from "@/components/PlusBadge";
import { ClaimMissingCoins } from "@/components/ClaimMissingCoins";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { ProfileHeaderSkeleton, GameGridSkeleton, TabsContentSkeleton, UserListSkeleton } from "@/components/SkeletonComponents";
import { NotificationPanel } from "@/components/NotificationPanel";
import { Bell } from "lucide-react";
import { LinkifiedText } from "@/components/LinkifiedText";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { NotificationBanner } from "@/components/NotificationBanner";

import { isSubscribed, isPushSupported } from "@/lib/pushNotifications";
import { MentionTextarea } from "@/components/MentionTextarea";
import { ImageCropper } from "@/components/ImageCropper";
import { VideoThumbnail } from "@/components/VideoThumbnail";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingRemixed, setIsLoadingRemixed] = useState(true);
  const [isLoadingLiked, setIsLoadingLiked] = useState(true);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [userGames, setUserGames] = useState<any[]>([]);
  const [remixedGames, setRemixedGames] = useState<any[]>([]);
  const [likedGames, setLikedGames] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formBio, setFormBio] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [coinPurchaseOpen, setCoinPurchaseOpen] = useState(false);
  const [claimCoinsOpen, setClaimCoinsOpen] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Game-related settings (persisted locally)
  const [autoplayFeed, setAutoplayFeed] = useState<boolean>(true);
  const [enableSoundByDefault, setEnableSoundByDefault] = useState<boolean>(false);
  const [highGraphicsQuality, setHighGraphicsQuality] = useState<boolean>(true);
  const [showRemixBadges, setShowRemixBadges] = useState<boolean>(true);
  const [compactGridLayout, setCompactGridLayout] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('playgen:settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.autoplayFeed === 'boolean') setAutoplayFeed(parsed.autoplayFeed);
        if (typeof parsed.enableSoundByDefault === 'boolean') setEnableSoundByDefault(parsed.enableSoundByDefault);
        if (typeof parsed.highGraphicsQuality === 'boolean') setHighGraphicsQuality(parsed.highGraphicsQuality);
        if (typeof parsed.showRemixBadges === 'boolean') setShowRemixBadges(parsed.showRemixBadges);
        if (typeof parsed.compactGridLayout === 'boolean') setCompactGridLayout(parsed.compactGridLayout);
      }
    } catch {}
  }, []);

  // Check notification subscription status
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!isPushSupported()) return;
      
      const subscribed = await isSubscribed();
      if (!subscribed) {
        // Show notification prompt after a delay
        setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 3000);
      }
    };
    
    checkNotificationStatus();
  }, []);

  useEffect(() => {
    try {
      const payload = {
        autoplayFeed,
        enableSoundByDefault,
        highGraphicsQuality,
        showRemixBadges,
        compactGridLayout,
      };
      localStorage.setItem('playgen:settings', JSON.stringify(payload));
    } catch {}
  }, [autoplayFeed, enableSoundByDefault, highGraphicsQuality, showRemixBadges, compactGridLayout]);

  useEffect(() => {
    // Check if edit parameter is in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'true') {
      // Wait for profile to load then open edit dialog
      setTimeout(() => setEditOpen(true), 500);
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/profile');
    }
    
    fetchProfile();
    fetchUserGames();
    fetchRemixedGames();
    fetchLikedGames();
    checkFollowStatus();
    fetchUnreadNotificationsCount();

    // Live updates for follower counts, games, and coins
    const followChannel = supabase
      .channel('realtime:follows')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => {
        fetchProfile();
      })
      .subscribe();

    const gamesChannel = supabase
      .channel('realtime:games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        fetchUserGames();
      })
      .subscribe();

    // Realtime coin and follower count updates
    const profileChannel = supabase
      .channel('realtime:profile')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${currentUserId}`
      }, (payload) => {
        console.log('Profile updated:', payload);
        // Update profile with new data
        if (payload.new) {
          setProfile((prev: any) => ({
            ...prev,
            coins: payload.new.coins,
            is_plus_member: payload.new.is_plus_member,
            followers_count: payload.new.followers_count,
            following_count: payload.new.following_count
          }));
          
          // Show toast notification if coins increased
          if (payload.old && payload.new.coins > payload.old.coins) {
            const coinsAdded = payload.new.coins - payload.old.coins;
            toast.success(`🎉 ${coinsAdded} coins credited to your account!`, {
              description: "You're now a Plus member!"
            });
          }
          
          // Reload followers/following lists if they're open
          if (followersOpen) {
            loadFollowers();
          }
          if (followingOpen) {
            loadFollowing();
          }
        }
      })
      .subscribe();

    return () => {
      followChannel.unsubscribe();
      gamesChannel.unsubscribe();
      profileChannel.unsubscribe();
    };
  }, [currentUserId]);

  // Separate effect for likes channel
  useEffect(() => {
    const likesChannel = supabase
      .channel('realtime:likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_likes' }, () => {
        fetchLikedGames();
        calculateTotalLikes();
      })
      .subscribe();

    return () => {
      likesChannel.unsubscribe();
    };
  }, []);

  // Real-time updates for followers/following lists when dialogs are open
  useEffect(() => {
    if (!followersOpen && !followingOpen) return;
    
    const followsChannel = supabase
      .channel('realtime:follows-lists')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'follows' 
      }, () => {
        // Reload the appropriate list
        if (followersOpen) {
          loadFollowers();
        }
        if (followingOpen) {
          loadFollowing();
        }
      })
      .subscribe();

    return () => {
      followsChannel.unsubscribe();
    };
  }, [followersOpen, followingOpen, profile?.id]);


  const checkFollowStatus = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id || null;
    if (!userId || !profile) return;

    const { data: followRow } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', userId)
      .eq('following_id', profile.id)
      .single();

    setIsFollowing(!!followRow);
  };

  const toggleFollow = async () => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || null;
    if (!userId || !profile) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', profile.id);
      
      toast.success("Unfollowed user");
      setIsFollowing(false);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: userId, following_id: profile.id });
      
      // Log follow activity
      await logActivity({ type: 'user_followed', targetUserId: profile.id });
      
      toast.success("Following user");
      setIsFollowing(true);
    }
    
    fetchProfile();
  };

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id || null;
    if (uid) {
      setCurrentUserId(uid);
      // Ensure profile exists; if missing, create one with a unique username
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (!data) {
        const base = `user_${uid.slice(0,8)}`
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 24);
        let attempt = 0;
        let candidate = base || `user_${user.id.slice(0,8)}`;
        while (attempt < 50) {
          const { data: row } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', candidate)
            .maybeSingle();
          if (!row) break;
          attempt += 1;
          const suffix = `_${attempt}`;
          const maxBaseLength = Math.max(1, 24 - suffix.length);
          candidate = `${(base || 'user').slice(0, maxBaseLength)}${suffix}`;
        }
        await supabase.from('profiles').insert({ id: uid, username: candidate });
      }

      const refreshed = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      setProfile(refreshed.data);
      if (refreshed.data?.name) setFormName(refreshed.data.name);
      if (refreshed.data?.username) setFormUsername(refreshed.data.username);
      if (refreshed.data?.bio) setFormBio(refreshed.data.bio);
      if (refreshed.data?.avatar_url) setPreviewUrl(refreshed.data.avatar_url);
    }
    setIsLoadingProfile(false);
  };

  const loadFollowers = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, follower:profiles!follows_follower_id_fkey(id, username, avatar_url)')
      .eq('following_id', profile.id);
    if (!error) setFollowers((data || []).map((r: any) => r.follower).filter(Boolean));
  };

  const loadFollowing = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, following:profiles!follows_following_id_fkey(id, username, avatar_url)')
      .eq('follower_id', profile.id);
    if (!error) setFollowing((data || []).map((r: any) => r.following).filter(Boolean));
  };

  const fetchUserGames = async () => {
    setIsLoadingGames(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (uid) {
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', uid)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user games:', error);
      }
      setUserGames(games || []);
    }
    setIsLoadingGames(false);
  };

  const fetchRemixedGames = async () => {
    setIsLoadingRemixed(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (uid) {
      const { data: remixes, error } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', uid)
        .not('original_game_id', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching remixed games:', error);
      }
      setRemixedGames(remixes || []);
    }
    setIsLoadingRemixed(false);
  };

  const fetchLikedGames = async () => {
    setIsLoadingLiked(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (uid) {
      const { data: likes, error } = await supabase
        .from('game_likes')
        .select('game_id, games(*)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching liked games:', error);
      }
      setLikedGames(likes?.map(l => l.games).filter(Boolean) || []);
    }
    setIsLoadingLiked(false);
  };

  const fetchUnreadNotificationsCount = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (uid) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid);
      
      if (!error && data) {
        // Count unread notifications from payload
        const unreadCount = data.filter((n: any) => !n.payload?.read).length;
        setUnreadNotificationsCount(unreadCount);
      }
    }
  };

  const calculateTotalLikes = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (uid) {
      const { data: games } = await supabase
        .from('games')
        .select('id')
        .eq('creator_id', uid);
      
      if (games && games.length > 0) {
        const gameIds = games.map(g => g.id);
        const { count } = await supabase
          .from('game_likes')
          .select('*', { count: 'exact', head: true })
          .in('game_id', gameIds);
        
        setTotalLikes(count || 0);
      }
    }
  };

  useEffect(() => {
    if (userGames.length > 0) {
      calculateTotalLikes();
    }
  }, [userGames]);

  const deleteGame = async (gameId: string) => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    setDeletingId(gameId);
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)
        .eq('creator_id', uid);
      if (error) throw error;
      setUserGames((prev) => prev.filter((g) => g.id !== gameId));
      toast.success('Game deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete game');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = async () => {
    if (!profile) {
      await fetchProfile();
    }
    setFormName(profile?.name || "");
    setFormUsername(profile?.username || "");
    setFormBio(profile?.bio || "");
    setPreviewUrl(profile?.avatar_url || null);
    setSelectedFile(null);
    setEditOpen(true);
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(profile?.avatar_url || null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setSelectedFile(file);
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedImage: string) => {
    setPreviewUrl(croppedImage);
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    setSelectedFile(null);
  };

  const uploadAvatarAndGetUrl = async (userId: string, file: File): Promise<string> => {
    try {
      // Use the cropped preview URL directly
      if (previewUrl && previewUrl.startsWith('data:')) {
        toast.success("Profile image updated successfully");
        return previewUrl;
      }
      
      // Fallback: use original file
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          toast.success("Profile image updated successfully");
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
      
      /* Commented out Supabase storage upload due to RLS issues
      const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1) : 'png';
      const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const path = `public/${userId}_${Date.now()}.${safeExt}`;
      
      // Show upload progress to user
      toast.info("Uploading profile image...");
      
      const { error: uploadError, data: uploadData } = await supabase
        .storage
        .from('avatars')
        .upload(path, resizedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/png',
        });
        
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      
      if (!data || !data.publicUrl) {
        throw new Error("Failed to get public URL for uploaded image");
      }
      
      return data.publicUrl;
      */
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
      throw error;
    }
  };
  
  // Helper function to resize images before upload
  const resizeImage = async (file: File, maxSize: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with reasonable quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create image blob"));
              return;
            }
            resolve(blob);
          },
          file.type || 'image/jpeg',
          0.85 // 85% quality
        );
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image for resizing"));
      };
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id || null;
      if (!uid) {
        toast.error('Please sign in to update your profile');
        return;
      }

      let avatarUrl = profile?.avatar_url || null;
      if (selectedFile) {
        avatarUrl = await uploadAvatarAndGetUrl(uid, selectedFile);
      }

      const newName = formName.trim();
      const newUsername = formUsername.trim();
      
      if (!newName) {
        toast.error('Name cannot be empty');
        return;
      }
      
      if (!newUsername) {
        toast.error('Username cannot be empty');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: newName,
          username: newUsername, 
          bio: formBio.trim(), 
          avatar_url: avatarUrl 
        })
        .eq('id', uid);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('duplicate') || msg.includes('unique')) {
          toast.error('That username is taken. Please choose another.');
        } else {
          toast.error('Failed to update profile');
        }
        throw error;
      }

      toast.success('Profile updated');
      setEditOpen(false);
      await fetchProfile();
    } catch (e) {
      // no-op: toast already shown
    } finally {
      setSaving(false);
    }
  };

  const getLevelInfo = (xp: number) => {
    const level = Math.floor(xp / 100) + 1;
    const currentLevelXp = xp % 100;
    return { level, progress: currentLevelXp };
  };

  const levelInfo = profile ? getLevelInfo(profile.xp || 0) : { level: 1, progress: 0 };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/u/${profile?.username}`;
    const shareText = `Check out ${profile?.username}'s profile on Oplus!\n\n${profileUrl}`;
    
    try {
      // Try Web Share API first (for mobile)
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.username} on Oplus`,
          text: shareText,
          url: profileUrl,
        });
        toast.success("Profile shared!");
        return;
      }
      
      // Fallback to clipboard
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard!");
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        // Try clipboard as last resort
        try {
          await navigator.clipboard.writeText(profileUrl);
          toast.success("Profile link copied to clipboard!");
        } catch {
          toast.error("Failed to share profile");
        }
      }
    }
  };

  if (selectedGame) {
    return <GamePlayer game={selectedGame} onClose={() => setSelectedGame(null)} />;
  }

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen pb-16 md:pb-0">
        <div className="w-full px-3 md:px-8 py-6">
          <ProfileHeaderSkeleton />
          <div className="mt-6">
            <GameGridSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0 no-scrollbar">
      
      <div className="w-full">
        {/* Notification Banner */}
        <div className="px-3 md:px-8 pt-6">
          <NotificationBanner />
        </div>
        
        {/* Profile Header - Redesigned Layout */}
        <div className="px-3 md:px-8 py-6 max-w-full overflow-x-hidden">
          {/* Top Row: Notifications, Name, and Coins/Logout */}
          <div className="flex justify-between items-center mb-4 md:mb-6">
            {/* Left: Notification Button - Mobile Only */}
            <Button
              onClick={() => setNotificationsPanelOpen(true)}
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 md:hidden hover:bg-red-500/10 flex-shrink-0"
              title="Notifications"
            >
              <Bell className={`w-6 h-6 ${unreadNotificationsCount > 0 ? 'text-red-500' : ''}`} />
              {unreadNotificationsCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                </>
              )}
            </Button>

            {/* Center: Name - Display name */}
            <div className="flex-1 text-center px-2">
              <h2 className="text-xl md:text-2xl font-bold truncate">
                {profile?.name || profile?.username || 'User'}
              </h2>
            </div>

            {/* Right: Coins and Logout - Mobile Responsive */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap flex-shrink-0">
            <Button
              onClick={() => setCoinPurchaseOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Buy Coins</span>
              <span className="sm:hidden">Buy</span>
            </Button>
            <Button
              onClick={() => setClaimCoinsOpen(true)}
              variant="ghost"
              size="sm"
              className="gap-1 md:gap-2 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 text-xs md:text-sm px-2 md:px-4"
              title="Claim missing coins"
            >
              <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Claim</span>
            </Button>
            <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20">
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
              <span className="font-bold text-yellow-500 text-sm md:text-base">{profile?.coins || 0}</span>
            </div>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10"
              title="Logout"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            </div>
          </div>

          {/* Profile Info - Mobile Responsive Layout - Centered on Mobile */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8 mb-6">
            {/* Avatar - Centered on mobile with golden gradient ring for Plus members */}
            <div className="relative">
{profile?.is_plus_member ? (
                <div className="relative">
                  {/* Gold gradient ring */}
                  <div 
                    className="w-36 h-36 md:w-40 md:h-40 rounded-full p-[3px]"
                    style={{
                      background: 'linear-gradient(135deg, #a47a1e 0%, #d3a84c 14%, #ffec94 28%, #ffd87c 42%, #e6be69 57%, #b58f3e 71%, #956d13 85%, #a47a1e 100%)'
                    }}
                  >
                    <Avatar className="w-full h-full">
                      <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="text-3xl md:text-4xl bg-primary/20">
                        {profile?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ) : (
                <Avatar className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="text-3xl md:text-4xl bg-primary/20">
                    {profile?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            {/* Username, Buttons, Stats, and Bio - Centered on mobile */}
            <div className="flex-1 w-full max-w-full px-4 md:px-0">
              {/* Username with @ - Below profile photo */}
              <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                <h1 className="text-xl md:text-2xl font-semibold text-muted-foreground truncate max-w-[250px] md:max-w-none">
                  @{profile?.username}
                </h1>
                {(profile?.coins || 0) >= 100 && (
                  <Crown className="w-6 h-6 text-[#ffd87c] drop-shadow-lg flex-shrink-0" fill="#ffd87c" />
                )}
              </div>
              
              {/* Action Buttons Row - 30% bigger on mobile */}
              <div className="flex gap-2 mb-4 justify-center md:justify-start flex-wrap">
                <Button onClick={handleOpenEdit} variant="default" size="sm" className="px-5 md:px-6 py-2 text-sm md:text-sm h-10 md:h-9">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={handleShareProfile} variant="outline" size="sm" className="px-5 md:px-6 py-2 text-sm md:text-sm h-10 md:h-9">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  onClick={() => navigate('/settings')}
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10" 
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Stats Row - 30% bigger on mobile */}
              <div className="flex gap-6 md:gap-6 mb-4 justify-center md:justify-start">
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity text-center"
                  onClick={async () => { await loadFollowing(); setFollowingOpen(true); }}
                >
                  <span className="font-bold text-2xl md:text-xl block">{profile?.following_count || 0}</span>
                  <span className="text-muted-foreground text-sm md:text-base">Following</span>
                </button>
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity text-center"
                  onClick={async () => { await loadFollowers(); setFollowersOpen(true); }}
                >
                  <span className="font-bold text-2xl md:text-xl block">{profile?.followers_count || 0}</span>
                  <span className="text-muted-foreground text-sm md:text-base">Followers</span>
                </button>
                <div className="text-center">
                  <span className="font-bold text-2xl md:text-xl block">{totalLikes}</span>
                  <span className="text-muted-foreground text-sm md:text-base">Likes</span>
                </div>
              </div>

              {/* Bio - 30% bigger on mobile */}
              {profile?.bio ? (
                <p className="text-base md:text-base text-foreground leading-relaxed text-center md:text-left">
                  <LinkifiedText text={profile.bio} />
                </p>
              ) : (
                <p className="text-base md:text-base text-muted-foreground italic text-center md:text-left">No bio yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border border-border/60">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={previewUrl || undefined} alt="preview" className="object-cover" />
                    <AvatarFallback className="bg-muted">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <Label htmlFor="avatar">Profile image</Label>
                  <Input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Your display name"
                />
                <p className="text-xs text-muted-foreground">Your name as it appears on your profile</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Your username"
                  disabled
                  className="opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Username cannot be changed</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio (@ for users, + for games)</Label>
                <MentionTextarea
                  id="bio"
                  value={formBio}
                  onChange={setFormBio}
                  placeholder="Tell us about yourself... (@ users, + games)"
                  maxLength={100}
                  className="resize-none min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground text-right">{formBio.length}/100</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notification Prompt */}
        {showNotificationPrompt && (
          <div className="px-3 md:px-8 mb-6">
            <NotificationPermissionPrompt 
              variant="inline" 
              onClose={() => setShowNotificationPrompt(false)} 
            />
          </div>
        )}

        {/* Tabs - TikTok Style */}
        <Tabs defaultValue="created" className="w-full overflow-x-hidden">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
            <TabsTrigger 
              value="created" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 md:px-6 py-3 text-sm md:text-base whitespace-nowrap"
            >
              <Play className="w-4 h-4 mr-1 md:mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger 
              value="remixes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 md:px-6 py-3 text-sm md:text-base whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 mr-1 md:mr-2" />
              Remix
            </TabsTrigger>
            <TabsTrigger 
              value="liked" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 md:px-6 py-3 text-sm md:text-base whitespace-nowrap"
            >
              <Heart className="w-4 h-4 mr-1 md:mr-2" />
              Liked
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 md:px-6 py-3 text-sm md:text-base whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 mr-1 md:mr-2" />
              Achievements
            </TabsTrigger>

          </TabsList>

          <TabsContent value="created" className="mt-0">
            {isLoadingGames ? (
              <div className="py-4"><GameGridSkeleton count={6} /></div>
            ) : userGames.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No games yet.</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                {userGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="aspect-[9/16] relative cursor-pointer overflow-hidden bg-muted group"
                  >
                    {game.thumbnail_url ? (
                      <VideoThumbnail 
                        thumbnailUrl={game.thumbnail_url} 
                        title={game.title}
                        showPlayIcon={true}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center"><Play className="w-8 h-8 text-muted-foreground" /></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                      <p className="text-white text-xs font-semibold truncate">{game.title}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm px-2 py-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-3 text-white text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" fill="white" />
                          {game.plays_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" fill="white" />
                          {game.likes_count || 0}
                        </span>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-white hover:text-red-500 hover:bg-red-500/20" 
                        onClick={(e) => { e.stopPropagation(); deleteGame(game.id); }} 
                        disabled={deletingId === game.id} 
                        title="Delete game"
                      >
                        {deletingId === game.id ? (<Loader2 className="w-3 h-3 animate-spin" />) : (<Trash2 className="w-3 h-3" />)}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="remixes" className="mt-0">
            {isLoadingRemixed ? (
              <div className="py-4"><GameGridSkeleton count={6} /></div>
            ) : remixedGames.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No remixes yet.</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                {remixedGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="aspect-[9/16] relative cursor-pointer overflow-hidden bg-muted group"
                  >
                    {game.thumbnail_url ? (
                      <VideoThumbnail 
                        thumbnailUrl={game.thumbnail_url} 
                        title={game.title}
                        showPlayIcon={true}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center"><Play className="w-8 h-8 text-muted-foreground" /></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                      <p className="text-white text-xs font-semibold truncate">{game.title}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm px-2 py-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-3 text-white text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" fill="white" />
                          {game.plays_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" fill="white" />
                          {game.likes_count || 0}
                        </span>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-white hover:text-red-500 hover:bg-red-500/20" 
                        onClick={(e) => { e.stopPropagation(); deleteGame(game.id); }} 
                        disabled={deletingId === game.id} 
                        title="Delete game"
                      >
                        {deletingId === game.id ? (<Loader2 className="w-3 h-3 animate-spin" />) : (<Trash2 className="w-3 h-3" />)}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-0">
            {isLoadingLiked ? (
              <div className="py-4"><GameGridSkeleton count={6} /></div>
            ) : likedGames.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No liked games yet.</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                {likedGames.map((game: any) => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="aspect-[9/16] relative cursor-pointer overflow-hidden bg-muted group"
                  >
                    {game.thumbnail_url ? (
                      <VideoThumbnail 
                        thumbnailUrl={game.thumbnail_url} 
                        title={game.title}
                        showPlayIcon={true}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center"><Play className="w-8 h-8 text-muted-foreground" /></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                      <p className="text-white text-xs font-semibold truncate">{game.title}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-3 text-white text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" fill="white" />
                          {game.plays_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" fill="white" />
                          {game.likes_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-6 px-0">
            <AchievementsPanel />
          </TabsContent>


        </Tabs>
      </div>
      <FollowersFollowingDialogs
        followersOpen={followersOpen}
        setFollowersOpen={setFollowersOpen}
        followingOpen={followingOpen}
        setFollowingOpen={setFollowingOpen}
        followers={followers}
        following={following}
      />
      
      <CoinPurchase
        open={coinPurchaseOpen}
        onOpenChange={setCoinPurchaseOpen}
        onSuccess={() => fetchProfile()}
      />
      
      <ClaimMissingCoins
        open={claimCoinsOpen}
        onOpenChange={setClaimCoinsOpen}
      />
      
      <NotificationPanel
        open={notificationsPanelOpen}
        onOpenChange={setNotificationsPanelOpen}
        userId={currentUserId}
      />

      {/* Image Cropper */}
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

// Followers/Following dialogs
export function FollowersFollowingDialogs({
  followersOpen,
  setFollowersOpen,
  followingOpen,
  setFollowingOpen,
  followers,
  following,
}: any) {
  const navigate = useNavigate();
  
  const handleUserClick = (username: string, closeDialog: () => void) => {
    closeDialog();
    navigate(`/u/${username}`);
  };
  
  return (
    <>
      <UIDialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <UIDialogContent className="sm:max-w-[400px] rounded-2xl">
          <UIDialogHeader>
            <UIDialogTitle>Followers</UIDialogTitle>
          </UIDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {followers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No followers yet.</div>
            ) : (
              followers.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => handleUserClick(u.username, () => setFollowersOpen(false))}
                  className="flex items-center gap-3 w-full hover:bg-muted/50 p-3 rounded-lg transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="gradient-primary text-white text-sm">
                        {u.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator userId={u.id} className="absolute bottom-0 right-0 w-3 h-3" />
                  </div>
                  <div className="text-sm font-medium">@{u.username}</div>
                </button>
              ))
            )}
          </div>
        </UIDialogContent>
      </UIDialog>
      <UIDialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <UIDialogContent className="sm:max-w-[400px] rounded-2xl">
          <UIDialogHeader>
            <UIDialogTitle>Following</UIDialogTitle>
          </UIDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {following.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">Not following anyone.</div>
            ) : (
              following.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => handleUserClick(u.username, () => setFollowingOpen(false))}
                  className="flex items-center gap-3 w-full hover:bg-muted/50 p-3 rounded-lg transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="gradient-primary text-white text-sm">
                        {u.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator userId={u.id} className="absolute bottom-0 right-0 w-3 h-3" />
                  </div>
                  <div className="text-sm font-medium">@{u.username}</div>
                </button>
              ))
            )}
          </div>
        </UIDialogContent>
      </UIDialog>
    </>
  );
}