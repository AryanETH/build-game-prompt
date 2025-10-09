import { useEffect, useMemo, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Heart, Play, Loader2, Pencil, MessageCircle, Share, UserPlus, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [userGames, setUserGames] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formBio, setFormBio] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [likesSum, setLikesSum] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeGameForComments, setActiveGameForComments] = useState<any | null>(null);
  const [comments, setComments] = useState<Array<{ id: string; content: string; created_at: string; user_id: string }>>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [likedGames, setLikedGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const vId = data.user?.id || null;
      setViewerId(vId);
      const paramId = searchParams.get('id');
      setProfileUserId(paramId || vId);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!profileUserId) return;
    fetchProfile(profileUserId);
    fetchUserGames(profileUserId);
    fetchFollowStats(profileUserId);
    if (viewerId) {
      refreshIsFollowing(profileUserId, viewerId);
      fetchUserLikes(viewerId);
    }
  }, [profileUserId, viewerId]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    if (data?.username) setFormUsername(data.username);
    setFormBio(data?.bio || "");
    if (data?.avatar_url) setPreviewUrl(data.avatar_url);
  };

  const fetchFollowStats = async (userId: string) => {
    const followersRes = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    setFollowersCount(followersRes.count || 0);

    const followingRes = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    setFollowingCount(followingRes.count || 0);
  };

  const refreshIsFollowing = async (profileId: string, vId: string) => {
    if (profileId === vId) { setIsFollowing(false); return; }
    const { count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', vId)
      .eq('following_id', profileId);
    setIsFollowing((count || 0) > 0);
  };

  const fetchUserLikes = async (vId: string) => {
    const { data, error } = await supabase
      .from('game_likes')
      .select('game_id')
      .eq('user_id', vId);
    if (!error && data) setLikedGames(new Set(data.map(d => d.game_id)));
  };

  const handleFollowToggle = async () => {
    if (!viewerId || !profileUserId || viewerId === profileUserId) return;
    if (isFollowing) {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', viewerId)
        .eq('following_id', profileUserId);
      if (!error) {
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: viewerId, following_id: profileUserId });
      if (!error) {
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    }
  };

  const toggleLike = async (gameId: string) => {
    if (!viewerId) {
      toast.error('Please sign in to like games');
      return;
    }
    const isLiked = likedGames.has(gameId);
    if (isLiked) {
      const { error } = await supabase
        .from('game_likes')
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', viewerId);
      if (!error) setLikedGames(prev => { const s = new Set(prev); s.delete(gameId); return s; });
    } else {
      const { error } = await supabase
        .from('game_likes')
        .insert({ game_id: gameId, user_id: viewerId });
      if (!error) setLikedGames(prev => { const s = new Set(prev); s.add(gameId); return s; });
    }
  };

  const openComments = async (game: any) => {
    setActiveGameForComments(game);
    setCommentsOpen(true);
    const { data } = await supabase
      .from('game_comments')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const postComment = async () => {
    if (!viewerId || !activeGameForComments) return;
    const content = newComment.trim();
    if (!content) return;
    setPostingComment(true);
    const { error, data } = await supabase
      .from('game_comments')
      .insert({ game_id: activeGameForComments.id, user_id: viewerId, content })
      .select('*')
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setNewComment("");
    }
    setPostingComment(false);
  };

  const shareGame = (game: any) => {
    const shareUrl = `${window.location.origin}?game=${game.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Game link copied');
  };

  const GameTile = ({ game }: { game: any }) => {
    const [showPreview, setShowPreview] = useState(false);
    const tileRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const el = tileRef.current;
      if (!el) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setShowPreview(true);
        });
      }, { threshold: 0.6 });
      io.observe(el);
      return () => io.disconnect();
    }, []);
    return (
      <Card ref={tileRef as any} className="relative gradient-card border-border/50 p-0 overflow-hidden group aspect-[9/16]">
        {showPreview ? (
          <iframe srcDoc={game.game_code} className="absolute inset-0 w-full h-full border-0" title={game.title} sandbox="allow-scripts allow-same-origin" />
        ) : (
          <img src={game.cover_url || game.thumbnail_url || '/placeholder.svg'} alt={game.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute right-2 bottom-4 flex flex-col items-center gap-3">
          <Button size="icon" className="rounded-full bg-black/40 hover:bg-black/60" onClick={() => toggleLike(game.id)} aria-label="Like">
            <Heart className={`h-5 w-5 ${likedGames.has(game.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </Button>
          <Button size="icon" className="rounded-full bg-black/40 hover:bg-black/60" onClick={() => openComments(game)} aria-label="Comments">
            <MessageCircle className="h-5 w-5 text-white" />
          </Button>
          <Button size="icon" className="rounded-full bg-black/40 hover:bg-black/60" onClick={() => shareGame(game)} aria-label="Share">
            <Share className="h-5 w-5 text-white" />
          </Button>
        </div>
        <div className="absolute left-2 right-16 bottom-4 text-white">
          <h4 className="font-semibold drop-shadow mb-1 line-clamp-1">{game.title}</h4>
          <div className="text-xs opacity-80">{(game.plays_count || 0)} plays • {(game.likes_count || 0)} likes</div>
        </div>
      </Card>
    );
  };

  const fetchUserGames = async (userId: string) => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    setUserGames(data || []);
    const totalLikes = (data || []).reduce((sum: number, g: any) => sum + (g.likes_count || 0), 0);
    setLikesSum(totalLikes);
  };

  const handleOpenEdit = async () => {
    if (!profile && profileUserId) {
      await fetchProfile(profileUserId);
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
        .update({ username: newUsername, avatar_url: avatarUrl, bio: formBio })
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
      if (profileUserId) await fetchProfile(profileUserId);
    } catch (e) {
      // no-op: toast already shown
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 md:pt-16">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="gradient-card border-border/50 p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full overflow-hidden border border-border/60">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'avatar'} />
                  <AvatarFallback className="bg-muted">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {profile?.username || 'Loading...'}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{profile?.bio || ''}</p>
                    <div className="flex gap-6 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        <span>{profile?.total_plays || 0} plays</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>{likesSum} likes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{followersCount} followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{followingCount} following</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {viewerId && profileUserId && viewerId === profileUserId ? (
                      <Button variant="secondary" onClick={handleOpenEdit} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <Button onClick={handleFollowToggle} className="flex items-center gap-2">
                        {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                    )}
                  </div>
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
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={formBio} onChange={(e) => setFormBio(e.target.value)} placeholder="Tell us about you" />
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

          {/* User Videos Grid (TikTok-like) */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{viewerId && profileUserId && viewerId === profileUserId ? 'My Games' : `${profile?.username || ''}'s Games`}</h2>
            {userGames.length === 0 ? (
              <Card className="gradient-card border-border/50 p-8 text-center">
                <p className="text-muted-foreground">No games yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userGames.map((game) => (
                  <GameTile key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>

          {/* Comments Dialog */}
          <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>
              <div className="max-h-[50vh] overflow-y-auto space-y-3 p-1">
                {comments.map((c) => (
                  <div key={c.id} className="text-sm">
                    <div className="text-foreground">{c.content}</div>
                    <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-sm text-muted-foreground">Be the first to comment.</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." />
                <Button onClick={postComment} disabled={postingComment || !newComment.trim()}>
                  {postingComment ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}