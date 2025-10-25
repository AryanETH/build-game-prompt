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

// AuthListener component ensures user is redirected on auth changes
const AuthListener = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Restore session on page load
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/feed");
    });

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate("/feed");
    });

    return () => subscription.subscription.unsubscribe();
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
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding" element={<Onboarding />} />

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

                {/* Catch-all for unknown routes */}
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
