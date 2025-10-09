import { Home, Sparkles, User, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const navItems = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: Sparkles, label: "Create", path: "/create" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-card/80 backdrop-blur-lg z-40 md:top-0 md:bottom-auto">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="hidden md:flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden">
              <div className="absolute inset-0 animate-pulse-slow bg-gradient-to-br from-primary/30 to-accent/30" />
              <img src="/logo.png" alt="Logo" className="relative z-10 h-full w-full object-contain" />
            </div>
            <span className="text-xl font-bold">PlayGen</span>
          </div>

          <div className="flex items-center justify-around md:justify-center gap-2 w-full md:w-auto">
            {navItems.map(({ icon: Icon, label, path }) => (
              <Button
                key={path}
                variant={location.pathname === path ? "default" : "ghost"}
                onClick={() => navigate(path)}
                className={location.pathname === path ? "gradient-primary" : ""}
              >
                <Icon className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">{label}</span>
              </Button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};