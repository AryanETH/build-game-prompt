import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Heart, MessageCircle, Share2, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { GameCreationFlow } from "@/components/GameCreationFlow";

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
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

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
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-black'
    }`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-black/20 border-white/10' 
          : 'bg-white/80 border-black/10'
      }`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="horizontal" size="md" forceWhite={isDarkMode} />
          <nav className="hidden md:flex items-center gap-8">
            <button className={`transition-colors ${
              isDarkMode ? 'text-white/80 hover:text-white' : 'text-black/80 hover:text-black'
            }`}>Discover</button>
            <button className={`transition-colors ${
              isDarkMode ? 'text-white/80 hover:text-white' : 'text-black/80 hover:text-black'
            }`}>Create</button>
            <button className={`transition-colors ${
              isDarkMode ? 'text-white/80 hover:text-white' : 'text-black/80 hover:text-black'
            }`}>Community</button>
          </nav>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className={`rounded-full ${
                isDarkMode ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'
              }`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')} 
              className={isDarkMode ? 'text-white' : 'text-black'}
            >
              Log In
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              className={isDarkMode 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
              }
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Top Hero Section */}
      <div className="min-h-screen flex items-center justify-center relative">
        <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-300 ${
          isDarkMode 
            ? 'from-white/5 via-transparent to-white/5' 
            : 'from-black/5 via-transparent to-black/5'
        }`} />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs uppercase tracking-widest mb-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-white/20 bg-white/5 text-white/80' 
              : 'border-black/20 bg-black/5 text-black/80'
          }`}>
            <Sparkles className="h-4 w-4" /> AI GAME ENGINE
          </div>
          
          <div className="mb-8">
            <img 
              src="/Oplus full horizonatal.png" 
              alt="Oplus" 
              className={`h-20 md:h-24 w-auto mx-auto transition-all duration-300 ${
                isDarkMode ? 'invert' : ''
              }`}
            />
          </div>
          
          <p className={`text-2xl md:text-3xl mb-12 max-w-3xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-white/80' : 'text-black/80'
          }`}>
            The infinite game engine. Turn text into playable worlds, interactive stories, and viral mini-games instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-20">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className={`px-8 py-6 text-lg rounded-full font-semibold shadow-2xl transition-all hover:scale-105 ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-white/90 hover:shadow-white/30' 
                  : 'bg-black text-white hover:bg-black/90 hover:shadow-black/30'
              }`}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
            <Button 
              onClick={() => {
                const section = document.getElementById('build-section');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              size="lg"
              className={`px-8 py-6 text-lg rounded-full font-semibold shadow-2xl transition-all hover:scale-105 ${
                isDarkMode 
                  ? 'bg-white/10 border border-white/20 hover:bg-white/20 text-white hover:shadow-white/20' 
                  : 'bg-black/10 border border-black/20 hover:bg-black/20 text-black hover:shadow-black/20'
              }`}
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>



      {/* Phone Mockup Section */}
      <div className="min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className={`text-5xl md:text-6xl font-black leading-tight transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Where Games
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Go Viral.
              </span>
            </h2>
            
            <p className={`text-xl max-w-lg transition-colors duration-300 ${
              isDarkMode ? 'text-white/70' : 'text-black/70'
            }`}>
              Publish your creations directly to the Oplus Feed. Let the community play, remix, and share your worlds instantly.
            </p>

            {/* Stats */}
            <div className="flex gap-12">
              <div>
                <div className={`text-4xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{formatNumber(stats?.users || 0)}</div>
                <div className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>Daily Players</div>
              </div>
              <div>
                <div className={`text-4xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{formatNumber(stats?.games || 0)}</div>
                <div className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>Games Created</div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className={`px-8 py-6 text-lg rounded-full shadow-2xl transition-all hover:scale-105 relative z-20 ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-white/90 hover:shadow-white/30' 
                  : 'bg-black text-white hover:bg-black/90 hover:shadow-black/30'
              }`}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
          </div>

          {/* Right - iPhone 16 Pro Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[310px] h-[650px]">
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

      {/* Interactive Game Creation Flow */}
      <div id="build-section" className="container mx-auto px-6 py-20">
        <h2 className={`text-4xl md:text-5xl font-bold text-center mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Build Games. Instantly.
        </h2>
        <p className={`text-xl text-center max-w-2xl mx-auto mb-12 transition-colors duration-300 ${
          isDarkMode ? 'text-white/70' : 'text-black/70'
        }`}>
          Don't Believe? See it Building <span className="text-red-500 font-bold">Live</span>
        </p>

        <GameCreationFlow isDarkMode={isDarkMode} />
      </div>

      {/* Footer */}
      <footer className={`border-t transition-colors duration-300 ${
        isDarkMode ? 'border-white/10 bg-black' : 'border-black/10 bg-white'
      }`}>
        <div className="container mx-auto px-6 py-12">
          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-8">
            <a
              href="https://www.instagram.com/oplus.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 rounded-full transition-all hover:scale-110 ${
                isDarkMode 
                  ? 'text-white hover:text-pink-400' 
                  : 'text-black hover:text-pink-600'
              }`}
              title="Follow us on Instagram"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            
            <a
              href="mailto:playgenofficial@gmail.com"
              className={`p-3 rounded-full transition-all hover:scale-110 ${
                isDarkMode 
                  ? 'text-white hover:text-blue-400' 
                  : 'text-black hover:text-blue-600'
              }`}
              title="Email us"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <div className={`text-center text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-white/50' : 'text-black/50'
          }`}>
            © 2025 Oplus. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
