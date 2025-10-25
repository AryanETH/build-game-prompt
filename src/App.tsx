// src/App.tsx

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation, // 1. Import useLocation
} from "react-router-dom";
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

// AuthListener handles Supabase auth state changes
const AuthListener = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Get the current location

  useEffect(() => {
    // Define pages that a logged-in user should be redirected *away* from
    const publicPages = ["/", "/auth"];

    // Restore session on page load
    supabase.auth.getSession().then(({ data }) => {
      // 3. MODIFIED: Only redirect if user has a session AND is on a public page
      if (data.session && publicPages.includes(location.pathname)) {
        navigate("/feed");
      }
    });

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      // 4. MODIFIED: Only redirect on SIGNED_IN if they are on a public page
      if (event === "SIGNED_IN" && publicPages.includes(location.pathname)) {
        navigate("/feed");
      }

      // 5. ADDED: Redirect to auth page on sign out
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]); // 6. ADDED: location.pathname to dependencies

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
            {/* AuthListener now correctly handles redirects */}
            <AuthListener>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route
                  path="/feed"
                  element={<OnboardingGuard><Feed /></OnboardingGuard>}
                />
                <Route
                  path="/search"
                  element={<OnboardingGuard><Search /></OnboardingGuard>}
                />
                <Route
                  path="/create"
                  element={<OnboardingGuard><Create /></OnboardingGuard>}
                />
                <Route
                  path="/profile"
                  element={<OnboardingGuard><Profile /></OnboardingGuard>}
                />
                <Route path="/u/:username" element={<PublicProfile />} />
                {/* Add all custom routes above the catch-all route */}
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
