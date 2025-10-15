import { useEffect } from "react";
import { useLocationContext } from "@/context/LocationContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Users, Gamepad2, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { requestCityFromBrowser } = useLocationContext();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/feed");
      }
    });
    requestCityFromBrowser();
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background without floating emojis */}
      <div className="absolute inset-0 gradient-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.15),transparent_50%)]" />
      </div>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs uppercase tracking-widest mb-6 animate-fade-in backdrop-blur-sm">
            <Zap className="h-4 w-4 animate-pulse" /> AI-Powered Gaming Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-tight mb-6 animate-scale-in">
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Create. Play. Share.
            </span>
            <span className="block text-4xl md:text-6xl mt-4 text-foreground/90">
              Mini-Games in Seconds
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-fade-in">
            The ultimate playground for AI-generated mini-games. No coding. No downloads. Just pure fun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              className="gradient-primary glow-primary text-xl px-10 py-6 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl"
            >
              <Sparkles className="mr-2 h-6 w-6 animate-pulse" /> Start Creating
            </Button>
            <Button 
              onClick={() => navigate("/feed")} 
              size="lg" 
              variant="outline" 
              className="text-xl px-10 py-6 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 border-2"
            >
              <Gamepad2 className="mr-2 h-6 w-6" /> Explore Games
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="relative container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="group gradient-card p-8 rounded-3xl border border-border/60 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fade-in">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
              <Play className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Instant Play</h3>
            <p className="text-muted-foreground text-lg">Tap to play. No installs, no waiting. Pure gaming bliss.</p>
          </div>
          <div className="group gradient-card p-8 rounded-3xl border border-border/60 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">AI Magic</h3>
            <p className="text-muted-foreground text-lg">Describe your vision. AI builds the game. It's that simple.</p>
          </div>
          <div className="group gradient-card p-8 rounded-3xl border border-border/60 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Remix Culture</h3>
            <p className="text-muted-foreground text-lg">Love a game? Remix it. Make it yours. Share with the world.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
