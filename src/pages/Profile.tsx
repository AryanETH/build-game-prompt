import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Heart, Play, Loader2, Pencil, UserPlus, UserCheck, Star, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GamePlayer } from "@/components/GamePlayer";

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

  useEffect(() => {
    fetchProfile();
    fetchUserGames();
    fetchRemixedGames();
    checkFollowStatus();
  }, []);

  // Realtime refresh when user's games change
  useEffect(() => {
    const subscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel(`profile-games:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `creator_id=eq.${user.id}` }, () => {
          fetchUserGames();
          fetchRemixedGames();
        })
        .subscribe();
      return () => { channel.unsubscribe(); };
    };
    let cleanup: (() => void) | undefined;
    subscribe().then((fn) => { cleanup = fn; });
    return () => { cleanup && cleanup(); };
  }, []);

  const checkFollowStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single();

    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      
      toast.success("Unfollowed user");
      setIsFollowing(false);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profile.id });
      
      toast.success("Following user");
      setIsFollowing(true);
    }
    
    fetchProfile();
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      if (data?.username) setFormUsername(data.username);
      if (data?.avatar_url) setPreviewUrl(data.avatar_url);
    }
  };

  const fetchUserGames = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', user.id)
        .is('original_game_id', null)
        .order('created_at', { ascending: false });
      setUserGames(data || []);
    }
  };

  const fetchRemixedGames = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', user.id)
        .not('original_game_id', 'is', null)
        .order('created_at', { ascending: false });
      setRemixedGames(data || []);
    }
  };

  const deleteGame = async (gameId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setDeletingId(gameId);
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)
        .eq('creator_id', user.id);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to update your profile');
        return;
      }

      let avatarUrl = profile?.avatar_url || null;
      if (selectedFile) {
        avatarUrl = await uploadAvatarAndGetUrl(user.id, selectedFile);
      }

      const newUsername = formUsername.trim();
      if (!newUsername) {
        toast.error('Username cannot be empty');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername, avatar_url: avatarUrl })
        .eq('id', user.id);

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
                <div className="text-center">
                  <div className="font-bold text-xl">{profile?.followers_count || 0}</div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{profile?.following_count || 0}</div>
                  <div className="text-muted-foreground">Following</div>
                </div>
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

        {/* Created/Remixed as tabs */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Games</h2>
          <Tabs defaultValue="created">
            <TabsList className="w-full">
              <TabsTrigger value="created" className="flex-1">Created</TabsTrigger>
              <TabsTrigger value="remixed" className="flex-1">Remixed</TabsTrigger>
            </TabsList>
            <TabsContent value="created">
              {userGames.length === 0 ? (
                <Card className="p-12 text-center gradient-card">No games created yet</Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                          <div className="flex gap-3 text-xs">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{game.likes_count}</span>
                            <span className="flex items-center gap-1"><Play className="w-3 h-3" />{game.plays_count}</span>
                            <Button size="icon" variant="destructive" className="ml-auto h-7 w-7 opacity-90" onClick={(e) => { e.stopPropagation(); deleteGame(game.id); }} disabled={deletingId === game.id} title="Delete game">
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
            <TabsContent value="remixed">
              {remixedGames.length === 0 ? (
                <Card className="p-12 text-center gradient-card">No remixes yet</Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                          <div className="flex gap-3 text-xs">
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}