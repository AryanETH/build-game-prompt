import { useEffect, useRef, useState } from "react";
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
import { Loader2, Sparkles, Globe, Lock, Eye, Pencil, Image as ImageIcon } from "lucide-react";
import { logActivity } from "@/lib/activityLogger";
import { playClick, playSuccess, playError } from "@/lib/sounds";

// Local fallback generator to ensure creation works even if the AI gateway is unavailable
const buildFallbackGameCode = (title: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title || "Arcade"}</title>
  <style>
    html,body{margin:0;height:100%;background:#0b1021;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto}
    #hud{position:fixed;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;align-items:center}
    #hud .pill{background:rgba(255,255,255,0.08);padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.15)}
    #overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;}
    #overlay .box{background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);padding:20px 24px;border-radius:16px;text-align:center;backdrop-filter:blur(6px)}
    canvas{display:block;margin:0 auto;touch-action:none}
    @media (max-width: 600px){#controls{position:fixed;bottom:16px;left:0;right:0;display:flex;justify-content:center;gap:12px}
      #controls button{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px}}
  </style>
</head>
<body>
  <div id="hud">
    <div class="pill">Score: <span id="score">0</span></div>
    <div class="pill">Lives: <span id="lives">3</span></div>
  </div>
  <div id="overlay"><div class="box">
    <h2 style="margin:0 0 8px">${title || "Arcade Runner"}</h2>
    <div style="opacity:.85; font-size:14px; line-height:1.4">Move with Arrow keys / WASD. Avoid enemies, collect stars.<br/>Tap to start on mobile.</div>
    <div style="margin-top:12px; opacity:.7; font-size:12px">Game lasts ~60s. Good luck!</div>
  </div></div>
  <canvas id="game" width="360" height="640"></canvas>
  <div id="controls" hidden>
    <button data-dx="-1">◀</button>
    <button data-dx="1">▶</button>
  </div>
  <script>
    const canvas=document.getElementById('game');
    const ctx=canvas.getContext('2d');
    const scoreEl=document.getElementById('score');
    const livesEl=document.getElementById('lives');
    const overlay=document.getElementById('overlay');
    const controls=document.getElementById('controls');
    let running=false, score=0, lives=3, t=0, keys={};
    const player={x:180,y:560,w:28,h:28,dx:0,speed:3,color:'#5eead4'};
    const stars=[], enemies=[];
    function rnd(min,max){return Math.random()*(max-min)+min}
    function rect(r,c){ctx.fillStyle=c;ctx.fillRect(r.x,r.y,r.w,r.h)}
    function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
    function spawnStar(){stars.push({x:rnd(12,348),y:-10,r:4+Math.random()*3,vy:1.2+Math.random()*1.5})}
    function spawnEnemy(){const w=20+Math.random()*26;enemies.push({x:rnd(0,360-w),y:-w,w,h:w,vy:1.2+Math.random()*2})}
    function reset(){score=0;lives=3;player.x=180;player.y=560;stars.length=0;enemies.length=0;t=0}
    function start(){reset();running=true;overlay.style.display='none'; if('ontouchstart' in window) controls.hidden=false}
    function end(){running=false;overlay.querySelector('.box').innerHTML='<h2 style="margin:0 0 8px">Game Over</h2><div style="opacity:.85">Score: '+score+'</div><div style="margin-top:12px; opacity:.7; font-size:12px">Press Space / Tap to restart</div>';overlay.style.display='flex'}
    addEventListener('keydown',e=>{keys[e.key]=true;if(!running&&(e.key===' '||e.key==='Enter'))start()});
    addEventListener('keyup',e=>{keys[e.key]=false});
    controls.addEventListener('touchstart',e=>{const b=e.target.closest('button');if(b){player.dx=parseInt(b.dataset.dx)}});
    controls.addEventListener('touchend',()=>{player.dx=0});
    function update(){
      if(!running){requestAnimationFrame(update);return}
      t++;
      ctx.clearRect(0,0,360,640);
      // background stars
      ctx.fillStyle='#0b1021';ctx.fillRect(0,0,360,640);
      for(let i=0;i<120;i++){const y=(i*6+t*0.6)%640;const x=(i*37%360);ctx.fillStyle='rgba(255,255,255,'+(0.1+(i%10)/30)+')';ctx.fillRect(x,y,2,2)}
      // input
      const left=keys['ArrowLeft']||keys['a']||player.dx<0;const right=keys['ArrowRight']||keys['d']||player.dx>0;
      player.x+= (right?1:0 - (left?1:0)) * player.speed; player.x=Math.max(0,Math.min(360-player.w,player.x));
      rect(player,player.color);
      // spawn
      if(t%45===0)spawnStar();
      if(t%60===0)spawnEnemy();
      // stars
      for(let i=stars.length-1;i>=0;i--){const s=stars[i];s.y+=s.vy;circle(s.x,s.y,s.r,'#fde047');
        if(Math.hypot(s.x-(player.x+player.w/2),s.y-(player.y+player.h/2))<s.r+14){score+=10;scoreEl.textContent=score;stars.splice(i,1)}
        else if(s.y>660)stars.splice(i,1)}
      // enemies
      for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.y+=e.vy;rect(e,'#fb7185');
        if(!(e.x>player.x+player.w||e.x+e.w<player.x||e.y>player.y+player.h||e.y+e.h<player.y)){lives--;livesEl.textContent=lives;enemies.splice(i,1);if(lives<=0)end()}
        else if(e.y>660)enemies.splice(i,1)}
      requestAnimationFrame(update)
    }
    update();
  </script>
</body>
</html>`;

export default function Create() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerType, setMultiplayerType] = useState<string>("co-op");
  const [graphicsQuality, setGraphicsQuality] = useState<string>("realistic");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();
  const [initializedFromRemix, setInitializedFromRemix] = useState(false);
  
  // Image Prompt feature (upload removed, only AI generation)
  const [useImagePrompt, setUseImagePrompt] = useState(false);
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState("");
  const [generatedInterfaceImage, setGeneratedInterfaceImage] = useState<string>("");

  // Sound URL input removed per product direction; audio may be auto-generated
  // If arriving via Remix, load base game code for editing
  useEffect(() => {
    if (initializedFromRemix) return;
    const params = new URLSearchParams(window.location.search);
    const remixId = params.get('remix');
    const prefillTitle = params.get('title');
    const prefillPrompt = params.get('prompt');
    if (!remixId) return;
    (async () => {
      const { data, error } = await supabase.from('games').select('*').eq('id', remixId).single();
      if (error || !data) return;
      setGeneratedCode(data.game_code || '');
      setThumbnailUrl(data.thumbnail_url || '');
      setCoverUrl(data.cover_url || data.thumbnail_url || '');
      setTitle(prefillTitle || `Remix: ${data.title}`);
      if (prefillPrompt) setPrompt(prefillPrompt);
      setInitializedFromRemix(true);
      toast.success('Loaded remix base. You can edit and publish.');
    })();
  }, [initializedFromRemix]);


  const handleGenerateInterfaceImage = async () => {
    if (!imageGenerationPrompt.trim()) {
      toast.error("Please enter an image description");
      return;
    }
    
    try {
      toast.info("Generating interface image...");
      const { data, error } = await supabase.functions.invoke('generate-interface-image', {
        body: { prompt: imageGenerationPrompt }
      });
      
      if (error) throw error;
      setGeneratedInterfaceImage(data.imageUrl);
      toast.success("Interface image generated!");
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error("Failed to generate image");
    }
  };

  const handleGenerate = async () => {
    playClick();
    if (!useImagePrompt && !prompt.trim()) {
      toast.error("Please enter a game prompt");
      return;
    }
    
    if (useImagePrompt && !generatedInterfaceImage) {
      toast.error("Please generate an interface image first");
      return;
    }

    setIsGenerating(true);
    
    // Log activity: user is creating a game
    await logActivity({ type: 'game_creating' });
    
    try {
      let finalPrompt = prompt;
      
      // If using image prompt, analyze the image and create prompt (fail-soft)
      if (useImagePrompt) {
        toast.info("Analyzing interface design...");
        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-interface', {
            body: { imageUrl: generatedInterfaceImage }
          });
          if (!analysisError && analysisData?.analysis) {
            finalPrompt = `${prompt}\n\nBased on this UI/UX design: ${analysisData.analysis}`;
          }
        } catch (_e) {
          console.log("Interface analysis unavailable, proceeding without it");
        }
      }
      
      // Generate game code (fallback to local template if AI gateway unavailable)
      let producedCode = "";
      try {
        const { data, error } = await supabase.functions.invoke('generate-game', {
          body: { 
            prompt: finalPrompt,
            options: {
              isMultiplayer,
              multiplayerType,
              graphicsQuality,
              isInterfaceDesign: useImagePrompt
            },
            title: title || prompt.slice(0, 50),
            description,
            autoInsert: false
          },
        });
        if (error) throw error;
        producedCode = data?.gameCode || "";
      } catch (_e) {
        producedCode = buildFallbackGameCode(title || 'Arcade');
        toast.info("Using fallback game template");
      }

      setGeneratedCode(producedCode);

      // Generate AI thumbnail automatically with strict 9:16
      toast.info("Generating thumbnail (9:16)...");
      const thumbnailResponse = await supabase.functions.invoke('generate-thumbnail', { body: { 
        prompt,
        metadata: {
          title: title || prompt.slice(0, 50),
          genre: isMultiplayer ? multiplayerType : 'single-player',
          colorPalette: graphicsQuality,
          tags: [graphicsQuality, isMultiplayer ? 'multiplayer' : 'solo']
        }
      } });
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
      playSuccess();
    } catch (error: any) {
      console.error('Generation error:', error);
      if (error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('402')) {
        toast.error("Please add credits to continue generating games.");
      } else {
        toast.error("Failed to generate game. Please try again.");
      }
      playError();
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
    playClick();
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

      // Auto-generate sound
      let finalSoundUrl = "";
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

      let { data: insertedGame, error } = await supabase.from('games').insert(fullPayload).select().single();
      if (error) {
        // Retry with minimal set of columns expected to exist
        const minimalPayload = {
          title: title.trim(),
          description: description.trim(),
          game_code: generatedCode,
          creator_id: user.id,
          thumbnail_url: thumbnailUrl || null,
        };
        const retry = await supabase.from('games').insert(minimalPayload).select().single();
        if (retry.error) throw retry.error;
        insertedGame = retry.data;
      }

      // Generate interface configuration and persist to game
      try {
        await supabase.functions.invoke('generate-interface', { body: { game_id: insertedGame.id, base: { palette: graphicsQuality === 'realistic' ? 'neon-dark' : 'bright' } } });
      } catch { /* fail-soft */ }

      // Regenerate thumbnail tied to game and persist cover/thumbnail URLs
      try {
        await supabase.functions.invoke('generate-thumbnail', { body: { 
          prompt: title.trim(), 
          game_id: insertedGame.id,
          metadata: {
            title: title.trim(),
            genre: isMultiplayer ? multiplayerType : 'single-player',
            colorPalette: graphicsQuality,
            tags: [graphicsQuality, isMultiplayer ? 'multiplayer' : 'solo']
          }
        } });
      } catch { /* fail-soft */ }

      // Log activity: game published
      if (insertedGame) {
        await logActivity({ 
          type: 'game_published', 
          gameId: insertedGame.id,
          metadata: { title: insertedGame.title }
        });
      }

      toast.success("Game published successfully!");
      playSuccess();
      navigate("/feed");
    } catch (error: any) {
      console.error('Publish error:', error);
      const message = typeof error?.message === 'string' ? error.message : 'Failed to publish game';
      toast.error(message);
      playError();
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
                {/* Image Prompt Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Image Prompt</p>
                      <p className="text-xs text-muted-foreground">Generate from UI design</p>
                    </div>
                  </div>
                  <Switch checked={useImagePrompt} onCheckedChange={setUseImagePrompt} />
                </div>

                {useImagePrompt && (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="imageGenPrompt">Describe Your Game Interface</Label>
                      <Textarea
                        id="imageGenPrompt"
                        value={imageGenerationPrompt}
                        onChange={(e) => setImageGenerationPrompt(e.target.value)}
                        placeholder="e.g., 'Modern mobile game UI with colorful buttons and score display in a 9:16 vertical layout'"
                        className="mt-2 min-h-24"
                      />
                      <Button
                        type="button"
                        onClick={handleGenerateInterfaceImage}
                        variant="secondary"
                        size="sm"
                        className="mt-3 w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Interface Design
                      </Button>
                      {generatedInterfaceImage && (
                        <div className="mt-3 p-2 border border-accent/30 rounded-lg">
                          <img src={generatedInterfaceImage} alt="Generated" className="w-full rounded-lg max-h-64 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="prompt">Game Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={useImagePrompt ? "Additional instructions (optional)" : "e.g., 'A space shooter where you dodge asteroids and collect stars'"}
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

                {/* Sound URL input removed */}

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