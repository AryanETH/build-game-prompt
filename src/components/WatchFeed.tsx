import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tv, Users } from "lucide-react";
import { ensureProfileExistsForUser } from "@/lib/profile";

interface Game {
  id: string;
  title: string;
  description: string | null;
  game_code: string;
  creator_id: string;
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user: { id: string; username: string; avatar_url: string | null } | null;
}

export const WatchFeed = () => {
  const { data: games = [] } = useQuery({
    queryKey: ["watch-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id,title,description,game_code,creator_id")
        .order("plays_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Game[];
    },
  });

  const [selected, setSelected] = useState<Game | null>(null);
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
    return () => channel.unsubscribe();
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
    return () => channel.unsubscribe();
  }, [selected?.id, refetch]);

  const [text, setText] = useState("");
  const send = async () => {
    if (!text.trim() || !selected) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0,8)}`;
      await ensureProfileExistsForUser(supabase, user.id, baseUsername);
    } catch {}
    const { error } = await supabase.from("game_comments").insert({ game_id: selected.id, user_id: user.id, content: text.trim() });
    if (!error) setText("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Player */}
      <div className="lg:col-span-2">
        {!selected ? (
          <Card className="p-12 text-center gradient-card">
            <Tv className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">Choose a game to watch</h3>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="font-semibold">{selected.title}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" />{viewerCount}</div>
            </div>
            <div className="aspect-video bg-background">
              <iframe title={selected.title} srcDoc={selected.game_code} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />
            </div>
          </Card>
        )}
      </div>

      {/* Live chat */}
      <Card className="flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">Live Chat</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.user?.avatar_url || undefined} />
                <AvatarFallback>{c.user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{c.user?.username || 'User'}</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{c.content}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-sm text-muted-foreground">Be the first to chat.</div>
          )}
        </div>
        <div className="p-3 flex gap-2 border-t">
          <Input placeholder="Say something..." value={text} onChange={(e) => setText(e.target.value)} />
          <Button onClick={send} disabled={!text.trim()}>Send</Button>
        </div>
      </Card>

      {/* Selector */}
      <div className="lg:col-span-3">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {games.map((g) => (
            <Card key={g.id} className={`min-w-[200px] p-3 cursor-pointer ${selected?.id === g.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected(g)}>
              <div className="font-semibold line-clamp-1">{g.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{g.description || ''}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
