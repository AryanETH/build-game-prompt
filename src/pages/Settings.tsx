import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ChevronRight, 
  User, 
  Lock, 
  Bell, 
  Eye, 
  Clock, 
  BarChart3, 
  Sparkles, 
  HelpCircle, 
  Info, 
  LogOut,
  UserPlus,
  Shield,
  Key,
  Trash2,
  Globe,
  Moon,
  Volume2,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showScreenTimeDialog, setShowScreenTimeDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('app-language') || 'English';
  });
  const [dailyLimit, setDailyLimit] = useState<number>(() => {
    return parseInt(localStorage.getItem('daily-screen-time-limit') || '0');
  });

  const languages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Russian", "Japanese", "Korean", "Chinese (Simplified)", "Chinese (Traditional)",
    "Arabic", "Hindi", "Bengali", "Turkish", "Vietnamese", "Thai", "Indonesian",
    "Dutch", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
    "Greek", "Hebrew", "Czech", "Romanian", "Hungarian", "Ukrainian"
  ];
  
  // Preferences
  const [autoplayFeed, setAutoplayFeed] = useState<boolean>(true);
  const [enableSoundByDefault, setEnableSoundByDefault] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('playgen:settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.autoplayFeed === 'boolean') setAutoplayFeed(parsed.autoplayFeed);
        if (typeof parsed.enableSoundByDefault === 'boolean') setEnableSoundByDefault(parsed.enableSoundByDefault);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const payload = { autoplayFeed, enableSoundByDefault };
      localStorage.setItem('playgen:settings', JSON.stringify(payload));
    } catch {}
  }, [autoplayFeed, enableSoundByDefault]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleDeleteAccount = async () => {
    toast.error("Account deletion is not available yet. Please contact support.");
    setShowDeleteDialog(false);
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onClick, 
    showArrow = true,
    danger = false 
  }: { 
    icon: any; 
    title: string; 
    subtitle?: string; 
    onClick: () => void; 
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-smooth rounded-lg active-scale ${
        danger ? 'text-red-500' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-muted-foreground'}`} />
        <div className="text-left">
          <p className={`font-medium ${danger ? 'text-red-500' : ''}`}>{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {showArrow && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </button>
  );

  const SettingToggle = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    checked, 
    onChange 
  }: { 
    icon: any; 
    title: string; 
    subtitle: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings and privacy</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Account Section */}
          <Card className="overflow-hidden rounded-2xl shadow-soft hover-lift transition-smooth">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground">ACCOUNT</h2>
            </div>
            <SettingItem
              icon={User}
              title="Manage account"
              subtitle="Edit profile, change username"
              onClick={() => navigate("/profile?edit=true")}
            />
            <SettingItem
              icon={UserPlus}
              title="Switch accounts"
              subtitle="Add or switch between accounts"
              onClick={() => toast.info("Multiple accounts coming soon")}
            />
            <SettingItem
              icon={Key}
              title="Password and security"
              subtitle="Reset password via email"
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.email) {
                  toast.error("No email found");
                  return;
                }
                
                const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                  redirectTo: `${window.location.origin}/auth?reset=true`,
                });
                
                if (error) {
                  toast.error("Failed to send reset email");
                } else {
                  toast.success(`Password reset email sent to ${user.email}`);
                }
              }}
            />
          </Card>

          {/* Privacy Section */}
          <Card className="overflow-hidden rounded-2xl shadow-soft hover-lift transition-smooth">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground">PRIVACY</h2>
            </div>
            <SettingItem
              icon={Lock}
              title="Privacy and safety"
              subtitle="Control who can see your content"
              onClick={() => toast.info("Privacy settings coming soon")}
            />
            <SettingItem
              icon={Eye}
              title="Blocked accounts"
              subtitle="Manage blocked users"
              onClick={() => toast.info("Block list coming soon")}
            />
            <SettingItem
              icon={Shield}
              title="Data and permissions"
              subtitle="Manage your data and app permissions"
              onClick={() => toast.info("Data settings coming soon")}
            />
          </Card>

          {/* Preferences Section */}
          <Card className="overflow-hidden rounded-2xl shadow-soft hover-lift transition-smooth">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground">PREFERENCES</h2>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Dark mode</p>
                  <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <SettingToggle
              icon={Globe}
              title="Autoplay in feed"
              subtitle="Auto-play games when scrolling"
              checked={autoplayFeed}
              onChange={setAutoplayFeed}
            />
            <SettingToggle
              icon={Volume2}
              title="Sound by default"
              subtitle="Start games with audio enabled"
              checked={enableSoundByDefault}
              onChange={setEnableSoundByDefault}
            />
            <SettingItem
              icon={Bell}
              title="Push notifications"
              subtitle="Manage notification preferences"
              onClick={() => toast.info("Notification settings coming soon")}
            />
            <SettingItem
              icon={Globe}
              title="Language"
              subtitle={selectedLanguage}
              onClick={() => setShowLanguageDialog(true)}
            />
          </Card>

          {/* Activity Section */}
          <Card className="overflow-hidden rounded-2xl shadow-soft hover-lift transition-smooth">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground">ACTIVITY</h2>
            </div>
            <SettingItem
              icon={Clock}
              title="Screen time management"
              subtitle={dailyLimit > 0 ? `${dailyLimit} minutes daily limit` : "No limit set"}
              onClick={() => setShowScreenTimeDialog(true)}
            />
            <SettingItem
              icon={BarChart3}
              title="Your activity"
              subtitle="View your stats and insights"
              onClick={() => navigate("/profile?tab=stats")}
            />
          </Card>

          {/* Support Section */}
          <Card className="overflow-hidden rounded-2xl shadow-soft hover-lift transition-smooth">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground">SUPPORT</h2>
            </div>
            <SettingItem
              icon={Sparkles}
              title="Early access features"
              subtitle="Try new features before everyone"
              onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLScUqAOFj9QwY3t_Y4pLJPjC4V2J6w9kvwnhI2V2k3JsCIguVw/viewform?usp=publish-editor", "_blank")}
            />
            <SettingItem
              icon={HelpCircle}
              title="Help center"
              subtitle="Get help and support"
              onClick={() => window.open("mailto:playgenofficial@gmail.com", "_blank")}
            />
            <SettingItem
              icon={Info}
              title="About Oplus AI"
              subtitle="Version 1.0.0"
              onClick={() => navigate("/about")}
            />
          </Card>

          {/* Actions Section */}
          <Card className="overflow-hidden rounded-2xl shadow-soft hover-lift transition-smooth">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground">ACTIONS</h2>
            </div>
            <SettingItem
              icon={LogOut}
              title="Log out"
              onClick={() => setShowLogoutDialog(true)}
              showArrow={false}
            />
            <SettingItem
              icon={Trash2}
              title="Delete account"
              subtitle="Permanently delete your account"
              onClick={() => setShowDeleteDialog(true)}
              showArrow={false}
              danger
            />
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground py-4">
            <p>Made with ❤️ by Oplus AI Team</p>
            <p className="mt-1">© 2024 Oplus AI. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Oplus AI?</AlertDialogTitle>
            <AlertDialogDescription>
              You can always log back in at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your games, comments, and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600">
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Screen Time Dialog */}
      <AlertDialog open={showScreenTimeDialog} onOpenChange={setShowScreenTimeDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Daily screen time limit</AlertDialogTitle>
            <AlertDialogDescription>
              Set a daily time limit. You'll get a reminder when you reach it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="time-limit">Minutes per day (0 = no limit)</Label>
            <Input
              id="time-limit"
              type="number"
              min="0"
              max="1440"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
              className="mt-2"
              placeholder="Enter minutes (e.g., 120 for 2 hours)"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                localStorage.setItem('daily-screen-time-limit', dailyLimit.toString());
                localStorage.setItem('screen-time-start', Date.now().toString());
                toast.success(dailyLimit > 0 ? `Daily limit set to ${dailyLimit} minutes` : "Daily limit removed");
                setShowScreenTimeDialog(false);
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Language Picker Dialog */}
      <AlertDialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md max-h-[80vh]">
          <AlertDialogHeader>
            <AlertDialogTitle>Select Language</AlertDialogTitle>
            <AlertDialogDescription>
              Choose your preferred language for the app
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors ${
                    selectedLanguage === lang ? 'bg-muted' : ''
                  }`}
                >
                  <span className="font-medium">{lang}</span>
                  {selectedLanguage === lang && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                localStorage.setItem('app-language', selectedLanguage);
                toast.success(`Language changed to ${selectedLanguage}`);
                setShowLanguageDialog(false);
                
                // Apply RTL for Arabic and Hebrew
                if (selectedLanguage === 'Arabic' || selectedLanguage === 'Hebrew') {
                  document.documentElement.dir = 'rtl';
                } else {
                  document.documentElement.dir = 'ltr';
                }
                
                // Reload to apply changes
                setTimeout(() => window.location.reload(), 500);
              }}
            >
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
