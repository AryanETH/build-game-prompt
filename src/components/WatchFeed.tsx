import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tv, Users, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner";

interface Game {
  id: string;
  title: string;
  description: string | null;
  game_code?: string;
  creator_id: string;
  city?: string | null;
  country?: string | null;
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user: { id: string; username: string; avatar_url: string | null } | null;
}

export const WatchFeed = () => {
  const navigate = useNavigate();
  const { data: games = [] } = useQuery({
    queryKey: ["watch-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id,title,description,creator_id,city,country")
        .order("plays_count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Game[];
    },
  });

  const [selected, setSelected] = useState<Game | null>(null);
  
  // Fetch full game data when selected changes
  const { data: fullGameData } = useQuery({
    queryKey: ["watch-game-full", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("game_code")
        .eq("id", selected!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!selected && games.length > 0) setSelected(games[0]);
  }, [games, selected]);

  const [viewerCount, setViewerCount] = useState(1);
  useEffect(() => {
    if (!selected) return;
    const channel = supabase.channel(`watch:${selected.id}`, {
      config: { presence: { key: `viewer_${Math.random().toString(36).slice(2)}` } },
    });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, any[]>;
      setViewerCount(Object.keys(state).length);
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track({ joined_at: new Date().toISOString() });
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, [selected?.id]);

  const { data: comments = [], refetch } = useQuery({
    queryKey: ["watch-comments", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_comments")
        .select("id, content, created_at, user:profiles!game_comments_user_id_fkey(id, username, avatar_url)")
        .eq("game_id", selected!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as CommentRow[];
    },
  });

  useEffect(() => {
    if (!selected?.id) return;
    const channel = supabase
      .channel(`watch-comments:${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_comments", filter: `game_id=eq.${selected.id}` }, () => refetch())
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [selected?.id, refetch]);

  const [text, setText] = useState("");
  const send = async () => {
    if (!text.trim() || !selected) return;
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id || null;
    if (!uid) return;
    const { error } = await supabase.from("game_comments").insert({ game_id: selected.id, user_id: uid, content: text.trim() });
    if (!error) setText("");
  };

  // Live detection via presence counts per game
  const [liveGameIds, setLiveGameIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const channels = games.map((g) => {
      const ch = supabase.channel(`playing:${g.id}`, { config: { presence: { key: `watch_${Math.random().toString(36).slice(2)}` } } });
      ch.on("presence", { event: "sync" }, () => {
        const size = Object.keys(ch.presenceState() as Record<string, any[]>).length;
        setLiveGameIds((prev) => {
          const next = new Set(prev);
          if (size > 0) next.add(g.id); else next.delete(g.id);
          return next;
        });
      });
      ch.subscribe((status) => { if (status === "SUBSCRIBED") ch.track({ watching: true }); });
      return ch;
    });
    return () => { channels.forEach((c) => c.unsubscribe()); };
  }, [JSON.stringify(games.map((g) => g.id))]);

  const liveGames = games.filter((g) => liveGameIds.has(g.id));
  const nonLiveGames = games.filter((g) => !liveGameIds.has(g.id));

  // Flip-to-play 9:16 tile: clicking flips from watch to play (load iframe)
  const [flippedId, setFlippedId] = useState<string | null>(null);

  return (
    <div className="p-3 md:p-4 space-y-4 md:space-y-6 pb-20 md:pb-4">
      {/* 9:16 grid of up to 4 live streams visible; scroll for more */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {liveGames.map((g) => (
          <div key={g.id} className="aspect-[9/16] [perspective:1000px]">
            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedId === g.id ? '[transform:rotateY(180deg)]' : ''}`}>
              {/* front: watch preview */}
              <Card className="absolute inset-0 overflow-hidden group cursor-pointer [backface-visibility:hidden]" onClick={() => { setFlippedId(g.id); setSelected(g); }}>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-sm opacity-80 mb-1">Live viewers</div>
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{viewerCount}</span>
                    </div>
                    <div className="mt-2 text-xs opacity-90">Tap to play</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-sm bg-gradient-to-t from-black/70 to-transparent">
                  {g.title}
                </div>
              </Card>
              {/* back: playing iframe */}
              <Card className="absolute inset-0 overflow-hidden [transform:rotateY(180deg)] [backface-visibility:hidden]">
                <div className="absolute inset-0">
                  {selected?.id === g.id && fullGameData?.game_code ? (
                    <iframe title={g.title} srcDoc={fullGameData.game_code} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>

      {/* Player area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="p-8 md:p-12 text-center gradient-card">
              <Tv className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-primary" />
              <h3 className="text-xl md:text-2xl font-bold mb-2">Choose a game to watch</h3>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b">
                <div className="font-semibold text-sm md:text-base">{selected.title}</div>
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground"><Users className="h-3 w-3 md:h-4 md:w-4" />{viewerCount}</div>
              </div>
              <div className="bg-white dark:bg-black flex items-center justify-center">
                <div className="relative nineBySixteen w-full md:vh-9-16">
                  {fullGameData?.game_code ? (
                    <iframe title={selected.title} srcDoc={fullGameData.game_code} className="absolute inset-0 w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Live chat */}
        <Card className="flex flex-col overflow-hidden">
          <div className="px-3 md:px-4 py-2 border-b font-semibold text-sm md:text-base">Live Chat</div>
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2 md:gap-3">
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarImage src={c.user?.avatar_url || undefined} />
                  <AvatarFallback>{c.user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs md:text-sm font-medium">{c.user?.username || 'User'}</div>
                  <div className="text-xs md:text-sm text-muted-foreground whitespace-pre-wrap">{c.content}</div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-xs md:text-sm text-muted-foreground">Be the first to chat.</div>
            )}
          </div>
          <div className="p-2 md:p-3 flex gap-2 border-t">
            <Input placeholder="Say something..." value={text} onChange={(e) => setText(e.target.value)} className="text-sm md:text-base" />
            <Button onClick={send} disabled={!text.trim()} size="sm" className="text-xs md:text-sm">Send</Button>
          </div>
        </Card>
      </div>

      {/* Non-live games row: show Play button to redirect */}
      {nonLiveGames.length > 0 && (
        <div>
          <div className="font-semibold mb-2 text-sm md:text-base">Not live right now</div>
          <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar">
            {nonLiveGames.map((g) => (
              <Card key={g.id} className="min-w-[160px] md:min-w-[200px] p-2 md:p-3">
                <div className="font-semibold line-clamp-1 mb-2 text-xs md:text-sm">{g.title}</div>
                <Button size="sm" className="gap-1.5 md:gap-2 text-xs md:text-sm" onClick={() => navigate(`/feed?game=${g.id}`)}>
                  <Play className="h-3 w-3 md:h-4 md:w-4" />
                  Play
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
