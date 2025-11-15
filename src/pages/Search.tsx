import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GamePlayer } from "@/components/GamePlayer";
import { useNavigate } from "react-router-dom";

const categories = [
  { id: "action", label: "Action", icon: "💥" },
  { id: "puzzle", label: "Puzzle", icon: "🧩" },
  { id: "arcade", label: "Arcade", icon: "🕹️" },
  { id: "racing", label: "Racing", icon: "🏎️" },
  { id: "strategy", label: "Strategy", icon: "🎯" },
  { id: "casual", label: "Casual", icon: "🎮" },
];

interface Game {
  id: string;
  title: string;
  description: string;
  game_code: string;
  thumbnail_url: string;
  cover_url?: string | null;
  likes_count: number;
  plays_count: number;
  creator_id: string;
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('newest');
  const navigate = useNavigate();

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games', searchQuery, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('games')
        .select('*');

      if (sortBy === 'popular') {
        query = query.order('plays_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Game[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles', searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const handlePlayGame = async (game: Game) => {
    setSelectedGame(game);
    
    // Increment play count
    await supabase
      .from('games')
      .update({ plays_count: game.plays_count + 1 })
      .eq('id', game.id);
  };

  if (selectedGame) {
    return (
      <GamePlayer
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-background">
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative mb-3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search games or usernames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border text-lg"
            />
          </div>
          
          {/* Sort Tags */}
          <div className="flex gap-2">
            <Badge
              variant={sortBy === 'popular' ? "default" : "secondary"}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90"
              onClick={() => setSortBy('popular')}
            >
              💥 Popular
            </Badge>
            <Badge
              variant={sortBy === 'newest' ? "default" : "secondary"}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90"
              onClick={() => setSortBy('newest')}
            >
              ✨ Newest
            </Badge>
          </div>
        </div>

        {/* Category Tags */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Tags</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "secondary"}
                className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm hover:bg-primary/90"
                onClick={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Results - Profiles */}
        {searchQuery && profiles.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Creators</h2>
            <div className="space-y-2">
              {profiles.map((profile) => (
                <Card key={profile.id} className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-smooth cursor-pointer" onClick={() => navigate(`/u/${profile.username}`)}>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white font-bold text-lg">
                    {profile.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{profile.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      {profile.total_plays || 0} plays
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* New Games Section */}
        {!searchQuery && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                ✨ New games
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                See more
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {games.slice(0, 8).map((game) => (
                <Card 
                  key={game.id} 
                  className="overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-2 left-2 text-xs">
                      🎮 {selectedCategory || "Game"}
                    </Badge>

                    {/* Play Count */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <Play className="h-3 w-3" />
                        <span>{game.plays_count > 1000 ? `${(game.plays_count / 1000).toFixed(1)}K` : game.plays_count}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Popular Games */}
        {!searchQuery && games.length > 8 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                💥 Popular
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                See more
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {games.slice(8, 16).map((game) => (
                <Card 
                  key={game.id}
                  className="min-w-[180px] overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1">{game.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {game.plays_count > 1000 ? `${(game.plays_count / 1000).toFixed(1)}K` : game.plays_count} plays
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Search Results - Games */}
        {searchQuery && games.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">
              Games ({games.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {games.map((game) => (
                <Card 
                  key={game.id} 
                  className="overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <Play className="h-3 w-3" />
                        <span>{game.plays_count > 1000 ? `${(game.plays_count / 1000).toFixed(1)}K` : game.plays_count}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty States */}
        {searchQuery && games.length === 0 && profiles.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching for something else
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        )}
      </main>
    </div>
  );
}
