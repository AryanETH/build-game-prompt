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
    <div className="w-full bg-background overflow-y-auto" style={{ height: 'calc(100dvh - 120px)', paddingTop: 'env(safe-area-inset-top)' }}>
      <main className="w-full mx-auto px-3 md:px-4 pt-3 pb-20 md:pb-6 md:container md:max-w-7xl">
        {/* Search Bar - flush to top */}
        <div className="mb-3 md:mb-4">
          <div className="relative mb-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search games or usernames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 md:pl-10 h-10 md:h-12 bg-card border-border text-sm md:text-base"
            />
          </div>
          
          {/* Sort Tags */}
          <div className="flex gap-2">
            <Badge
              variant={sortBy === 'popular' ? "default" : "secondary"}
              className="cursor-pointer px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm hover:bg-primary/90"
              onClick={() => setSortBy('popular')}
            >
              💥 Popular
            </Badge>
            <Badge
              variant={sortBy === 'newest' ? "default" : "secondary"}
              className="cursor-pointer px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm hover:bg-primary/90"
              onClick={() => setSortBy('newest')}
            >
              ✨ Newest
            </Badge>
          </div>
        </div>

        {/* Category Tags */}
        <div className="mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold mb-2">Tags</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-3 px-3 md:mx-0 md:px-0">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "secondary"}
                className="cursor-pointer whitespace-nowrap flex-shrink-0 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm hover:bg-primary/90"
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
          <section className="mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-bold mb-2 md:mb-3">Creators</h2>
            <div className="space-y-2">
              {profiles.map((profile) => (
                <Card key={profile.id} className="p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-accent/50 transition-smooth cursor-pointer" onClick={() => navigate(`/u/${profile.username}`)}>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">
                    {profile.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate">{profile.username}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
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
          <section className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-bold">
                ✨ New games
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs md:text-sm h-8">
                See more
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {games.slice(0, 8).map((game) => (
                <Card 
                  key={game.id} 
                  className="overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-1 sm:top-1.5 md:top-2 left-1 sm:left-1.5 md:left-2 text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2 py-0.5 md:py-1">
                      🎮 {selectedCategory || "Game"}
                    </Badge>

                    {/* Play Count */}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3">
                      <h3 className="font-bold text-white text-[10px] sm:text-xs md:text-sm mb-0.5 line-clamp-1">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-white/80 text-[9px] sm:text-[10px] md:text-xs">
                        <Play className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3" />
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
          <section className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-bold">
                💥 Popular
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs md:text-sm h-8">
                See more
              </Button>
            </div>
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 no-scrollbar -mx-3 px-3 md:mx-0 md:px-0">
              {games.slice(8, 16).map((game) => (
                <Card 
                  key={game.id}
                  className="flex-shrink-0 w-[140px] md:w-[180px] overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2 md:p-3">
                    <h3 className="font-semibold text-xs md:text-sm line-clamp-1">{game.title}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
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
            <h2 className="text-base md:text-lg font-bold mb-2 md:mb-3">
              Games ({games.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {games.map((game) => (
                <Card 
                  key={game.id} 
                  className="overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3">
                      <h3 className="font-bold text-white text-[10px] sm:text-xs md:text-sm mb-0.5 line-clamp-1">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-white/80 text-[9px] sm:text-[10px] md:text-xs">
                        <Play className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3" />
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
          <div className="text-center py-8 md:py-12">
            <SearchIcon className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 md:mb-3 opacity-50" />
            <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">No results found</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Try searching for something else
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8 md:py-12">
            <div className="animate-spin h-6 w-6 md:h-8 md:w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        )}
      </main>
    </div>
  );
}
