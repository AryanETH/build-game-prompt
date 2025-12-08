import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, Zap, Heart, Globe, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalGames: number;
  totalUsers: number;
  totalPlays: number;
  totalLikes: number;
}

const values = [
  {
    icon: Sparkles,
    title: "AI-Powered Creativity",
    description: "We believe AI should empower everyone to create, not just developers.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "Gaming is social. We build features that bring players and creators together.",
  },
  {
    icon: Heart,
    title: "Accessible to All",
    description: "No coding required. No barriers. Just pure creative fun for everyone.",
  },
  {
    icon: TrendingUp,
    title: "Innovation",
    description: "We're constantly pushing boundaries in AI gaming and social experiences.",
  },
];

export default function About() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total games
      const { count: gamesCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total plays (sum of plays_count)
      const { data: playsData } = await supabase
        .from('games')
        .select('plays_count');
      const totalPlays = playsData?.reduce((sum, game) => sum + (game.plays_count || 0), 0) || 0;

      // Fetch total likes (sum of likes_count)
      const { data: likesData } = await supabase
        .from('games')
        .select('likes_count');
      const totalLikes = likesData?.reduce((sum, game) => sum + (game.likes_count || 0), 0) || 0;

      setStats({
        totalGames: gamesCount || 0,
        totalUsers: usersCount || 0,
        totalPlays,
        totalLikes,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statsDisplay = [
    { label: "Games Created", value: stats ? formatNumber(stats.totalGames) : "...", icon: Sparkles },
    { label: "Active Players", value: stats ? formatNumber(stats.totalUsers) : "...", icon: Users },
    { label: "Total Plays", value: stats ? formatNumber(stats.totalPlays) : "...", icon: Zap },
    { label: "Total Likes", value: stats ? formatNumber(stats.totalLikes) : "...", icon: Heart },
  ];

  return (
    <>
      <SEO 
        title="About Oplus AI - The TikTok for AI-Generated Games"
        description="Learn about Oplus AI's mission to democratize game creation through AI. Discover how we're building the future of social gaming."
        url="https://oplusai.vercel.app/about"
        keywords="about Oplus AI, AI gaming platform, social gaming, game creation platform, Oplus AI mission"
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-b from-purple-600/10 to-background py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                We're building the future of social gaming
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Oplus AI is where AI meets gaming meets community. Create, play, and share games in seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {loading ? (
              <div className="col-span-2 md:col-span-4 flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              statsDisplay.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="p-6 text-center">
                    <Icon className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Mission */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              We believe everyone has a game idea inside them. Feep makes it possible for anyone to bring those ideas to life in seconds, not months. By combining AI technology with social gaming, we're creating a platform where creativity knows no bounds and fun is just a swipe away.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What We Stand For</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {values.map((value) => {
                  const Icon = value.icon;
                  return (
                    <Card key={value.title} className="p-6">
                      <Icon className="h-10 w-10 text-purple-600 mb-4" />
                      <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Oplus AI started with a simple observation: creating games is hard, but playing them is fun. What if we could make creation just as fun and accessible as playing?
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In 2024, we launched Oplus AI with a vision to democratize game creation through AI. We wanted to build a platform where a 10-year-old with an idea could create a game just as easily as a professional developer.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Today, {stats ? formatNumber(stats.totalGames) : 'thousands of'} games have been created on Oplus AI, with {stats ? formatNumber(stats.totalPlays) : 'millions of'} plays by our community. From simple arcade games to complex multiplayer experiences, our community continues to amaze us with their creativity.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                But we're just getting started. The future of gaming is social, AI-powered, and accessible to everyone. Join us on this journey.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to create?</h2>
              <p className="text-lg mb-8 opacity-90">
                Join {stats ? formatNumber(stats.totalUsers) : 'thousands of'} creators and players on Oplus AI
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" variant="secondary" onClick={() => window.location.href = '/create'}>
                  Start Creating
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => window.location.href = '/feed'}>
                  Explore Games
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
