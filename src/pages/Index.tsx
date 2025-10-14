import { useEffect } from "react";
import { useLocationContext } from "@/context/LocationContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Users, Rocket, Gamepad2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const Index = () => {
  const navigate = useNavigate();
  const { requestCityFromBrowser } = useLocationContext();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/feed");
      }
    });
    // Gently request location on home to personalize experience
    requestCityFromBrowser();
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-hero">
      {/* Hero Section - Gen Z neon vibe */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs uppercase tracking-widest mb-6">
            <Rocket className="h-4 w-4" /> Next‑gen social gaming
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4">
            Make. Play. Remix.
            <span className="block gradient-primary bg-clip-text text-transparent">AI‑powered mini games</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A Gen‑Z playground for discovering and remixing bite‑size games. Zero installs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/auth")} size="lg" className="gradient-primary glow-primary text-lg px-8">
              <Sparkles className="mr-2 h-5 w-5" /> Create a game
            </Button>
            <Button onClick={() => navigate("/feed")} size="lg" variant="outline" className="text-lg px-8">
              <Gamepad2 className="mr-2 h-5 w-5" /> Jump to feed
            </Button>
          </div>
        </div>
      </div>

      {/* Marquee/Carousel of vibes */}
      <div className="container mx-auto px-4">
        <Carousel opts={{ loop: true, align: "start" }} className="max-w-5xl mx-auto">
          <CarouselContent>
            {["Retro Neon", "Cyber City", "Kawaii Chaos", "Pixel Punk", "Lo‑fi Space"].map((label) => (
              <CarouselItem key={label} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                <div className="h-40 rounded-2xl overflow-hidden relative gradient-card border border-border/60">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.25),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_40%)]" />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                    {label}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Feature tiles - punchier copy */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="gradient-card p-8 rounded-2xl border border-border/60 text-center">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4"><Play className="h-6 w-6" /></div>
            <h3 className="text-xl font-bold mb-2">Zero friction</h3>
            <p className="text-muted-foreground">Tap, play, swipe. Games load instantly in‑browser.</p>
          </div>
          <div className="gradient-card p-8 rounded-2xl border border-border/60 text-center">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4"><Sparkles className="h-6 w-6" /></div>
            <h3 className="text-xl font-bold mb-2">AI co‑creator</h3>
            <p className="text-muted-foreground">Describe a vibe. We generate code, art, and a cover.</p>
          </div>
          <div className="gradient-card p-8 rounded-2xl border border-border/60 text-center">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4"><Users className="h-6 w-6" /></div>
            <h3 className="text-xl font-bold mb-2">Built to remix</h3>
            <p className="text-muted-foreground">Like, comment, and remix community creations in one tap.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
