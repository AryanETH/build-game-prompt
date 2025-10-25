import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [website, setWebsite] = useState("");
  const [user, setUser] = useState<any>(null); // Using any for simplicity

  // 1. Fetch session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        toast.error("Error fetching session.");
        console.error("Session error:", error);
        setLoading(false);
        return;
      }
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    getSession();
  }, [navigate, toast]);

  // 2. Check for existing profile *after* user is set
  useEffect(() => {
    if (!user) return; // Don't run if user is not set yet

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, full_name, website") // I've re-added full_name and website here
          .eq("id", user.id)
          .single();

        if (error && error.status !== 406) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to fetch profile data.");
        }

        if (data) {
          // If user has a profile, redirect to feed
          navigate("/feed");
        }
        // If no data, the page will just finish loading,
        // allowing the user to fill out the form.

      } catch (error) {
        console.error("An unexpected error occurred:", error);
        toast.error("An unexpected error occurred.");
      } finally {
         setLoading(false);
      }
    })();
  }, [user, navigate, toast]); // Added user and toast to dependency array

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !fullName) {
      toast.error("Username and Full Name are required.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        full_name: fullName,
        website,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error onboarding:", error);
        toast.error(error.message);
      } else {
        toast.success("Profile created! Welcome.");
        navigate("/feed");
      }
    } catch (error) {
      console.error("Unexpected error onboarding:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome! Let's set up your profile.</CardTitle>
          <CardDescription>
            This information will be visible to other users.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleOnboarding}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="e.g., aryaneth"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g., Aryan Patil"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                placeholder="e.g., https://yourdomain.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Complete Profile"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Onboarding;
