import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/feed");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl gradient-primary glow-primary mb-8 animate-fade-in">
            <span className="text-4xl font-bold">PG</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            TikTok for
            <span className="gradient-primary bg-clip-text text-transparent"> AI Games</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Play 1-minute games, swipe to discover new ones, and create your own with AI.
            It's gaming, reimagined.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="gradient-primary glow-primary text-lg px-8"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
            <Button
              onClick={() => navigate("/feed")}
              size="lg"
              variant="outline"
              className="text-lg px-8"
            >
              <Play className="mr-2 h-5 w-5" />
              Explore Games
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="gradient-card p-8 rounded-2xl border border-border/50 text-center animate-fade-in">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Play</h3>
            <p className="text-muted-foreground">
              No downloads. No waiting. Just swipe and play engaging 1-2 minute games.
            </p>
          </div>

          <div className="gradient-card p-8 rounded-2xl border border-border/50 text-center animate-fade-in">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Creation</h3>
            <p className="text-muted-foreground">
              Describe your game idea and watch AI generate it instantly. No coding needed.
            </p>
          </div>

          <div className="gradient-card p-8 rounded-2xl border border-border/50 text-center animate-fade-in">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Social Gaming</h3>
            <p className="text-muted-foreground">
              Like, share, and compete. Build your profile as a creator or player.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
