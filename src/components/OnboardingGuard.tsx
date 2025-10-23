import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type OnboardingGuardProps = {
  children: React.ReactNode;
};

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();
      if (!isMounted) return;
      if (!profile || profile.onboarding_complete !== true) {
        navigate("/onboarding");
        return;
      }
      setStatus("allowed");
    })();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (status === "checking") {
    return null;
  }

  return <>{children}</>;
};
