import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, Sparkles, Globe, Lock, Eye, Pencil, Image as ImageIcon, Wand2, Gamepad2, Users, Volume2, Construction, DollarSign, Heart, QrCode, Smartphone, MessageSquare, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { logActivity } from "@/lib/activityLogger";
import { playClick, playSuccess, playError } from "@/lib/sounds";
import QRCode from "qrcode";

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
    #audio-controls{position:fixed;bottom:10px;right:10px;display:flex;gap:8px;z-index:100}
    #audio-controls button{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    #audio-controls button:hover{background:rgba(255,255,255,0.15)}
    #voice-chat{position:fixed;bottom:10px;left:10px;z-index:100;display:flex;align-items:center;gap:8px}
    #voice-chat button{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:14px;cursor:pointer}
    #voice-chat button.active{background:rgba(255,0,0,0.3);border-color:rgba(255,0,0,0.5)}
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
  
  <!-- Audio Controls -->
  <div id="audio-controls">
    <button id="music-toggle">♫</button>
  </div>
  
  <!-- Voice Chat -->
  <div id="voice-chat">
    <button id="mic-toggle">🎤</button>
  </div>
  
  <script>
    // Game variables
    const canvas=document.getElementById('game');
    const ctx=canvas.getContext('2d');
    const scoreEl=document.getElementById('score');
    const livesEl=document.getElementById('lives');
    const overlay=document.getElementById('overlay');
    const controls=document.getElementById('controls');
    let running=false, score=0, lives=3, t=0, keys={};
    const player={x:180,y:560,w:28,h:28,dx:0,speed:3,color:'#5eead4'};
    const stars=[], enemies=[];
    
    // Audio system
    let audioContext = null;
    let backgroundMusic = null;
    let musicGain = null;
    let soundEffects = {};
    let isMusicPlaying = false;
    let isMicActive = false;
    
    // Initialize audio
    function initAudio() {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain node for music volume control
        musicGain = audioContext.createGain();
        musicGain.gain.value = 0.4; // Default volume 40%
        musicGain.connect(audioContext.destination);
        
        // Create background music (simple synth)
        createBackgroundMusic();
        
        // Create sound effects
        createSoundEffects();
        
        // Setup audio controls
        document.getElementById('music-toggle').addEventListener('click', toggleMusic);
        document.getElementById('mic-toggle').addEventListener('click', toggleMic);
      } catch(e) {
        console.error("Web Audio API not supported:", e);
      }
    }
    
    // Create background music
    function createBackgroundMusic() {
      if (!audioContext) return;
      
      const oscillator = audioContext.createOscillator();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      
      // Setup LFO for subtle pitch modulation
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      // Setup main oscillator
      oscillator.type = 'sine';
      oscillator.frequency.value = 220; // A3
      
      // Connect to gain node
      oscillator.connect(musicGain);
      
      // Start oscillators
      lfo.start();
      oscillator.start();
      
      backgroundMusic = oscillator;
      
      // Initially muted
      musicGain.gain.value = 0;
    }
    
    // Create sound effects
    function createSoundEffects() {
      if (!audioContext) return;
      
      // Collect star sound
      soundEffects.collect = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.frequency.value = 880;
        osc.type = 'sine';
        
        gain.gain.value = 0.1;
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.1);
        
        // Pitch up
        osc.frequency.linearRampToValueAtTime(1320, audioContext.currentTime + 0.1);
      };
      
      // Hit enemy sound
      soundEffects.hit = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.frequency.value = 220;
        osc.type = 'sawtooth';
        
        gain.gain.value = 0.1;
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.2);
        
        // Pitch down
        osc.frequency.linearRampToValueAtTime(110, audioContext.currentTime + 0.2);
      };
    }
    
    // Toggle background music
    function toggleMusic() {
      if (!audioContext) return;
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      isMusicPlaying = !isMusicPlaying;
      
      if (isMusicPlaying) {
        musicGain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.5);
        document.getElementById('music-toggle').textContent = '♫';
        document.getElementById('music-toggle').style.background = 'rgba(0,255,0,0.1)';
      } else {
        musicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        document.getElementById('music-toggle').textContent = '♫';
        document.getElementById('music-toggle').style.background = 'rgba(255,255,255,0.08)';
      }
    }
    
    // Toggle microphone
    function toggleMic() {
      isMicActive = !isMicActive;
      
      if (isMicActive) {
        document.getElementById('mic-toggle').classList.add('active');
        
        // Reduce music volume when mic is active
        if (isMusicPlaying) {
          musicGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.3);
        }
        
        // Request microphone access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              // Microphone is now active
              console.log("Microphone activated");
            })
            .catch(err => {
              console.error("Error accessing microphone:", err);
              isMicActive = false;
              document.getElementById('mic-toggle').classList.remove('active');
            });
        }
      } else {
        document.getElementById('mic-toggle').classList.remove('active');
        
        // Restore music volume when mic is inactive
        if (isMusicPlaying) {
          musicGain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.3);
        }
      }
    }
    
    // Game functions
    function rnd(min,max){return Math.random()*(max-min)+min}
    function rect(r,c){ctx.fillStyle=c;ctx.fillRect(r.x,r.y,r.w,r.h)}
    function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
    function spawnStar(){stars.push({x:rnd(12,348),y:-10,r:4+Math.random()*3,vy:1.2+Math.random()*1.5})}
    function spawnEnemy(){const w=20+Math.random()*26;enemies.push({x:rnd(0,360-w),y:-w,w,h:w,vy:1.2+Math.random()*2})}
    
    function reset(){
      score=0;
      lives=3;
      player.x=180;
      player.y=560;
      stars.length=0;
      enemies.length=0;
      t=0;
    }
    
    function start(){
      reset();
      running=true;
      overlay.style.display='none'; 
      if('ontouchstart' in window) controls.hidden=false;
      
      // Initialize audio when game starts
      if (!audioContext) {
        initAudio();
      }
    }
    
    function end(){
      running=false;
      overlay.querySelector('.box').innerHTML='<h2 style="margin:0 0 8px">Game Over</h2><div style="opacity:.85">Score: '+score+'</div><div style="margin-top:12px; opacity:.7; font-size:12px">Press Space / Tap to restart</div>';
      overlay.style.display='flex';
    }
    
    addEventListener('keydown',e=>{
      keys[e.key]=true;
      if(!running&&(e.key===' '||e.key==='Enter'))start();
    });
    
    addEventListener('keyup',e=>{keys[e.key]=false});
    controls.addEventListener('touchstart',e=>{const b=e.target.closest('button');if(b){player.dx=parseInt(b.dataset.dx)}});
    controls.addEventListener('touchend',()=>{player.dx=0});
    overlay.addEventListener('click', () => { if(!running) start(); });
    
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
        if(Math.hypot(s.x-(player.x+player.w/2),s.y-(player.y+player.h/2))<s.r+14){
          score+=10;
          scoreEl.textContent=score;
          stars.splice(i,1);
          // Play collect sound
          if (soundEffects.collect) soundEffects.collect();
        }
        else if(s.y>660)stars.splice(i,1)}
      // enemies
      for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.y+=e.vy;rect(e,'#fb7185');
        if(!(e.x>player.x+player.w||e.x+e.w<player.x||e.y>player.y+player.h||e.y+e.h<player.y)){
          lives--;
          livesEl.textContent=lives;
          enemies.splice(i,1);
          // Play hit sound
          if (soundEffects.hit) soundEffects.hit();
          if(lives<=0)end();
        }
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
  const [gameEngine, setGameEngine] = useState<string>("vanilla");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();
  const [initializedFromRemix, setInitializedFromRemix] = useState(false);
  
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isImagining, setIsImagining] = useState(false);
  
  // Support dialog state
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportAmount, setSupportAmount] = useState("");
  const [supportCurrency, setSupportCurrency] = useState<"INR" | "USD">("INR");
  const [exchangeRate, setExchangeRate] = useState<number>(83);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // UPI details
  const UPI_ID = "6260976807@axl";
  const UPI_NAME = "ANIL";
  
  // HARDCODED to 2 for now - will increment daily starting tomorrow
  const [supporterCount, setSupporterCount] = useState(2);
  const GOAL = 1000;
  
  // Feedback popup state
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const FEEDBACK_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd1PCiR8rk3j2me_fjNHfbr_KyyYlYUxHFUT73Lwc6xiSFHag/viewform?usp=publish-editor";

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
      const gameData = data as any;
      setGeneratedCode(gameData.game_code || '');
      setThumbnailUrl(gameData.thumbnail_url || '');
      setCoverUrl(gameData.cover_url || gameData.thumbnail_url || '');
      setTitle(prefillTitle || `Remix: ${gameData.title}`);
      if (prefillPrompt) setPrompt(prefillPrompt);
      setInitializedFromRemix(true);
      toast.success('Loaded remix base. You can edit and publish.');
    })();
  }, [initializedFromRemix]);



  
  // Generate thumbnail using NEW Supabase Edge Function
  const generateThumbnail = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }

    setIsGeneratingThumbnail(true);
    playClick();
    setThumbnailPreview("");

    try {
      toast.info("Generating thumbnail...");

      console.log("Calling generate-thumbnail with:", { description: prompt });

      // Get auth session for the request
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use direct fetch with proper headers
      const response = await fetch(
        'https://zyozjzfkmmtuxvjgryhk.supabase.co/functions/v1/generate-thumbnail',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          },
          body: JSON.stringify({
            description: prompt
          })
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Edge Function Error:", errorText);
        console.error("❌ Status Code:", response.status);
        
        // Parse error details
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error || errorText;
        } catch (e) {
          // errorText is not JSON, use as-is
        }
        
        throw new Error(`Edge Function returned ${response.status}: ${errorDetails}`);
      }

      const data = await response.json();
      console.log("✅ Response data:", data);

      // NEW function returns thumbnailUrl directly
      if (!data || !data.thumbnailUrl) {
        console.error("❌ Invalid response data:", data);
        throw new Error("No thumbnail URL in response");
      }

      console.log("✅ Thumbnail URL received:", data.thumbnailUrl);

      setThumbnailUrl(data.thumbnailUrl);
      setCoverUrl(data.thumbnailUrl);
      setThumbnailPreview(data.thumbnailUrl);

      toast.success("Thumbnail generated successfully!");
      playSuccess();
    } catch (error: any) {
      console.error("❌ Thumbnail generation error:", error);
      console.error("❌ Full error object:", JSON.stringify(error, null, 2));
      
      // Provide specific error messages based on the actual error
      let errorMessage = "Failed to generate thumbnail";
      let shouldUsePlaceholder = true;
      
      // Check for CORS/Network errors (function not deployed)
      if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
        errorMessage = "🚫 Edge Function not deployed or CORS error";
        toast.error(errorMessage);
        toast.error("Run: supabase functions deploy generate-thumbnail");
        toast.info("Or check if Supabase CLI is installed and you're logged in");
      } else if (error.message?.includes("RAPIDAPI_KEY") || error.message?.includes("environment variable not set")) {
        errorMessage = "⚠️ RapidAPI key not configured in Supabase Edge Function";
        toast.error(errorMessage);
        toast.info("Go to Supabase Dashboard → Edge Functions → Secrets → Add RAPIDAPI_KEY");
      } else if (error.message?.includes("401")) {
        errorMessage = "🔑 Authentication failed - ANON KEY issue";
        toast.error(errorMessage);
        toast.info("Check that VITE_SUPABASE_ANON_KEY is set in .env");
      } else if (error.message?.includes("403")) {
        errorMessage = "🚫 Permission denied - check storage bucket permissions";
        toast.error(errorMessage);
      } else if (error.message?.includes("thumbnails") || error.message?.includes("bucket")) {
        errorMessage = "📦 Thumbnails storage bucket not found or not public";
        toast.error(errorMessage);
        toast.info("Create 'thumbnails' bucket in Supabase Storage (make it public)");
      } else if (error.message?.includes("500")) {
        errorMessage = "🔥 Server error - check Edge Function logs in Supabase";
        toast.error(errorMessage);
      } else if (error.message?.includes("RapidAPI failed")) {
        errorMessage = "🎨 Image generation API failed - check RapidAPI quota";
        toast.error(errorMessage);
      } else {
        errorMessage = `❌ ${error.message || "Unknown error"}`;
        toast.error(errorMessage);
      }
      
      // Only use placeholder as last resort
      if (shouldUsePlaceholder) {
        const gameTitle = title || prompt.slice(0, 30) || 'Game';
        const placeholderUrl = `https://placehold.co/1080x1920/6D28D9/FFFFFF/png?text=${encodeURIComponent(gameTitle)}&font=roboto`;
        
        setThumbnailUrl(placeholderUrl);
        setCoverUrl(placeholderUrl);
        setThumbnailPreview(placeholderUrl);
        
        toast.warning("Using placeholder thumbnail - fix the error above to get AI-generated thumbnails");
      }
      
      playError();
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  // Imagine function: AI analyzes short prompt and generates detailed game description
  const handleImagine = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a game idea first");
      return;
    }

    setIsImagining(true);
    playClick();

    try {
      toast.info("AI is imagining your game...");

      // Call the same generate-game Edge Function but with a special flag to only generate description
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://zyozjzfkmmtuxvjgryhk.supabase.co/functions/v1/generate-game',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          },
          body: JSON.stringify({
            prompt: prompt,
            imagineOnly: true, // Special flag to only generate description
            options: {
              graphicsQuality,
              gameEngine,
              isMultiplayer,
              multiplayerType
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Imagine error:', response.status, errorText);
        
        // Log full error details
        console.error('Full error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      console.log('✅ Imagine response:', data);
      
      if (data.gameDescription) {
        setDescription(data.gameDescription);
        if (data.suggestedTitle) {
          setTitle(data.suggestedTitle);
        }
        toast.success("Game concept imagined! Review the description and click Generate Game.");
        playSuccess();
      } else {
        console.error('❌ No gameDescription in response:', data);
        throw new Error("No game description returned");
      }
    } catch (error: any) {
      console.error('❌ Imagine error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      toast.error(`Failed to imagine: ${error.message}`);
      toast.info("Check browser console (F12) for details");
      playError();
    } finally {
      setIsImagining(false);
    }
  };

  const handleGenerate = async () => {
    playClick();
    
    // Check if description is available (from Imagine button or manual entry)
    if (!description.trim() && !prompt.trim()) {
      toast.error("Please enter a game idea or description");
      return;
    }
    
    // If no description but has prompt, use prompt as description
    const gameDescription = description.trim() || prompt.trim();

    setIsGenerating(true);
    
    // Log activity: user is creating a game
    await logActivity({ type: 'game_creating' });
    
    try {
      // Use the detailed description from the Imagine step or manual entry
      let finalPrompt = gameDescription;
      
      // Generate game code (fallback to local template if AI gateway unavailable)
      let producedCode = "";
      try {
        console.log("🎮 Calling generate-game with prompt:", finalPrompt);
        const { data, error } = await supabase.functions.invoke('generate-game', {
          body: { 
            prompt: finalPrompt,
            options: {
              gameEngine,
              graphicsQuality,
              isMultiplayer,
              multiplayerType
            },
            title: title || prompt.slice(0, 50),
            description,
            autoInsert: false
          },
        });
        
        if (error) {
          console.error("❌ generate-game error:", error);
          throw error;
        }
        
        producedCode = data?.gameCode || "";
        
        if (!producedCode) {
          console.error("❌ No game code returned from generate-game");
          throw new Error("No game code returned");
        }
        
        console.log("✅ Game code generated, length:", producedCode.length);
      } catch (error: any) {
        console.error("❌ Game generation failed:", error);
        
        // Check for specific error types
        if (error.message?.includes("402") || error.context?.status === 402) {
          toast.error("💳 OpenRouter account needs credits");
          toast.info("Add credits at https://openrouter.ai/credits");
          toast.warning("Using fallback template for now");
        } else if (error.message?.includes("OPENROUTER_API_KEY")) {
          toast.error("⚠️ OPENROUTER_API_KEY not configured in Supabase");
          toast.info("Add OPENROUTER_API_KEY in Edge Function Secrets to generate unique games");
        } else if (error.message?.includes("401") || error.context?.status === 401) {
          toast.error("🔑 OpenRouter API key is invalid");
          toast.info("Check your API key at https://openrouter.ai/keys");
        } else if (error.message?.includes("429") || error.context?.status === 429) {
          toast.error("⏱️ Rate limit exceeded");
          toast.info("Wait a moment and try again");
        } else {
          toast.warning("AI game generation unavailable, using template");
          console.log("Error details:", error.context || error);
        }
        
        producedCode = buildFallbackGameCode(title || 'Arcade');
      }

      setGeneratedCode(producedCode);

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
      // @ts-ignore - Supabase type instantiation too deep
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
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id || null;
      if (!userId) {
        toast.error("Please sign in to publish games");
        return;
      }

      // Ensure profile exists and avoid username unique conflicts
      const baseUsername = `user_${userId.slice(0,8)}`;
      await ensureProfileExistsForUser(userId, baseUsername);

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
        creator_id: userId,
        is_multiplayer: isMultiplayer,
        multiplayer_type: isMultiplayer ? multiplayerType : null,
        is_public: isPublic,
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
          creator_id: userId,
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

  // Detect if desktop (screen width > 768px)
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);
  
  // Update supporter count at midnight - increment by 5 or 6
  useEffect(() => {
    const updateAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      const timer = setTimeout(() => {
        setSupporterCount(prev => Math.min(prev + 5, 1000)); // Add 5 each day, cap at 1000
        updateAtMidnight(); // Schedule next update
      }, msUntilMidnight);
      
      return () => clearTimeout(timer);
    };
    
    return updateAtMidnight();
  }, []);
  
  // Exit intent detection - show feedback popup when user tries to leave
  useEffect(() => {
    let hasShownPopup = false;
    
    const handleMouseLeave = (e: MouseEvent) => {
      // Detect when mouse leaves from top of page (trying to close tab/window)
      if (e.clientY <= 0 && !hasShownPopup) {
        hasShownPopup = true;
        setShowFeedbackPopup(true);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Fetch live exchange rate when support dialog opens
  useEffect(() => {
    if (!supportDialogOpen) return;
    
    const fetchExchangeRate = async () => {
      setIsLoadingRate(true);
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        if (data && data.rates && data.rates.INR) {
          setExchangeRate(data.rates.INR);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate, using fallback:', error);
      } finally {
        setIsLoadingRate(false);
      }
    };
    
    fetchExchangeRate();
  }, [supportDialogOpen]);

  const handleSupport = async () => {
    const amount = parseFloat(supportAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // Convert to INR if USD selected
    const amountInINR = supportCurrency === "USD" ? Math.round(amount * exchangeRate) : amount;
    
    // Build UPI link
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&mc=0000&mode=02&purpose=00&tn=${encodeURIComponent("Support Oplus Development")}&am=${amountInINR}&cu=INR`;
    
    // Desktop: Show QR Code
    if (isDesktop) {
      try {
        const qrDataUrl = await QRCode.toDataURL(upiLink, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
        setShowQrCode(true);
        playSuccess();
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        toast.error("Failed to generate QR code");
      }
    } else {
      // Mobile: Open UPI app directly
      window.location.href = upiLink;
      setSupportDialogOpen(false);
      setSupportAmount("");
      toast.success("Thank you for supporting Oplus! 💜");
      playSuccess();
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      
      {/* Under Development Overlay - Theme Adaptive */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/40 backdrop-blur-md">
        <div className="text-center px-6 py-8 max-w-md mx-auto">
          {/* Construction Icon with Animation */}
          <div className="mb-6 relative">
            <Construction className="h-20 w-20 md:h-24 md:w-24 mx-auto text-yellow-500 dark:text-yellow-400 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 md:h-28 md:w-28 border-4 border-yellow-500/30 dark:border-yellow-400/30 rounded-full animate-ping" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Under Development
          </h2>
          
          {/* Description */}
          <p className="text-sm md:text-base text-gray-700 dark:text-white/80 mb-6 leading-relaxed">
            We're working hard to bring you an amazing game creation experience. 
            This feature will be available soon!
          </p>
          
          {/* Supporter Counter */}
          <div className="mb-6 bg-gray-100/80 dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-gray-300 dark:border-white/20 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-red-500 fill-current animate-pulse" />
              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {supporterCount}
              </span>
              <span className="text-sm md:text-base text-gray-700 dark:text-white/80">supporters</span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="relative h-3 bg-gray-300 dark:bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-green-500/50"
                  style={{ width: `${Math.min((supporterCount / GOAL) * 100, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </div>
              </div>
              
              {/* Milestones */}
              <div className="flex justify-between text-xs text-gray-600 dark:text-white/60 px-1">
                <span className={supporterCount >= 1 ? "text-gray-900 dark:text-white font-semibold" : ""}>1</span>
                <span className={supporterCount >= 250 ? "text-gray-900 dark:text-white font-semibold" : ""}>250</span>
                <span className={supporterCount >= 500 ? "text-gray-900 dark:text-white font-semibold" : ""}>500</span>
                <span className={supporterCount >= 750 ? "text-gray-900 dark:text-white font-semibold" : ""}>750</span>
                <span className={supporterCount >= 1000 ? "text-gray-900 dark:text-white font-semibold" : ""}>1000</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-white/60 mt-3">
              {supporterCount >= GOAL 
                ? "🎉 Goal reached! Thank you!" 
                : `${GOAL - supporterCount} more to reach our goal`
              }
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Button
              onClick={() => setSupportDialogOpen(true)}
              className="gradient-primary glow-primary text-white font-semibold px-6 py-6 text-base md:text-lg hover:scale-105 transition-transform shadow-xl w-full sm:w-auto"
              size="lg"
            >
              <Heart className="h-5 w-5 mr-2 fill-current" />
              Support This Project
            </Button>
            
            <Button
              onClick={() => window.open(FEEDBACK_URL, '_blank')}
              variant="outline"
              className="border-2 border-gray-400 dark:border-white/30 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 font-semibold px-6 py-6 text-base md:text-lg hover:scale-105 transition-transform shadow-xl w-full sm:w-auto"
              size="lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Give Feedback
            </Button>
          </div>
          
          {/* Additional Info */}
          <p className="text-xs md:text-sm text-gray-600 dark:text-white/60 mt-4">
            Your support helps us build better features faster
          </p>
        </div>
      </div>
      
      {/* Blurred Background Content */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 pb-24 md:pb-8 pointer-events-none select-none opacity-50">
        <div className="max-w-7xl w-full mx-auto">
          <div className="text-center mb-4 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">Create with AI</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Describe your game idea and let AI bring it to life
            </p>
          </div>

          {/* Desktop: Horizontal layout, Mobile: Vertical layout */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Input Panel */}
            <Card className="gradient-card border-border/50 p-4 md:p-6 w-full md:flex-1">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm md:text-base">Game Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A space shooter where you dodge asteroids and collect stars'"
                    className="min-h-24 md:min-h-32 mt-2 text-sm md:text-base"
                    disabled={isGenerating}
                    ref={promptRef}
                  />
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2 md:gap-3">
                    {isPublic ? <Globe className="h-4 w-4 md:h-5 md:w-5 text-accent" /> : <Lock className="h-4 w-4 md:h-5 md:w-5 text-accent" />}
                    <div>
                      <p className="font-medium text-sm md:text-base">{isPublic ? 'Public' : 'Private'}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        {isPublic ? 'Visible to everyone' : 'Only visible to your followers'}
                      </p>
                    </div>
                  </div>
                  <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                {/* Game Engine Selection */}
                <div className="space-y-2">
                  <Label htmlFor="gameEngine" className="text-sm md:text-base">Game Engine</Label>
                  <Select value={gameEngine} onValueChange={setGameEngine}>
                    <SelectTrigger id="gameEngine" className="w-full">
                      <SelectValue placeholder="Select game engine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vanilla">Vanilla HTML5 Canvas</SelectItem>
                      <SelectItem value="phaser">Phaser.js - 2D Games</SelectItem>
                      <SelectItem value="threejs">Three.js - 3D Graphics</SelectItem>
                      <SelectItem value="babylonjs">Babylon.js - AAA 3D</SelectItem>
                      <SelectItem value="playcanvas">PlayCanvas - Professional</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    {gameEngine === "vanilla" && "Pure HTML5 Canvas - Fast and lightweight"}
                    {gameEngine === "phaser" && "Best for 2D: Shooting, Platformers, Racing, Battles"}
                    {gameEngine === "threejs" && "3D games inside browsers with WebGL"}
                    {gameEngine === "babylonjs" && "AAA-level graphics inside HTML5"}
                    {gameEngine === "playcanvas" && "Used by King, Zynga, Facebook Instant Games"}
                  </p>
                </div>

                {/* Multiplayer Toggle */}
                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                    <div>
                      <p className="font-medium text-sm md:text-base">Multiplayer</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Enable multiplayer features</p>
                    </div>
                  </div>
                  <Switch id="isMultiplayer" checked={isMultiplayer} onCheckedChange={setIsMultiplayer} />
                </div>

                {/* Thumbnail and cover URLs are auto-generated; inputs removed per requirements */}

                <div>
                  <Label htmlFor="title" className="text-sm md:text-base">Game Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Awesome Game"
                    className="mt-2 text-sm md:text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm md:text-base">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your game"
                    className="mt-2 text-sm md:text-base"
                  />
                </div>

                {/* Sound URL input removed */}

                {/* Two-step process: Imagine → Generate */}
                <div className="space-y-2">
                  <Button
                    onClick={handleImagine}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base"
                    disabled={isImagining || !prompt.trim()}
                  >
                    {isImagining ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                        Imagining...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        ✨ Imagine Game Concept
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleGenerate}
                    className="w-full gradient-primary glow-primary text-sm md:text-base"
                    disabled={isGenerating || (!description.trim() && !prompt.trim())}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        Generate Game
                      </>
                    )}
                  </Button>
                </div>
                
                <Button 
                  onClick={generateThumbnail} 
                  disabled={isGeneratingThumbnail || !prompt.trim()} 
                  variant="outline"
                  className="w-full mt-2 text-sm md:text-base"
                >
                  {isGeneratingThumbnail ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      Generating Thumbnail...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                      Generate Thumbnail
                    </>
                  )}
                </Button>

                {/* Thumbnail Preview */}
                {thumbnailPreview && (
                  <div className="mt-3 md:mt-4 p-3 md:p-4 border border-accent/30 rounded-lg bg-muted/50">
                    <Label className="mb-2 block text-sm md:text-base">Generated Thumbnail</Label>
                    <img 
                      src={thumbnailPreview} 
                      alt="Generated Thumbnail" 
                      className="w-full rounded-lg max-h-48 md:max-h-64 object-contain"
                    />
                  </div>
                )}

                {/* Display uploaded thumbnail URL if available */}
                {thumbnailUrl && !thumbnailPreview && (
                  <div className="mt-3 md:mt-4 p-3 md:p-4 border border-accent/30 rounded-lg bg-muted/50">
                    <Label className="mb-2 block text-sm md:text-base">Thumbnail</Label>
                    <img 
                      src={thumbnailUrl} 
                      alt="Thumbnail" 
                      className="w-full rounded-lg max-h-48 md:max-h-64 object-contain"
                    />
                  </div>
                )}

                {generatedCode && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setPreviewOpen(true)} variant="secondary" className="w-full gap-2 text-sm md:text-base">
                      <Eye className="h-3 w-3 md:h-4 md:w-4" /> Preview
                    </Button>
                    <Button
                      onClick={handlePublish}
                      className="w-full text-sm md:text-base"
                      variant="outline"
                    >
                      Publish to Feed
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Desktop: Preview panel on the right */}
            <div className="hidden md:flex md:flex-1 items-center justify-center">
              {generatedCode ? (
                <Card className="w-full max-w-md overflow-hidden">
                  <div className="aspect-[9/16] rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-border bg-background">
                    <iframe
                      srcDoc={generatedCode}
                      className="w-full h-full border-0"
                      title="Game Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Generate a game to see preview</p>
                </div>
              )}
            </div>
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

      {/* Support Dialog */}
      <Dialog open={supportDialogOpen} onOpenChange={(open) => {
        setSupportDialogOpen(open);
        if (!open) {
          setShowQrCode(false);
          setSupportAmount("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-current" />
              Support Oplus Development
            </DialogTitle>
          </DialogHeader>
          
          {!showQrCode ? (
            <>
              <div className="space-y-4 py-4">
                <div className="text-sm text-muted-foreground">
                  Your support helps us build amazing features and keep Oplus running. Thank you! 💜
                </div>
                
                {/* Currency Selection */}
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <RadioGroup value={supportCurrency} onValueChange={(v) => setSupportCurrency(v as "INR" | "USD")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="INR" id="inr" />
                      <Label htmlFor="inr" className="font-normal cursor-pointer">INR (₹)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USD" id="usd" />
                      <Label htmlFor="usd" className="font-normal cursor-pointer">
                        USD ($) {isLoadingRate ? '...' : `≈ ₹${exchangeRate.toFixed(2)}`}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="support-amount">
                    Amount ({supportCurrency === "INR" ? "₹" : "$"})
                  </Label>
                  <Input
                    id="support-amount"
                    type="number"
                    placeholder={supportCurrency === "INR" ? "100" : "5"}
                    value={supportAmount}
                    onChange={(e) => setSupportAmount(e.target.value)}
                    min="1"
                  />
                  {supportCurrency === "USD" && supportAmount && !isNaN(parseFloat(supportAmount)) && (
                    <p className="text-xs text-muted-foreground">
                      ≈ ₹{Math.round(parseFloat(supportAmount) * exchangeRate)} INR
                    </p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div className="space-y-2">
                  <Label>Quick Select</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {supportCurrency === "INR" ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setSupportAmount("50")}>₹50</Button>
                        <Button variant="outline" size="sm" onClick={() => setSupportAmount("100")}>₹100</Button>
                        <Button variant="outline" size="sm" onClick={() => setSupportAmount("500")}>₹500</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setSupportAmount("2")}>$2</Button>
                        <Button variant="outline" size="sm" onClick={() => setSupportAmount("5")}>$5</Button>
                        <Button variant="outline" size="sm" onClick={() => setSupportAmount("10")}>$10</Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    {isDesktop ? <QrCode className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    Payment via UPI
                  </p>
                  <p>
                    {isDesktop 
                      ? "Scan the QR code with your phone's UPI app to complete payment."
                      : "You'll be redirected to your UPI app (PhonePe, Google Pay, Paytm, etc.) to complete the payment securely."
                    }
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSupportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSupport}
                  disabled={!supportAmount || parseFloat(supportAmount) <= 0}
                  className="gradient-primary"
                >
                  {isDesktop ? (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Send via UPI
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* QR Code Display (Desktop Only) */}
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                    <img src={qrCodeUrl} alt="UPI Payment QR Code" className="w-64 h-64" />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-lg font-semibold">
                      {supportCurrency === "INR" ? "₹" : "$"}{supportAmount}
                      {supportCurrency === "USD" && ` (≈ ₹${Math.round(parseFloat(supportAmount) * exchangeRate)})`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code with any UPI app
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span>PhonePe</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span>Google Pay</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span>Paytm</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      ✓ After scanning, complete the payment in your UPI app
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQrCode(false)}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setSupportDialogOpen(false);
                    setShowQrCode(false);
                    setSupportAmount("");
                    toast.success("Thank you for supporting Oplus! 💜");
                  }}
                  className="gradient-primary"
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Exit Feedback Popup */}
      <Dialog open={showFeedbackPopup} onOpenChange={setShowFeedbackPopup}>
        <DialogContent className="sm:max-w-[500px]">
          <button
            onClick={() => setShowFeedbackPopup(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Have you enjoyed our product?
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <p className="text-base text-muted-foreground mb-6">
              We'd love to hear your thoughts! Your feedback helps us improve and build better features for you.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  window.open(FEEDBACK_URL, '_blank');
                  setShowFeedbackPopup(false);
                }}
                className="gradient-primary text-white font-semibold py-6 text-lg"
                size="lg"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Write Feedback
              </Button>
              
              <Button
                onClick={() => setShowFeedbackPopup(false)}
                variant="outline"
                size="lg"
                className="py-6"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}