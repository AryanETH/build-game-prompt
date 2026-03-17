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
// Takes the JSON plan and produces complete, runnable HTML
const CODEGEN_SYSTEM = `You are an elite HTML5 game developer. You receive a structured JSON game plan and produce a complete, polished, self-contained HTML5 game.

RULES:
1. Output ONLY the complete HTML file. No markdown fences, no explanation, no comments outside the code.
2. The file must be fully self-contained: all CSS inline in <style>, all JS inline in <script>.
3. Use the engine specified in the plan:
   - phaser3: include <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
   - vanilla: use pure HTML5 Canvas API only
4. Implement EVERY element from the game plan exactly as specified.
5. Mobile-first: touch controls must work perfectly on phones. Desktop keyboard/mouse also supported.
6. Performance: target 60 FPS. Use requestAnimationFrame. Avoid memory leaks.
7. Visual polish:
   - Smooth animations with easing
   - Particle effects for hits, deaths, pickups
   - Screen shake on impact
   - Parallax scrolling backgrounds (at least 3 layers)
   - Gradient fills, glow effects, shadows
8. Audio: generate all sound effects procedurally using Web Audio API (no external files needed).
9. Game states: implement Menu screen, Playing, Paused, Game Over — all with smooth transitions.
10. HUD: score, lives/health, level indicator — always visible during play.
11. LocalStorage: save high score and settings.
12. The game must be immediately playable — no broken states, no missing assets.
13. Canvas must scale to fill the viewport on any screen size using CSS.
14. DO NOT use emojis anywhere in the game UI. Use text labels and geometric shapes only.

QUALITY BAR: The output must feel like a polished indie game, not a prototype.`;

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
    const codeRaw = await callAI(CODEGEN_SYSTEM,
      `Here is the complete game plan in JSON:\n\n${JSON.stringify(gamePlan, null, 2)}\n\nGenerate the complete, polished, self-contained HTML5 game file now.`,
      16000, 0.75);

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
