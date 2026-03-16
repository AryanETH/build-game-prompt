// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Send, Paperclip, Music, Image as ImageIcon, Video,
  RefreshCw, Upload, Play, Pause, Plus, X, Sparkles, Eye, MessageSquare,
  Loader2, ChevronDown, Check
} from "lucide-react";
import { logActivity } from "@/lib/activityLogger";
import { playClick, playSuccess, playError } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  type?: "text" | "generating" | "preview-ready" | "improved-prompt";
  timestamp: Date;
}

interface MediaAttachment {
  id: string;
  type: "music" | "image" | "video";
  file: File;
  url: string;
  name: string;
}

// Fallback game code
const buildFallbackGameCode = (title: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>html,body{margin:0;height:100%;background:#0b1021;color:#fff;font-family:system-ui}
canvas{display:block;margin:0 auto;touch-action:none}
#overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
#overlay .box{background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.2);padding:24px;border-radius:16px;text-align:center;backdrop-filter:blur(6px)}
#hud{position:fixed;top:10px;left:10px;right:10px;display:flex;justify-content:space-between}
#hud .pill{background:rgba(255,255,255,.08);padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.15);font-size:14px}
</style></head><body>
<div id="hud"><div class="pill">Score: <span id="score">0</span></div><div class="pill">Lives: <span id="lives">3</span></div></div>
<div id="overlay"><div class="box"><h2>${title}</h2><p style="opacity:.8;font-size:14px">Tap or press Space to start</p></div></div>
<canvas id="game" width="360" height="640"></canvas>
<script>
const c=document.getElementById('game'),x=c.getContext('2d'),o=document.getElementById('overlay');
let run=false,sc=0,lv=3,t=0,k={},p={x:180,y:560,w:28,h:28,s:3};
const stars=[],enemies=[];
function rnd(a,b){return Math.random()*(b-a)+a}
function start(){sc=0;lv=3;p.x=180;stars.length=0;enemies.length=0;t=0;run=true;o.style.display='none'}
addEventListener('keydown',e=>{k[e.key]=true;if(!run)start()});
addEventListener('keyup',e=>{k[e.key]=false});
o.addEventListener('click',()=>{if(!run)start()});
function loop(){if(!run){requestAnimationFrame(loop);return}t++;
x.fillStyle='#0b1021';x.fillRect(0,0,360,640);
for(let i=0;i<80;i++){let y=(i*8+t*.5)%640,px=i*47%360;x.fillStyle='rgba(255,255,255,'+(0.1+i%10/30)+')';x.fillRect(px,y,1.5,1.5)}
let l=k.ArrowLeft||k.a,r=k.ArrowRight||k.d;
p.x+=(r?1:0-(l?1:0))*p.s;p.x=Math.max(0,Math.min(332,p.x));
x.fillStyle='#5eead4';x.fillRect(p.x,p.y,p.w,p.h);
if(t%50===0)stars.push({x:rnd(10,350),y:-8,r:4,vy:1.5+Math.random()});
if(t%70===0){let w=20+Math.random()*20;enemies.push({x:rnd(0,340),y:-w,w,h:w,vy:1.5+Math.random()*1.5})}
for(let i=stars.length-1;i>=0;i--){let s=stars[i];s.y+=s.vy;x.fillStyle='#fde047';x.beginPath();x.arc(s.x,s.y,s.r,0,Math.PI*2);x.fill();
if(Math.hypot(s.x-p.x-14,s.y-p.y-14)<18){sc+=10;document.getElementById('score').textContent=sc;stars.splice(i,1)}
else if(s.y>650)stars.splice(i,1)}
for(let i=enemies.length-1;i>=0;i--){let e=enemies[i];e.y+=e.vy;x.fillStyle='#fb7185';x.fillRect(e.x,e.y,e.w,e.h);
if(!(e.x>p.x+p.w||e.x+e.w<p.x||e.y>p.y+p.h||e.y+e.h<p.y)){lv--;document.getElementById('lives').textContent=lv;enemies.splice(i,1);if(lv<=0){run=false;o.querySelector('.box').innerHTML='<h2>Game Over</h2><p>Score: '+sc+'</p><p style="opacity:.7;font-size:13px">Tap to restart</p>';o.style.display='flex'}}
else if(e.y>650)enemies.splice(i,1)}
requestAnimationFrame(loop)}loop();
</script></body></html>`;

export default function Create() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hey! 👋 I'm your creative AI assistant. Tell me what you'd like to create — a game, mini app, interactive card, or anything else. You can also attach music, images, or videos as assets!",
      type: "text",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback((role: "ai" | "user", content: string, type?: ChatMessage["type"]) => {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      type: type || "text",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  const updateMessage = useCallback((id: string, content: string, type?: ChatMessage["type"]) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, ...(type ? { type } : {}) } : m))
    );
  }, []);

  // Improve prompt via AI
  const improvePrompt = async (userPrompt: string): Promise<string> => {
    setIsImproving(true);
    const improvingId = addMessage("ai", "✨ Improving your prompt...", "generating");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({
            prompt: userPrompt,
            imagineOnly: true,
            options: { gameEngine: "vanilla", graphicsQuality: "stylized" },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
        if (response.status === 402) throw new Error("Usage limit reached. Add credits in workspace settings.");
        throw new Error("Failed to improve prompt");
      }

      const data = await response.json();
      const improved = data.gameDescription || userPrompt;
      const suggestedTitle = data.suggestedTitle || userPrompt.slice(0, 50);

      setGameTitle(suggestedTitle);
      setGameDescription(improved);

      updateMessage(
        improvingId,
        `🎯 **Enhanced concept:**\n\n${improved.slice(0, 600)}${improved.length > 600 ? "..." : ""}\n\n*Ready to generate! Tap the ✨ button or say "generate" to build it.*`,
        "improved-prompt"
      );

      return improved;
    } catch (err: any) {
      updateMessage(improvingId, `⚠️ ${err.message || "Couldn't improve prompt. Using your original."}`);
      return userPrompt;
    } finally {
      setIsImproving(false);
    }
  };

  // Generate game
  const generateGame = async (prompt: string) => {
    setIsGenerating(true);
    const genId = addMessage("ai", "🔨 Building your experience... This may take a moment.", "generating");

    try {
      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: {
          prompt,
          options: { gameEngine: "vanilla", graphicsQuality: "stylized" },
          title: gameTitle || prompt.slice(0, 50),
          description: gameDescription || prompt,
          autoInsert: false,
        },
      });

      if (error) throw error;

      let code = data?.gameCode || "";
      if (!code) throw new Error("No game code returned");

      // Inject attached assets into the game code
      if (attachments.length > 0) {
        const assetScript = buildAssetInjectionScript();
        code = code.replace("</head>", `${assetScript}\n</head>`);
      }

      setGeneratedCode(code);
      if (!gameTitle) setGameTitle(prompt.slice(0, 50));
      if (!gameDescription) setGameDescription(`AI-generated: ${prompt}`);

      updateMessage(
        genId,
        "🎮 **Your experience is ready!** Switch to the Preview tab to try it out, or tap **Publish** to share it.",
        "preview-ready"
      );

      playSuccess();
    } catch (err: any) {
      console.error("Generation error:", err);

      if (err.message?.includes("402") || err.context?.status === 402) {
        updateMessage(genId, "💳 Usage limit reached. Add credits in your workspace settings. Using fallback template.");
      } else if (err.message?.includes("429") || err.context?.status === 429) {
        updateMessage(genId, "⏱️ Rate limit hit. Wait a moment and try again.");
        setIsGenerating(false);
        return;
      } else {
        updateMessage(genId, "⚠️ AI generation unavailable. Built a template game for you instead!");
      }

      const fallback = buildFallbackGameCode(gameTitle || "Arcade");
      setGeneratedCode(fallback);
      playError();
    } finally {
      setIsGenerating(false);
    }
  };

  // Build script to inject attachments into game
  const buildAssetInjectionScript = () => {
    const musicAttachments = attachments.filter((a) => a.type === "music");
    const imageAttachments = attachments.filter((a) => a.type === "image");

    let script = "<script>window.__OPLUS_ASSETS__ = {";
    if (musicAttachments.length > 0) {
      script += `music: ${JSON.stringify(musicAttachments.map((a) => ({ name: a.name, url: a.url })))},`;
    }
    if (imageAttachments.length > 0) {
      script += `images: ${JSON.stringify(imageAttachments.map((a) => ({ name: a.name, url: a.url })))},`;
    }
    script += "};</script>";
    return script;
  };

  // Handle send
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isGenerating || isImproving) return;

    playClick();
    addMessage("user", text);
    setInputText("");

    // Check if user wants to generate
    const isGenerateCommand =
      /^(generate|build|create|make|go|do it|start)/i.test(text) && gameDescription;

    if (isGenerateCommand) {
      await generateGame(gameDescription);
    } else {
      // Improve the prompt first
      const improved = await improvePrompt(text);
      // Don't auto-generate, let user confirm
    }
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!gameDescription || isGenerating) return;
    playClick();
    addMessage("user", "🔄 Regenerate");
    await generateGame(gameDescription);
  };

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: MediaAttachment["type"]) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const attachment: MediaAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        file,
        url,
        name: file.name,
      };
      setAttachments((prev) => [...prev, attachment]);
      addMessage("user", `📎 Attached ${type}: **${file.name}**`);
      addMessage("ai", `Got it! I'll use this ${type} as an asset in your creation. Keep adding more or describe what you'd like to build.`);
    }

    e.target.value = "";
    setShowAttachPanel(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  // Publish
  const handlePublish = async () => {
    if (!generatedCode || !gameTitle.trim()) {
      toast.error("Generate an experience first");
      return;
    }

    setIsPublishing(true);
    playClick();

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) {
        toast.error("Please sign in to publish");
        setIsPublishing(false);
        return;
      }

      // Ensure profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        await supabase.from("profiles").insert({
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
        });
      }

      // Upload attached media to storage
      let thumbnailUrl: string | null = null;
      const imageAtt = attachments.find((a) => a.type === "image");
      if (imageAtt) {
        const ext = imageAtt.file.name.split(".").pop() || "png";
        const path = `public/${userId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, imageAtt.file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          thumbnailUrl = urlData.publicUrl;
        }
      }

      const { data: insertedGame, error } = await supabase
        .from("games")
        .insert({
          title: gameTitle.trim(),
          description: gameDescription.trim().slice(0, 500),
          game_code: generatedCode,
          creator_id: userId,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (error) throw error;

      await logActivity({ type: "game_published", gameId: insertedGame.id, metadata: { title: insertedGame.title } });

      toast.success("Published! 🎉");
      playSuccess();
      navigate("/feed");
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(err.message || "Failed to publish");
      playError();
    } finally {
      setIsPublishing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Instantly</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-muted rounded-full p-0.5">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
              activeTab === "chat"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
              activeTab === "preview"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            Preview
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {generatedCode && (
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <RefreshCw className={cn("w-5 h-5 text-foreground", isGenerating && "animate-spin")} />
            </button>
          )}
          {generatedCode && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
              className="rounded-full text-xs font-semibold px-4"
            >
              {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publish"}
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                    msg.type === "generating" && "animate-pulse"
                  )}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                      {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={j} className="font-semibold">
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Attachments bar */}
          {attachments.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-border/30 bg-card/50">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 bg-muted rounded-full pl-3 pr-1 py-1 text-xs text-foreground shrink-0"
                  >
                    {att.type === "music" && <Music className="w-3 h-3 text-primary" />}
                    {att.type === "image" && <ImageIcon className="w-3 h-3 text-primary" />}
                    {att.type === "video" && <Video className="w-3 h-3 text-primary" />}
                    <span className="max-w-[100px] truncate">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 rounded-full hover:bg-background/50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-border/30 bg-card/80 backdrop-blur-xl">
            <div className="flex items-end gap-2">
              {/* Attach button */}
              <div className="relative">
                <button
                  onClick={() => setShowAttachPanel(!showAttachPanel)}
                  className="p-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Plus className="w-5 h-5 text-foreground" />
                </button>

                {/* Attach dropdown */}
                {showAttachPanel && (
                  <div className="absolute bottom-14 left-0 bg-card border border-border rounded-2xl shadow-lg p-2 min-w-[180px] z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors">
                      <Music className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Add Music</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, "music")}
                      />
                    </label>
                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, "image")}
                      />
                    </label>
                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors">
                      <Video className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Add Video</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, "video")}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    gameDescription
                      ? 'Say "generate" to build, or refine your idea...'
                      : "Describe your game or app idea..."
                  }
                  rows={1}
                  className="w-full resize-none bg-muted rounded-2xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-32 overflow-y-auto"
                  style={{ minHeight: 44 }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = Math.min(target.scrollHeight, 128) + "px";
                  }}
                />
              </div>

              {/* Send / Generate */}
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isGenerating || isImproving}
                className={cn(
                  "p-2.5 rounded-full transition-all",
                  inputText.trim()
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isGenerating || isImproving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Quick actions */}
            {gameDescription && !generatedCode && !isGenerating && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => generateGame(gameDescription)}
                  className="rounded-full text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Now
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Preview Tab */
        <div className="flex-1 flex flex-col items-center justify-center bg-background p-4">
          {generatedCode ? (
            <div className="w-full max-w-[360px] mx-auto flex-1 flex flex-col">
              <div className="relative flex-1 rounded-3xl overflow-hidden border-2 border-border/50 shadow-xl bg-black">
                {/* Phone frame notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
                <iframe
                  ref={iframeRef}
                  srcDoc={generatedCode}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Game Preview"
                  style={{ minHeight: "calc(100dvh - 200px)" }}
                />
              </div>
              <div className="flex gap-3 mt-4 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="rounded-full text-xs gap-1.5"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="rounded-full text-xs gap-1.5"
                >
                  {isPublishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Publish
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <Eye className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground font-semibold">No preview yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Switch to Chat and describe what you want to create
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("chat")}
                className="rounded-full text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Go to Chat
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Click-away for attach panel */}
      {showAttachPanel && (
        <div className="fixed inset-0 z-10" onClick={() => setShowAttachPanel(false)} />
      )}
    </div>
  );
}
