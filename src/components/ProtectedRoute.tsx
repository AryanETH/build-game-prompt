
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Fetches user profile
const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
      } else {
        navigate("/auth", { replace: true });
      }
      setSessionChecked(true);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUserId(session.user.id);
        } else {
          setUserId(null);
          navigate("/auth", { replace: true });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (sessionChecked && userId && !isLoading && (isError || !profile?.username)) {
      navigate("/onboarding", { replace: true });
    }
  }, [sessionChecked, userId, isLoading, isError, profile, navigate]);

  if (isLoading || !sessionChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (userId && profile?.username) {
    return <>{children}</>;
  }

  return null;
};
