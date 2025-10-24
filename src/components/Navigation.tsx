import { Home, Sparkles, User, LogOut, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useLocationContext } from "@/context/LocationContext";

export const Navigation = ({ hideBrand = false }: { hideBrand?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, city, country } = useLocationContext();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (_) {
      // ignore
    } finally {
      navigate("/auth");
    }
  };

  const navItems = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Sparkles, label: "Create", path: "/create" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-card/80 backdrop-blur-lg z-40 md:top-0 md:bottom-auto">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {!hideBrand && (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xl font-bold">playGen</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground pl-2 border-l border-border/50">
                <MapPin className="h-4 w-4" />
                <span>{mode === 'city' && city ? city : mode === 'country' && country ? country : 'Global'}</span>
              </div>
            </div>
          )}

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
            <ThemeToggle />
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