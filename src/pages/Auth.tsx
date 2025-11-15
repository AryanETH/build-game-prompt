import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/feed");
      }
    });

    // Optional: redirect if session already exists
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/feed");
      }
    });

    // Fix for subscription.unsubscribe error
    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md gradient-card border-border/50">
        <CardHeader className="text-center">
          <img src="/FEEP.png" alt="Feep" className="mx-auto h-12 w-12 mb-3" />
          <CardTitle className="text-3xl font-bold">Welcome to Feep</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: { brand: "#6366F1", brandAccent: "#4338CA" },
                  radii: { buttonBorderRadius: "12px", inputBorderRadius: "12px" },
                },
              },
              className: {
                button: "gradient-primary glow-primary",
              },
            }}
            providers={[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
