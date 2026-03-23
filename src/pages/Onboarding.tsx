// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        toast({
          title: "Error",
          description: "There was an error fetching your session.",
        });
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

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to fetch profile data.",
          });
        }

        if (data) {
          navigate("/feed");
        }
      } catch (error) {
        console.error("An unexpected error occurred:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate, toast]);

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size cannot exceed 2MB.",
      });
      return;
    }

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast({
        title: "Error",
        description: "File must be a PNG, JPG, or WebP image.",
      });
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !fullName) {
      toast({
        title: "Error",
        description: "Username and Full Name are required.",
      });
      setLoading(false);
      return;
    }

    let avatarPublicUrl = null;
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        toast({
          title: "Error",
          description: "Error uploading avatar.",
        });
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      avatarPublicUrl = `${publicUrl}?t=${Date.now()}`;
    }

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        full_name: fullName,
        website,
        avatar_url: avatarPublicUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error onboarding:", error);
        toast({ title: "Error", description: error.message });
      } else {
        toast({
          title: "Success",
          description: "Profile created! Welcome.",
        });
        navigate("/feed");
      }
    } catch (error) {
      console.error("Unexpected error onboarding:", error);
      toast({ title: "Error", description: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
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
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
                  <AvatarFallback className="bg-muted">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl(null);
                      setAvatarFile(null);
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
              <Input
                id="avatar"
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAvatarUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button type="button" variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground text-center">
                PNG, JPG or WebP (max 2MB)
              </p>
            </div>
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
