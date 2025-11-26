import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { GameCreationFlow } from "@/components/GameCreationFlow";

const Index = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

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
