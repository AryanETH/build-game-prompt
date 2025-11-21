import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, Zap, Heart, Globe, TrendingUp } from "lucide-react";

const stats = [
  { label: "Games Created", value: "1M+", icon: Sparkles },
  { label: "Active Players", value: "500K+", icon: Users },
  { label: "Daily Plays", value: "10M+", icon: Zap },
  { label: "Countries", value: "150+", icon: Globe },
];

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
  return (
    <>
      <SEO 
        title="About Feep - The TikTok for AI-Generated Games"
        description="Learn about Feep's mission to democratize game creation through AI. Discover how we're building the future of social gaming."
        url="https://oplusai.vercel.app/about"
        keywords="about Feep, AI gaming platform, social gaming, game creation platform, Feep mission"
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
                Feep is where AI meets gaming meets community. Create, play, and share games in seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-6 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                  <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              );
            })}
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
                Feep started with a simple observation: creating games is hard, but playing them is fun. What if we could make creation just as fun and accessible as playing?
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In 2024, we launched Feep with a vision to democratize game creation through AI. We wanted to build a platform where a 10-year-old with an idea could create a game just as easily as a professional developer.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Today, millions of games have been created on Feep, played by people in over 150 countries. From simple arcade games to complex multiplayer experiences, our community continues to amaze us with their creativity.
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
                Join millions of creators and players on Feep
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Start Creating
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
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
