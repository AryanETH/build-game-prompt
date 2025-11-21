import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Play, Heart, Mail, UserPlus, UserCheck, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GamePlayer } from "@/components/GamePlayer";
import { sendDirectMessage } from "@/lib/realtime";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
  likes_count: number;
  plays_count: number;
  original_game_id?: string | null;
}

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [createdGames, setCreatedGames] = useState<GameRow[]>([]);
  const [remixedGames, setRemixedGames] = useState<GameRow[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [remixPrompt, setRemixPrompt] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const handleRemix = async (game: GameRow) => {
    setRemixingId(game.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
      if (!uid) {
        toast.error('Please sign in to remix');
        return;
      }
      const params = new URLSearchParams({ remix: game.id, title: `Remix: ${game.title}` });
      if (remixPrompt.trim()) params.set('prompt', remixPrompt.trim());
      navigate(`/create?${params.toString()}`);
    } finally {
      setRemixingId(null);
    }
  };

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
      setRemixedGames((remixed || []) as GameRow[]);

      const { data: { session } } = await supabase.auth.getSession();
      const myId = session?.user?.id || null;
      if (myId) {
        const { data: followRow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', myId)
          .eq('following_id', (prof as any).id)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }
    })();
  }, [username]);

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

  useEffect(() => {
    if (!profile?.id) return;
    const presenceChannel = supabase.channel('presence:global');
    const updatePresence = () => {
      const presenceState = presenceChannel.presenceState();
      const userPresence = presenceState[profile.id];
      setIsOnline(!!userPresence && userPresence.length > 0);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, ({ key }) => key === profile.id && setIsOnline(true))
      .on('presence', { event: 'leave' }, ({ key }) => key === profile.id && setIsOnline(false))
      .subscribe(status => {
        if (status === 'SUBSCRIBED') updatePresence();
      });

    return () => { supabase.removeChannel(presenceChannel); };
  }, [profile?.id]);

  const sendMessage = async () => {
    if (!profile || !messageText.trim()) return;
    setIsSendingMessage(true);
    const { error } = await sendDirectMessage(profile.id, messageText.trim());
    setIsSendingMessage(false);

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
    } else {
      toast.success("Message sent!");
      setMessageText("");
      setMessageOpen(false);
    }
  };

  const toggleFollow = async () => {
    if (!profile) return;
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;
    if (!userId) {
      toast.error('Please sign in to follow');
      return;
    }
    if (userId === profile.id) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', profile.id);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: userId, following_id: profile.id });
      setIsFollowing(true);
    }
  };

  if (!profile) {
    return (
      <LoadingSpinner fullScreen />
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {selectedGame ? (
        <GamePlayer game={selectedGame as any} onClose={() => setSelectedGame(null)} />
      ) : (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card className="p-4 md:p-6 gradient-card border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 ring-2 ring-primary/30">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>{profile.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                {isOnline && <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold truncate">{profile.username}</div>
                <div className="text-sm text-muted-foreground">{profile.followers_count || 0} followers &bull; {profile.following_count || 0} following</div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant={isFollowing ? "outline" : "default"} className="gap-2 flex-1 md:flex-none" onClick={toggleFollow}>
                  {isFollowing ? <><UserCheck className="w-4 h-4"/> Following</> : <><UserPlus className="w-4 h-4"/> Follow</>}
                </Button>
                <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={() => setMessageOpen(true)}>
                  <Mail className="w-4 h-4" /> <span className="hidden sm:inline">Message</span>
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
              {createdGames.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {createdGames.map((g) => (
                    <div key={g.id} className="aspect-[9/16] relative group overflow-hidden rounded-lg border border-border hover:border-primary transition-all">
                      <img src={g.cover_url || g.thumbnail_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="font-bold text-sm mb-1 truncate">{g.title}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{g.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{g.plays_count || 0}</span>
                          <Button variant="outline" className="ml-auto bg-white/10 border-white/20 h-6 px-2" onClick={() => setSelectedGame(g)}>View</Button>
                          <Button className="h-6 px-2" onClick={() => handleRemix(g)} disabled={remixingId === g.id}>{remixingId === g.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Card className="p-12 text-center gradient-card">No games</Card>}
            </TabsContent>
            <TabsContent value="remixed">
              {remixedGames.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {remixedGames.map((g) => (
                    <div key={g.id} className="aspect-[9/16] relative group cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary transition-all" onClick={() => setSelectedGame(g)}>
                      <img src={g.cover_url || g.thumbnail_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="font-bold text-sm mb-1 truncate">{g.title}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{g.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{g.plays_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Card className="p-12 text-center gradient-card">No remixes</Card>}
            </TabsContent>
          </Tabs>

          {messageOpen && (
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Send a message to {profile.username}</div>
              <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} className="w-full h-24 bg-background border border-border rounded p-2" placeholder="Say hi..." />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
                <Button onClick={sendMessage} disabled={!messageText.trim() || isSendingMessage}>
                  {isSendingMessage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
