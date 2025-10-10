import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileExistsForUser } from "@/lib/profile";
import { Loader2, Sparkles, Music } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Create() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [soundUrl, setSoundUrl] = useState<string>("");
  const [soundUploading, setSoundUploading] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerType, setMultiplayerType] = useState<string>("co-op");
  const [graphicsQuality, setGraphicsQuality] = useState<string>("realistic");
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSoundFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select a valid audio file");
      return;
    }
    setSoundUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload sounds");
        return;
      }

      const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1) : 'mp3';
      const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
      const path = `${user.id}/${Date.now()}.${safeExt}`;
      // Use upsert=false to avoid 409 conflicts; ensure unique path via timestamp above
      const { error: uploadError } = await supabase.storage.from('sounds').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'audio/mpeg',
      });
      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('not found')) {
          toast.error("Sounds storage bucket 'sounds' is missing or not accessible. Make sure it's public.");
        }
        throw uploadError;
      }
      const { data } = supabase.storage.from('sounds').getPublicUrl(path);
      setSoundUrl(`${data.publicUrl}?v=${Date.now()}`);
      toast.success('Sound uploaded');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to upload sound');
    } finally {
      setSoundUploading(false);
    }
  };

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

      // Generate AI thumbnail in the background (no manual inputs shown)
      supabase.functions
        .invoke('generate-thumbnail', { body: { prompt } })
        .then((thumbnailResponse) => {
          if (thumbnailResponse.data?.thumbnailUrl) {
            setThumbnailUrl(thumbnailResponse.data.thumbnailUrl);
            setCoverUrl(thumbnailResponse.data.thumbnailUrl);
          }
        })
        .catch(() => {});
      
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

  // inlined earlier helper moved to lib/profile.ts

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
      await ensureProfileExistsForUser(supabase as any, user.id, baseUsername);

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
        sound_url: soundUrl || null,
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
          sound_url: soundUrl || null,
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

          <div className="grid md:grid-cols-1 gap-6">
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
                  />
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

                {/* Custom Sound */}
                <div className="grid gap-2">
                  <Label htmlFor="soundUrl">Custom Sound (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="soundUrl"
                      value={soundUrl}
                      onChange={(e) => setSoundUrl(e.target.value)}
                      placeholder="Paste an audio URL (mp3, wav, ogg)"
                    />
                    <div className="relative">
                      <Input id="soundFile" type="file" accept="audio/*" onChange={handleSoundFileChange} className="hidden" />
                      <Button asChild variant="outline" disabled={soundUploading}>
                        <label htmlFor="soundFile" className="cursor-pointer flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          {soundUploading ? 'Uploading...' : 'Upload'}
                        </label>
                      </Button>
                    </div>
                  </div>
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
                  <div className="flex gap-2">
                    <Button onClick={() => setPreviewOpen(true)} className="flex-1 gradient-primary glow-primary">
                      Preview (9:16)
                    </Button>
                    <Button onClick={handlePublish} className="flex-1" variant="outline">
                      Publish to Feed
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen 9:16 preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[420px] sm:max-w-[440px] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <div className="w-full aspect-[9/16] bg-background overflow-hidden rounded-xl border">
              {generatedCode ? (
                <iframe
                  srcDoc={generatedCode}
                  className="w-full h-full border-0"
                  title="Game Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Sparkles className="h-6 w-6 mr-2" /> Generate a game first
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}