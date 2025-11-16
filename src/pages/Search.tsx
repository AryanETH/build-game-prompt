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
    <div className="w-screen min-h-[100dvh] bg-background overflow-y-auto overflow-x-hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <main className="w-full mx-auto px-4 md:px-8 lg:px-12 pt-5 pb-24 md:pb-8 md:max-w-[1600px]">
        {/* Search Bar - centered with proper spacing */}
        <div className="mb-5 md:mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search games or usernames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-14 pr-3 md:pr-4 h-12 md:h-14 bg-card border-border text-sm md:text-base rounded-xl shadow-sm"
            />
          </div>
        </div>
        
        {/* Sort Tags - proper spacing */}
        <div className="mb-5 md:mb-6">
          <div className="flex gap-2">
            <Badge
              variant={sortBy === 'popular' ? "default" : "secondary"}
              className="cursor-pointer px-4 md:px-5 py-2 text-sm md:text-base hover:bg-primary/90 rounded-lg"
              onClick={() => setSortBy('popular')}
            >
              <span className="text-base mr-1.5">💥</span> Popular
            </Badge>
            <Badge
              variant={sortBy === 'newest' ? "default" : "secondary"}
              className="cursor-pointer px-4 md:px-5 py-2 text-sm md:text-base hover:bg-primary/90 rounded-lg"
              onClick={() => setSortBy('newest')}
            >
              <span className="text-base mr-1.5">✨</span> Newest
            </Badge>
          </div>
        </div>

        {/* Category Tags - proper spacing */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Tags</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "secondary"}
                className="cursor-pointer whitespace-nowrap flex-shrink-0 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm hover:bg-primary/90 rounded-lg"
                onClick={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              >
                <span className="text-base mr-1">{category.icon}</span>
                {category.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Results - Profiles */}
        {searchQuery && profiles.length > 0 && (
          <section className="mb-6 md:mb-8">
            <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4">Creators</h2>
            <div className="space-y-2">
              {profiles.map((profile) => (
                <Card key={profile.id} className="p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-accent/50 transition-smooth cursor-pointer rounded-xl" onClick={() => navigate(`/u/${profile.username}`)}>
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

        {/* New Games Section - 2x2 grid with smaller cards */}
        {!searchQuery && (
          <section className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                <span className="text-xl">✨</span> New games
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs md:text-sm h-8">
                See more
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
              {games.slice(0, 8).map((game) => (
                <Card 
                  key={game.id} 
                  className="overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group rounded-lg"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-1.5 left-1.5 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-md">
                      <span className="text-xs mr-0.5">🎮</span> {selectedCategory || "Game"}
                    </Badge>

                    {/* Play Count */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-2.5">
                      <h3 className="font-bold text-white text-xs md:text-sm mb-0.5 line-clamp-2 leading-tight">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-white/90 text-[10px] md:text-xs">
                        <Play className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        <span>{game.plays_count > 1000 ? `${(game.plays_count / 1000).toFixed(1)}K` : game.plays_count}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Popular Games - horizontal scroll */}
        {!searchQuery && games.length > 8 && (
          <section className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                <span className="text-xl">💥</span> Popular
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs md:text-sm h-8">
                See more
              </Button>
            </div>
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:overflow-x-visible md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {games.slice(8, 16).map((game) => (
                <Card 
                  key={game.id}
                  className="flex-shrink-0 w-[130px] md:w-[150px] overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group rounded-xl"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2 bg-card">
                    <h3 className="font-semibold text-xs line-clamp-2 mb-1 leading-tight">{game.title}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Play className="h-2.5 w-2.5" />
                      <p className="text-[10px]">
                        {game.plays_count > 1000 ? `${(game.plays_count / 1000).toFixed(1)}K` : game.plays_count}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Search Results - Games - 2x2 grid with smaller cards */}
        {searchQuery && games.length > 0 && (
          <section>
            <h2 className="text-base md:text-lg font-bold mb-4 md:mb-5">
              Games ({games.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
              {games.map((game) => (
                <Card 
                  key={game.id} 
                  className="overflow-hidden hover:ring-2 hover:ring-primary transition-smooth cursor-pointer group rounded-lg"
                  onClick={() => handlePlayGame(game)}
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-accent to-accent/50">
                    <img
                      src={game.thumbnail_url || game.cover_url || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-2.5">
                      <h3 className="font-bold text-white text-xs md:text-sm mb-0.5 line-clamp-2 leading-tight">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-1 text-white/90 text-[10px] md:text-xs">
                        <Play className="h-3 w-3 md:h-3.5 md:w-3.5" />
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
          <div className="text-center py-12 md:py-16">
            <SearchIcon className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4 opacity-50" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No results found</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Try searching for something else
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 md:py-16">
            <div className="animate-spin h-8 w-8 md:h-10 md:w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        )}
      </main>
    </div>
  );
}
