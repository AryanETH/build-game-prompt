import { Home, Search, Sparkles, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: Search, label: "Explore", path: "/search" },
    { icon: Sparkles, label: "Create", path: "/create" },
    { icon: User, label: "Profile", path: "/profile" },
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
        {navItems.map(({ icon: Icon, label, path }) => {
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
              <Icon 
                className={`h-6 w-6 ${active ? 'scale-110' : ''}`} 
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
