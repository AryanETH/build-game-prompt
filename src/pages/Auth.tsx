import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await (window as any).Clerk?.openSignIn?.({});
      // user will be redirected/overlayed by Clerk, but attempt immediate sync
      try {
        const token = await (window as any).Clerk?.session?.getToken?.();
        if (token) {
          await fetch('/api/user-sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        }
      } catch {}
      navigate('/feed');
    } catch (error: any) {
      toast.error(error?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    toast.info('Use Clerk sign-in to receive codes');
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await (window as any).Clerk?.openSignIn?.({});
    } catch (error: any) {
      toast.error(error?.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md gradient-card border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg gradient-primary flex items-center justify-center font-bold text-2xl mb-4">
            PG
          </div>
          <CardTitle className="text-3xl font-bold">
            {isLogin ? "Welcome Back" : "Join playGen"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to continue creating and playing games"
              : "Create your account and start generating games with AI"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            type="button"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>
            )}
            {!isLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (for OTP)</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 555 5555" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" disabled={isLoading || !awaitingOtp} />
                  <div className="text-right">
                    <button type="button" className="text-xs text-primary" onClick={handleResendOtp} disabled={isLoading}>
                      Resend code
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isLoading}
                minLength={8}
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(Boolean(v))} />
                  <Label htmlFor="terms">I agree to Terms & Conditions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="privacy" checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(Boolean(v))} />
                  <Label htmlFor="privacy">I agree to Privacy Policy</Label>
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full gradient-primary glow-primary"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-accent transition-colors"
              disabled={isLoading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}