import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getEngineDescription(engine: string): string {
  switch (engine) {
    case 'phaser': return '(Phaser.js - Best for 2D: Shooting, Platformers, Racing, Battles)';
    case 'threejs': return '(Three.js - 3D games with WebGL)';
    case 'babylonjs': return '(Babylon.js - AAA-level 3D graphics)';
    case 'playcanvas': return '(PlayCanvas - Professional engine)';
    default: return '(Vanilla HTML5 Canvas - Fast and lightweight)';
  }
}

function getEngineInstructions(engine: string): string {
  switch (engine) {
    case 'phaser':
      return `Use Phaser 3 framework. Include CDN: <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>. Use Phaser.Game config with scenes, preload/create/update methods, Arcade Physics, sprite system, input handling, camera system, particle emitters.`;
    case 'threejs':
      return `Use Three.js. Include CDN: <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>. Create Scene, PerspectiveCamera, WebGLRenderer. Use meshes, lighting, raycasting, requestAnimationFrame loop.`;
    case 'babylonjs':
      return `Use Babylon.js. Include CDN: <script src="https://cdn.babylonjs.com/babylon.js"></script>. Create Engine, Scene, Camera. Use MeshBuilder, lighting, PhysicsImpostor, GUI overlay, shadows.`;
    case 'playcanvas':
      return `Use PlayCanvas. Include CDN: <script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script>. Create pc.Application, Entity-Component-System, pc.createScript for logic.`;
    default:
      return `Use pure HTML5 Canvas API for fast, lightweight rendering.`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, options, title, description, autoInsert = false, imagineOnly = false } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Imagine-only mode: generate a detailed game design description
    if (imagineOnly) {
      console.log('Imagining game concept from prompt:', prompt);

      const imagineResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a professional game designer who expands short game ideas into complete, detailed game design documents. Include: Genre & Core Concept, Player Mechanics & Controls (mobile touch + desktop keyboard/mouse), Environment & World Design, Enemies/Obstacles/Challenges, Level Structure, Art Style & Visual Direction, Audio & VFX, UI Screens, Extra Features (power-ups, scoring), and a 2-3 line Game Summary. Be specific and detailed. Make it ready for implementation.`
            },
            {
              role: 'user',
              content: `Short game idea: ${prompt}\n\nGame Engine: ${options?.gameEngine || 'vanilla'} ${getEngineDescription(options?.gameEngine || 'vanilla')}\nGraphics Style: ${options?.graphicsQuality || 'stylized 2D'}\nMultiplayer: ${options?.isMultiplayer ? 'Yes - ' + (options?.multiplayerType || 'co-op') : 'Single player'}\n\nExpand this into a complete, detailed game design description.`
            }
          ],
          temperature: 0.9,
          max_tokens: 4000
        }),
      });

      if (!imagineResponse.ok) {
        const errorText = await imagineResponse.text();
        console.error('AI gateway error:', imagineResponse.status, errorText);
        if (imagineResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (imagineResponse.status === 402) {
          return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits in your workspace settings.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        throw new Error('Failed to generate game description');
      }

      const imagineData = await imagineResponse.json();
      const gameDescription = imagineData.choices?.[0]?.message?.content;

      if (!gameDescription) throw new Error('No game description generated');

      return new Response(
        JSON.stringify({ gameDescription, suggestedTitle: prompt.split('.')[0].trim().slice(0, 50), success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Full game generation mode
    console.log('Generating game from prompt:', prompt);
    console.log('Game Engine:', options?.gameEngine || 'vanilla');

    const engineInstructions = getEngineInstructions(options?.gameEngine || 'vanilla');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an elite HTML5 game developer. Create polished, complete, self-contained HTML games.

ENGINE: ${engineInstructions}

REQUIREMENTS:
- Complete self-contained HTML file with inline CSS and JS
- Professional graphics with smooth 60 FPS animations
- Parallax scrolling backgrounds (3+ layers for 2D)
- Particle effects for actions and collisions
- Mobile touch + Desktop keyboard/mouse controls
- Multiple levels or endless procedural generation
- Score system with combos, power-ups, collectibles
- Enemy AI with varied behaviors
- Professional animated UI (start menu, pause, game over, HUD)
- Background music and sound effects via Web Audio API
- LocalStorage save/load
- Screen shake, visual juice effects
- Proper physics, gravity, collisions
- Game states: Menu, Playing, Paused, GameOver

OUTPUT: Return ONLY the complete HTML code. No markdown, no explanations.`
          },
          {
            role: 'user',
            content: `Create a polished game: ${prompt}\n\nEngine: ${options?.gameEngine || 'vanilla'} ${getEngineDescription(options?.gameEngine || 'vanilla')}\nGraphics: ${options?.graphicsQuality || 'stylized'}\nMultiplayer: ${options?.isMultiplayer ? 'Yes - ' + (options?.multiplayerType || 'co-op') : 'Single player'}\n\nMake it feel like a commercial indie game. Include all CDN links. Return ONLY HTML code.`
          }
        ],
        temperature: 0.8,
        max_tokens: 16000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits in your workspace settings.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error('Failed to generate game');
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    
    console.log('AI response received, length:', raw.length);

    // Sanitize: strip markdown fences and ensure HTML document
    let gameCode = raw.trim();
    gameCode = gameCode.replace(/^```[a-zA-Z]*\n?|```$/gms, '');
    if (!/(<html[\s>])/i.test(gameCode)) {
      gameCode = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>\n<body>\n${gameCode}\n</body>\n</html>`;
    }

    if (!gameCode) throw new Error('Model returned empty game code');

    // Optionally insert game record
    let insertedGame: any = null;
    if (autoInsert && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      if (token) {
        // Try to get user from Supabase auth
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const payload = {
            title: (title ?? prompt ?? 'Untitled').toString().slice(0, 100),
            description: (description ?? 'An AI-generated game').toString().slice(0, 500),
            game_code: gameCode,
            creator_id: user.id,
          };

          const insertRes = await supabase.from('games').insert(payload).select('*').single();
          if (insertRes.error) {
            console.error('DB insert failed:', insertRes.error.message);
          } else {
            insertedGame = insertRes.data;
          }
        }
      }
    }

    console.log('Game generated successfully');

    return new Response(
      JSON.stringify({ gameCode, game: insertedGame, gameId: insertedGame?.id ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-game function:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to generate game. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
