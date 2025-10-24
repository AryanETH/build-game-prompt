import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Heart, Play, Loader2, Pencil, UserPlus, UserCheck, Star, Trash2 } from "lucide-react";
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

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [userGames, setUserGames] = useState<any[]>([]);
  const [remixedGames, setRemixedGames] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [formUsername, setFormUsername] = useState("");
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
    checkFollowStatus();

    // Live updates for follower counts and games
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
        fetchRemixedGames();
      })
      .subscribe();

    return () => {
      followChannel.unsubscribe();
      gamesChannel.unsubscribe();
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
    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1) : 'png';
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `${userId}/${Date.now()}.${safeExt}`;
    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/png',
      });
    if (uploadError) {
      // Common case: bucket not found or not public
      if (uploadError.message?.toLowerCase().includes('not found') || uploadError.message?.toLowerCase().includes('bucket')) {
        toast.error("Avatar storage bucket 'avatars' is missing or not accessible. Make sure it's public.");
      }
      throw uploadError;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
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
        .update({ username: newUsername, avatar_url: avatarUrl })
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

  if (selectedGame) {
    return <GamePlayer game={selectedGame} onClose={() => setSelectedGame(null)} />;
  }

  return (
    <div className="min-h-screen pb-16 md:pt-16 gradient-hero">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card className="p-6 gradient-card border-primary/20">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="w-32 h-32 ring-4 ring-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-primary/20">
                {profile?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="w-full">
              <h1 className="text-3xl font-bold mb-2">{profile?.username}</h1>
              
              {/* Level Badge */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 border border-accent/50">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="font-bold text-accent">Level {levelInfo.level}</span>
                </div>
                <div className="flex-1 max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-center gap-8 mb-4 text-sm">
                <button
                  type="button"
                  className="text-center hover:opacity-80"
                  onClick={async () => { await loadFollowers(); setFollowersOpen(true); }}
                >
                  <div className="font-bold text-xl">{profile?.followers_count || 0}</div>
                  <div className="text-muted-foreground">Followers</div>
                </button>
                <button
                  type="button"
                  className="text-center hover:opacity-80"
                  onClick={async () => { await loadFollowing(); setFollowingOpen(true); }}
                >
                  <div className="font-bold text-xl">{profile?.following_count || 0}</div>
                  <div className="text-muted-foreground">Following</div>
                </button>
                <div className="text-center">
                  <div className="font-bold text-xl">{userGames.length}</div>
                  <div className="text-muted-foreground">Games</div>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={handleOpenEdit} className="gap-2">
                  <Pencil className="w-4 h-4" />
                  Edit Profile
                </Button>
                {profile?.id !== currentUserId && (
                  <Button 
                    onClick={toggleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

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

        <Tabs defaultValue="my-games" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my-games">My Games</TabsTrigger>
            <TabsTrigger value="remixes">Remixes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="my-games">
            {userGames.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No games yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="aspect-[9/16] relative group cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary transition-all"
                  >
                    {game.thumbnail_url ? (
                      <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full gradient-primary flex items-center justify-center"><Play className="w-12 h-12 text-white" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="font-bold text-sm mb-1 truncate">{game.title}</p>
                        <div className="flex gap-3 text-xs items-center">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{game.likes_count}</span>
                          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{game.plays_count}</span>
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="ml-auto h-6 w-6 opacity-90" 
                            onClick={(e) => { e.stopPropagation(); deleteGame(game.id); }} 
                            disabled={deletingId === game.id} 
                            title="Delete game"
                          >
                            {deletingId === game.id ? (<Loader2 className="w-3 h-3 animate-spin" />) : (<Trash2 className="w-3 h-3" />)}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="remixes">
            {remixedGames.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No remixes yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {remixedGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="aspect-[9/16] relative group cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary transition-all"
                  >
                    {game.thumbnail_url ? (
                      <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full gradient-primary flex items-center justify-center"><Play className="w-12 h-12 text-white" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="font-bold text-sm mb-1 truncate">{game.title}</p>
                        <div className="flex gap-2 text-xs items-center flex-wrap">
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 text-white/90">Remix</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{game.likes_count}</span>
                          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{game.plays_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <ActivityFeed />
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autoplay in feed</p>
                    <p className="text-sm text-muted-foreground">Auto-play games on open in Play feed</p>
                  </div>
                  <Switch checked={autoplayFeed} onCheckedChange={setAutoplayFeed} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable sound by default</p>
                    <p className="text-sm text-muted-foreground">Start games with audio on when possible</p>
                  </div>
                  <Switch checked={enableSoundByDefault} onCheckedChange={setEnableSoundByDefault} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">High graphics quality</p>
                    <p className="text-sm text-muted-foreground">Prefer higher fidelity visuals in the player</p>
                  </div>
                  <Switch checked={highGraphicsQuality} onCheckedChange={setHighGraphicsQuality} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show remix badges</p>
                    <p className="text-sm text-muted-foreground">Display Remix markers on remixed games</p>
                  </div>
                  <Switch checked={showRemixBadges} onCheckedChange={setShowRemixBadges} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compact grid layout</p>
                    <p className="text-sm text-muted-foreground">Denser thumbnails on desktop feed</p>
                  </div>
                  <Switch checked={compactGridLayout} onCheckedChange={setCompactGridLayout} />
                </div>
              </div>
            </Card>
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
  return (
    <>
      <UIDialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <UIDialogContent className="sm:max-w-[400px]">
          <UIDialogHeader>
            <UIDialogTitle>Followers</UIDialogTitle>
          </UIDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {followers.length === 0 ? (
              <div className="text-sm text-muted-foreground">No followers yet.</div>
            ) : (
              followers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback>{u.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium">@{u.username}</div>
                </div>
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
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {following.length === 0 ? (
              <div className="text-sm text-muted-foreground">Not following anyone.</div>
            ) : (
              following.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback>{u.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium">@{u.username}</div>
                </div>
              ))
            )}
          </div>
        </UIDialogContent>
      </UIDialog>
    </>
  );
}