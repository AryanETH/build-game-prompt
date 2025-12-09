import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
    suggestions: string[];
  }>({
    checking: false,
    available: null,
    message: "",
    suggestions: [],
  });

  // Username validation rules (Instagram-style)
  const validateUsername = (username: string): { valid: boolean; message: string } => {
    if (!username) {
      return { valid: false, message: "" };
    }
    
    if (username.length < 3) {
      return { valid: false, message: "Username must be at least 3 characters" };
    }
    
    if (username.length > 30) {
      return { valid: false, message: "Username must be less than 30 characters" };
    }
    
    // Only lowercase letters, numbers, underscores, and periods
    if (!/^[a-z0-9._]+$/.test(username)) {
      return { valid: false, message: "Username can only contain lowercase letters, numbers, periods, and underscores" };
    }
    
    // Can't start or end with period or underscore
    if (/^[._]|[._]$/.test(username)) {
      return { valid: false, message: "Username can't start or end with a period or underscore" };
    }
    
    // Can't have consecutive periods or underscores
    if (/[._]{2,}/.test(username)) {
      return { valid: false, message: "Username can't have consecutive periods or underscores" };
    }
    
    return { valid: true, message: "" };
  };
  
  // Generate username suggestions (Instagram-style algorithm)
  const generateUsernameSuggestions = (baseUsername: string, name: string): string[] => {
    const suggestions: string[] = [];
    const cleanBase = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Strategy 1: Add numbers
    suggestions.push(`${cleanBase}${Math.floor(Math.random() * 999) + 1}`);
    suggestions.push(`${cleanBase}${Math.floor(Math.random() * 9999) + 1000}`);
    
    // Strategy 2: Add underscores
    if (cleanName && cleanName !== cleanBase) {
      suggestions.push(`${cleanName}_${cleanBase}`);
      suggestions.push(`${cleanBase}_${cleanName}`);
    }
    
    // Strategy 3: Add year or random suffix
    const year = new Date().getFullYear();
    suggestions.push(`${cleanBase}${year}`);
    suggestions.push(`${cleanBase}_${Math.floor(Math.random() * 999)}`);
    
    // Strategy 4: Add prefix
    const prefixes = ['the', 'real', 'official', 'its'];
    suggestions.push(`${prefixes[Math.floor(Math.random() * prefixes.length)]}_${cleanBase}`);
    
    // Return unique suggestions
    return [...new Set(suggestions)].slice(0, 5);
  };
  
  // Check username availability with debounce
  useEffect(() => {
    if (!isSignUp || !formData.username) {
      setUsernameStatus({ checking: false, available: null, message: "", suggestions: [] });
      return;
    }
    
    const validation = validateUsername(formData.username);
    if (!validation.valid) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: validation.message,
        suggestions: [],
      });
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setUsernameStatus(prev => ({ ...prev, checking: true }));
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username.toLowerCase())
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          // Username taken - generate suggestions
          const suggestions = generateUsernameSuggestions(formData.username, formData.name);
          setUsernameStatus({
            checking: false,
            available: false,
            message: "Username already exists",
            suggestions,
          });
        } else {
          // Username available
          setUsernameStatus({
            checking: false,
            available: true,
            message: "Username is available",
            suggestions: [],
          });
        }
      } catch (error) {
        console.error('Username check error:', error);
        setUsernameStatus({
          checking: false,
          available: null,
          message: "Error checking username",
          suggestions: [],
        });
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [formData.username, formData.name, isSignUp]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoading(false);
      if (data.session) {
        // Check if admin
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@oplus.ai";
        if (data.session.user.email === adminEmail) {
          navigate("/admin");
        } else {
          navigate("/feed");
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setTimeout(() => {
          // Check if admin
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@oplus.ai";
          if (session.user.email === adminEmail) {
            navigate("/admin");
          } else {
            navigate("/feed");
          }
        }, 300);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Validate username before signup
      if (!usernameStatus.available) {
        toast.error("Please choose an available username");
        return;
      }
      
      // Sign up
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@oplus.ai";
      const isAdminSignup = formData.email === adminEmail;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            username: formData.username.toLowerCase(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        if (isAdminSignup) {
          toast.success("Admin account created! You can log in immediately.");
        } else {
          toast.success("Account created! Please check your email to verify.");
        }
      }
    } else {
      // Sign in - Accept both email and username
      const identifier = formData.email.trim();
      let emailToUse = identifier;
      
      // Check if identifier is a username (no @ symbol)
      if (!identifier.includes('@')) {
        // Look up email by username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier.toLowerCase())
          .single();
        
        if (profileError || !profile?.email) {
          toast.error('Username not found. Please check your username or use your email.');
          return;
        }
        
        emailToUse = profile.email;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Purple Gradient Panel */}
      <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Top - Logo */}
          <div className="flex justify-center items-center py-8">
            <div className="relative">
              <img 
                src="/Oplus full logo.png"
                alt="Oplus Logo"
                className="h-[485px] w-auto relative z-10 animate-fade-slow"
                style={{ 
                  filter: "invert(1) brightness(2)",
                  imageRendering: "-webkit-optimize-contrast"
                }}
              />
              <div className="absolute inset-0 blur-3xl bg-white/10 animate-fade-slow -z-10"></div>
            </div>
          </div>
          
          <style>{`
            @keyframes fade-slow {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            .animate-fade-slow {
              animation: fade-slow 4s ease-in-out infinite;
            }
          `}</style>

          
          {/* Bottom - Text */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Get Started with Us
            </h1>
            <p className="text-purple-200 text-lg">
              Complete these easy steps to register your account.
            </p>
          </div>
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
                ? "Welcome To O➕"
                : "Enter your credentials to access your account."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="eg. Valya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-[#111111] border-[#333333] text-white placeholder:text-white/40 focus:border-purple-600 focus:ring-purple-600"
                  />
                  <p className="text-xs text-white/40">Your display name (can be changed later)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="eg. valya_sharma"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                      required
                      className={`bg-[#111111] border-[#333333] text-white placeholder:text-white/40 focus:border-purple-600 focus:ring-purple-600 pr-10 ${
                        formData.username && usernameStatus.available === false ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      } ${
                        formData.username && usernameStatus.available === true ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                      }`}
                    />
                    {formData.username && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus.checking ? (
                          <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
                        ) : usernameStatus.available === true ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : usernameStatus.available === false ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Username feedback */}
                  {formData.username && usernameStatus.message && (
                    <p className={`text-xs ${usernameStatus.available ? 'text-green-500' : 'text-red-500'}`}>
                      {usernameStatus.message}
                    </p>
                  )}
                  
                  {/* Username suggestions */}
                  {usernameStatus.suggestions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-white/60">Try these instead:</p>
                      <div className="flex flex-wrap gap-2">
                        {usernameStatus.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setFormData({ ...formData, username: suggestion })}
                            className="px-3 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-full border border-purple-600/30 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!formData.username && (
                    <p className="text-xs text-white/40">
                      Lowercase letters, numbers, periods, and underscores only
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                {isSignUp ? 'Email' : 'Email or Username'}
              </Label>
              <Input
                id="email"
                type={isSignUp ? "email" : "text"}
                placeholder={isSignUp ? "eg. Valya@gmail.com" : "eg. valya_sharma or valya@gmail.com"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-[#111111] border-[#333333] text-white placeholder:text-white/40 focus:border-purple-600 focus:ring-purple-600"
              />
              {!isSignUp && (
                <p className="text-xs text-white/40">You can log in with either your email or username</p>
              )}
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
