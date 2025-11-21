import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  // Game-related settings (persisted locally)
  const [autoplayFeed, setAutoplayFeed] = useState<boolean>(true);
  const [enableSoundByDefault, setEnableSoundByDefault] = useState<boolean>(false);
  const [highGraphicsQuality, setHighGraphicsQuality] = useState<boolean>(true);
  const [showRemixBadges, setShowRemixBadges] = useState<boolean>(true);
  const [compactGridLayout, setCompactGridLayout] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('playgen:settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.autoplayFeed === 'boolean') setAutoplayFeed(parsed.autoplayFeed);
        if (typeof parsed.enableSoundByDefault === 'boolean') setEnableSoundByDefault(parsed.enableSoundByDefault);
        if (typeof parsed.highGraphicsQuality === 'boolean') setHighGraphicsQuality(parsed.highGraphicsQuality);
        if (typeof parsed.showRemixBadges === 'boolean') setShowRemixBadges(parsed.showRemixBadges);
        if (typeof parsed.compactGridLayout === 'boolean') setCompactGridLayout(parsed.compactGridLayout);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const payload = {
        autoplayFeed,
        enableSoundByDefault,
        highGraphicsQuality,
        showRemixBadges,
        compactGridLayout,
      };
      localStorage.setItem('playgen:settings', JSON.stringify(payload));
    } catch {}
  }, [autoplayFeed, enableSoundByDefault, highGraphicsQuality, showRemixBadges, compactGridLayout]);

  return (
    <div className="min-h-screen pb-16 md:pb-0 gradient-hero">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="p-6 gradient-card border-primary/20">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your experience</p>
        </Card>

        <Card className="p-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autoplay in feed</p>
                <p className="text-sm text-muted-foreground">Auto-play games on open in Play feed</p>
              </div>
              <Switch checked={autoplayFeed} onCheckedChange={setAutoplayFeed} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable sound by default</p>
                <p className="text-sm text-muted-foreground">Start games with audio on when possible</p>
              </div>
              <Switch checked={enableSoundByDefault} onCheckedChange={setEnableSoundByDefault} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High graphics quality</p>
                <p className="text-sm text-muted-foreground">Prefer higher fidelity visuals in the player</p>
              </div>
              <Switch checked={highGraphicsQuality} onCheckedChange={setHighGraphicsQuality} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show remix badges</p>
                <p className="text-sm text-muted-foreground">Display Remix markers on remixed games</p>
              </div>
              <Switch checked={showRemixBadges} onCheckedChange={setShowRemixBadges} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Compact grid layout</p>
                <p className="text-sm text-muted-foreground">Denser thumbnails on desktop feed</p>
              </div>
              <Switch checked={compactGridLayout} onCheckedChange={setCompactGridLayout} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
