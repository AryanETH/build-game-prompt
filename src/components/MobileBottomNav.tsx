import { Home, Search, Sparkles, User, Send } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, username')
      .eq('id', user.id)
      .single();

    setProfile(data);
  };

  const navItems = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: Search, label: "Explore", path: "/search" },
    { icon: Sparkles, label: "Create", path: "/create" },
    { icon: Send, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile", isProfile: true },
  ];

  const isActive = (path: string) => {
    if (path === "/feed") {
      return location.pathname === "/feed";
    }
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ icon: Icon, label, path, isProfile }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? "text-primary dark:text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isProfile && profile ? (
                <Avatar className={`h-6 w-6 ${active ? 'ring-2 ring-primary scale-110' : ''}`}>
                  <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="text-xs">
                    {profile.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon 
                  className={`h-6 w-6 ${active ? 'scale-110' : ''}`} 
                  strokeWidth={active ? 2.5 : 2}
                />
              )}
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
