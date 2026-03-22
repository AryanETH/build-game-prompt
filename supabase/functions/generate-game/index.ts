import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── STEP 1: PLANNER PROMPT ───────────────────────────────────────────────────
// Converts a vague user idea into a structured JSON game plan
const PLANNER_SYSTEM = `You are a senior game designer and technical architect.
Your job is to convert a user's game idea into a precise, structured JSON game plan.
The plan will be handed directly to a code generator — be specific, technical, and complete.

Return ONLY valid JSON. No markdown, no explanation, no extra text.

JSON schema:
{
  "title": "Short game title (max 50 chars)",
  "genre": "platformer | shooter | puzzle | runner | clicker | arcade | rpg | strategy | simulation | app",
  "engine": "phaser3 | vanilla",
  "description": "2-3 sentence summary of the game",
  "core_mechanic": "The single most important gameplay loop in one sentence",
  "player": {
    "controls": { "mobile": "describe touch controls", "desktop": "describe keyboard/mouse controls" },
    "abilities": ["list of player actions"],
    "physics": "describe movement feel: gravity, speed, jump height etc"
  },
  "world": {
    "camera": "fixed | follow | parallax-scroll",
    "background_layers": ["layer 1 desc", "layer 2 desc", "layer 3 desc"],
    "level_structure": "endless | fixed-levels | procedural",
    "environment": "describe the visual world"
  },
  "entities": [
    { "name": "entity name", "behavior": "what it does", "visual": "how it looks" }
  ],
  "ui": {
    "hud": ["list of HUD elements: score, lives, timer etc"],
    "screens": ["menu", "game-over", "pause"],
    "style": "describe UI visual style"
  },
  "progression": {
    "scoring": "how points are earned",
    "difficulty": "how difficulty scales over time",
    "win_condition": "how the player wins or what the goal is",
    "lose_condition": "how the player loses"
  },
  "visuals": {
    "art_style": "pixel | vector | minimalist | neon | cartoon | realistic",
    "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
    "effects": ["list of visual effects: particles, screen shake, trails etc"]
  },
  "audio": {
    "music": "describe background music style",
    "sfx": ["list of sound effects needed"]
  },
  "technical": {
    "canvas_size": "360x640 for mobile-first or 800x600 for desktop",
    "target_fps": 60,
    "storage": "localStorage keys to save: score, level, settings",
    "phaser_config": "only if engine is phaser3: describe scene structure"
  }
}`;

// ─── STEP 2: CODE GENERATOR PROMPT ───────────────────────────────────────────
const CODEGEN_SYSTEM = `You are an elite HTML5 game developer. Generate COMPLETE, FULLY WORKING games.

CRITICAL: The game MUST work immediately. No broken buttons. No placeholder code. EVERYTHING must function.

OUTPUT FORMAT:
- ONLY output the complete HTML file
- NO markdown fences (no \`\`\`html)
- NO explanations
- NO comments outside the code

MANDATORY GAME STRUCTURE (you MUST implement ALL of these):

1. GAME STATE SYSTEM:
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
let score = 0;
let lives = 3;

2. INITIALIZATION:
function initGame() {
  // Reset all game variables
  // Set up player, enemies, collectibles
  // Initialize audio context
  gameState = 'playing';
}

3. GAME LOOP (MANDATORY):
let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  
  if (gameState === 'playing') {
    update(deltaTime);
    checkCollisions();
    render();
  }
  
  requestAnimationFrame(gameLoop);
}

4. UPDATE FUNCTION:
function update(dt) {
  // Update player position based on input
  // Update enemies
  // Update collectibles
  // Update particles
}

5. COLLISION DETECTION (MANDATORY):
function checkCollisions() {
  // Check player vs enemies (reduce lives or game over)
  // Check player vs collectibles (increase score)
  // MUST actually affect game state
}

6. INPUT HANDLING (BOTH REQUIRED):
// Touch for mobile
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);

// Keyboard for desktop
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (gameState === 'menu' || gameState === 'gameover') {
    if (e.key === ' ' || e.key === 'Enter') initGame();
  }
});

7. RENDER FUNCTION:
function render() {
  // Clear canvas
  // Draw background layers (parallax)
  // Draw entities
  // Draw player
  // Draw particles
  // Draw HUD (score, lives)
}

8. GAME OVER HANDLING:
if (lives <= 0) {
  gameState = 'gameover';
  // Show game over screen with score
  // Allow restart on tap/spacebar
}

VISUAL REQUIREMENTS:
- Modern, clean, smooth animations
- Gradient backgrounds (at least 3 parallax layers)
- Particle effects on collisions
- Screen shake on damage
- Smooth easing on movements
- Glowing effects on collectibles
- Professional color palette
- NO emojis - use geometric shapes

TECHNICAL REQUIREMENTS:
- Canvas size: 360x640 (mobile-first)
- 60 FPS target
- Use requestAnimationFrame
- Procedural Web Audio API sounds (no external files)
- LocalStorage for high score
- Responsive: canvas scales to fit any screen
- Self-contained: all CSS in <style>, all JS in <script>

ENGINES:
- If plan says "phaser3": Use <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
- If plan says "vanilla": Use pure Canvas API

CRITICAL CHECKS BEFORE OUTPUTTING:
✓ Does the Start button actually start the game?
✓ Can the player move with touch AND keyboard?
✓ Do enemies spawn and move?
✓ Does collision detection work?
✓ Does score update in real-time?
✓ Can the game be restarted after game over?

If ANY of these are NO, FIX IT before outputting.

OUTPUT: Complete, working HTML5 game that runs perfectly on first load.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, options, title, description, autoInsert = false, imagineOnly = false } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const callAI = async (system: string, user: string, maxTokens: number, temp = 0.8) => {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          temperature: temp,
          max_tokens: maxTokens,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error('AI error:', res.status, txt);
        if (res.status === 429) throw Object.assign(new Error('Rate limit exceeded'), { status: 429 });
        if (res.status === 402) throw Object.assign(new Error('Usage limit reached'), { status: 402 });
        throw new Error(`AI request failed: ${res.status}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    };

    // ── IMAGINE-ONLY MODE (prompt improvement for chat) ──────────────────────
    if (imagineOnly) {
      console.log('Planning game concept:', prompt);
      const planJson = await callAI(PLANNER_SYSTEM,
        `User idea: "${prompt}"\nEngine preference: ${options?.gameEngine || 'vanilla'}\nMultiplayer: ${options?.isMultiplayer ? 'yes' : 'no'}\n\nGenerate the JSON game plan.`,
        2000, 0.9);

      let plan: any = {};
      try {
        const cleaned = planJson.replace(/^```[a-z]*\n?|```$/gim, '').trim();
        plan = JSON.parse(cleaned);
      } catch {
        plan = { title: prompt.slice(0, 50), description: planJson.slice(0, 500) };
      }

      const summary = [
        `Title: ${plan.title || prompt}`,
        `Genre: ${plan.genre || 'game'}`,
        plan.description || '',
        '',
        `Core mechanic: ${plan.core_mechanic || ''}`,
        plan.player?.controls?.mobile ? `Mobile controls: ${plan.player.controls.mobile}` : '',
        plan.progression?.win_condition ? `Goal: ${plan.progression.win_condition}` : '',
      ].filter(Boolean).join('\n');

      return new Response(
        JSON.stringify({ gameDescription: summary, gamePlan: plan, suggestedTitle: plan.title || prompt.slice(0, 50), success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── FULL GENERATION: 2-STEP PIPELINE ─────────────────────────────────────
    console.log('Step 1 — Planning:', prompt);

    // STEP 1: Planner → JSON game plan
    const planRaw = await callAI(PLANNER_SYSTEM,
      `User idea: "${prompt}"\nEngine preference: ${options?.gameEngine || 'vanilla'}\nGraphics style: ${options?.graphicsQuality || 'stylized'}\nMultiplayer: ${options?.isMultiplayer ? 'yes - ' + (options?.multiplayerType || 'co-op') : 'no'}\n\nGenerate the complete JSON game plan.`,
      3000, 0.85);

    let gamePlan: any = {};
    try {
      const cleaned = planRaw.replace(/^```[a-z]*\n?|```$/gim, '').trim();
      gamePlan = JSON.parse(cleaned);
    } catch (e) {
      console.warn('Plan parse failed, using raw:', e);
      gamePlan = { title: title || prompt.slice(0, 50), description: description || prompt };
    }

    console.log('Step 1 complete. Title:', gamePlan.title, '| Engine:', gamePlan.engine);

    // STEP 2: Code Generator → complete HTML game
    console.log('Step 2 — Generating code...');
    const codeGenPrompt = `GAME PLAN:
${JSON.stringify(gamePlan, null, 2)}

Generate a COMPLETE, WORKING HTML5 game. The Start button MUST work. The game MUST be playable immediately.

MANDATORY TEMPLATE STRUCTURE (adapt this to the game plan above):

<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Game Title</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: system-ui;
  color: white;
  overflow: hidden;
}
canvas { 
  display: block;
  max-width: 100vw;
  max-height: 100vh;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
#ui {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  pointer-events: auto;
}
.btn {
  padding: 16px 48px;
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50px;
  color: white;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(102,126,234,0.4);
  transition: transform 0.2s;
}
.btn:hover { transform: scale(1.05); }
.btn:active { transform: scale(0.95); }
#hud {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
  pointer-events: none;
}
</style>
</head>
<body>
<canvas id="game" width="360" height="640"></canvas>
<div id="ui">
  <div id="menu" class="screen">
    <h1 style="font-size: 48px; margin-bottom: 20px;">GAME TITLE</h1>
    <p style="opacity: 0.7; margin-bottom: 30px;">Tap or press Space to start</p>
    <button class="btn" onclick="startGame()">Start Game</button>
  </div>
  <div id="gameover" class="screen" style="display: none;">
    <h2 style="font-size: 36px; margin-bottom: 20px;">Game Over</h2>
    <p style="font-size: 24px; margin-bottom: 30px;">Score: <span id="finalScore">0</span></p>
    <button class="btn" onclick="startGame()">Play Again</button>
  </div>
  <div id="hud" style="display: none;">
    <div>Score: <span id="score">0</span></div>
    <div>Lives: <span id="lives">3</span></div>
  </div>
</div>

<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// GAME STATE
let gameState = 'menu';
let score = 0;
let lives = 3;
let player = { x: 180, y: 560, w: 30, h: 30, vx: 0, vy: 0, speed: 5 };
let enemies = [];
let collectibles = [];
let particles = [];
let keys = {};
let time = 0;

// AUDIO
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// INIT GAME
function startGame() {
  gameState = 'playing';
  score = 0;
  lives = 3;
  player.x = 180;
  player.y = 560;
  enemies = [];
  collectibles = [];
  particles = [];
  time = 0;
  
  document.getElementById('menu').style.display = 'none';
  document.getElementById('gameover').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  
  updateUI();
}

function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
}

// INPUT
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if ((gameState === 'menu' || gameState === 'gameover') && (e.key === ' ' || e.key === 'Enter')) {
    startGame();
  }
});
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
function handleTouch(e) {
  e.preventDefault();
  if (gameState === 'menu' || gameState === 'gameover') {
    startGame();
    return;
  }
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
  player.x = x - player.w / 2;
}

// UPDATE
function update(dt) {
  time++;
  
  // Player movement (keyboard)
  if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  
  // Spawn enemies
  if (time % 60 === 0) {
    enemies.push({ x: Math.random() * (canvas.width - 30), y: -30, w: 30, h: 30, vy: 2 + Math.random() });
  }
  
  // Spawn collectibles
  if (time % 80 === 0) {
    collectibles.push({ x: Math.random() * (canvas.width - 20), y: -20, r: 10, vy: 1.5 });
  }
  
  // Update enemies
  enemies.forEach(e => { e.y += e.vy; });
  enemies = enemies.filter(e => e.y < canvas.height + 50);
  
  // Update collectibles
  collectibles.forEach(c => { c.y += c.vy; });
  collectibles = collectibles.filter(c => c.y < canvas.height + 50);
  
  // Update particles
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
  particles = particles.filter(p => p.life > 0);
}

// COLLISION
function checkCollisions() {
  // Player vs collectibles
  collectibles = collectibles.filter(c => {
    const dist = Math.hypot(c.x - (player.x + player.w/2), c.y - (player.y + player.h/2));
    if (dist < c.r + 15) {
      score += 10;
      updateUI();
      playSound(800, 0.1);
      // Spawn particles
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: c.x, y: c.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 30,
          color: '#fde047'
        });
      }
      return false;
    }
    return true;
  });
  
  // Player vs enemies
  enemies = enemies.filter(e => {
    const hit = !(e.x > player.x + player.w || e.x + e.w < player.x || 
                  e.y > player.y + player.h || e.y + e.h < player.y);
    if (hit) {
      lives--;
      updateUI();
      playSound(200, 0.2);
      // Spawn particles
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: player.x + player.w/2, y: player.y + player.h/2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 40,
          color: '#fb7185'
        });
      }
      if (lives <= 0) {
        gameState = 'gameover';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameover').style.display = 'flex';
        playSound(150, 0.5);
      }
      return false;
    }
    return true;
  });
}

// RENDER
function render() {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#0f0f1e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Stars (parallax layer)
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 50; i++) {
    const x = (i * 73) % canvas.width;
    const y = ((i * 97 + time * 0.5) % canvas.height);
    ctx.fillRect(x, y, 2, 2);
  }
  
  // Collectibles
  collectibles.forEach(c => {
    ctx.fillStyle = '#fde047';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fde047';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  
  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = '#fb7185';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fb7185';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.shadowBlur = 0;
  });
  
  // Player
  ctx.fillStyle = '#5eead4';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#5eead4';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;
  
  // Particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 40;
    ctx.fillRect(p.x, p.y, 4, 4);
  });
  ctx.globalAlpha = 1;
}

// GAME LOOP
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  
  if (gameState === 'playing') {
    update(dt);
    checkCollisions();
    render();
  }
  
  requestAnimationFrame(gameLoop);
}

// START
requestAnimationFrame(gameLoop);
</script>
</body>
</html>

NOW: Adapt this WORKING template to match the game plan above. Keep ALL the working parts (game loop, collision, input, state management). Change ONLY the visuals, entities, and mechanics to match the plan. The Start button MUST work. The game MUST be playable.`;

    const codeRaw = await callAI(CODEGEN_SYSTEM, codeGenPrompt, 16000, 0.7);

    // Sanitize output
    let gameCode = codeRaw.trim().replace(/^```[a-zA-Z]*\n?|```$/gms, '').trim();
    if (!/(<html[\s>])/i.test(gameCode)) {
      gameCode = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>\n<body>\n${gameCode}\n</body>\n</html>`;
    }

    if (!gameCode) throw new Error('Code generator returned empty output');

    console.log('Step 2 complete. Code length:', gameCode.length);

    // Optional DB insert
    let insertedGame: any = null;
    if (autoInsert && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data, error } = await supabase.from('games').insert({
            title: (gamePlan.title || title || prompt).toString().slice(0, 100),
            description: (gamePlan.description || description || prompt).toString().slice(0, 500),
            game_code: gameCode,
            creator_id: user.id,
          }).select('*').single();
          if (error) console.error('DB insert failed:', error.message);
          else insertedGame = data;
        }
      }
    }

    return new Response(
      JSON.stringify({ gameCode, gamePlan, game: insertedGame, gameId: insertedGame?.id ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('generate-game error:', error?.message || error);
    const status = error?.status || 500;
    return new Response(
      JSON.stringify({ error: error?.message || 'Unable to generate game. Please try again.' }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
