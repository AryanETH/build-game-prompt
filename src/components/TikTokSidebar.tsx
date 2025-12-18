import { 
  Play, 
  Compass, 
  Radio, 
  UserPlus, 
  Sparkles, 
  Bell, 
  MessageCircle, 
  User, 
  MoreHorizontal,
  Search
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import type { NavigateFunction, Location } from "react-router-dom";

interface SuggestedUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export const TikTokSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
      
      // Fetch user profile for avatar
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, username, name')
          .eq('id', data.user.id)
          .single();
        setUserProfile(profile);
        
        // Subscribe to profile changes for real-time updates
        const profileChannel = supabase
          .channel('profile-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${data.user.id}`,
            },
            (payload) => {
              setUserProfile(payload.new);
            }
          )
          .subscribe();

        return () => {
          profileChannel.unsubscribe();
        };
      }
    })();
  }, []);

  const { data: suggestedUsers = [] } = useQuery<SuggestedUser[]>({
    queryKey: ['suggestedUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .limit(5);
      if (error) return [];
      return data || [];
    },
  });

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      handleNavigate("/auth");
    } catch (_) {
      // ignore
    }
  };

  const navItems = [
    { icon: Play, label: "Play Feed", path: "/feed" },
    { icon: Compass, label: "Explore", path: "/search" },
    { icon: Radio, label: "Live Feed", path: "/feed?tab=watch" },
    { icon: Sparkles, label: "Create", path: "/create" },
    { icon: Bell, label: "Activity", path: "/activity" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: MoreHorizontal, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/feed") {
      return location.pathname === "/feed" && !location.search.includes("tab=");
    }
    if (path === "/feed?tab=watch") {
      return location.pathname === "/feed" && location.search.includes("tab=watch");
    }
    return location.pathname === path;
  };

  const handleNavigate = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      // Fallback to window.location if navigate fails
      console.error("Navigation error:", error);
      window.location.href = path;
    }
  };

  // Check if we're on feed page to show active state for Play Feed
  const isFeedActive = location.pathname === "/feed" && !location.search.includes("tab=");

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] md:w-[260px] bg-white dark:bg-black border-r border-border/50 flex flex-col z-50 overflow-y-auto hidden md:flex">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center">
          <Logo variant="horizontal" size="md" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
            onClick={() => handleNavigate("/search")}
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col px-2 py-4 space-y-1 h-max">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          const isProfileItem = path === "/profile";
          
          return (
            <button
              key={path}
              onClick={() => handleNavigate(path)}
              className={`w-full flex items-center gap-4 px-4 py-1 h-12 rounded-lg transition-all duration-200 group ${
                active
                  ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold"
                  : "text-foreground hover:bg-muted/50 hover:text-primary dark:hover:text-primary"
              }`}
            >
              {isProfileItem && userProfile ? (
                <Avatar className={`h-6 w-6 transition-all duration-200 ${
                  active ? "scale-110" : "group-hover:scale-110"
                } ${active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "group-hover:ring-1 group-hover:ring-primary/50 group-hover:ring-offset-1 group-hover:ring-offset-background"}`}>
                  <AvatarImage 
                    className="object-cover" 
                    src={userProfile.avatar_url || undefined} 
                  />
                  <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                    {userProfile.name?.[0]?.toUpperCase() || userProfile.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon 
                  className={`h-6 w-5 transition-transform duration-200 ${
                    active ? "scale-100" : "group-hover:scale-110"
                  }`} 
                  strokeWidth={active ? 2.5 : 2}
                />
              )}
              <span className="text-sm">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && (
        <div className="px-4 py-4 border-t border-border/50">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Suggested for you
          </h3>
          <div className="space-y-2">
            {suggestedUsers.slice(0, 3).map((user) => (
              <button
                key={user.id}
                onClick={() => handleNavigate(`/u/${user.username}`)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage className="object-cover" src={user.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                    {user.username[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{user.username}</div>
                  <div className="text-xs text-muted-foreground">username</div>
                </div>
              </button>
            ))}
            <button
              onClick={() => handleNavigate("/search")}
              className="w-full text-xs text-primary dark:text-primary hover:underline text-left px-2 py-1"
            >
              See more
            </button>
          </div>
        </div>
      )}

      {/* Theme Toggle & Sign Out */}
      <div className="px-4 py-4 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-sm"
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

