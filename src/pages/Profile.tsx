import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Heart, Play, Loader2, Pencil, UserPlus, UserCheck, Star, Trash2, Coins, LogOut, Share2, Settings, Bookmark, Sparkles, Plus, HelpCircle } from "lucide-react";
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

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userGames, setUserGames] = useState<any[]>([]);
  const [remixedGames, setRemixedGames] = useState<any[]>([]);
  const [likedGames, setLikedGames] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formBio, setFormBio] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    fetchProfile();
    fetchUserGames();
    fetchRemixedGames();
    fetchLikedGames();
    checkFollowStatus();

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

    // Realtime coin updates
    const profileChannel = supabase
      .channel('realtime:profile')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${currentUserId}`
      }, (payload) => {
        console.log('Profile updated:', payload);
        // Update profile with new coin count
        if (payload.new) {
          setProfile((prev: any) => ({
            ...prev,
            coins: payload.new.coins,
            is_plus_member: payload.new.is_plus_member
          }));
          
          // Show toast notification if coins increased
          if (payload.old && payload.new.coins > payload.old.coins) {
            const coinsAdded = payload.new.coins - payload.old.coins;
            toast.success(`🎉 ${coinsAdded} coins credited to your account!`, {
              description: "You're now a Plus member!"
            });
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
      if (refreshed.data?.username) setFormUsername(refreshed.data.username);
      if (refreshed.data?.bio) setFormBio(refreshed.data.bio);
      if (refreshed.data?.avatar_url) setPreviewUrl(refreshed.data.avatar_url);
    }
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
  };

  const fetchRemixedGames = async () => {
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
  };

  const fetchLikedGames = async () => {
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
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatarAndGetUrl = async (userId: string, file: File): Promise<string> => {
    try {
      // Resize image before upload to reduce file size
      const resizedFile = await resizeImage(file, 500); // Resize to max 500px width/height
      
      // Use data URL as fallback (works without Supabase storage)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          toast.success("Profile image updated successfully");
          // Return the data URL as the avatar URL
          resolve(reader.result as string);
        };
        reader.readAsDataURL(resizedFile);
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

      const newUsername = formUsername.trim();
      if (!newUsername) {
        toast.error('Username cannot be empty');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername, bio: formBio.trim(), avatar_url: avatarUrl })
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

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      
      <div className="w-full">
        {/* Profile Header - Redesigned Layout */}
        <div className="px-4 md:px-8 py-6">
          {/* Top Right: Coins and Logout */}
          <div className="flex justify-end items-center gap-3 mb-6">
            <Button
              onClick={() => setCoinPurchaseOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Buy Coins
            </Button>
            <Button
              onClick={() => setClaimCoinsOpen(true)}
              variant="ghost"
              size="sm"
              className="gap-2 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
              title="Claim missing coins"
            >
              <HelpCircle className="w-4 h-4" />
              Claim
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-yellow-500">{profile?.coins || 0}</span>
            </div>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Profile Info - Left Aligned Layout */}
          <div className="flex items-start gap-8 mb-6">
            {/* Avatar - 30% bigger with Plus badge */}
            <div className="relative">
              <Avatar className={`w-36 h-36 flex-shrink-0 ${profile?.is_plus_member ? 'ring-4 ring-gradient-to-br from-yellow-400 to-amber-500 ring-offset-2' : ''}`}>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-4xl bg-primary/20">
                  {profile?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {profile?.is_plus_member && (
                <div className="absolute -bottom-1 -right-1">
                  <PlusBadge size="lg" />
                </div>
              )}
            </div>
            
            {/* Username, Buttons, Stats, and Bio */}
            <div className="flex-1">
              {/* Username - Larger font */}
              <h1 className="text-3xl font-bold mb-3">{profile?.username}</h1>
              
              {/* Action Buttons Row - Horizontal */}
              <div className="flex gap-2 mb-4">
                <Button onClick={handleOpenEdit} variant="default" size="sm" className="px-6">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit profile
                </Button>
                <Button onClick={handleShareProfile} variant="outline" size="sm" className="px-6">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share profile
                </Button>
                <Button variant="ghost" size="icon" title="Settings">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Stats Row - Below buttons */}
              <div className="flex gap-6 mb-4">
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity"
                  onClick={async () => { await loadFollowing(); setFollowingOpen(true); }}
                >
                  <span className="font-bold text-xl">{profile?.following_count || 0}</span>
                  <span className="text-muted-foreground text-base ml-1.5">Following</span>
                </button>
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity"
                  onClick={async () => { await loadFollowers(); setFollowersOpen(true); }}
                >
                  <span className="font-bold text-xl">{profile?.followers_count || 0}</span>
                  <span className="text-muted-foreground text-base ml-1.5">Followers</span>
                </button>
                <div>
                  <span className="font-bold text-xl">{totalLikes}</span>
                  <span className="text-muted-foreground text-base ml-1.5">Likes</span>
                </div>
              </div>

              {/* Bio - At the end */}
              {profile?.bio ? (
                <p className="text-base text-foreground leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-base text-muted-foreground italic">No bio yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border border-border/60">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={previewUrl || undefined} alt="preview" />
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Your username"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={100}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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

        {/* Tabs - TikTok Style */}
        <Tabs defaultValue="created" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="created" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
            >
              <Play className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger 
              value="remixes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Remix
            </TabsTrigger>
            <TabsTrigger 
              value="liked" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
            >
              <Heart className="w-4 h-4 mr-2" />
              Liked
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="mt-0">
            {userGames.length === 0 ? (
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
                      <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" />
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
            {remixedGames.length === 0 ? (
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
                      <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" />
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
            {likedGames.length === 0 ? (
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
                      <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" />
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
        <UIDialogContent className="sm:max-w-[400px]">
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
                      <AvatarImage src={u.avatar_url || undefined} />
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
        <UIDialogContent className="sm:max-w-[400px]">
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
                      <AvatarImage src={u.avatar_url || undefined} />
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