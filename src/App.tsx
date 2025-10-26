import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import Feed from "./pages/Feed";
import Search from "./pages/Search";
import Create from "./pages/Create";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

import { LocationProvider } from "./context/LocationContext";
import RocketCursor from "@/components/RocketCursor";
import { OnboardingGuard } from "@/components/OnboardingGuard";

const queryClient = new QueryClient();

// ✅ Fixed AuthListener – prevents infinite redirect loop
const AuthListener = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Check session on load
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      const session = data.session;
      const currentPath = window.location.pathname;

      if (session) {
        // If logged in and on public routes → redirect to feed
        if (currentPath === "/" || currentPath === "/auth") {
          navigate("/feed", { replace: true });
        }
      } else {
        // If not logged in and on protected routes → go to auth
        const protectedRoutes = ["/feed", "/search", "/create", "/profile"];
        if (protectedRoutes.includes(currentPath)) {
          navigate("/auth", { replace: true });
        }
      }
    });

    // Listen for auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          navigate("/feed", { replace: true });
        } else if (event === "SIGNED_OUT") {
          navigate("/auth", { replace: true });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LocationProvider>
            <RocketCursor />
            <AuthListener>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Onboarding */}
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Protected routes */}
                <Route
                  path="/feed"
                  element={
                    <OnboardingGuard>
                      <Feed />
                    </OnboardingGuard>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <OnboardingGuard>
                      <Search />
                    </OnboardingGuard>
                  }
                />
                <Route
                  path="/create"
                  element={
                    <OnboardingGuard>
                      <Create />
                    </OnboardingGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <OnboardingGuard>
                      <Profile />
                    </OnboardingGuard>
                  }
                />
                <Route path="/u/:username" element={<PublicProfile />} />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthListener>
          </LocationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
