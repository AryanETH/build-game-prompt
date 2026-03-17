import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, Search, Bell, Plus } from "lucide-react";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [hasNotif, setHasNotif] = useState(false);

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

    // Check unread notifications
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setHasNotif((count ?? 0) > 0);

    const profileChannel = supabase
      .channel('bottom-nav-profile-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => setProfile(payload.new))
      .subscribe();

    return () => { profileChannel.unsubscribe(); };
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom mobile-bottom-nav">
      {/* Frosted glass bar */}
      <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-black/8 dark:border-white/8 flex items-center justify-around h-16 px-4">

        {/* Home */}
        <button onClick={() => navigate('/feed')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all ${isActive('/feed') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Home className={`h-6 w-6 ${isActive('/feed') ? 'fill-current' : ''}`} strokeWidth={isActive('/feed') ? 2.5 : 2} />
        </button>

        {/* Explore */}
        <button onClick={() => navigate('/search')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all ${isActive('/search') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Search className="h-6 w-6" strokeWidth={isActive('/search') ? 2.5 : 2} />
        </button>

        {/* Create — big white circle */}
        <button onClick={() => navigate('/create')}
          className="w-12 h-12 rounded-full bg-foreground dark:bg-white flex items-center justify-center shadow-lg active:scale-90 transition-transform -mt-2">
          <Plus className="h-7 w-7 text-background dark:text-black" strokeWidth={2.5} />
        </button>

        {/* Notifications with red dot */}
        <button onClick={() => navigate('/activity')}
          className={`relative flex flex-col items-center justify-center gap-0.5 transition-all ${isActive('/activity') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Bell className="h-6 w-6" strokeWidth={isActive('/activity') ? 2.5 : 2} />
          {hasNotif && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-black" />
          )}
        </button>

        {/* Profile avatar */}
        <button onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center transition-all">
          <Avatar className={`h-7 w-7 transition-all ${isActive('/profile') ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : ''}`}>
            <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </button>

      </div>
    </nav>
  );
};
