import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { promptForNotificationsAfterSignup } from "@/lib/notificationSetup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
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
            // Prompt for notifications after successful signup/login
            promptForNotificationsAfterSignup();
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
          // Enhanced email verification notification
          toast.success("🎉 Account created successfully!", {
            description: `📧 Verification email sent to ${formData.email}. Please check your inbox and click the verification link to activate your account.`,
            duration: 8000, // Show for 8 seconds
          });
          
          // Show email verification UI
          setVerificationEmail(formData.email);
          setShowEmailVerification(true);
          
          // Clear form data
          setFormData({
            name: "",
            username: "",
            email: "",
            password: "",
          });
          
          // Show additional helpful message after a delay
          setTimeout(() => {
            toast.info("📬 Don't see the email?", {
              description: "Check your spam folder or try signing up again. The verification link expires in 24 hours.",
              duration: 6000,
            });
          }, 3000);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResettingPassword(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-password-otp', {
        body: { email: forgotPasswordEmail.trim() }
      });

      if (error) {
        toast.error(error.message || "Failed to send OTP");
      } else {
        toast.success("OTP sent to your email! Check your inbox for the 6-digit code.");
        setOtpEmail(forgotPasswordEmail.trim());
        setShowForgotPassword(false);
        setShowOtpVerification(true);
        setForgotPasswordEmail("");
      }
    } catch (error) {
      console.error("OTP send error:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };



  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsVerifyingOtp(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-password-otp', {
        body: { 
          email: otpEmail,
          otp: otp.trim(),
          newPassword: newPassword
        }
      });

      if (error) {
        toast.error(error.message || "Invalid OTP or verification failed");
      } else {
        toast.success("Password reset successful! You can now log in with your new password.");
        setShowOtpVerification(false);
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpEmail("");
        // Switch to login mode
        setIsSignUp(false);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpEmail) return;
    
    setIsResettingPassword(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-password-otp', {
        body: { email: otpEmail }
      });

      if (error) {
        toast.error(error.message || "Failed to resend OTP");
      } else {
        toast.success("New OTP sent to your email!");
      }
    } catch (error) {
      console.error("OTP resend error:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("📧 Verification email resent!", {
          description: `New verification email sent to ${verificationEmail}. Please check your inbox.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to resend verification email. Please try again.");
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
              <div className="absolute inset-0 blur-3xl animate-fade-slow -z-10"></div>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                {/* Full Name - Floating Label */}
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder=" "
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-[#111111] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 peer pt-6 pb-2"
                  />
                  <Label 
                    htmlFor="name" 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                  >
                    Full Name
                  </Label>
                </div>

                {/* Username - Floating Label */}
                <div className="relative">
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder=" "
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                      required
                      className={`bg-[#111111] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 pr-10 peer pt-6 pb-2 ${
                        formData.username && usernameStatus.available === false ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      } ${
                        formData.username && usernameStatus.available === true ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                      }`}
                    />
                    <Label 
                      htmlFor="username" 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                    >
                      Username
                    </Label>
                    {formData.username && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus.checking ? (
                          <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
                        ) : usernameStatus.available === true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : usernameStatus.available === false ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Username validation errors - only show when there's an error */}
                  {formData.username && usernameStatus.message && !usernameStatus.available && (
                    <p className="text-xs text-red-500 mt-1">
                      {usernameStatus.message}
                    </p>
                  )}
                  
                  {/* Username suggestions */}
                  {usernameStatus.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-white/60">Try these instead:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {usernameStatus.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setFormData({ ...formData, username: suggestion })}
                            className="px-2.5 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-full border border-purple-600/30 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email - Floating Label */}
            <div className="relative">
              <Input
                id="email"
                type={isSignUp ? "email" : "text"}
                placeholder=" "
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-[#111111] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 peer pt-6 pb-2"
              />
              <Label 
                htmlFor="email" 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
              >
                {isSignUp ? 'Email' : 'Email or Username'}
              </Label>
            </div>

            {/* Password - Floating Label */}
            <div className="relative">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="bg-[#111111] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 pr-10 peer pt-6 pb-2"
                />
                <Label 
                  htmlFor="password" 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                >
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password validation - only show error when user types less than 6 chars */}
              {isSignUp && formData.password && formData.password.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Must be at least 6 characters</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90 h-12 text-base font-semibold"
            >
              {isSignUp ? "Sign Up" : "Log In"}
            </Button>
          </form>

          {/* Forgot Password Link - Only show on login */}
          {!isSignUp && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Forgot your password?
              </button>
            </div>
          )}

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

          {/* Forgot Password Modal */}
          <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
            <DialogContent className="bg-[#111111] border-[#333333] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-400" />
                  Reset Your Password
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-white/70 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative">
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder=" "
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="bg-[#1a1a1a] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 peer pt-6 pb-2"
                    />
                    <Label 
                      htmlFor="reset-email" 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                    >
                      Email Address
                    </Label>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 bg-transparent border-[#333333] text-white hover:bg-[#1a1a1a] hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isResettingPassword}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </div>
                </form>
                
                <div className="text-center">
                  <p className="text-xs text-white/50">
                    Remember your password?{" "}
                    <button
                      onClick={() => setShowForgotPassword(false)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Back to login
                    </button>
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* OTP Verification Modal */}
          <Dialog open={showOtpVerification} onOpenChange={() => {}}>
            <DialogContent className="bg-[#111111] border-[#333333] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-400" />
                  Enter OTP & New Password
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-white/70 text-sm">
                  We sent a 6-digit OTP to <span className="text-purple-400 font-medium">{otpEmail}</span>. 
                  Enter the OTP and your new password below.
                </p>
                
                <form onSubmit={handleOtpVerification} className="space-y-4">
                  {/* OTP Input */}
                  <div className="relative">
                    <Input
                      id="otp-input"
                      type="text"
                      placeholder=" "
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      required
                      maxLength={6}
                      className="bg-[#1a1a1a] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 peer pt-6 pb-2 text-center text-2xl font-mono tracking-widest"
                    />
                    <Label 
                      htmlFor="otp-input" 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                    >
                      6-Digit OTP
                    </Label>
                  </div>
                  
                  {/* New Password */}
                  <div className="relative">
                    <Input
                      id="new-password"
                      type="password"
                      placeholder=" "
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-[#1a1a1a] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 peer pt-6 pb-2"
                    />
                    <Label 
                      htmlFor="new-password" 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                    >
                      New Password
                    </Label>
                  </div>
                  
                  {/* Confirm Password */}
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder=" "
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-[#1a1a1a] border-[#333333] text-white placeholder:text-transparent focus:border-purple-600 focus:ring-purple-600 peer pt-6 pb-2"
                    />
                    <Label 
                      htmlFor="confirm-password" 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                    >
                      Confirm New Password
                    </Label>
                  </div>
                  
                  {/* Validation Messages */}
                  {otp && otp.length > 0 && otp.length < 6 && (
                    <p className="text-xs text-red-500">OTP must be 6 digits</p>
                  )}
                  
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-red-500">Password must be at least 6 characters</p>
                  )}
                  
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowOtpVerification(false);
                        setShowForgotPassword(true);
                      }}
                      className="flex-1 bg-transparent border-[#333333] text-white hover:bg-[#1a1a1a] hover:text-white"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isVerifyingOtp || otp.length !== 6 || newPassword.length < 6 || newPassword !== confirmPassword}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </div>
                </form>
                
                <div className="text-center">
                  <p className="text-xs text-white/50 mb-2">
                    Didn't receive the OTP?
                  </p>
                  <button
                    onClick={handleResendOtp}
                    disabled={isResettingPassword}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium disabled:opacity-50"
                  >
                    {isResettingPassword ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Email Verification Modal */}
          <Dialog open={showEmailVerification} onOpenChange={setShowEmailVerification}>
            <DialogContent className="bg-[#111111] border-[#333333] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  Check Your Email
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-green-400" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Account Created Successfully!
                  </h3>
                  
                  <p className="text-white/70 text-sm mb-4">
                    We've sent a verification email to:
                  </p>
                  
                  <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 mb-4">
                    <p className="text-purple-400 font-medium break-all">
                      {verificationEmail}
                    </p>
                  </div>
                  
                  <p className="text-white/60 text-sm">
                    Please check your inbox and click the verification link to activate your account.
                  </p>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs">
                    💡 <strong>Tip:</strong> If you don't see the email, check your spam folder. The verification link expires in 24 hours.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmailVerification(false)}
                    className="flex-1 bg-transparent border-[#333333] text-white hover:bg-[#1a1a1a] hover:text-white"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResendVerification}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Resend Email
                  </Button>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-white/50">
                    Already verified?{" "}
                    <button
                      onClick={() => {
                        setShowEmailVerification(false);
                        setIsSignUp(false);
                      }}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
