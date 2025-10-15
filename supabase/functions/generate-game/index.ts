import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, options } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating game from prompt:', prompt);

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
    const gameCode = data.choices[0].message.content;

    console.log('Game generated successfully');

    return new Response(
      JSON.stringify({ gameCode }),
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