import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Heart, Play } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [userGames, setUserGames] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchUserGames();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchUserGames = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      setUserGames(data || []);
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
              <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center">
                <User className="h-12 w-12" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {profile?.username || 'Loading...'}
                </h1>
                <div className="flex gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <span>{profile?.total_plays || 0} plays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>{profile?.total_likes || 0} likes</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* User Games */}
          <div>
            <h2 className="text-2xl font-bold mb-4">My Games</h2>
            {userGames.length === 0 ? (
              <Card className="gradient-card border-border/50 p-8 text-center">
                <p className="text-muted-foreground">
                  You haven't created any games yet.
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {userGames.map((game) => (
                  <Card key={game.id} className="gradient-card border-border/50 p-4">
                    <h3 className="font-semibold mb-2">{game.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {game.description}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{game.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        <span>{game.plays_count}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}