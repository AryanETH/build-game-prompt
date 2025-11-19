import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoading(false);
      if (data.session) {
        navigate("/feed");
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setTimeout(() => {
          navigate("/feed");
        }, 300);
      }
    });

    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success("Account created! Please check your email to verify.");
      }
    } else {
      // Sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Purple Gradient Panel */}
      <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          <div>
            <div className="mb-12">
              <img 
                src="/feep-logo.png" 
                alt="FEEP" 
                className="h-10 w-auto mb-4" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== `${window.location.origin}/feep-logo.svg`) {
                    target.src = "/feep-logo.svg";
                    target.classList.add("dark:invert");
                  }
                }}
              />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              {isSignUp ? "Get Started with Us" : "Welcome Back"}
            </h1>
            <p className="text-white/70 text-lg">
              {isSignUp 
                ? "Complete these easy steps to register your account."
                : "Sign in to continue your gaming journey."}
            </p>
          </div>

          {/* Steps Indicator */}
          {isSignUp && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="w-8 h-8 rounded-full bg-white text-purple-900 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <span className="text-white font-medium">Sign up your account</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <span className="text-white/70 font-medium">Set up your workspace</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <span className="text-white/70 font-medium">Set up your profile</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? "Sign Up" : "Log In"}
            </h2>
            <p className="text-white/60">
              {isSignUp 
                ? "Sign Up"
                : "Enter your credentials to access your account."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="eg. johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="bg-[#111111] border-[#333333] text-white placeholder:text-white/40 focus:border-purple-600 focus:ring-purple-600"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="eg. johnfrans@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-[#111111] border-[#333333] text-white placeholder:text-white/40 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-[#111111] border-[#333333] text-white placeholder:text-white/40 focus:border-purple-600 focus:ring-purple-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {isSignUp && (
                <p className="text-xs text-white/40">Must be at least 8 characters.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90 h-12 text-base font-semibold"
            >
              {isSignUp ? "Sign Up" : "Log In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
