import { useEffect, useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { setupRealtimeSubscriptions } from "@/lib/realtime";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import Feed from "./pages/Feed";
import Search from "./pages/Search";
import Create from "./pages/Create";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Blog from "./pages/Blog";
import Docs from "./pages/Docs";
import About from "./pages/About";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";

import { LocationProvider } from "./context/LocationContext";
import RocketCursor from "@/components/RocketCursor";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OnboardingGuard } from "./components/OnboardingGuard";
import { AppLayout } from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => {
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleNewMessage = (payload: any) => {
    toast("New message", {
      description: payload.content,
      action: { label: "View", onClick: () => console.log('View message') },
    });
  };

  useEffect(() => {
    const checkSession = async () => {
      await supabase.auth.getSession();
      setIsSessionLoading(false);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
        cleanupRef.current = setupRealtimeSubscriptions(session.user, handleNewMessage);
      } else if (event === 'SIGNED_OUT') {
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (isSessionLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <LocationProvider>
            <RocketCursor />
            <ErrorBoundary>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Onboarding */}
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Protected routes with error boundaries */}
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout><Feed /></AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout><Search /></AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create"
                  element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout><Create /></AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout><Profile /></AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activity"
                  element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout><Activity /></AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout><Settings /></AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout><Messages /></AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route path="/u/:username" element={<PublicProfile />} />

                {/* Public content pages */}
                <Route path="/blog" element={<AppLayout><Blog /></AppLayout>} />
                <Route path="/blog/:slug" element={<AppLayout><Blog /></AppLayout>} />
                <Route path="/docs" element={<AppLayout><Docs /></AppLayout>} />
                <Route path="/docs/:slug" element={<AppLayout><Docs /></AppLayout>} />
                <Route path="/about" element={<AppLayout><About /></AppLayout>} />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </LocationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
