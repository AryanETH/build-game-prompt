import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Globe, Lock, Eye, Pencil } from "lucide-react";

export default function Create() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [soundUrl, setSoundUrl] = useState<string>("");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerType, setMultiplayerType] = useState<string>("co-op");
  const [graphicsQuality, setGraphicsQuality] = useState<string>("realistic");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();

  // Sound upload via file removed per product direction; keep optional URL only

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a game prompt");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate game code
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: { 
          prompt,
          options: {
            isMultiplayer,
            multiplayerType,
            graphicsQuality,
          }
        },
      });

      if (error) throw error;

      setGeneratedCode(data.gameCode);

      // Generate AI thumbnail automatically
      toast.info("Generating thumbnail...");
      const thumbnailResponse = await supabase.functions.invoke('generate-thumbnail', { body: { prompt } });
      const autoThumb = thumbnailResponse.data?.thumbnailUrl || "/placeholder.svg";
      setThumbnailUrl(autoThumb);
      setCoverUrl(autoThumb);
      
      // Auto-generate title and description if not provided
      if (!title) {
        setTitle(prompt.slice(0, 50));
      }
      if (!description) {
        setDescription(`An AI-generated game based on: ${prompt}`);
      }
      
      toast.success("Game and thumbnail generated! Preview and publish when ready.");
    } catch (error: any) {
      console.error('Generation error:', error);
      if (error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('402')) {
        toast.error("Please add credits to continue generating games.");
      } else {
        toast.error("Failed to generate game. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const ensureProfileExistsForUser = async (userId: string, suggestedUsername: string) => {
    // Check if profile already exists
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) return; // Nothing to do

    // Sanitize and constrain base username
    const base = (suggestedUsername || `user_${userId.slice(0, 8)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24) || `user_${userId.slice(0, 8)}`;

    let attempt = 0;
    let candidate = base;
    // Find an available username to avoid unique constraint violations
    // Limit attempts to a reasonable number to avoid infinite loops
    while (attempt < 50) {
      const { data: usernameRow, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', candidate)
        .maybeSingle();

      if (usernameCheckError) throw usernameCheckError;
      if (!usernameRow) break;

      attempt += 1;
      const suffix = `_${attempt}`;
      const maxBaseLength = Math.max(1, 24 - suffix.length);
      candidate = `${base.slice(0, maxBaseLength)}${suffix}`;
    }

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, username: candidate });
    if (insertError) throw insertError;
  };

  const handlePublish = async () => {
    if (!generatedCode || !title.trim()) {
      toast.error("Please generate a game and provide a title");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to publish games");
        return;
      }

      // Ensure profile exists and avoid username unique conflicts
      const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0,8)}`;
      await ensureProfileExistsForUser(user.id, baseUsername);

      // Get user's location
      let userLocation = { country: null, city: null };
      try {
        if ("geolocation" in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          userLocation.country = data.address?.country || null;
          userLocation.city = data.address?.city || data.address?.town || data.address?.village || null;
        }
      } catch (err) {
        console.log("Location not available, proceeding without it");
      }

      // Auto-generate sound if not provided
      let finalSoundUrl = soundUrl;
      if (!finalSoundUrl) {
        toast.info("Generating background music...");
        try {
          const { data: soundData, error: soundError } = await supabase.functions.invoke('generate-music', {
            body: { prompt: title.trim() }
          });
          if (soundData?.musicUrl) {
            finalSoundUrl = soundData.musicUrl;
          }
        } catch (err) {
          console.log("Could not generate music, proceeding without it");
        }
      }

      // Attempt to insert with enhanced fields; if the remote DB hasn't been migrated yet,
      // fall back to the minimal schema so users can still publish.
      const fullPayload = {
        title: title.trim(),
        description: description.trim(),
        game_code: generatedCode,
        creator_id: user.id,
        is_multiplayer: isMultiplayer,
        multiplayer_type: isMultiplayer ? multiplayerType : null,
        graphics_quality: graphicsQuality,
        thumbnail_url: thumbnailUrl || null,
        cover_url: coverUrl || thumbnailUrl || null,
        sound_url: finalSoundUrl || null,
        country: userLocation.country,
        city: userLocation.city,
      } as any;

      let { error } = await supabase.from('games').insert(fullPayload);
      if (error) {
        // Retry with minimal set of columns expected to exist
        const minimalPayload = {
          title: title.trim(),
          description: description.trim(),
          game_code: generatedCode,
          creator_id: user.id,
          thumbnail_url: thumbnailUrl || null,
          sound_url: finalSoundUrl || null,
        };
        const retry = await supabase.from('games').insert(minimalPayload);
        if (retry.error) throw retry.error;
      }

      toast.success("Game published successfully!");
      navigate("/feed");
    } catch (error: any) {
      console.error('Publish error:', error);
      const message = typeof error?.message === 'string' ? error.message : 'Failed to publish game';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen pb-16 md:pt-16">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Create with AI</h1>
            <p className="text-muted-foreground">
              Describe your game idea and let AI bring it to life
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Panel */}
            <Card className="gradient-card border-border/50 p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Game Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A space shooter where you dodge asteroids and collect stars'"
                    className="min-h-32 mt-2"
                    disabled={isGenerating}
                    ref={promptRef}
                  />
                </div>

                {/* Visibility */}
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                    <Label htmlFor="isPublic" className="flex items-center gap-2">
                      {isPublic ? (<><Globe className="h-4 w-4" /> Public</>) : (<><Lock className="h-4 w-4" /> Private</>)}
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch id="isMultiplayer" checked={isMultiplayer} onCheckedChange={setIsMultiplayer} />
                    <Label htmlFor="isMultiplayer">Multiplayer</Label>
                  </div>
                  <div>
                    <Label className="mb-2 block">Multiplayer Type</Label>
                    <Select value={multiplayerType} onValueChange={setMultiplayerType} disabled={!isMultiplayer}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="co-op">Co-op</SelectItem>
                        <SelectItem value="versus">Versus</SelectItem>
                        <SelectItem value="turn-based">Turn-based</SelectItem>
                        <SelectItem value="real-time">Real-time</SelectItem>
                        <SelectItem value="party">Party</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Graphics Quality</Label>
                  <Select value={graphicsQuality} onValueChange={setGraphicsQuality}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Graphics" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                      <SelectItem value="realistic">Realistic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Thumbnail and cover URLs are auto-generated; inputs removed per requirements */}

                <div>
                  <Label htmlFor="title">Game Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Awesome Game"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your game"
                    className="mt-2"
                  />
                </div>

                {/* Custom Sound - button removed per request; keep optional URL */}
                <div className="grid gap-2">
                  <Label htmlFor="soundUrl">Custom Sound URL (optional)</Label>
                  <Input
                    id="soundUrl"
                    value={soundUrl}
                    onChange={(e) => setSoundUrl(e.target.value)}
                    placeholder="Paste an audio URL (mp3, wav, ogg)"
                  />
                  {soundUrl && (
                    <audio src={soundUrl} controls className="mt-2 w-full" />
                  )}
                </div>

                <Button
                  onClick={handleGenerate}
                  className="w-full gradient-primary glow-primary"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Game
                    </>
                  )}
                </Button>

                {generatedCode && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setPreviewOpen(true)} variant="secondary" className="w-full gap-2">
                      <Eye className="h-4 w-4" /> Preview
                    </Button>
                    <Button
                      onClick={handlePublish}
                      className="w-full"
                      variant="outline"
                    >
                      Publish to Feed
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Right column intentionally empty: preview moved to dialog */}
            <div className="hidden md:block"></div>
          </div>
        </div>
      </div>

      {/* Preview Dialog with curved 9:16 window */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Preview: {title || 'Untitled game'}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            <div className="aspect-[9/16] rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-border bg-background">
              {generatedCode ? (
                <iframe
                  srcDoc={generatedCode}
                  className="w-full h-full border-0"
                  title="Game Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No preview</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewOpen(false); promptRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit Prompt
            </Button>
            <Button onClick={() => { setPreviewOpen(false); handlePublish(); }} disabled={!generatedCode}>
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}