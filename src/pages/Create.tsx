// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Send, Music, Image as ImageIcon, Video,
  RefreshCw, Plus, X, Sparkles, Eye, MessageSquare,
  Loader2, Check, Play, Pause, Clock, Upload
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

const MUSIC_CATEGORIES = ["Suggested", "Action", "Indie", "Puzzle", "Arcade", "Simulation"];

// Placeholder suggested tracks
const SUGGESTED_TRACKS = [
  { id: "1", name: "Birthday", artist: "KP", duration: "3:35", emoji: "🎂" },
  { id: "2", name: "Sugars", artist: "Maroon 6", duration: "3:55", emoji: "💕" },
  { id: "3", name: "28K Magic", artist: "Bruno Mars", duration: "3:45", emoji: "✨" },
  { id: "4", name: "Pixel Dreams", artist: "Synthwave", duration: "4:12", emoji: "🎮" },
  { id: "5", name: "Neon Rush", artist: "Arcade FM", duration: "2:58", emoji: "🌃" },
];

export default function Create() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hey, I'm excited to help you create!",
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
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const [musicCategory, setMusicCategory] = useState("Suggested");
  const [isPublishing, setIsPublishing] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback((role: "ai" | "user", content: string, type?: ChatMessage["type"]) => {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role, content, type: type || "text", timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  const updateMessage = useCallback((id: string, content: string, type?: ChatMessage["type"]) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content, ...(type ? { type } : {}) } : m)));
  }, []);

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
          body: JSON.stringify({ prompt: userPrompt, imagineOnly: true, options: { gameEngine: "vanilla", graphicsQuality: "stylized" } }),
        }
      );
      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
        if (response.status === 402) throw new Error("Usage limit reached. Add credits in workspace settings.");
        throw new Error("Failed to improve prompt");
      }
      const data = await response.json();
      const improved = data.gameDescription || userPrompt;
      setGameTitle(data.suggestedTitle || userPrompt.slice(0, 50));
      setGameDescription(improved);
      updateMessage(improvingId, improved.length > 300 ? improved.slice(0, 300) + "...\n\nReady to generate! Just say \"generate\" or tap the button below." : improved + "\n\nWhat do you think? Say \"generate\" when ready!", "improved-prompt");
      return improved;
    } catch (err: any) {
      updateMessage(improvingId, `⚠️ ${err.message || "Couldn't improve prompt."}`);
      return userPrompt;
    } finally {
      setIsImproving(false);
    }
  };

  const generateGame = async (prompt: string) => {
    setIsGenerating(true);
    const genId = addMessage("ai", "Building your experience... ✨", "generating");
    try {
      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: { prompt, options: { gameEngine: "vanilla", graphicsQuality: "stylized" }, title: gameTitle || prompt.slice(0, 50), description: gameDescription || prompt, autoInsert: false },
      });
      if (error) throw error;
      let code = data?.gameCode || "";
      if (!code) throw new Error("No game code returned");
      if (attachments.length > 0) {
        const assetScript = buildAssetInjectionScript();
        code = code.replace("</head>", `${assetScript}\n</head>`);
      }
      setGeneratedCode(code);
      if (!gameTitle) setGameTitle(prompt.slice(0, 50));
      if (!gameDescription) setGameDescription(`AI-generated: ${prompt}`);
      updateMessage(genId, "Your experience is ready! 🎮\nSwitch to Preview to try it, or tap Post to share.", "preview-ready");
      playSuccess();
    } catch (err: any) {
      if (err.message?.includes("429") || err.context?.status === 429) {
        updateMessage(genId, "Rate limit hit. Wait a moment and try again.");
        setIsGenerating(false);
        return;
      }
      updateMessage(genId, "Used a template — AI was unavailable.");
      setGeneratedCode(buildFallbackGameCode(gameTitle || "Arcade"));
      playError();
    } finally {
      setIsGenerating(false);
    }
  };

  const buildAssetInjectionScript = () => {
    const m = attachments.filter((a) => a.type === "music");
    const img = attachments.filter((a) => a.type === "image");
    let s = "<script>window.__OPLUS_ASSETS__={";
    if (m.length) s += `music:${JSON.stringify(m.map((a) => ({ name: a.name, url: a.url })))},`;
    if (img.length) s += `images:${JSON.stringify(img.map((a) => ({ name: a.name, url: a.url })))},`;
    return s + "};</script>";
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isGenerating || isImproving) return;
    playClick();
    addMessage("user", text);
    setInputText("");
    if (/^(generate|build|create it|make it|go|do it|start building)/i.test(text) && gameDescription) {
      await generateGame(gameDescription);
    } else {
      await improvePrompt(text);
    }
  };

  const handleRegenerate = async () => {
    if (!gameDescription || isGenerating) return;
    playClick();
    await generateGame(gameDescription);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: MediaAttachment["type"]) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, file, url, name: file.name }]);
      addMessage("user", `📎 ${file.name}`);
      addMessage("ai", `Got it! I'll include this ${type} in your creation.`);
    }
    e.target.value = "";
    setShowAttachOptions(false);
    setShowMusicPanel(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => { const a = prev.find((x) => x.id === id); if (a) URL.revokeObjectURL(a.url); return prev.filter((x) => x.id !== id); });
  };

  const handlePublish = async () => {
    if (!generatedCode || !gameTitle.trim()) { toast.error("Generate something first"); return; }
    setIsPublishing(true);
    playClick();
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) { toast.error("Please sign in to publish"); setIsPublishing(false); return; }
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
      if (!profile) await supabase.from("profiles").insert({ id: userId, username: `user_${userId.slice(0, 8)}` });
      let thumbnailUrl: string | null = null;
      const imageAtt = attachments.find((a) => a.type === "image");
      if (imageAtt) {
        const path = `public/${userId}/${Date.now()}.${imageAtt.file.name.split(".").pop() || "png"}`;
        const { error: ue } = await supabase.storage.from("avatars").upload(path, imageAtt.file);
        if (!ue) { const { data: u } = supabase.storage.from("avatars").getPublicUrl(path); thumbnailUrl = u.publicUrl; }
      }
      const { data: game, error } = await supabase.from("games").insert({ title: gameTitle.trim(), description: gameDescription.trim().slice(0, 500), game_code: generatedCode, creator_id: userId, thumbnail_url: thumbnailUrl }).select().single();
      if (error) throw error;
      await logActivity({ type: "game_published", gameId: game.id, metadata: { title: game.title } });
      toast.success("Published! 🎉");
      playSuccess();
      navigate("/feed");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
      playError();
    } finally {
      setIsPublishing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[hsl(0,0%,0%)]">
      {/* ───── Header ───── */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-[hsl(0,0%,14%)] flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-[hsl(0,0%,100%)]" />
          </button>
          <button className="w-9 h-9 rounded-full bg-[hsl(0,0%,14%)] flex items-center justify-center">
            <Clock className="w-4 h-4 text-[hsl(0,0%,100%)]" />
          </button>
        </div>

        {/* Tabs pill */}
        <div className="flex items-center bg-[hsl(0,0%,14%)] rounded-full p-[3px]">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "px-5 py-1.5 text-[13px] font-semibold rounded-full transition-all",
              activeTab === "chat" ? "bg-[hsl(0,0%,22%)] text-[hsl(0,0%,100%)]" : "text-[hsl(0,0%,50%)]"
            )}
          >Chat</button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-5 py-1.5 text-[13px] font-semibold rounded-full transition-all",
              activeTab === "preview" ? "bg-[hsl(0,0%,22%)] text-[hsl(0,0%,100%)]" : "text-[hsl(0,0%,50%)]"
            )}
          >Preview</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleRegenerate} disabled={isGenerating || !generatedCode} className="w-9 h-9 rounded-full bg-[hsl(0,0%,14%)] flex items-center justify-center disabled:opacity-30">
            <RefreshCw className={cn("w-4 h-4 text-[hsl(0,0%,100%)]", isGenerating && "animate-spin")} />
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !generatedCode}
            className="h-9 px-4 rounded-full bg-[hsl(0,0%,100%)] text-[hsl(0,0%,0%)] text-[13px] font-bold disabled:opacity-30 flex items-center gap-1.5"
          >
            {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post"}
          </button>
        </div>
      </header>

      {/* ───── Chat Tab ───── */}
      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "ai" ? (
                  <div className={cn(msg.type === "generating" && "animate-pulse")}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌍</span>
                      <span className="text-[13px] font-semibold text-[hsl(0,0%,60%)]">Oplus AI</span>
                    </div>
                    <p className="text-[22px] font-semibold leading-[1.3] text-[hsl(0,0%,100%)]">
                      {msg.content.split("\n").map((line, i) => (
                        <span key={i}>
                          {i > 0 && <br />}
                          {line}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-[hsl(0,0%,92%)] text-[hsl(0,0%,7%)] rounded-2xl rounded-br-md px-5 py-3.5 max-w-[85%]">
                      <p className="text-[15px] leading-relaxed font-medium">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Quick generate button */}
            {gameDescription && !generatedCode && !isGenerating && !isImproving && (
              <div className="flex justify-start">
                <button
                  onClick={() => generateGame(gameDescription)}
                  className="flex items-center gap-2 bg-[hsl(262,83%,58%)] text-[hsl(0,0%,100%)] rounded-full px-5 py-2.5 text-[14px] font-semibold active:scale-95 transition-transform"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Now
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Attachments strip */}
          {attachments.length > 0 && (
            <div className="flex-shrink-0 px-5 py-2 border-t border-[hsl(0,0%,12%)]">
              <div className="flex gap-2 overflow-x-auto">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 bg-[hsl(0,0%,12%)] rounded-full pl-3 pr-1.5 py-1 text-[12px] text-[hsl(0,0%,80%)] shrink-0">
                    {att.type === "music" && <Music className="w-3 h-3 text-[hsl(262,83%,58%)]" />}
                    {att.type === "image" && <ImageIcon className="w-3 h-3 text-[hsl(262,83%,58%)]" />}
                    {att.type === "video" && <Video className="w-3 h-3 text-[hsl(262,83%,58%)]" />}
                    <span className="max-w-[80px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="p-0.5 rounded-full hover:bg-[hsl(0,0%,20%)]">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-[hsl(0,0%,10%)]">
            <div className="flex items-end gap-2.5">
              <div className="relative">
                <button
                  onClick={() => { setShowAttachOptions(!showAttachOptions); setShowMusicPanel(false); }}
                  className="w-10 h-10 rounded-full bg-[hsl(0,0%,12%)] flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-5 h-5 text-[hsl(0,0%,70%)]" />
                </button>
                {showAttachOptions && (
                  <div className="absolute bottom-14 left-0 bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)] rounded-2xl p-1.5 min-w-[170px] z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <button onClick={() => { setShowMusicPanel(true); setShowAttachOptions(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(0,0%,16%)] w-full transition-colors">
                      <Music className="w-4 h-4 text-[hsl(262,83%,68%)]" /><span className="text-[13px] font-medium text-[hsl(0,0%,90%)]">Add Music</span>
                    </button>
                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(0,0%,16%)] cursor-pointer transition-colors">
                      <ImageIcon className="w-4 h-4 text-[hsl(262,83%,68%)]" /><span className="text-[13px] font-medium text-[hsl(0,0%,90%)]">Add Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
                    </label>
                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(0,0%,16%)] cursor-pointer transition-colors">
                      <Video className="w-4 h-4 text-[hsl(262,83%,68%)]" /><span className="text-[13px] font-medium text-[hsl(0,0%,90%)]">Add Video</span>
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, "video")} />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={gameDescription ? 'Say "generate" to build...' : "Describe your game or app..."}
                  rows={1}
                  className="w-full resize-none bg-[hsl(0,0%,12%)] rounded-2xl px-4 py-3 text-[14px] text-[hsl(0,0%,100%)] placeholder:text-[hsl(0,0%,40%)] focus:outline-none focus:ring-1 focus:ring-[hsl(262,83%,58%)/0.5] max-h-28"
                  style={{ minHeight: 44 }}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 112) + "px"; }}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isGenerating || isImproving}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                  inputText.trim() ? "bg-[hsl(262,83%,58%)] text-[hsl(0,0%,100%)]" : "bg-[hsl(0,0%,12%)] text-[hsl(0,0%,40%)]"
                )}
              >
                {isGenerating || isImproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ───── Music Panel (Sekai-style bottom sheet) ───── */}
          {showMusicPanel && (
            <>
              <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowMusicPanel(false)} />
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(0,0%,8%)] rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[55vh] flex flex-col">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-[hsl(0,0%,25%)]" />
                </div>

                <h3 className="text-center text-[16px] font-bold text-[hsl(0,0%,100%)] pb-3">Add Music</h3>

                {/* Category tabs */}
                <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
                  {MUSIC_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMusicCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors",
                        musicCategory === cat
                          ? "text-[hsl(0,0%,100%)] border-b-2 border-[hsl(0,0%,100%)]"
                          : "text-[hsl(0,0%,45%)]"
                      )}
                    >{cat}</button>
                  ))}
                </div>

                {/* Track list */}
                <div className="flex-1 overflow-y-auto px-4 pb-6">
                  {SUGGESTED_TRACKS.map((track) => (
                    <div key={track.id} className="flex items-center gap-3 py-3 border-b border-[hsl(0,0%,12%)] last:border-0">
                      <div className="w-12 h-12 rounded-xl bg-[hsl(0,0%,15%)] flex items-center justify-center text-xl">{track.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[hsl(0,0%,100%)] truncate">{track.name}</p>
                        <p className="text-[12px] text-[hsl(0,0%,50%)]">{track.artist}</p>
                      </div>
                      <span className="text-[12px] text-[hsl(0,0%,45%)] mr-1">{track.duration}</span>
                      <button className="w-8 h-8 rounded-full bg-[hsl(0,0%,18%)] flex items-center justify-center">
                        <Plus className="w-4 h-4 text-[hsl(0,0%,70%)]" />
                      </button>
                      <button
                        onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}
                        className="w-8 h-8 rounded-full bg-[hsl(0,0%,18%)] flex items-center justify-center"
                      >
                        {playingTrack === track.id ? <Pause className="w-4 h-4 text-[hsl(0,0%,70%)]" /> : <Play className="w-4 h-4 text-[hsl(0,0%,70%)]" />}
                      </button>
                    </div>
                  ))}

                  {/* Upload own */}
                  <label className="flex items-center gap-3 py-3 cursor-pointer">
                    <div className="w-12 h-12 rounded-xl border border-dashed border-[hsl(0,0%,25%)] flex items-center justify-center">
                      <Upload className="w-5 h-5 text-[hsl(0,0%,40%)]" />
                    </div>
                    <span className="text-[14px] text-[hsl(0,0%,50%)]">Upload your own</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileSelect(e, "music")} />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ───── Preview Tab ───── */
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {generatedCode ? (
            <div className="w-full max-w-[360px] mx-auto flex-1 flex flex-col">
              <div className="relative flex-1 rounded-[2rem] overflow-hidden border border-[hsl(0,0%,15%)] shadow-2xl bg-black">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-10" />
                <iframe ref={iframeRef} srcDoc={generatedCode} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Preview" style={{ minHeight: "calc(100dvh - 180px)" }} />
              </div>
              <div className="flex gap-3 mt-4 justify-center">
                <button onClick={handleRegenerate} disabled={isGenerating} className="flex items-center gap-2 h-10 px-5 rounded-full bg-[hsl(0,0%,12%)] text-[hsl(0,0%,80%)] text-[13px] font-semibold disabled:opacity-30">
                  <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} /> Regenerate
                </button>
                <button onClick={handlePublish} disabled={isPublishing} className="flex items-center gap-2 h-10 px-5 rounded-full bg-[hsl(0,0%,100%)] text-[hsl(0,0%,0%)] text-[13px] font-bold disabled:opacity-30">
                  {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Publish
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-[hsl(0,0%,10%)] flex items-center justify-center">
                <Eye className="w-8 h-8 text-[hsl(0,0%,35%)]" />
              </div>
              <p className="text-[hsl(0,0%,100%)] font-semibold">No preview yet</p>
              <p className="text-[13px] text-[hsl(0,0%,45%)]">Go to Chat and describe what you want to create</p>
              <button onClick={() => setActiveTab("chat")} className="text-[13px] text-[hsl(262,83%,68%)] font-semibold">
                ← Back to Chat
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click-away overlays */}
      {showAttachOptions && <div className="fixed inset-0 z-20" onClick={() => setShowAttachOptions(false)} />}
    </div>
  );
}
