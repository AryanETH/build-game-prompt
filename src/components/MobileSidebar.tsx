import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { toast } from "sonner";

export const MobileSidebar = ({ hideButton = false }: { hideButton?: boolean }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Play, label: "Play Feed", path: "/feed" },
    { icon: Compass, label: "Explore", path: "/search" },
    { icon: Radio, label: "Live Feed", path: "/feed?tab=watch" },
    { icon: UserPlus, label: "Following", path: "/feed?tab=following" },
    { icon: Sparkles, label: "Create", path: "/create" },
    { icon: Bell, label: "Activity", path: "/feed?tab=activity" },
    { icon: MessageCircle, label: "Messages", path: "/feed?tab=messages" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: MoreHorizontal, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/feed") {
      return location.pathname === "/feed" && !location.search.includes("tab=");
    }
    return location.pathname === path;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (_) {
      // ignore
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideButton && (
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-black border border-border/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="left" className="w-[240px] p-0 overflow-hidden">
        <div className="h-full flex flex-col bg-white dark:bg-black" style={{ margin: 0, padding: 0 }}>
          {/* Logo */}
          <div className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center">
              <Logo variant="horizontal" size="md" />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ icon: Icon, label, path }) => {
              const active = isActive(path);
              return (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold"
                      : "text-foreground hover:bg-muted/50 hover:text-primary dark:hover:text-primary"
                  }`}
                >
                  <Icon 
                    className={`h-5 w-5 transition-transform duration-200 ${
                      active ? "scale-110" : "group-hover:scale-110"
                    }`} 
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="text-sm">{label}</span>
                </button>
              );
            })}
          </nav>

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
        </div>
      </SheetContent>
    </Sheet>
  );
};

