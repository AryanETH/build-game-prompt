import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Sparkles, 
  Play, 
  Share2, 
  Heart, 
  Users, 
  Settings,
  Search,
  ChevronRight,
  Gamepad2,
  Zap,
  Shield
} from "lucide-react";
import { useState } from "react";

const docSections = [
  {
    title: "Getting Started",
    icon: Sparkles,
    color: "text-purple-600",
    docs: [
      { title: "Welcome to Feep", slug: "welcome" },
      { title: "Create Your First Game", slug: "first-game" },
      { title: "Understanding the Feed", slug: "feed-guide" },
      { title: "Quick Start Guide", slug: "quick-start" },
    ],
  },
  {
    title: "Creating Games",
    icon: Gamepad2,
    color: "text-blue-600",
    docs: [
      { title: "Game Creation Basics", slug: "creation-basics" },
      { title: "Using AI Prompts Effectively", slug: "ai-prompts" },
      { title: "Customizing Your Game", slug: "customization" },
      { title: "Adding Thumbnails & Covers", slug: "thumbnails" },
      { title: "Publishing Your Game", slug: "publishing" },
    ],
  },
  {
    title: "Playing & Discovering",
    icon: Play,
    color: "text-green-600",
    docs: [
      { title: "How to Play Games", slug: "playing" },
      { title: "Discovering New Games", slug: "discovery" },
      { title: "Search & Filters", slug: "search" },
      { title: "Following Creators", slug: "following" },
    ],
  },
  {
    title: "Community & Social",
    icon: Users,
    color: "text-pink-600",
    docs: [
      { title: "Liking & Commenting", slug: "engagement" },
      { title: "Sharing Games", slug: "sharing" },
      { title: "Remixing Games", slug: "remixing" },
      { title: "Building Your Profile", slug: "profile" },
      { title: "Direct Messages", slug: "messages" },
    ],
  },
  {
    title: "Advanced Features",
    icon: Zap,
    color: "text-orange-600",
    docs: [
      { title: "Multiplayer Games", slug: "multiplayer" },
      { title: "Graphics Quality Settings", slug: "graphics" },
      { title: "Audio & Sound", slug: "audio" },
      { title: "Analytics & Insights", slug: "analytics" },
    ],
  },
  {
    title: "Account & Settings",
    icon: Settings,
    color: "text-gray-600",
    docs: [
      { title: "Account Setup", slug: "account" },
      { title: "Privacy Settings", slug: "privacy" },
      { title: "Notifications", slug: "notifications" },
      { title: "Security", slug: "security" },
    ],
  },
];

const popularDocs = [
  "Create Your First Game",
  "Using AI Prompts Effectively",
  "Remixing Games",
  "How to Play Games",
];

export default function Docs() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <SEO 
        title="Documentation - Learn How to Create & Play AI Games"
        description="Complete guide to using Feep. Learn how to create AI games, discover new games, engage with the community, and master all features."
        url="https://feep.app/docs"
        keywords="Feep documentation, how to create AI games, game creation guide, AI gaming tutorial, Feep help"
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-600/10 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-blue-600/10 px-4 py-2 rounded-full mb-6">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Documentation</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                How can we help you?
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Everything you need to know about creating and playing AI games on Feep
              </p>

              {/* Search */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Popular Docs */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">POPULAR ARTICLES</h2>
            <div className="flex flex-wrap gap-2">
              {popularDocs.map((doc) => (
                <Button key={doc} variant="outline" size="sm">
                  {doc}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {docSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.title} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-lg bg-${section.color.split('-')[1]}-600/10`}>
                        <Icon className={`h-6 w-6 ${section.color}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{section.title}</h3>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {section.docs.map((doc) => (
                        <li key={doc.slug}>
                          <a
                            href={`/docs/${doc.slug}`}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent transition-colors group"
                          >
                            <span className="text-sm">{doc.title}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Help CTA */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our support team is here to help
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">
                  Contact Support
                </Button>
                <Button size="lg" variant="outline">
                  Join Community
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
