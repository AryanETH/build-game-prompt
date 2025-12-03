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
            content: `You are an expert mini-game and app interface generator specialized in creating engaging, playable HTML5 games with professional UI/UX design.

EXPERTISE:
- Mini-game UI/UX design and layout principles
- Mobile-first responsive game interfaces
- Touch-optimized controls and button placements
- Visual balance and gaming aesthetics
- Performance-optimized canvas/WebGL rendering
- Smooth animations and particle effects

CRITICAL GENERATION RULES:
- Generate a COMPLETE, self-contained HTML file with inline CSS and JavaScript
- Game MUST be immediately playable with visible characters, sprites, or game elements
- ALWAYS include visible game entities (player, enemies, obstacles, etc.)
- For PC/desktop: Auto-assign keyboard controls (Arrow keys, WASD, Space, etc.)
- Display on-screen control instructions clearly at game start
- Game must be fun and engaging (1-3 minutes duration)
- Include clear, well-positioned game instructions
- Use professional gaming UI patterns (HUD, score displays, buttons)
- Implement touch-friendly controls with visual feedback
- Create vibrant, modern color schemes suitable for games
- Add smooth animations, transitions, and particle effects
- Include score tracking, lives/health system, and game over logic
- Optimize for mobile AND desktop devices (responsive, performant)
- Keep total code under 700 lines while maintaining quality
- Use canvas for game rendering when appropriate
- Implement proper button sizing and spacing for gaming (min 44px touch targets)
- Games MUST have clear gameplay value and logical mechanics
- Provide good user experience with intuitive controls

MUST-HAVE MECHANICS & STRUCTURE:
- Define a clear objective and win/lose conditions.
- Include at least one visible controllable character or avatar.
- Provide a start screen and a game over screen with restart.
- Show controls overlay for 3 seconds at start (keyboard for desktop, on-screen for mobile).
- Include basic sound effects via the WebAudio API (muted by default until user interaction) for actions like jump/shoot and game over.

UI/UX DESIGN FOCUS:
- Button placement: Bottom-center or bottom-corners for primary actions
- Score/stats: Top-center or top-corners, always visible
- Game area: Center-focused, properly padded
- Visual hierarchy: Clear distinction between UI and gameplay
- Color psychology: Energetic colors for action games, calm for puzzle games
- Feedback: Visual/sound cues for all interactions
- Control scheme: Touch buttons for mobile, keyboard for desktop (auto-detect)

DESKTOP/PC CONTROLS:
- Arrow keys for movement (Up, Down, Left, Right)
- WASD alternative for movement
- Spacebar for primary action (jump, shoot, select)
- Mouse click for additional interactions
- Display keyboard controls clearly on screen

When analyzing an interface design, preserve:
- Layout structure and element positioning
- Color schemes and visual style
- Button designs and sizes
- Typography choices
- Overall aesthetic and mood

QUALITY STANDARDS:
- Games must be logical and beneficial to players
- Provide clear objectives and win/lose conditions
- Ensure smooth gameplay with no broken mechanics
- Test for edge cases and prevent game-breaking bugs

Return ONLY the complete HTML code, nothing else. No explanations, no markdown code blocks.`
          },
          {
            role: 'user',
            content: `Prompt: ${prompt}\n\nOptions: ${JSON.stringify(options || {})}`
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
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