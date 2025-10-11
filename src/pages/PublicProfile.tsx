import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Play, Heart, Mail, UserPlus, UserCheck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GamePlayer } from "@/components/GamePlayer";

interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  followers_count?: number | null;
  following_count?: number | null;
}

interface GameRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  cover_url?: string | null;
  likes_count: number | null;
  plays_count: number | null;
  original_game_id?: string | null;
}

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [createdGames, setCreatedGames] = useState<GameRow[]>([]);
  const [remixedGames, setRemixedGames] = useState<GameRow[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [remixPrompt, setRemixPrompt] = useState<string>("");

  useEffect(() => {
    if (!username) return;
    (async () => {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (error || !prof) return;
      setProfile(prof as ProfileRow);

      const { data: created } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', prof.id)
        .is('original_game_id', null)
        .order('created_at', { ascending: false });
      setCreatedGames((created || []) as GameRow[]);

      const { data: remixed } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', prof.id)
        .not('original_game_id', 'is', null)
        .order('created_at', { ascending: false });
  const handleRemix = async (game: GameRow) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to remix');
      return;
    }
    if (!remixPrompt.trim()) {
      toast.error('Enter a remix idea first');
      return;
    }
    try {
      setRemixingId(game.id);
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: { prompt: remixPrompt, options: {} },
      });
      if (error) throw error;
      const gameCode: string = data.gameCode;
      const insert = await supabase
        .from('games')
        .insert({
          title: `Remix: ${game.title}`,
          description: `Remix of ${game.title}${profile?.username ? ` by @${profile.username}` : ''}`,
          game_code: gameCode,
          creator_id: user.id,
          thumbnail_url: game.thumbnail_url,
          cover_url: game.cover_url || game.thumbnail_url,
          sound_url: null,
          original_game_id: game.id,
          country: null,
          city: null,
        })
        .select('id')
        .single();
      if (insert.error) throw insert.error;
      toast.success('Remix published');
      setRemixPrompt("");
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remix');
    } finally {
      setRemixingId(null);
    }
  };

      setRemixedGames((remixed || []) as GameRow[]);

      // Check follow status
      const { data: me } = await supabase.auth.getUser();
      if (me?.user?.id) {
        const { data: followRow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', me.user.id)
          .eq('following_id', (prof as any).id)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }
    })();
  }, [username]);

  // Live-update followers count
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('realtime:follows:public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${profile.id}` }, async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .maybeSingle();
        if (data) setProfile(data as ProfileRow);
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [profile?.id]);

  const sendMessage = async () => {
    if (!profile || !messageText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to message users');
      return;
    }
    if (user.id === profile.id) {
      toast.error('You cannot message yourself');
      return;
    }
    const { error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: user.id, recipient_id: profile.id, content: messageText.trim() });
    if (error) toast.error('Failed to send'); else {
      toast.success('Message sent');
      setMessageText("");
      setMessageOpen(false);
    }
  };

  const toggleFollow = async () => {
    if (!profile) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to follow');
      return;
    }
    if (user.id === profile.id) return;
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      if (error) return;
      setIsFollowing(false);
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profile.id });
      if (error) return;
      setIsFollowing(true);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen pb-16 md:pt-16">
        <Navigation />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pt-16">
      <Navigation />
      {selectedGame ? (
        <GamePlayer game={selectedGame as any} onClose={() => setSelectedGame(null)} />
      ) : (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <Card className="p-6 gradient-card border-primary/20">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 ring-2 ring-primary/30">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{profile.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-2xl font-bold">{profile.username}</div>
                <div className="text-sm text-muted-foreground">{profile.followers_count || 0} followers</div>
              </div>
              <div className="flex gap-2">
                <Button variant={isFollowing ? "outline" : "default"} className="gap-2" onClick={toggleFollow}>
                  {isFollowing ? (<><UserCheck className="w-4 h-4"/> Following</>) : (<><UserPlus className="w-4 h-4"/> Follow</>)}
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setMessageOpen(true)}>
                  <Mail className="w-4 h-4" /> Message
                </Button>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="created">
            <TabsList className="w-full">
              <TabsTrigger value="created" className="flex-1">Created</TabsTrigger>
              <TabsTrigger value="remixed" className="flex-1">Remixed</TabsTrigger>
            </TabsList>
            <TabsContent value="created">
              {createdGames.length === 0 ? (
                <Card className="p-12 text-center gradient-card">No games</Card>
              ) : (
                <>
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    placeholder="Describe your remix idea (optional)"
                    value={remixPrompt}
                    onChange={(e) => setRemixPrompt(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {createdGames.map((g) => (
                    <div key={g.id} className="aspect-[9/16] relative group overflow-hidden rounded-lg border border-border hover:border-primary transition-all">
                      {g.thumbnail_url ? (
                        <img src={g.thumbnail_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center"><Play className="w-12 h-12 text-white"/></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="font-bold text-sm mb-1 truncate">{g.title}</p>
                          <div className="flex gap-3 text-xs">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{g.likes_count || 0}</span>
                            <span className="flex items-center gap-1"><Play className="w-3 h-3" />{g.plays_count || 0}</span>
                            <button
                              className="ml-auto px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-[11px]"
                              onClick={() => setSelectedGame(g)}
                            >
                              View
                            </button>
                            <button
                              className="px-2 py-1 rounded bg-primary hover:opacity-90 text-[11px]"
                              onClick={() => handleRemix(g)}
                              disabled={remixingId === g.id}
                            >
                              {remixingId === g.id ? (<span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>Remixing</span>) : 'Remix'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="remixed">
              {remixedGames.length === 0 ? (
                <Card className="p-12 text-center gradient-card">No remixes</Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {remixedGames.map((g) => (
                    <div key={g.id} className="aspect-[9/16] relative group cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary transition-all" onClick={() => setSelectedGame(g)}>
                      {g.thumbnail_url ? (
                        <img src={g.thumbnail_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center"><Play className="w-12 h-12 text-white"/></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="font-bold text-sm mb-1 truncate">{g.title}</p>
                          <div className="flex gap-3 text-xs">
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 text-white/90">Remix</span>
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{g.likes_count || 0}</span>
                            <span className="flex items-center gap-1"><Play className="w-3 h-3" />{g.plays_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {messageOpen && (
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Send a message to {profile.username}</div>
              <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} className="w-full h-24 bg-background border border-border rounded p-2" placeholder="Say hi..." />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
                <Button onClick={sendMessage} disabled={!messageText.trim()}>Send</Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
