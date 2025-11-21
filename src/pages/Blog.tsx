import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, Sparkles, Gamepad2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const blogPosts = [
  {
    id: "ai-games-revolution",
    title: "The AI Gaming Revolution: How AI is Changing Game Creation",
    excerpt: "Discover how AI is democratizing game development and enabling anyone to create engaging games in minutes.",
    category: "AI & Gaming",
    date: "2024-11-20",
    readTime: "5 min read",
    image: "/blog/ai-revolution.jpg",
    author: "Feep Team",
  },
  {
    id: "create-first-game",
    title: "How to Create Your First AI Game in 60 Seconds",
    excerpt: "Step-by-step guide to creating your first AI-generated game on Feep. No coding required!",
    category: "Tutorial",
    date: "2024-11-18",
    readTime: "3 min read",
    image: "/blog/first-game.jpg",
    author: "Sarah Chen",
  },
  {
    id: "top-games-november",
    title: "Top 10 AI-Generated Games You Need to Play This Month",
    excerpt: "Our curated list of the most creative and fun AI-generated games from the Feep community.",
    category: "Featured",
    date: "2024-11-15",
    readTime: "4 min read",
    image: "/blog/top-games.jpg",
    author: "Mike Johnson",
  },
  {
    id: "creator-spotlight",
    title: "Creator Spotlight: Meet @GameMaster - 1M+ Plays",
    excerpt: "Interview with one of Feep's top creators about their creative process and tips for success.",
    category: "Community",
    date: "2024-11-12",
    readTime: "6 min read",
    image: "/blog/creator-spotlight.jpg",
    author: "Emma Davis",
  },
  {
    id: "game-design-tips",
    title: "5 Game Design Tips for Creating Viral AI Games",
    excerpt: "Learn the secrets to creating games that get thousands of plays and shares on Feep.",
    category: "Tips & Tricks",
    date: "2024-11-10",
    readTime: "7 min read",
    image: "/blog/design-tips.jpg",
    author: "Alex Rivera",
  },
  {
    id: "future-of-gaming",
    title: "The Future of Social Gaming: AI, Community, and Creativity",
    excerpt: "Exploring how AI-powered social gaming platforms are reshaping the gaming industry.",
    category: "Industry Insights",
    date: "2024-11-08",
    readTime: "8 min read",
    image: "/blog/future-gaming.jpg",
    author: "Feep Team",
  },
];

const categories = ["All", "AI & Gaming", "Tutorial", "Featured", "Community", "Tips & Tricks", "Industry Insights"];

export default function Blog() {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Blog - AI Gaming Insights, Tutorials & Community Stories"
        description="Read the latest articles about AI gaming, game creation tutorials, creator spotlights, and industry insights from the Feep community."
        url="https://oplusai.vercel.app/blog"
        keywords="AI gaming blog, game creation tutorials, gaming community, AI game development, creator stories"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-purple-600/10 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-purple-600/10 px-4 py-2 rounded-full mb-6">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Feep Blog</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                AI Gaming Insights & Stories
              </h1>
              <p className="text-xl text-muted-foreground">
                Tutorials, creator spotlights, industry insights, and everything about AI-powered gaming
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="border-b">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/blog/${post.id}`)}
              >
                {/* Image */}
                <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-blue-600/20 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="h-16 w-16 text-purple-600/30" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">By {post.author}</span>
                    <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              Load More Articles
            </Button>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="mb-6 opacity-90">
                Get the latest AI gaming insights, tutorials, and creator stories delivered to your inbox
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-black"
                />
                <Button size="lg" variant="secondary">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
