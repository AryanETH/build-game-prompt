import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get engine description for prompts
function getEngineDescription(engine: string): string {
  switch (engine) {
    case 'phaser':
      return '(Phaser.js - Best for 2D: Shooting, Platformers, Racing, Battles)';
    case 'threejs':
      return '(Three.js - 3D games with WebGL)';
    case 'babylonjs':
      return '(Babylon.js - AAA-level 3D graphics)';
    case 'playcanvas':
      return '(PlayCanvas - Professional engine used by King, Zynga, Facebook)';
    default:
      return '(Vanilla HTML5 Canvas - Fast and lightweight)';
  }
}

// Engine-specific instructions for game generation
function getEngineInstructions(engine: string): string {
  switch (engine) {
    case 'phaser':
      return `🎮 PHASER.JS GAME ENGINE

You are creating a game using Phaser 3 framework. Phaser is perfect for 2D games like:
- Shooting games (top-down, side-scrolling)
- Platformers (Mario-style, Metroidvania)
- Racing games (arcade racing, endless runners)
- Battle games (fighting, arena combat)

PHASER 3 SETUP:
- Include Phaser 3 CDN: <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
- Use Phaser.Game configuration with scenes
- Implement preload(), create(), and update() methods
- Use Phaser's built-in physics (Arcade Physics)
- Leverage Phaser's sprite system and animations
- Use Phaser's input handling for keyboard and touch
- Implement Phaser's camera system for smooth following
- Use Phaser's particle emitters for effects
- Leverage Phaser's audio system

PHASER BEST PRACTICES:
- Create separate Scene classes for Menu, Game, and GameOver
- Use Phaser.Physics.Arcade for collision detection
- Implement sprite groups for enemies and collectibles
- Use tweens for smooth animations
- Implement proper asset loading in preload()
- Use Phaser's built-in camera shake and flash effects
- Leverage Phaser's tilemap system for levels
- Use Phaser's input pointer for touch controls

EXAMPLE STRUCTURE:
\`\`\`javascript
const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  physics: { default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } },
  scene: [MenuScene, GameScene, GameOverScene]
};
const game = new Phaser.Game(config);
\`\`\``;

    case 'threejs':
      return `🌐 THREE.JS 3D GAME ENGINE

You are creating a 3D game using Three.js. Three.js is perfect for:
- 3D browser games with WebGL
- First-person shooters
- 3D racing games
- Space simulators
- 3D puzzle games

THREE.JS SETUP:
- Include Three.js CDN: <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
- Create Scene, Camera, and Renderer
- Use THREE.WebGLRenderer for rendering
- Implement PerspectiveCamera for 3D view
- Use THREE.Mesh with geometries and materials
- Implement lighting (AmbientLight, DirectionalLight, PointLight)
- Use THREE.Clock for delta time
- Implement raycasting for object interaction
- Use THREE.Group for organizing objects

THREE.JS BEST PRACTICES:
- Use requestAnimationFrame for render loop
- Implement proper camera controls (OrbitControls or custom)
- Use THREE.BoxGeometry, SphereGeometry, etc. for shapes
- Implement MeshStandardMaterial or MeshPhongMaterial for realistic lighting
- Use THREE.TextureLoader for textures
- Implement fog for depth perception
- Use THREE.Vector3 for 3D math
- Optimize with frustum culling and LOD
- Implement shadows with renderer.shadowMap

EXAMPLE STRUCTURE:
\`\`\`javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  // Update game logic
  renderer.render(scene, camera);
}
animate();
\`\`\``;

    case 'babylonjs':
      return `🎯 BABYLON.JS AAA-LEVEL 3D ENGINE

You are creating a high-quality 3D game using Babylon.js. Babylon.js is perfect for:
- AAA-level graphics in HTML5
- Advanced 3D games with realistic physics
- VR/AR experiences
- Complex 3D simulations
- Professional game development

BABYLON.JS SETUP:
- Include Babylon.js CDN: <script src="https://cdn.babylonjs.com/babylon.js"></script>
- Create Engine, Scene, and Camera
- Use BABYLON.Engine for rendering
- Implement ArcRotateCamera or FreeCamera
- Use BABYLON.MeshBuilder for creating meshes
- Implement advanced lighting (HemisphericLight, DirectionalLight, SpotLight)
- Use BABYLON.PhysicsImpostor for realistic physics
- Implement particle systems with BABYLON.ParticleSystem
- Use BABYLON.ActionManager for interactions

BABYLON.JS BEST PRACTICES:
- Use scene.registerBeforeRender() for game loop
- Implement PBR materials for realistic rendering
- Use BABYLON.GUI for 2D UI overlay
- Implement shadows with ShadowGenerator
- Use BABYLON.Animation for smooth animations
- Leverage built-in collision detection
- Implement post-processing effects
- Use BABYLON.SceneLoader for loading 3D models
- Optimize with scene.freezeActiveMeshes()

EXAMPLE STRUCTURE:
\`\`\`javascript
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);

const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

engine.runRenderLoop(() => {
  scene.render();
});
\`\`\``;

    case 'playcanvas':
      return `🏆 PLAYCANVAS PROFESSIONAL ENGINE

You are creating a professional game using PlayCanvas. PlayCanvas is used by:
- King (Candy Crush developers)
- Zynga (FarmVille, Words With Friends)
- Facebook Instant Games
- Professional game studios

PLAYCANVAS SETUP:
- Include PlayCanvas Engine: <script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script>
- Create pc.Application
- Use pc.Entity for game objects
- Implement pc.CameraComponent for rendering
- Use pc.RigidBodyComponent for physics
- Implement pc.ScriptComponent for game logic
- Use pc.LightComponent for lighting
- Leverage pc.SoundComponent for audio

PLAYCANVAS BEST PRACTICES:
- Use Entity-Component-System architecture
- Implement custom scripts with pc.createScript()
- Use pc.Vec3 for 3D math
- Implement input handling with app.keyboard and app.mouse
- Use pc.Asset for resource management
- Leverage built-in physics engine
- Implement particle effects with pc.ParticleSystemComponent
- Use pc.GraphNode hierarchy for scene organization
- Optimize with frustum culling and batching

EXAMPLE STRUCTURE:
\`\`\`javascript
const canvas = document.getElementById('application');
const app = new pc.Application(canvas, {
  mouse: new pc.Mouse(canvas),
  keyboard: new pc.Keyboard(window)
});

app.start();
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

// Create camera
const camera = new pc.Entity('camera');
camera.addComponent('camera', { clearColor: new pc.Color(0.1, 0.1, 0.1) });
app.root.addChild(camera);

// Game loop
app.on('update', (dt) => {
  // Update game logic
});
\`\`\``;

    default: // vanilla
      return `🎮 VANILLA HTML5 CANVAS GAME ENGINE

You are creating a game using pure HTML5 Canvas API. This is perfect for:
- Fast, lightweight games
- Learning game development fundamentals
- Games that need maximum compatibility
- Prototypes and simple games`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, options, title, description, autoInsert = false, imagineOnly = false } = await req.json();
    
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

    // If imagineOnly mode, generate game description instead of game code
    if (imagineOnly) {
      console.log('Imagining game concept from prompt:', prompt);
      console.log('Using Groq Llama 3.3 70B for game design');
      
      const imagineResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              content: `You are a professional game designer who expands short game ideas into complete, detailed game design documents.

Your task: Take a short game idea and expand it into a comprehensive game description.

Include:
1. Game Genre & Core Concept
2. Player Mechanics & Controls (mobile touch + desktop keyboard/mouse)
3. Environment & World Design (setting, theme, atmosphere)
4. Enemies, Obstacles & Challenges (behaviors, difficulty)
5. Level Structure (single/multiple/endless, progression, win/lose)
6. Art Style & Visual Direction (pixel/cartoon/stylized, colors, animations)
7. Audio & VFX (music style, sound effects, particles)
8. UI Screens (start, pause, game over, HUD)
9. Extra Features (power-ups, scoring, upgrades)
10. Game Summary (2-3 lines)

Be specific and detailed. Make it ready for implementation. Focus on creating a polished, complete game experience.

OUTPUT: Write a well-structured, detailed game description in clear paragraphs.`
            },
            {
              role: 'user',
              content: `Short game idea: ${prompt}

Game Engine: ${options?.gameEngine || 'vanilla'} ${getEngineDescription(options?.gameEngine || 'vanilla')}
Graphics Style: ${options?.graphicsQuality || 'stylized 2D'}
Multiplayer: ${options?.isMultiplayer ? 'Yes - ' + (options?.multiplayerType || 'co-op') : 'Single player'}

Expand this into a complete, detailed game design description. Consider the capabilities of the ${options?.gameEngine || 'vanilla'} engine when designing the game mechanics and features.`
            }
          ],
          temperature: 0.9,
          max_tokens: 4000
        }),
      });

      if (!imagineResponse.ok) {
        const errorText = await imagineResponse.text();
        console.error('Groq API error:', errorText);
        throw new Error('Failed to generate game description');
      }

      const imagineData = await imagineResponse.json();
      const gameDescription = imagineData.choices?.[0]?.message?.content;

      if (!gameDescription) {
        throw new Error('No game description generated');
      }

      const suggestedTitle = prompt.split('.')[0].trim().slice(0, 50);

      console.log('Game description generated successfully');

      return new Response(
        JSON.stringify({ 
          gameDescription,
          suggestedTitle,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating game from prompt:', prompt);
    console.log('Using Groq Llama 3.3 70B');
    console.log('Game Engine:', options?.gameEngine || 'vanilla');

    // Determine engine-specific instructions
    const engineInstructions = getEngineInstructions(options?.gameEngine || 'vanilla');

    // API call with Groq
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
            content: `You are an elite HTML5 game developer specializing in creating polished, modern games with professional graphics and smooth gameplay. You create games that look and feel like commercial indie games, not basic prototypes.

${engineInstructions}

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

The game should feel like a polished indie game, not a basic prototype. Focus on smooth animations, visual effects, and satisfying gameplay feedback.

Create a polished 2D game based on this concept:

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

Game Engine: ${options?.gameEngine || 'vanilla'} ${getEngineDescription(options?.gameEngine || 'vanilla')}
Graphics Style: ${options?.graphicsQuality || 'stylized 2D with smooth animations'}
Multiplayer: ${options?.isMultiplayer ? 'Yes - ' + (options?.multiplayerType || 'co-op') : 'Single player'}

Make this game feel polished and professional, like a commercial indie game. Focus on smooth animations, satisfying feedback, and engaging gameplay.

IMPORTANT: Use the ${options?.gameEngine || 'vanilla'} engine as specified. Include all necessary CDN links and follow the engine's best practices.`
          },
          {
            role: 'user',
            content: `Create a polished game based on this concept:

${prompt}

Game Requirements:
- Professional graphics with smooth animations (60 FPS)
- Parallax scrolling backgrounds (if 2D) or 3D depth (if 3D)
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

Game Engine: ${options?.gameEngine || 'vanilla'} ${getEngineDescription(options?.gameEngine || 'vanilla')}
Graphics Style: ${options?.graphicsQuality || 'stylized with smooth animations'}
Multiplayer: ${options?.isMultiplayer ? 'Yes - ' + (options?.multiplayerType || 'co-op') : 'Single player'}

Make this game feel polished and professional, like a commercial indie game. Focus on smooth animations, satisfying feedback, and engaging gameplay.

CRITICAL: Use the ${options?.gameEngine || 'vanilla'} engine. Include all necessary CDN links in the HTML. Follow the engine's architecture and best practices.`
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
    const raw = data.choices?.[0]?.message?.content ?? '';
    
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