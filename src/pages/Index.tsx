import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Heart, MessageCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const MOCK_GAMES = [
  { id: 1, title: "Space Adventure", username: "cosmic_dev", description: "Explore the galaxy in this epic space shooter 🚀", likes: 12340, comments: 856, thumbnail: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=800&fit=crop" },
  { id: 2, title: "Pixel Runner", username: "retro_gamer", description: "Classic endless runner with a twist 🎮", likes: 8560, comments: 432, thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=800&fit=crop" },
  { id: 3, title: "Puzzle Master", username: "brain_teaser", description: "Mind-bending puzzles await 🧩", likes: 23410, comments: 1234, thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=800&fit=crop" },
  { id: 4, title: "Racing Fury", username: "speed_demon", description: "High-speed racing action 🏎️", likes: 15670, comments: 789, thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=800&fit=crop" },
  { id: 5, title: "Fantasy Quest", username: "rpg_master", description: "Epic fantasy adventure awaits ⚔️", likes: 34210, comments: 2156, thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=800&fit=crop" },
  { id: 6, title: "Zombie Survival", username: "horror_fan", description: "Survive the zombie apocalypse 🧟", likes: 21560, comments: 1567, thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=800&fit=crop" },
  { id: 7, title: "Tower Defense", username: "strategy_pro", description: "Defend your base from waves 🏰", likes: 18900, comments: 945, thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=800&fit=crop" },
  { id: 8, title: "Platformer Pro", username: "jump_king", description: "Master the art of jumping 🦘", likes: 11230, comments: 678, thumbnail: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=800&fit=crop" },
  { id: 9, title: "Card Battle", username: "deck_builder", description: "Strategic card game battles 🃏", likes: 25670, comments: 1890, thumbnail: "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?w=400&h=800&fit=crop" },
  { id: 10, title: "Rhythm Master", username: "music_lover", description: "Feel the beat and hit the notes 🎵", likes: 38900, comments: 3421, thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=800&fit=crop" },
];

const Index = () => {
  const navigate = useNavigate();
  const phoneScrollRef = useRef<HTMLDivElement>(null);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get battery status
  useEffect(() => {
    const getBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery: any = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });

          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    getBatteryStatus();
  }, []);

  // Auto-scroll phone screens
  useEffect(() => {
    const interval = setInterval(() => {
      if (phoneScrollRef.current) {
        const nextScreen = (currentScreen + 1) % MOCK_GAMES.length;
        phoneScrollRef.current.scrollTo({
          top: nextScreen * phoneScrollRef.current.clientHeight,
          behavior: 'smooth'
        });
        setCurrentScreen(nextScreen);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate("/feed");
    };
    checkSession();
  }, [navigate]);

  // Fetch live stats
  const { data: stats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const [gamesResult, usersResult] = await Promise.all([
        supabase.from('games').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      return {
        games: gamesResult.count || 0,
        users: usersResult.count || 0
      };
    },
    refetchInterval: 10000,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            FEEP
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button className="text-white/80 hover:text-white transition-colors">Discover</button>
            <button className="text-white/80 hover:text-white transition-colors">Create</button>
            <button className="text-white/80 hover:text-white transition-colors">Community</button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-white">
              Log In
            </Button>
            <Button onClick={() => navigate('/auth')} className="bg-white text-black hover:bg-white/90">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Top Hero Section */}
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs uppercase tracking-widest mb-8">
            <Sparkles className="h-4 w-4" /> AI GAME ENGINE V1.0
          </div>
          
          <h1 className="text-8xl md:text-9xl font-black mb-6 tracking-tight">
            <span className="block bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              FEEP
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-white/80 mb-12 max-w-3xl mx-auto">
            The infinite game engine. Turn text into playable worlds, interactive stories, and viral mini-games instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg rounded-full font-semibold"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
            <Button 
              onClick={() => navigate('/feed')}
              size="lg"
              className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg rounded-full font-semibold"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Phone Mockup Section */}
      <div className="min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-5xl md:text-6xl font-black leading-tight">
              Where Games
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Go Viral.
              </span>
            </h2>
            
            <p className="text-xl text-white/70 max-w-lg">
              Publish your creations directly to the FEEP Feed. Let the community play, remix, and share your worlds instantly.
            </p>

            {/* Stats */}
            <div className="flex gap-12">
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{formatNumber(stats?.users || 0)}</div>
                <div className="text-white/60">Daily Players</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{formatNumber(stats?.games || 0)}</div>
                <div className="text-white/60">Games Created</div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-full"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
          </div>

          {/* Right - iPhone 16 Pro Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[340px] h-[700px]">
              {/* iPhone 16 Pro Frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3.5rem] shadow-2xl border-[3px] border-slate-600 overflow-hidden">
                {/* Dynamic Island - Centered */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-9 bg-black rounded-full z-10" />
                
                {/* Status Bar */}
                <div className="absolute top-3 left-0 right-0 px-8 flex justify-between items-center text-xs text-white z-10">
                  <span className="font-semibold">{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-1.5">
                    {/* Battery with real percentage */}
                    <div className="flex items-center gap-0.5">
                      <div className="w-6 h-3 border border-white rounded-sm relative">
                        <div 
                          className={`absolute inset-0.5 rounded-sm transition-all ${
                            isCharging ? 'bg-yellow-500' : 
                            batteryLevel > 20 ? 'bg-green-500' : 
                            batteryLevel > 10 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${batteryLevel}%` }}
                        />
                      </div>
                      <div className="w-0.5 h-1.5 bg-white rounded-r-sm" />
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div 
                  ref={phoneScrollRef}
                  className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {MOCK_GAMES.map((game) => (
                    <div 
                      key={game.id}
                      className="w-full h-full snap-start relative"
                    >
                      <img 
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      
                      <div className="absolute bottom-4 left-4 right-20 text-white pb-2">
                        {/* Username with avatar */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">
                            {game.username[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold drop-shadow-md">@{game.username}</span>
                        </div>
                        {/* Game title */}
                        <h3 className="text-lg font-bold mb-1 drop-shadow-lg">{game.title}</h3>
                        {/* Description */}
                        <p className="text-xs text-white/90 line-clamp-2 drop-shadow-md">{game.description}</p>
                      </div>
                      
                      <div className="absolute bottom-4 right-3 flex flex-col gap-5 items-center pb-2">
                        <button className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 text-white fill-white" />
                        </button>
                        
                        <div className="flex flex-col items-center">
                          <button className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                            <Heart className="w-7 h-7 text-white" />
                          </button>
                          <span className="text-xs text-white font-bold mt-1 drop-shadow-md">
                            {game.likes >= 1000 ? `${(game.likes / 1000).toFixed(1)}K` : game.likes}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <button className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                            <MessageCircle className="w-7 h-7 text-white" />
                          </button>
                          <span className="text-xs text-white font-bold mt-1 drop-shadow-md">
                            {game.comments >= 1000 ? `${(game.comments / 1000).toFixed(1)}K` : game.comments}
                          </span>
                        </div>
                        
                        <button className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                          <Share2 className="w-7 h-7 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-[3rem] blur-3xl -z-10" />
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Build Anything. Instantly.
        </h2>
        <p className="text-xl text-white/70 text-center max-w-2xl mx-auto mb-12">
          Our procedural engine handles the heavy lifting. You bring the vision.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Mini Games", desc: "Instant arcade classics generated from a single prompt." },
            { title: "Interactive Stories", desc: "Branching narratives that adapt to player choices in real-time." },
            { title: "Character Worlds", desc: "Populate your universe with AI agents that have their own lives." },
            { title: "Animated Scenes", desc: "Cinematic cutscenes rendered on the fly for your storytelling." }
          ].map((feature, i) => (
            <div 
              key={i}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:scale-105 hover:border-white/20 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-white/60">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
