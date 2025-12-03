import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, options, title, description, autoInsert = false } = await req.json();
    
    // Using Groq API (fast and reliable)
    // SECURITY: API key MUST be stored in Supabase Edge Function Secrets
    // Never hardcode API keys in source code
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured. Please set it in Supabase Edge Function Secrets.');
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment (URL or ANON KEY) is not configured');
    }

    console.log('Generating game from prompt:', prompt);
    console.log('Using Groq Llama 3.3 70B (FREE, ultra-fast)');

    // API call with Groq (FREE and FAST)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an elite HTML5 game developer specializing in creating polished, modern 2D games with professional graphics and smooth gameplay. You create games that look and feel like commercial indie games, not basic prototypes.

🎮 GAME QUALITY REQUIREMENTS:

1. GRAPHICS & VISUAL DESIGN:
   - High-quality 2D graphics (cartoon, stylized, or pixel art based on theme)
   - Smooth 60 FPS animations with proper easing
   - Real game environments with depth and atmosphere
   - Parallax scrolling backgrounds (3+ layers for depth)
   - Gradient skies, animated clouds, environmental effects
   - Proper shadows, glows, and particle systems
   - Professional color palettes (not primary colors)
   - Anti-aliased rendering for smooth edges

2. CORE GAME LOOP:
   - Clear player objectives and progression
   - Multiple levels or procedural generation
   - Collectibles, power-ups, and upgrades
   - Enemy AI with varied behaviors
   - Score multipliers and combo systems
   - Lives/health with visual feedback
   - Win/lose conditions with satisfying feedback
   - Difficulty curve that increases gradually

3. PLAYER CONTROLS (DUAL PLATFORM):
   Mobile:
   - Touch, drag, swipe, tap controls
   - Virtual joystick or directional buttons
   - Large, responsive touch targets (60px+)
   - Visual feedback on touch
   
   Desktop:
   - WASD + Arrow keys for movement
   - Spacebar for jump/action
   - Mouse for aiming/shooting
   - Smooth movement interpolation
   - Key press visual indicators

4. ENVIRONMENT & LEVEL DESIGN:
   - Fully designed levels with themes (forest, city, space, underwater, etc.)
   - Dynamic obstacles and interactive elements
   - Moving platforms, hazards, collectibles
   - Background animations (birds, clouds, stars)
   - Foreground elements for depth
   - Environmental storytelling through visuals
   - Minimum 5 distinct areas or endless procedural generation

5. ASSETS & ART STYLE:
   Character Design:
   - Animated sprites with multiple states (idle, run, jump, attack, hit, death)
   - Smooth frame-by-frame animation (8-12 frames per action)
   - Character personality through animation
   
   Environment:
   - Tiled backgrounds with seamless patterns
   - Decorative elements (grass, rocks, buildings)
   - Animated environmental objects
   
   Effects:
   - Particle systems (dust, sparks, explosions, trails)
   - Screen shake on impacts
   - Flash effects for hits
   - Smooth transitions between states

6. AUDIO SYSTEM:
   - Background music (looping, thematic)
   - SFX for: movement, jumps, collisions, pickups, attacks, UI clicks
   - Win/lose jingles
   - Volume controls
   - Mute toggle
   - Web Audio API implementation

7. UI & MENUS:
   - Animated start screen with game title
   - Level select with progress indicators
   - Pause menu with resume/restart/quit
   - Game over screen with score and retry
   - HUD with score, health, timer, collectibles
   - Smooth UI animations and transitions
   - Hover effects and button feedback

8. TECHNICAL IMPLEMENTATION:
   - HTML5 Canvas for rendering
   - RequestAnimationFrame for smooth 60 FPS
   - Delta time for frame-independent movement
   - Efficient collision detection (spatial partitioning)
   - Object pooling for particles and enemies
   - Optimized rendering (only draw visible objects)
   - Mobile-responsive (9:16 portrait or 16:9 landscape)
   - Touch and keyboard event handling

9. POLISH & FEATURES:
   - Smooth camera follow with lerp
   - Parallax scrolling (background moves slower than foreground)
   - Particle effects for all actions
   - Dynamic lighting and shadows
   - Juice: screen shake, slow-mo, freeze frames
   - Save/load progress (localStorage)
   - Achievement system
   - Power-ups and upgrades
   - Combo system with visual feedback

10. CODE STRUCTURE:
    - Game state management (menu, playing, paused, gameover)
    - Entity system (player, enemies, collectibles)
    - Physics engine (gravity, velocity, acceleration)
    - Collision detection and response
    - Animation system with sprite sheets
    - Particle system
    - Audio manager
    - Input handler (keyboard + touch)
    - Level loader
    - UI renderer

GAME GENERATION TEMPLATE:
When user provides a prompt, enhance it with:

"Create a polished 2D game: [USER PROMPT]

Requirements:
- Professional 2D graphics with smooth animations
- Parallax scrolling backgrounds (3+ layers)
- Particle effects for all actions
- Smooth 60 FPS gameplay
- Mobile touch + desktop keyboard controls
- Multiple levels or endless mode
- Score system with combos
- Power-ups and collectibles
- Enemy AI with varied behaviors
- Professional UI with animations
- Background music and sound effects
- Save/load progress
- Screen shake and visual juice
- Proper physics and collisions

Style: [Determine from prompt: pixel art, cartoon, stylized, realistic]
Theme: [Extract from prompt: space, fantasy, racing, platformer, etc.]
Mechanics: [Core gameplay from prompt]"

CRITICAL RULES:
- Generate COMPLETE, self-contained HTML file
- Use HTML5 Canvas for all rendering
- Implement proper game loop with delta time
- Include sprite animation system
- Add particle effects for visual polish
- Implement smooth camera movement
- Create parallax backgrounds
- Add sound effects and music
- Include multiple levels or procedural generation
- Optimize for 60 FPS performance
- Make it mobile AND desktop compatible
- Add visual juice (screen shake, particles, effects)
- Include proper game states (menu, playing, paused, gameover)
- Implement save/load system
- Add achievement or progression system

OUTPUT FORMAT:
Return ONLY the complete HTML code. No explanations, no markdown blocks, just pure HTML with inline CSS and JavaScript.

The game should feel like a polished indie game, not a basic prototype. Focus on smooth animations, visual effects, and satisfying gameplay feedback.`
          },
          {
            role: 'user',
            content: `Create a polished 2D game based on this concept:

${prompt}

Game Requirements:
- Professional 2D graphics with smooth animations (60 FPS)
- Parallax scrolling backgrounds (minimum 3 layers for depth)
- Particle effects for all player actions and collisions
- Mobile touch controls + Desktop keyboard/mouse controls
- Multiple levels OR endless procedurally generated gameplay
- Score system with combo multipliers
- Power-ups, collectibles, and upgrades
- Enemy AI with varied attack patterns
- Professional animated UI with smooth transitions
- Background music and comprehensive sound effects
- LocalStorage save/load system
- Screen shake, slow-motion, and visual juice effects
- Proper physics with gravity, velocity, and collisions
- Game states: Start Menu, Playing, Paused, Game Over
- Visual feedback for all interactions

Graphics Style: ${options?.graphicsQuality || 'stylized 2D with smooth animations'}
Multiplayer: ${options?.isMultiplayer ? 'Yes - ' + (options?.multiplayerType || 'co-op') : 'Single player'}

Make this game feel polished and professional, like a commercial indie game. Focus on smooth animations, satisfying feedback, and engaging gameplay.`
          }
        ],
        temperature: 0.8,
        max_tokens: 16000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate game');
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;
    const raw = assistantMessage?.content ?? '';
    
    console.log('Groq response received, tokens used:', data.usage?.total_tokens || 'unknown');

    // Basic sanitization: strip markdown fences and ensure HTML document
    const sanitizeGameHtml = (input: string): string => {
      let out = input.trim();
      // Remove markdown code fences if present
      out = out.replace(/^```[a-zA-Z]*\n?|```$/gms, '');
      // Heuristic: if missing <html> tag, wrap it
      if (!/(<html[\s>])/i.test(out)) {
        out = `<!DOCTYPE html>\n<html>\n<head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /></head>\n<body>\n${out}\n</body>\n</html>`;
      }
      return out;
    };

    const gameCode = sanitizeGameHtml(raw);

    if (!gameCode) {
      throw new Error('Model returned empty game code');
    }

    // Optionally insert a new game record on behalf of the authenticated user
    let insertedGame: any | null = null;
    if (autoInsert) {
      // Initialize Supabase client
      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      
      // Verify Clerk JWT from Authorization header
      const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      const PUBLIC_KEY = Deno.env.get('CLERK_PUBLIC_KEY') || `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAohIBo2Co+L66+FL7v0L3\n+otXywXxCjYHBamtG9mDKwYOZoLzV4DyfVRb/MmIWal4SpOVXaPekRG3x0JmFKht\n+3LueC7fXJjPWEvXxQeQNLPCfqypH4foOGkeymIJhPjUk+i1ZGp6uhFcKWnnfhyE\nl61S+8fmhjrL+Dr5aTSnT4VfgGzt/RPREr448IxbjWkX/1d65YrKnv1ZYGS2XFXP\n9OqIrRtMiw4i3a0Ye4H0jNN4GLw2RkL9FNec1uHwzgSVBb2fJOGeLGVyOyHiBa+m\ns9Kehww+eswiR/mCQ4RprePwfY2GPqJ4EssZeeMUbvxh2BePxhvq/5uNEOkq0vOk\ndQIDAQAB\n-----END PUBLIC KEY-----`;

      async function base64UrlToUint8Array(base64Url: string): Promise<Uint8Array> {
        const pad = base64Url.length % 4 === 2 ? "==" : base64Url.length % 4 === 3 ? "=" : "";
        const b64 = base64Url.replace(/-/g, "+").replace(/_/g, "/") + pad;
        const raw = atob(b64);
        const uint8 = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);
        return uint8;
      }

      function pemToArrayBuffer(pem: string): ArrayBuffer {
        const cleaned = pem.replace(/-----BEGIN PUBLIC KEY-----/g, "").replace(/-----END PUBLIC KEY-----/g, "").replace(/\s+/g, "");
        const binaryDer = atob(cleaned);
        const bytes = new Uint8Array(binaryDer.length);
        for (let i = 0; i < binaryDer.length; i++) {
          bytes[i] = binaryDer.charCodeAt(i);
        }
        return bytes.buffer;
      }

      async function importRsaPublicKey(spkiPem: string): Promise<CryptoKey> {
        const keyBuffer = pemToArrayBuffer(spkiPem);
        return await crypto.subtle.importKey(
          'spki',
          keyBuffer,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false,
          ['verify']
        );
      }

      async function verifyClerkJwt(t: string, publicKeyPem: string): Promise<Record<string, any> | null> {
        try {
          const parts = t.split('.')
          if (parts.length !== 3) return null;
          const [h, p, s] = parts;
          const data = new TextEncoder().encode(`${h}.${p}`);
          const signature = await base64UrlToUint8Array(s);
          const key = await importRsaPublicKey(publicKeyPem);
          const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, data);
          if (!ok) return null;
          const payloadJson = new TextDecoder().decode(await base64UrlToUint8Array(p));
          return JSON.parse(payloadJson);
        } catch {
          return null;
        }
      }

      const claims = token ? await verifyClerkJwt(token, PUBLIC_KEY) : null;
      const authedUserId = claims?.sub as (string | undefined);
      if (!authedUserId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const placeholder = `https://placehold.co/720x1280/png?text=${encodeURIComponent((title || 'Game').slice(0, 40)).replace(/%20/g, '+')}`;

      const fullPayload: Record<string, unknown> = {
        title: (title ?? prompt ?? 'Untitled').toString().slice(0, 100),
        description: (description ?? `An AI-generated game`).toString().slice(0, 500),
        game_code: gameCode,
        creator_id: authedUserId,
        is_multiplayer: !!options?.isMultiplayer,
        multiplayer_type: options?.isMultiplayer ? options?.multiplayerType ?? null : null,
        graphics_quality: options?.graphicsQuality ?? 'high',
        thumbnail_url: placeholder,
        cover_url: placeholder,
        is_public: options?.isPublic !== false,
      };

      let insertRes = await supabase.from('games').insert(fullPayload).select('*').single();
      if (insertRes.error) {
        // Fallback to minimal payload to survive older schemas
        const minimalPayload = {
          title: (title ?? prompt ?? 'Untitled').toString().slice(0, 100),
          description: (description ?? `An AI-generated game`).toString().slice(0, 500),
          game_code: gameCode,
          creator_id: authedUserId,
        };
        insertRes = await supabase.from('games').insert(minimalPayload).select('*').single();
      }

      if (insertRes.error) {
        // Do not fail the whole request; return code and an error message
        console.error('DB insert failed:', insertRes.error.message);
      } else {
        insertedGame = insertRes.data;
      }
    }

    console.log('Game generated successfully');

    return new Response(
      JSON.stringify({ gameCode, game: insertedGame, gameId: insertedGame?.id ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side only
    console.error('Error in generate-game function:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to generate game. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});