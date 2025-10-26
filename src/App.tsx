
import { useEffect, useState } from "react";
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
import { ProtectedRoute } from "./components/ProtectedRoute"; // Corrected import
import { OnboardingGuard } from "@/components/OnboardingGuard";

const queryClient = new QueryClient();

const App = () => {
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      await supabase.auth.getSession();
      setIsSessionLoading(false);
    };
    checkSession();
  }, []);

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LocationProvider>
            <RocketCursor />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Onboarding */}
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Protected routes */}
              <Route
                path="/feed"
                element={<ProtectedRoute><Feed /></ProtectedRoute>}
              />
              <Route
                path="/search"
                element={<ProtectedRoute><Search /></ProtectedRoute>}
              />
              <Route
                path="/create"
                element={<ProtectedRoute><Create /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />

              <Route path="/u/:username" element={<PublicProfile />} />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LocationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
